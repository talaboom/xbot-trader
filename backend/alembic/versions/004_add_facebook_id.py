"""Add facebook_id to users

Revision ID: 004
Revises: 003
Create Date: 2026-04-05
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "004"
down_revision: Union[str, None] = "003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("facebook_id", sa.String(50), nullable=True))
    op.create_unique_constraint("uq_users_facebook_id", "users", ["facebook_id"])
    op.create_index("ix_users_facebook_id", "users", ["facebook_id"])


def downgrade() -> None:
    op.drop_index("ix_users_facebook_id", table_name="users")
    op.drop_constraint("uq_users_facebook_id", "users", type_="unique")
    op.drop_column("users", "facebook_id")
