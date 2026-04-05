"""Add Stripe subscription fields to users

Revision ID: 002
Revises: 001
Create Date: 2026-04-03
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("stripe_customer_id", sa.String(255), unique=True, nullable=True))
    op.add_column("users", sa.Column("stripe_subscription_id", sa.String(255), nullable=True))
    op.add_column("users", sa.Column("subscription_tier", sa.String(20), server_default="free", nullable=False))
    op.add_column("users", sa.Column("subscription_status", sa.String(20), server_default="inactive", nullable=False))


def downgrade() -> None:
    op.drop_column("users", "subscription_status")
    op.drop_column("users", "subscription_tier")
    op.drop_column("users", "stripe_subscription_id")
    op.drop_column("users", "stripe_customer_id")
