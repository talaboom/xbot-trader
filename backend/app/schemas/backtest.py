from __future__ import annotations

import uuid
from datetime import datetime
from decimal import Decimal
from typing import Any

from pydantic import BaseModel, Field


class BacktestCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    product_id: str = Field(..., description="e.g. BTC-USD")
    strategy_type: str = Field(..., pattern="^(dca|grid)$")
    personality: str | None = Field(default=None, pattern="^(conservative|moderate|aggressive|degen)$")
    config: dict[str, Any]
    period_days: int = Field(..., ge=7, le=1825)
    starting_capital: float = Field(..., gt=0)


class BacktestResponse(BaseModel):
    id: uuid.UUID
    name: str
    product_id: str
    strategy_type: str
    personality: str | None
    config: dict[str, Any]
    period_days: int
    start_date: datetime
    end_date: datetime
    starting_capital: Decimal
    status: str
    error_message: str | None = None
    ending_capital: Decimal | None = None
    pnl: Decimal | None = None
    pnl_pct: Decimal | None = None
    max_drawdown_pct: Decimal | None = None
    win_rate_pct: Decimal | None = None
    sharpe_ratio: Decimal | None = None
    total_trades: int | None = None
    created_at: datetime
    completed_at: datetime | None = None

    class Config:
        from_attributes = True


class BacktestDetailResponse(BacktestResponse):
    equity_curve: list[dict[str, Any]] | None = None
    trades_log: list[dict[str, Any]] | None = None


class BacktestQuotaResponse(BaseModel):
    tier: str
    max_period_days: int
    monthly_limit: int | None  # None = unlimited
    used_this_month: int
    remaining: int | None  # None = unlimited
