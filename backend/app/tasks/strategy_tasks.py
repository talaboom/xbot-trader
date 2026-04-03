"""
Celery tasks that execute trading strategies (DCA + Grid).
"""
import asyncio
import logging
import uuid
from datetime import datetime, timezone, timedelta
from decimal import Decimal

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import async_session
from app.models.strategy import Strategy
from app.models.trade import Trade
from app.models.user import User
from app.models.exchange_key import ExchangeKey
from app.models.notification import Notification
from app.services.coinbase_service import get_public_price, CoinbaseService
from app.services.paper_trading_service import (
    execute_paper_buy,
    execute_paper_sell,
    get_paper_holdings,
)
from app.tasks.celery_app import celery_app

logger = logging.getLogger(__name__)


async def _create_notification(db: AsyncSession, user_id, type: str, title: str, message: str):
    notif = Notification(user_id=user_id, type=type, title=title, message=message)
    db.add(notif)


def run_async(coro):
    """Run async code from sync Celery tasks."""
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


@celery_app.task(name="execute_dca_strategy", bind=True, max_retries=3)
def execute_dca_strategy(self, strategy_id: str):
    """Execute a single DCA buy for a strategy."""
    try:
        run_async(_execute_dca(strategy_id))
    except Exception as exc:
        logger.error(f"DCA execution failed for strategy {strategy_id}: {exc}")
        raise self.retry(exc=exc, countdown=60)


async def _execute_dca(strategy_id: str):
    async with async_session() as db:
        result = await db.execute(
            select(Strategy).where(Strategy.id == uuid.UUID(strategy_id))
        )
        strategy = result.scalar_one_or_none()
        if not strategy or strategy.status != "running":
            return

        config = strategy.config or {}
        investment_amount = Decimal(str(config.get("investment_amount", 10)))
        max_total = Decimal(str(config.get("max_total_investment", 10000)))
        stop_loss_pct = Decimal(str(config.get("stop_loss_pct", 25)))
        take_profit_pct = Decimal(str(config.get("take_profit_pct", 40)))

        # Check if we've hit the max investment
        if strategy.total_invested >= max_total:
            logger.info(f"Strategy {strategy_id} hit max investment, checking for sell signals")
            await _check_sell_signals(db, strategy, stop_loss_pct, take_profit_pct)
            return

        # Check last trade time to respect interval
        interval_hours = config.get("interval_hours", 24)
        last_trade = await _get_last_trade(db, strategy)
        if last_trade and last_trade.executed_at:
            next_trade_time = last_trade.executed_at + timedelta(hours=interval_hours)
            if datetime.now(timezone.utc) < next_trade_time:
                return  # Not time yet

        if strategy.is_paper_mode:
            trade = await execute_paper_buy(
                db=db,
                user_id=strategy.user_id,
                strategy_id=strategy.id,
                product_id=strategy.product_id,
                usd_amount=investment_amount,
                trigger_reason="dca_scheduled",
            )
            if trade:
                strategy.total_invested += investment_amount
                await _update_strategy_value(db, strategy)
                await _create_notification(
                    db, strategy.user_id, "trade_executed",
                    f"DCA Buy — {strategy.product_id}",
                    f"Bought ${investment_amount} of {strategy.product_id} at ${trade.price:.2f}",
                )
                await db.commit()
                logger.info(f"Paper DCA buy: {investment_amount} USD of {strategy.product_id}")
        else:
            # Live trading via Coinbase
            await _execute_live_buy(db, strategy, investment_amount)

        # Check sell signals after buying
        await _check_sell_signals(db, strategy, stop_loss_pct, take_profit_pct)


