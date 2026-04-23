"""Compute material risk-factor deltas between two SEC filings using Claude.

The public entry point is `compute_signals(prior_text, current_text, ticker,
prior_form, current_form, prior_date, current_date)` which returns a list
of dicts ready to be persisted as SECRiskSignal rows.

External I/O is isolated in `_call_anthropic` so tests can monkeypatch it.
"""
from __future__ import annotations

import json
import logging
import re
from datetime import datetime

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

_ANTHROPIC_ENDPOINT = "https://api.anthropic.com/v1/messages"
_ANTHROPIC_VERSION = "2023-06-01"

_VALID_SIGNAL_TYPES = {"added", "expanded", "removed"}
_VALID_SEVERITIES = {"low", "medium", "high", "critical"}

# Clamp inputs — anything beyond this wastes tokens without improving signal.
_MAX_SECTION_CHARS = 30_000

_SYSTEM_PROMPT = (
    "You are a financial filings analyst. You compare two Risk Factors sections "
    "from consecutive SEC filings by the same company and identify material "
    "language changes. You do NOT editorialize. You report what is demonstrably "
    "different."
)


def _build_user_prompt(
    ticker: str,
    prior_form: str,
    prior_date: str,
    current_form: str,
    current_date: str,
    prior_text: str,
    current_text: str,
) -> str:
    return (
        f"Company: {ticker}\n"
        f"Prior filing: {prior_form} filed {prior_date}\n"
        f"Current filing: {current_form} filed {current_date}\n\n"
        "=== PRIOR RISK FACTORS ===\n"
        f"{prior_text[:_MAX_SECTION_CHARS]}\n\n"
        "=== CURRENT RISK FACTORS ===\n"
        f"{current_text[:_MAX_SECTION_CHARS]}\n\n"
        "Return a JSON array. Each element is a single material change:\n\n"
        "[{\n"
        '  "signal_type": "added" | "expanded" | "removed",\n'
        '  "severity": "low" | "medium" | "high" | "critical",\n'
        '  "novelty": 0.0-1.0,\n'
        '  "summary": "one-line headline, under 100 chars",\n'
        '  "detail": "2-3 paragraphs explaining what changed and why it matters",\n'
        '  "diff_excerpt": "the actual new/changed text, verbatim, max 500 chars"\n'
        "}]\n\n"
        "Severity rubric:\n"
        "- critical: regulatory investigations, litigation with stated damages, "
        "going-concern language, guidance withdrawal\n"
        "- high: new material customer concentration, supply chain disruption "
        "named, geographic ban, new legal proceedings\n"
        "- medium: expanded competitive pressure language, new minor regulation "
        "cited, expanded cyber/privacy risk\n"
        "- low: boilerplate updates, date rolls, cosmetic wording changes\n\n"
        "Ignore boilerplate (\"forward-looking statements\", \"cautionary language\") "
        "and cosmetic edits.\n"
        "If no material changes, return []. Return ONLY the JSON array, no prose.\n"
    )


async def _call_anthropic(system: str, user: str) -> str:
    """Single-purpose Anthropic call. Raises on non-2xx.

    Honors ANTIGRAVITY_* if configured (matches the provider chain added in
    PR #3). Falls back to direct Anthropic otherwise.
    """
    if settings.ANTIGRAVITY_BASE_URL and settings.ANTIGRAVITY_API_KEY:
        return await _call_openai_compatible(
            base_url=settings.ANTIGRAVITY_BASE_URL.rstrip("/"),
            api_key=settings.ANTIGRAVITY_API_KEY,
            model=settings.ANTIGRAVITY_MODEL or settings.SEC_RADAR_CLAUDE_MODEL,
            system=system,
            user=user,
        )
    if not settings.ANTHROPIC_API_KEY:
        raise RuntimeError(
            "ANTHROPIC_API_KEY is empty. Set it in the environment or configure "
            "ANTIGRAVITY_BASE_URL + ANTIGRAVITY_API_KEY to proxy."
        )
    headers = {
        "x-api-key": settings.ANTHROPIC_API_KEY,
        "anthropic-version": _ANTHROPIC_VERSION,
        "content-type": "application/json",
    }
    body = {
        "model": settings.SEC_RADAR_CLAUDE_MODEL,
        "max_tokens": 2048,
        "system": system,
        "messages": [{"role": "user", "content": user}],
    }
    async with httpx.AsyncClient(timeout=120.0) as client:
        resp = await client.post(_ANTHROPIC_ENDPOINT, headers=headers, json=body)
        resp.raise_for_status()
        data = resp.json()
    # Response: {"content": [{"type": "text", "text": "..."}], ...}
    blocks = data.get("content") or []
    for b in blocks:
        if b.get("type") == "text":
            return b.get("text", "")
    return ""


