"""
Publisher agent: converts article dicts to MDX files and commits to GitHub.
GitHub Actions will auto-trigger a Vercel deploy after the commit.
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

    def publish(self, article: dict) -> str:
        """Write MDX file and git-commit it. Returns the file path."""
        mdx_content = self._build_mdx(article)
        file_path = CONTENT_DIR / f"{article['slug']}.mdx"
        file_path.write_text(mdx_content, encoding="utf-8")
        log.info(f"Written: {file_path}")

        # Commit to git (GitHub Actions has git credentials via GITHUB_TOKEN)
        if os.getenv("GITHUB_ACTIONS"):
            self._git_commit(file_path, article["title"])

        return str(file_path)

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
        """Commit and push the new article."""
        try:
            subprocess.run(["git", "config", "user.email", BOT_GIT_EMAIL], check=True)
            subprocess.run(["git", "config", "user.name", BOT_GIT_NAME], check=True)
            subprocess.run(["git", "add", str(file_path)], check=True)

            # Also add updated sitemap
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
            
    def push(self):
        """Push all commits at once."""
        try:
            subprocess.run(["git", "push"], check=True)
            log.info("Git push successful")
        except subprocess.CalledProcessError as e:
            log.error(f"Git push failed: {e}")
            raise
