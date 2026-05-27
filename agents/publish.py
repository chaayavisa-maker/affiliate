#!/usr/bin/env python3
"""
publish.py — entry point for the publish workflow.

Reads agents/generated_manifest.json (produced by orchestrator.py --generate-only
and downloaded as a GitHub Actions artifact), commits every article file listed
in it, then pushes all commits in one shot.

Usage
-----
    python publish.py                        # uses generated_manifest.json
    python publish.py --manifest path/to/manifest.json

Why separate from orchestrator.py?
-----------------------------------
Keeping git commit + push in its own script means the publish workflow can be
triggered (or re-triggered) independently of generation — no content is ever
rewritten just because a push failed.
"""

import argparse
import logging
import os
import sys
from pathlib import Path

from publisher_agent import PublisherAgent

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
log = logging.getLogger(__name__)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Commit and push pre-generated articles")
    parser.add_argument(
        "--manifest",
        default="generated_manifest.json",
        help="Path to the manifest JSON written by orchestrator.py --generate-only "
             "(default: generated_manifest.json)",
    )
    return parser.parse_args()


def run(manifest_path: str):
    log.info("=== Publish step starting ===")
    log.info(f"Manifest: {manifest_path}")

    if not os.getenv("GITHUB_ACTIONS"):
        log.warning(
            "GITHUB_ACTIONS env var not set — running outside CI. "
            "Git operations will still execute; make sure credentials are configured."
        )

    # Commit all files listed in the manifest
    committed = PublisherAgent.commit_files_from_manifest(manifest_path)

    if not committed:
        log.warning("No files were committed — nothing to push.")
        sys.exit(0)

    log.info(f"Committed {len(committed)} file(s) — pushing now")

    # Push all commits in one shot
    publisher = PublisherAgent()
    publisher.push()

    log.info("=== Publish step done ===")
    for f in committed:
        log.info(f"  ✓  {f}")


if __name__ == "__main__":
    args = parse_args()
    run(args.manifest)
