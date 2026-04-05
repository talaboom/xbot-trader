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
