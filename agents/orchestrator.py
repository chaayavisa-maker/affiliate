#!/usr/bin/env python3
"""
Main orchestrator — runs every day via GitHub Actions.

Pipeline:
  1. Keyword research  (semantic dedup at keyword level)
  2. Pre-flight check  (title-level duplicate check BEFORE any writing)
  3. Content generation + SEO  (retried up to MAX_RETRIES on fixable failures)
  4. Guardrail validation      (format / quality / fact / reflection)
  5. Publish

Duplicate topics are caught in Step 2 and skipped immediately — no LLM tokens
are wasted writing an article that will be rejected for topic overlap.

Retries are only triggered for fixable issues (word count, format, banned phrases,
low reflection score). Non-retryable failures (duplicates, fatal fact errors)
abort that keyword immediately and move on.

Modes
-----
  Default (no flag)   : full pipeline — generate + git commit + git push
  --generate-only     : generate + write MDX files to disk, NO git ops.
                        Saves agents/generated_manifest.json so publish.py
                        can pick up exactly which files were produced.
"""

import argparse
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

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
log = logging.getLogger(__name__)

ARTICLES_PER_RUN = int(os.getenv("ARTICLES_PER_RUN", "2"))


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Affiliate content orchestrator")
    parser.add_argument(
        "--generate-only",
        action="store_true",
        help=(
            "Run the full generation pipeline but skip all git operations. "
            "Writes MDX files to disk and saves agents/generated_manifest.json. "
            "Use publish.py (or the publish workflow) to commit and push afterwards."
        ),
    )
    return parser.parse_args()


def run(generate_only: bool = False):
    mode = "GENERATE-ONLY" if generate_only else "GENERATE + PUBLISH"
    log.info(f"=== Autonomous affiliate engine starting [{mode}] ===")
    log.info(f"Target: {ARTICLES_PER_RUN} article(s) this run")

    groq_key = os.environ.get("GROQ_API_KEY")
    if not groq_key:
        log.error("GROQ_API_KEY not set — get a free key at console.groq.com")
        sys.exit(1)

    keyword_agent   = KeywordAgent(groq_key)
    content_agent   = ContentAgent(groq_key)
    seo_agent       = SEOAgent(groq_key)
    guardrail_agent = GuardrailAgent(groq_key)
    # In generate-only mode the publisher writes files but never calls git
    publisher       = PublisherAgent()

    published: list[dict] = []   # {"path": ..., "title": ..., "slug": ...}
    skipped:   list[str]  = []

    # ── Step 1: Keyword research ───────────────────────────────────────────────
    log.info("Step 1: Keyword research (with semantic dedup)")
    keywords = keyword_agent.get_keywords(count=ARTICLES_PER_RUN * 3)
    if not keywords:
        log.error("No fresh keywords found — all topics already covered. Exiting.")
        sys.exit(0)
    log.info(f"Keywords selected: {[k['keyword'] for k in keywords]}")

    # ── Step 2: Pre-flight title duplicate check ────────────────────────────────
    log.info("Step 2: Pre-flight title generation & duplicate check")
    viable_keywords = []
    for kw in keywords:
        log.info(f"  Checking: '{kw['keyword']}'")
        candidate_title = content_agent.generate_title(kw)
        if not candidate_title:
            log.warning("  Could not generate title — keeping keyword anyway")
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
            kw["_preflight_title"] = candidate_title
            viable_keywords.append(kw)

    if not viable_keywords:
        log.error("All candidate topics were duplicates — nothing to write today.")
        _write_summary([], skipped)
        _write_manifest([], skipped)
        sys.exit(0)

    viable_keywords = viable_keywords[:ARTICLES_PER_RUN]

    # ── Steps 3-4: Write → SEO → Guardrail ────────────────────────────────────
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

        # ── Step 5: Write file (always) — git ops depend on mode ───────────────
        log.info(f"  Step 5: Writing article ({'file only' if generate_only else 'file + git commit'})")
        path = publisher.publish(article, commit=not generate_only)
        published.append({"path": path, "title": article["title"], "slug": article["slug"]})
        log.info(f"  Written: {path}")

        if guardrail_result and guardrail_result.reflection_feedback:
            log.info(f"  Editor reflection:\n{guardrail_result.reflection_feedback}")

    # ── Step 6: Push (full mode only) ─────────────────────────────────────────
    if not generate_only and os.getenv("GITHUB_ACTIONS") and published:
        log.info("Step 6: Git push")
        publisher.push()
    elif generate_only:
        log.info("Step 6: Skipped (--generate-only mode) — run publish.py to commit & push")

    log.info(f"\n{'='*60}")
    log.info(f"Done — {'generated' if generate_only else 'published'} {len(published)}, skipped {len(skipped)}")
    for p in published:
        log.info(f"  ✓  {p['path']}")
    for s in skipped:
        log.warning(f"  ✗  {s}")

    published_paths = [p["path"] for p in published]
    _write_summary(published_paths, skipped)
    _write_manifest(published, skipped)


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


def _write_manifest(published: list[dict], skipped: list[str]):
    """
    Writes generated_manifest.json — consumed by publish.py in the publish job.

    published: list of {"path": str, "title": str, "slug": str}
    """
    manifest = {
        "generated_at": datetime.utcnow().isoformat(),
        "articles":     published,
        "skipped":      skipped,
    }
    Path("generated_manifest.json").write_text(json.dumps(manifest, indent=2))
    log.info("Manifest saved to generated_manifest.json")


if __name__ == "__main__":
    args = parse_args()
    run(generate_only=args.generate_only)
