from decimal import Decimal

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.database import get_db
from app.models.strategy import Strategy
from app.models.trade import Trade
from app.models.user import User
from app.schemas.dashboard import PortfolioResponse, PriceResponse
from app.services.coinbase_service import get_public_price
from app.services.paper_trading_service import get_paper_holdings

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

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

    if user.is_paper_mode:
        # Calculate real portfolio value from paper balance + holdings
        cash_balance = user.paper_balance
        holdings = await get_paper_holdings(db, user.id)

        balances = [{"currency": "USD", "balance": str(cash_balance), "name": "Paper USD"}]
        holdings_value = Decimal("0")

        for symbol, qty in holdings.items():
            product_id = f"{symbol}-USD"
            price = await get_public_price(product_id)
            if price:
                value = qty * Decimal(str(price))
                holdings_value += value
                balances.append({
                    "currency": symbol,
                    "balance": str(qty),
                    "name": f"Paper {symbol}",
                    "value_usd": str(value),
                    "price": str(price),
                })

        total_value = cash_balance + holdings_value
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
    prices = []
    for product in SUPPORTED_PRODUCTS:
        price = await get_public_price(product["id"])
        prices.append({
            "product_id": product["id"],
            "name": product["name"],
            "symbol": product["symbol"],
            "price": price or 0,
        })
    return prices


@router.get("/products")
async def get_products():
    return SUPPORTED_PRODUCTS
