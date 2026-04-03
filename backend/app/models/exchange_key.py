import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, LargeBinary, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class ExchangeKey(Base):
    __tablename__ = "exchange_keys"
    __table_args__ = (UniqueConstraint("user_id", "exchange", name="uq_user_exchange"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    exchange: Mapped[str] = mapped_column(String(50), default="coinbase")
    api_key_encrypted: Mapped[bytes] = mapped_column(LargeBinary, nullable=False)
    api_secret_encrypted: Mapped[bytes] = mapped_column(LargeBinary, nullable=False)
    key_nonce: Mapped[bytes] = mapped_column(LargeBinary, nullable=False)
    secret_nonce: Mapped[bytes] = mapped_column(LargeBinary, nullable=False)
    key_tag: Mapped[bytes] = mapped_column(LargeBinary, nullable=False)
    secret_tag: Mapped[bytes] = mapped_column(LargeBinary, nullable=False)
    label: Mapped[str | None] = mapped_column(String(100))
    is_valid: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
