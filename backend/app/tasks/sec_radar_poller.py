"""Celery task: poll EDGAR for new filings on watchlisted CIKs and run the
Risk Factors delta through Claude.

Schedule this every 30 minutes from celery beat. The task is idempotent —
it uses SECFiling.accession_number (unique) to avoid re-processing.
"""
from __future__ import annotations

import asyncio
import logging
import os
import uuid
from datetime import datetime, timezone

from celery import shared_task
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

from app.models.sec_radar import SECFiling, SECRiskSignal, SECWatchlist
from app.services.edgar_service import (
    EdgarFilingMeta,
    extract_risk_factors,
    fetch_filing_html,
    fetch_recent_filings,
)
from app.services.risk_delta_service import compute_signals

logger = logging.getLogger(__name__)


def _sync_db_url() -> str:
    url = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@db:5432/xbot")
    return url.replace("postgresql+asyncpg://", "postgresql://")


def _unique_ciks(db: Session) -> list[tuple[str, str]]:
    """Return (cik, example_ticker) tuples for every CIK on any watchlist."""
    rows = db.execute(select(SECWatchlist.cik, SECWatchlist.ticker).distinct()).all()
    # Collapse duplicates on CIK, keeping the first ticker seen.
    seen: dict[str, str] = {}
    for cik, ticker in rows:
        seen.setdefault(cik, ticker)
    return list(seen.items())


def _upsert_filing(db: Session, meta: EdgarFilingMeta) -> SECFiling | None:
    """Insert a filing row if we haven't seen its accession_number before.

    Returns the filing row if newly inserted (caller will process it), or
    None if it already existed.
    """
    existing = db.execute(
        select(SECFiling).where(SECFiling.accession_number == meta.accession_number)
    ).scalar_one_or_none()
    if existing is not None:
        return None
    filing = SECFiling(
        cik=meta.cik,
        ticker=meta.ticker,
        accession_number=meta.accession_number,
        form_type=meta.form_type,
        filed_at=meta.filed_at,
        period_of_report=meta.period_of_report,
        primary_doc_url=meta.primary_doc_url,
    )
    db.add(filing)
    db.flush()  # assign the PK
    return filing


def _prior_processed_filing(db: Session, filing: SECFiling) -> SECFiling | None:
    """The most recent previously-processed filing for the same CIK."""
    return db.execute(
        select(SECFiling)
        .where(
            SECFiling.cik == filing.cik,
            SECFiling.id != filing.id,
            SECFiling.risk_factors_text.is_not(None),
            SECFiling.filed_at < filing.filed_at,
        )
        .order_by(SECFiling.filed_at.desc())
        .limit(1)
    ).scalar_one_or_none()


async def _process_new_filing(db: Session, filing: SECFiling, ticker: str | None) -> int:
    """Fetch the HTML, extract Risk Factors, diff against the prior, persist
    any signals. Returns the number of signals written.
    """
    html = await fetch_filing_html(filing.primary_doc_url)
    if not html:
        logger.warning("Could not fetch HTML for %s", filing.accession_number)
        return 0
    text = extract_risk_factors(html)
    filing.risk_factors_text = text
    filing.processed_at = datetime.now(timezone.utc)
    db.flush()

    if not text:
        logger.info("No Risk Factors section found in %s", filing.accession_number)
        return 0

    prior = _prior_processed_filing(db, filing)
    if prior is None or not prior.risk_factors_text:
        logger.info(
            "No prior filing with Risk Factors for CIK %s — establishing baseline only",
            filing.cik,
        )
        return 0

    signals = await compute_signals(
        ticker=ticker or filing.ticker or filing.cik,
        prior_form=prior.form_type,
        prior_date=prior.filed_at,
        current_form=filing.form_type,
        current_date=filing.filed_at,
        prior_text=prior.risk_factors_text,
        current_text=text,
    )
    for s in signals:
        db.add(
            SECRiskSignal(
                filing_id=filing.id,
                prior_filing_id=prior.id,
                ticker=ticker or filing.ticker or filing.cik,
                signal_type=s["signal_type"],
                severity=s["severity"],
                novelty=s["novelty"],
                summary=s["summary"],
                detail=s["detail"],
                diff_excerpt=s["diff_excerpt"],
            )
        )
    return len(signals)


@shared_task(name="sec_radar.poll_watchlist", bind=True, max_retries=0)
def poll_watchlist(self) -> dict:
    """Scan every watchlisted CIK for new 10-K/10-Q filings and process them."""
    engine = create_engine(_sync_db_url(), pool_pre_ping=True)
    processed = 0
    new_signals = 0
    with Session(engine) as db:
        cik_pairs = _unique_ciks(db)
        if not cik_pairs:
            return {"status": "ok", "ciks_scanned": 0, "filings_processed": 0, "signals_created": 0}

        for cik, ticker in cik_pairs:
            try:
                metas = asyncio.run(fetch_recent_filings(cik, limit=5))
            except Exception as e:
                logger.warning("fetch_recent_filings failed for CIK %s: %s", cik, e)
                continue

            for meta in metas:
                filing = _upsert_filing(db, meta)
                if filing is None:
                    continue  # already seen
                try:
                    created = asyncio.run(_process_new_filing(db, filing, ticker))
                    new_signals += created
                    processed += 1
                    db.commit()
                except Exception as e:
                    db.rollback()
                    logger.exception("Error processing filing %s: %s", meta.accession_number, e)

    return {
        "status": "ok",
        "ciks_scanned": len(cik_pairs),
        "filings_processed": processed,
        "signals_created": new_signals,
    }
