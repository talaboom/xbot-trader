from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.dashboard import router as dashboard_router
from app.api.v1.exchange import router as exchange_router
from app.api.v1.leaderboard import router as leaderboard_router
from app.api.v1.strategies import router as strategies_router
from app.api.v1.trades import router as trades_router
from app.api.v1.ai_assistant import router as ai_router
from app.api.v1.payments import router as payments_router
from app.api.v1.referrals import router as referrals_router
from app.api.v1.admin import router as admin_router
from app.api.v1.oauth import router as oauth_router
from app.api.v1.telegram import router as telegram_router
from app.api.v1.backtest import router as backtest_router
from app.api.v1.api_plus import router as api_plus_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(exchange_router)
api_router.include_router(dashboard_router)
api_router.include_router(strategies_router)
api_router.include_router(trades_router)
api_router.include_router(ai_router)
api_router.include_router(leaderboard_router)
api_router.include_router(payments_router)
api_router.include_router(referrals_router)
api_router.include_router(admin_router)
api_router.include_router(oauth_router)
api_router.include_router(telegram_router)
api_router.include_router(backtest_router)
api_router.include_router(api_plus_router)


@api_router.get("/ping")
async def ping():
    return {"ping": "pong"}
