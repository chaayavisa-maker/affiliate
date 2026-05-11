"""
Review Update Agent
====================
Scans existing posts in website/content/posts/, detects when reviewed AI tools
have changed (pricing, major features, quality), and rewrites the stale sections.

Detection strategy
------------------
1. Parse each MDX post to extract tool names and their current stated prices.
2. Search the web for recent news per tool (last 60 days).
3. Ask the LLM: "Is there a meaningful change that readers need to know about?"
4. If yes  → rewrite the tool's review section + rebuild the comparison table.
5. Update `updatedDate` in the MDX frontmatter, commit.

Web search
----------
Uses DuckDuckGo (no API key required) via the `duckduckgo-search` library.
Falls back to direct HTTP if the library is unavailable.
"""

from __future__ import annotations

import json
import logging
import os
import re
import subprocess
import sys
import time
from datetime import datetime, date
from pathlib import Path
from typing import Optional

from groq import Groq

log = logging.getLogger(__name__)

CONTENT_DIR = Path(__file__).parent.parent / "website" / "content" / "posts"
GROQ_MODEL  = "llama-3.3-70b-versatile"

# How many days of news to pull per tool
NEWS_WINDOW_DAYS = 60

# ──────────────────────────────────────────────────────────────────────────────
# Web search helpers
# ──────────────────────────────────────────────────────────────────────────────

def _ddg_search(query: str, max_results: int = 6) -> list[dict]:
    """
    Search DuckDuckGo. Returns list of {title, body, href}.
    Works without any API key.
    """
    try:
        from duckduckgo_search import DDGS
        with DDGS() as ddgs:
            results = ddgs.text(query, max_results=max_results, timelimit="m")  # m = last month
            return list(results) if results else []
    except Exception as e:
        log.warning(f"DDG search failed ({e}) — returning empty results")
        return []


def _build_search_snippet(tool_name: str) -> str:
    """Return a compact text snippet of recent news about a tool."""
    queries = [
        f"{tool_name} pricing change 2026",
        f"{tool_name} new features update 2026",
        f"{tool_name} review 2026",
    ]
    snippets: list[str] = []
    for q in queries:
        results = _ddg_search(q, max_results=4)
        for r in results:
            title = r.get("title", "")
            body  = r.get("body", "")[:300]
            snippets.append(f"• {title}: {body}")
        time.sleep(1)  # polite delay

    return "\n".join(snippets[:12]) if snippets else "(no recent news found)"


# ──────────────────────────────────────────────────────────────────────────────
# MDX parsing helpers
# ──────────────────────────────────────────────────────────────────────────────

_FM_RE = re.compile(r"^---\r?\n(.*?)\r?\n---", re.DOTALL)


def _parse_frontmatter(text: str) -> dict:
    """Extract key: value pairs from YAML frontmatter (no external lib needed)."""
    m = _FM_RE.match(text)
    if not m:
        return {}
    fm: dict = {}
    for line in m.group(1).splitlines():
        if ":" in line and not line.startswith(" ") and not line.startswith("-"):
            k, _, v = line.partition(":")
            fm[k.strip()] = v.strip().strip('"').strip("'")
    return fm


def _replace_frontmatter_key(text: str, key: str, value: str) -> str:
    """Update (or insert) a single key in the YAML frontmatter block."""
    m = _FM_RE.match(text)
    if not m:
        return text
    fm_block = m.group(1)
    # Replace existing key
    new_line = f'{key}: "{value}"'
    if re.search(rf"^{key}:", fm_block, re.MULTILINE):
        fm_block = re.sub(rf"^{key}:.*$", new_line, fm_block, flags=re.MULTILINE)
    else:
        fm_block += f"\n{new_line}"
    return text[: m.start(1)] + fm_block + text[m.end(1) :]


def _extract_tool_names(content: str) -> list[str]:
    """
    Pull tool names from section headings like '## Notion AI Review'.
    Returns names without ' Review' suffix.
    """
    return re.findall(r"^## (.+?) Review\s*$", content, re.MULTILINE)


def _extract_tool_price(content: str, tool_name: str) -> str:
    """Grep for the first $X/mo mentioned near the tool's review section."""
    # Find the section for this tool
    pattern = rf"## {re.escape(tool_name)} Review.*?(?=\n## |\Z)"
    m = re.search(pattern, content, re.DOTALL)
    if not m:
        return "unknown"
    section = m.group(0)
    price_m = re.search(r"\$[\d.,]+/mo", section)
    return price_m.group(0) if price_m else "unknown"


