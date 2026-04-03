"""
Paper Trading Service — simulates order execution with virtual balances.
"""
import uuid
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.trade import Trade
from app.models.user import User
from app.services.coinbase_service import get_public_price


PAPER_FEE_RATE = Decimal("0.006")  # 0.6% simulated fee (close to Coinbase taker fee)


async def get_paper_balance(db: AsyncSession, user_id: uuid.UUID) -> Decimal:
    """Calculate user's remaining paper USD balance from trade history."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        return Decimal("0")

    return user.paper_balance


async def get_paper_holdings(db: AsyncSession, user_id: uuid.UUID) -> dict[str, Decimal]:
    """Calculate user's crypto holdings from paper trade history."""
    result = await db.execute(
        select(Trade).where(Trade.user_id == user_id, Trade.is_paper == True, Trade.status == "filled")
    )
    trades = result.scalars().all()

    holdings: dict[str, Decimal] = {}
    for trade in trades:
        symbol = trade.product_id.replace("-USD", "")
        if symbol not in holdings:
            holdings[symbol] = Decimal("0")
        if trade.side == "BUY":
            holdings[symbol] += trade.quantity
        elif trade.side == "SELL":
            holdings[symbol] -= trade.quantity

    # Remove zero/negative holdings
    return {k: v for k, v in holdings.items() if v > 0}


async def execute_paper_buy(
    db: AsyncSession,
    user_id: uuid.UUID,
    strategy_id: uuid.UUID | None,
    product_id: str,
    usd_amount: Decimal,
    trigger_reason: str = "dca_scheduled",
) -> Trade | None:
    """Simulate a market buy order with paper money."""
    price = await get_public_price(product_id)
    if not price or price <= 0:
        return None

    price_dec = Decimal(str(price))
    fee = usd_amount * PAPER_FEE_RATE
    net_amount = usd_amount - fee
    quantity = net_amount / price_dec

    # Check balance
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user or user.paper_balance < usd_amount:
        return None

    # Deduct from balance
    user.paper_balance -= usd_amount

    trade = Trade(
        user_id=user_id,
        strategy_id=strategy_id,
        exchange="paper",
        product_id=product_id,
        side="BUY",
        order_type="MARKET",
        status="filled",
        coinbase_order_id=f"paper-{uuid.uuid4()}",
        quantity=quantity,
        price=price_dec,
        total_value=usd_amount,
        fee=fee,
        is_paper=True,
        trigger_reason=trigger_reason,
        executed_at=datetime.now(timezone.utc),
    )
    db.add(trade)
    await db.commit()
    return trade


async def execute_paper_sell(
    db: AsyncSession,
    user_id: uuid.UUID,
    strategy_id: uuid.UUID | None,
    product_id: str,
    quantity: Decimal,
    trigger_reason: str = "take_profit",
) -> Trade | None:
    """Simulate a market sell order with paper money."""
    price = await get_public_price(product_id)
    if not price or price <= 0:
        return None

    price_dec = Decimal(str(price))
    gross_value = quantity * price_dec
    fee = gross_value * PAPER_FEE_RATE
    net_value = gross_value - fee

    # Check holdings
    holdings = await get_paper_holdings(db, user_id)
    symbol = product_id.replace("-USD", "")
    if holdings.get(symbol, Decimal("0")) < quantity:
        return None

    # Add to balance
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        return None
    user.paper_balance += net_value

    trade = Trade(
        user_id=user_id,
        strategy_id=strategy_id,
        exchange="paper",
        product_id=product_id,
        side="SELL",
        order_type="MARKET",
        status="filled",
        coinbase_order_id=f"paper-{uuid.uuid4()}",
        quantity=quantity,
        price=price_dec,
        total_value=gross_value,
        fee=fee,
        is_paper=True,
        trigger_reason=trigger_reason,
        executed_at=datetime.now(timezone.utc),
    )
    db.add(trade)
    await db.commit()
    return trade
