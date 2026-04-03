"""Stripe integration — checkout sessions, customer management, portal."""

import stripe
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.user import User

stripe.api_key = settings.STRIPE_SECRET_KEY

PRICE_TO_TIER = {}


def _init_price_map():
    """Build price ID → tier mapping from settings."""
    if settings.STRIPE_PRICE_TRADER:
        PRICE_TO_TIER[settings.STRIPE_PRICE_TRADER] = "trader"
    if settings.STRIPE_PRICE_PRO:
        PRICE_TO_TIER[settings.STRIPE_PRICE_PRO] = "pro"


def get_tier_for_price(price_id: str) -> str:
    if not PRICE_TO_TIER:
        _init_price_map()
    return PRICE_TO_TIER.get(price_id, "free")


def get_price_for_plan(plan: str) -> str | None:
    plan_map = {
        "trader": settings.STRIPE_PRICE_TRADER,
        "pro": settings.STRIPE_PRICE_PRO,
    }
    return plan_map.get(plan)


async def get_or_create_customer(user: User, db: AsyncSession) -> str:
    """Get existing Stripe customer or create one."""
    if user.stripe_customer_id:
        return user.stripe_customer_id

    customer = stripe.Customer.create(
        email=user.email,
        metadata={"user_id": str(user.id), "username": user.username},
    )
    user.stripe_customer_id = customer.id
    await db.commit()
    return customer.id


async def create_checkout_session(customer_id: str, price_id: str, user_id: str) -> str:
    """Create a Stripe Checkout session and return the URL."""
    session = stripe.checkout.Session.create(
        customer=customer_id,
        mode="subscription",
        line_items=[{"price": price_id, "quantity": 1}],
        success_url=f"{settings.FRONTEND_URL}/payment/success?session_id={{CHECKOUT_SESSION_ID}}",
        cancel_url=f"{settings.FRONTEND_URL}/pricing",
        metadata={"user_id": user_id},
    )
    return session.url


def create_portal_session(customer_id: str) -> str:
    """Create a Stripe Customer Portal session and return the URL."""
    session = stripe.billing_portal.Session.create(
        customer=customer_id,
        return_url=f"{settings.FRONTEND_URL}/settings",
    )
    return session.url
