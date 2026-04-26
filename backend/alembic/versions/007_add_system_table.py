"""Add systems table for API Plus

Revision ID: 007
Revises: 006
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "007"
down_revision = "006"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "systems",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("os_type", sa.String(50), nullable=False),
        sa.Column("hostname", sa.String(255), nullable=False, unique=True),
        sa.Column("ip_address", sa.String(45), nullable=True),
        sa.Column("api_key", sa.String(255), nullable=False, unique=True),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("last_heartbeat", sa.DateTime(timezone=True), nullable=True),
        sa.Column("status_data", postgresql.JSONB, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_systems_hostname", "systems", ["hostname"])
    op.create_index("ix_systems_api_key", "systems", ["api_key"])
    op.create_index("ix_systems_is_active", "systems", ["is_active"])
    op.create_index("ix_systems_last_heartbeat", "systems", ["last_heartbeat"])


def downgrade():
    op.drop_index("ix_systems_last_heartbeat", table_name="systems")
    op.drop_index("ix_systems_is_active", table_name="systems")
    op.drop_index("ix_systems_api_key", table_name="systems")
    op.drop_index("ix_systems_hostname", table_name="systems")
    op.drop_table("systems")
