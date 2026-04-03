from decimal import Decimal

from pydantic import BaseModel


class PortfolioResponse(BaseModel):
    total_value: Decimal
    total_pnl: Decimal
    active_strategies: int
    total_trades: int
    balances: list[dict]


class PriceResponse(BaseModel):
    product_id: str
    price: float
    change_24h: float | None = None
