"""
─────────────────────────────────────────────────────────────────────────────
SITE CONFIG — single source of truth for all Python agents
─────────────────────────────────────────────────────────────────────────────
Change your domain or brand name HERE and nowhere else.
The SEO agent, publisher, review agent, and sitemap generator all read
from this module.

In GitHub Actions you can also override SITE_URL via a repository secret
or variable — the os.getenv() calls below honour that.
─────────────────────────────────────────────────────────────────────────────
"""

import os

# Strip trailing slash so callers can safely append paths
SITE_URL: str = os.getenv("SITE_URL", "https://affiliate-silk-six.vercel.app").rstrip("/")

SITE_NAME: str    = "AI Tools Hub"
SITE_TAGLINE: str = "Expert Reviews & Comparisons"

TWITTER_HANDLE: str = "@AIToolsHub"
TWITTER_URL: str    = "https://twitter.com/AIToolsHub"

LOGO_URL: str   = f"{SITE_URL}/logo.png"
AUTHOR_NAME: str = f"{SITE_NAME} Editorial Team"

# Git identity used when the bot commits updated/new articles
BOT_GIT_EMAIL: str = "chaaya.visa@gmail.com"
BOT_GIT_NAME: str  = "AI Content Bot"


def post_url(slug: str) -> str:
    """Full canonical URL for a blog post slug."""
    return f"{SITE_URL}/blog/{slug}"
