"""Tests for edgar_service. No network — everything is fed HTML fixtures."""
from __future__ import annotations

import pytest

from app.services.edgar_service import extract_risk_factors


def _wrap(body: str) -> str:
    return f"<html><body>{body}</body></html>"


def test_extract_risk_factors_happy_path():
    html = _wrap(
        "<p>Some preamble.</p>"
        "<h2>Item 1A. Risk Factors</h2>"
        "<p>" + ("The Company faces substantial supply-chain concentration. " * 30) + "</p>"
        "<p>" + ("We depend on a single foundry in Taiwan for all wafer capacity. " * 20) + "</p>"
        "<h2>Item 1B. Unresolved Staff Comments</h2>"
        "<p>None.</p>"
    )
    out = extract_risk_factors(html)
    assert out is not None
    assert "supply-chain concentration" in out
    assert "Unresolved Staff Comments" not in out


def test_extract_risk_factors_handles_toc_and_real_section():
    """When the TOC lists Item 1A and the real section appears later, we
    should pick the later (real) occurrence."""
    toc = "<p>Table of Contents</p><p>Item 1A. Risk Factors........5</p>"
    real = (
        "<h2>Item 1A. Risk Factors</h2>"
        "<p>" + ("Material risk language goes here. " * 50) + "</p>"
        "<h2>Item 2. Properties</h2>"
    )
    html = _wrap(toc + "<p>intervening content</p>" + real)
    out = extract_risk_factors(html)
    assert out is not None
    assert "Material risk language" in out
    # Should not bleed into Properties.
    assert "Properties" not in out


def test_extract_risk_factors_returns_none_when_section_missing():
    html = _wrap("<p>Just some press release. Nothing remotely like a 10-K.</p>")
    assert extract_risk_factors(html) is None


def test_extract_risk_factors_returns_none_on_tiny_section():
    """A stub section shorter than the 500-char floor is treated as
    'extraction failed' — don't pretend we found content."""
    html = _wrap(
        "<h2>Item 1A. Risk Factors</h2><p>See 2024 10-K.</p><h2>Item 2.</h2>"
    )
    assert extract_risk_factors(html) is None


def test_extract_risk_factors_normalizes_nbsp_and_whitespace():
    body = (
        "<h2>Item 1A.  Risk Factors</h2>"
        "<p>" + ("Our business is exposed to commodity price shocks. " * 25) + "</p>"
        "<h2>Item 1B.</h2>"
    )
    out = extract_risk_factors(_wrap(body))
    assert out is not None
    assert "commodity price shocks" in out


def test_extract_risk_factors_empty_input():
    assert extract_risk_factors("") is None
