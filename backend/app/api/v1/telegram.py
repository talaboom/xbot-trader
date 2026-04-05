import secrets

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.config import settings
from app.database import get_db
from app.models.user import User
from app.services.telegram_service import send_welcome, get_bot_info

router = APIRouter(prefix="/telegram", tags=["telegram"])

# In-memory store for linking codes (code -> user_id)
# In production, use Redis. This works for single-instance deploys.
_link_codes: dict[str, str] = {}


class TelegramLinkRequest(BaseModel):
    code: str


@router.get("/bot-info")
async def bot_info():
    """Get Telegram bot info for the connect button."""
    info = await get_bot_info()
    if not info:
        return {"configured": False}
    return {
        "configured": True,
        "bot_username": info.get("username", ""),
        "channel_url": settings.TELEGRAM_CHANNEL_URL,
    }


@router.post("/generate-link-code")
async def generate_link_code(user: User = Depends(get_current_user)):
    """Generate a one-time code for linking Telegram account."""
    code = secrets.token_hex(4)  # 8 char hex code
    _link_codes[code] = str(user.id)
    return {"code": code, "bot_username": ""}


@router.post("/webhook")
async def telegram_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    """Handle incoming Telegram bot updates (messages from users)."""
    data = await request.json()
    message = data.get("message", {})
    text = message.get("text", "")
    chat = message.get("chat", {})
    chat_id = str(chat.get("id", ""))
    from_user = message.get("from", {})

    if not chat_id or not text:
        return {"ok": True}

    # Handle /start command with link code
    if text.startswith("/start"):
        parts = text.split()
        if len(parts) > 1:
            code = parts[1]
            user_id = _link_codes.pop(code, None)
            if user_id:
                result = await db.execute(select(User).where(User.id == user_id))
                user = result.scalar_one_or_none()
                if user:
                    user.telegram_chat_id = chat_id
                    await db.commit()
                    await send_welcome(chat_id, user.username)
                    return {"ok": True}

        # Generic /start without code
        from app.services.telegram_service import send_message
        await send_message(
            chat_id,
            "👋 <b>Welcome to X Bot Trader!</b>\n\n"
            "To connect your account, go to:\n"
            "<b>Settings → Telegram → Connect</b>\n\n"
            f"Join our channel: {settings.TELEGRAM_CHANNEL_URL}"
        )
        return {"ok": True}

    return {"ok": True}


@router.delete("/disconnect")
async def disconnect_telegram(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Disconnect Telegram from user account."""
    user.telegram_chat_id = None
    await db.commit()
    return {"status": "disconnected"}


@router.get("/status")
async def telegram_status(user: User = Depends(get_current_user)):
    """Check if user has Telegram connected."""
    return {
        "connected": bool(user.telegram_chat_id),
        "channel_url": settings.TELEGRAM_CHANNEL_URL,
    }
