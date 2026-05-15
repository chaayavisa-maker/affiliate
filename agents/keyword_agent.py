"""
Keyword agent: finds profitable, low-competition topics in the AI tools niche.
Uses a seed keyword list + Groq LLaMA to generate long-tail variations.

Duplicate prevention — three layers (in order of cost):
  1. Exact match:    published_keywords.json            (free, instant)
  2. Coverage index: MDX frontmatter — title, slug,
                     description, category, tags        (local file read)
  3. Semantic match: LLM compares candidate against the
                     rich content index to catch near-
                     duplicates that slip past layers 1/2 (one LLM call per candidate)

Coverage-gap awareness:
  - Reads the category distribution of every published article.
  - Seeds are re-ordered so underrepresented (or absent) categories are tried first.
  - The variation-generation prompt is shown the full existing coverage so the LLM
    naturally produces angles that complement rather than duplicate what's live.
"""

import json
import random
import re
import time
import logging
from collections import Counter, defaultdict
from datetime import datetime
from pathlib import Path

from groq import Groq

log = logging.getLogger(__name__)

# ── Seed topics, grouped by category ──────────────────────────────────────────
# Grouping lets the agent bias seed selection toward under-covered categories.
SEED_TOPICS_BY_CATEGORY: dict[str, list[str]] = {
    "writing": [
        "best AI writing tools",
        "best AI grammar checkers",
        "best AI email writers",
        "AI tools for content creation",
        "AI copywriting tools for marketers",
        "AI tools for long-form blog posts",
    ],
    "coding": [
        "best AI coding assistants",
        "best AI code review tools",
        "AI tools for software developers",
        "best GitHub Copilot alternatives",
        "AI debugging tools for developers",
        "best AI IDE plugins",
    ],
    "design": [
        "best AI image generators",
        "best AI design tools",
        "AI tools for graphic designers",
        "best AI logo makers",
        "AI background removers compared",
        "best text to image AI tools",
    ],
    "video": [
        "best AI video editors",
        "best AI video generators",
        "AI tools for YouTube creators",
        "best AI avatar video makers",
        "AI video subtitle generators",
        "AI tools for short-form video creators",
        "best AI video script writers",
        "AI screen recorder tools compared",
    ],
    "chatbots": [
        "best AI chatbots",
        "ChatGPT alternatives",
        "best AI customer service chatbots",
        "AI chatbot builders for websites",
        "best AI assistants for productivity",
        "best AI chatbots for small business",
        "AI chatbots for lead generation",
        "best Claude vs ChatGPT comparison",
    ],
    "productivity": [
        "best AI productivity tools",
        "AI tools for meetings and transcription",
        "best AI note-taking apps",
        "AI scheduling and task management tools",
        "AI summarizer tools compared",
        "best AI presentation makers",
        "best AI research assistants",
        "AI tools for project management",
        "best AI document editors",
        "AI tools for remote teams",
    ],
    "seo": [
        "best AI SEO tools",
        "AI tools for keyword research",
        "best AI content optimization tools",
        "AI tools for link building",
        "best AI tools for digital marketing",
        "AI email marketing platforms compared",
        "best AI tools for blogging",
        "AI social media content tools compared",
        "best AI tools for affiliate marketers",
        "AI tools for e-commerce product descriptions",
    ],
    "audio": [
        "best AI voice generators",
        "best AI podcast editing tools",
        "AI tools for musicians and producers",
        "best AI text-to-speech tools",
        "AI voice cloning tools compared",
        "best AI transcription tools",
        "AI noise cancellation tools for calls",
    ],
    "finance": [
        "best AI tools for personal finance",
        "AI tools for stock market analysis",
        "best AI accounting software for small business",
        "AI invoicing and bookkeeping tools compared",
        "best AI tax preparation tools",
    ],
    "education": [
        "best AI tools for students",
        "AI tutoring tools compared",
        "best AI tools for teachers",
        "AI quiz and flashcard generators",
        "best AI essay writing tools for students",
        "AI language learning apps compared",
    ],
    "ecommerce": [
        "best AI tools for Shopify stores",
        "AI product description generators compared",
        "best AI tools for Amazon sellers",
        "AI pricing optimization tools",
        "best AI chatbots for e-commerce",
        "AI tools for dropshipping automation",
    ],
}

# Flat list kept for fallback and legacy use
SEED_TOPICS: list[str] = [
    kw for seeds in SEED_TOPICS_BY_CATEGORY.values() for kw in seeds
]

