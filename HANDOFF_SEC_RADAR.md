# Handoff: SEC Radar ("Quiet Risk") — build spec for local Claude

This file is the complete spec for building the **SEC Radar** feature on xbot-trader. Paste the "starter prompt" section (at the bottom) into Claude Code on your Parrot OS box, and it'll have everything it needs to continue.

Nothing is scaffolded yet — intentional, so local Claude can make its own choices with full context instead of inheriting half-formed code from a web sandbox that can't reach EDGAR or the Anthropic API.

---

## What we're building

A new section on xbot-trader called **SEC Radar** that:

1. Watches a user's selected stock tickers
2. Pulls each new 10-K / 10-Q filing from SEC EDGAR
3. Diffs the filing's **Risk Factors** section against the same company's prior filing
4. Sends the diff to Claude to score each new/expanded risk by severity and novelty
5. Surfaces the signals in the UI as an alert feed
6. Paper-trades each Critical-severity signal (short entry 2 trading days after filing, close at +7 days), tracking the simulated P&L alongside xbot-trader's existing paper portfolio

Outcome: when a user logs in, their SEC Radar shows things like:
> 🔴 **NVDA** — Q3 10-Q added new risk section on **export controls (+3 paragraphs)**. Severity: High. Paper-trade opened: short 5 shares at $840.12.

---

## Why this is the right feature

- **Signal quality:** Adding or expanding language in the Risk Factors section is the single highest-return-per-pageview retail-invisible stock signal. Academics have studied this going back to the 2005 Risk Factors mandate; funds pay analysts to read every 10-Q; retail has no polished product.
- **LLM-native:** The core task is _"compare two long pieces of legal prose and tell me what is materially new."_ This is the kind of task LLMs do much better than rule-based NLP or regex diffs.
- **Free data:** SEC EDGAR has a free JSON API with no auth and generous rate limits (10 req/sec per `User-Agent`).
- **Clean fit:** xbot-trader already has Alpaca integration for US stocks, paper-trading infrastructure, the ErrorBoundary + Suspense routing pattern, and an AI Assistant — SEC Radar extends all four without inventing anything new.
- **Competitor price point:** Bloomberg Terminal has filing-delta tools for ~$24K/year per seat. Tikr, Koyfin, FinChat show raw 10-K text but don't do language deltas. The gap is real.

---

## Architecture

### Backend (FastAPI + SQLAlchemy + Celery, already in place)

```
backend/app/
├── models/
│   └── sec_radar.py          # NEW: SECFiling, SECRiskSignal, SECWatchlist, SECPaperPosition
├── api/v1/
│   └── sec_radar.py          # NEW: REST endpoints
├── services/
│   ├── edgar_service.py      # NEW: EDGAR HTTP client, filing fetcher, section extractor
│   └── risk_delta_service.py # NEW: runs the Claude-based diff, scores, writes signals
└── tasks/
    └── sec_radar_tasks.py    # NEW: Celery periodic task — poll EDGAR every 30 min
```

**Alembic migration:** new file `backend/alembic/versions/007_add_sec_radar.py` — creates the four tables above. Keep the migration chain intact; look at `006_add_backtest_runs.py` for the pattern.

### Frontend (Vite + React + React Router, already in place)

```
frontend/src/
├── pages/
│   └── SECRadarPage.tsx      # NEW: alert feed, watchlist manager, paper-position table
├── components/
│   └── RiskSignalCard.tsx    # NEW: one card per signal, expandable to show the actual diff
├── api/
│   └── secRadar.ts           # NEW: HTTP wrappers
├── App.tsx                   # edit: add /sec-radar route
└── components/Layout.tsx     # edit: add sidebar icon 🛰️ "SEC Radar"
```

---

## Data model (SQLAlchemy)

