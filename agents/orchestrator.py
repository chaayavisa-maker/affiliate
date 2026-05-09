#!/usr/bin/env python3
"""
Main orchestrator — runs every day via GitHub Actions.
Coordinates: keyword research → content generation → SEO → publish.
Uses Groq API (free tier: 14,400 req/day, 30 req/min with LLaMA 3.3 70B).
"""

import os
import sys
import json
import logging
from datetime import datetime
from pathlib import Path

from keyword_agent import KeywordAgent
from content_agent import ContentAgent
from seo_agent import SEOAgent
from publisher_agent import PublisherAgent

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
log = logging.getLogger(__name__)

ARTICLES_PER_RUN = int(os.getenv("ARTICLES_PER_RUN", "2"))


def run():
    log.info("=== Autonomous affiliate engine starting ===")
    log.info(f"Target: {ARTICLES_PER_RUN} articles this run")

    groq_key = os.environ.get("GROQ_API_KEY")
    if not groq_key:
        log.error("GROQ_API_KEY not set. Get a free key at console.groq.com")
        sys.exit(1)

    keyword_agent = KeywordAgent(groq_key)
    content_agent = ContentAgent(groq_key)
    seo_agent = SEOAgent(groq_key)
    publisher = PublisherAgent()

    log.info("Step 1: Keyword research")
    keywords = keyword_agent.get_keywords(count=ARTICLES_PER_RUN)
    log.info(f"Keywords selected: {[k['keyword'] for k in keywords]}")

    published = []
    for kw in keywords:
        log.info(f"\n--- Processing: {kw['keyword']} ---")

        log.info("Step 2: Generating article content")
        article = content_agent.write_article(kw)

        log.info("Step 3: SEO optimization")
        article = seo_agent.optimize(article)

        log.info("Step 4: Publishing")
        path = publisher.publish(article)
        published.append(path)
        log.info(f"Published: {path}")

    log.info(f"\n=== Done. Published {len(published)} articles ===")
    for p in published:
        log.info(f"  {p}")

    # Write run summary
    summary = {
        "run_at": datetime.utcnow().isoformat(),
        "articles_published": len(published),
        "articles": published,
    }
    Path("run_summary.json").write_text(json.dumps(summary, indent=2))
    log.info("Run summary saved to run_summary.json")


if __name__ == "__main__":
    run()
