"""
Keyword agent: finds profitable, low-competition topics in the AI tools niche.
Uses a seed keyword list + Groq LLaMA to generate long-tail variations.

Duplicate prevention — three layers:
  1. Exact match:    published_keywords.json (fast, free, persistent across runs)
  2. Slug collision: ContentCatalogue.all_slugs() — catches URL-level collisions
  3. Semantic match: LLM compares candidate against existing articles using
                     rich metadata (title + description + slug + category) to
                     catch near-duplicates that slip past string matching.

Category coverage weighting:
  Seed topics are grouped by category. Seeds from categories that already have
  more articles on the site are de-prioritised, so the agent naturally fills
  content gaps rather than over-indexing on already-covered topics.

Mid-run awareness:
  The agent accepts a shared ContentCatalogue instance. When the orchestrator
  calls catalogue.register_new() after publishing, subsequent keywords in the
  same run will see the new article during dedup — preventing two articles
  written in the same run from being near-duplicates of each other.
"""

import json
import random
import re
import time
import logging
from datetime import datetime
from pathlib import Path

from groq import Groq
from content_catalogue import ContentCatalogue

log = logging.getLogger(__name__)

# ── Seed topics grouped by category ────────────────────────────────────────────
# Category keys must match the frontmatter "category" field used in MDX files.

SEED_TOPICS_BY_CATEGORY: dict[str, list[str]] = {
    "writing": [
        "best AI writing tools for bloggers",
        "best AI copywriting software",
        "AI tools for long-form content",
        "best AI essay writers for students",
        "AI writing assistants for non-native speakers",
    ],
    "coding": [
        "best AI coding assistants",
        "best AI code review tools",
        "AI pair programming tools",
        "best AI tools for Python developers",
        "AI debugging tools for developers",
    ],
    "design": [
        "best AI image generators",
        "best AI logo makers",
        "AI tools for UI/UX designers",
        "best AI photo editors",
        "AI tools for social media graphics",
    ],
    "video": [
        "best AI video editors",
        "best AI text-to-video tools",
        "AI tools for YouTube creators",
        "best AI avatar video generators",
        "AI video dubbing and translation tools",
    ],
    "seo": [
        "best AI SEO tools",
        "best AI keyword research tools",
        "AI tools for content marketing",
        "best AI email marketing platforms",
        "AI tools for PPC and ad copy",
    ],
    "productivity": [
        "best AI productivity tools",
        "best AI meeting summarizers",
        "AI note-taking apps",
        "best AI task managers",
        "AI tools for project management",
    ],
    "chatbots": [
        "ChatGPT alternatives for business",
        "best AI chatbots for customer service",
        "best AI research assistants",
        "AI chatbots for education",
        "free AI chatbot tools",
    ],
}

# Flat list used only for the fallback path
SEED_TOPICS_FLAT: list[str] = [
    s for seeds in SEED_TOPICS_BY_CATEGORY.values() for s in seeds
]

PUBLISHED_DB = Path(__file__).parent.parent / "config" / "published_keywords.json"


