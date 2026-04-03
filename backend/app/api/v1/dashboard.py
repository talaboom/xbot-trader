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
    """Fetch real global crypto market stats from CoinGecko."""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get("https://api.coingecko.com/api/v3/global")
            if resp.status_code == 200:
                data = resp.json().get("data", {})
                total_mcap = data.get("total_market_cap", {}).get("usd", 0)
                total_vol = data.get("total_volume", {}).get("usd", 0)
                btc_dom = data.get("market_cap_percentage", {}).get("btc", 0)
                mcap_change = data.get("market_cap_change_percentage_24h_usd", 0)
                return {
                    "total_market_cap": total_mcap,
                    "total_volume_24h": total_vol,
                    "btc_dominance": round(btc_dom, 1),
                    "market_cap_change_24h": round(mcap_change, 1),
                }
    except Exception:
        pass
    return {
        "total_market_cap": 0,
        "total_volume_24h": 0,
        "btc_dominance": 0,
        "market_cap_change_24h": 0,
    }


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
