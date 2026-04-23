# Idea Scanner — find genuinely unexploited trading/product ideas

This is a reusable prompt you paste into any Claude (Claude.ai web, Claude Code, or the API). It runs a disciplined 5-filter sweep that surfaces ideas most people miss, because most people don't sit down and apply the filter.

The filter is simple — the reason it works is that almost nobody goes through all five steps with a patient LLM.

---

## How to use

1. Copy the prompt below.
2. Replace `{{DOMAIN}}` with the domain you want to scan — examples: `US-listed stock trading`, `Canadian small-cap mining`, `biotech catalysts`, `crypto DeFi protocols`, `commercial real estate`, `shipping logistics`, `legal compliance`.
3. (Optional) Replace `{{CONSTRAINTS}}` with any extra rules — examples: `one dev, ship in 4 weeks`, `no on-chain signing`, `must run on $5/month VPS`.
4. Paste into Claude. Read the output. Pick the one that feels most like _"oh — nobody does that?"_
5. Ask Claude as a follow-up: _"Take idea #X and give me the v1 build spec: data sources, endpoints, models, minimum viable UI."_

Run it again next week with a different domain. It surfaces different ideas every time because the data landscape keeps shifting.

---

## The prompt

```
You are helping me find genuinely unexploited product ideas in the domain of:

    {{DOMAIN}}

Extra constraints (ignore if empty):

    {{CONSTRAINTS}}

Run a disciplined 5-filter sweep. Apply every filter — do not skip any.

## FILTER 1: Data inventory

List every public or semi-public data source in this domain. Include:
- Government / regulatory filings (SEC EDGAR, FDA, USPTO, FERC, Companies House, SEDAR, Bundesanzeiger, etc.)
- APIs (free-tier + paid-with-free-tier)
- Subgraphs / on-chain data
- Scrapeable sources (career pages, conference agendas, court dockets, patent databases, customs manifests, shipping logs)
- Corporate disclosures (earnings calls, press releases, investor days, proxy statements)
- Niche community channels (specialist Discords, industry newsletters, academic preprint servers)

Aim for 15–25 sources. Don't stop at the obvious five.

## FILTER 2: LLM leverage

For each source, honestly rate from 1–5 how much an LLM gives you an edge over rule-based code:

- 5 = the signal is in natural language that must be read and compared across documents (10-K risk factor deltas, earnings call tone shifts, regulatory filing language drift)
- 4 = unstructured text that needs categorization or entity extraction (patent filings, job postings)
- 3 = structured data where an LLM adds marginal value (ranking, explaining)
- 2 = structured data where an LLM is pointless (price feeds, balance sheets)
- 1 = LLM actively worse than a SQL query

Discard everything rated 1 or 2. You are looking for LLM-native edges, not rehashes of quant finance.

## FILTER 3: Retail exhaustion

For each surviving source, ask: is this data exhausting enough that retail practitioners don't use it?

Discard:
- Things retail already uses daily (price charts, RSI, Twitter sentiment)
- Things that feel "pro" but actually have a polished retail product (insider transactions → Quiver, Congress trades → CapitolTrades)

Keep:
- Things where raw data is free but packaged retail products are weak or nonexistent
- Things funds pay $10K–$50K/year to Bloomberg/FactSet/Revealed for, with no free retail equivalent

Aim for 5–10 sources surviving this filter.

## FILTER 4: Tradability / actionability

For each surviving idea, trace the full loop:

    raw data → LLM signal → paper trade → real trade → P&L

If the signal can't be mapped to a buy/sell/hold decision with a clear time horizon (hours, days, weeks), cut it. "Interesting to know" is not a product.

Also cut anything that needs real-money custody or private keys in v1 — those introduce risk that a side-project can't absorb.

## FILTER 5: Shippability

For each remaining idea, estimate:
- v1 scope (ingest one data source, surface one signal, paper-trade it)
- Time for one developer with Claude to ship v1: must be ≤ 4 weeks
- Ongoing compute cost: must be ≤ $50/month including API calls
- Any regulatory or ToS concern (scraping limits, PII, etc.)

Cut anything that fails any of those bars.

## FILTER 6: Rocket-ship potential (added 2026-04)

For each surviving idea, score 1–5 on EACH of the seven traits below, then report the total (max 35). DO NOT cut ideas based on this score — just tag it. A low rocket score means "depth product, compounds slowly, no viral pop." A high rocket score means "potential to explode in weeks if the product is right." Let me decide which kind I want.

The seven traits come from retrospectives on products that went from zero to millions of users in under 18 months — Figma, Notion, ChatGPT, TikTok, Dropbox, Discord, Slack, Zoom, Instagram, Robinhood, Stripe, Wordle, Cursor, Claude Code:

1. **Time-to-first-value under 30 seconds.** User gets one magical moment within the first 30 seconds of landing, no signup wall, no empty-state onboarding. ChatGPT: type something, get a response. Wordle: click, play. Figma: paste a link, see the design.

2. **Replaces an existing painful workflow 10x, not a new behaviour.** The user already does this task with pain (sharing design files, taking notes, writing code, sending files). The product doesn't ask them to change habits — it kills the pain in their existing habit. Dropbox killed "email the file to yourself."

3. **Every use produces a shareable artifact.** Using the product IS marketing it. Figma link. ChatGPT screenshot. Wordle emoji-grid. TikTok video. Notion page. Stripe payment link. If using the product leaves no shareable trace, it relies on paid acquisition.

4. **Demo-able in a 10-second video/screenshot.** The value is visually and viscerally obvious. "You type, AI writes code" — 10 seconds. "You paint with emojis" — 10 seconds. "SEC filings get diffed by AI" — 30 seconds and requires explanation, so score it lower here.

5. **Timing unlock — something was just barely possible.** The tech or infra made it newly feasible in the last 12–24 months. LLMs for ChatGPT. Browser canvas for Figma. Mobile data speed for TikTok. WebGL for Framer. Claude/GPT-4 for everything AI right now. If an idea was equally possible in 2019, it's probably not riding a wave.

6. **Emotional payoff, not just utility.** Delight, pride, relief, FOMO, status, curiosity. Wordle → pride at sharing the grid. TikTok → dopamine loop. ChatGPT → wonder. Figma → relief from file chaos. Pure-utility products (better spreadsheet, better Jira) rarely pop — they grow, they don't explode.

7. **Consumer-grade UX even if the market is B2B.** Beautiful, fast, mobile-friendly, no training required. Slack won in enterprise because it felt like a consumer chat app. Stripe won because the docs + API felt like a hobbyist tool. Linear is winning Jira's market on this alone.

Total scoring guide:
- **30–35:** rocket-ship profile, build aggressively with a launch plan
- **20–29:** strong but not viral — steady growth, B2B SaaS shape
- **10–19:** depth product — compounds over years, needs sales motion
- **under 10:** reconsider whether the idea is worth your scarce time vs. a higher-rocket alternative

Note: many of the scanner's best ideas score 15–25 because they're niche B2B / analytical tools with deep moats but no viral hook. That's fine — it just tells you the shape of the business you're building. Don't force virality onto a depth product by gamifying it; that's how good products die.

## OUTPUT

Return a ranked list of the survivors, with this shape for each:

    ### Idea #N: [SHORT NAME]

    **What it does (2 sentences):** ...

    **Why it's rare:** what makes most people skip it

    **LLM leverage:** why an LLM is specifically the right tool

    **Data sources:** the free/cheap public sources that feed it

    **Signal → trade loop:** exact mechanics, in 3–5 steps

    **v1 scope + time:** what one dev ships in the first 2 weeks

    **Who already sells this (if anyone):** pro-tier competitors and their price

    **Kill switch:** the thing that would make this idea stop working

    **Rocket-ship score:** total out of 35, with a one-line note per trait (e.g. "TTFV: 2 — requires account + watchlist + 48hr first filing").

Do NOT include ideas that are already retail-mainstream (insider transactions, Reddit sentiment, options flow, unusual whale alerts, on-chain NFT sniping, copy-trading Congress). Those filters fail on step 3.

Return 5 ideas, ranked by (LLM leverage × rarity × shippability). Be honest when none of your ideas make the cut — say so and try the filter again with a broader domain.
```

