"""
tools_enrichment_agent.py — Weekly AI Tools Enrichment Agent
=============================================================

Reads website/public/tools.json, uses DuckDuckGo search + Groq (llama-3.3-70b)
to verify and refresh each tool entry, then writes the updated JSON back.

What it updates per tool
------------------------
  price       — Current paid plan starting price (e.g. "$19/mo")
  priceNum    — Numeric version of the price for sorting
  free        — Whether a free tier / trial exists right now
  rating      — Adjusted based on recent reviews (does not move more than ±0.2/run)
  desc        — One-sentence description refreshed with current key features
  pros        — Up to 3 short feature highlights (max 4 words each)
  badge       — Reassigned based on current standing
  commission  — Affiliate commission if changed
  lastReviewed — ISO date of this review
  changeNote  — Short human-readable note of what changed (shown in the UI)

Run cadence: weekly (Monday 6 AM UTC via GitHub Actions)
"""

from __future__ import annotations
import json
import logging
import os
import re
import sys
import time
from datetime import date, datetime
from pathlib import Path
from typing import Any

from groq import Groq
from duckduckgo_search import DDGS

# ── Logging ────────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)

# ── Paths ──────────────────────────────────────────────────────────────────────
REPO_ROOT  = Path(__file__).parent.parent
TOOLS_JSON = REPO_ROOT / "website" / "public" / "tools.json"
LOG_FILE   = Path(__file__).parent / "enrichment_log.json"

# ── Config ─────────────────────────────────────────────────────────────────────
GROQ_MODEL       = "llama-3.3-70b-versatile"
MAX_RATING_DELTA = 0.2   # max rating change per weekly run (prevents wild swings)
SEARCH_RESULTS   = 4     # DuckDuckGo results per tool
API_DELAY        = 2.0   # seconds between Groq calls


# ── Search helper ──────────────────────────────────────────────────────────────
def _search(query: str) -> str:
    """Return a compact string of the top DDGS results for a query."""
    try:
        with DDGS() as ddgs:
            results = list(ddgs.text(query, max_results=SEARCH_RESULTS))
        snippets = []
        for r in results:
            title = r.get("title", "")
            body  = r.get("body", "")[:300]
            snippets.append(f"• {title}: {body}")
        return "\n".join(snippets) if snippets else "No results found."
    except Exception as e:
        log.warning("Search failed for '%s': %s", query, e)
        return "Search unavailable."


