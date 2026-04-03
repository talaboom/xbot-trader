from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.database import get_db
from app.models.subscription import Subscription
from app.models.user import User

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])

PLAN_LIMITS = {
    "free_trial": {"duration_days": 7, "max_bots": 1, "live_trading": False, "price_usd": 0},
    "trader": {"duration_days": 30, "max_bots": 3, "live_trading": True, "price_usd": 20},
    "pro": {"duration_days": 30, "max_bots": 999, "live_trading": True, "price_usd": 50},
}


class SubscriptionCreate(BaseModel):
    plan: str  # trader or pro
    payment_method: str  # crypto or stripe
    tx_hash: str | None = None
    crypto_currency: str | None = None  # SOL, ETH, BTC


class SubscriptionStatus(BaseModel):
    plan: str
    status: str
    started_at: datetime
    expires_at: datetime
    max_bots: int
    live_trading: bool
    days_remaining: int


@router.get("/status")
async def get_subscription_status(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Find active subscription
    result = await db.execute(
        select(Subscription)
        .where(Subscription.user_id == user.id, Subscription.status == "active")
        .order_by(Subscription.expires_at.desc())
        .limit(1)
    )
    sub = result.scalar_one_or_none()

    if sub:
        # Check if expired
        if sub.expires_at < datetime.now(timezone.utc):
            sub.status = "expired"
            await db.commit()
            sub = None

    if sub:
        limits = PLAN_LIMITS.get(sub.plan, PLAN_LIMITS["free_trial"])
        days_remaining = max(0, (sub.expires_at - datetime.now(timezone.utc)).days)
        return SubscriptionStatus(
            plan=sub.plan,
            status=sub.status,
            started_at=sub.started_at,
            expires_at=sub.expires_at,
            max_bots=limits["max_bots"],
            live_trading=limits["live_trading"],
            days_remaining=days_remaining,
        )

    # Default: free trial from account creation
    trial_expires = user.created_at + timedelta(days=7)
    days_remaining = max(0, (trial_expires - datetime.now(timezone.utc)).days)
    is_active = trial_expires > datetime.now(timezone.utc)

    return SubscriptionStatus(
        plan="free_trial",
        status="active" if is_active else "expired",
        started_at=user.created_at,
        expires_at=trial_expires,
        max_bots=1,
        live_trading=False,
        days_remaining=days_remaining,
    )


@router.post("")
async def create_subscription(
    data: SubscriptionCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if data.plan not in ("trader", "pro"):
        raise HTTPException(status_code=400, detail="Invalid plan")

    if data.payment_method == "crypto" and not data.tx_hash:
        raise HTTPException(status_code=400, detail="Transaction hash required for crypto payment")

    limits = PLAN_LIMITS[data.plan]
    now = datetime.now(timezone.utc)

    sub = Subscription(
        user_id=user.id,
        plan=data.plan,
        status="pending",  # pending until verified
        payment_method=data.payment_method,
        tx_hash=data.tx_hash,
        crypto_currency=data.crypto_currency,
        amount_usd=str(limits["price_usd"]),
        started_at=now,
        expires_at=now + timedelta(days=limits["duration_days"]),
    )
    db.add(sub)
    await db.commit()
    await db.refresh(sub)

    return {
        "id": str(sub.id),
        "plan": sub.plan,
        "status": sub.status,
        "expires_at": sub.expires_at.isoformat(),
        "message": "Subscription created. Payment will be verified within 24 hours.",
    }


@router.post("/{sub_id}/verify")
async def verify_subscription(
    sub_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Admin/manual verification of payment."""
    result = await db.execute(
        select(Subscription).where(Subscription.id == sub_id)
    )
    sub = result.scalar_one_or_none()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")

    sub.status = "active"
    await db.commit()
    return {"message": "Subscription activated", "status": "active"}


@router.get("/plans")
async def get_plans():
    """Return available subscription plans."""
    return {
        "plans": [
            {
                "id": "free_trial",
                "name": "Free Trial",
                "price": 0,
                "duration": "7 days",
                "features": ["1 paper trading bot", "AI assistant", "Market data", "Trade history"],
            },
            {
                "id": "trader",
                "name": "Trader",
                "price": 20,
                "duration": "30 days",
                "features": ["Up to 3 bots", "Live trading", "AI assistant", "Copy trading", "All market data", "Money-back guarantee"],
            },
            {
                "id": "pro",
                "name": "Pro",
                "price": 50,
                "duration": "30 days",
                "features": ["Unlimited bots", "Live trading", "Priority execution", "AI assistant", "Copy trading", "Advanced analytics", "Money-back guarantee"],
            },
        ]
    }
