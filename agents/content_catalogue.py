"""
content_catalogue.py — single source of truth for what is already published.

Both KeywordAgent and GuardrailAgent read from this shared instance so that:
  - Disk is scanned exactly once per run, not once per agent per keyword.
  - Articles published mid-run (e.g. article 2 in a 2-article run) are
    immediately visible to every subsequent check via register_new().
  - Rich metadata (title + description + slug + category + tags) is available
    for semantic dedup — not just titles.

Usage in orchestrator:
    catalogue = ContentCatalogue()
    keyword_agent   = KeywordAgent(groq_key, catalogue)
    guardrail_agent = GuardrailAgent(groq_key, catalogue)
    ...
    # after publishing an article:
    catalogue.register_new(article)
"""

import re
import logging
from pathlib import Path

log = logging.getLogger(__name__)

CONTENT_DIR = Path(__file__).parent.parent / "website" / "content" / "posts"


def _parse_frontmatter_field(text: str, field: str) -> str:
    """Extract a single quoted or unquoted frontmatter field value."""
    # Matches:  field: "value"  or  field: value
    m = re.search(rf'^{field}:\s*"?([^"\n]+)"?', text, re.MULTILINE)
    return m.group(1).strip() if m else ""


def _parse_tags(text: str) -> list[str]:
    """Extract tags array from frontmatter, e.g. tags: ["a", "b"]."""
    m = re.search(r'^tags:\s*\[([^\]]*)\]', text, re.MULTILINE)
    if not m:
        return []
    raw = m.group(1)
    return [t.strip().strip('"').strip("'") for t in raw.split(",") if t.strip()]


class ContentCatalogue:
    """
    Reads every MDX post on the site once and keeps the catalogue in memory.
    New articles published during a run can be appended via register_new().
    """

    def __init__(self):
        self._entries: list[dict] = []   # {title, description, slug, category, tags}
        self._slugs:   set[str]  = set()
        self._load()

    # ── Initialisation ─────────────────────────────────────────────────────────

    def _load(self):
        if not CONTENT_DIR.exists():
            log.warning("[Catalogue] Content directory not found — starting with empty catalogue")
            return

        loaded = 0
        for mdx in CONTENT_DIR.glob("*.mdx"):
            try:
                text = mdx.read_text(encoding="utf-8", errors="ignore")
                entry = {
                    "title":       _parse_frontmatter_field(text, "title"),
                    "description": _parse_frontmatter_field(text, "description"),
                    "slug":        _parse_frontmatter_field(text, "slug") or mdx.stem,
                    "category":    _parse_frontmatter_field(text, "category"),
                    "tags":        _parse_tags(text),
                }
                if entry["title"]:
                    self._entries.append(entry)
                    self._slugs.add(entry["slug"])
                    loaded += 1
            except Exception as exc:
                log.debug(f"[Catalogue] Could not parse {mdx.name}: {exc}")

        log.info(
            f"[Catalogue] Loaded {loaded} articles across "
            f"{len(self.coverage_by_category())} categories from disk"
        )

    # ── Public API ─────────────────────────────────────────────────────────────

    def all_entries(self) -> list[dict]:
        """Return all catalogue entries (disk + any registered mid-run)."""
        return list(self._entries)

    def all_slugs(self) -> set[str]:
        """Return all known slugs (fast O(1) membership test)."""
        return set(self._slugs)

    def coverage_by_category(self) -> dict[str, int]:
        """
        Return article counts per category, e.g. {'writing': 8, 'coding': 3}.
        Used by KeywordAgent to bias seed selection toward under-covered topics.
        """
        counts: dict[str, int] = {}
        for e in self._entries:
            cat = e.get("category", "unknown") or "unknown"
            counts[cat] = counts.get(cat, 0) + 1
        return counts

    def register_new(self, article: dict):
        """
        Add a just-published article to the in-memory catalogue.
        Call this immediately after publishing so the next keyword in the same
        run can see it during dedup checks.

        Accepts the article dict produced by ContentAgent / SEOAgent, which
        contains at minimum: title, slug, category, description.
        """
        entry = {
            "title":       article.get("title", ""),
            "description": article.get("description", ""),
            "slug":        article.get("slug", ""),
            "category":    article.get("category", ""),
            "tags":        article.get("tags", []),
        }
        if not entry["title"]:
            log.warning("[Catalogue] register_new called with no title — skipping")
            return

        self._entries.append(entry)
        if entry["slug"]:
            self._slugs.add(entry["slug"])

        log.info(
            f"[Catalogue] Registered new article mid-run: \"{entry['title']}\" "
            f"(catalogue now has {len(self._entries)} entries)"
        )

    def summary_for_prompt(self) -> str:
        """
        Compact JSON-like string of existing articles suitable for LLM prompts.
        Includes title, description (truncated), slug, and category so the LLM
        has enough context to detect near-duplicates that share different titles.
        """
        lines = []
        for e in self._entries:
            desc = (e.get("description") or "")[:120]
            lines.append(
                f'- title: "{e["title"]}" | category: {e.get("category","?")} '
                f'| slug: {e.get("slug","?")} | desc: {desc}'
            )
        return "\n".join(lines) if lines else "(no articles yet)"
