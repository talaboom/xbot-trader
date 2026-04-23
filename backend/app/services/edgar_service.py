"""EDGAR fetching and Risk Factors extraction.

EDGAR requires a descriptive User-Agent per their fair-access policy. Set
SEC_USER_AGENT in config.py to something like "X Bot Trader (you@example.com)".

This service is intentionally stateless — it knows how to talk to EDGAR and
extract Item 1A from a filing. Persistence is the caller's job.
"""
from __future__ import annotations

import asyncio
import logging
import re
from dataclasses import dataclass
from datetime import datetime, timezone

import httpx
from bs4 import BeautifulSoup

from app.config import settings

logger = logging.getLogger(__name__)

EDGAR_BASE = "https://www.sec.gov"
COMPANY_TICKERS_URL = "https://www.sec.gov/files/company_tickers.json"
SUBMISSIONS_URL = "https://data.sec.gov/submissions/CIK{cik_padded}.json"

# Form types we care about — annual and quarterly. Ignore amendments for v1.
WATCHED_FORMS = {"10-K", "10-Q"}

# EDGAR fair-access: stay below 10 req/sec.
_REQUEST_DELAY_SECONDS = 0.15


@dataclass
class EdgarFilingMeta:
    cik: str
    ticker: str | None
    accession_number: str
    form_type: str
    filed_at: datetime
    period_of_report: str | None
    primary_doc_url: str


def _headers() -> dict:
    return {"User-Agent": settings.SEC_USER_AGENT, "Accept-Encoding": "gzip, deflate"}


def _pad_cik(cik: str | int) -> str:
    return str(cik).zfill(10)


async def resolve_ticker_to_cik(ticker: str) -> tuple[str, str | None] | None:
    """Look up the CIK for a US-listed ticker via EDGAR's company_tickers.json.

    Returns (cik_padded, company_name) or None if not found.
    """
    ticker_upper = ticker.upper().strip()
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.get(COMPANY_TICKERS_URL, headers=_headers())
        resp.raise_for_status()
        data = resp.json()
    # company_tickers.json shape: {"0": {"cik_str": 320193, "ticker": "AAPL", "title": "Apple Inc."}, ...}
    for _, row in data.items():
        if str(row.get("ticker", "")).upper() == ticker_upper:
            return _pad_cik(row["cik_str"]), row.get("title")
    return None


async def fetch_recent_filings(cik: str, limit: int = 10) -> list[EdgarFilingMeta]:
    """Fetch the most recent 10-K / 10-Q filings for a CIK.

    Returns newest-first. Swallows network errors and returns [] so the
    caller can retry on the next poll tick.
    """
    cik_padded = _pad_cik(cik)
    url = SUBMISSIONS_URL.format(cik_padded=cik_padded)
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.get(url, headers=_headers())
            resp.raise_for_status()
            data = resp.json()
    except Exception as e:
        logger.warning("EDGAR submissions fetch failed for CIK %s: %s", cik_padded, e)
        return []

    recent = (data.get("filings") or {}).get("recent") or {}
    forms = recent.get("form") or []
    accession_numbers = recent.get("accessionNumber") or []
    filing_dates = recent.get("filingDate") or []
    primary_docs = recent.get("primaryDocument") or []
    report_dates = recent.get("reportDate") or []
    tickers = data.get("tickers") or []
    ticker = tickers[0] if tickers else None

    out: list[EdgarFilingMeta] = []
    for form, accession, filed, primary, period in zip(
        forms, accession_numbers, filing_dates, primary_docs, report_dates
    ):
        if form not in WATCHED_FORMS:
            continue
        accession_clean = accession.replace("-", "")
        primary_url = f"{EDGAR_BASE}/Archives/edgar/data/{int(cik_padded)}/{accession_clean}/{primary}"
        try:
            filed_at = datetime.fromisoformat(filed).replace(tzinfo=timezone.utc)
        except ValueError:
            continue
        out.append(
            EdgarFilingMeta(
                cik=cik_padded,
                ticker=ticker,
                accession_number=accession,
                form_type=form,
                filed_at=filed_at,
                period_of_report=period or None,
                primary_doc_url=primary_url,
            )
        )
        if len(out) >= limit:
            break
    return out


async def fetch_filing_html(primary_doc_url: str) -> str | None:
    """Fetch the HTML body of a filing. Returns None on failure."""
    try:
        async with httpx.AsyncClient(timeout=60.0, follow_redirects=True) as client:
            resp = await client.get(primary_doc_url, headers=_headers())
            resp.raise_for_status()
        await asyncio.sleep(_REQUEST_DELAY_SECONDS)
        return resp.text
    except Exception as e:
        logger.warning("EDGAR filing fetch failed for %s: %s", primary_doc_url, e)
        return None


# Section headers: "Item 1A" (10-K) and sometimes "Item 1A" inside Part II of 10-Q updates.
_ITEM_1A_START = re.compile(
    r"item\s*1a\.?\s*[-–—:]?\s*risk\s*factors",
    re.IGNORECASE,
)
# Anything that signals the end of Item 1A.
_ITEM_1A_END = re.compile(
    r"item\s*1b\.?|item\s*2\.?\s*(properties|unresolved|management)|part\s*ii",
    re.IGNORECASE,
)


def extract_risk_factors(html: str) -> str | None:
    """Extract the Risk Factors section (Item 1A) from a 10-K/10-Q HTML body.

    Strategy: strip HTML to plain text, locate the Item 1A header, slice
    forward until the next Item / Part II boundary. Returns None if the
    section can't be identified confidently (caller should mark the filing
    as unprocessable and skip it — don't guess).
    """
    if not html:
        return None

    soup = BeautifulSoup(html, "html.parser")
    # Kill scripts/styles — some filings include inline XBRL <script> noise.
    for tag in soup(["script", "style"]):
        tag.decompose()
    text = soup.get_text("\n")
    # Normalize whitespace. Filings often have weird non-breaking spaces and
    # page-break line-noise that trips the regex.
    text = text.replace("\xa0", " ")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)

    # Find all candidate "Item 1A Risk Factors" positions. The TOC sometimes
    # lists "Item 1A. Risk Factors" too, so we want the LATER occurrence as
    # the actual section start.
    starts = [m.start() for m in _ITEM_1A_START.finditer(text)]
    if not starts:
        return None

    start = starts[-1] if len(starts) > 1 else starts[0]
    rest = text[start:]
    end_match = _ITEM_1A_END.search(rest[100:])  # skip the header itself
    section = rest[: 100 + end_match.start()] if end_match else rest
    section = section.strip()

    # Sanity: a real Risk Factors section is at least ~500 chars. Anything
    # shorter is probably a TOC entry or an empty placeholder ("there have
    # been no material changes" language in a 10-Q is fine and will still
    # be long enough).
    if len(section) < 500:
        return None
    # Cap to something reasonable — no Risk Factors is legitimately > 200K
    # chars, and Anthropic input costs scale linearly.
    return section[:200_000]
