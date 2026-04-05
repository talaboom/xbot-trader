"""
Paper Trading Engine — Simulates trades using real market prices with virtual balances.
Stored in PostgreSQL so it persists across restarts.
"""
import uuid
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.trade import Trade
from app.services.coinbase_service import get_public_price


INITIAL_BALANCE = Decimal("100000.00")
TAKER_FEE_PCT = Decimal("0.006")  # 0.6% simulated Coinbase fee


class PaperTradeService:
    def __init__(self, user_id: str, db: AsyncSession):
        self.user_id = user_id
        self.db = db

    async def get_balances(self) -> dict[str, Decimal]:
        """Get virtual balances from trade history."""
        result = await self.db.execute(
            select(Trade).where(
                Trade.user_id == uuid.UUID(self.user_id),
                Trade.is_paper == True,
                Trade.status == "filled",
            )
        )
        trades = result.scalars().all()

        balances: dict[str, Decimal] = {"USD": INITIAL_BALANCE}

        for t in trades:
            base_currency = t.product_id.split("-")[0]  # e.g. "BTC" from "BTC-USD"

            if t.side == "buy":
                balances["USD"] = balances.get("USD", Decimal("0")) - (t.total_value or Decimal("0")) - (t.fee or Decimal("0"))
                balances[base_currency] = balances.get(base_currency, Decimal("0")) + (t.quantity or Decimal("0"))
            elif t.side == "sell":
                balances["USD"] = balances.get("USD", Decimal("0")) + (t.total_value or Decimal("0")) - (t.fee or Decimal("0"))
                balances[base_currency] = balances.get(base_currency, Decimal("0")) - (t.quantity or Decimal("0"))

        return {k: v for k, v in balances.items() if v > Decimal("0.00000001")}

    async def market_buy(self, product_id: str, quote_size: float, strategy_id: str | None = None, trigger_reason: str = "scheduled") -> Trade | None:
        """Simulate a market buy order."""
        price = await get_public_price(product_id)
        if not price or price <= 0:
            return None

        quote = Decimal(str(quote_size))
        price_dec = Decimal(str(price))
        fee = quote * TAKER_FEE_PCT
        net_quote = quote - fee
        quantity = net_quote / price_dec

        # Check balance
        balances = await self.get_balances()
        if balances.get("USD", Decimal("0")) < quote:
            return None

        trade = Trade(
            user_id=uuid.UUID(self.user_id),
            strategy_id=uuid.UUID(strategy_id) if strategy_id else None,
            product_id=product_id,
            side="buy",
            order_type="market",
            status="filled",
            coinbase_order_id=f"paper-{uuid.uuid4()}",
            quantity=quantity,
            price=price_dec,
            total_value=net_quote,
            fee=fee,
            is_paper=True,
            trigger_reason=trigger_reason,
            executed_at=datetime.now(timezone.utc),
        )
        self.db.add(trade)
        await self.db.flush()
        return trade

    async def market_sell(self, product_id: str, base_size: float, strategy_id: str | None = None, trigger_reason: str = "scheduled") -> Trade | None:
        """Simulate a market sell order."""
        price = await get_public_price(product_id)
        if not price or price <= 0:
            return None

        base_currency = product_id.split("-")[0]
        quantity = Decimal(str(base_size))
        price_dec = Decimal(str(price))
        gross_value = quantity * price_dec
        fee = gross_value * TAKER_FEE_PCT
        net_value = gross_value - fee

        # Check balance
        balances = await self.get_balances()
        if balances.get(base_currency, Decimal("0")) < quantity:
            return None

        trade = Trade(
            user_id=uuid.UUID(self.user_id),
            strategy_id=uuid.UUID(strategy_id) if strategy_id else None,
            product_id=product_id,
            side="sell",
            order_type="market",
            status="filled",
            coinbase_order_id=f"paper-{uuid.uuid4()}",
            quantity=quantity,
            price=price_dec,
            total_value=net_value,
            fee=fee,
            is_paper=True,
            trigger_reason=trigger_reason,
            executed_at=datetime.now(timezone.utc),
        )
        self.db.add(trade)
        await self.db.flush()
        return trade

    async def get_portfolio_value(self) -> dict:
        """Calculate total portfolio value in USD."""
        balances = await self.get_balances()
        total_usd = balances.get("USD", Decimal("0"))
        assets = []

        for currency, amount in balances.items():
            if currency == "USD":
                assets.append({"currency": "USD", "balance": str(amount), "usd_value": str(amount), "price": "1.00"})
                continue

            price = await get_public_price(f"{currency}-USD")
            if price:
                usd_value = amount * Decimal(str(price))
                total_usd += usd_value
                assets.append({
                    "currency": currency,
                    "balance": str(amount),
                    "usd_value": str(usd_value),
                    "price": str(price),
                })

        return {
            "total_value": str(total_usd),
            "pnl": str(total_usd - INITIAL_BALANCE),
            "pnl_pct": str(((total_usd - INITIAL_BALANCE) / INITIAL_BALANCE * 100)),
            "assets": assets,
        }
