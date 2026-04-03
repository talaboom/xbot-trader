from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.dashboard import router as dashboard_router
from app.api.v1.exchange import router as exchange_router
from app.api.v1.strategies import router as strategies_router
from app.api.v1.trades import router as trades_router
from app.api.v1.ai_assistant import router as ai_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(exchange_router)
api_router.include_router(dashboard_router)
api_router.include_router(strategies_router)
api_router.include_router(trades_router)
api_router.include_router(ai_router)


@api_router.get("/ping")
async def ping():
    return {"ping": "pong"}