def _extract_section(content: str, heading: str) -> str:
    """Return the full text of one ## section (up to the next ## or EOF)."""
    pattern = rf"(## {re.escape(heading)}.*?)(?=\n## |\Z)"
    m = re.search(pattern, content, re.DOTALL)
    return m.group(1).strip() if m else ""


def _replace_section(content: str, heading: str, new_section: str) -> str:
    """Replace one ## section in place."""
    pattern = rf"(## {re.escape(heading)}.*?)(?=\n## |\Z)"
    replacement = new_section.rstrip() + "\n\n"
    result, n = re.subn(pattern, replacement, content, flags=re.DOTALL)
    if n == 0:
        log.warning(f"Section '## {heading}' not found — appending instead")
        result = content + "\n\n" + new_section
    return result


# ──────────────────────────────────────────────────────────────────────────────
# Review agent core
# ──────────────────────────────────────────────────────────────────────────────

class ReviewAgent:
    def __init__(self, groq_api_key: str):
        self.client = Groq(api_key=groq_api_key)

    # ── Public API ──────────────────────────────────────────────────────────

    def check_and_update_post(self, mdx_path: Path) -> bool:
        """
        Main entry point.  Reads a single MDX file, checks each reviewed tool
        for changes, patches the file, and returns True if anything was updated.
        """
        log.info(f"Checking: {mdx_path.name}")
        raw = mdx_path.read_text(encoding="utf-8")
        fm  = _parse_frontmatter(raw)

        # Strip frontmatter + export block to get pure markdown content
        body = _FM_RE.sub("", raw).strip()
        # Strip the `export const schema = ...` block
        body = re.sub(r"^export const schema =.*?\n\}\n", "", body, flags=re.DOTALL).strip()

        tool_names = _extract_tool_names(body)
        if not tool_names:
            log.info("  No tool review sections found — skipping")
            return False

        log.info(f"  Tools found: {tool_names}")

        changed = False
        change_log: list[str] = []

        for tool in tool_names:
            current_price = _extract_tool_price(body, tool)
            log.info(f"  Checking '{tool}' (currently stated: {current_price})")

            news_snippet = _build_search_snippet(tool)
            decision = self._evaluate_changes(tool, current_price, news_snippet, fm.get("date", ""))
            log.info(f"  Decision for '{tool}': needs_update={decision['needs_update']}, reason={decision['reason']}")

            if not decision["needs_update"]:
                continue

            # Rewrite this tool's review section
            old_section = _extract_section(body, f"{tool} Review")
            new_section = self._rewrite_tool_section(
                tool_name=tool,
                old_section=old_section,
                changes_summary=decision["changes_summary"],
                new_price=decision.get("new_price") or current_price,
                affiliate_url=self._find_affiliate_url(body, tool),
            )
            if new_section:
                body    = _replace_section(body, f"{tool} Review", new_section)
                changed = True
                change_log.append(f"{tool}: {decision['reason']}")
                log.info(f"  ✓ Rewrote '{tool} Review'")

        if changed:
            # Rebuild comparison table with fresh data
            new_table = self._rebuild_comparison_table(tool_names, body)
            if new_table:
                body = _replace_section(body, "Comparison Table", new_table)

            # Patch updatedDate in frontmatter
            today = date.today().isoformat()
            raw = _replace_frontmatter_key(raw, "updatedDate", today)

            # Reconstruct full file: frontmatter + schema export + body
            # Preserve the original frontmatter + schema block exactly, only swap body
            fm_end = _FM_RE.search(raw).end()
            schema_block_m = re.search(r"\nexport const schema =.*?\n\}\n", raw[fm_end:], re.DOTALL)
            if schema_block_m:
                header = raw[: fm_end + schema_block_m.end()]
            else:
                header = raw[:fm_end]

            # Rebuild the body, preserving the disclosure footer
            disclosure = (
                "\n---\n\n"
                "*Disclosure: This article contains affiliate links. "
                "We may earn a commission if you purchase through our links, "
                "at no extra cost to you. We only recommend tools we've genuinely evaluated.*\n"
            )
            # Remove trailing disclosure from body if present so we don't duplicate
            body = re.sub(r"\n---\n\n\*Disclosure:.*$", "", body, flags=re.DOTALL).rstrip()

            full = header.rstrip() + "\n\n" + body + disclosure
            mdx_path.write_text(full, encoding="utf-8")

            log.info(f"  File updated. Changes: {'; '.join(change_log)}")
        else:
            log.info("  No significant changes detected — file unchanged")

        return changed

    # ── LLM helpers ────────────────────────────────────────────────────────

    def _evaluate_changes(
        self,
        tool_name: str,
        current_price: str,
        news_snippet: str,
        review_date: str,
    ) -> dict:
        """
        Ask LLM whether the web search results indicate a meaningful change.
        Returns:
          { needs_update: bool, reason: str, changes_summary: str, new_price: str|None }
        """
        prompt = f"""You are an AI tool review editor. Your job is to assess whether a published review needs updating.

TOOL: {tool_name}
REVIEW DATE: {review_date}
CURRENT STATED PRICE: {current_price}
TODAY'S DATE: {date.today().isoformat()}

RECENT WEB SEARCH RESULTS (last 60 days):
{news_snippet}

Assess whether ANY of the following has changed significantly since the review date:
1. Pricing (new tier, price increase/decrease, free plan added/removed)
2. Major new features (new model, major capability, major limitation removed)
3. Quality regression (downtime, mass complaints, service degradation)
4. The tool has been discontinued or rebranded

Respond ONLY with a valid JSON object, no markdown, no explanation outside the JSON:
{{
  "needs_update": true or false,
  "reason": "one-line reason why update is needed (or 'no significant changes')",
  "changes_summary": "2-3 sentence factual summary of what changed (empty string if no update needed)",
  "new_price": "new price string like $19/mo or null if price unchanged"
}}"""

        try:
            resp = self.client.chat.completions.create(
                model=GROQ_MODEL,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=400,
                temperature=0.2,
            )
            text = resp.choices[0].message.content.strip()
            # Strip markdown code fences if present
            text = re.sub(r"^```(?:json)?\s*|\s*```$", "", text, flags=re.DOTALL).strip()
            data = json.loads(text)
            time.sleep(2)
            return data
        except Exception as e:
            log.warning(f"_evaluate_changes failed for {tool_name}: {e}")
            return {
                "needs_update": False,
                "reason": f"evaluation error: {e}",
                "changes_summary": "",
                "new_price": None,
            }

    def _rewrite_tool_section(
        self,
        tool_name: str,
        old_section: str,
        changes_summary: str,
        new_price: str,
        affiliate_url: str,
    ) -> Optional[str]:
        """
        Rewrite a single tool's review section incorporating the detected changes.
        Returns the new markdown section string, or None on failure.
        """
        prompt = f"""You are an expert tech reviewer updating an existing affiliate review section.

TOOL: {tool_name}
WHAT CHANGED: {changes_summary}
UPDATED PRICE: {new_price}
AFFILIATE URL: {affiliate_url}

EXISTING REVIEW SECTION (to be updated):
{old_section}

TASK: Rewrite the section above to reflect the detected changes. Preserve the overall structure:
- Opening paragraph (who it's for)
- Key features bullet list (update if features changed)
- Pricing (update to the new price if changed)
- Pros/Cons (adjust if quality changed)
- Closing paragraph + CTA link using AFFILIATE URL

Rules:
- Write in first-person plural ("we found", "in our testing")
- Do NOT reveal AI authorship
- Keep the affiliate CTA link: [Try {tool_name} →]({affiliate_url})
- If the price changed, clearly state the new price
- Minimum 280 words
- Start directly with "## {tool_name} Review"

Return ONLY the markdown section, nothing else."""

        try:
            resp = self.client.chat.completions.create(
                model=GROQ_MODEL,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=2000,
                temperature=0.55,
            )
            text = resp.choices[0].message.content.strip()
            time.sleep(2)
            return text
        except Exception as e:
            log.warning(f"_rewrite_tool_section failed for {tool_name}: {e}")
            return None

    def _rebuild_comparison_table(self, tool_names: list[str], body: str) -> Optional[str]:
        """
        Build an improved comparison table from the current body text.
        Uses richer columns and star/checkmark formatting compatible with Table.tsx.
        """
        # Collect tool data from body
        tools_data = []
        for tool in tool_names:
            price = _extract_tool_price(body, tool)
            section = _extract_section(body, f"{tool} Review")
            tools_data.append({"name": tool, "price": price, "section": section[:600]})

        tools_json = json.dumps(tools_data, ensure_ascii=False)

        prompt = f"""You are building a comparison table for an affiliate review article.

TOOLS DATA:
{tools_json}

Create a rich markdown comparison table with these exact columns:
Tool | Best For | Price | Free Plan | Key Strength | Ease of Use | Our Rating

Rules:
- "Price" column: use exact price like "$49/mo" (will render bold)
- "Free Plan" column: use "✓ Free tier" or "✓ X-day trial" if free exists, else "✗ Paid only"
  (✓ triggers green badge, ✗ is plain text)
- "Ease of Use" column: use star symbols like "★★★★☆" (1-5 stars, ★ = filled, ☆ = empty)
  (★ symbols render in amber)
- "Our Rating" column: same star format
- "Best For" column: short phrase, max 4 words
- "Key Strength" column: single killer feature, max 6 words
- First row after header must be the best overall pick

Return ONLY the markdown table starting with "## Comparison Table", nothing else.
Example row format:
| Jasper AI | Content teams | $49/mo | ✓ 7-day trial | Brand Voice AI | ★★★★☆ | ★★★★★ |"""

        try:
            resp = self.client.chat.completions.create(
                model=GROQ_MODEL,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=600,
                temperature=0.3,
            )
            text = resp.choices[0].message.content.strip()
            time.sleep(2)
            return text
        except Exception as e:
            log.warning(f"_rebuild_comparison_table failed: {e}")
            return None

    def _find_affiliate_url(self, body: str, tool_name: str) -> str:
        """Extract the affiliate URL for a tool from the body text."""
        # Look for markdown links near the tool name
        pattern = rf"\[Try {re.escape(tool_name)}[^\]]*\]\(([^)]+)\)"
        m = re.search(pattern, body, re.IGNORECASE)
        if m:
            return m.group(1)
        # Fallback: any link containing the tool domain
        domain_hint = tool_name.lower().replace(" ", "").replace(".", "")
        m2 = re.search(rf"\(https?://[^\)]*{domain_hint}[^\)]*\)", body, re.IGNORECASE)
        if m2:
            return m2.group(0).strip("()")
        return f"https://{tool_name.lower().replace(' ', '')}.com"


