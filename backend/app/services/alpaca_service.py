import logging
from decimal import Decimal
from typing import Any

import httpx
from app.config import settings

logger = logging.getLogger(__name__)

class AlpacaService:
    """Service for interacting with Alpaca API for Stock Trading."""
    
    def __init__(self, api_key: str = None, api_secret: str = None, paper: bool = True):
        self.api_key = api_key or settings.ALPACA_API_KEY
        self.api_secret = api_secret or settings.ALPACA_SECRET_KEY
        self.base_url = "https://paper-api.alpaca.markets" if paper else "https://api.alpaca.markets"
        self.headers = {
            "APCA-API-KEY-ID": self.api_key,
            "APCA-API-SECRET-KEY": self.api_secret,
            "Accept": "application/json"
        }

    async def get_price(self, symbol: str) -> Decimal | None:
        """Fetch current stock price from Alpaca (Market Data v2)."""
        async with httpx.AsyncClient() as client:
            try:
                # Alpaca Data v2 requires a separate base URL
                data_url = "https://data.alpaca.markets/v2/stocks/bars/latest"
                params = {"symbols": symbol}
                resp = await client.get(data_url, params=params, headers=self.headers)
                if resp.status_code == 200:
                    data = resp.json().get("bars", {}).get(symbol, {})
                    return Decimal(str(data.get("c", 0)))
            except Exception as e:
                logger.error("Alpaca price fetch failed for %s: %s", symbol, e)
        return None

    async def place_market_order(self, symbol: str, qty: str, side: str) -> dict[str, Any]:
        """Place a market buy/sell order."""
        url = f"{self.base_url}/v2/orders"
        payload = {
            "symbol": symbol,
            "qty": qty,
            "side": side,
            "type": "market",
            "time_in_force": "day"
        }
        async with httpx.AsyncClient() as client:
            try:
                resp = await client.post(url, json=payload, headers=self.headers)
                return resp.json()
            except Exception as e:
                logger.error("Alpaca order failed for %s: %s", symbol, e)
                return {"error": str(e)}

    async def get_account(self) -> dict[str, Any]:
        """Get Alpaca account details (balance, etc)."""
        url = f"{self.base_url}/v2/account"
        async with httpx.AsyncClient() as client:
            try:
                resp = await client.get(url, headers=self.headers)
                return resp.json()
            except Exception as e:
                logger.error("Alpaca account fetch failed: %s", e)
                return {"error": str(e)}
