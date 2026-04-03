import os

from celery import Celery
from celery.schedules import crontab

redis_url = os.getenv("REDIS_URL", "redis://redis:6379/0")

celery_app = Celery("xbot_trader", broker=redis_url, backend=redis_url)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    beat_scheduler="redbeat.RedBeatScheduler",
    redbeat_redis_url=redis_url,
    imports=[
        "app.tasks.strategy_tasks",
        "app.tasks.scheduler",
    ],
    beat_schedule={
        "check-strategies-every-60s": {
            "task": "check_and_run_strategies",
            "schedule": 60.0,  # Every 60 seconds
        },
    },
)