---

## Worked examples

The three ideas the scanner produced for `US-listed stock trading, one dev, ship in 4 weeks`:

### Quiet Risk — 10-K/10-Q risk factor delta scanner
EDGAR publishes every 10-K and 10-Q. Each has a Risk Factors section (20–50 pages of legalese). Diff the section against the prior filing for the same company, have Claude score additions/deletions by severity. When a company quietly adds _"ongoing SEC investigation"_ or expands supply-chain risk from 2 paragraphs to 8, that is the single most predictive retail-invisible signal. Funds have analysts for this; retail doesn't.

**Rocket score: 17/35** — depth product. TTFV slow (3), no shareable artifact (2), demo requires explanation (2), LLM-timing unlock (5), emotional payoff thin (2), consumer UX achievable (4), workflow replacement (there isn't one for retail, so "net-new behaviour" not "10x existing") (3). Verdict: compounding B2C product, not viral. Good for a paid waitlist, not a Twitter explosion.

### Tone Drift — earnings call language delta
Not sentiment (everyone does that). Compare THIS quarter's CEO/CFO language to LAST quarter's on the same topics. When a CEO moves from _"strong demand"_ to _"robust but selective demand,"_ that's the leading indicator. Requires LLM to reason across transcripts — rule-based code cannot.

**Rocket score: 19/35** — similar shape to Quiet Risk. Slightly higher because earnings calls have a clearer cadence (quarterly news cycle = built-in media moments) and tone-shift quotes are more screenshot-shareable than risk-factor diffs (4 on shareability vs 2).

### Hiring Radar — job posting intent delta
Scrape career pages weekly (most are crawlable), measure week-over-week change in job count by category (AI infra, legal, sales, supply chain). A 3x spike in AI infra hiring at a mid-cap industrial is often 6–12 months ahead of an AI pivot announcement. Revealed Intelligence sells this to funds for $50K/year. Very little retail equivalent.

**Rocket score: 22/35** — tops the three. Shareable artifact (the chart of "AI hires at $TICKER" 10x'd → instant Twitter fodder, 5), demo-able (4), emotional payoff ("I saw it before anyone else" = status, 4), consumer UX (4). Still depth-product shape overall but has the clearest viral hook if you price it free and the charts are beautiful.

All three survived all 5 filters. The first has the purest LLM edge; the third is the most "data pipeline with LLM on top." Pick based on whether you want a pure text-diff product or something more data-engineering-flavoured.

---

## Meta note

The scanner isn't generating ideas from nothing — it's applying a structured skepticism to everything. Most "unique idea" brainstorms skip filter 3 (retail exhaustion) because it's tedious, and end up producing rehashes. The filter is your moat, not the LLM.
