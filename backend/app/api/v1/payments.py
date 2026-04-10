"""Payment API — Stripe checkout, portal, and crypto payment submissions."""

from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.database import get_db
from app.models.user import User
from app.services.stripe_service import (
    create_checkout_session,
    create_portal_session,
    get_or_create_customer,
    get_price_for_plan,
)

router = APIRouter(prefix="/payments", tags=["payments"])


# ── Stripe Checkout ──


class CheckoutRequest(BaseModel):
    plan: str  # "trader" or "pro"


@router.post("/stripe/checkout")
async def stripe_checkout(
    data: CheckoutRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a Stripe Checkout session and return the URL."""
    price_id = get_price_for_plan(data.plan)
    if not price_id:
        raise HTTPException(status_code=400, detail="Invalid plan. Choose 'trader' or 'pro'.")

    customer_id = await get_or_create_customer(user, db)
    checkout_url = await create_checkout_session(customer_id, price_id, str(user.id))
    return {"checkout_url": checkout_url}


@router.post("/stripe/portal")
async def stripe_portal(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a Stripe Customer Portal session for subscription management."""
    if not user.stripe_customer_id:
        raise HTTPException(status_code=400, detail="No active subscription found.")

    portal_url = create_portal_session(user.stripe_customer_id)
    return {"portal_url": portal_url}


# ── Subscription Status ──


@router.get("/status")
async def get_payment_status(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get user's current subscription status, accounting for expiration."""
    now = datetime.now(timezone.utc)
    is_active = user.subscription_status == "active"
    
    # Check for expiration
    if is_active and user.subscription_expires_at and user.subscription_expires_at < now:
        is_active = False
        # Optionally update user in DB here if needed, or just return false
        # For now, we return the real-time status
    
    return {
        "plan": user.subscription_tier if is_active else "free",
        "status": user.subscription_status if is_active else "inactive",
        "is_active": is_active,
        "expires_at": user.subscription_expires_at.isoformat() if user.subscription_expires_at else None,
    }


# ── Crypto Payments (kept for alternative payment) ──


class CryptoPaymentSubmit(BaseModel):
    plan: str
    currency: str
    tx_hash: str
    amount_usd: float


@router.post("/crypto/submit")
async def submit_crypto_payment(
    data: CryptoPaymentSubmit,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Submit a crypto payment transaction hash for manual verification."""
    if data.plan not in ("trader", "pro"):
        raise HTTPException(status_code=400, detail="Invalid plan")
    if not data.tx_hash.strip():
        raise HTTPException(status_code=400, detail="Transaction hash required")
    if data.currency not in ("SOL", "ETH", "BTC"):
        raise HTTPException(status_code=400, detail="Unsupported currency")

    return {
        "status": "pending",
        "message": f"Payment submitted. Your {data.plan.capitalize()} plan will be activated within 15 minutes after verification.",
        "tx_hash": data.tx_hash,
        "plan": data.plan,
        "currency": data.currency,
    }
