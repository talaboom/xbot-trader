"""
Bot Personalities — Different aggression levels for trading strategies.
Each personality adjusts the strategy parameters automatically.
"""

PERSONALITIES = {
    "conservative": {
        "name": "Safe Guardian",
        "emoji": "🛡️",
        "color": "#22c55e",
        "gradient": "from-green-500 to-emerald-400",
        "description": "Slow and steady wins the race. Low risk, consistent returns.",
        "tagline": "Protects your capital first",
        "traits": ["Low risk", "Small positions", "Wide stop-loss", "Long intervals"],
        "risk_level": "low",
        "dca": {
            "interval_hours": 24,
            "investment_pct": 2,  # 2% of portfolio per trade
            "stop_loss_pct": 25,
            "take_profit_pct": 40,
            "max_investment_pct": 30,  # max 30% of portfolio
        },
        "grid": {
            "grid_spread_pct": 3,  # 3% between grid lines
            "num_grids": 5,
            "investment_pct": 20,
            "stop_loss_pct": 20,
        },
    },
    "moderate": {
        "name": "Smart Analyst",
        "emoji": "🧠",
        "color": "#3b82f6",
        "gradient": "from-blue-500 to-cyan-400",
        "description": "Balanced approach. Smart entries, calculated risks.",
        "tagline": "Data-driven decisions",
        "traits": ["Medium risk", "Balanced positions", "Tight stop-loss", "Regular intervals"],
        "risk_level": "medium",
        "dca": {
            "interval_hours": 8,
            "investment_pct": 5,
            "stop_loss_pct": 15,
            "take_profit_pct": 30,
            "max_investment_pct": 50,
        },
        "grid": {
            "grid_spread_pct": 2,
            "num_grids": 10,
            "investment_pct": 40,
            "stop_loss_pct": 15,
        },
    },
    "aggressive": {
        "name": "Alpha Wolf",
        "emoji": "🐺",
        "color": "#ef4444",
        "gradient": "from-red-500 to-orange-400",
        "description": "High risk, high reward. Goes all in on strong signals.",
        "tagline": "Fortune favors the bold",
        "traits": ["High risk", "Large positions", "Tight stop-loss", "Frequent trades"],
        "risk_level": "high",
        "dca": {
            "interval_hours": 2,
            "investment_pct": 10,
            "stop_loss_pct": 8,
            "take_profit_pct": 20,
            "max_investment_pct": 80,
        },
        "grid": {
            "grid_spread_pct": 1,
            "num_grids": 20,
            "investment_pct": 70,
            "stop_loss_pct": 10,
        },
    },
    "degen": {
        "name": "Moon Shot",
        "emoji": "🚀",
        "color": "#f59e0b",
        "gradient": "from-yellow-500 to-orange-400",
        "description": "YOLO mode. Maximum aggression. Not for the faint of heart.",
        "tagline": "To the moon or bust",
        "traits": ["Extreme risk", "Max positions", "Very tight stop-loss", "Hyper-frequent"],
        "risk_level": "extreme",
        "dca": {
            "interval_hours": 1,
            "investment_pct": 20,
            "stop_loss_pct": 5,
            "take_profit_pct": 15,
            "max_investment_pct": 95,
        },
        "grid": {
            "grid_spread_pct": 0.5,
            "num_grids": 30,
            "investment_pct": 90,
            "stop_loss_pct": 7,
        },
    },
}


def get_personality(name: str) -> dict | None:
    return PERSONALITIES.get(name)


def get_all_personalities() -> dict:
    return PERSONALITIES


def apply_personality_to_config(personality_name: str, strategy_type: str, portfolio_value: float, product_price: float) -> dict:
    """Generate a complete strategy config based on personality + portfolio."""
    p = PERSONALITIES.get(personality_name)
    if not p:
        return {}

    if strategy_type == "dca":
        settings = p["dca"]
        investment_amount = portfolio_value * (settings["investment_pct"] / 100)
        return {
            "investment_amount": round(investment_amount, 2),
            "interval_hours": settings["interval_hours"],
            "stop_loss_pct": settings["stop_loss_pct"],
            "take_profit_pct": settings["take_profit_pct"],
            "max_total_investment": round(portfolio_value * (settings["max_investment_pct"] / 100), 2),
            "personality": personality_name,
        }
    elif strategy_type == "grid":
        settings = p["grid"]
        spread = product_price * (settings["grid_spread_pct"] / 100)
        half_range = spread * settings["num_grids"] / 2
        return {
            "lower_price": round(product_price - half_range, 2),
            "upper_price": round(product_price + half_range, 2),
            "num_grids": settings["num_grids"],
            "total_investment": round(portfolio_value * (settings["investment_pct"] / 100), 2),
            "stop_loss_pct": settings["stop_loss_pct"],
            "personality": personality_name,
        }
    return {}
