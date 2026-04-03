"""Add paper_balance to users table

Revision ID: 002
Revises: 001
Create Date: 2026-04-03
"""
from alembic import op
import sqlalchemy as sa


revision = "002"
down_revision = "001"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("users", sa.Column("paper_balance", sa.Numeric(20, 8), server_default="100000", nullable=False))


def downgrade():
    op.drop_column("users", "paper_balance")
