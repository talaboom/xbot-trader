import os

from fastapi import APIRouter, HTTPException, Header
from sqlalchemy import text

from app.database import async_session

router = APIRouter(prefix="/admin", tags=["admin"])

ADMIN_SECRET = os.getenv("ADMIN_SECRET", "xbot-admin-2026")


def _check_secret(x_admin_secret: str = Header()):
    if x_admin_secret != ADMIN_SECRET:
        raise HTTPException(status_code=403, detail="Invalid admin secret")


@router.post("/reset-users")
async def reset_users(x_admin_secret: str = Header()):
    """Delete all users and related data. Requires X-Admin-Secret header."""
    _check_secret(x_admin_secret)
    async with async_session() as db:
        await db.execute(text("TRUNCATE TABLE users CASCADE"))
        await db.commit()
    return {"status": "ok", "message": "All users and related data have been deleted"}


@router.get("/stats")
async def admin_stats(x_admin_secret: str = Header()):
    """Get basic stats. Requires X-Admin-Secret header."""
    _check_secret(x_admin_secret)
    async with async_session() as db:
        users = (await db.execute(text("SELECT COUNT(*) FROM users"))).scalar()
        trades = (await db.execute(text("SELECT COUNT(*) FROM trades"))).scalar() if True else 0
    return {"users": users, "trades": trades}


@router.get("/db-columns")
async def db_columns(x_admin_secret: str = Header()):
    """Check users table columns."""
    _check_secret(x_admin_secret)
    async with async_session() as db:
        result = await db.execute(text(
            "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name='users' ORDER BY ordinal_position"
        ))
        cols = [{"name": r[0], "type": r[1], "nullable": r[2]} for r in result]
    return {"columns": cols}


@router.post("/fix-db")
async def fix_db(x_admin_secret: str = Header()):
    """Add missing columns to users table."""
    _check_secret(x_admin_secret)
    added = []
    async with async_session() as db:
        result = await db.execute(text(
            "SELECT column_name FROM information_schema.columns WHERE table_name='users'"
        ))
        existing = {r[0] for r in result}

        columns = {
            "oauth_provider": "VARCHAR(20)",
            "oauth_id": "VARCHAR(255)",
            "avatar_url": "VARCHAR(500)",
            "telegram_chat_id": "VARCHAR(50)",
            "facebook_id": "VARCHAR(255)",
        }
        for col, col_type in columns.items():
            if col not in existing:
                await db.execute(text(f"ALTER TABLE users ADD COLUMN {col} {col_type}"))
                added.append(col)

        if "password_hash" in existing:
            await db.execute(text("ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL"))

        await db.commit()
    return {"status": "ok", "added_columns": added}