class KeywordAgent:
    def __init__(self, groq_api_key: str, catalogue: ContentCatalogue):
        self.client    = Groq(api_key=groq_api_key)
        self.catalogue = catalogue
        self.published = self._load_published()

    # ── Persistence ────────────────────────────────────────────────────────────

    def _load_published(self) -> set:
        PUBLISHED_DB.parent.mkdir(parents=True, exist_ok=True)
        if PUBLISHED_DB.exists():
            return set(json.loads(PUBLISHED_DB.read_text()))
        return set()

    def _save_published(self, keyword: str):
        self.published.add(keyword)
        PUBLISHED_DB.write_text(json.dumps(sorted(self.published), indent=2))

    # ── Category-weighted seed selection ───────────────────────────────────────

    def _weighted_seeds(self, n: int) -> list[str]:
        """
        Return n seed topics, biased toward categories with fewer existing articles.

        Algorithm:
          - Count existing articles per category from the catalogue.
          - Assign each category a weight = 1 / (1 + article_count).
            A category with 0 articles → weight 1.0 (highest priority).
            A category with 8 articles → weight 0.11 (lowest priority).
          - Sample seeds proportional to their category weight, without replacement.
        """
        coverage = self.catalogue.coverage_by_category()
        log.info(f"[KeywordAgent] Category coverage: {coverage}")

        pool: list[tuple[str, float]] = []
        for cat, seeds in SEED_TOPICS_BY_CATEGORY.items():
            weight = 1.0 / (1 + coverage.get(cat, 0))
            for seed in seeds:
                pool.append((seed, weight))

        if not pool:
            return random.sample(SEED_TOPICS_FLAT, min(n, len(SEED_TOPICS_FLAT)))

        chosen:            list[str]   = []
        remaining_seeds:   list[str]   = [p[0] for p in pool]
        remaining_weights: list[float] = [p[1] for p in pool]

        for _ in range(min(n, len(remaining_seeds))):
            total = sum(remaining_weights)
            if total == 0:
                break
            r, cumulative = random.uniform(0, total), 0.0
            for idx, w in enumerate(remaining_weights):
                cumulative += w
                if r <= cumulative:
                    chosen.append(remaining_seeds[idx])
                    remaining_seeds.pop(idx)
                    remaining_weights.pop(idx)
                    break

        log.info(f"[KeywordAgent] Weighted seeds selected: {chosen}")
        return chosen

    # ── Semantic duplicate check ───────────────────────────────────────────────

    def _is_semantic_duplicate(self, candidate_keyword: str) -> tuple[bool, str]:
        """
        Ask the LLM whether the candidate keyword would produce an article that
        substantially overlaps any article already in the catalogue.

        Uses rich metadata per existing article (title + description + slug +
        category) so the LLM can detect near-duplicates that share different
        titles, e.g. "best AI chatbots 2026" vs "top AI chatbot platforms".

        Returns (is_duplicate: bool, reason: str).
        Fails open on API errors so valid topics are never silently dropped.
        """
        if not self.catalogue.all_entries():
            return False, ""

        prompt = (
            "You are a content strategy editor. Decide whether a NEW keyword topic\n"
            "would produce an article that substantially duplicates content already on the site.\n\n"
            f'Candidate keyword: "{candidate_keyword}"\n\n'
            "Existing articles (title | category | slug | description excerpt):\n"
            f"{self.catalogue.summary_for_prompt()}\n\n"
            "Rules:\n"
            "- DUPLICATE if: the new article would review essentially the same tools\n"
            "  for the same audience intent, even with a differently worded title.\n"
            "- NOT a duplicate if: it targets a clearly different audience segment,\n"
            "  use-case, industry vertical, or a substantially different tool set.\n"
            "- A year change alone (2025 → 2026) does NOT make it unique.\n"
            "- Different price tier (free vs paid) or profession (marketer vs developer)\n"
            "  CAN make it unique if it would change which tools are recommended.\n\n"
            "Reply with ONLY valid JSON (no markdown, no text outside the JSON object):\n"
            '{"is_duplicate": true_or_false, '
            '"similar_to": "closest existing slug or null", '
            '"reason": "one sentence explaining the decision"}'
        )

        try:
            resp = self.client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=150,
                temperature=0.1,
            )
            raw = resp.choices[0].message.content
            m   = re.search(r"\{.*\}", raw, re.DOTALL)
            if not m:
                log.warning(f"[KeywordAgent] Semantic dedup parse error for '{candidate_keyword}'")
                return False, "parse error"
            data   = json.loads(m.group())
            time.sleep(1)
            is_dup = bool(data.get("is_duplicate"))
            reason = (
                f"Too similar to \"{data.get('similar_to')}\" — {data.get('reason', '')}"
                if is_dup else data.get("reason", "")
            )
            return is_dup, reason
        except Exception as exc:
            log.warning(f"[KeywordAgent] Semantic dedup failed for '{candidate_keyword}': {exc}")
            return False, ""  # fail-open

    # ── Keyword generation ─────────────────────────────────────────────────────

    def _generate_variations(self, seed: str) -> list[dict]:
        """Expand a seed topic into 5 specific long-tail keyword candidates."""
        prompt = (
            "You are an SEO expert specialising in the AI tools niche.\n"
            f'Generate 5 specific, high-intent long-tail keyword variations for: "{seed}"\n\n'
            "Rules:\n"
            "- Target buyers ready to purchase or compare tools\n"
            "- Include comparison (X vs Y), best-of lists, and review keywords\n"
            "- Keywords should be 4-8 words long\n"
            "- Focus on informational and commercial intent\n"
            "- Do not make variations nearly identical to each other\n\n"
            "Return ONLY a JSON array, no markdown:\n"
            "[\n"
            '  {"keyword": "best AI writing tool for bloggers 2026", '
            '"intent": "commercial", "difficulty": "low"},\n'
            "  ...\n"
            "]"
        )

        try:
            resp = self.client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=500,
                temperature=0.7,
            )
            raw   = resp.choices[0].message.content
            match = re.search(r"\[.*?\]", raw, re.DOTALL)
            if match:
                return json.loads(match.group())
        except Exception as exc:
            log.warning(f"[KeywordAgent] Variation generation failed for '{seed}': {exc}")
        return []

    # ── Public API ─────────────────────────────────────────────────────────────

    def get_keywords(self, count: int = 2) -> list[dict]:
        """
        Return `count` fresh, non-duplicate keywords with full metadata.

        Deduplication (in order, cheapest to most expensive):
          1. Exact string match against published_keywords.json
          2. Slug collision against ContentCatalogue.all_slugs()
          3. Semantic LLM check using rich catalogue metadata

        Seeds are category-weighted: under-covered categories are preferred.
        """
        results: list[dict] = []
        seeds = self._weighted_seeds(count * 5)  # over-sample to survive dedup

        for seed in seeds:
            if len(results) >= count:
                break

            variations = self._generate_variations(seed)
            time.sleep(1)

            for kw in variations:
                if len(results) >= count:
                    break

                keyword = kw.get("keyword", "").strip().lower()
                if not keyword:
                    continue

                # Layer 1: exact keyword dedup (persisted across runs)
                if keyword in self.published:
                    log.info(f"[KeywordAgent] Skip (exact match): '{keyword}'")
                    continue

                # Layer 2: slug collision (no LLM call needed)
                candidate_slug = re.sub(r"[^a-z0-9\s-]", "", keyword)
                candidate_slug = re.sub(r"\s+", "-", candidate_slug.strip())[:80]
                if candidate_slug in self.catalogue.all_slugs():
                    log.info(f"[KeywordAgent] Skip (slug collision): '{candidate_slug}'")
                    self._save_published(keyword)
                    continue

                # Layer 3: semantic dedup (most expensive — only reaches here if 1&2 pass)
                is_dup, reason = self._is_semantic_duplicate(keyword)
                if is_dup:
                    log.info(f"[KeywordAgent] Skip (semantic dup): '{keyword}' — {reason}")
                    self._save_published(keyword)
                    continue

                kw["seed"]        = seed
                kw["selected_at"] = datetime.utcnow().isoformat()
                results.append(kw)
                self._save_published(keyword)
                log.info(f"[KeywordAgent] Selected: '{keyword}'")

        # Fallback: try raw seeds if not enough long-tail variations survived
        if len(results) < count:
            log.warning("[KeywordAgent] Falling back to raw seed topics")
            for seed in SEED_TOPICS_FLAT:
                if len(results) >= count:
                    break
                kw_str = seed.lower()
                if kw_str in self.published:
                    continue

                slug = re.sub(r"[^a-z0-9\s-]", "", kw_str)
                slug = re.sub(r"\s+", "-", slug.strip())[:80]
                if slug in self.catalogue.all_slugs():
                    self._save_published(kw_str)
                    continue

                is_dup, reason = self._is_semantic_duplicate(kw_str)
                if is_dup:
                    log.info(f"[KeywordAgent] Seed skip (semantic dup): '{kw_str}' — {reason}")
                    self._save_published(kw_str)
                    continue

                results.append({
                    "keyword":     seed,
                    "intent":      "commercial",
                    "difficulty":  "medium",
                    "seed":        seed,
                    "selected_at": datetime.utcnow().isoformat(),
                })
                self._save_published(kw_str)

        log.info(f"[KeywordAgent] Final selection: {[r['keyword'] for r in results[:count]]}")
        return results[:count]
