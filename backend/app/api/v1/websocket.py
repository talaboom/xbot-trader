"""WebSocket endpoint for live price streaming to frontend clients."""

import asyncio
import json
import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.services.coinbase_service import get_public_price

router = APIRouter()
logger = logging.getLogger(__name__)

PRODUCTS = ["BTC-USD", "ETH-USD", "SOL-USD", "DOGE-USD", "ADA-USD", "XRP-USD", "AVAX-USD", "LINK-USD"]


class PriceBroadcaster:
    """Fetches prices once and broadcasts to all connected WebSocket clients."""

    def __init__(self):
        self.connections: list[WebSocket] = []
        self._task: asyncio.Task | None = None

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.connections.append(ws)
        if self._task is None or self._task.done():
            self._task = asyncio.create_task(self._broadcast_loop())

    def disconnect(self, ws: WebSocket):
        if ws in self.connections:
            self.connections.remove(ws)

    async def _broadcast_loop(self):
        while self.connections:
            try:
                prices = {}
                for pid in PRODUCTS:
                    price = await get_public_price(pid)
                    if price:
                        prices[pid] = price

                message = json.dumps({"type": "prices", "data": prices})
                dead = []
                for ws in self.connections:
                    try:
                        await ws.send_text(message)
                    except Exception:
                        dead.append(ws)
                for ws in dead:
                    self.disconnect(ws)
            except Exception as e:
                logger.warning("Broadcast error: %s", e)

            await asyncio.sleep(5)


broadcaster = PriceBroadcaster()


@router.websocket("/ws/prices")
async def ws_prices(websocket: WebSocket):
    await broadcaster.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        broadcaster.disconnect(websocket)