```python
# backend/app/models/sec_radar.py
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, Text, Boolean, JSON
from sqlalchemy.orm import relationship
from app.database import Base
import uuid

def _uuid():
    return str(uuid.uuid4())

class SECWatchlist(Base):
    __tablename__ = "sec_watchlist"
    id = Column(String, primary_key=True, default=_uuid)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    ticker = Column(String, nullable=False, index=True)       # e.g. "NVDA"
    cik = Column(String, nullable=False)                      # EDGAR CIK, zero-padded
    created_at = Column(DateTime, nullable=False)
    # unique(user_id, ticker) — add in migration

class SECFiling(Base):
    __tablename__ = "sec_filings"
    id = Column(String, primary_key=True, default=_uuid)
    cik = Column(String, nullable=False, index=True)
    accession_number = Column(String, nullable=False, unique=True)  # EDGAR unique id
    form_type = Column(String, nullable=False)                # "10-K" | "10-Q"
    filed_at = Column(DateTime, nullable=False, index=True)
    period_of_report = Column(String)                         # "2025-09-30"
    primary_doc_url = Column(String, nullable=False)          # EDGAR URL to the 10-K/10-Q
    risk_factors_text = Column(Text)                          # extracted Item 1A (10-K) / Item 1A updates (10-Q)
    processed_at = Column(DateTime)                           # when we ran the delta on it

class SECRiskSignal(Base):
    __tablename__ = "sec_risk_signals"
    id = Column(String, primary_key=True, default=_uuid)
    filing_id = Column(String, ForeignKey("sec_filings.id", ondelete="CASCADE"), index=True)
    prior_filing_id = Column(String, ForeignKey("sec_filings.id", ondelete="SET NULL"))
    ticker = Column(String, nullable=False, index=True)
    signal_type = Column(String, nullable=False)              # "added" | "expanded" | "removed"
    severity = Column(String, nullable=False)                 # "low" | "medium" | "high" | "critical"
    novelty = Column(Float)                                   # 0.0–1.0, Claude's sense of "is this genuinely new"
    summary = Column(String, nullable=False)                  # 1-line headline, Claude-written
    detail = Column(Text, nullable=False)                     # 2-3 paragraph explanation
    diff_excerpt = Column(Text, nullable=False)               # the actual added/changed text
    created_at = Column(DateTime, nullable=False, index=True)

class SECPaperPosition(Base):
    __tablename__ = "sec_paper_positions"
    id = Column(String, primary_key=True, default=_uuid)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), index=True)
    signal_id = Column(String, ForeignKey("sec_risk_signals.id", ondelete="SET NULL"))
    ticker = Column(String, nullable=False, index=True)
    side = Column(String, nullable=False)                     # "short" | "long"
    opened_at = Column(DateTime, nullable=False)
    entry_price = Column(Float, nullable=False)
    close_at = Column(DateTime)                               # null until closed
    exit_price = Column(Float)
    pnl = Column(Float)
    pnl_pct = Column(Float)
    qty = Column(Integer, nullable=False)
```

---

## API endpoints

All protected by the existing JWT auth (see `backend/app/api/v1/auth.py`). Prefix: `/api/v1/sec-radar`.

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/watchlist` | list user's tickers |
| `POST` | `/watchlist` | add ticker `{ticker}` — resolve CIK server-side via EDGAR company_tickers.json |
| `DELETE` | `/watchlist/{id}` | remove |
| `GET` | `/signals?since=<iso>` | paginated signal feed for user's watchlist |
| `GET` | `/signals/{id}` | full detail inc. diff excerpt |
| `GET` | `/positions?status=open|closed` | paper positions |
| `POST` | `/admin/refresh/{cik}` | (admin only) force a re-fetch of latest filings |

---

## The two hard parts

### Part 1: Extracting Risk Factors from a 10-K / 10-Q

EDGAR filings come as HTML (sometimes bad HTML). The Risk Factors section is **Item 1A** in 10-K, and updates appear in 10-Q under **Item 1A** or sometimes **Part II Item 1A**.

Approach:
1. Fetch the `primary_doc_url` HTML.
2. Strip to plain text with BeautifulSoup (`'html.parser'`).
3. Find Item 1A: regex `r"item\s*1a\.?\s*risk\s*factors"` (case-insensitive, with flexible whitespace).
4. Grab text until the next `Item 1B` / `Item 2` / `Part II` marker.
5. Fallback: if extraction fails, store the raw doc URL and mark `risk_factors_text = NULL` — the diff service skips filings with no extracted text.

**Recommended library:** `sec-edgar-downloader` (pip) handles EDGAR fetching and form identification; `unstructured` or hand-rolled BS4 for section extraction.

### Part 2: Running the diff with Claude

Use the Anthropic Messages API (`claude-sonnet-4-6` is the sweet spot for cost/quality on this task — don't use Haiku, the nuance matters).

Prompt shape:

```python
SYSTEM = """You are a financial filings analyst. You compare two Risk Factors
sections from consecutive SEC filings by the same company and identify material
language changes. You do NOT editorialize. You report what is demonstrably
different."""

