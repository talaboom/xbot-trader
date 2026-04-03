import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_subscription
from app.database import get_db
from app.models.strategy import Strategy
from app.models.user import User

router = APIRouter(prefix="/copy", tags=["copy-trading"])


@router.post("/{strategy_id}")
async def copy_strategy(
    strategy_id: str,
    user: User = Depends(get_current_user),
    plan_info: dict = Depends(require_subscription),
    db: AsyncSession = Depends(get_db),
):
    """Copy another user's strategy configuration."""
    # Find the source strategy
    result = await db.execute(
        select(Strategy).where(Strategy.id == uuid.UUID(strategy_id))
    )
    source = result.scalar_one_or_none()
    if not source:
        raise HTTPException(status_code=404, detail="Strategy not found")

    if source.user_id == user.id:
        raise HTTPException(status_code=400, detail="Cannot copy your own strategy")

    # Create a copy
    new_strategy = Strategy(
        user_id=user.id,
        name=f"Copy of {source.name}",
        strategy_type=source.strategy_type,
        product_id=source.product_id,
        config=source.config.copy() if source.config else {},
        is_paper_mode=True,  # Always start in paper mode for safety
        status="stopped",
    )
    db.add(new_strategy)
    await db.commit()
    await db.refresh(new_strategy)

    return {
        "message": "Strategy copied successfully",
        "strategy_id": str(new_strategy.id),
        "name": new_strategy.name,
    }
