"""
Paper Trading Engine — Celery tasks that execute simulated trades using real Coinbase prices.
Supports DCA (Dollar Cost Averaging) and Grid trading strategies.
"""

import logging
import uuid
from datetime import datetime, timezone
from decimal import Decimal

import httpx
from sqlalchemy import create_engine, select, update
from sqlalchemy.orm import Session, sessionmaker

from app.config import settings
from app.models.strategy import Strategy
from app.models.trade import Trade
from app.tasks.celery_app import celery_app

logger = logging.getLogger(__name__)

# Sync DB session for Celery tasks (Celery doesn't support async)
_sync_url = settings.DATABASE_URL_SYNC or settings.DATABASE_URL.replace(
    "postgresql+asyncpg://", "postgresql://"
)
_engine = create_engine(_sync_url, pool_pre_ping=True)
SyncSession = sessionmaker(_engine, expire_on_commit=False)

PAPER_STARTING_BALANCE = Decimal("100000")
PAPER_FEE_RATE = Decimal("0.006")  # 0.6% simulated fee


def _get_price_sync(product_id: str) -> float | None:
    """Fetch current price from Coinbase (synchronous for Celery)."""
    try:
        with httpx.Client(timeout=10.0) as client:
            resp = client.get(
                f"https://api.coinbase.com/api/v3/brokerage/market/products/{product_id}"
            )
            if resp.status_code == 200:
                return float(resp.json().get("price", 0))
            # Fallback to v2
            resp = client.get(
                f"https://api.coinbase.com/v2/prices/{product_id}/spot"
            )
            if resp.status_code == 200:
                return float(resp.json().get("data", {}).get("amount", 0))
    except Exception as e:
        logger.warning("Price fetch failed for %s: %s", product_id, e)
    return None


def _get_paper_balance(db: Session, user_id: uuid.UUID) -> Decimal:
    """Calculate remaining paper USD balance from trade history."""
    rows = db.execute(
        select(Trade.side, Trade.total_value, Trade.fee).where(
            Trade.user_id == user_id, Trade.is_paper == True  # noqa: E712
        )
    ).all()
    spent = Decimal("0")
    received = Decimal("0")
    fees = Decimal("0")
    for side, total_value, fee in rows:
        val = total_value or Decimal("0")
        f = fee or Decimal("0")
        if side == "buy":
            spent += val
        else:
            received += val
        fees += f
    return PAPER_STARTING_BALANCE - spent + received - fees


def _record_trade(
    db: Session,
    user_id: uuid.UUID,
    strategy_id: uuid.UUID,
    product_id: str,
    side: str,
    price: Decimal,
    quantity: Decimal,
    total_value: Decimal,
    fee: Decimal,
    reason: str,
):
    trade = Trade(
        id=uuid.uuid4(),
        user_id=user_id,
        strategy_id=strategy_id,
        exchange="coinbase",
        product_id=product_id,
        side=side,
        order_type="market",
        status="filled",
        quantity=quantity,
        price=price,
        total_value=total_value,
        fee=fee,
        is_paper=True,
        trigger_reason=reason,
        executed_at=datetime.now(timezone.utc),
        created_at=datetime.now(timezone.utc),
    )
    db.add(trade)
    return trade


@celery_app.task(name="execute_strategies")
def execute_strategies():
    """Main scheduled task — finds all running strategies and executes them."""
    with SyncSession() as db:
        strategies = db.execute(
            select(Strategy).where(Strategy.status == "running")
        ).scalars().all()

        for strat in strategies:
            try:
                if strat.strategy_type == "dca":
                    _execute_dca(db, strat)
                elif strat.strategy_type == "grid":
                    _execute_grid(db, strat)
                db.commit()
            except Exception as e:
                db.rollback()
                logger.error("Strategy %s execution failed: %s", strat.id, e)


