"""Add telegram_chat_id to users table

Revision ID: 005
Revises: 004
"""
from alembic import op
import sqlalchemy as sa

revision = "005"
down_revision = "004"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("users", sa.Column("telegram_chat_id", sa.String(50), nullable=True))


def downgrade():
    op.drop_column("users", "telegram_chat_id")
