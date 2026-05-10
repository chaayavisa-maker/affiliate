"""
Guardrail agent: multi-pass validation gate before any article is published.

Checks (in order):
  1. Format      — required sections, table, frontmatter fields, title/meta length
  2. Content     — word count, keyword density, affiliate links, CTAs, banned phrases
  3. Duplicates  — LLM semantic check against every existing MDX title on the site
  4. Fact check  — LLM flags implausible pricing / feature / statistic claims
  5. Reflection  — LLM editor scores the article 1-10 and gives a publish recommendation

An article must pass ALL hard checks AND score >= MIN_REFLECTION_SCORE to be published.
Warnings are logged but do not block publication.
"""

import json
import logging
import re
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

from groq import Groq

log = logging.getLogger(__name__)

CONTENT_DIR = Path(__file__).parent.parent / "website" / "content" / "posts"

# ── Thresholds ─────────────────────────────────────────────────────────────────
MIN_WORD_COUNT        = 1_200
MAX_WORD_COUNT        = 3_000
MIN_KEYWORD_DENSITY   = 0.003   # 0.3 % — too sparse
MAX_KEYWORD_DENSITY   = 0.025   # 2.5 % — keyword stuffing
MIN_REFLECTION_SCORE  = 6       # 1-10; retry below this
MAX_RETRIES           = 2

# Every article must contain at least these H2 section markers
REQUIRED_SECTIONS = [
    "## Introduction",
    "## What to Look for",
    "## Frequently Asked",
    "## Conclusion",
]

# Phrases that expose the AI origin — instant hard failure
BANNED_PHRASES = [
    "as an ai",
    "as an ai language model",
    "i cannot",
    "i'm unable to",
    "i don't have the ability",
    "i am an ai",
    "i'm an ai",
    "i was trained",
    "my training data",
    "i lack real-time",
]


# ── Result dataclass ───────────────────────────────────────────────────────────
@dataclass
class GuardrailResult:
    passed: bool
    score: int                          # 0-10 overall reflection score
    issues: list[str] = field(default_factory=list)    # hard failures — block publish
    warnings: list[str] = field(default_factory=list)  # soft warnings — log only
    reflection_feedback: str = ""       # full JSON feedback from self-reflection
    word_count: int = 0
    keyword_density: float = 0.0

    def summary(self) -> str:
        lines = [
            f"Score: {self.score}/10  |  Passed: {self.passed}",
            f"Word count: {self.word_count}  |  Keyword density: {self.keyword_density:.2%}",
        ]
        if self.issues:
            lines.append("HARD FAILURES:")
            lines.extend(f"  ✗ {i}" for i in self.issues)
        if self.warnings:
            lines.append("Warnings:")
            lines.extend(f"  ⚠ {w}" for w in self.warnings)
        if self.reflection_feedback:
            lines.append(f"Reflection:\n{self.reflection_feedback}")
        return "\n".join(lines)


