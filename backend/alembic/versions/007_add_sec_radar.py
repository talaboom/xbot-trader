"""Add SEC Radar tables (Quiet Risk feature)

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
        "sec_watchlist",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("ticker", sa.String(10), nullable=False),
        sa.Column("cik", sa.String(10), nullable=False),
        sa.Column("company_name", sa.String(255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("user_id", "ticker", name="uq_sec_watchlist_user_ticker"),
    )
    op.create_index("ix_sec_watchlist_user_id", "sec_watchlist", ["user_id"])
    op.create_index("ix_sec_watchlist_cik", "sec_watchlist", ["cik"])

    op.create_table(
        "sec_filings",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("cik", sa.String(10), nullable=False),
        sa.Column("ticker", sa.String(10), nullable=True),
        sa.Column("accession_number", sa.String(25), nullable=False),
        sa.Column("form_type", sa.String(10), nullable=False),
        sa.Column("filed_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("period_of_report", sa.String(12), nullable=True),
        sa.Column("primary_doc_url", sa.String(500), nullable=False),
        sa.Column("risk_factors_text", sa.Text, nullable=True),
        sa.Column("processed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("accession_number", name="uq_sec_filings_accession"),
    )
    op.create_index("ix_sec_filings_cik", "sec_filings", ["cik"])
    op.create_index("ix_sec_filings_ticker", "sec_filings", ["ticker"])
    op.create_index("ix_sec_filings_filed_at", "sec_filings", ["filed_at"])

    op.create_table(
        "sec_risk_signals",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("filing_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("sec_filings.id", ondelete="CASCADE"), nullable=False),
        sa.Column("prior_filing_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("sec_filings.id", ondelete="SET NULL"), nullable=True),
        sa.Column("ticker", sa.String(10), nullable=False),
        sa.Column("signal_type", sa.String(20), nullable=False),
        sa.Column("severity", sa.String(20), nullable=False),
        sa.Column("novelty", sa.Numeric(4, 3), nullable=True),
        sa.Column("summary", sa.String(255), nullable=False),
        sa.Column("detail", sa.Text, nullable=False),
        sa.Column("diff_excerpt", sa.Text, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_sec_risk_signals_filing_id", "sec_risk_signals", ["filing_id"])
    op.create_index("ix_sec_risk_signals_ticker", "sec_risk_signals", ["ticker"])
    op.create_index("ix_sec_risk_signals_severity", "sec_risk_signals", ["severity"])
    op.create_index("ix_sec_risk_signals_created_at", "sec_risk_signals", ["created_at"])

    op.create_table(
        "sec_paper_positions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("signal_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("sec_risk_signals.id", ondelete="SET NULL"), nullable=True),
        sa.Column("ticker", sa.String(10), nullable=False),
        sa.Column("side", sa.String(10), nullable=False),
        sa.Column("qty", sa.Integer, nullable=False),
        sa.Column("opened_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("entry_price", sa.Numeric(20, 8), nullable=False),
        sa.Column("close_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("exit_price", sa.Numeric(20, 8), nullable=True),
        sa.Column("pnl", sa.Numeric(20, 8), nullable=True),
        sa.Column("pnl_pct", sa.Numeric(10, 4), nullable=True),
        sa.Column("status", sa.String(20), nullable=False, server_default="open"),
    )
    op.create_index("ix_sec_paper_positions_user_id", "sec_paper_positions", ["user_id"])
    op.create_index("ix_sec_paper_positions_status", "sec_paper_positions", ["status"])
    op.create_index("ix_sec_paper_positions_ticker", "sec_paper_positions", ["ticker"])


def downgrade():
    op.drop_index("ix_sec_paper_positions_ticker", table_name="sec_paper_positions")
    op.drop_index("ix_sec_paper_positions_status", table_name="sec_paper_positions")
    op.drop_index("ix_sec_paper_positions_user_id", table_name="sec_paper_positions")
    op.drop_table("sec_paper_positions")

    op.drop_index("ix_sec_risk_signals_created_at", table_name="sec_risk_signals")
    op.drop_index("ix_sec_risk_signals_severity", table_name="sec_risk_signals")
    op.drop_index("ix_sec_risk_signals_ticker", table_name="sec_risk_signals")
    op.drop_index("ix_sec_risk_signals_filing_id", table_name="sec_risk_signals")
    op.drop_table("sec_risk_signals")

    op.drop_index("ix_sec_filings_filed_at", table_name="sec_filings")
    op.drop_index("ix_sec_filings_ticker", table_name="sec_filings")
    op.drop_index("ix_sec_filings_cik", table_name="sec_filings")
    op.drop_table("sec_filings")

    op.drop_index("ix_sec_watchlist_cik", table_name="sec_watchlist")
    op.drop_index("ix_sec_watchlist_user_id", table_name="sec_watchlist")
    op.drop_table("sec_watchlist")
