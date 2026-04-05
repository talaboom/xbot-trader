"""Add referral system columns to users

Revision ID: 002
Revises: 001
Create Date: 2026-04-04
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision: str = "002b"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("referral_code", sa.String(20), unique=True))
    op.add_column("users", sa.Column("referred_by", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL")))
    op.add_column("users", sa.Column("referral_count", sa.Integer(), server_default="0"))

    # Generate referral codes for existing users
    op.execute(
        "UPDATE users SET referral_code = UPPER(SUBSTR(MD5(RANDOM()::TEXT), 1, 8)) WHERE referral_code IS NULL"
    )
    op.alter_column("users", "referral_code", nullable=False)


def downgrade() -> None:
    op.drop_column("users", "referral_count")
    op.drop_column("users", "referred_by")
    op.drop_column("users", "referral_code")
