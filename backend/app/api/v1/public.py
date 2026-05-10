"""Public (no-auth) endpoints for the marketing site.

These read aggregate, non-PII data and are served with cache headers so the
landing page can hammer them without DB load. NEVER add anything user-scoped here.
"""
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Response
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.strategy import Strategy
from app.models.trade import Trade

router = APIRouter(prefix="/public", tags=["public"])


@router.get("/stats")
async def public_stats(response: Response, db: AsyncSession = Depends(get_db)):
    """Aggregate non-PII stats for the landing page. 5-minute cache."""
    response.headers["Cache-Control"] = "public, max-age=300"

    now = datetime.now(timezone.utc)
    cutoff_30d = now - timedelta(days=30)
    cutoff_24h = now - timedelta(hours=24)

    # Total LIVE PnL across all users in last 30d (sum strategy.pnl where strategy is live and recently updated)
    pnl_result = await db.execute(
        select(func.coalesce(func.sum(Strategy.pnl), 0)).where(
            Strategy.is_paper_mode.is_(False),
            Strategy.updated_at >= cutoff_30d,
        )
    )
    total_pnl_30d = float(pnl_result.scalar() or 0)

    # Active LIVE strategies right now
    active_result = await db.execute(
        select(func.count(Strategy.id)).where(
            Strategy.status == "running",
            Strategy.is_paper_mode.is_(False),
        )
    )
    active_strategies = int(active_result.scalar() or 0)

    # Trades in the last 24h (live only)
    trades_result = await db.execute(
        select(func.count(Trade.id)).where(
            Trade.is_paper.is_(False),
            Trade.created_at >= cutoff_24h,
        )
    )
    trades_24h = int(trades_result.scalar() or 0)

    return {
        "total_pnl_30d_cad": round(total_pnl_30d, 2),
        "active_strategies": active_strategies,
        "trades_24h": trades_24h,
        "as_of": now.isoformat(),
    }