def _execute_dca(db: Session, strategy: Strategy):
    """Execute a DCA (Dollar Cost Averaging) buy."""
    config = strategy.config or {}
    investment_amount = Decimal(str(config.get("investment_amount", 10)))
    max_total = Decimal(str(config.get("max_total_investment", 50000)))
    stop_loss_pct = Decimal(str(config.get("stop_loss_pct", 25)))
    take_profit_pct = Decimal(str(config.get("take_profit_pct", 40)))

    # Check if we've hit the max investment
    if strategy.total_invested >= max_total:
        logger.info("Strategy %s hit max investment, skipping", strategy.id)
        return

    # Get current price
    price = _get_price_sync(strategy.product_id)
    if not price or price <= 0:
        logger.warning("No price for %s, skipping DCA", strategy.product_id)
        return
    price_dec = Decimal(str(price))

    # Check paper balance
    balance = _get_paper_balance(db, strategy.user_id)
    if balance < investment_amount:
        logger.info("Insufficient paper balance for strategy %s", strategy.id)
        return

    # Calculate quantity and fee
    fee = investment_amount * PAPER_FEE_RATE
    net_amount = investment_amount - fee
    quantity = net_amount / price_dec

    # Record the buy trade
    _record_trade(
        db, strategy.user_id, strategy.id, strategy.product_id,
        "buy", price_dec, quantity, investment_amount, fee, "dca_interval"
    )

    # Update strategy totals
    new_invested = strategy.total_invested + investment_amount
    # Calculate total value of all holdings at current price
    total_qty = _get_total_holdings(db, strategy.user_id, strategy.id, strategy.product_id)
    total_qty += quantity
    current_value = total_qty * price_dec
    pnl = current_value - new_invested

    db.execute(
        update(Strategy).where(Strategy.id == strategy.id).values(
            total_invested=new_invested,
            total_value=current_value,
            pnl=pnl,
            updated_at=datetime.now(timezone.utc),
        )
    )

    # Check stop-loss / take-profit
    if new_invested > 0:
        pnl_pct = (pnl / new_invested) * 100
        if pnl_pct <= -stop_loss_pct:
            _sell_all_holdings(db, strategy, price_dec, "stop_loss")
        elif pnl_pct >= take_profit_pct:
            _sell_all_holdings(db, strategy, price_dec, "take_profit")

    logger.info(
        "DCA buy: strategy=%s, product=%s, qty=%s, price=%s",
        strategy.id, strategy.product_id, quantity, price_dec,
    )


def _execute_grid(db: Session, strategy: Strategy):
    """Execute grid trading — buy at lower levels, sell at upper levels."""
    config = strategy.config or {}
    lower_price = Decimal(str(config.get("lower_price", 0)))
    upper_price = Decimal(str(config.get("upper_price", 0)))
    num_grids = int(config.get("num_grids", 10))
    total_investment = Decimal(str(config.get("total_investment", 1000)))
    stop_loss_pct = Decimal(str(config.get("stop_loss_pct", 15)))

    if lower_price <= 0 or upper_price <= lower_price or num_grids <= 0:
        return

    price = _get_price_sync(strategy.product_id)
    if not price or price <= 0:
        return
    price_dec = Decimal(str(price))

    # Calculate grid levels
    grid_step = (upper_price - lower_price) / num_grids
    investment_per_grid = total_investment / num_grids

    # Find which grid level we're at
    if price_dec < lower_price or price_dec > upper_price:
        # Check stop loss
        if strategy.total_invested > 0:
            total_qty = _get_total_holdings(db, strategy.user_id, strategy.id, strategy.product_id)
            current_value = total_qty * price_dec
            pnl_pct = ((current_value - strategy.total_invested) / strategy.total_invested) * 100
            if pnl_pct <= -stop_loss_pct:
                _sell_all_holdings(db, strategy, price_dec, "stop_loss")
        return

    # Determine the current grid level (0 = lowest)
    current_level = int((price_dec - lower_price) / grid_step)
    current_level = max(0, min(current_level, num_grids - 1))

    # Grid state tracking in config
    last_level = config.get("_last_grid_level")

    if last_level is None:
        # First execution — buy at current level
        balance = _get_paper_balance(db, strategy.user_id)
        if balance >= investment_per_grid:
            fee = investment_per_grid * PAPER_FEE_RATE
            net = investment_per_grid - fee
            qty = net / price_dec
            _record_trade(
                db, strategy.user_id, strategy.id, strategy.product_id,
                "buy", price_dec, qty, investment_per_grid, fee, "grid_entry"
            )
            new_invested = strategy.total_invested + investment_per_grid
            db.execute(
                update(Strategy).where(Strategy.id == strategy.id).values(
                    total_invested=new_invested,
                    total_value=qty * price_dec,
                    pnl=Decimal("0"),
                    config={**config, "_last_grid_level": current_level},
                    updated_at=datetime.now(timezone.utc),
                )
            )
    elif current_level < last_level:
        # Price dropped — buy
        balance = _get_paper_balance(db, strategy.user_id)
        if balance >= investment_per_grid:
            fee = investment_per_grid * PAPER_FEE_RATE
            net = investment_per_grid - fee
            qty = net / price_dec
            _record_trade(
                db, strategy.user_id, strategy.id, strategy.product_id,
                "buy", price_dec, qty, investment_per_grid, fee, "grid_buy"
            )
            new_invested = strategy.total_invested + investment_per_grid
            total_qty = _get_total_holdings(db, strategy.user_id, strategy.id, strategy.product_id) + qty
            current_value = total_qty * price_dec
            db.execute(
                update(Strategy).where(Strategy.id == strategy.id).values(
                    total_invested=new_invested,
                    total_value=current_value,
                    pnl=current_value - new_invested,
                    config={**config, "_last_grid_level": current_level},
                    updated_at=datetime.now(timezone.utc),
                )
            )
    elif current_level > last_level:
        # Price went up — sell
        total_qty = _get_total_holdings(db, strategy.user_id, strategy.id, strategy.product_id)
        sell_qty = total_qty / num_grids  # Sell proportional
        if sell_qty > 0 and total_qty > 0:
            sell_value = sell_qty * price_dec
            fee = sell_value * PAPER_FEE_RATE
            _record_trade(
                db, strategy.user_id, strategy.id, strategy.product_id,
                "sell", price_dec, sell_qty, sell_value, fee, "grid_sell"
            )
            remaining_qty = total_qty - sell_qty
            current_value = remaining_qty * price_dec
            db.execute(
                update(Strategy).where(Strategy.id == strategy.id).values(
                    total_value=current_value,
                    pnl=current_value - strategy.total_invested + sell_value - fee,
                    config={**config, "_last_grid_level": current_level},
                    updated_at=datetime.now(timezone.utc),
                )
            )