async def _call_openai_compatible(
    *, base_url: str, api_key: str, model: str, system: str, user: str
) -> str:
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    body = {
        "model": model,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        "max_tokens": 2048,
    }
    async with httpx.AsyncClient(timeout=120.0) as client:
        resp = await client.post(f"{base_url}/chat/completions", headers=headers, json=body)
        resp.raise_for_status()
        data = resp.json()
    choices = data.get("choices") or []
    if not choices:
        return ""
    return choices[0].get("message", {}).get("content") or ""


_JSON_ARRAY_RE = re.compile(r"\[\s*(?:\{.*?\}\s*,?\s*)*\]", re.DOTALL)


def _parse_signals_response(raw: str) -> list[dict]:
    """Claude usually returns a clean JSON array, but sometimes wraps it in
    prose or markdown. Extract the first JSON array and parse defensively.
    """
    if not raw:
        return []
    raw = raw.strip()
    # Strip common markdown fencing.
    if raw.startswith("```"):
        raw = raw.strip("`").lstrip("json").strip()
    # Try direct parse first.
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        match = _JSON_ARRAY_RE.search(raw)
        if not match:
            logger.warning("No JSON array in model response: %r", raw[:500])
            return []
        try:
            parsed = json.loads(match.group(0))
        except json.JSONDecodeError as e:
            logger.warning("JSON decode failed: %s — raw: %r", e, raw[:500])
            return []
    if not isinstance(parsed, list):
        logger.warning("Model returned non-list response: %r", raw[:500])
        return []
    return parsed


def _validate_signal(s: dict) -> dict | None:
    """Return a cleaned signal or None if invalid."""
    if not isinstance(s, dict):
        return None
    st = str(s.get("signal_type", "")).lower()
    sev = str(s.get("severity", "")).lower()
    if st not in _VALID_SIGNAL_TYPES or sev not in _VALID_SEVERITIES:
        return None
    summary = str(s.get("summary", "")).strip()
    detail = str(s.get("detail", "")).strip()
    excerpt = str(s.get("diff_excerpt", "")).strip()
    if not summary or not detail or not excerpt:
        return None
    try:
        novelty = float(s.get("novelty", 0.0))
    except (TypeError, ValueError):
        novelty = 0.0
    novelty = max(0.0, min(1.0, novelty))
    return {
        "signal_type": st,
        "severity": sev,
        "novelty": round(novelty, 3),
        "summary": summary[:250],
        "detail": detail[:5000],
        "diff_excerpt": excerpt[:500],
    }


async def compute_signals(
    *,
    ticker: str,
    prior_form: str,
    prior_date: str | datetime,
    current_form: str,
    current_date: str | datetime,
    prior_text: str,
    current_text: str,
) -> list[dict]:
    """Run the Claude-powered Risk Factors diff.

    Returns a list of validated signal dicts, ready to persist. On any
    failure (API down, malformed response, etc.) returns []. Caller is
    responsible for scheduling retries at the task layer.
    """
    if not prior_text or not current_text:
        return []

    def _to_str(d):
        return d.strftime("%Y-%m-%d") if isinstance(d, datetime) else str(d)

    user_prompt = _build_user_prompt(
        ticker=ticker,
        prior_form=prior_form,
        prior_date=_to_str(prior_date),
        current_form=current_form,
        current_date=_to_str(current_date),
        prior_text=prior_text,
        current_text=current_text,
    )

    try:
        raw = await _call_anthropic(_SYSTEM_PROMPT, user_prompt)
    except Exception as e:
        logger.exception("Anthropic call failed for ticker=%s: %s", ticker, e)
        return []

    parsed = _parse_signals_response(raw)
    validated = [v for v in (_validate_signal(s) for s in parsed) if v]
    return validated
