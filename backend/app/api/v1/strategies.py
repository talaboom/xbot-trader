from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.database import get_db
from app.models.strategy import Strategy
from app.models.user import User
from app.schemas.strategy import StrategyCreate, StrategyResponse

router = APIRouter(prefix="/strategies", tags=["strategies"])


@router.get("", response_model=list[StrategyResponse])
async def list_strategies(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Strategy).where(Strategy.user_id == user.id).order_by(Strategy.created_at.desc())
    )
    return result.scalars().all()


@router.post("", response_model=StrategyResponse)
async def create_strategy(
    data: StrategyCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Free tier: max 2 strategies, paper mode only
    if user.subscription_tier == "free":
        count_result = await db.execute(
            select(func.count()).select_from(Strategy).where(Strategy.user_id == user.id)
        )
        if count_result.scalar() >= 2:
            raise HTTPException(status_code=403, detail="Free plan allows up to 2 strategies. Upgrade to create more.")

        if not data.is_paper_mode:
            raise HTTPException(status_code=403, detail="Live trading requires a paid plan. Upgrade to unlock.")

    strategy = Strategy(
        user_id=user.id,
        name=data.name,
        strategy_type=data.strategy_type,
        product_id=data.product_id,
        config=data.config,
        is_paper_mode=data.is_paper_mode,
        status="stopped",
    )
    db.add(strategy)
    await db.commit()
    await db.refresh(strategy)
    return strategy


@router.get("/{strategy_id}", response_model=StrategyResponse)
async def get_strategy(
    strategy_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Strategy).where(Strategy.id == strategy_id, Strategy.user_id == user.id)
    )
    strategy = result.scalar_one_or_none()
    if not strategy:
        raise HTTPException(status_code=404, detail="Strategy not found")
    return strategy


@router.post("/{strategy_id}/start")
async def start_strategy(
    strategy_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Strategy).where(Strategy.id == strategy_id, Strategy.user_id == user.id)
    )
    strategy = result.scalar_one_or_none()
    if not strategy:
        raise HTTPException(status_code=404, detail="Strategy not found")

    strategy.status = "running"
    await db.commit()
    return {"message": "Strategy started", "status": "running"}


@router.post("/{strategy_id}/stop")
async def stop_strategy(
    strategy_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Strategy).where(Strategy.id == strategy_id, Strategy.user_id == user.id)
    )
    strategy = result.scalar_one_or_none()
    if not strategy:
        raise HTTPException(status_code=404, detail="Strategy not found")

    strategy.status = "stopped"
    await db.commit()
    return {"message": "Strategy stopped", "status": "stopped"}


@router.delete("/{strategy_id}")
async def delete_strategy(
    strategy_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Strategy).where(Strategy.id == strategy_id, Strategy.user_id == user.id)
    )
    strategy = result.scalar_one_or_none()
    if not strategy:
        raise HTTPException(status_code=404, detail="Strategy not found")

    # Stop the strategy if it's running before deleting
    if strategy.status == "running":
        strategy.status = "stopped"

    await db.delete(strategy)
    await db.commit()
    return {"message": "Strategy deleted"}
