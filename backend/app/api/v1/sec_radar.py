"""SEC Radar REST endpoints.

All routes require auth. Prefix: /sec-radar.

Note: filings are ingested asynchronously by the Celery task
`sec_radar_tasks.poll_watchlist`. Endpoints here only read persisted state
and manage watchlist membership.
"""
from __future__ import annotations

import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.database import get_db
from app.models.sec_radar import (
    SECFiling,
    SECPaperPosition,
    SECRiskSignal,
    SECWatchlist,
)
from app.models.user import User
from app.schemas.sec_radar import (
    PaperPositionResponse,
    RiskSignalDetail,
    RiskSignalSummary,
    WatchlistAddRequest,
    WatchlistItem,
)
from app.services.edgar_service import resolve_ticker_to_cik

router = APIRouter(prefix="/sec-radar", tags=["sec-radar"])


@router.get("/watchlist", response_model=list[WatchlistItem])
async def list_watchlist(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(SECWatchlist)
        .where(SECWatchlist.user_id == user.id)
        .order_by(SECWatchlist.created_at.desc())
    )
    return list(result.scalars().all())


@router.post("/watchlist", response_model=WatchlistItem, status_code=status.HTTP_201_CREATED)
async def add_to_watchlist(
    payload: WatchlistAddRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    ticker = payload.ticker.upper().strip()

    # Duplicate check.
    existing = await db.execute(
        select(SECWatchlist).where(
            and_(SECWatchlist.user_id == user.id, SECWatchlist.ticker == ticker)
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail=f"{ticker} is already on your SEC Radar watchlist")

    # Resolve CIK via EDGAR.
    try:
        resolved = await resolve_ticker_to_cik(ticker)
    except Exception:
        raise HTTPException(status_code=502, detail="EDGAR lookup failed. Try again in a minute.")
    if resolved is None:
        raise HTTPException(status_code=404, detail=f"No SEC filings found for ticker {ticker}")
    cik, company_name = resolved

    item = SECWatchlist(user_id=user.id, ticker=ticker, cik=cik, company_name=company_name)
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item


@router.delete("/watchlist/{watchlist_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_from_watchlist(
    watchlist_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(SECWatchlist).where(
            and_(SECWatchlist.id == watchlist_id, SECWatchlist.user_id == user.id)
        )
    )
    item = result.scalar_one_or_none()
    if item is None:
        raise HTTPException(status_code=404, detail="Watchlist item not found")
    await db.delete(item)
    await db.commit()


@router.get("/signals", response_model=list[RiskSignalSummary])
async def list_signals(
    since: datetime | None = Query(default=None, description="ISO timestamp — only signals newer than this"),
    severity: str | None = Query(default=None, description="low|medium|high|critical"),
    limit: int = Query(default=50, ge=1, le=200),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Signals for the user's watchlisted tickers, newest first."""
    tickers_result = await db.execute(
        select(SECWatchlist.ticker).where(SECWatchlist.user_id == user.id)
    )
    tickers = {row[0] for row in tickers_result}
    if not tickers:
        return []

    stmt = (
        select(SECRiskSignal)
        .where(SECRiskSignal.ticker.in_(tickers))
        .order_by(SECRiskSignal.created_at.desc())
        .limit(limit)
    )
    if since is not None:
        stmt = stmt.where(SECRiskSignal.created_at > since)
    if severity:
        stmt = stmt.where(SECRiskSignal.severity == severity.lower())

    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.get("/signals/{signal_id}", response_model=RiskSignalDetail)
async def get_signal(
    signal_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(SECRiskSignal).where(SECRiskSignal.id == signal_id))
    signal = result.scalar_one_or_none()
    if signal is None:
        raise HTTPException(status_code=404, detail="Signal not found")

    # Authorization: only users watching this ticker can see the detail.
    watched = await db.execute(
        select(SECWatchlist.id).where(
            and_(SECWatchlist.user_id == user.id, SECWatchlist.ticker == signal.ticker)
        )
    )
    if watched.scalar_one_or_none() is None:
        raise HTTPException(status_code=403, detail="Not on your watchlist")

    filing = await db.get(SECFiling, signal.filing_id) if signal.filing_id else None
    response = RiskSignalDetail.model_validate(signal)
    if filing is not None:
        response.filing_form_type = filing.form_type
        response.filing_filed_at = filing.filed_at
        response.filing_primary_doc_url = filing.primary_doc_url
    return response


@router.get("/positions", response_model=list[PaperPositionResponse])
async def list_positions(
    status_filter: str | None = Query(default=None, alias="status", description="open|closed"),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(SECPaperPosition)
        .where(SECPaperPosition.user_id == user.id)
        .order_by(SECPaperPosition.opened_at.desc())
    )
    if status_filter in ("open", "closed"):
        stmt = stmt.where(SECPaperPosition.status == status_filter)
    result = await db.execute(stmt)
    return list(result.scalars().all())
