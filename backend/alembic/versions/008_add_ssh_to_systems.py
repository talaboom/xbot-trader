"""Add SSH configuration to systems table

Revision ID: 008
Revises: 007
"""
from alembic import op
import sqlalchemy as sa

revision = "008"
down_revision = "007"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("systems", sa.Column("ssh_user", sa.String(100), nullable=True))
    op.add_column("systems", sa.Column("ssh_port", sa.String(10), nullable=True, server_default="22"))
    op.add_column("systems", sa.Column("ssh_enabled", sa.Boolean, nullable=False, server_default="false"))
    op.create_index("ix_systems_ssh_enabled", "systems", ["ssh_enabled"])


def downgrade():
    op.drop_index("ix_systems_ssh_enabled", table_name="systems")
    op.drop_column("systems", "ssh_enabled")
    op.drop_column("systems", "ssh_port")
    op.drop_column("systems", "ssh_user")
