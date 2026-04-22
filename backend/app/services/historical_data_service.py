"""
Historical OHLC data fetcher for backtesting.
Uses CoinGecko public API — free, no auth, covers years of daily/hourly data.
Product ids use Coinbase convention (e.g. BTC-USD) and map to CoinGecko coin ids.
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any

import httpx

logger = logging.getLogger(__name__)

COINGECKO_BASE = "https://api.coingecko.com/api/v3"

# Coinbase product_id -> CoinGecko coin id
COIN_MAP = {
    "BTC": "bitcoin",
    "ETH": "ethereum",
    "SOL": "solana",
    "ADA": "cardano",
    "XRP": "ripple",
    "DOGE": "dogecoin",
    "AVAX": "avalanche-2",
    "DOT": "polkadot",
    "LINK": "chainlink",
    "MATIC": "matic-network",
    "LTC": "litecoin",
    "BCH": "bitcoin-cash",
    "UNI": "uniswap",
    "ATOM": "cosmos",
    "ARB": "arbitrum",
    "OP": "optimism",
    "NEAR": "near",
    "APT": "aptos",
    "SUI": "sui",
    "SHIB": "shiba-inu",
}


def product_to_coin_id(product_id: str) -> str | None:
    base = product_id.split("-")[0].upper()
    return COIN_MAP.get(base)


def _vs_currency(product_id: str) -> str:
    parts = product_id.split("-")
    return parts[1].lower() if len(parts) > 1 else "usd"


async def fetch_ohlc(product_id: str, days: int) -> list[dict[str, Any]]:
    """
    Return list of { timestamp (epoch ms), open, high, low, close } points.
    CoinGecko's /coins/{id}/ohlc returns [ts, o, h, l, c] arrays.
    Granularity is automatic: 1-2 days = 30m, <=30 = 4h, >30 = 4d.
    For finer-grained simulation we also pull /market_chart for close prices.
    """
    coin_id = product_to_coin_id(product_id)
    if not coin_id:
        raise ValueError(f"Unsupported product for backtest: {product_id}")

    vs = _vs_currency(product_id)
    async with httpx.AsyncClient(timeout=30.0) as client:
        ohlc_resp = await client.get(
            f"{COINGECKO_BASE}/coins/{coin_id}/ohlc",
            params={"vs_currency": vs, "days": days},
        )
        ohlc_resp.raise_for_status()
        raw = ohlc_resp.json()

    candles = []
    for row in raw:
        ts_ms, o, h, l, c = row
        candles.append({
            "timestamp": ts_ms,
            "datetime": datetime.fromtimestamp(ts_ms / 1000, tz=timezone.utc),
            "open": float(o),
            "high": float(h),
            "low": float(l),
            "close": float(c),
        })
    return candles


async def fetch_price_series(product_id: str, days: int) -> list[dict[str, Any]]:
    """
    Finer-grained price series via /market_chart — gives hourly for <=90 days,
    daily for >90. Returns [{ timestamp, datetime, price }].
    """
    coin_id = product_to_coin_id(product_id)
    if not coin_id:
        raise ValueError(f"Unsupported product for backtest: {product_id}")

    vs = _vs_currency(product_id)
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.get(
            f"{COINGECKO_BASE}/coins/{coin_id}/market_chart",
            params={"vs_currency": vs, "days": days},
        )
        resp.raise_for_status()
        data = resp.json()

    series = []
    for ts_ms, price in data.get("prices", []):
        series.append({
            "timestamp": ts_ms,
            "datetime": datetime.fromtimestamp(ts_ms / 1000, tz=timezone.utc),
            "price": float(price),
        })
    return series


SUPPORTED_PRODUCTS = sorted(f"{k}-USD" for k in COIN_MAP)
SUPPORTED_PERIODS = [30, 90, 180, 365, 730, 1825]  # 30d, 90d, 6mo, 1y, 2y, 5y
