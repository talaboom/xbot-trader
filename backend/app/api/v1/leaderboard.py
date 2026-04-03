from decimal import Decimal

from fastapi import APIRouter, Depends
from sqlalchemy import func, select, case, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.trade import Trade
from app.models.strategy import Strategy
from app.models.user import User

router = APIRouter(prefix="/leaderboard", tags=["leaderboard"])


@router.get("")
async def get_leaderboard(
    timeframe: str = "30d",
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
):
    """Rank users by total P&L from their strategies."""
    # Get all users with strategies that have non-zero P&L
    result = await db.execute(
        select(
            User.id,
            User.username,
            func.coalesce(func.sum(Strategy.pnl), 0).label("total_pnl"),
            func.count(Strategy.id).label("total_strategies"),
        )
        .join(Strategy, Strategy.user_id == User.id)
        .group_by(User.id, User.username)
        .order_by(func.coalesce(func.sum(Strategy.pnl), 0).desc())
        .limit(limit)
    )
    rows = result.all()

    traders = []
    for rank, row in enumerate(rows, 1):
        # Get trade stats for this user
        trade_result = await db.execute(
            select(
                func.count(Trade.id).label("total_trades"),
                func.count(case((Trade.side == "SELL", Trade.id))).label("sell_count"),
            ).where(Trade.user_id == row.id, Trade.status == "filled")
        )
        trade_stats = trade_result.one()

        # Calculate win rate (profitable sells / total sells)
        profitable_result = await db.execute(
            select(func.count()).where(
                Trade.user_id == row.id,
                Trade.side == "SELL",
                Trade.status == "filled",
                Trade.trigger_reason == "take_profit",
            )
        )
        profitable_sells = profitable_result.scalar() or 0
        total_sells = trade_stats.sell_count or 0
        win_rate = round((profitable_sells / total_sells * 100) if total_sells > 0 else 0, 1)

        traders.append({
            "rank": rank,
            "username": row.username,
            "total_pnl": float(row.total_pnl),
            "total_strategies": row.total_strategies,
            "total_trades": trade_stats.total_trades,
            "win_rate": win_rate,
            "pnl_formatted": f"${float(row.total_pnl):,.2f}",
        })

    return {"traders": traders, "total": len(traders)}
