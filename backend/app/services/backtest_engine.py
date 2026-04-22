"""
Backtest engine — replays DCA and Grid strategies against historical price series.
Returns a structured result: equity curve, trades log, P&L, drawdown, win rate, Sharpe.
"""
from __future__ import annotations

import math
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any

FEE_PCT = 0.004  # 0.4% round-trip approximation (Coinbase taker)


@dataclass
class BacktestResult:
    starting_capital: float
    ending_capital: float
    pnl: float
    pnl_pct: float
    max_drawdown_pct: float
    win_rate_pct: float
    sharpe_ratio: float
    total_trades: int
    equity_curve: list[dict[str, Any]] = field(default_factory=list)
    trades_log: list[dict[str, Any]] = field(default_factory=list)


def _sharpe(returns: list[float]) -> float:
    if len(returns) < 2:
        return 0.0
    mean = sum(returns) / len(returns)
    var = sum((r - mean) ** 2 for r in returns) / (len(returns) - 1)
    std = math.sqrt(var)
    if std == 0:
        return 0.0
    return (mean / std) * math.sqrt(365)


def _max_drawdown(equity: list[float]) -> float:
    peak = equity[0] if equity else 0.0
    max_dd = 0.0
    for v in equity:
        if v > peak:
            peak = v
        if peak > 0:
            dd = (peak - v) / peak
            if dd > max_dd:
                max_dd = dd
    return max_dd * 100


def run_dca_backtest(
    prices: list[dict[str, Any]],
    starting_capital: float,
    config: dict[str, Any],
) -> BacktestResult:
    """
    DCA: buy a fixed % of capital at a fixed hour interval.
    Optional take-profit closes the whole position.
    """
    interval_hours = int(config.get("interval_hours", 24))
    investment_amount = float(config.get("investment_amount", starting_capital * 0.02))
    stop_loss_pct = float(config.get("stop_loss_pct", 25))
    take_profit_pct = float(config.get("take_profit_pct", 40))
    max_total_investment = float(config.get("max_total_investment", starting_capital))

    cash = starting_capital
    base_qty = 0.0
    invested = 0.0
    avg_cost = 0.0

    last_buy_ts: int | None = None
    trades: list[dict[str, Any]] = []
    equity_curve: list[dict[str, Any]] = []
    wins = 0
    losses = 0

    for pt in prices:
        ts = pt["timestamp"]
        price = pt["price"]

        if last_buy_ts is None or (ts - last_buy_ts) >= interval_hours * 3600 * 1000:
            if cash >= investment_amount and invested + investment_amount <= max_total_investment:
                fee = investment_amount * FEE_PCT
                qty = (investment_amount - fee) / price
                new_cost = invested + investment_amount
                avg_cost = ((avg_cost * base_qty) + (price * qty)) / (base_qty + qty) if (base_qty + qty) > 0 else price
                base_qty += qty
                cash -= investment_amount
                invested = new_cost
                last_buy_ts = ts
                trades.append({
                    "ts": ts, "side": "buy", "price": price, "qty": qty,
                    "value": investment_amount, "reason": "interval",
                })

        if base_qty > 0 and avg_cost > 0:
            change_pct = (price - avg_cost) / avg_cost * 100
            if change_pct >= take_profit_pct:
                proceeds = base_qty * price * (1 - FEE_PCT)
                pnl_trade = proceeds - invested
                cash += proceeds
                trades.append({
                    "ts": ts, "side": "sell", "price": price, "qty": base_qty,
                    "value": proceeds, "reason": "take_profit", "pnl": pnl_trade,
                })
                if pnl_trade >= 0:
                    wins += 1
                else:
                    losses += 1
                base_qty = 0.0
                invested = 0.0
                avg_cost = 0.0
            elif change_pct <= -stop_loss_pct:
                proceeds = base_qty * price * (1 - FEE_PCT)
                pnl_trade = proceeds - invested
                cash += proceeds
                trades.append({
                    "ts": ts, "side": "sell", "price": price, "qty": base_qty,
                    "value": proceeds, "reason": "stop_loss", "pnl": pnl_trade,
                })
                losses += 1
                base_qty = 0.0
                invested = 0.0
                avg_cost = 0.0

        equity = cash + base_qty * price
        equity_curve.append({"ts": ts, "equity": round(equity, 2), "price": price})

    final_price = prices[-1]["price"] if prices else 0.0
    ending_capital = cash + base_qty * final_price
    return _build_result(starting_capital, ending_capital, equity_curve, trades, wins, losses)


