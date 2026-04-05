import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.api.v1.stripe_webhook import router as webhook_router
from app.api.v1.websocket import router as ws_router
from app.config import settings

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


@app.get("/health")
async def health():
    return {"status": "ok", "app": "X Bot Trader"}
