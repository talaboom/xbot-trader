"""
Celery Beat scheduler — checks running strategies and dispatches execution tasks.
"""
import asyncio
import logging

from sqlalchemy import select

from app.database import async_session
from app.models.strategy import Strategy
from app.tasks.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(name="check_and_run_strategies")
def check_and_run_strategies():
    """Periodic task: find all running strategies and dispatch execution tasks."""
    loop = asyncio.new_event_loop()
    try:
        loop.run_until_complete(_check_strategies())
    finally:
        loop.close()


async def _check_strategies():
    async with async_session() as db:
        result = await db.execute(
            select(Strategy).where(Strategy.status == "running")
        )
        strategies = result.scalars().all()

        for strategy in strategies:
            strategy_id = str(strategy.id)
            if strategy.strategy_type == "dca":
                celery_app.send_task("execute_dca_strategy", args=[strategy_id])
                logger.info(f"Dispatched DCA task for strategy {strategy_id}")
            elif strategy.strategy_type == "grid":
                celery_app.send_task("execute_grid_strategy", args=[strategy_id])
                logger.info(f"Dispatched Grid task for strategy {strategy_id}")

        logger.info(f"Checked {len(strategies)} running strategies")
