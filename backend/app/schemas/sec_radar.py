"""Pydantic schemas for SEC Radar endpoints."""
from __future__ import annotations

import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field


class WatchlistAddRequest(BaseModel):
    ticker: str = Field(..., min_length=1, max_length=10, description="Stock ticker, e.g. NVDA")


class WatchlistItem(BaseModel):
    id: uuid.UUID
    ticker: str
    cik: str
    company_name: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class RiskSignalSummary(BaseModel):
    id: uuid.UUID
    ticker: str
    signal_type: str
    severity: str
    novelty: Decimal | None = None
    summary: str
    filing_id: uuid.UUID
    created_at: datetime

    class Config:
        from_attributes = True


class RiskSignalDetail(RiskSignalSummary):
    detail: str
    diff_excerpt: str
    prior_filing_id: uuid.UUID | None = None
    filing_form_type: str | None = None
    filing_filed_at: datetime | None = None
    filing_primary_doc_url: str | None = None


class PaperPositionResponse(BaseModel):
    id: uuid.UUID
    ticker: str
    side: str
    qty: int
    opened_at: datetime
    entry_price: Decimal
    close_at: datetime | None = None
    exit_price: Decimal | None = None
    pnl: Decimal | None = None
    pnl_pct: Decimal | None = None
    status: str
    signal_id: uuid.UUID | None = None

    class Config:
        from_attributes = True
