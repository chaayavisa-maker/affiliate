"""
Keyword agent: finds profitable, low-competition topics in the AI tools niche.
Uses a seed keyword list + Groq LLaMA to generate long-tail variations.
Tracks already-published keywords to avoid duplicates.
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


class KeywordAgent:
    def __init__(self, groq_api_key: str):
        self.client = Groq(api_key=groq_api_key)
        self.published = self._load_published()

    def _load_published(self) -> set:
        PUBLISHED_DB.parent.mkdir(parents=True, exist_ok=True)
        if PUBLISHED_DB.exists():
            return set(json.loads(PUBLISHED_DB.read_text()))
        return set()

    def _save_published(self, keyword: str):
        self.published.add(keyword)
        PUBLISHED_DB.write_text(json.dumps(list(self.published), indent=2))

    def _generate_variations(self, seed: str) -> list[dict]:
        prompt = f"""You are an SEO expert specializing in the AI tools niche.
Generate 5 specific, high-intent long-tail keyword variations for: "{seed}"

Rules:
- Each keyword should target buyers ready to purchase or compare tools
- Include comparison keywords (X vs Y), best-of lists, and review keywords  
- Keywords should be 4-8 words long
- Focus on informational and commercial intent

Return ONLY a JSON array like:
[
  {{"keyword": "best AI writing tool for bloggers 2024", "intent": "commercial", "difficulty": "low"}},
  ...
]"""

        try:
            response = self.client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=500,
                temperature=0.7,
            )
            raw = response.choices[0].message.content
            # Extract JSON from response
            match = re.search(r'\[.*?\]', raw, re.DOTALL)
            if match:
                return json.loads(match.group())
        except Exception as e:
            log.warning(f"Keyword generation failed for '{seed}': {e}")
        return []

    def get_keywords(self, count: int = 2) -> list[dict]:
        """Return `count` fresh, unpublished keywords with full metadata."""
        results = []
        seeds = random.sample(SEED_TOPICS, min(len(SEED_TOPICS), count * 3))

        for seed in seeds:
            if len(results) >= count:
                break
            variations = self._generate_variations(seed)
            time.sleep(1)  # Rate limit courtesy pause

            for kw in variations:
                keyword = kw.get("keyword", "").strip().lower()
                if keyword and keyword not in self.published:
                    kw["seed"] = seed
                    kw["selected_at"] = datetime.utcnow().isoformat()
                    results.append(kw)
                    self._save_published(keyword)
                    if len(results) >= count:
                        break

        # Fallback: use seeds directly if not enough variations
        if len(results) < count:
            for seed in SEED_TOPICS:
                if seed.lower() not in self.published and len(results) < count:
                    entry = {"keyword": seed, "intent": "commercial", "difficulty": "medium", "seed": seed}
                    results.append(entry)
                    self._save_published(seed.lower())

        return results[:count]