# ── Main agent ─────────────────────────────────────────────────────────────────
class GuardrailAgent:
    def __init__(self, groq_api_key: str):
        self.client = Groq(api_key=groq_api_key)

    # ── Public API ─────────────────────────────────────────────────────────────

    def validate(self, article: dict) -> GuardrailResult:
        """
        Run all guardrail passes in order.
        Returns GuardrailResult; article is published only when result.passed is True.
        """
        result = GuardrailResult(passed=False, score=0)

        log.info("  [Guardrail] Pass 1: format check")
        self._check_format(article, result)

        log.info("  [Guardrail] Pass 2: content quality")
        self._check_content_quality(article, result)

        log.info("  [Guardrail] Pass 3: banned phrases")
        self._check_banned_phrases(article, result)

        log.info("  [Guardrail] Pass 4: duplicate topic (semantic)")
        self._check_duplicate_topic(article, result)

        log.info("  [Guardrail] Pass 5: LLM fact check")
        self._llm_fact_check(article, result)

        log.info("  [Guardrail] Pass 6: LLM self-reflection & scoring")
        self._llm_reflect(article, result)

        result.passed = (
            len(result.issues) == 0
            and result.score >= MIN_REFLECTION_SCORE
        )

        log.info(f"  [Guardrail] Result → {'PASS ✓' if result.passed else 'FAIL ✗'}")
        for issue in result.issues:
            log.error(f"  [Guardrail]   ✗ {issue}")
        for warn in result.warnings:
            log.warning(f"  [Guardrail]   ⚠ {warn}")

        return result

    def build_retry_instructions(self, result: GuardrailResult) -> str:
        """
        Produce a compact correction brief for the ContentAgent to include
        in its retry prompt so it can fix the specific issues found.
        """
        lines = ["PREVIOUS DRAFT FAILED QUALITY CHECKS. Fix these issues:"]
        for i, issue in enumerate(result.issues, 1):
            lines.append(f"  {i}. {issue}")
        if result.warnings:
            lines.append("Also address these warnings if possible:")
            for w in result.warnings:
                lines.append(f"  - {w}")
        if result.reflection_feedback:
            try:
                fb = json.loads(result.reflection_feedback)
                improvements = fb.get("improvements", [])
                if improvements:
                    lines.append("Editor improvement notes:")
                    for imp in improvements:
                        lines.append(f"  - {imp}")
            except Exception:
                pass
        return "\n".join(lines)

    # ── Pass 1: Format ──────────────────────────────────────────────────────────

    def _check_format(self, article: dict, result: GuardrailResult):
        content = article.get("content", "")

        # Required section headers
        missing = [s for s in REQUIRED_SECTIONS if s not in content]
        if missing:
            result.issues.append(
                f"Missing required section(s): {missing}. "
                "Every article must have Introduction, 'What to Look for', FAQ, and Conclusion."
            )

        # Comparison table (must have at least one markdown table row)
        table_rows = [l for l in content.splitlines() if l.strip().startswith("|") and "|" in l[1:]]
        if len(table_rows) < 3:  # header + separator + at least one data row
            result.issues.append(
                "Comparison table is missing or incomplete. "
                "Include a markdown table with columns: Tool | Best For | Price | Free Trial | Rating"
            )

        # Individual tool review sections — need at least 2 H2 tool reviews
        tool_reviews = re.findall(r'^##\s+.+(?:Review|vs\.?)\b', content, re.MULTILINE | re.IGNORECASE)
        if len(tool_reviews) < 2:
            result.warnings.append(
                f"Only {len(tool_reviews)} tool review section(s) found; expected at least 2 product reviews."
            )

        # Frontmatter / article dict fields
        for f in ("title", "slug", "meta_description", "category", "keyword"):
            if not article.get(f):
                result.issues.append(f"Article dict is missing field: '{f}'")

        # Title length
        title = article.get("title", "")
        if not (20 <= len(title) <= 80):
            result.warnings.append(
                f"Title is {len(title)} chars — ideal range is 20-80. "
                f"Current: \"{title}\""
            )

        # Meta description length
        meta = article.get("meta_description", "")
        if not (100 <= len(meta) <= 165):
            result.warnings.append(
                f"Meta description is {len(meta)} chars — ideal range is 100-165. "
                f"Current: \"{meta[:80]}...\""
            )

        # Slug format
        slug = article.get("slug", "")
        if slug and not re.fullmatch(r'[a-z0-9-]+', slug):
            result.issues.append(
                f"Slug '{slug}' contains invalid characters — only lowercase letters, digits, hyphens."
            )

    # ── Pass 2: Content quality ────────────────────────────────────────────────

    def _check_content_quality(self, article: dict, result: GuardrailResult):
        content = article.get("content", "")
        words = content.split()
        result.word_count = len(words)

        if result.word_count < MIN_WORD_COUNT:
            result.issues.append(
                f"Article too short: {result.word_count} words "
                f"(minimum is {MIN_WORD_COUNT}). Expand each tool review section."
            )
        elif result.word_count > MAX_WORD_COUNT:
            result.warnings.append(
                f"Article very long: {result.word_count} words "
                f"(suggested max {MAX_WORD_COUNT}). Consider trimming redundant sections."
            )

        # Keyword density
        keyword = article.get("keyword", "").lower()
        if keyword:
            kw_occurrences = content.lower().count(keyword)
            result.keyword_density = kw_occurrences / max(len(words), 1)
            if result.keyword_density < MIN_KEYWORD_DENSITY:
                result.warnings.append(
                    f"Keyword density is {result.keyword_density:.2%} for \"{keyword}\" "
                    f"(target > {MIN_KEYWORD_DENSITY:.2%}). Use the keyword more naturally."
                )
            elif result.keyword_density > MAX_KEYWORD_DENSITY:
                result.issues.append(
                    f"Keyword stuffing: \"{keyword}\" appears at {result.keyword_density:.2%} density "
                    f"(max {MAX_KEYWORD_DENSITY:.2%}). Reduce repetition."
                )

        # Affiliate products mentioned
        products = article.get("products", [])
        if products:
            mentioned = sum(
                1 for p in products
                if p["name"] in content or p["url"].split("?")[0] in content
            )
            if mentioned < len(products) // 2:
                result.issues.append(
                    f"Only {mentioned}/{len(products)} affiliate products appear in the article. "
                    "All provided products must be reviewed."
                )

        # Call-to-action signals
        cta_signals = ["get started", "try ", "sign up", "learn more", "visit ", "check out", "start your", "free trial"]
        if not any(sig in content.lower() for sig in cta_signals):
            result.warnings.append(
                "No call-to-action found. Add CTAs at the end of each tool review "
                "and in the Conclusion."
            )

        # Heading depth — check for at least 3 H2 headings
        h2_count = len(re.findall(r'^## ', content, re.MULTILINE))
        if h2_count < 4:
            result.warnings.append(
                f"Only {h2_count} H2 headings found — aim for at least 6 "
                "(Introduction, What to Look for, 3× Tool Review, FAQ, Conclusion)."
            )

    # ── Pass 3: Banned phrases ─────────────────────────────────────────────────

    def _check_banned_phrases(self, article: dict, result: GuardrailResult):
        content = article.get("content", "").lower()
        found = [p for p in BANNED_PHRASES if p in content]
        if found:
            result.issues.append(
                f"AI-reveal phrases detected — remove these: {found}. "
                "The article must read as written by a human editorial team."
            )

    # ── Pass 4: Semantic duplicate check ──────────────────────────────────────

    def _check_duplicate_topic(self, article: dict, result: GuardrailResult):
        """
        Reads all existing MDX titles from the content directory and asks the
        LLM whether the new article is semantically too close to any of them.
        Catches cases where exact string matching in keyword_agent would miss
        near-duplicates (e.g. "best AI writing tool for bloggers" vs
        "top AI writing assistants for content creators").
        """
        if not CONTENT_DIR.exists():
            return

        existing_titles: list[str] = []
        existing_slugs: list[str] = []
        for mdx_file in CONTENT_DIR.glob("*.mdx"):
            try:
                text = mdx_file.read_text(encoding="utf-8", errors="ignore")
                title_m = re.search(r'^title:\s*"(.+)"', text, re.MULTILINE)
                slug_m  = re.search(r'^slug:\s*(.+)',  text, re.MULTILINE)
                if title_m:
                    existing_titles.append(title_m.group(1).strip())
                if slug_m:
                    existing_slugs.append(slug_m.group(1).strip())
            except Exception:
                pass

        if not existing_titles:
            return

        # Also block exact slug collision
        new_slug = article.get("slug", "")
        if new_slug in existing_slugs:
            result.issues.append(
                f"Slug collision: '{new_slug}' already exists on the site. "
                "This article would overwrite an existing post."
            )
            return  # No need for LLM check — definite collision

        new_title = article.get("title", article.get("keyword", ""))
        prompt = f"""You are a content strategy editor. Determine whether a proposed new article
substantially duplicates any article already on the site.

Proposed article: "{new_title}"

Already published articles:
{json.dumps(existing_titles, indent=2)}

A DUPLICATE means the new article would cover essentially the same:
- Primary tools being reviewed (>50% overlap)
- Core topic/intent (e.g. both compare writing AI tools for bloggers)

A year change alone (2025 → 2026) does NOT make it unique if the content would be identical.
A completely different set of tools or a clearly narrower sub-niche IS different enough.

Reply with ONLY valid JSON (no markdown, no preamble):
{{"is_duplicate": true_or_false, "similar_to": "title of closest match, or null", "overlap_reason": "one sentence"}}"""

        try:
            resp = self.client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=180,
                temperature=0.1,
            )
            raw = resp.choices[0].message.content
            m = re.search(r'\{.*\}', raw, re.DOTALL)
            if not m:
                log.warning("[Guardrail] Duplicate check: could not parse LLM JSON response")
                return
            data = json.loads(m.group())
            if data.get("is_duplicate"):
                result.issues.append(
                    f"Duplicate topic — new article \"{new_title}\" is too similar to "
                    f"existing \"{data.get('similar_to')}\". "
                    f"Reason: {data.get('overlap_reason')}. "
                    "Choose a more distinct angle or a different set of tools."
                )
            time.sleep(1)
        except Exception as e:
            log.warning(f"[Guardrail] Duplicate topic check failed: {e}")

    # ── Pass 5: LLM fact check ─────────────────────────────────────────────────

    def _llm_fact_check(self, article: dict, result: GuardrailResult):
        """
        Ask the LLM to flag implausible pricing claims, exaggerated feature
        descriptions, and unsourced statistics. Uses the known product list
        from affiliate products as ground truth for pricing.
        """
        content = article.get("content", "")
        products = article.get("products", [])
        products_ctx = "\n".join(
            f"- {p['name']}: listed price {p['price']}"
            for p in products
        )

        prompt = f"""You are a fact-checking editor for a technology review publication.

Review this article excerpt for factual accuracy. Check:
1. Pricing — does the article contradict known prices? (Known: {products_ctx})
2. Feature claims — are any AI tool capabilities exaggerated or impossible?
3. Comparative claims — does the article contradict itself between sections?
4. Statistics/percentages — are any numbers cited without a source and implausibly precise?
5. Product existence — are all tools mentioned real, known AI products?

ARTICLE EXCERPT (first 1 500 chars):
{content[:1500]}

Reply with ONLY valid JSON (no markdown):
{{
  "fact_issues": ["specific factual problem 1", "specific factual problem 2"],
  "plausibility_score": 1_to_10_integer
}}

If no fact issues are found, return an empty list for fact_issues."""

        try:
            resp = self.client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=350,
                temperature=0.2,
            )
            raw = resp.choices[0].message.content
            m = re.search(r'\{.*\}', raw, re.DOTALL)
            if not m:
                log.warning("[Guardrail] Fact check: could not parse LLM JSON")
                return
            data = json.loads(m.group())

            for issue in data.get("fact_issues", []):
                result.warnings.append(f"[Fact] {issue}")

            plausibility = int(data.get("plausibility_score", 8))
            if plausibility < 5:
                result.issues.append(
                    f"Fact plausibility score is {plausibility}/10 — the article likely contains "
                    "inaccurate claims that would damage reader trust. Review pricing and feature claims."
                )
            elif plausibility < 7:
                result.warnings.append(
                    f"Fact plausibility score is {plausibility}/10 — double-check specific claims "
                    "before publishing."
                )
            time.sleep(1)
        except Exception as e:
            log.warning(f"[Guardrail] LLM fact check failed: {e}")

    # ── Pass 6: LLM self-reflection ────────────────────────────────────────────

    def _llm_reflect(self, article: dict, result: GuardrailResult):
        """
        Acts as a senior editor who scores the article across 6 quality dimensions
        and provides a publish / revise / reject recommendation with specific feedback.
        Scores are averaged into result.score which must meet MIN_REFLECTION_SCORE.
        """
        content  = article.get("content", "")
        keyword  = article.get("keyword", "")
        title    = article.get("title", "")

        prompt = f"""You are a senior content editor at an AI tools review publication.
Evaluate this article and decide whether it is ready to publish.

TARGET KEYWORD: "{keyword}"
TITLE: "{title}"
ARTICLE (first 2 500 chars):
{content[:2500]}

Score 1-10 on each dimension, then give an overall score:
- helpfulness    : Does it genuinely help a reader decide which tool to use?
- accuracy       : Are claims believable, consistent, and well-supported?
- structure      : Is it well-organised and easy to skim?
- originality    : Does it offer insight beyond generic AI-generated text?
- seo_quality    : Is the keyword used naturally and at the right frequency?
- reader_trust   : Would a reader trust these recommendations enough to click affiliate links?

Publish recommendation:
  "publish"  — ready as-is
  "revise"   — publish after addressing improvements
  "reject"   — fundamental problems; needs a full rewrite

Reply with ONLY valid JSON (no markdown, no preamble):
{{
  "scores": {{
    "helpfulness": 0,
    "accuracy": 0,
    "structure": 0,
    "originality": 0,
    "seo_quality": 0,
    "reader_trust": 0
  }},
  "overall_score": 0,
  "strengths": ["strength 1", "strength 2"],
  "improvements": ["specific improvement 1", "specific improvement 2", "specific improvement 3"],
  "publish_recommendation": "publish"
}}"""

        try:
            resp = self.client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=600,
                temperature=0.3,
            )
            raw = resp.choices[0].message.content
            m = re.search(r'\{.*\}', raw, re.DOTALL)
            if not m:
                log.warning("[Guardrail] Reflection: could not parse LLM JSON")
                result.score = 5  # neutral fallback — don't block on parse error
                return
            data = json.loads(m.group())

            result.score = int(data.get("overall_score", 5))
            result.reflection_feedback = json.dumps(
                {
                    "scores":           data.get("scores", {}),
                    "overall_score":    result.score,
                    "strengths":        data.get("strengths", []),
                    "improvements":     data.get("improvements", []),
                    "recommendation":   data.get("publish_recommendation", "unknown"),
                },
                indent=2,
            )

            recommendation = data.get("publish_recommendation", "")
            if recommendation == "reject":
                result.issues.append(
                    f"Editor recommendation: REJECT (overall score {result.score}/10). "
                    "The article needs a full rewrite — see reflection feedback."
                )
            elif recommendation == "revise":
                result.warnings.append(
                    f"Editor recommendation: REVISE before publishing (score {result.score}/10)."
                )

            if result.score < MIN_REFLECTION_SCORE:
                result.issues.append(
                    f"Overall quality score {result.score}/10 is below the publish threshold "
                    f"of {MIN_REFLECTION_SCORE}/10. See improvements in the reflection feedback."
                )

            time.sleep(1)
        except Exception as e:
            log.warning(f"[Guardrail] LLM reflection failed: {e}")
            result.score = 5  # neutral fallback
