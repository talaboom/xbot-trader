from datetime import datetime, timedelta, timezone
from decimal import Decimal

import httpx
from fastapi import APIRouter, Depends
from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.database import get_db
from app.models.strategy import Strategy
from app.models.trade import Trade
from app.models.user import User
from app.schemas.dashboard import PortfolioResponse, PriceResponse
from app.services.coinbase_service import get_public_price

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

PAPER_STARTING_BALANCE = Decimal("100000")

SUPPORTED_PRODUCTS = [
    {"id": "BTC-USD", "name": "Bitcoin", "symbol": "BTC"},
    {"id": "ETH-USD", "name": "Ethereum", "symbol": "ETH"},
    {"id": "SOL-USD", "name": "Solana", "symbol": "SOL"},
    {"id": "DOGE-USD", "name": "Dogecoin", "symbol": "DOGE"},
    {"id": "ADA-USD", "name": "Cardano", "symbol": "ADA"},
    {"id": "XRP-USD", "name": "XRP", "symbol": "XRP"},
    {"id": "AVAX-USD", "name": "Avalanche", "symbol": "AVAX"},
    {"id": "LINK-USD", "name": "Chainlink", "symbol": "LINK"},
]


@router.get("", response_model=PortfolioResponse)
async def get_portfolio(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    # Count active strategies
    result = await db.execute(
        select(func.count()).where(Strategy.user_id == user.id, Strategy.status == "running")
    )
    active = result.scalar() or 0

    # Count total trades
    result = await db.execute(select(func.count()).where(Trade.user_id == user.id))
    total_trades = result.scalar() or 0

    # Sum P&L from strategies
    result = await db.execute(
        select(func.coalesce(func.sum(Strategy.pnl), 0)).where(Strategy.user_id == user.id)
    )
    total_pnl = result.scalar() or Decimal("0")

    # Calculate paper balance from trade history
    if user.is_paper_mode:
        # Sum buys and sells separately
        result = await db.execute(
            select(
                func.coalesce(
                    func.sum(case((Trade.side == "buy", Trade.total_value), else_=Decimal("0"))),
                    Decimal("0"),
                ).label("total_bought"),
                func.coalesce(
                    func.sum(case((Trade.side == "sell", Trade.total_value), else_=Decimal("0"))),
                    Decimal("0"),
                ).label("total_sold"),
                func.coalesce(func.sum(Trade.fee), Decimal("0")).label("total_fees"),
            ).where(Trade.user_id == user.id, Trade.is_paper == True)  # noqa: E712
        )
        row = result.one()
        cash_balance = PAPER_STARTING_BALANCE - row.total_bought + row.total_sold - row.total_fees

        # Get value of current crypto holdings
        holdings_value = Decimal("0")
        # Get net holdings per product
        holdings_result = await db.execute(
            select(
                Trade.product_id,
                func.sum(
                    case(
                        (Trade.side == "buy", Trade.quantity),
                        else_=-Trade.quantity,
                    )
                ).label("net_qty"),
            )
            .where(
                Trade.user_id == user.id,
                Trade.is_paper == True,  # noqa: E712
                Trade.status == "filled",
            )
            .group_by(Trade.product_id)
        )
        for product_id, net_qty in holdings_result.all():
            if net_qty and net_qty > 0:
                price = await get_public_price(product_id)
                if price:
                    holdings_value += net_qty * Decimal(str(price))

        total_value = cash_balance + holdings_value
        balances = [
            {"currency": "USD", "balance": str(round(cash_balance, 2)), "name": "Paper USD"},
        ]
    else:
        balances = []
        total_value = Decimal("0")

    return PortfolioResponse(
        total_value=total_value,
        total_pnl=total_pnl,
        active_strategies=active,
        total_trades=total_trades,
        balances=balances,
    )


@router.get("/prices")
async def get_prices():
    """Get current prices with real 24h change from Coinbase."""
    prices = []
    for product in SUPPORTED_PRODUCTS:
        price = await get_public_price(product["id"])
        change_24h = await _get_24h_change(product["id"], price)
        prices.append({
            "product_id": product["id"],
            "name": product["name"],
            "symbol": product["symbol"],
            "price": price or 0,
            "change_24h": change_24h,
        })
    return prices


@router.get("/market-stats")
async def get_market_stats():
    """Fetch real global crypto market stats from CoinGecko + Fear & Greed index."""
    stats = {
        "total_market_cap": 0,
        "total_volume_24h": 0,
        "btc_dominance": 0,
        "market_cap_change_24h": 0,
        "fear_greed_value": 0,
        "fear_greed_label": "N/A",
    }
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            # CoinGecko global stats
            resp = await client.get("https://api.coingecko.com/api/v3/global")
            if resp.status_code == 200:
                data = resp.json().get("data", {})
                stats["total_market_cap"] = data.get("total_market_cap", {}).get("usd", 0)
                stats["total_volume_24h"] = data.get("total_volume", {}).get("usd", 0)
                stats["btc_dominance"] = round(data.get("market_cap_percentage", {}).get("btc", 0), 1)
                stats["market_cap_change_24h"] = round(data.get("market_cap_change_percentage_24h_usd", 0), 1)

            # Fear & Greed Index from alternative.me
            fg_resp = await client.get("https://api.alternative.me/fng/?limit=1")
            if fg_resp.status_code == 200:
                fg_data = fg_resp.json().get("data", [{}])[0]
                stats["fear_greed_value"] = int(fg_data.get("value", 0))
                stats["fear_greed_label"] = fg_data.get("value_classification", "N/A")
    except Exception:
        pass
    return stats


@router.get("/portfolio-history")
async def get_portfolio_history(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Build daily portfolio value series from trade history."""
    from datetime import timedelta

    # Get all paper trades ordered by date
    result = await db.execute(
        select(Trade.side, Trade.total_value, Trade.fee, Trade.executed_at)
        .where(Trade.user_id == user.id, Trade.is_paper == True)  # noqa: E712
        .order_by(Trade.executed_at)
    )
    trades = result.all()

    if not trades:
        # No trades — return flat $100K line for last 30 days
        now = datetime.now(timezone.utc)
        return [
            {"time": int((now - timedelta(days=30 - i)).timestamp()), "value": 100000}
            for i in range(31)
        ]

    # Build daily cash balance series
    from collections import defaultdict
    daily_changes: dict[str, Decimal] = defaultdict(lambda: Decimal("0"))

    for side, total_value, fee, executed_at in trades:
        if not executed_at:
            continue
        day_key = executed_at.strftime("%Y-%m-%d")
        val = total_value or Decimal("0")
        f = fee or Decimal("0")
        if side == "buy":
            daily_changes[day_key] -= val + f
        else:
            daily_changes[day_key] += val - f

    # Generate cumulative series
    first_trade = trades[0].executed_at
    now = datetime.now(timezone.utc)
    days = max(1, (now - first_trade).days + 1)
    days = min(days, 90)  # Cap at 90 days

    history = []
    balance = PAPER_STARTING_BALANCE
    current_date = now - timedelta(days=days)

    for i in range(days + 1):
        day = current_date + timedelta(days=i)
        day_key = day.strftime("%Y-%m-%d")
        balance += daily_changes.get(day_key, Decimal("0"))
        history.append({
            "time": int(day.timestamp()),
            "value": float(balance),
        })

    return history


@router.get("/holdings")
async def get_holdings(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Get real asset allocation from trade history."""
    from datetime import timezone as tz

    COLORS = {
        "USD": "#22c55e", "BTC": "#f7931a", "ETH": "#627eea",
        "SOL": "#9945ff", "DOGE": "#c2a633", "ADA": "#0033ad",
        "XRP": "#00aae4", "AVAX": "#e84142", "LINK": "#2a5ada",
    }
    NAMES = {
        "USD": "US Dollar", "BTC": "Bitcoin", "ETH": "Ethereum",
        "SOL": "Solana", "DOGE": "Dogecoin", "ADA": "Cardano",
        "XRP": "XRP", "AVAX": "Avalanche", "LINK": "Chainlink",
    }

    # Get net holdings per product
    result = await db.execute(
        select(
            Trade.product_id,
            func.sum(
                case(
                    (Trade.side == "buy", Trade.quantity),
                    else_=-Trade.quantity,
                )
            ).label("net_qty"),
        )
        .where(
            Trade.user_id == user.id,
            Trade.is_paper == True,  # noqa: E712
            Trade.status == "filled",
        )
        .group_by(Trade.product_id)
    )

    holdings = []
    total_value = Decimal("0")

    # Calculate cash balance
    cash_result = await db.execute(
        select(
            func.coalesce(
                func.sum(case((Trade.side == "buy", Trade.total_value), else_=Decimal("0"))),
                Decimal("0"),
            ).label("bought"),
            func.coalesce(
                func.sum(case((Trade.side == "sell", Trade.total_value), else_=Decimal("0"))),
                Decimal("0"),
            ).label("sold"),
            func.coalesce(func.sum(Trade.fee), Decimal("0")).label("fees"),
        ).where(Trade.user_id == user.id, Trade.is_paper == True)  # noqa: E712
    )
    cash_row = cash_result.one()
    cash_balance = float(PAPER_STARTING_BALANCE - cash_row.bought + cash_row.sold - cash_row.fees)
    total_value += Decimal(str(cash_balance))

    # Crypto holdings
    crypto_holdings = []
    for product_id, net_qty in result.all():
        if net_qty and net_qty > 0:
            price = await get_public_price(product_id)
            if price:
                value = float(net_qty) * price
                symbol = product_id.split("-")[0]
                crypto_holdings.append({
                    "symbol": symbol,
                    "name": NAMES.get(symbol, symbol),
                    "value": round(value, 2),
                    "color": COLORS.get(symbol, "#6b7280"),
                })
                total_value += Decimal(str(value))

    # Build final list with percentages
    total_float = float(total_value) if total_value > 0 else 1
    holdings.append({
        "symbol": "USD",
        "name": "US Dollar",
        "value": round(cash_balance, 2),
        "percentage": round(cash_balance / total_float * 100, 1),
        "color": "#22c55e",
    })
    for h in crypto_holdings:
        h["percentage"] = round(h["value"] / total_float * 100, 1)
        holdings.append(h)

    # Sort by value descending
    holdings.sort(key=lambda x: x["value"], reverse=True)

    return {"holdings": holdings, "total_value": round(total_float, 2)}


@router.get("/products")
async def get_products():
    return SUPPORTED_PRODUCTS


async def _get_24h_change(product_id: str, current_price: float | None) -> float | None:
    """Calculate 24h price change % using Coinbase spot price endpoint."""
    if not current_price:
        return None
    try:
        # Use Coinbase exchange rates for 24h ago comparison
        # The v2 buy/sell prices give us a reasonable current benchmark
        # For actual 24h change, we fetch the product ticker
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(
                f"https://api.exchange.coinbase.com/products/{product_id}/stats"
            )
            if resp.status_code == 200:
                stats = resp.json()
                open_price = float(stats.get("open", 0))
                if open_price > 0:
                    return round(((current_price - open_price) / open_price) * 100, 2)
    except Exception:
        pass
    return None
