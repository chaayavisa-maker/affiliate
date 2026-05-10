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

    def write_article(self, keyword_data: dict, correction_brief: str = "") -> dict:
        """
        Generate a complete affiliate review article for the given keyword.

        Args:
            keyword_data:     Dict from KeywordAgent with 'keyword', 'intent', etc.
            correction_brief: Non-empty string on retries — contains guardrail failure
                              details so the model can fix specific problems.
        """
        keyword = keyword_data["keyword"]
        products = _pick_products(keyword)
        products_text = "\n".join(
            f"- {p['name']}: {p['price']}, commission: {p['commission']}, link: {p['url']}"
            for p in products
        )

        # On retries, prepend the correction brief so the model knows what to fix
        retry_block = ""
        if correction_brief:
            retry_block = (
                f"\n\nCRITICAL — THIS IS A RETRY. A previous draft was rejected. "
                f"You MUST address ALL of the following issues in this new draft:\n"
                f"{correction_brief}\n"
            )

        prompt = f"""You are an expert tech writer creating an affiliate review article.{retry_block}

KEYWORD TARGET: "{keyword}"
CURRENT YEAR: {datetime.utcnow().year}
PRODUCTS TO REVIEW:
{products_text}

⚠️  LENGTH REQUIREMENT: The finished article MUST be at least 1,400 words.
    Do NOT summarise or shorten any section. Write every section in full.
    If you finish early, expand each tool review with more detail until you hit 1,400 words.

Write the article following this structure. Word targets are MINIMUMS — exceed them freely:

## Introduction  [MINIMUM 180 words]
Write 2-3 paragraphs. Open with a relatable pain point, explain what this article covers,
name all three tools, and include the primary keyword naturally in the first 100 words.

## What to Look for in [Category]  [MINIMUM 220 words]
Cover 5 criteria buyers care about: pricing tiers, ease of use, core features,
integrations/API, and support quality. Write 2-3 sentences per criterion.

## [Tool 1 Name] Review  [MINIMUM 300 words]
- What it is and who it's best for (1 paragraph)
- Key features (bullet list, at least 5 bullets with 1-sentence explanations each)
- Pricing details (exact price from the product list above)
- Pros section: at least 3 pros, 1-2 sentences each
- Cons section: at least 2 honest cons, 1-2 sentences each
- End with: [Try Tool Name →](EXACT_URL_FROM_PRODUCT_LIST)

## [Tool 2 Name] Review  [MINIMUM 300 words]
Same format as Tool 1 Review above.

## [Tool 3 Name] Review  [MINIMUM 300 words]
Same format as Tool 1 Review above.

## Comparison Table
Markdown table with columns: Tool | Best For | Starting Price | Free Trial | Our Rating
Include one row per tool.

## Frequently Asked Questions  [MINIMUM 200 words]
3 questions real buyers ask, with 2-3 sentence answers each. Use **bold** for the question.

## Conclusion  [MINIMUM 120 words]
Summarise the key differences, give a clear "best pick" recommendation for different
use cases, and end with a call-to-action sentence.

RULES (violations will cause rejection):
- Do NOT say "As an AI" or anything that reveals AI authorship
- Write in first-person plural ("we tested", "our team found", "in our experience")
- Include the target keyword naturally 8-12 times throughout
- Use EXACT affiliate URLs from the product list above — do not invent URLs
- Mention real limitations for each tool (no tool is perfect)
- Use {datetime.utcnow().year} — never write 2024 or 2025

Return the full article in markdown, starting with the ## Introduction heading.
Do NOT include YAML frontmatter."""

        log.info(f"Generating content for: {keyword}")
        response = self.client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=6000,
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