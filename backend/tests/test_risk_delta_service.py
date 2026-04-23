"""Tests for risk_delta_service. The Anthropic call is monkeypatched so
these tests run offline and have deterministic output.
"""
from __future__ import annotations

import json

import pytest

from app.services import risk_delta_service as rds


async def _fake_call(system: str, user: str, response: str):
    return response


@pytest.mark.asyncio
async def test_compute_signals_happy_path(monkeypatch):
    fake_response = json.dumps(
        [
            {
                "signal_type": "added",
                "severity": "high",
                "novelty": 0.9,
                "summary": "New material customer concentration risk",
                "detail": "The Company added a new paragraph disclosing that 40% of revenue is now tied to a single customer. This is material.",
                "diff_excerpt": "40% of our revenue is now concentrated in a single customer...",
            }
        ]
    )

    async def _patched(system, user):
        return fake_response

    monkeypatch.setattr(rds, "_call_anthropic", _patched)

    result = await rds.compute_signals(
        ticker="NVDA",
        prior_form="10-Q",
        prior_date="2025-06-30",
        current_form="10-Q",
        current_date="2025-09-30",
        prior_text="x" * 5000,
        current_text="y" * 5000,
    )
    assert len(result) == 1
    assert result[0]["severity"] == "high"
    assert result[0]["signal_type"] == "added"
    assert 0 <= result[0]["novelty"] <= 1


@pytest.mark.asyncio
async def test_compute_signals_empty_texts_short_circuit(monkeypatch):
    """Empty inputs should not hit the API."""
    called = {"count": 0}

    async def _patched(system, user):
        called["count"] += 1
        return "[]"

    monkeypatch.setattr(rds, "_call_anthropic", _patched)

    out = await rds.compute_signals(
        ticker="X",
        prior_form="10-Q",
        prior_date="2025-06-30",
        current_form="10-Q",
        current_date="2025-09-30",
        prior_text="",
        current_text="some text",
    )
    assert out == []
    assert called["count"] == 0


@pytest.mark.asyncio
async def test_compute_signals_handles_markdown_fenced_response(monkeypatch):
    """Claude sometimes wraps JSON in ```json fences."""
    fenced = (
        "```json\n"
        "[{\"signal_type\": \"expanded\", \"severity\": \"medium\", \"novelty\": 0.5, "
        "\"summary\": \"Cyber risk section expanded\", \"detail\": \"Two new paragraphs added about ransomware exposure.\", "
        "\"diff_excerpt\": \"We now face heightened ransomware risk...\"}]\n"
        "```"
    )

    async def _patched(system, user):
        return fenced

    monkeypatch.setattr(rds, "_call_anthropic", _patched)

    out = await rds.compute_signals(
        ticker="X",
        prior_form="10-Q",
        prior_date="2025-06-30",
        current_form="10-Q",
        current_date="2025-09-30",
        prior_text="x" * 5000,
        current_text="y" * 5000,
    )
    assert len(out) == 1
    assert out[0]["signal_type"] == "expanded"


@pytest.mark.asyncio
async def test_compute_signals_rejects_invalid_severity(monkeypatch):
    async def _patched(system, user):
        return json.dumps(
            [
                {
                    "signal_type": "added",
                    "severity": "doom",  # invalid
                    "novelty": 0.9,
                    "summary": "x",
                    "detail": "y",
                    "diff_excerpt": "z",
                },
                {
                    "signal_type": "added",
                    "severity": "high",
                    "novelty": 0.9,
                    "summary": "valid signal",
                    "detail": "detail",
                    "diff_excerpt": "excerpt",
                },
            ]
        )

    monkeypatch.setattr(rds, "_call_anthropic", _patched)

    out = await rds.compute_signals(
        ticker="X",
        prior_form="10-Q",
        prior_date="2025-06-30",
        current_form="10-Q",
        current_date="2025-09-30",
        prior_text="a" * 5000,
        current_text="b" * 5000,
    )
    # Invalid one is dropped, valid one kept.
    assert len(out) == 1
    assert out[0]["summary"] == "valid signal"


@pytest.mark.asyncio
async def test_compute_signals_clamps_novelty_out_of_range(monkeypatch):
    async def _patched(system, user):
        return json.dumps(
            [
                {
                    "signal_type": "added",
                    "severity": "low",
                    "novelty": 4.7,  # out of range
                    "summary": "x",
                    "detail": "y",
                    "diff_excerpt": "z",
                }
            ]
        )

    monkeypatch.setattr(rds, "_call_anthropic", _patched)

    out = await rds.compute_signals(
        ticker="X",
        prior_form="10-Q",
        prior_date="2025-06-30",
        current_form="10-Q",
        current_date="2025-09-30",
        prior_text="a" * 5000,
        current_text="b" * 5000,
    )
    assert out[0]["novelty"] == 1.0


@pytest.mark.asyncio
async def test_compute_signals_returns_empty_on_api_failure(monkeypatch):
    async def _patched(system, user):
        raise RuntimeError("simulated API failure")

    monkeypatch.setattr(rds, "_call_anthropic", _patched)

    out = await rds.compute_signals(
        ticker="X",
        prior_form="10-Q",
        prior_date="2025-06-30",
        current_form="10-Q",
        current_date="2025-09-30",
        prior_text="a" * 5000,
        current_text="b" * 5000,
    )
    assert out == []


def test_parse_signals_response_empty_string():
    assert rds._parse_signals_response("") == []


def test_parse_signals_response_non_list_rejected():
    assert rds._parse_signals_response('{"not": "a list"}') == []