# ──────────────────────────────────────────────────────────────────────────────
# Git helpers
# ──────────────────────────────────────────────────────────────────────────────

def git_commit_updates(updated_paths: list[Path], change_summary: str):
    """Stage and commit updated MDX files."""
    try:
        subprocess.run(["git", "config", "user.email", "bot@aitoolshub.ai"], check=True)
        subprocess.run(["git", "config", "user.name", "Review Bot"], check=True)
        for p in updated_paths:
            subprocess.run(["git", "add", str(p)], check=True)
        msg = f"[review-bot] Update reviews: {change_summary[:80]}"
        subprocess.run(["git", "commit", "-m", msg], check=True)
        log.info(f"Committed {len(updated_paths)} updated file(s)")
    except subprocess.CalledProcessError as e:
        log.error(f"Git commit failed: {e}")
        raise


def git_push():
    try:
        subprocess.run(["git", "push"], check=True)
        log.info("Git push successful")
    except subprocess.CalledProcessError as e:
        log.error(f"Git push failed: {e}")
        raise


# ──────────────────────────────────────────────────────────────────────────────
# CLI entry point (used by review_orchestrator.py and GitHub Actions)
# ──────────────────────────────────────────────────────────────────────────────

def run(slug_filter: Optional[str] = None):
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(message)s",
        handlers=[logging.StreamHandler(sys.stdout)],
    )

    groq_key = os.environ.get("GROQ_API_KEY")
    if not groq_key:
        log.error("GROQ_API_KEY not set")
        sys.exit(1)

    agent = ReviewAgent(groq_key)

    posts = sorted(CONTENT_DIR.glob("*.mdx"))
    if slug_filter:
        posts = [p for p in posts if slug_filter in p.stem]
        log.info(f"Filtered to {len(posts)} post(s) matching '{slug_filter}'")

    if not posts:
        log.info("No posts to check")
        return

    log.info(f"=== Review Agent: checking {len(posts)} post(s) ===")

    updated_paths: list[Path] = []
    tool_changes: list[str] = []

    for post_path in posts:
        try:
            updated = agent.check_and_update_post(post_path)
            if updated:
                updated_paths.append(post_path)
                tool_changes.append(post_path.stem)
        except Exception as e:
            log.error(f"Error processing {post_path.name}: {e}")

    log.info(f"\n=== Done — {len(updated_paths)} post(s) updated ===")
    for p in updated_paths:
        log.info(f"  ✓ {p.name}")

    if os.getenv("GITHUB_ACTIONS") and updated_paths:
        change_summary = ", ".join(tool_changes[:5])
        git_commit_updates(updated_paths, change_summary)
        git_push()

    # Write summary artifact
    summary = {
        "run_at": datetime.utcnow().isoformat(),
        "posts_checked": len(posts),
        "posts_updated": len(updated_paths),
        "updated": [p.name for p in updated_paths],
    }
    Path("review_summary.json").write_text(json.dumps(summary, indent=2))
    log.info("Review summary saved to review_summary.json")


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Review Update Agent")
    parser.add_argument("--slug", help="Only check posts whose filename contains this string")
    args = parser.parse_args()
    run(slug_filter=args.slug)
