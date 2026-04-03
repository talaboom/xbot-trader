"""Payment verification API — handles crypto payment submissions."""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.database import get_db
from app.models.user import User

router = APIRouter(prefix="/payments", tags=["payments"])


class CryptoPaymentSubmit(BaseModel):
    plan: str  # "trader" or "pro"
    currency: str  # "SOL", "ETH", "BTC"
    tx_hash: str
    amount_usd: float


class PaymentStatusResponse(BaseModel):
    status: str
    plan: str | None = None
    message: str


@router.post("/crypto/submit")
async def submit_crypto_payment(
    data: CryptoPaymentSubmit,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Submit a crypto payment transaction hash for verification."""
    if data.plan not in ("trader", "pro"):
        raise HTTPException(status_code=400, detail="Invalid plan")
    if not data.tx_hash.strip():
        raise HTTPException(status_code=400, detail="Transaction hash required")
    if data.currency not in ("SOL", "ETH", "BTC"):
        raise HTTPException(status_code=400, detail="Unsupported currency")

    # In production: verify the transaction on-chain using blockchain APIs
    # For now, record the submission for manual review
    # TODO: Add Payment model to track payment history

    return {
        "status": "pending",
        "message": f"Payment submitted. Your {data.plan.capitalize()} plan will be activated within 15 minutes after verification.",
        "tx_hash": data.tx_hash,
        "plan": data.plan,
        "currency": data.currency,
    }


@router.get("/status")
async def get_payment_status(
    user: User = Depends(get_current_user),
):
    """Check the user's current subscription status."""
    # For MVP: all users are on free/paper mode
    # In production: check payment records and subscription expiry
    return {
        "plan": "free",
        "is_active": True,
        "message": "You're on the free plan. Upgrade to unlock live trading.",
    }