async def _check_sell_signals(
    db: AsyncSession,
    strategy: Strategy,
    stop_loss_pct: Decimal,
    take_profit_pct: Decimal,
):
    """Check if we should sell based on stop-loss or take-profit."""
    if strategy.total_invested <= 0:
        return

    current_price = await get_public_price(strategy.product_id)
    if not current_price:
        return

    # Calculate average buy price from trades
    result = await db.execute(
        select(func.sum(Trade.total_value), func.sum(Trade.quantity)).where(
            Trade.strategy_id == strategy.id,
            Trade.side == "BUY",
            Trade.status == "filled",
        )
    )
    row = result.one()
    total_cost = row[0] or Decimal("0")
    total_qty = row[1] or Decimal("0")

    if total_qty <= 0:
        return

    avg_price = total_cost / total_qty
    current_dec = Decimal(str(current_price))
    pnl_pct = ((current_dec - avg_price) / avg_price) * 100

    # Take profit
    if pnl_pct >= take_profit_pct:
        holdings = await get_paper_holdings(db, strategy.user_id)
        symbol = strategy.product_id.replace("-USD", "")
        qty = holdings.get(symbol, Decimal("0"))
        if qty > 0 and strategy.is_paper_mode:
            sell_qty = qty * Decimal("0.5")  # Sell 50% on take-profit
            await execute_paper_sell(
                db, strategy.user_id, strategy.id,
                strategy.product_id, sell_qty, "take_profit",
            )
            logger.info(f"Take profit triggered at {pnl_pct:.1f}% for {strategy.product_id}")

    # Stop loss
    elif pnl_pct <= -stop_loss_pct:
        holdings = await get_paper_holdings(db, strategy.user_id)
        symbol = strategy.product_id.replace("-USD", "")
        qty = holdings.get(symbol, Decimal("0"))
        if qty > 0 and strategy.is_paper_mode:
            await execute_paper_sell(
                db, strategy.user_id, strategy.id,
                strategy.product_id, qty, "stop_loss",
            )
            strategy.status = "stopped"
            logger.info(f"Stop loss triggered at {pnl_pct:.1f}% for {strategy.product_id}")

    await _update_strategy_value(db, strategy)
    await db.commit()


@celery_app.task(name="execute_grid_strategy", bind=True, max_retries=3)
def execute_grid_strategy(self, strategy_id: str):
    """Execute grid trading logic for a strategy."""
    try:
        run_async(_execute_grid(strategy_id))
    except Exception as exc:
        logger.error(f"Grid execution failed for strategy {strategy_id}: {exc}")
        raise self.retry(exc=exc, countdown=60)


async def _execute_grid(strategy_id: str):
    async with async_session() as db:
        result = await db.execute(
            select(Strategy).where(Strategy.id == uuid.UUID(strategy_id))
        )
        strategy = result.scalar_one_or_none()
        if not strategy or strategy.status != "running":
            return

        config = strategy.config or {}
        lower_price = Decimal(str(config.get("lower_price", 0)))
        upper_price = Decimal(str(config.get("upper_price", 0)))
        num_grids = int(config.get("num_grids", 5))
        total_investment = Decimal(str(config.get("total_investment", 1000)))
        stop_loss_pct = Decimal(str(config.get("stop_loss_pct", 20)))

        if lower_price <= 0 or upper_price <= lower_price:
            return

        current_price = await get_public_price(strategy.product_id)
        if not current_price:
            return

        current_dec = Decimal(str(current_price))

        # Check stop loss
        if current_dec < lower_price * (1 - stop_loss_pct / 100):
            # Sell all and stop
            if strategy.is_paper_mode:
                holdings = await get_paper_holdings(db, strategy.user_id)
                symbol = strategy.product_id.replace("-USD", "")
                qty = holdings.get(symbol, Decimal("0"))
                if qty > 0:
                    await execute_paper_sell(
                        db, strategy.user_id, strategy.id,
                        strategy.product_id, qty, "grid_stop_loss",
                    )
            strategy.status = "stopped"
            await _update_strategy_value(db, strategy)
            await db.commit()
            return

        # Calculate grid levels
        grid_step = (upper_price - lower_price) / num_grids
        investment_per_grid = total_investment / num_grids

        # Get grid state from config
        grid_state = config.get("grid_state", {})
        last_price = Decimal(str(grid_state.get("last_price", str(current_dec))))

        # Determine which grid level we're at
        current_level = int((current_dec - lower_price) / grid_step) if grid_step > 0 else 0
        last_level = int((last_price - lower_price) / grid_step) if grid_step > 0 else 0

        if current_level != last_level:
            if current_dec < last_price and current_dec >= lower_price:
                # Price dropped — buy
                if strategy.is_paper_mode:
                    trade = await execute_paper_buy(
                        db, strategy.user_id, strategy.id,
                        strategy.product_id, investment_per_grid,
                        "grid_buy",
                    )
                    if trade:
                        strategy.total_invested += investment_per_grid
                        logger.info(f"Grid buy at level {current_level}, price {current_dec}")

            elif current_dec > last_price and current_dec <= upper_price:
                # Price rose — sell
                if strategy.is_paper_mode:
                    holdings = await get_paper_holdings(db, strategy.user_id)
                    symbol = strategy.product_id.replace("-USD", "")
                    qty = holdings.get(symbol, Decimal("0"))
                    sell_qty = min(qty, investment_per_grid / current_dec)
                    if sell_qty > 0:
                        await execute_paper_sell(
                            db, strategy.user_id, strategy.id,
                            strategy.product_id, sell_qty,
                            "grid_sell",
                        )
                        logger.info(f"Grid sell at level {current_level}, price {current_dec}")

        # Update grid state
        config["grid_state"] = {"last_price": str(current_dec)}
        strategy.config = config
        await _update_strategy_value(db, strategy)
        await db.commit()


