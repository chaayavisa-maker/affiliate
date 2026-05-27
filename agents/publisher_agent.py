"""
Publisher agent: converts article dicts to MDX files and commits to GitHub.
GitHub Actions will auto-trigger a Vercel deploy after the commit.

Key change vs original
----------------------
publish(article, commit=True)
    - commit=True  (default, original behaviour): write file + git commit
    - commit=False (generate-only mode)          : write file only, no git ops

commit_files_from_manifest(manifest_path)
    Class-level helper called by publish.py in the publish workflow.
    Reads generated_manifest.json and commits every listed file.
"""

import json
import logging
import os
import subprocess
from datetime import datetime
from pathlib import Path
from site_config import BOT_GIT_EMAIL, BOT_GIT_NAME

log = logging.getLogger(__name__)

CONTENT_DIR = Path(__file__).parent.parent / "website" / "content" / "posts"


class PublisherAgent:
    def __init__(self):
        CONTENT_DIR.mkdir(parents=True, exist_ok=True)

    # ── Public API ─────────────────────────────────────────────────────────────

    def publish(self, article: dict, commit: bool = True) -> str:
        """
        Write the MDX file for *article*.

        Args:
            article: article dict produced by ContentAgent / SEOAgent.
            commit:  if True (default) also git-commit the file.
                     Set to False in --generate-only mode; the publish
                     workflow will commit later via commit_files_from_manifest().

        Returns:
            Absolute path of the written file (str).
        """
        mdx_content = self._build_mdx(article)
        file_path = CONTENT_DIR / f"{article['slug']}.mdx"
        file_path.write_text(mdx_content, encoding="utf-8")
        log.info(f"Written: {file_path}")

        if commit and os.getenv("GITHUB_ACTIONS"):
            self._git_commit(file_path, article["title"])

        return str(file_path)

    def push(self):
        """Push all local commits to origin."""
        try:
            subprocess.run(["git", "push"], check=True)
            log.info("Git push successful")
        except subprocess.CalledProcessError as e:
            log.error(f"Git push failed: {e}")
            raise

    @classmethod
    def commit_files_from_manifest(cls, manifest_path: str = "generated_manifest.json"):
        """
        Read the manifest written by orchestrator.py --generate-only and
        git-commit every article file listed in it.

        Called by publish.py in the publish workflow — the push is done
        separately so it remains independently retryable.
        """
        manifest_file = Path(manifest_path)
        if not manifest_file.exists():
            raise FileNotFoundError(
                f"Manifest not found: {manifest_path}\n"
                "Make sure the generate job uploaded it as an artifact."
            )

        manifest = json.loads(manifest_file.read_text())
        articles = manifest.get("articles", [])

        if not articles:
            log.warning("Manifest contains no articles — nothing to commit.")
            return []

        log.info(f"Committing {len(articles)} article(s) from manifest")

        agent = cls()
        committed = []
        for entry in articles:
            file_path = Path(entry["path"])
            if not file_path.exists():
                log.error(f"File listed in manifest not found on disk: {file_path}")
                continue
            try:
                agent._git_commit(file_path, entry["title"])
                committed.append(str(file_path))
                log.info(f"  ✓  committed {file_path.name}")
            except subprocess.CalledProcessError as exc:
                log.error(f"  ✗  git commit failed for {file_path.name}: {exc}")
                raise

        return committed

    # ── Private helpers ────────────────────────────────────────────────────────

    def _build_mdx(self, article: dict) -> str:
        tags_yaml = "\n".join(f'  - "{t}"' for t in article.get("tags", []))
        schema_json = json.dumps(article.get("schema", {}), indent=2)

        return f"""---
title: "{article['title'].replace('"', "'")}"
slug: "{article['slug']}"
date: "{article['created_at'][:10]}"
description: "{article['meta_description'].replace('"', "'")}"
category: "{article.get('category', 'productivity')}"
tags:
{tags_yaml}
ogImage: "{article.get('og_image', '/og/default.png')}"
---

export const schema = {schema_json}

{article['content']}

---

*Disclosure: This article contains affiliate links. We may earn a commission if you purchase through our links, at no extra cost to you. We only recommend tools we've genuinely evaluated.*
"""

    def _git_commit(self, file_path: Path, title: str):
        """Stage and commit a single file (does not push)."""
        try:
            subprocess.run(["git", "config", "user.email", BOT_GIT_EMAIL], check=True)
            subprocess.run(["git", "config", "user.name",  BOT_GIT_NAME],  check=True)
            subprocess.run(["git", "add", str(file_path)], check=True)

            # Also stage ancillary files if they exist
            sitemap = Path(__file__).parent.parent / "website" / "public" / "sitemap.xml"
            if sitemap.exists():
                subprocess.run(["git", "add", str(sitemap)], check=True)

            published_db = Path(__file__).parent.parent / "config" / "published_keywords.json"
            if published_db.exists():
                subprocess.run(["git", "add", str(published_db)], check=True)

            msg = f"[bot] Add article: {title[:60]}"
            subprocess.run(["git", "commit", "-m", msg], check=True)
            log.info(f"Committed: {title}")
        except subprocess.CalledProcessError as e:
            log.error(f"Git operation failed: {e}")
            raise
