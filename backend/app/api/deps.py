import uuid
from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.models.subscription import Subscription
from app.services.auth_service import decode_token

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User:
    token = credentials.credentials
    payload = decode_token(token)
    if payload is None or payload.get("type") != "access":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
    user = result.scalar_one_or_none()
    if user is None or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    return user


async def require_subscription(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Check if user has an active subscription. Returns plan info."""
    # Check for active paid subscription
    result = await db.execute(
        select(Subscription)
        .where(
            Subscription.user_id == user.id,
            Subscription.status == "active",
            Subscription.expires_at > datetime.now(timezone.utc),
        )
        .order_by(Subscription.expires_at.desc())
        .limit(1)
    )
    sub = result.scalar_one_or_none()

    if sub:
        return {"plan": sub.plan, "max_bots": 3 if sub.plan == "trader" else 999, "live_trading": True}

    # Check free trial (7 days from registration)
    trial_expires = user.created_at + timedelta(days=7)
    if datetime.now(timezone.utc) < trial_expires:
        return {"plan": "free_trial", "max_bots": 1, "live_trading": False}

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Subscription required. Your free trial has expired.",
    )