USER = f"""Company: {ticker}
Prior filing: {prior_form} filed {prior_date}
Current filing: {current_form} filed {current_date}

=== PRIOR RISK FACTORS ===
{prior_text[:30000]}

=== CURRENT RISK FACTORS ===
{current_text[:30000]}

Return a JSON array. Each element is a single material change:

[{{
  "signal_type": "added" | "expanded" | "removed",
  "severity": "low" | "medium" | "high" | "critical",
  "novelty": 0.0-1.0,
  "summary": "one-line headline, under 100 chars",
  "detail": "2-3 paragraphs explaining what changed and why it matters",
  "diff_excerpt": "the actual new/changed text, verbatim, max 500 chars"
}}]

Severity rubric:
- critical: regulatory investigations, litigation with stated damages, going-concern language, guidance withdrawal
- high: new material customer concentration, supply chain disruption named, geographic ban, new legal proceedings
- medium: expanded competitive pressure language, new minor regulation cited, expanded cyber/privacy risk
- low: boilerplate updates, date rolls, cosmetic wording changes

Ignore boilerplate ("forward-looking statements", "cautionary language") and cosmetic edits.
If no material changes, return []."""
```

**Cost estimate per filing:** ~30K input tokens + ~2K output ≈ $0.10. A user watching 20 tickers with 4 filings/year each = 80 filings × $0.10 = **~$8/year per user.** Very affordable.

**Rate limit strategy:** process filings one at a time in the Celery task, not concurrently. EDGAR is fine with 10 req/sec; Anthropic is fine with sensible pacing.

---

## UI sketch

`SECRadarPage.tsx` layout:

```
┌───────────────────────────────────────────────────────────┐
│  SEC Radar                                                │
│  AI-read SEC filings, surface quiet risk changes          │
├─────────────────────────┬─────────────────────────────────┤
│                         │                                 │
│  Watchlist              │   Recent signals                │
│  ┌─────────────────┐    │   ┌────────────────────────┐    │
│  │ NVDA        [x] │    │   │ 🔴 HIGH  NVDA          │    │
│  │ TSLA        [x] │    │   │ New export-control... │    │
│  │ AAPL        [x] │    │   │ 10-Q filed 2d ago     │    │
│  │ + add ticker    │    │   └────────────────────────┘    │
│  └─────────────────┘    │   ┌────────────────────────┐    │
│                         │   │ 🟡 MED   TSLA          │    │
│  Paper P&L (30d)        │   │ Expanded supply chain  │    │
│  +$127 • 4 wins / 1 loss│   └────────────────────────┘    │
│                         │   [more signals...]             │
└─────────────────────────┴─────────────────────────────────┘
```

Use the existing Tailwind palette from `Layout.tsx`:
- Background: `bg-[#0d0d20]` with `border-white/5`
- Severity colors: `text-red-400 border-red-500/30` (critical), `text-orange-400 border-orange-500/30` (high), `text-yellow-400 border-yellow-500/30` (medium), `text-gray-400 border-white/10` (low)

New sidebar entry in `frontend/src/components/Layout.tsx` in the `navItems` array (after Backtest Lab, before AI Assistant):

```tsx
{ path: '/sec-radar', label: 'SEC Radar', icon: '🛰️' },
```

New route in `frontend/src/App.tsx` inside the protected `<Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>` block:

```tsx
<Route path="/sec-radar" element={<SECRadarPage />} />
```

Don't forget to import and `lazy()` the page at the top of App.tsx — the file follows that pattern for every other page.

---

## Build order (do it in this sequence)

1. **Alembic migration + models** — get the DB schema landed first, run `alembic upgrade head` locally against the dev DB to confirm. Don't touch anything else yet.
2. **EDGAR service** — `edgar_service.py` with two functions: `fetch_recent_filings(cik)` and `extract_risk_factors(html) -> str | None`. Write pytest tests against a saved 10-K HTML fixture. Don't hit EDGAR in tests.
3. **Risk delta service** — `risk_delta_service.py` with `compute_signals(prior_filing: SECFiling, current_filing: SECFiling) -> list[dict]`. Mock the Anthropic client in tests.
4. **Celery task** — every 30 min: for each unique CIK in `sec_watchlist`, fetch EDGAR, compare filing count to DB, process new filings. Write to `sec_filings` and `sec_risk_signals`.
5. **API router + schemas** — thin layer over the services. Use existing auth dependency.
6. **Paper trade trigger** — on new Critical signal, schedule a Celery task that runs 2 trading days later to open a short paper position (fetch current price from Alpaca), then another 7 trading days later to close.
7. **Frontend page** — skeleton with loading states first, then wire to API. The ErrorBoundary from commit `3419488` will catch any page-level crash, so don't worry about belt-and-suspenders error handling inside the page.
8. **Sidebar icon + route** — last, once the page is rendering cleanly.

---

## Things to NOT do

- Do NOT use Haiku for the diff — it's too cheap but misses the nuance. Sonnet 4.6 is the floor.
- Do NOT fetch EDGAR from the frontend. EDGAR's ToS requires a `User-Agent` with a contact email, and you don't want user IPs hammering their CDN. Always proxy through the backend.
- Do NOT concurrent-fetch filings. One at a time, in Celery, with `time.sleep(0.15)` between HTTP calls to stay under 10 req/sec.
- Do NOT store the full 10-K text. Only the Risk Factors section. A 10-K is 200+ pages; Risk Factors alone is usually 15–40.
- Do NOT auto-trade anything other than paper. The whole feature stays in paper mode until the user explicitly wants to wire it to Alpaca live. Even then, put it behind a second confirmation modal.
- Do NOT make this a premium-tier gate in v1. Build it for everyone first, gate later if you see adoption.

---

## Testing strategy

- Fixture: pull 2–3 real 10-Q pairs (consecutive filings from the same company) into `backend/tests/fixtures/sec/`. Use them for both the extraction service tests and the delta service tests.
- Integration test: seed a `SECFiling` and a prior one in a test DB, call `compute_signals`, assert the output shape.
- Frontend: snapshot the `SECRadarPage` with a mocked signal list, one for each severity color.

---

## Deployment notes

- Celery worker on Railway (service `celery-worker`) needs `ANTHROPIC_API_KEY` + EDGAR `User-Agent` env var. Add both to the Railway dashboard, don't check into `.env`.
- Add `ANTHROPIC_API_KEY` to `backend/app/config.py` (it's already in the Settings class).
- The `ANTIGRAVITY_*` provider chain that PR #3 added can transparently proxy the calls if `ANTIGRAVITY_BASE_URL` is set — no changes needed.

---

## Starter prompt for local Claude

Paste this into Claude Code running on your laptop after cloning the repo:

---

```
Read /HANDOFF_SEC_RADAR.md in this repo. It is the complete build spec
for a new feature called SEC Radar.

Follow the "Build order" section step by step. At each step:
1. Tell me what you're about to do in one sentence.
2. Show the diff before you apply it.
3. Run the tests for that layer.
4. Commit with a descriptive message.

Do not skip steps. Do not build multiple layers in one commit.

Start with step 1: the Alembic migration and the SQLAlchemy models.
Before writing the migration, open backend/alembic/versions/006_add_backtest_runs.py
so you match the existing migration style (down_revision, schema definitions,
upgrade/downgrade pair).

Ask me only if:
- You need a decision about business logic that the spec doesn't cover.
- A dependency is missing from requirements.txt.
- You hit an external service (EDGAR, Anthropic) you can't reach and the task
  genuinely can't proceed without it.

For everything else, make the call and keep moving. I trust your judgment
within the spec.
```

---

## Next features after SEC Radar lands

Once Quiet Risk is in production and you have paper P&L data to point at, the scanner's other two survivors become natural follow-ons:

- **Tone Drift** (earnings call language deltas) — same data pipeline pattern, different source. Reuses the risk_delta_service scoring shape.
- **Hiring Radar** (career-page scrape) — different pipeline (ScraperAPI or plain HTTP + regex), same UI pattern.

Both share the `sec_watchlist` mental model — add a ticker, get signals. The abstraction is worth factoring out once you have two features that need it.

---

_Generated: 2026-04-22. Spec version: v1._
