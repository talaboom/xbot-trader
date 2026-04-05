import logging

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

BOT_TOKEN = settings.TELEGRAM_BOT_TOKEN
BASE_URL = f"https://api.telegram.org/bot{BOT_TOKEN}" if BOT_TOKEN else ""


async def send_message(chat_id: str, text: str, parse_mode: str = "HTML") -> bool:
    """Send a message to a Telegram user."""
    if not BOT_TOKEN:
        return False
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(f"{BASE_URL}/sendMessage", json={
                "chat_id": chat_id,
                "text": text,
                "parse_mode": parse_mode,
            })
            return resp.status_code == 200
    except Exception as e:
        logger.error(f"Telegram send error: {e}")
        return False


async def send_trade_alert(chat_id: str, side: str, product: str, amount: float, price: float):
    """Send trade execution alert."""
    emoji = "🟢" if side == "BUY" else "🔴"
    text = (
        f"{emoji} <b>Trade Executed</b>\n\n"
        f"<b>Action:</b> {side}\n"
        f"<b>Asset:</b> {product}\n"
        f"<b>Amount:</b> ${amount:,.2f}\n"
        f"<b>Price:</b> ${price:,.2f}\n\n"
        f"<i>via X Bot Trader</i>"
    )
    return await send_message(chat_id, text)


async def send_price_alert(chat_id: str, product: str, price: float, direction: str):
    """Send price movement alert."""
    emoji = "📈" if direction == "up" else "📉"
    text = (
        f"{emoji} <b>Price Alert</b>\n\n"
        f"<b>{product}</b> is now <b>${price:,.2f}</b>\n\n"
        f"<i>via X Bot Trader</i>"
    )
    return await send_message(chat_id, text)


async def send_bot_status(chat_id: str, bot_name: str, status: str, details: str = ""):
    """Send bot status update."""
    emoji_map = {"started": "🚀", "stopped": "🛑", "error": "⚠️", "profit": "💰"}
    emoji = emoji_map.get(status, "ℹ️")
    text = (
        f"{emoji} <b>Bot Update</b>\n\n"
        f"<b>{bot_name}</b> — {status.upper()}\n"
    )
    if details:
        text += f"{details}\n"
    text += "\n<i>via X Bot Trader</i>"
    return await send_message(chat_id, text)


async def send_welcome(chat_id: str, username: str):
    """Send welcome message when user connects Telegram."""
    text = (
        f"🎉 <b>Connected to X Bot Trader!</b>\n\n"
        f"Hey <b>{username}</b>, you'll now receive:\n\n"
        f"📊 Trade execution alerts\n"
        f"📈 Price movement notifications\n"
        f"🤖 Bot status updates\n"
        f"💰 Daily P&L summaries\n\n"
        f"Manage notifications in your app Settings.\n\n"
        f"Join our channel: {settings.TELEGRAM_CHANNEL_URL}"
    )
    return await send_message(chat_id, text)


async def get_bot_info() -> dict | None:
    """Get bot info to verify token works."""
    if not BOT_TOKEN:
        return None
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(f"{BASE_URL}/getMe")
            if resp.status_code == 200:
                return resp.json().get("result")
    except Exception:
        pass
    return None