# ── Groq enrichment call ───────────────────────────────────────────────────────
def _enrich_tool(client: Groq, tool: dict, search_context: str) -> dict:
    """
    Ask Groq to review a single tool entry and return updated fields.
    Returns the original tool dict with any changed fields merged in.
    """
    today = date.today().isoformat()
    old_rating = tool["rating"]

    prompt = f"""You are a tech editor who maintains an AI tools directory.
Today is {today}. Your job is to review and update ONE tool entry using fresh web data.

## Current tool data
{json.dumps(tool, indent=2)}

## Fresh web search results (scraped today)
{search_context}

## Your task
Return a JSON object with ONLY the fields that need updating plus mandatory fields.
Be conservative — only change a field if you have clear evidence from the search results.

Rules:
- "price": starting paid plan price like "$19/mo". Keep existing if no clear evidence of change.
- "priceNum": integer version of price for sorting (e.g. 19 for "$19/mo"). Match price.
- "free": true if a free tier or free trial currently exists, false otherwise.
- "rating": float 4.0–5.0. Current rating is {old_rating}. Move by max ±{MAX_RATING_DELTA} per run.
  Increase if search shows strong recent praise; decrease if search shows complaints/shutdown risks.
- "desc": one punchy sentence (max 20 words) highlighting the tool's current main value proposition.
- "pros": list of exactly 3 short feature highlights (max 4 words each).
- "badge": one of ["Top Pick", "Best Value", "Editor's Choice", "Budget Pick",
  "Best for Beginners", "Best Quality", "Best Free"] or null. Only one tool per
  category should hold "Top Pick" — keep existing unless clearly outdated.
- "commission": current affiliate commission string, or null if not applicable.
- "changeNote": ONE short sentence (max 12 words) describing the most notable change,
  or null if nothing meaningful changed. This is shown to users in the UI.
  Examples: "Price dropped to $15/mo in May 2026." / "Now includes a free tier."
- "lastReviewed": set to "{today}"

Respond with ONLY valid JSON — no markdown, no explanation, no preamble."""

    try:
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=600,
            temperature=0.3,
        )
        raw = response.choices[0].message.content.strip()
        # Strip any accidental markdown fences
        raw = re.sub(r"^```json\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)
        updates = json.loads(raw)
    except Exception as e:
        log.warning("  Groq call failed for '%s': %s", tool["name"], e)
        return tool

    # Clamp rating delta
    if "rating" in updates:
        new_r = float(updates["rating"])
        clamped = max(old_rating - MAX_RATING_DELTA,
                      min(old_rating + MAX_RATING_DELTA, new_r))
        clamped = round(clamped, 1)
        updates["rating"] = clamped

    merged = {**tool, **updates}
    return merged


# ── Change summary ─────────────────────────────────────────────────────────────
def _diff(before: dict, after: dict) -> list[str]:
    """Return a list of human-readable changes between two tool dicts."""
    changes = []
    for key in ("price", "rating", "free", "badge", "desc"):
        if before.get(key) != after.get(key):
            changes.append(f"{key}: {before.get(key)!r} → {after.get(key)!r}")
    return changes


# ── Main ───────────────────────────────────────────────────────────────────────
def main() -> None:
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        log.error("GROQ_API_KEY not set — aborting.")
        sys.exit(1)

    if not TOOLS_JSON.exists():
        log.error("tools.json not found at %s", TOOLS_JSON)
        sys.exit(1)

    with open(TOOLS_JSON, encoding="utf-8") as f:
        tools: list[dict] = json.load(f)

    log.info("Loaded %d tools from tools.json", len(tools))
    client = Groq(api_key=api_key)

    run_log: list[dict[str, Any]] = []
    updated_tools: list[dict] = []
    changed_count = 0

    for i, tool in enumerate(tools, 1):
        name = tool["name"]
        log.info("[%d/%d] Reviewing: %s", i, len(tools), name)

        # 1. Web search for current pricing and reviews
        query = f"{name} pricing 2026 review"
        log.info("  Searching: '%s'", query)
        context = _search(query)

        # 2. Ask Groq to enrich
        enriched = _enrich_tool(client, tool, context)

        # 3. Diff and log
        changes = _diff(tool, enriched)
        if changes:
            changed_count += 1
            log.info("  ✓ Updated — %s", " | ".join(changes))
        else:
            log.info("  – No changes")

        run_log.append({
            "name": name,
            "changes": changes,
            "changeNote": enriched.get("changeNote"),
            "lastReviewed": enriched.get("lastReviewed"),
        })

        updated_tools.append(enriched)
        time.sleep(API_DELAY)

    # 4. Write back
    with open(TOOLS_JSON, "w", encoding="utf-8") as f:
        json.dump(updated_tools, f, indent=2, ensure_ascii=False)
    log.info("Wrote %d tools back to tools.json (%d changed)", len(updated_tools), changed_count)

    # 5. Write run log
    summary = {
        "run_at": datetime.utcnow().isoformat() + "Z",
        "tools_reviewed": len(tools),
        "tools_changed": changed_count,
        "details": run_log,
    }
    with open(LOG_FILE, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)
    log.info("Run log written to %s", LOG_FILE)

    if changed_count > 0:
        log.info("✅ Enrichment complete — %d tools updated.", changed_count)
    else:
        log.info("✅ Enrichment complete — all tools already up to date.")


if __name__ == "__main__":
    main()
