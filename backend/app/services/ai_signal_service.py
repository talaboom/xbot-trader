"""
AI Signal Service — queries a local Ollama server for a BUY/HOLD/SELL signal.

The endpoint is Ollama-compatible (`POST /api/generate`), so any drop-in
replacement (Ollama, llama.cpp server with the Ollama shim, hosted variants)
works by just changing OLLAMA_BASE_URL.

Failure mode is intentional: any error returns HOLD with confidence 0 so the
caller can fall back to its default behavior. We never block a trade on a
flaky LLM.
"""

import json
import logging
from dataclasses import dataclass
from decimal import Decimal
from typing import Literal, Sequence

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

Action = Literal["BUY", "HOLD", "SELL"]


@dataclass(frozen=True)
class Signal:
    action: Action
    confidence: float
    reason: str

    @classmethod
    def hold(cls, reason: str) -> "Signal":
        return cls(action="HOLD", confidence=0.0, reason=reason)


SYSTEM_PROMPT = (
    "You are a cautious crypto/stock trading assistant. Given recent price data, "
    "decide whether the next DCA buy should fire NOW or wait. Reply ONLY with a "
    "JSON object of the form "
    '{"action": "BUY"|"HOLD"|"SELL", "confidence": 0.0-1.0, "reason": "<short>"}. '
    "Use BUY only when the recent trend or dip looks favorable for accumulation. "
    "Use HOLD when uncertain. SELL is rarely appropriate for a DCA bot. "
    "Never include text outside the JSON."
)


def _build_user_prompt(
    product_id: str,
    current_price: float,
    recent_prices: Sequence[float],
) -> str:
    if not recent_prices:
        prices_blob = "(no history available)"
    else:
        prices_blob = ", ".join(f"{p:.4f}" for p in recent_prices)
    return (
        f"Asset: {product_id}\n"
        f"Current price: {current_price:.4f}\n"
        f"Recent prices (oldest -> newest): {prices_blob}\n"
        "Respond with the JSON object only."
    )


def _parse_response(raw: str) -> Signal:
    """Extract the JSON block from the model output. Models sometimes add prose."""
    raw = raw.strip()
    start = raw.find("{")
    end = raw.rfind("}")
    if start == -1 or end == -1 or end <= start:
        return Signal.hold(f"unparseable: {raw[:80]}")
    try:
        data = json.loads(raw[start : end + 1])
    except json.JSONDecodeError as e:
        return Signal.hold(f"json error: {e}")

    action = str(data.get("action", "HOLD")).upper()
    if action not in ("BUY", "HOLD", "SELL"):
        return Signal.hold(f"invalid action: {action}")

    try:
        confidence = float(data.get("confidence", 0))
    except (TypeError, ValueError):
        confidence = 0.0
    confidence = max(0.0, min(1.0, confidence))

    reason = str(data.get("reason", ""))[:200]
    return Signal(action=action, confidence=confidence, reason=reason)  # type: ignore[arg-type]


def get_signal_sync(
    product_id: str,
    current_price: float | Decimal,
    recent_prices: Sequence[float] | None = None,
) -> Signal:
    """Sync (Celery-friendly) call. Returns HOLD on any failure."""
    payload = {
        "model": settings.OLLAMA_MODEL,
        "system": SYSTEM_PROMPT,
        "prompt": _build_user_prompt(
            product_id, float(current_price), recent_prices or []
        ),
        "stream": False,
        "options": {"temperature": 0.2},
    }
    url = settings.OLLAMA_BASE_URL.rstrip("/") + "/api/generate"
    try:
        with httpx.Client(timeout=settings.OLLAMA_TIMEOUT_SECONDS) as client:
            resp = client.post(url, json=payload)
            resp.raise_for_status()
            body = resp.json()
    except httpx.HTTPError as e:
        logger.warning("AI signal call failed for %s: %s", product_id, e)
        return Signal.hold(f"http error: {e}")
    except ValueError as e:
        logger.warning("AI signal returned non-JSON envelope for %s: %s", product_id, e)
        return Signal.hold(f"envelope error: {e}")

    return _parse_response(body.get("response", ""))
