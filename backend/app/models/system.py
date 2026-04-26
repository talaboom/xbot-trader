from datetime import datetime
from typing import Optional

from sqlalchemy import Column, String, DateTime, Boolean, JSON
from sqlalchemy.dialects.postgresql import UUID
import uuid

from app.database import Base


class System(Base):
    __tablename__ = "systems"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    os_type = Column(String(50), nullable=False)  # linux, debian, windows, parrot
    hostname = Column(String(255), nullable=False, unique=True)
    ip_address = Column(String(45), nullable=True)
    api_key = Column(String(255), nullable=False, unique=True)
    is_active = Column(Boolean, default=True)
    last_heartbeat = Column(DateTime, nullable=True)
    status_data = Column(JSON, nullable=True)  # Store custom status info
    ssh_user = Column(String(100), nullable=True)  # SSH username
    ssh_port = Column(String(10), nullable=True, default="22")  # SSH port
    ssh_enabled = Column(Boolean, default=False)  # Can be accessed via SSH
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
