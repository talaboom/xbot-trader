"""Add OAuth fields to users table

Revision ID: 004
Revises: 003
"""
from alembic import op
import sqlalchemy as sa

revision = "004"
down_revision = "003"
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    # Check which columns exist
    result = conn.execute(sa.text(
        "SELECT column_name FROM information_schema.columns WHERE table_name='users'"
    ))
    existing = {row[0] for row in result}

    if "oauth_provider" not in existing:
        op.add_column("users", sa.Column("oauth_provider", sa.String(20), nullable=True))
    if "oauth_id" not in existing:
        op.add_column("users", sa.Column("oauth_id", sa.String(255), nullable=True))
    if "avatar_url" not in existing:
        op.add_column("users", sa.Column("avatar_url", sa.String(500), nullable=True))

    # Make password_hash nullable for OAuth users
    op.alter_column("users", "password_hash", existing_type=sa.String(255), nullable=True)


def downgrade():
    op.alter_column("users", "password_hash", existing_type=sa.String(255), nullable=False)
    op.drop_column("users", "avatar_url")
    op.drop_column("users", "oauth_id")
    op.drop_column("users", "oauth_provider")
