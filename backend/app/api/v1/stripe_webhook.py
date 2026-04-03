"""Stripe webhook handler — receives events from Stripe to update subscription state."""

import stripe
from fastapi import APIRouter, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import async_session
from app.models.user import User
from app.services.stripe_service import get_tier_for_price

router = APIRouter(prefix="/webhooks", tags=["webhooks"])

stripe.api_key = settings.STRIPE_SECRET_KEY


async def _get_user_by_customer(customer_id: str, db: AsyncSession) -> User | None:
    result = await db.execute(
        select(User).where(User.stripe_customer_id == customer_id)
    )
    return result.scalar_one_or_none()


@router.post("/stripe")
async def stripe_webhook(request: Request):
    """Handle Stripe webhook events. No auth — Stripe calls this directly."""
    payload = await request.body()
    sig = request.headers.get("stripe-signature", "")

    if settings.STRIPE_WEBHOOK_SECRET:
        try:
            event = stripe.Webhook.construct_event(payload, sig, settings.STRIPE_WEBHOOK_SECRET)
        except stripe.SignatureVerificationError:
            raise HTTPException(status_code=400, detail="Invalid signature")
    else:
        # Dev mode: no signature verification
        import json
        event = json.loads(payload)

    event_type = event.get("type", "")
    data = event.get("data", {}).get("object", {})

    async with async_session() as db:
        if event_type == "checkout.session.completed":
            customer_id = data.get("customer")
            subscription_id = data.get("subscription")

            user = await _get_user_by_customer(customer_id, db)
            if user and subscription_id:
                # Fetch subscription to determine tier from price
                sub = stripe.Subscription.retrieve(subscription_id)
                price_id = sub["items"]["data"][0]["price"]["id"]

                user.stripe_subscription_id = subscription_id
                user.subscription_tier = get_tier_for_price(price_id)
                user.subscription_status = "active"
                user.is_paper_mode = False
                await db.commit()

        elif event_type == "customer.subscription.updated":
            customer_id = data.get("customer")
            user = await _get_user_by_customer(customer_id, db)
            if user:
                price_id = data["items"]["data"][0]["price"]["id"]
                user.subscription_tier = get_tier_for_price(price_id)
                user.subscription_status = data.get("status", "active")
                if data.get("status") not in ("active", "trialing"):
                    user.is_paper_mode = True
                await db.commit()

        elif event_type == "customer.subscription.deleted":
            customer_id = data.get("customer")
            user = await _get_user_by_customer(customer_id, db)
            if user:
                user.subscription_tier = "free"
                user.subscription_status = "canceled"
                user.stripe_subscription_id = None
                user.is_paper_mode = True
                await db.commit()

        elif event_type == "invoice.payment_failed":
            customer_id = data.get("customer")
            user = await _get_user_by_customer(customer_id, db)
            if user:
                user.subscription_status = "past_due"
                await db.commit()

    return {"status": "ok"}
