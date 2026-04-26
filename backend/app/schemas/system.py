from datetime import datetime
from typing import Optional, Any
from uuid import UUID

from pydantic import BaseModel


class SystemRegister(BaseModel):
    name: str
    os_type: str  # linux, debian, windows, parrot
    hostname: str
    ip_address: Optional[str] = None
    ssh_user: Optional[str] = None
    ssh_port: Optional[str] = "22"
    ssh_enabled: bool = False


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
    ssh_user: Optional[str]
    ssh_port: Optional[str]
    ssh_enabled: bool
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


class SSHCommand(BaseModel):
    source_system_id: UUID  # System making the request (has the SSH key)
    target_system_id: UUID  # System to SSH into
    command: str  # Command to execute
    timeout: int = 30  # Timeout in seconds


class SSHCommandResponse(BaseModel):
    success: bool
    message: str
    stdout: Optional[str] = None
    stderr: Optional[str] = None
    exit_code: Optional[int] = None
