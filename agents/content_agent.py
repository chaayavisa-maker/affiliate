"""
Content agent: generates complete 1500-2000 word affiliate review articles.
Uses Groq LLaMA 3.3 70B (free tier). Embeds affiliate links automatically.
Produces MDX-compatible markdown with frontmatter.
"""

import json
import re
import time
import logging
from datetime import datetime
from pathlib import Path

from groq import Groq

log = logging.getLogger(__name__)

# Affiliate programs with real programs you should join:
# - ShareASale: app.shareasale.com
# - Impact: impact.com
# - PartnerStack: partnerstack.com (best for SaaS)
AFFILIATE_PRODUCTS = {
    "writing": [
        {"name": "Jasper AI", "url": "https://www.jasper.ai?fpr=YOUR_ID", "commission": "30%", "price": "$49/mo"},
        {"name": "Copy.ai", "url": "https://www.copy.ai?via=YOUR_ID", "commission": "45%", "price": "$49/mo"},
        {"name": "Writesonic", "url": "https://writesonic.com?via=YOUR_ID", "commission": "30%", "price": "$19/mo"},
    ],
    "image": [
        {"name": "Midjourney", "url": "https://midjourney.com", "commission": "N/A", "price": "$10/mo"},
        {"name": "Adobe Firefly", "url": "https://adobe.com/products/firefly?via=YOUR_ID", "commission": "85%", "price": "$4.99/mo"},
        {"name": "Canva AI", "url": "https://canva.com/affiliates/YOUR_ID", "commission": "30%", "price": "$15/mo"},
    ],
    "coding": [
        {"name": "GitHub Copilot", "url": "https://github.com/features/copilot", "commission": "N/A", "price": "$10/mo"},
        {"name": "Cursor", "url": "https://cursor.sh", "commission": "N/A", "price": "$20/mo"},
        {"name": "Tabnine", "url": "https://www.tabnine.com?ref=YOUR_ID", "commission": "20%", "price": "$12/mo"},
    ],
    "general": [
        {"name": "Notion AI", "url": "https://notion.so?r=YOUR_ID", "commission": "20%", "price": "$10/mo"},
        {"name": "Grammarly", "url": "https://grammarly.com?via=YOUR_ID", "commission": "$20 per sale", "price": "$12/mo"},
        {"name": "Otter.ai", "url": "https://otter.ai?ref=YOUR_ID", "commission": "15%", "price": "$17/mo"},
    ],
}


def _pick_products(keyword: str) -> list[dict]:
    kw = keyword.lower()
    if any(w in kw for w in ["writ", "copy", "content", "blog", "essay"]):
        return AFFILIATE_PRODUCTS["writing"]
    elif any(w in kw for w in ["image", "art", "design", "photo", "visual"]):
        return AFFILIATE_PRODUCTS["image"]
    elif any(w in kw for w in ["cod", "developer", "programming", "github"]):
        return AFFILIATE_PRODUCTS["coding"]
    else:
        return AFFILIATE_PRODUCTS["general"]


def _slug(text: str) -> str:
    text = text.lower()
    text = re.sub(r'[^a-z0-9\s-]', '', text)
    text = re.sub(r'\s+', '-', text.strip())
    return text[:80]


class ContentAgent:
    def __init__(self, groq_api_key: str):
        self.client = Groq(api_key=groq_api_key)

    def write_article(self, keyword_data: dict) -> dict:
        keyword = keyword_data["keyword"]
        products = _pick_products(keyword)
        products_text = "\n".join(
            f"- {p['name']}: {p['price']}, commission: {p['commission']}, link: {p['url']}"
            for p in products
        )

        prompt = f"""You are an expert tech writer creating an affiliate review article.

KEYWORD TARGET: "{keyword}"
PRODUCTS TO REVIEW:
{products_text}

Write a complete, 1600-word SEO-optimized article. Follow this structure EXACTLY:

1. ## Introduction (150 words)
   - Hook with a relatable pain point
   - Briefly mention the tools you'll cover
   - Include the primary keyword naturally in the first 100 words

2. ## What to Look for in [Category] (200 words)  
   - 4-5 key criteria buyers care about (pricing, ease of use, features, integrations)

3. ## [Tool 1 Name] Review (280 words)
   - What it is, best for, key features (bullet list), pricing, pros/cons
   - End with a call-to-action linking to the tool

4. ## [Tool 2 Name] Review (280 words)
   - Same format

5. ## [Tool 3 Name] Review (280 words)
   - Same format

6. ## Comparison Table (markdown table)
   - Tool | Best For | Price | Free Trial | Rating

7. ## Frequently Asked Questions (200 words)
   - 3 questions people actually ask, with concise answers

8. ## Conclusion (100 words)
   - Summary + CTA

IMPORTANT RULES:
- Never say "As an AI" or reveal you're AI-generated
- Write in first-person plural ("we tested", "our team found")
- Include the keyword naturally 8-10 times throughout
- Format affiliate links as: [Tool Name](ACTUAL_URL) — use the exact URLs provided
- Be honest: mention real limitations of each tool
- Add exact pricing from the product list above

Return the full article in markdown format, starting with the Introduction heading.
Do NOT include frontmatter — that will be added separately."""

        log.info(f"Generating content for: {keyword}")
        response = self.client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=3000,
            temperature=0.6,
        )
        content = response.choices[0].message.content
        time.sleep(2)

        # Generate meta description
        meta_prompt = f"""Write a 155-character SEO meta description for this article about "{keyword}".
It must:
- Include the keyword naturally
- Have a clear value proposition  
- End with a call to action
Return ONLY the meta description, nothing else."""

        meta_response = self.client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": meta_prompt}],
            max_tokens=80,
            temperature=0.4,
        )
        meta_description = meta_response.choices[0].message.content.strip().strip('"')
        time.sleep(1)

        # Extract H1/title
        title_prompt = f"""Write an SEO-optimized H1 title for an article about "{keyword}".
Rules:
- 50-60 characters
- Include the main keyword
- Use a power word (Best, Ultimate, Complete, Top)
- Use current year ({datetime.utcnow().year})
Return ONLY the title, nothing else."""

        title_response = self.client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": title_prompt}],
            max_tokens=50,
            temperature=0.4,
        )
        title = title_response.choices[0].message.content.strip().strip('"')
        time.sleep(1)

        return {
            "keyword": keyword,
            "title": title,
            "slug": _slug(title),
            "meta_description": meta_description,
            "content": content,
            "products": products,
            "created_at": datetime.utcnow().isoformat(),
            "category": _categorize(keyword),
        }


def _categorize(keyword: str) -> str:
    kw = keyword.lower()
    if any(w in kw for w in ["writ", "copy", "content", "blog"]):
        return "writing"
    elif any(w in kw for w in ["image", "art", "design"]):
        return "design"
    elif any(w in kw for w in ["cod", "developer", "programming"]):
        return "coding"
    elif any(w in kw for w in ["video", "edit"]):
        return "video"
    elif any(w in kw for w in ["chat", "assistant", "llm"]):
        return "chatbots"
    return "productivity"
