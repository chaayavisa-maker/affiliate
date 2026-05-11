# 🤖 AI Tools Hub — Autonomous Affiliate Business

An autonomous digital business that generates SEO content, publishes it, and earns affiliate commissions — completely hands-free after setup. Runs on **$0/month** infrastructure.

## How it makes money

| Revenue Stream | How | Timeline |
|---|---|---|
| Affiliate commissions | 20-40% on software purchases | Month 3-6 |
| Google AdSense | Display ads on every article | Month 2+ |
| Sponsored reviews | Direct brand deals | Month 6+ |

## What runs automatically

Every day at 8 AM UTC, GitHub Actions:
1. **Finds keywords** — identifies profitable, low-competition topics in the AI tools niche
2. **Writes articles** — generates 1,500-word SEO-optimized reviews with Groq LLaMA 70B (free)
3. **Optimizes SEO** — adds schema markup, meta tags, internal links, sitemap entries
4. **Publishes** — commits MDX files to GitHub → Vercel auto-deploys in ~30 seconds

After 90 days you'll have 180+ articles indexed by Google, generating organic traffic and revenue.

## Setup (20 minutes)

### Prerequisites
- Git, Node.js 18+, Python 3.10+
- Free accounts: [GitHub](https://github.com), [Vercel](https://vercel.com), [Groq](https://console.groq.com)

### 1. Get your free Groq API key
Go to [console.groq.com](https://console.groq.com) → Create API Key. Free tier gives you 14,400 requests/day — enough for 10+ articles daily.

### 2. Create GitHub repository
Create a new **empty** repository on GitHub (e.g. `your-username/ai-tools-hub`)

### 3. Run the setup script
```bash
git clone <this-repo>
cd ai-affiliate-site
chmod +x scripts/setup.sh
./scripts/setup.sh
```

The script will ask for your Groq API key, GitHub URL, and domain, then:
- Configure everything
- Run a test article
- Push to GitHub

### 4. Deploy to Vercel
1. Go to [vercel.com](https://vercel.com) → New Project → Import your GitHub repo
2. Set **Root Directory** to `website`
3. Add environment variable: `SITE_URL=https://your-domain.com`
4. Click Deploy

### 5. Add affiliate programs (where the money comes from)

Sign up for these programs, get your affiliate IDs, then update `agents/content_agent.py`:

| Program | Best for | Commission |
|---|---|---|
| [PartnerStack](https://partnerstack.com) | SaaS tools | 20-40% |
| [ShareASale](https://www.shareasale.com) | General software | 15-30% |
| [Impact.com](https://impact.com) | Enterprise software | 20-35% |
| [Amazon Associates](https://affiliate-program.amazon.com) | Books/hardware | 3-10% | aitoolshub03f-20

This is straightforward but takes a few days of approvals. Here's the practical path:
Before you apply to anything
Affiliate programs check your site before approving you. Make sure yours looks legit first:

Real domain — not vercel.app. Buy something like aitoolshub.com on Namecheap (~$10/yr) and point it to Vercel
Affiliate disclosure page — you already have one at /affiliate-disclosure, good
A few published reviews — you have 14, that's plenty
Contact page — you have it

Once your domain is set, you're ready.

The tools on your site and exactly where to apply
Tier 1 — Apply first, highest commissions
Jasper AI — 30% recurring

Go to jasper.ai/affiliate-program
Click "Apply now" — it uses PartnerStack
Create a PartnerStack account, fill in your site URL and traffic estimate (be honest, even low traffic gets approved)
Approval: 1–3 business days
Once approved, go to PartnerStack dashboard → get your unique link → replace YOUR_ID in content_agent.py with your PartnerStack ref code

Writesonic — 30% recurring

Go to writesonic.com/affiliates
Joins through their own dashboard
Fast approval, often same day

Grammarly — $20 flat per sale

Go to grammarly.com/affiliates — runs through Impact
Create an Impact account at impact.com/affiliates
Search "Grammarly" in the marketplace and apply
They review your site manually — takes 3–5 days
Your link format will look like grammarly.com?utm_source=... with your Impact ID

Surfer SEO — 25% recurring

Go to surferseo.com/affiliate-program
Runs on PartnerStack (same account as Jasper if you already made one)
Search "Surfer SEO" in PartnerStack marketplace


Tier 2 — Apply next
Copy.ai — 45% recurring (highest on your list)

Go to copy.ai/affiliates
Also on PartnerStack

Synthesia — 25% recurring

Go to synthesia.io/affiliates
Email affiliates@synthesia.io — they do manual review, not a self-serve portal
Mention your review URL directly in the email

Notion — 20%

Go to notion.so/affiliates
Runs through a direct portal — approval is selective, they prefer sites with real audience

Frase — 30%

frase.io/affiliates → runs on FirstPromoter


Tier 3 — Low-effort cleanups (no affiliate program exists)
These tools on your site have N/A commission and no public affiliate program:

Midjourney — no program, remove or replace with Canva AI or Adobe Firefly
GitHub Copilot / Cursor — no program
ChatGPT Plus / Claude Pro — no program

For those slots, swap in alternatives that do pay: Tabnine (for coding), Perplexity (for research/chatbot), Adobe Firefly (for image).

After you get approved
For each program you join, you get a unique tracking link or ID. Then in your repo:

Open agents/content_agent.py
Find AFFILIATE_PRODUCTS at the top
Replace YOUR_ID in each URL with your actual ID:

python{"name": "Jasper AI", "url": "https://www.jasper.ai?fpr=abc123", ...},
#                                                         ^^^^^^
#                                                         your PartnerStack ref
That's it — all new articles generated after that will automatically use your real links.

Tracking payments
Each network pays differently:
NetworkPayment thresholdSchedulePartnerStack$25Monthly (net-60)Impact$10MonthlyFirstPromoter$100MonthlyDirect (Synthesia etc.)variesMonthly
Start with PartnerStack — one account covers Jasper, Surfer, Copy.ai, and many others. That's the highest ROI signup for the time spent.

### 6. Add Google AdSense
1. Apply at [adsense.google.com](https://adsense.google.com)
2. Replace `ca-pub-YOUR_PUBLISHER_ID` in `website/app/layout.tsx`
3. Replace `YOUR_SLOT` values in the ad slot components

## Manual content generation

Run anytime to generate extra articles:
```bash
cd agents
GROQ_API_KEY=your_key ARTICLES_PER_RUN=5 python3 orchestrator.py
```

## Project structure

```
ai-affiliate-site/
├── agents/
│   ├── orchestrator.py        # Main pipeline coordinator
│   ├── keyword_agent.py       # Finds profitable keywords (Groq)
│   ├── content_agent.py       # Writes 1500-word articles (Groq)
│   ├── seo_agent.py           # Schema, sitemap, internal links
│   └── publisher_agent.py     # Git commit + deploy trigger
├── website/
│   ├── app/
│   │   ├── page.tsx           # Homepage
│   │   ├── blog/page.tsx      # Article listing
│   │   ├── blog/[slug]/page.tsx  # Article detail
│   │   ├── tools/page.tsx     # Tool directory (high-converting)
│   │   └── layout.tsx         # Global layout with GA + AdSense
│   ├── content/posts/         # MDX articles (auto-generated here)
│   └── lib/posts.ts           # Article reading utilities
├── .github/workflows/
│   └── daily-content.yml      # GitHub Actions daily automation
└── scripts/
    └── setup.sh               # One-command setup
```

## Customization

### Change niche
Edit `agents/keyword_agent.py` → `SEED_TOPICS` list. The current niche is AI tools (high CPC, high affiliate rates). Other profitable niches: finance tools, VPN/security, web hosting, productivity apps.

### Change posting frequency
Edit `.github/workflows/daily-content.yml` → `cron` schedule and `ARTICLES_PER_RUN`.

### Add your own affiliate products
Edit `agents/content_agent.py` → `AFFILIATE_PRODUCTS` dict. Replace `YOUR_ID` with your actual affiliate IDs.

## Revenue expectations

These are realistic ranges based on similar affiliate sites:

| Metric | Month 3 | Month 6 | Month 12 |
|---|---|---|---|
| Articles | 180 | 360 | 720 |
| Monthly traffic | 500-2,000 | 3,000-10,000 | 15,000-50,000 |
| AdSense revenue | $5-20 | $30-100 | $150-500 |
| Affiliate revenue | $0-50 | $100-500 | $500-3,000 |
| **Total/month** | **$5-70** | **$130-600** | **$650-3,500** |

SEO takes time — the business is genuinely hands-free but patience is required for Google to index and rank the content.

## Free infrastructure used

| Service | Free tier | What it does |
|---|---|---|
| Groq API | 14,400 req/day | AI content generation |
| GitHub | Unlimited public repos | Code + content storage |
| GitHub Actions | 2,000 min/month | Daily automation |
| Vercel | 100GB bandwidth | Website hosting |
| Google Analytics | Free | Traffic tracking |
| Google Search Console | Free | SEO monitoring |

**Total monthly cost: $0** until you're making money.
