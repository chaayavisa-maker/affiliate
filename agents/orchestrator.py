#!/usr/bin/env python3
"""
Main orchestrator — runs every day via GitHub Actions.
Pipeline: keyword research → content generation → SEO → guardrail checks → publish.

Guardrail failures trigger a content retry (up to MAX_RETRIES).
Articles that still fail after retries are skipped and logged; the run continues
with the next keyword so one bad topic never blocks the whole batch.
"""

import json
import logging
import os
import sys
from datetime import datetime
from pathlib import Path

from keyword_agent  import KeywordAgent
from content_agent  import ContentAgent
from seo_agent      import SEOAgent
from publisher_agent import PublisherAgent
from guardrail_agent import GuardrailAgent, MAX_RETRIES

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

    keyword_agent  = KeywordAgent(groq_key)
    content_agent  = ContentAgent(groq_key)
    seo_agent      = SEOAgent(groq_key)
    guardrail_agent = GuardrailAgent(groq_key)
    publisher      = PublisherAgent()

    # ── Step 1: Keyword research ───────────────────────────────────────────────
    log.info("Step 1: Keyword research (with semantic dedup)")
    keywords = keyword_agent.get_keywords(count=ARTICLES_PER_RUN)
    if not keywords:
        log.error("No fresh keywords found — all topics already covered. Exiting.")
        sys.exit(0)
    log.info(f"Keywords selected: {[k['keyword'] for k in keywords]}")

    published   = []
    skipped     = []

    for kw in keywords:
        log.info(f"\n{'='*60}")
        log.info(f"Processing: {kw['keyword']}")
        log.info(f"{'='*60}")

        article        = None
        guardrail_result = None
        correction_brief = ""

        for attempt in range(1, MAX_RETRIES + 2):  # +2: initial attempt + retries
            log.info(f"  Content generation attempt {attempt}/{MAX_RETRIES + 1}")

            # ── Step 2: Generate content ───────────────────────────────────────
            article = content_agent.write_article(kw, correction_brief=correction_brief)

            # ── Step 3: SEO optimisation ───────────────────────────────────────
            article = seo_agent.optimize(article)

            # ── Step 4: Guardrail validation ───────────────────────────────────
            log.info("  Step 4: Guardrail checks")
            guardrail_result = guardrail_agent.validate(article)

            if guardrail_result.passed:
                log.info(f"  Guardrails PASSED (score {guardrail_result.score}/10) ✓")
                break  # proceed to publish

            log.warning(
                f"  Guardrails FAILED on attempt {attempt} "
                f"(score {guardrail_result.score}/10, "
                f"{len(guardrail_result.issues)} issue(s))"
            )

            if attempt <= MAX_RETRIES:
                correction_brief = guardrail_agent.build_retry_instructions(guardrail_result)
                log.info(f"  Retrying with correction brief:\n{correction_brief}")
            else:
                log.error(
                    f"  Exhausted {MAX_RETRIES} retries for '{kw['keyword']}' — skipping.\n"
                    f"  Final guardrail summary:\n{guardrail_result.summary()}"
                )
                article = None  # signal: do not publish

        if article is None:
            skipped.append(kw["keyword"])
            continue

        # ── Step 5: Publish ────────────────────────────────────────────────────
        log.info("  Step 5: Publishing")
        path = publisher.publish(article)
        published.append(path)
        log.info(f"  Published: {path}")

        # Log reflection feedback for monitoring
        if guardrail_result and guardrail_result.reflection_feedback:
            log.info(f"  Editor reflection:\n{guardrail_result.reflection_feedback}")

    # Push all commits in one shot
    if os.getenv("GITHUB_ACTIONS") and published:
        publisher.push()

    # ── Run summary ────────────────────────────────────────────────────────────
    log.info(f"\n{'='*60}")
    log.info(f"Run complete — published {len(published)}, skipped {len(skipped)}")
    for p in published:
        log.info(f"  ✓  {p}")
    for s in skipped:
        log.warning(f"  ✗  skipped (failed guardrails): {s}")

    summary = {
        "run_at":              datetime.utcnow().isoformat(),
        "articles_published":  len(published),
        "articles_skipped":    len(skipped),
        "published":           published,
        "skipped":             skipped,
    }
    Path("run_summary.json").write_text(json.dumps(summary, indent=2))
    log.info("Run summary saved to run_summary.json")


if __name__ == "__main__":
    run()