def run_grid_backtest(
    prices: list[dict[str, Any]],
    starting_capital: float,
    config: dict[str, Any],
) -> BacktestResult:
    """
    Grid: split capital across N buy levels from lower_price to upper_price.
    Each level: buy when price crosses down through it, sell when price crosses up to next level.
    """
    lower = float(config["lower_price"])
    upper = float(config["upper_price"])
    num_grids = int(config.get("num_grids", 10))
    total_investment = float(config.get("total_investment", starting_capital))
    stop_loss_pct = float(config.get("stop_loss_pct", 15))

    if num_grids < 2 or upper <= lower:
        return BacktestResult(starting_capital, starting_capital, 0.0, 0.0, 0.0, 0.0, 0.0, 0)

    step = (upper - lower) / (num_grids - 1)
    levels = [lower + step * i for i in range(num_grids)]
    per_level_cash = total_investment / num_grids

    cash = starting_capital
    holdings: dict[int, float] = {}  # level_index -> qty held
    trades: list[dict[str, Any]] = []
    equity_curve: list[dict[str, Any]] = []
    wins = 0
    losses = 0

    prev_price = prices[0]["price"] if prices else 0.0
    entry_anchor_price = prev_price

    for pt in prices:
        ts = pt["timestamp"]
        price = pt["price"]

        for i, level in enumerate(levels):
            if prev_price > level >= price and i not in holdings and cash >= per_level_cash:
                fee = per_level_cash * FEE_PCT
                qty = (per_level_cash - fee) / price
                cash -= per_level_cash
                holdings[i] = qty
                trades.append({
                    "ts": ts, "side": "buy", "price": price, "qty": qty,
                    "value": per_level_cash, "reason": f"grid_level_{i}",
                })

            sell_trigger = levels[i + 1] if i + 1 < num_grids else level + step
            if prev_price < sell_trigger <= price and i in holdings:
                qty = holdings.pop(i)
                proceeds = qty * price * (1 - FEE_PCT)
                cost = per_level_cash
                pnl_trade = proceeds - cost
                cash += proceeds
                trades.append({
                    "ts": ts, "side": "sell", "price": price, "qty": qty,
                    "value": proceeds, "reason": f"grid_level_{i}", "pnl": pnl_trade,
                })
                if pnl_trade >= 0:
                    wins += 1
                else:
                    losses += 1

        if entry_anchor_price > 0:
            drop_pct = (entry_anchor_price - price) / entry_anchor_price * 100
            if drop_pct >= stop_loss_pct and holdings:
                for i, qty in list(holdings.items()):
                    proceeds = qty * price * (1 - FEE_PCT)
                    pnl_trade = proceeds - per_level_cash
                    cash += proceeds
                    trades.append({
                        "ts": ts, "side": "sell", "price": price, "qty": qty,
                        "value": proceeds, "reason": "stop_loss", "pnl": pnl_trade,
                    })
                    losses += 1
                holdings.clear()

        total_held_value = sum(qty * price for qty in holdings.values())
        equity = cash + total_held_value
        equity_curve.append({"ts": ts, "equity": round(equity, 2), "price": price})
        prev_price = price

    final_price = prices[-1]["price"] if prices else 0.0
    ending_capital = cash + sum(qty * final_price for qty in holdings.values())
    return _build_result(starting_capital, ending_capital, equity_curve, trades, wins, losses)


def _build_result(
    starting_capital: float,
    ending_capital: float,
    equity_curve: list[dict[str, Any]],
    trades: list[dict[str, Any]],
    wins: int,
    losses: int,
) -> BacktestResult:
    pnl = ending_capital - starting_capital
    pnl_pct = (pnl / starting_capital * 100) if starting_capital else 0.0

    equities = [p["equity"] for p in equity_curve]
    max_dd = _max_drawdown(equities)

    daily_returns: list[float] = []
    if len(equities) > 1:
        for i in range(1, len(equities)):
            prev = equities[i - 1]
            if prev > 0:
                daily_returns.append((equities[i] - prev) / prev)
    sharpe = _sharpe(daily_returns)

    total_closed = wins + losses
    win_rate = (wins / total_closed * 100) if total_closed > 0 else 0.0

    return BacktestResult(
        starting_capital=starting_capital,
        ending_capital=round(ending_capital, 2),
        pnl=round(pnl, 2),
        pnl_pct=round(pnl_pct, 4),
        max_drawdown_pct=round(max_dd, 4),
        win_rate_pct=round(win_rate, 4),
        sharpe_ratio=round(sharpe, 4),
        total_trades=len(trades),
        equity_curve=equity_curve,
        trades_log=trades,
    )