async def _execute_live_buy(db: AsyncSession, strategy: Strategy, amount: Decimal):
    """Execute a real buy via Coinbase API."""
    result = await db.execute(
        select(ExchangeKey).where(
            ExchangeKey.user_id == strategy.user_id,
            ExchangeKey.exchange == "coinbase",
            ExchangeKey.is_valid == True,
        )
    )
    exchange_key = result.scalar_one_or_none()
    if not exchange_key:
        logger.error(f"No valid exchange key for user {strategy.user_id}")
        return

    service = CoinbaseService.from_encrypted(exchange_key, str(strategy.user_id))
    order_result = await service.place_market_buy(
        strategy.product_id, str(amount)
    )

    if order_result and "error" not in order_result:
        price = await get_public_price(strategy.product_id)
        price_dec = Decimal(str(price)) if price else Decimal("0")
        quantity = amount / price_dec if price_dec > 0 else Decimal("0")

        trade = Trade(
            user_id=strategy.user_id,
            strategy_id=strategy.id,
            exchange="coinbase",
            product_id=strategy.product_id,
            side="BUY",
            order_type="MARKET",
            status="filled",
            coinbase_order_id=order_result.get("success_response", {}).get("order_id", ""),
            quantity=quantity,
            price=price_dec,
            total_value=amount,
            fee=amount * Decimal("0.006"),
            is_paper=False,
            trigger_reason="dca_scheduled",
            executed_at=datetime.now(timezone.utc),
        )
        db.add(trade)
        strategy.total_invested += amount
        await _update_strategy_value(db, strategy)
        await db.commit()
    else:
        error_msg = str(order_result.get("error", "Unknown error")) if order_result else "No response"
        trade = Trade(
            user_id=strategy.user_id,
            strategy_id=strategy.id,
            exchange="coinbase",
            product_id=strategy.product_id,
            side="BUY",
            order_type="MARKET",
            status="failed",
            is_paper=False,
            trigger_reason="dca_scheduled",
            error_message=error_msg,
            executed_at=datetime.now(timezone.utc),
        )
        db.add(trade)
        await db.commit()
        logger.error(f"Live order failed: {error_msg}")


async def _get_last_trade(db: AsyncSession, strategy: Strategy) -> Trade | None:
    result = await db.execute(
        select(Trade)
        .where(Trade.strategy_id == strategy.id, Trade.status == "filled")
        .order_by(Trade.executed_at.desc())
        .limit(1)
    )
    return result.scalar_one_or_none()


async def _update_strategy_value(db: AsyncSession, strategy: Strategy):
    """Recalculate strategy total_value and pnl from current holdings."""
    result = await db.execute(
        select(func.sum(Trade.quantity)).where(
            Trade.strategy_id == strategy.id,
            Trade.side == "BUY",
            Trade.status == "filled",
        )
    )
    bought_qty = result.scalar() or Decimal("0")

    result = await db.execute(
        select(func.sum(Trade.quantity)).where(
            Trade.strategy_id == strategy.id,
            Trade.side == "SELL",
            Trade.status == "filled",
        )
    )
    sold_qty = result.scalar() or Decimal("0")

    held_qty = bought_qty - sold_qty
    if held_qty < 0:
        held_qty = Decimal("0")

    current_price = await get_public_price(strategy.product_id)
    price_dec = Decimal(str(current_price)) if current_price else Decimal("0")

    # Current value of holdings
    holdings_value = held_qty * price_dec

    # Add back any USD received from sells
    result = await db.execute(
        select(func.sum(Trade.total_value)).where(
            Trade.strategy_id == strategy.id,
            Trade.side == "SELL",
            Trade.status == "filled",
        )
    )
    sell_proceeds = result.scalar() or Decimal("0")

    strategy.total_value = holdings_value + sell_proceeds
    strategy.pnl = strategy.total_value - strategy.total_invested
