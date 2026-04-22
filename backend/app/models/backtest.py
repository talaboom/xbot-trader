import uuid
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class BacktestRun(Base):
    __tablename__ = "backtest_runs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    name: Mapped[str] = mapped_column(String(120), nullable=False)
    product_id: Mapped[str] = mapped_column(String(20), nullable=False)
    strategy_type: Mapped[str] = mapped_column(String(50), nullable=False)
    personality: Mapped[str | None] = mapped_column(String(50))
    config: Mapped[dict] = mapped_column(JSONB, nullable=False)

    period_days: Mapped[int] = mapped_column(nullable=False)
    start_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    starting_capital: Mapped[Decimal] = mapped_column(Numeric(20, 8), nullable=False)

    status: Mapped[str] = mapped_column(String(20), default="pending", index=True)
    celery_task_id: Mapped[str | None] = mapped_column(String(255))
    error_message: Mapped[str | None] = mapped_column(Text)

    ending_capital: Mapped[Decimal | None] = mapped_column(Numeric(20, 8))
    pnl: Mapped[Decimal | None] = mapped_column(Numeric(20, 8))
    pnl_pct: Mapped[Decimal | None] = mapped_column(Numeric(10, 4))
    max_drawdown_pct: Mapped[Decimal | None] = mapped_column(Numeric(10, 4))
    win_rate_pct: Mapped[Decimal | None] = mapped_column(Numeric(10, 4))
    sharpe_ratio: Mapped[Decimal | None] = mapped_column(Numeric(10, 4))
    total_trades: Mapped[int | None] = mapped_column()

    equity_curve: Mapped[list | None] = mapped_column(JSONB)
    trades_log: Mapped[list | None] = mapped_column(JSONB)

    stripe_payment_intent_id: Mapped[str | None] = mapped_column(String(255))
    price_paid_cents: Mapped[int | None] = mapped_column()

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