def _get_total_holdings(
    db: Session, user_id: uuid.UUID, strategy_id: uuid.UUID, product_id: str
) -> Decimal:
    """Get net quantity held for a strategy (buys - sells)."""
    rows = db.execute(
        select(Trade.side, Trade.quantity).where(
            Trade.user_id == user_id,
            Trade.strategy_id == strategy_id,
            Trade.product_id == product_id,
            Trade.is_paper == True,  # noqa: E712
            Trade.status == "filled",
        )
    ).all()
    total = Decimal("0")
    for side, qty in rows:
        q = qty or Decimal("0")
        if side == "buy":
            total += q
        else:
            total -= q
    return max(total, Decimal("0"))


def _sell_all_holdings(db: Session, strategy: Strategy, price: Decimal, reason: str):
    """Liquidate all holdings for a strategy."""
    total_qty = _get_total_holdings(db, strategy.user_id, strategy.id, strategy.product_id)
    if total_qty <= 0:
        return

    sell_value = total_qty * price
    fee = sell_value * PAPER_FEE_RATE
    _record_trade(
        db, strategy.user_id, strategy.id, strategy.product_id,
        "sell", price, total_qty, sell_value, fee, reason
    )

    db.execute(
        update(Strategy).where(Strategy.id == strategy.id).values(
            status="stopped",
            total_value=Decimal("0"),
            pnl=sell_value - fee - strategy.total_invested,
            updated_at=datetime.now(timezone.utc),
        )
    )
    logger.info("Strategy %s stopped due to %s", strategy.id, reason)


@celery_app.task(name="update_strategy_values")
def update_strategy_values():
    """Periodic task to update P&L for all running strategies based on current prices."""
    with SyncSession() as db:
        strategies = db.execute(
            select(Strategy).where(Strategy.status == "running")
        ).scalars().all()

        for strat in strategies:
            try:
                price = _get_price_sync(strat.product_id)
                if not price:
                    continue
                price_dec = Decimal(str(price))
                total_qty = _get_total_holdings(db, strat.user_id, strat.id, strat.product_id)
                current_value = total_qty * price_dec
                pnl = current_value - strat.total_invested

                db.execute(
                    update(Strategy).where(Strategy.id == strat.id).values(
                        total_value=current_value,
                        pnl=pnl,
                        updated_at=datetime.now(timezone.utc),
                    )
                )
                db.commit()
            except Exception as e:
                db.rollback()
                logger.error("Value update failed for strategy %s: %s", strat.id, e)
