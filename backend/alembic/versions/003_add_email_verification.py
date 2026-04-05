"""Add email verification fields to users

Revision ID: 003
Revises: 002
Create Date: 2026-04-03
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("is_email_verified", sa.Boolean(), server_default="false", nullable=False))
    op.add_column("users", sa.Column("email_verify_code", sa.String(6), nullable=True))
    op.add_column("users", sa.Column("email_verify_expires", sa.DateTime(timezone=True), nullable=True))
    # Mark all existing users as verified so they don't get locked out
    op.execute("UPDATE users SET is_email_verified = true")


def downgrade() -> None:
    op.drop_column("users", "email_verify_expires")
    op.drop_column("users", "email_verify_code")
    op.drop_column("users", "is_email_verified")
