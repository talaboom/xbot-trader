from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.database import get_db
from app.models.backtest import BacktestRun
from app.models.user import User
from app.schemas.backtest import (
    BacktestCreate,
    BacktestDetailResponse,
    BacktestQuotaResponse,
    BacktestResponse,
)
from app.services.historical_data_service import SUPPORTED_PERIODS, SUPPORTED_PRODUCTS
from app.strategies.bot_personalities import apply_personality_to_config
from app.tasks.backtest_executor import run_backtest as run_backtest_task

router = APIRouter(prefix="/backtest", tags=["backtest"])


TIER_LIMITS = {
    "free":   {"max_period_days": 30,   "monthly_limit": 3},
    "trader": {"max_period_days": 730,  "monthly_limit": None},
    "pro":    {"max_period_days": 1825, "monthly_limit": None},
}


def _limits_for(tier: str) -> dict:
    return TIER_LIMITS.get(tier, TIER_LIMITS["free"])


async def _month_usage(db: AsyncSession, user_id: uuid.UUID) -> int:
    since = datetime.now(timezone.utc) - timedelta(days=30)
    result = await db.execute(
        select(func.count()).select_from(BacktestRun).where(
            BacktestRun.user_id == user_id,
            BacktestRun.created_at >= since,
        )
    )
    return int(result.scalar() or 0)


@router.get("/catalog")
async def catalog():
    """Supported products, periods, and tier limits — public to any authed user."""
    return {
        "products": SUPPORTED_PRODUCTS,
        "periods": SUPPORTED_PERIODS,
        "tiers": TIER_LIMITS,
    }


@router.get("/quota", response_model=BacktestQuotaResponse)
async def quota(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    limits = _limits_for(user.subscription_tier)
    used = await _month_usage(db, user.id)
    remaining = None if limits["monthly_limit"] is None else max(0, limits["monthly_limit"] - used)
    return BacktestQuotaResponse(
        tier=user.subscription_tier,
        max_period_days=limits["max_period_days"],
        monthly_limit=limits["monthly_limit"],
        used_this_month=used,
        remaining=remaining,
    )


@router.post("", response_model=BacktestResponse, status_code=status.HTTP_201_CREATED)
async def create_backtest(
    data: BacktestCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if data.product_id not in SUPPORTED_PRODUCTS:
        raise HTTPException(status_code=400, detail=f"Unsupported product. Pick from: {', '.join(SUPPORTED_PRODUCTS)}")

    limits = _limits_for(user.subscription_tier)

    if data.period_days > limits["max_period_days"]:
        raise HTTPException(
            status_code=403,
            detail=f"Your plan allows up to {limits['max_period_days']} days. Upgrade for longer history.",
        )

    if limits["monthly_limit"] is not None:
        used = await _month_usage(db, user.id)
        if used >= limits["monthly_limit"]:
            raise HTTPException(
                status_code=403,
                detail=f"Free plan is limited to {limits['monthly_limit']} backtests per month. Upgrade for unlimited runs.",
            )

    config = data.config
    if data.personality:
        merged = apply_personality_to_config(
            data.personality,
            data.strategy_type,
            portfolio_value=data.starting_capital,
            product_price=float(config.get("reference_price", 0)) or 1.0,
        )
        if merged:
            merged.update({k: v for k, v in config.items() if k not in merged})
            config = merged

    now = datetime.now(timezone.utc)
    start_date = now - timedelta(days=data.period_days)

    run = BacktestRun(
        user_id=user.id,
        name=data.name,
        product_id=data.product_id,
        strategy_type=data.strategy_type,
        personality=data.personality,
        config=config,
        period_days=data.period_days,
        start_date=start_date,
        end_date=now,
        starting_capital=Decimal(str(data.starting_capital)),
        status="pending",
    )
    db.add(run)
    await db.commit()
    await db.refresh(run)

    task = run_backtest_task.delay(str(run.id))
    run.celery_task_id = task.id
    await db.commit()
    await db.refresh(run)

    return run


@router.get("", response_model=list[BacktestResponse])
async def list_backtests(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    limit: int = 50,
):
    result = await db.execute(
        select(BacktestRun)
        .where(BacktestRun.user_id == user.id)
        .order_by(BacktestRun.created_at.desc())
        .limit(limit)
    )
    return result.scalars().all()


@router.get("/{backtest_id}", response_model=BacktestDetailResponse)
async def get_backtest(
    backtest_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(BacktestRun).where(BacktestRun.id == backtest_id, BacktestRun.user_id == user.id)
    )
    run = result.scalar_one_or_none()
    if not run:
        raise HTTPException(status_code=404, detail="Backtest not found")
    return run


@router.delete("/{backtest_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_backtest(
    backtest_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(BacktestRun).where(BacktestRun.id == backtest_id, BacktestRun.user_id == user.id)
    )
    run = result.scalar_one_or_none()
    if not run:
        raise HTTPException(status_code=404, detail="Backtest not found")
    await db.delete(run)
    await db.commit()
    return None
