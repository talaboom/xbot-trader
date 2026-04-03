import uuid
from datetime import datetime

from pydantic import BaseModel


class ExchangeKeyCreate(BaseModel):
    api_key: str
    api_secret: str
    label: str | None = None


class ExchangeKeyResponse(BaseModel):
    id: uuid.UUID
    exchange: str
    label: str | None
    api_key_masked: str
    is_valid: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class ExchangeKeyVerifyResponse(BaseModel):
    is_valid: bool
    message: str
    balances: list[dict] | None = None
