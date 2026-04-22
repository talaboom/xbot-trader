"""
Celery task that runs a backtest in the background.
Fetches historical data, runs the simulation, writes results back to the BacktestRun row.
"""
from __future__ import annotations

import asyncio
import logging
import os
from datetime import datetime, timezone
from decimal import Decimal

from celery import shared_task
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.models.backtest import BacktestRun
from app.services.backtest_engine import run_dca_backtest, run_grid_backtest
from app.services.historical_data_service import fetch_price_series

logger = logging.getLogger(__name__)


def _sync_db_url() -> str:
    url = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@db:5432/xbot")
    return url.replace("postgresql+asyncpg://", "postgresql://")


@shared_task(name="run_backtest", bind=True, max_retries=0)
def run_backtest(self, backtest_run_id: str) -> dict:
    engine = create_engine(_sync_db_url(), pool_pre_ping=True)
    with Session(engine) as db:
        run = db.get(BacktestRun, backtest_run_id)
        if not run:
            logger.error("BacktestRun %s not found", backtest_run_id)
            return {"status": "not_found"}

        run.status = "running"
        db.commit()

        try:
            prices = asyncio.run(fetch_price_series(run.product_id, run.period_days))
            if not prices:
                raise RuntimeError("No historical data returned")

            starting_capital = float(run.starting_capital)
            if run.strategy_type == "dca":
                result = run_dca_backtest(prices, starting_capital, run.config)
            elif run.strategy_type == "grid":
                result = run_grid_backtest(prices, starting_capital, run.config)
            else:
                raise ValueError(f"Unsupported strategy_type: {run.strategy_type}")

            run.status = "completed"
            run.ending_capital = Decimal(str(result.ending_capital))
            run.pnl = Decimal(str(result.pnl))
            run.pnl_pct = Decimal(str(result.pnl_pct))
            run.max_drawdown_pct = Decimal(str(result.max_drawdown_pct))
            run.win_rate_pct = Decimal(str(result.win_rate_pct))
            run.sharpe_ratio = Decimal(str(result.sharpe_ratio))
            run.total_trades = result.total_trades
            run.equity_curve = result.equity_curve
            run.trades_log = result.trades_log
            run.completed_at = datetime.now(timezone.utc)
            db.commit()

            return {
                "status": "completed",
                "pnl_pct": float(result.pnl_pct),
                "total_trades": result.total_trades,
            }
        except Exception as e:
            logger.exception("Backtest %s failed", backtest_run_id)
            run.status = "failed"
            run.error_message = str(e)[:1000]
            run.completed_at = datetime.now(timezone.utc)
            db.commit()
            return {"status": "failed", "error": str(e)}
