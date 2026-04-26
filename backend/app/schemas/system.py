from datetime import datetime
from typing import Optional, Any
from uuid import UUID

from pydantic import BaseModel


class SystemRegister(BaseModel):
    name: str
    os_type: str  # linux, debian, windows
    hostname: str
    ip_address: Optional[str] = None


class SystemHeartbeat(BaseModel):
    api_key: str
    status_data: Optional[dict[str, Any]] = None


class SystemStatusResponse(BaseModel):
    id: UUID
    name: str
    os_type: str
    hostname: str
    ip_address: Optional[str]
    is_active: bool
    last_heartbeat: Optional[datetime]
    status_data: Optional[dict[str, Any]]
    created_at: datetime

    class Config:
        from_attributes = True


class SystemListResponse(BaseModel):
    systems: list[SystemStatusResponse]
    total: int


class CommandDispatch(BaseModel):
    system_id: UUID
    command: str
    parameters: Optional[dict[str, Any]] = None


class CommandResponse(BaseModel):
    success: bool
    message: str
    data: Optional[dict[str, Any]] = None
