"""
Keyword agent: finds profitable, low-competition topics in the AI tools niche.
Uses a seed keyword list + Groq LLaMA to generate long-tail variations.

Duplicate prevention — two-layer:
  1. Exact match: published_keywords.json (fast, free)
  2. Semantic match: LLM compares candidate against existing MDX article titles
     to catch near-duplicates that slip past string matching.
"""

import json
import random
import re
import time
import logging
from datetime import datetime
from pathlib import Path

from groq import Groq

log = logging.getLogger(__name__)

SEED_TOPICS = [
    "best AI writing tools",
    "best AI image generators",
    "best AI coding assistants",
    "best AI video editors",
    "best AI chatbots",
    "best AI SEO tools",
    "best AI email writers",
    "best AI presentation makers",
    "best AI summarizers",
    "best AI grammar checkers",
    "ChatGPT alternatives",
    "free AI tools for students",
    "AI tools for small businesses",
    "AI tools for freelancers",
    "best AI productivity tools",
    "AI tools for marketing",
    "AI tools for content creation",
    "AI transcription tools",
    "AI voice generators",
    "AI research tools",
]

PUBLISHED_DB = Path(__file__).parent.parent / "config" / "published_keywords.json"
CONTENT_DIR  = Path(__file__).parent.parent / "website" / "content" / "posts"


class KeywordAgent:
    def __init__(self, groq_api_key: str):
        self.client = Groq(api_key=groq_api_key)
        self.published = self._load_published()
        self._existing_titles = None  # lazy-loaded cache

    # ── Persistence ────────────────────────────────────────────────────────────

    def _load_published(self) -> set:
        PUBLISHED_DB.parent.mkdir(parents=True, exist_ok=True)
        if PUBLISHED_DB.exists():
            return set(json.loads(PUBLISHED_DB.read_text()))
        return set()

    def _save_published(self, keyword: str):
        self.published.add(keyword)
        PUBLISHED_DB.write_text(json.dumps(sorted(self.published), indent=2))

    # ── Existing-content catalogue ─────────────────────────────────────────────

    def _get_existing_titles(self) -> list:
        """Read titles from every MDX file currently on the site (cached)."""
        if self._existing_titles is not None:
            return self._existing_titles

        titles = []
        if CONTENT_DIR.exists():
            for mdx in CONTENT_DIR.glob("*.mdx"):
                try:
                    text = mdx.read_text(encoding="utf-8", errors="ignore")
                    m = re.search(r'^title:\s*"(.+)"', text, re.MULTILINE)
                    if m:
                        titles.append(m.group(1).strip())
                except Exception:
                    pass

        self._existing_titles = titles
        log.info(f"[KeywordAgent] {len(titles)} existing article titles loaded for dedup")
        return titles

    # ── Semantic duplicate check ───────────────────────────────────────────────

    def _is_semantic_duplicate(self, candidate_keyword: str):
        """
        Ask the LLM whether the candidate keyword would produce an article
        that substantially overlaps any existing article on the site.
        Returns (is_duplicate: bool, reason: str).
        """
        existing_titles = self._get_existing_titles()
        if not existing_titles:
            return False, ""

        prompt = (
            'You are a content strategy editor. Decide whether a new keyword topic\n'
            'would produce an article that substantially duplicates content already on the site.\n\n'
            f'Candidate keyword: "{candidate_keyword}"\n\n'
            f'Existing article titles:\n{json.dumps(existing_titles, indent=2)}\n\n'
            'Overlap rules:\n'
            '- DUPLICATE if: >50% of the tools reviewed would be the same AND the intent is identical.\n'
            '- NOT a duplicate if: it targets a clearly different audience, use-case, or tool set.\n'
            '- A year change alone does NOT make it unique.\n\n'
            'Reply with ONLY valid JSON (no markdown):\n'
            '{"is_duplicate": true_or_false, "similar_to": "closest existing title or null", "reason": "one sentence"}'
        )

        try:
            resp = self.client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=150,
                temperature=0.1,
            )
            raw = resp.choices[0].message.content
            m = re.search(r'\{.*\}', raw, re.DOTALL)
            if not m:
                return False, "parse error"
            data = json.loads(m.group())
            time.sleep(1)
            return bool(data.get("is_duplicate")), data.get("reason", "")
        except Exception as e:
            log.warning(f"[KeywordAgent] Semantic dedup failed for '{candidate_keyword}': {e}")
            return False, ""  # fail-open so valid topics are not silently dropped

    # ── Keyword generation ─────────────────────────────────────────────────────

    def _generate_variations(self, seed: str) -> list:
        prompt = (
            f'You are an SEO expert specialising in the AI tools niche.\n'
            f'Generate 5 specific, high-intent long-tail keyword variations for: "{seed}"\n\n'
            'Rules:\n'
            '- Each keyword should target buyers ready to purchase or compare tools\n'
            '- Include comparison keywords (X vs Y), best-of lists, and review keywords\n'
            '- Keywords should be 4-8 words long\n'
            '- Focus on informational and commercial intent\n'
            '- Avoid keywords nearly identical to each other\n\n'
            'Return ONLY a JSON array like:\n'
            '[\n'
            '  {"keyword": "best AI writing tool for bloggers 2026", "intent": "commercial", "difficulty": "low"},\n'
            '  ...\n'
            ']'
        )

        try:
            response = self.client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=500,
                temperature=0.7,
            )
            raw = response.choices[0].message.content
            match = re.search(r'\[.*?\]', raw, re.DOTALL)
            if match:
                return json.loads(match.group())
        except Exception as e:
            log.warning(f"[KeywordAgent] Variation generation failed for '{seed}': {e}")
        return []

    # ── Public API ─────────────────────────────────────────────────────────────

    def get_keywords(self, count: int = 2) -> list:
        """
        Return `count` fresh, non-duplicate keywords with full metadata.

        Deduplication layers (in order):
          1. Exact string match against published_keywords.json
          2. Semantic LLM check against existing MDX article titles on the site
        """
        results = []
        seeds = random.sample(SEED_TOPICS, min(len(SEED_TOPICS), count * 4))

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

                # Layer 1: exact dedup
                if keyword in self.published:
                    log.info(f"[KeywordAgent] Skip (exact match): '{keyword}'")
                    continue

                # Layer 2: semantic dedup
                is_dup, reason = self._is_semantic_duplicate(keyword)
                if is_dup:
                    log.info(f"[KeywordAgent] Skip (semantic dup): '{keyword}' — {reason}")
                    self._save_published(keyword)  # record so we skip it next run too
                    continue

                kw["seed"] = seed
                kw["selected_at"] = datetime.utcnow().isoformat()
                results.append(kw)
                self._save_published(keyword)
                log.info(f"[KeywordAgent] Selected: '{keyword}'")

        # Fallback: use seed topics directly if not enough long-tail variations found
        if len(results) < count:
            log.warning("[KeywordAgent] Falling back to raw seed topics")
            for seed in SEED_TOPICS:
                if len(results) >= count:
                    break
                if seed.lower() in self.published:
                    continue
                is_dup, reason = self._is_semantic_duplicate(seed)
                if is_dup:
                    log.info(f"[KeywordAgent] Seed skip (semantic dup): '{seed}' — {reason}")
                    self._save_published(seed.lower())
                    continue
                entry = {
                    "keyword": seed,
                    "intent": "commercial",
                    "difficulty": "medium",
                    "seed": seed,
                    "selected_at": datetime.utcnow().isoformat(),
                }
                results.append(entry)
                self._save_published(seed.lower())

        return results[:count]