PUBLISHED_DB = Path(__file__).parent.parent / "config" / "published_keywords.json"
CONTENT_DIR  = Path(__file__).parent.parent / "website" / "content" / "posts"


class KeywordAgent:
    def __init__(self, groq_api_key: str):
        self.client = Groq(api_key=groq_api_key)
        self.published = self._load_published()
        self._content_index: list[dict] | None = None  # lazy-loaded

    # ── Persistence ────────────────────────────────────────────────────────────

    def _load_published(self) -> set:
        PUBLISHED_DB.parent.mkdir(parents=True, exist_ok=True)
        if PUBLISHED_DB.exists():
            return set(json.loads(PUBLISHED_DB.read_text()))
        return set()

    def _save_published(self, keyword: str):
        self.published.add(keyword.strip().lower())
        PUBLISHED_DB.write_text(json.dumps(sorted(self.published), indent=2))

    # ── Rich content index ─────────────────────────────────────────────────────

    def _get_content_index(self) -> list[dict]:
        """
        Parse every MDX file on the site and return a list of dicts:
          { title, slug, description, category, tags }

        This is the single source of truth used by both the coverage-gap
        analyser and the semantic duplicate checker.  Cached for the lifetime
        of this agent instance.
        """
        if self._content_index is not None:
            return self._content_index

        index: list[dict] = []
        if not CONTENT_DIR.exists():
            self._content_index = index
            return index

        for mdx in CONTENT_DIR.glob("*.mdx"):
            try:
                text = mdx.read_text(encoding="utf-8", errors="ignore")

                # Extract frontmatter block between the first pair of ---
                fm_match = re.match(r"^---\s*\n(.*?)\n---", text, re.DOTALL)
                fm = fm_match.group(1) if fm_match else ""

                def _fm(field: str) -> str:
                    m = re.search(rf'^{field}:\s*"(.+?)"', fm, re.MULTILINE)
                    return m.group(1).strip() if m else ""

                # Tags can be multi-line YAML list
                tag_matches = re.findall(r"^\s+-\s+\"?(.+?)\"?\s*$", fm, re.MULTILINE)
                tags = [t.strip() for t in tag_matches if t.strip()]

                entry = {
                    "title":       _fm("title"),
                    "slug":        _fm("slug") or mdx.stem,
                    "description": _fm("description"),
                    "category":    _fm("category"),
                    "tags":        tags,
                }
                if entry["title"]:   # skip malformed files
                    index.append(entry)
            except Exception as exc:
                log.warning(f"[KeywordAgent] Could not parse {mdx.name}: {exc}")

        self._content_index = index
        log.info(
            f"[KeywordAgent] Content index built: {len(index)} articles across "
            f"{len({e['category'] for e in index})} categories"
        )
        return index

    # ── Coverage-gap analysis ──────────────────────────────────────────────────

    def _coverage_summary(self) -> dict:
        """
        Return a dict with:
          category_counts   – { category: article_count }
          covered_slugs     – set of existing slugs
          gap_categories    – categories from SEED_TOPICS_BY_CATEGORY with zero articles
          thin_categories   – categories with fewer articles than the median
          summary_text      – human-readable string for prompt injection
        """
        index = self._get_content_index()
        counts: Counter = Counter(e["category"] for e in index if e["category"])
        all_cats = set(SEED_TOPICS_BY_CATEGORY.keys())
        gap_cats  = sorted(all_cats - set(counts.keys()))
        median    = sorted(counts.values())[len(counts) // 2] if counts else 0
        thin_cats = sorted(c for c, n in counts.items() if n < median)

        lines = ["Current site coverage:"]
        for cat in sorted(all_cats):
            n = counts.get(cat, 0)
            flag = " ← NO ARTICLES YET" if n == 0 else (" ← thin" if cat in thin_cats else "")
            lines.append(f"  {cat:<15} {n} article(s){flag}")

        return {
            "category_counts": dict(counts),
            "covered_slugs":   {e["slug"] for e in index},
            "gap_categories":  gap_cats,
            "thin_categories": thin_cats,
            "summary_text":    "\n".join(lines),
        }

    def _priority_seeds(self) -> list[str]:
        """
        Return seeds re-ordered so gap and thin categories come first.
        Within a priority tier, seeds are shuffled for variety.
        """
        cov = self._coverage_summary()
        gap   = cov["gap_categories"]
        thin  = cov["thin_categories"]

        tier1, tier2, tier3 = [], [], []
        for cat, seeds in SEED_TOPICS_BY_CATEGORY.items():
            shuffled = seeds[:]
            random.shuffle(shuffled)
            if cat in gap:
                tier1.extend(shuffled)
            elif cat in thin:
                tier2.extend(shuffled)
            else:
                tier3.extend(shuffled)

        random.shuffle(tier1)
        random.shuffle(tier2)
        random.shuffle(tier3)
        ordered = tier1 + tier2 + tier3
        log.info(
            f"[KeywordAgent] Seed priority — gap categories: {gap}, "
            f"thin categories: {thin}"
        )
        return ordered

    # ── Keyword generation (context-aware) ────────────────────────────────────

    def _generate_variations(self, seed: str, coverage: dict) -> list[dict]:
        """
        Generate 5 long-tail keyword variations for `seed`.

        The prompt receives:
          - The full coverage summary (category counts + gaps) so the LLM
            naturally avoids angles that are already saturated on the site.
          - All existing article titles + descriptions so it can see exactly
            what's live and propose complementary topics.
        """
        index = self._get_content_index()

        # Build a compact existing-content block for the prompt
        existing_block_lines = []
        for art in index:
            line = f'  [{art["category"]}] "{art["title"]}"'
            if art["description"]:
                line += f' — {art["description"][:100]}'
            existing_block_lines.append(line)
        existing_block = "\n".join(existing_block_lines) if existing_block_lines else "  (none yet)"

        prompt = (
            "You are an SEO strategist specialising in the AI tools review niche.\n"
            "Your job: generate 8 long-tail keyword topics for a new article.\n\n"
            f"Seed topic: \"{seed}\"\n\n"
            f"{coverage['summary_text']}\n\n"
            "Articles already published on the site:\n"
            f"{existing_block}\n\n"
            "Rules:\n"
            "1. Each keyword must target a clearly DIFFERENT angle from every article above.\n"
            "2. Prioritise topics in under-covered or absent categories shown above.\n"
            "3. Target buyers ready to compare or purchase (commercial/informational intent).\n"
            "4. Keywords should be 4–8 words long.\n"
            "5. Include comparison (X vs Y), best-of, use-case-specific, and audience-specific angles.\n"
            "6. Do NOT generate a keyword nearly identical to one already published.\n"
            "7. A year number alone does NOT make a topic unique — focus on genuine angle differences.\n\n"
            "Return ONLY valid JSON — no markdown, no preamble:\n"
            "[\n"
            "  {\"keyword\": \"best AI coding assistant for beginners 2026\", "
            "\"intent\": \"commercial\", \"difficulty\": \"low\", \"category\": \"coding\"},\n"
            "  ...\n"
            "]"
        )

        try:
            response = self.client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=900,
                temperature=0.75,
            )
            raw = response.choices[0].message.content
            match = re.search(r"\[.*?\]", raw, re.DOTALL)
            if match:
                return json.loads(match.group())
        except Exception as e:
            log.warning(f"[KeywordAgent] Variation generation failed for '{seed}': {e}")
        return []

    # ── Semantic duplicate check ───────────────────────────────────────────────

    def _is_semantic_duplicate(self, candidate_keyword: str) -> tuple[bool, str]:
        """
        Ask the LLM whether the candidate would produce an article that
        substantially overlaps any existing article on the site.

        Uses the rich content index (title + description + category + tags)
        for a much more precise check than title-only matching.

        Returns (is_duplicate, reason).
        """
        index = self._get_content_index()
        if not index:
            return False, ""

        # Build a compact representation for the prompt
        existing_lines = []
        for art in index:
            parts = [f'[{art["category"]}]', f'"{art["title"]}"']
            if art["description"]:
                parts.append(f'— {art["description"][:120]}')
            if art["tags"]:
                parts.append(f'(tags: {", ".join(art["tags"][:5])})')
            existing_lines.append(" ".join(parts))

        existing_block = "\n".join(existing_lines)

        prompt = (
            "You are a content strategy editor. Decide whether a new keyword topic\n"
            "would produce a TRUE duplicate of content already on the site.\n\n"
            f"Candidate keyword: \"{candidate_keyword}\"\n\n"
            "Existing articles (category, title, description, tags):\n"
            f"{existing_block}\n\n"
            "A TRUE DUPLICATE requires ALL THREE:\n"
            "  1. Reviews more than 60% of the same specific tools\n"
            "  2. Targets the same primary audience\n"
            "  3. Has the same core intent (compare vs review vs rank)\n"
            "NOT a duplicate if the audience, use-case, or tool set differs meaningfully.\n"
            "When in doubt return is_duplicate: false — prefer fresh content over blocking.\n\n"
            "Reply with ONLY valid JSON (no markdown):\n"
            "{\"is_duplicate\": true_or_false, "
            "\"similar_to\": \"closest existing title or null\", "
            "\"reason\": \"one sentence\"}"
        )

        try:
            resp = self.client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=150,
                temperature=0.1,
            )
            raw = resp.choices[0].message.content
            m = re.search(r"\{.*\}", raw, re.DOTALL)
            if not m:
                return False, "parse error — assuming not duplicate"
            data = json.loads(m.group())
            time.sleep(1)
            return bool(data.get("is_duplicate")), data.get("reason", "")
        except Exception as e:
            log.warning(f"[KeywordAgent] Semantic dedup failed for '{candidate_keyword}': {e}")
            return False, ""   # fail-open: don't silently drop valid topics

    # ── Public API ─────────────────────────────────────────────────────────────

    def get_keywords(self, count: int = 2) -> list[dict]:
        """
        Return `count` fresh, non-duplicate keywords with full metadata.

        Selection pipeline:
          1. Build the rich content index from all live MDX files.
          2. Compute coverage gaps — which categories have zero or few articles.
          3. Re-order seeds so gap/thin categories are tried first.
          4. For each seed, generate 5 context-aware variations (existing coverage
             is injected into the prompt so the LLM avoids overlap from the start).
          5. For each variation, run Layer-1 (exact) then Layer-3 (semantic) dedup.
          6. Fallback to raw seed topics if not enough variations pass.
        """
        results:  list[dict] = []
        rejected: list[str]  = []

        # Build coverage once — used by both prioritisation and generation
        coverage = self._coverage_summary()
        log.info(f"[KeywordAgent] Coverage:\n{coverage['summary_text']}")

        seeds = self._priority_seeds()

        for seed in seeds:
            if len(results) >= count:
                break

            log.info(f"[KeywordAgent] Generating variations for seed: '{seed}'")
            variations = self._generate_variations(seed, coverage)
            time.sleep(1)

            for kw in variations:
                if len(results) >= count:
                    break

                keyword = kw.get("keyword", "").strip().lower()
                if not keyword:
                    continue

                # ── Layer 1: exact match ───────────────────────────────────────
                if keyword in self.published:
                    log.info(f"[KeywordAgent] Skip (exact match): '{keyword}'")
                    continue

                # ── Layer 2: slug similarity ───────────────────────────────────
                candidate_slug = re.sub(r"[^a-z0-9]+", "-", keyword).strip("-")
                if candidate_slug in coverage["covered_slugs"]:
                    log.info(f"[KeywordAgent] Skip (slug match): '{keyword}'")
                    self._save_published(keyword)
                    continue

                # ── Layer 3: semantic LLM check ────────────────────────────────
                is_dup, reason = self._is_semantic_duplicate(keyword)
                if is_dup:
                    log.info(
                        f"[KeywordAgent] Skip (semantic dup): '{keyword}'\n"
                        f"  Reason: {reason}"
                    )
                    rejected.append(keyword)
                    self._save_published(keyword)   # record to skip next run too
                    continue

                # ── Accepted ───────────────────────────────────────────────────
                kw["seed"]         = seed
                kw["selected_at"]  = datetime.utcnow().isoformat()
                # Forward the LLM-suggested category if content_agent can use it
                kw.setdefault("category", "")
                results.append(kw)
                self._save_published(keyword)
                log.info(f"[KeywordAgent] ✓ Accepted: '{keyword}'")

        # ── Fallback: try raw seed topics if we still need more ────────────────
        if len(results) < count:
            log.warning(
                f"[KeywordAgent] Only {len(results)}/{count} keywords found via "
                f"variations — falling back to raw seed topics"
            )
            for seed in seeds:
                if len(results) >= count:
                    break
                seed_lower = seed.lower()
                if seed_lower in self.published:
                    continue
                is_dup, reason = self._is_semantic_duplicate(seed_lower)
                if is_dup:
                    log.info(
                        f"[KeywordAgent] Seed skip (semantic dup): '{seed}'\n"
                        f"  Reason: {reason}"
                    )
                    self._save_published(seed_lower)
                    continue
                entry = {
                    "keyword":      seed,
                    "intent":       "commercial",
                    "difficulty":   "medium",
                    "category":     "",
                    "seed":         seed,
                    "selected_at":  datetime.utcnow().isoformat(),
                }
                results.append(entry)
                self._save_published(seed_lower)

        log.info(
            f"[KeywordAgent] Done — {len(results)} keyword(s) selected, "
            f"{len(rejected)} rejected as duplicates"
        )
        return results[:count]