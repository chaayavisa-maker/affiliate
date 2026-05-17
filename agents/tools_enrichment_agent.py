"""
tools_enrichment_agent.py — Weekly AI Tools Enrichment Agent
=============================================================

Two phases per weekly run:

PHASE 1 — ENRICH (existing tools)
  For each tool in tools.json: web search + Groq review to update price,
  rating, free tier, desc, pros, badge, commission.

PHASE 2 — DISCOVER (new tools)
  For each category: web search for trending tools not already in the list.
  Groq scores each candidate (affiliate potential, rating, relevance) and
  returns structured data ready to insert. Adds up to MAX_NEW_PER_RUN tools.

Token budget
------------
  Phase 1: ~560 tokens/tool x 36 tools  = ~20,160 tokens
  Phase 2: ~500 tokens/category x 7 cats =  ~3,500 tokens
  Total per weekly run:                   ~23,660 tokens (~4.7% of 500k daily)

  Model: llama-3.1-8b-instant (TPM: 20,000)
  Delay: 12s between calls => ~5 calls/min => ~2,800 TPM  (well under limit)
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

from duckduckgo_search import DDGS
from groq import Groq

# -- Logging -------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)

# -- Paths ---------------------------------------------------------------------
REPO_ROOT  = Path(__file__).parent.parent
TOOLS_JSON = REPO_ROOT / "website" / "data" / "tools.json"
LOG_FILE   = Path(__file__).parent / "enrichment_log.json"

# -- Config --------------------------------------------------------------------
GROQ_MODEL       = "llama-3.1-8b-instant"
MAX_RATING_DELTA = 0.2
SEARCH_RESULTS   = 2
SNIPPET_CHARS    = 150
API_DELAY        = 12.0   # seconds between Groq calls to stay under TPM
MAX_OUT_TOKENS   = 200
MAX_NEW_PER_RUN  = 3      # max new tools to add per weekly run (keeps growth controlled)
MIN_NEW_RATING   = 4.1    # don't add tools the model rates below this

VALID_BADGES = [
    "Top Pick", "Best Value", "Editor's Choice",
    "Budget Pick", "Best for Beginners", "Best Quality", "Best Free",
]

# Discovery search queries per category — specific enough to surface real tools
CATEGORY_QUERIES = {
    "writing":      "best new AI writing tools 2026",
    "coding":       "best new AI coding assistant tools 2026",
    "design":       "best new AI image generation design tools 2026",
    "video":        "best new AI video generation editing tools 2026",
    "seo":          "best new AI SEO marketing email tools 2026",
    "productivity": "best new AI productivity note-taking tools 2026",
    "chatbots":     "best new AI chatbot assistant tools 2026",
}


# -- Search helper -------------------------------------------------------------
def _search(query: str) -> str:
    try:
        with DDGS() as ddgs:
            results = list(ddgs.text(query, max_results=SEARCH_RESULTS))
        snippets = [
            f"- {r.get('body','')[:SNIPPET_CHARS].replace(chr(10),' ')}"
            for r in results
        ]
        return "\n".join(snippets) if snippets else "No results."
    except Exception as e:
        log.warning("Search failed for '%s': %s", query, e)
        return "Search unavailable."


# -- Minimal tool summary for prompt -------------------------------------------
def _tool_summary(tool: dict) -> str:
    subset = {k: tool[k] for k in
              ("name","price","priceNum","free","rating","desc","pros","badge","commission")
              if k in tool}
    return json.dumps(subset, separators=(",", ":"))


# ==============================================================================
# PHASE 1 — ENRICH existing tools
# ==============================================================================

def _enrich_tool(client: Groq, tool: dict, search_context: str) -> dict:
    today      = date.today().isoformat()
    old_rating = tool["rating"]
    badges_str = ", ".join(f'"{b}"' for b in VALID_BADGES)

    prompt = (
        f"Update this AI tool entry using today's web data. Today={today}.\n"
        f"Current: {_tool_summary(tool)}\n"
        f"Web:\n{search_context}\n\n"
        f"Return ONLY compact JSON with changed fields plus:\n"
        f"- lastReviewed: \"{today}\"\n"
        f"- changeNote: one sentence max 12 words describing main change, or null\n"
        f"Rules:\n"
        f"- price: \"$X/mo\". priceNum: matching integer.\n"
        f"- free: true/false.\n"
        f"- rating: {old_rating} +- max {MAX_RATING_DELTA}. Range 4.0-5.0.\n"
        f"- desc: max 18 words. pros: exactly 3 items, max 4 words each.\n"
        f"- badge: one of [{badges_str}] or null.\n"
        f"- commission: string or null.\n"
        f"Only include a field if you have evidence it changed. No markdown."
    )

    try:
        resp = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=MAX_OUT_TOKENS,
            temperature=0.2,
        )
        u = resp.usage
        log.info("  tokens: prompt=%d completion=%d total=%d",
                 u.prompt_tokens, u.completion_tokens, u.total_tokens)
        raw = _strip_fences(resp.choices[0].message.content)
        updates = json.loads(raw)
    except json.JSONDecodeError as e:
        log.warning("  JSON parse error for '%s': %s", tool["name"], e)
        return tool
    except Exception as e:
        log.warning("  Groq call failed for '%s': %s", tool["name"], e)
        return tool

    if "rating" in updates:
        new_r = float(updates["rating"])
        updates["rating"] = round(
            max(old_rating - MAX_RATING_DELTA,
                min(old_rating + MAX_RATING_DELTA, new_r)), 1)

    if "badge" in updates and updates["badge"] not in VALID_BADGES and updates["badge"] is not None:
        log.warning("  Invalid badge '%s' dropped", updates["badge"])
        del updates["badge"]

    return {**tool, **updates}


def run_enrich_phase(client: Groq, tools: list[dict]) -> tuple[list[dict], list[dict]]:
    """Enrich all existing tools. Returns (updated_tools, enrich_log)."""
    log.info("=" * 60)
    log.info("PHASE 1 — Enriching %d existing tools", len(tools))
    log.info("=" * 60)

    updated, run_log, changed_count = [], [], 0

    for i, tool in enumerate(tools, 1):
        name = tool["name"]
        log.info("[%d/%d] %s", i, len(tools), name)

        context  = _search(f"{name} pricing review 2026")
        enriched = _enrich_tool(client, tool, context)
        changes  = _diff(tool, enriched)

        if changes:
            changed_count += 1
            log.info("  changed: %s", " | ".join(changes))
        else:
            log.info("  no changes")

        run_log.append({
            "name":         name,
            "changes":      changes,
            "changeNote":   enriched.get("changeNote"),
            "lastReviewed": enriched.get("lastReviewed"),
        })
        updated.append(enriched)

        if i < len(tools):
            time.sleep(API_DELAY)

    log.info("Phase 1 complete — %d/%d tools updated", changed_count, len(tools))
    return updated, run_log


# ==============================================================================
# PHASE 2 — DISCOVER new tools
# ==============================================================================

def _discover_for_category(
    client: Groq,
    category: str,
    query: str,
    existing_names: list[str],
) -> list[dict]:
    """
    Search for new tools in a category and ask Groq to return structured
    data for any genuinely new ones not already in our list.
    Returns a list of tool dicts ready to append to tools.json.
    """
    today   = date.today().isoformat()
    context = _search(query)
    existing_str = json.dumps(existing_names, separators=(",", ":"))
    badges_str   = ", ".join(f'"{b}"' for b in VALID_BADGES)

    prompt = (
        f"You curate an AI tools directory. Find NEW tools in the '{category}' category.\n"
        f"Today={today}.\n"
        f"Web search results:\n{context}\n\n"
        f"Already in our directory (DO NOT include these):\n{existing_str}\n\n"
        f"Return a JSON array of up to 2 genuinely NEW tools found in the web results.\n"
        f"Only include tools that:\n"
        f"  - Are NOT already in our directory\n"
        f"  - Have a real website and paid/free plan\n"
        f"  - Are relevant to the '{category}' category\n"
        f"  - You can rate at least {MIN_NEW_RATING}/5 based on evidence\n"
        f"If no strong candidates exist, return an empty array [].\n\n"
        f"Each tool object must have EXACTLY these fields:\n"
        f"  name, category ('{category}'), url, price ('$X/mo'), priceNum (int),\n"
        f"  rating (float {MIN_NEW_RATING}-5.0), desc (max 18 words),\n"
        f"  badge (one of [{badges_str}] or null),\n"
        f"  free (bool), affiliate (bool), commission (string or null),\n"
        f"  pros (array of exactly 3 strings, max 4 words each),\n"
        f"  lastReviewed: \"{today}\", changeNote: \"Newly added to directory.\"\n"
        f"Return ONLY a JSON array. No markdown."
    )

    try:
        resp = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=400,   # up to 2 tools x ~200 tokens each
            temperature=0.3,
        )
        u = resp.usage
        log.info("  tokens: prompt=%d completion=%d total=%d",
                 u.prompt_tokens, u.completion_tokens, u.total_tokens)
        raw  = _strip_fences(resp.choices[0].message.content)
        candidates: list[dict] = json.loads(raw)
    except json.JSONDecodeError as e:
        log.warning("  JSON parse error for category '%s': %s", category, e)
        return []
    except Exception as e:
        log.warning("  Groq call failed for category '%s': %s", category, e)
        return []

    # Validate each candidate
    required = {"name","category","url","price","priceNum","rating",
                "desc","badge","free","affiliate","pros"}
    valid = []
    for c in candidates:
        if not isinstance(c, dict):
            continue
        if not required.issubset(c.keys()):
            log.warning("  Candidate missing fields, skipping: %s", c.get("name","?"))
            continue
        if c["name"] in existing_names:
            log.warning("  '%s' already in directory, skipping", c["name"])
            continue
        if float(c.get("rating", 0)) < MIN_NEW_RATING:
            log.warning("  '%s' rated below threshold (%.1f), skipping",
                        c["name"], c.get("rating", 0))
            continue
        # Ensure badge is valid
        if c.get("badge") not in VALID_BADGES:
            c["badge"] = None
        # Ensure pros has exactly 3 items
        if not isinstance(c.get("pros"), list) or len(c["pros"]) != 3:
            c["pros"] = (c.get("pros") or ["AI-powered", "Easy to use", "Affordable"])[:3]
        valid.append(c)
        log.info("  + New tool found: %s (%.1f★, %s)",
                 c["name"], c["rating"], c["price"])

    return valid


def run_discover_phase(
    client: Groq,
    tools: list[dict],
) -> tuple[list[dict], list[dict]]:
    """
    Search for new tools across all categories.
    Returns (new_tools_to_add, discover_log).
    """
    log.info("=" * 60)
    log.info("PHASE 2 — Discovering new tools across %d categories",
             len(CATEGORY_QUERIES))
    log.info("=" * 60)

    existing_names = [t["name"] for t in tools]
    all_new: list[dict] = []
    discover_log: list[dict] = []

    for category, query in CATEGORY_QUERIES.items():
        log.info("Searching category: %s", category)
        new_tools = _discover_for_category(client, category, query, existing_names)

        discover_log.append({
            "category":  category,
            "found":     len(new_tools),
            "tools":     [t["name"] for t in new_tools],
        })

        # Add newly found tools to existing_names so later categories
        # don't re-discover the same tool under a different category
        for t in new_tools:
            existing_names.append(t["name"])
            all_new.append(t)

        time.sleep(API_DELAY)

        # Stop early if we've hit the per-run cap
        if len(all_new) >= MAX_NEW_PER_RUN:
            log.info("Reached MAX_NEW_PER_RUN (%d) — stopping discovery early",
                     MAX_NEW_PER_RUN)
            break

    # Cap to MAX_NEW_PER_RUN
    all_new = all_new[:MAX_NEW_PER_RUN]
    log.info("Phase 2 complete — %d new tool(s) to add", len(all_new))
    return all_new, discover_log


# ==============================================================================
# Shared helpers
# ==============================================================================

def _strip_fences(text: str) -> str:
    text = text.strip()
    text = re.sub(r"^```json\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    return text.strip()


def _diff(before: dict, after: dict) -> list[str]:
    changes = []
    for key in ("price", "rating", "free", "badge", "desc"):
        if before.get(key) != after.get(key):
            changes.append(f"{key}: {before.get(key)!r} -> {after.get(key)!r}")
    return changes


# ==============================================================================
# Main
# ==============================================================================

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

    est = len(tools) * (380 + MAX_OUT_TOKENS) + len(CATEGORY_QUERIES) * 500
    log.info("Loaded %d tools | model: %s | est. ~%d tokens (~%.1f%% of daily)",
             len(tools), GROQ_MODEL, est, est / 500_000 * 100)

    client = Groq(api_key=api_key)

    # Phase 1 — enrich existing tools
    updated_tools, enrich_log = run_enrich_phase(client, tools)

    # Phase 2 — discover new tools
    new_tools, discover_log = run_discover_phase(client, updated_tools)

    # Merge
    final_tools = updated_tools + new_tools

    # Write back
    with open(TOOLS_JSON, "w", encoding="utf-8") as f:
        json.dump(final_tools, f, indent=2, ensure_ascii=False)

    log.info(
        "Wrote %d tools to tools.json (%d existing updated, %d new added)",
        len(final_tools),
        sum(1 for e in enrich_log if e["changes"]),
        len(new_tools),
    )

    # Write run log
    summary = {
        "run_at":          datetime.utcnow().isoformat() + "Z",
        "model":           GROQ_MODEL,
        "tools_before":    len(tools),
        "tools_after":     len(final_tools),
        "tools_updated":   sum(1 for e in enrich_log if e["changes"]),
        "tools_added":     len(new_tools),
        "new_tools":       [t["name"] for t in new_tools],
        "enrich_details":  enrich_log,
        "discover_details": discover_log,
    }
    with open(LOG_FILE, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)

    log.info("Done — log written to %s", LOG_FILE)
    if new_tools:
        log.info("New tools added: %s", ", ".join(t["name"] for t in new_tools))


if __name__ == "__main__":
    main()
