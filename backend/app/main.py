import logging
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.api.v1.stripe_webhook import router as webhook_router
from app.api.v1.websocket import router as ws_router
from app.config import settings

logger = logging.getLogger(__name__)

app = FastAPI(title="X Bot Trader", version="0.1.0")

# CORS: read allowed origins from env var (comma-separated).
# Strip surrounding quotes that some platforms (Railway, etc.) add when
# a value contains commas, e.g. "https://a.com,https://b.com" → two clean origins.
_raw_origins = settings.ALLOWED_ORIGINS.strip("'\"")
origins = [o.strip().strip("'\"") for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")
app.include_router(webhook_router)
app.include_router(ws_router)


@app.on_event("startup")
async def ensure_db_columns():
    """Ensure all required columns exist in the users table."""
    from app.database import engine
    from sqlalchemy import text
    try:
        async with engine.begin() as conn:
            # Get existing columns
            result = await conn.execute(text(
                "SELECT column_name FROM information_schema.columns WHERE table_name='users'"
            ))
            existing = {row[0] for row in result}

            # Add missing columns
            columns_to_add = {
                "oauth_provider": "VARCHAR(20)",
                "oauth_id": "VARCHAR(255)",
                "avatar_url": "VARCHAR(500)",
                "telegram_chat_id": "VARCHAR(50)",
                "facebook_id": "VARCHAR(255)",
            }
            for col, col_type in columns_to_add.items():
                if col not in existing:
                    await conn.execute(text(f"ALTER TABLE users ADD COLUMN {col} {col_type}"))
                    logger.info(f"Added missing column: users.{col}")

            # Make password_hash nullable (for OAuth users)
            await conn.execute(text(
                "ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL"
            ))
    except Exception as e:
        logger.error(f"DB column check failed: {e}")


@app.get("/health")
async def health():
    return {"status": "ok", "app": "X Bot Trader"}
