from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.database import get_db
from app.models.trade import Trade
from app.models.user import User
from app.schemas.trade import TradeListResponse, TradeResponse

router = APIRouter(prefix="/trades", tags=["trades"])


@router.get("", response_model=TradeListResponse)
async def list_trades(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    strategy_id: str | None = None,
    product_id: str | None = None,
    side: str | None = None,
    is_paper: bool | None = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Trade).where(Trade.user_id == user.id)

    if strategy_id:
        query = query.where(Trade.strategy_id == strategy_id)
    if product_id:
        query = query.where(Trade.product_id == product_id)
    if side:
        query = query.where(Trade.side == side)
    if is_paper is not None:
        query = query.where(Trade.is_paper == is_paper)

    # Count
    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar() or 0

    # Paginate
    query = query.order_by(Trade.created_at.desc()).offset((page - 1) * limit).limit(limit)
    result = await db.execute(query)
    trades = result.scalars().all()

    return TradeListResponse(trades=trades, total=total, page=page, limit=limit)
