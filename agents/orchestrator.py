#!/usr/bin/env python3
"""
Main orchestrator — runs every day via GitHub Actions.

Pipeline:
  1. Build ContentCatalogue  (single disk scan — reads title, description, slug,
                               category from every existing MDX file)
  2. Keyword research         (semantic dedup + category-weighted seed selection)
  3. Pre-flight check         (title-level duplicate check BEFORE any writing)
  4. Content generation + SEO (retried up to MAX_RETRIES on fixable failures)
  5. Guardrail validation     (format / quality / fact / reflection)
  6. Publish + catalogue update (register_new() keeps in-run state current so
                                  article 2 can't duplicate article 1 in same run)

Duplicate topics are caught in Steps 2 and 3, and skipped immediately — no LLM
tokens are wasted writing an article that will be rejected for topic overlap.

Retries are only triggered for fixable issues (word count, format, banned
phrases, low reflection score). Non-retryable failures (duplicates, fatal fact
errors) abort that keyword immediately and move on.
"""

import json
import logging
import os
import sys
from datetime import datetime
from pathlib import Path

from keyword_agent   import KeywordAgent
from content_agent   import ContentAgent
from seo_agent       import SEOAgent
from publisher_agent import PublisherAgent
from guardrail_agent import GuardrailAgent, MAX_RETRIES
from content_catalogue import ContentCatalogue

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
log = logging.getLogger(__name__)

ARTICLES_PER_RUN = int(os.getenv("ARTICLES_PER_RUN", "2"))


def run():
    log.info("=== Autonomous affiliate engine starting ===")
    log.info(f"Target: {ARTICLES_PER_RUN} article(s) this run")

    groq_key = os.environ.get("GROQ_API_KEY")
    if not groq_key:
        log.error("GROQ_API_KEY not set — get a free key at console.groq.com")
        sys.exit(1)

    # ── Step 0: Build the shared content catalogue ─────────────────────────────
    # Scans the MDX posts directory once. Both keyword_agent and guardrail_agent
    # read from this same instance, so they always agree on what exists.
    log.info("Step 0: Building content catalogue from existing posts")
    catalogue = ContentCatalogue()
    log.info(
        f"         {len(catalogue.all_entries())} articles loaded | "
        f"coverage: {catalogue.coverage_by_category()}"
    )

    keyword_agent   = KeywordAgent(groq_key, catalogue)
    content_agent   = ContentAgent(groq_key)
    seo_agent       = SEOAgent(groq_key)
    guardrail_agent = GuardrailAgent(groq_key, catalogue)
    publisher       = PublisherAgent()

    published: list[str] = []
    skipped:   list[str] = []

    # ── Step 1: Keyword research ───────────────────────────────────────────────
    log.info("Step 1: Keyword research (category-weighted + semantic dedup)")
    keywords = keyword_agent.get_keywords(count=ARTICLES_PER_RUN)
    if not keywords:
        log.error("No fresh keywords found — all topics already covered. Exiting.")
        sys.exit(0)
    log.info(f"Keywords selected: {[k['keyword'] for k in keywords]}")

    # ── Step 2: Pre-flight title duplicate check (zero content-generation cost) ─
    log.info("Step 2: Pre-flight title generation & duplicate check")
    viable_keywords = []
    for kw in keywords:
        log.info(f"  Checking: '{kw['keyword']}'")
        candidate_title = content_agent.generate_title(kw)
        if not candidate_title:
            log.warning(f"  Could not generate title — keeping keyword anyway")
            viable_keywords.append(kw)
            continue

        is_dup, reason = guardrail_agent.is_duplicate_title(candidate_title)
        if is_dup:
            log.warning(
                f"  ✗ Pre-flight SKIP — title too similar to an existing article.\n"
                f"    Proposed : \"{candidate_title}\"\n"
                f"    Reason   : {reason}"
            )
            skipped.append(kw["keyword"])
        else:
            log.info(f"  ✓ \"{candidate_title}\" — no duplicate found, proceeding")
            kw["_preflight_title"] = candidate_title  # cache so write_article can reuse it
            viable_keywords.append(kw)

    if not viable_keywords:
        log.error("All candidate topics were duplicates — nothing to write today.")
        _write_summary(published, skipped)
        sys.exit(0)

    # ── Steps 3-5: Write → SEO → Guardrail → Publish ──────────────────────────
    for kw in viable_keywords:
        log.info(f"\n{'='*60}")
        log.info(f"Processing: {kw['keyword']}")
        log.info(f"{'='*60}")

        article          = None
        guardrail_result = None
        correction_brief = ""

        for attempt in range(1, MAX_RETRIES + 2):
            log.info(f"  Step 3: Content generation (attempt {attempt}/{MAX_RETRIES + 1})")
            article = content_agent.write_article(kw, correction_brief=correction_brief)

            log.info("  Step 3b: SEO optimisation")
            article = seo_agent.optimize(article)

            log.info("  Step 4: Guardrail validation")
            guardrail_result = guardrail_agent.validate(article)

            if guardrail_result.passed:
                log.info(f"  Guardrails PASSED (score {guardrail_result.score}/10) ✓")
                break

            log.warning(
                f"  Guardrails FAILED — attempt {attempt}/{MAX_RETRIES + 1}  "
                f"score {guardrail_result.score}/10  "
                f"issues: {len(guardrail_result.issues)}"
            )

            # Non-retryable failures: abort immediately, no point rewriting
            if guardrail_result.non_retryable_issues:
                log.error(
                    f"  Non-retryable failure(s) — aborting '{kw['keyword']}':\n"
                    + "\n".join(f"    ✗ {i}" for i in guardrail_result.non_retryable_issues)
                )
                article = None
                break

            if attempt <= MAX_RETRIES:
                correction_brief = guardrail_agent.build_retry_instructions(guardrail_result)
                log.info(f"  Retrying with correction brief:\n{correction_brief}")
            else:
                log.error(
                    f"  Exhausted {MAX_RETRIES} retries for '{kw['keyword']}' — skipping.\n"
                    f"  Final summary:\n{guardrail_result.summary()}"
                )
                article = None

        if article is None:
            skipped.append(kw["keyword"])
            continue

        log.info("  Step 5: Publishing")
        path = publisher.publish(article)
        published.append(path)
        log.info(f"  Published: {path}")

        # ── Update catalogue so the next keyword in this run sees this article ──
        # Without this, article 2 could be a near-duplicate of article 1 because
        # article 1 isn't on disk yet when article 2's dedup checks run.
        catalogue.register_new(article)
        log.info("  Catalogue updated with newly published article")

        if guardrail_result and guardrail_result.reflection_feedback:
            log.info(f"  Editor reflection:\n{guardrail_result.reflection_feedback}")

    # Push all commits in one shot
    if os.getenv("GITHUB_ACTIONS") and published:
        publisher.push()

    log.info(f"\n{'='*60}")
    log.info(f"Done — published {len(published)}, skipped {len(skipped)}")
    for p in published:
        log.info(f"  ✓  {p}")
    for s in skipped:
        log.warning(f"  ✗  {s}")

    _write_summary(published, skipped)


def _write_summary(published: list, skipped: list):
    summary = {
        "run_at":             datetime.utcnow().isoformat(),
        "articles_published": len(published),
        "articles_skipped":   len(skipped),
        "published":          published,
        "skipped":            skipped,
    }
    Path("run_summary.json").write_text(json.dumps(summary, indent=2))
    log.info("Run summary saved to run_summary.json")


if __name__ == "__main__":
    run()
