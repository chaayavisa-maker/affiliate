"""
SEO agent: adds structured data, internal links, and optimizes content.
Also updates the sitemap and generates Open Graph data.
"""

import json
import re
import time
import os
import logging
from pathlib import Path
from datetime import datetime

from groq import Groq

log = logging.getLogger(__name__)

CONTENT_DIR = Path(__file__).parent.parent / "website" / "content" / "posts"
SITEMAP_FILE = Path(__file__).parent.parent / "website" / "public" / "sitemap.xml"


class SEOAgent:
    def __init__(self, groq_api_key: str):
        self.client = Groq(api_key=groq_api_key)

    def optimize(self, article: dict) -> dict:
        article = self._add_schema(article)
        article = self._add_internal_links(article)
        article = self._generate_og_image_prompt(article)
        article = self._add_tags(article)
        self._update_sitemap(article)
        return article

    def _add_schema(self, article: dict) -> dict:
        """Generate JSON-LD structured data for the article."""
        schema = {
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": article["title"],
            "description": article["meta_description"],
            "datePublished": article["created_at"],
            "dateModified": article["created_at"],
            "author": {
                "@type": "Organization",
                "name": "AI Tools Hub",
                "url": "https://affiliate-silk-six.vercel.app"
            },
            "publisher": {
                "@type": "Organization",
                "name": "AI Tools Hub",
                "logo": {
                    "@type": "ImageObject",
                    "url": "https://affiliate-silk-six.vercel.app/logo.png"
                }
            },
            "mainEntityOfPage": {
                "@type": "WebPage",
                "@id": f"https://affiliate-silk-six.vercel.app}/blog/{article['slug']}"
            }
        }

        # Add FAQ schema if article has FAQ section
        if "## Frequently Asked" in article["content"]:
            schema["@type"] = ["Article", "FAQPage"]
            schema["mainEntity"] = self._extract_faq_schema(article["content"])

        article["schema"] = schema
        return article

    def _extract_faq_schema(self, content: str) -> list:
        """Extract Q&A pairs from FAQ section for schema."""
        faq_section = re.search(
            r'## Frequently Asked Questions(.*?)(?=##|\Z)', content, re.DOTALL
        )
        if not faq_section:
            return []

        pairs = []
        questions = re.findall(r'\*\*(.+?)\*\*\s*\n+(.+?)(?=\n\*\*|\Z)', faq_section.group(1), re.DOTALL)
        for q, a in questions[:5]:
            pairs.append({
                "@type": "Question",
                "name": q.strip(),
                "acceptedAnswer": {"@type": "Answer", "text": a.strip()[:500]}
            })
        return pairs

    def _add_internal_links(self, article: dict) -> dict:
        """Find existing posts and add internal links."""
        existing = []
        if CONTENT_DIR.exists():
            for f in CONTENT_DIR.glob("*.mdx"):
                try:
                    text = f.read_text()
                    slug_match = re.search(r'^slug:\s*(.+)$', text, re.MULTILINE)
                    title_match = re.search(r'^title:\s*"(.+)"$', text, re.MULTILINE)
                    if slug_match and title_match:
                        existing.append({
                            "slug": slug_match.group(1).strip(),
                            "title": title_match.group(1).strip(),
                        })
                except Exception:
                    pass

        if not existing:
            article["internal_links_added"] = 0
            return article

        # Ask LLM to suggest where to insert internal links
        if len(existing) > 0:
            prompt = f"""Given this article excerpt and these existing articles on our site,
suggest 2-3 natural internal link placements.

CURRENT ARTICLE: "{article['title']}"
EXISTING ARTICLES: {json.dumps([e['title'] for e in existing[:10]], indent=2)}

Return JSON array:
[{{"anchor": "exact text in article to make a link", "target_title": "existing article title"}}]

Return ONLY the JSON array."""

            try:
                response = self.client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=300,
                    temperature=0.3,
                )
                raw = response.choices[0].message.content
                match = re.search(r'\[.*?\]', raw, re.DOTALL)
                if match:
                    suggestions = json.loads(match.group())
                    content = article["content"]
                    links_added = 0
                    for s in suggestions[:2]:
                        anchor = s.get("anchor", "")
                        target = next((e for e in existing if e["title"] == s.get("target_title")), None)
                        if anchor and target and anchor in content:
                            replacement = f"[{anchor}](/blog/{target['slug']})"
                            content = content.replace(anchor, replacement, 1)
                            links_added += 1
                    article["content"] = content
                    article["internal_links_added"] = links_added
                    time.sleep(1)
            except Exception as e:
                log.warning(f"Internal link generation failed: {e}")
                article["internal_links_added"] = 0

        return article

    def _generate_og_image_prompt(self, article: dict) -> dict:
        """Generate a text prompt for OG image (you can use this with DALL-E or Stable Diffusion)."""
        article["og_image_prompt"] = (
            f"Professional tech blog header image, dark background with gradient, "
            f"white text saying '{article['title'][:50]}', "
            f"AI robot icons, modern minimalist design, 1200x630 pixels"
        )
        article["og_image"] = f"/og/{article['slug']}.png"
        return article

    def _add_tags(self, article: dict) -> dict:
        """Add relevant tags based on content."""
        tag_map = {
            "writing": ["AI Writing", "Content Creation", "Copywriting"],
            "design": ["AI Art", "Image Generation", "Design Tools"],
            "coding": ["AI Coding", "Developer Tools", "Productivity"],
            "chatbots": ["AI Chatbots", "LLMs", "Productivity"],
            "video": ["AI Video", "Video Editing", "Content Creation"],
            "productivity": ["AI Tools", "Productivity", "Automation"],
        }
        cat = article.get("category", "productivity")
        article["tags"] = tag_map.get(cat, ["AI Tools", "Productivity"])
        return article

    def _update_sitemap(self, article: dict):
        """Append this article to the sitemap."""
        SITEMAP_FILE.parent.mkdir(parents=True, exist_ok=True)

        today = datetime.utcnow().strftime("%Y-%m-%d")
        new_url = f"""  <url>
    <loc>https://affiliate-silk-six.vercel.app/blog/{article["slug"]}</loc>
    <lastmod>{today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>"""

        if SITEMAP_FILE.exists():
            sitemap = SITEMAP_FILE.read_text()
            sitemap = sitemap.replace("</urlset>", f"{new_url}\n</urlset>")
        else:
            sitemap = f"""<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://YOUR_DOMAIN.com</loc>
    <lastmod>{today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
{new_url}
</urlset>"""

        SITEMAP_FILE.write_text(sitemap)
        log.info(f"Sitemap updated: {SITEMAP_FILE}")
