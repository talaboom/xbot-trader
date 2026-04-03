"""Initial tables

Revision ID: 001
Revises:
Create Date: 2026-04-02
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("email", sa.String(255), unique=True, nullable=False, index=True),
        sa.Column("username", sa.String(100), unique=True, nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true")),
        sa.Column("is_paper_mode", sa.Boolean(), server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )

    op.create_table(
        "exchange_keys",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("exchange", sa.String(50), server_default="coinbase"),
        sa.Column("api_key_encrypted", sa.LargeBinary(), nullable=False),
        sa.Column("api_secret_encrypted", sa.LargeBinary(), nullable=False),
        sa.Column("key_nonce", sa.LargeBinary(), nullable=False),
        sa.Column("secret_nonce", sa.LargeBinary(), nullable=False),
        sa.Column("key_tag", sa.LargeBinary(), nullable=False),
        sa.Column("secret_tag", sa.LargeBinary(), nullable=False),
        sa.Column("label", sa.String(100)),
        sa.Column("is_valid", sa.Boolean(), server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.UniqueConstraint("user_id", "exchange", name="uq_user_exchange"),
    )

    op.create_table(
        "strategies",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("strategy_type", sa.String(50), nullable=False),
        sa.Column("product_id", sa.String(20), nullable=False),
        sa.Column("config", JSONB(), nullable=False),
        sa.Column("status", sa.String(20), server_default="stopped", index=True),
        sa.Column("is_paper_mode", sa.Boolean(), server_default=sa.text("true")),
        sa.Column("celery_task_id", sa.String(255)),
        sa.Column("total_invested", sa.Numeric(20, 8), server_default="0"),
        sa.Column("total_value", sa.Numeric(20, 8), server_default="0"),
        sa.Column("pnl", sa.Numeric(20, 8), server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )

    op.create_table(
        "trades",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("strategy_id", UUID(as_uuid=True), sa.ForeignKey("strategies.id", ondelete="SET NULL"), index=True),
        sa.Column("exchange", sa.String(50), server_default="coinbase"),
        sa.Column("product_id", sa.String(20), nullable=False),
        sa.Column("side", sa.String(10), nullable=False),
        sa.Column("order_type", sa.String(20), nullable=False),
        sa.Column("status", sa.String(20), nullable=False),
        sa.Column("coinbase_order_id", sa.String(255)),
        sa.Column("quantity", sa.Numeric(20, 8)),
        sa.Column("price", sa.Numeric(20, 8)),
        sa.Column("total_value", sa.Numeric(20, 8)),
        sa.Column("fee", sa.Numeric(20, 8), server_default="0"),
        sa.Column("is_paper", sa.Boolean(), server_default=sa.text("false")),
        sa.Column("trigger_reason", sa.String(50)),
        sa.Column("error_message", sa.Text()),
        sa.Column("executed_at", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), index=True),
    )

    op.create_table(
        "price_snapshots",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("product_id", sa.String(20), nullable=False),
        sa.Column("price", sa.Numeric(20, 8), nullable=False),
        sa.Column("recorded_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )
    op.create_index("idx_price_product", "price_snapshots", ["product_id", "recorded_at"])


def downgrade() -> None:
    op.drop_table("price_snapshots")
    op.drop_table("trades")
    op.drop_table("strategies")
    op.drop_table("exchange_keys")
    op.drop_table("users")
