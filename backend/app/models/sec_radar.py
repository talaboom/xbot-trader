"""SEC Radar ("Quiet Risk") — tables for watchlists, filings, risk signals, paper positions."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


def _now() -> datetime:
    return datetime.now(timezone.utc)


class SECWatchlist(Base):
    __tablename__ = "sec_watchlist"
    __table_args__ = (UniqueConstraint("user_id", "ticker", name="uq_sec_watchlist_user_ticker"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    ticker: Mapped[str] = mapped_column(String(10), nullable=False)
    cik: Mapped[str] = mapped_column(String(10), nullable=False, index=True)
    company_name: Mapped[str | None] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)


class SECFiling(Base):
    __tablename__ = "sec_filings"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    cik: Mapped[str] = mapped_column(String(10), nullable=False, index=True)
    ticker: Mapped[str | None] = mapped_column(String(10), index=True)
    accession_number: Mapped[str] = mapped_column(String(25), nullable=False, unique=True)
    form_type: Mapped[str] = mapped_column(String(10), nullable=False)
    filed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    period_of_report: Mapped[str | None] = mapped_column(String(12))
    primary_doc_url: Mapped[str] = mapped_column(String(500), nullable=False)
    risk_factors_text: Mapped[str | None] = mapped_column(Text)
    processed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)


class SECRiskSignal(Base):
    __tablename__ = "sec_risk_signals"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    filing_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sec_filings.id", ondelete="CASCADE"), nullable=False, index=True
    )
    prior_filing_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sec_filings.id", ondelete="SET NULL")
    )
    ticker: Mapped[str] = mapped_column(String(10), nullable=False, index=True)
    signal_type: Mapped[str] = mapped_column(String(20), nullable=False)  # added | expanded | removed
    severity: Mapped[str] = mapped_column(String(20), nullable=False, index=True)  # low | medium | high | critical
    novelty: Mapped[Decimal | None] = mapped_column(Numeric(4, 3))  # 0..1
    summary: Mapped[str] = mapped_column(String(255), nullable=False)
    detail: Mapped[str] = mapped_column(Text, nullable=False)
    diff_excerpt: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, index=True)


class SECPaperPosition(Base):
    __tablename__ = "sec_paper_positions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    signal_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sec_risk_signals.id", ondelete="SET NULL")
    )
    ticker: Mapped[str] = mapped_column(String(10), nullable=False, index=True)
    side: Mapped[str] = mapped_column(String(10), nullable=False)  # short | long
    qty: Mapped[int] = mapped_column(Integer, nullable=False)
    opened_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    entry_price: Mapped[Decimal] = mapped_column(Numeric(20, 8), nullable=False)
    close_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    exit_price: Mapped[Decimal | None] = mapped_column(Numeric(20, 8))
    pnl: Mapped[Decimal | None] = mapped_column(Numeric(20, 8))
    pnl_pct: Mapped[Decimal | None] = mapped_column(Numeric(10, 4))
    status: Mapped[str] = mapped_column(String(20), default="open", index=True)  # open | closed
