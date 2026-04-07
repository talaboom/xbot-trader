"""Referral system API — get referral link, stats, and referred users."""

from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.database import get_db
from app.models.user import User

router = APIRouter(prefix="/referrals", tags=["referrals"])


@router.get("")
async def get_referral_info(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Get user's referral code, link, and stats."""
    # Count referred users
    result = await db.execute(
        select(func.count()).where(User.referred_by == user.id)
    )
    total_referred = result.scalar() or 0

    return {
        "referral_code": user.referral_code,
        "referral_link": f"https://xbottrader.ca/register?ref={user.referral_code}",
        "total_referred": total_referred,
        "rewards": {
            "per_referral": "1 week free",
            "description": "Get 1 week of free Trader plan for every friend who signs up with your link.",
        },
    }


@router.get("/referred-users")
async def get_referred_users(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Get list of users referred by current user."""
    result = await db.execute(
        select(User.username, User.created_at)
        .where(User.referred_by == user.id)
        .order_by(User.created_at.desc())
        .limit(50)
    )
    users = [
        {"username": row.username, "joined": row.created_at.isoformat()}
        for row in result.all()
    ]
    return {"referred_users": users}
