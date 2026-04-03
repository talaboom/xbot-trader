import uuid
from decimal import Decimal

import httpx

from app.services.crypto_service import decrypt_value


class CoinbaseService:
    def __init__(self, api_key: str, api_secret: str, sandbox: bool = False):
        self.api_key = api_key
        self.api_secret = api_secret
        if sandbox:
            self.base_url = "https://api-sandbox.coinbase.com"
        else:
            self.base_url = "https://api.coinbase.com"

    @classmethod
    def from_encrypted(cls, exchange_key, user_id: str, sandbox: bool = False):
        api_key = decrypt_value(
            exchange_key.api_key_encrypted,
            exchange_key.key_nonce,
            exchange_key.key_tag,
            user_id,
        )
        api_secret = decrypt_value(
            exchange_key.api_secret_encrypted,
            exchange_key.secret_nonce,
            exchange_key.secret_tag,
            user_id,
        )
        return cls(api_key, api_secret, sandbox)

    async def get_accounts(self) -> list[dict]:
        """Get account balances — returns list of non-zero balances."""
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(
                    f"{self.base_url}/api/v3/brokerage/accounts",
                    headers=self._headers(),
                    timeout=10.0,
                )
                if resp.status_code == 200:
                    data = resp.json()
                    accounts = []
                    for acc in data.get("accounts", []):
                        avail = acc.get("available_balance", {})
                        val = Decimal(avail.get("value", "0"))
                        if val > 0:
                            accounts.append({
                                "currency": avail.get("currency", ""),
                                "balance": str(val),
                                "name": acc.get("name", ""),
                            })
                    return accounts
                return []
        except Exception:
            return []

    async def get_product(self, product_id: str) -> dict | None:
        """Get product info including current price."""
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(
                    f"{self.base_url}/api/v3/brokerage/products/{product_id}",
                    headers=self._headers(),
                    timeout=10.0,
                )
                if resp.status_code == 200:
                    return resp.json()
                return None
        except Exception:
            return None

    async def get_candles(self, product_id: str, granularity: str = "ONE_HOUR", limit: int = 100) -> list[dict]:
        """Get OHLCV candles."""
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(
                    f"{self.base_url}/api/v3/brokerage/products/{product_id}/candles",
                    params={"granularity": granularity, "limit": limit},
                    headers=self._headers(),
                    timeout=10.0,
                )
                if resp.status_code == 200:
                    return resp.json().get("candles", [])
                return []
        except Exception:
            return []

    async def place_market_buy(self, product_id: str, quote_size: str) -> dict | None:
        """Place a market buy order."""
        order_id = str(uuid.uuid4())
        body = {
            "client_order_id": order_id,
            "product_id": product_id,
            "side": "BUY",
            "order_configuration": {
                "market_market_ioc": {"quote_size": quote_size}
            },
        }
        return await self._create_order(body)

    async def place_market_sell(self, product_id: str, base_size: str) -> dict | None:
        """Place a market sell order."""
        order_id = str(uuid.uuid4())
        body = {
            "client_order_id": order_id,
            "product_id": product_id,
            "side": "SELL",
            "order_configuration": {
                "market_market_ioc": {"base_size": base_size}
            },
        }
        return await self._create_order(body)

    async def place_limit_buy(self, product_id: str, base_size: str, limit_price: str) -> dict | None:
        order_id = str(uuid.uuid4())
        body = {
            "client_order_id": order_id,
            "product_id": product_id,
            "side": "BUY",
            "order_configuration": {
                "limit_limit_gtc": {
                    "base_size": base_size,
                    "limit_price": limit_price,
                }
            },
        }
        return await self._create_order(body)

    async def place_limit_sell(self, product_id: str, base_size: str, limit_price: str) -> dict | None:
        order_id = str(uuid.uuid4())
        body = {
            "client_order_id": order_id,
            "product_id": product_id,
            "side": "SELL",
            "order_configuration": {
                "limit_limit_gtc": {
                    "base_size": base_size,
                    "limit_price": limit_price,
                }
            },
        }
        return await self._create_order(body)

    async def _create_order(self, body: dict) -> dict | None:
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.post(
                    f"{self.base_url}/api/v3/brokerage/orders",
                    json=body,
                    headers=self._headers(),
                    timeout=10.0,
                )
                if resp.status_code in (200, 201):
                    return resp.json()
                return {"error": resp.text, "status": resp.status_code}
        except Exception as e:
            return {"error": str(e)}

    def _headers(self) -> dict:
        return {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}",
        }


async def get_public_price(product_id: str) -> float | None:
    """Get current price without auth (public endpoint)."""
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"https://api.coinbase.com/api/v3/brokerage/market/products/{product_id}",
                timeout=10.0,
            )
            if resp.status_code == 200:
                return float(resp.json().get("price", 0))
            # Fallback to v2 API
            pair = product_id.replace("-", "-")
            resp = await client.get(
                f"https://api.coinbase.com/v2/prices/{product_id}/spot",
                timeout=10.0,
            )
            if resp.status_code == 200:
                return float(resp.json().get("data", {}).get("amount", 0))
    except Exception:
        pass
    return None
