import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel


class TradeResponse(BaseModel):
    id: uuid.UUID
    strategy_id: uuid.UUID | None
    product_id: str
    side: str
    order_type: str
    status: str
    quantity: Decimal | None
    price: Decimal | None
    total_value: Decimal | None
    fee: Decimal
    is_paper: bool
    trigger_reason: str | None
    executed_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


class TradeListResponse(BaseModel):
    trades: list[TradeResponse]
    total: int
    page: int
    limit: int
