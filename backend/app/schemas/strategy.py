import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel


class StrategyCreate(BaseModel):
    name: str
    strategy_type: str  # 'dca' | 'grid'
    product_id: str
    config: dict
    is_paper_mode: bool = True


class StrategyResponse(BaseModel):
    id: uuid.UUID
    name: str
    strategy_type: str
    product_id: str
    config: dict
    status: str
    is_paper_mode: bool
    total_invested: Decimal
    total_value: Decimal
    pnl: Decimal
    created_at: datetime

    model_config = {"from_attributes": True}
