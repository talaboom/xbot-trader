import os

import httpx
from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.api.deps import get_current_user
from app.models.user import User
from app.strategies.bot_personalities import get_all_personalities, apply_personality_to_config
from app.services.coinbase_service import get_public_price

router = APIRouter(prefix="/ai", tags=["ai"])

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")

SYSTEM_PROMPT = """You are an AI trading assistant for X Bot Trader, a crypto trading platform.

Your job is to help users:
- Choose trading strategies (DCA, Grid Trading)
- Pick bot personalities (Conservative/Safe Guardian, Moderate/Smart Analyst, Aggressive/Alpha Wolf, Degen/Moon Shot)
- Understand crypto markets and trading concepts
- Set up and manage their trading bots

Key facts about the platform:
- Paper trading starts with $100K virtual money using real Coinbase prices
- DCA (Dollar Cost Averaging): buys a fixed amount at regular intervals
- Grid Trading: places buy/sell orders at price levels in a range
- 4 bot personalities with different risk levels:
  - Conservative: trades 1x/day, 2% per trade, 25% stop-loss
  - Moderate: trades every 8h, 5% per trade, 15% stop-loss
  - Aggressive: trades every 2h, 10% per trade, 8% stop-loss
  - Degen: trades every 1h, 20% per trade, 5% stop-loss
- Users connect their own Coinbase API keys (no withdrawal permissions)
- $20/month Trader plan, $50/month Pro plan, 7-day free trial

Keep responses concise (2-4 paragraphs max). Use markdown bold for emphasis.
Always end with 2-4 actionable suggestions the user can click.
Format suggestions as a JSON array in your response like: SUGGESTIONS: ["suggestion 1", "suggestion 2"]"""


class HistoryMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class ChatMessage(BaseModel):
    message: str
    context: str | None = None
    history: list[HistoryMessage] | None = None


class PersonalityConfigRequest(BaseModel):
    personality: str
    strategy_type: str
    portfolio_value: float
    product_id: str


@router.get("/personalities")
async def list_personalities():
    return get_all_personalities()


@router.post("/personality-config")
async def get_personality_config(data: PersonalityConfigRequest, user: User = Depends(get_current_user)):
    price = await get_public_price(data.product_id)
    if not price:
        price = 50000
    config = apply_personality_to_config(
        data.personality, data.strategy_type, data.portfolio_value, price
    )
    return {"config": config, "current_price": price}


@router.post("/chat")
async def chat(msg: ChatMessage, user: User = Depends(get_current_user)):
    """AI assistant chat — uses Claude API if available, falls back to rule-based."""
    message = msg.message

    # Try Claude API first
    if ANTHROPIC_API_KEY:
        result = await _claude_chat(message, user.username, msg.history)
        if result:
            return result

    # Fallback to rule-based responses
    return await _rule_based_chat(message, user)


async def _claude_chat(message: str, username: str, history: list | None = None) -> dict | None:
    """Send message to Claude API with conversation history."""
    try:
        # Fetch live prices for context
        btc = await get_public_price("BTC-USD")
        eth = await get_public_price("ETH-USD")
        sol = await get_public_price("SOL-USD")

        price_context = ""
        if btc:
            price_context = f"\n\nCurrent prices: BTC=${btc:,.0f}, ETH=${eth:,.0f}, SOL=${sol:,.0f}"

        # Build messages array with conversation history
        messages = []
        if history:
            # Include up to last 10 exchanges for context (avoid token overflow)
            for h in history[-20:]:
                messages.append({"role": h.role, "content": h.content})
        # Add current user message
        messages.append({"role": "user", "content": f"User '{username}' says: {message}"})

        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": ANTHROPIC_API_KEY,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": "claude-haiku-4-5-20251001",
                    "max_tokens": 500,
                    "system": SYSTEM_PROMPT + price_context,
                    "messages": messages,
                },
            )

            if resp.status_code == 200:
                data = resp.json()
                text = data["content"][0]["text"]

                # Parse suggestions from response
                suggestions = ["What strategy should I use?", "Show current prices", "Explain DCA trading"]
                if "SUGGESTIONS:" in text:
                    parts = text.split("SUGGESTIONS:")
                    text = parts[0].strip()
                    try:
                        import json
                        suggestions = json.loads(parts[1].strip())
                    except Exception:
                        pass

                return {"response": text, "suggestions": suggestions}
    except Exception:
        pass
    return None


async def _rule_based_chat(msg: ChatMessage, user: User) -> dict:
    """Fallback rule-based responses when Claude API is unavailable."""
    message = msg.message.lower()

    if any(w in message for w in ["hello", "hi", "hey", "start"]):
        return {
            "response": f"Hey {user.username}! I'm your X Bot trading assistant. I can help you pick a strategy, explain how trading works, or answer questions about crypto. What would you like to know?",
            "suggestions": ["What strategy should I use?", "Explain DCA trading", "How does Grid trading work?", "Show me the market"]
        }

    if any(w in message for w in ["dca", "dollar cost", "averaging"]):
        return {
            "response": "**DCA (Dollar Cost Averaging)** is the simplest and most popular strategy.\n\nHow it works: You invest a fixed amount at regular intervals, regardless of price. If BTC is $70K today and $60K next week, you buy both times.\n\nWhy it works: You get a better average price over time because you buy more when it's cheap and less when it's expensive.\n\n**My recommendation:** Start with the Conservative personality — it DCA's once per day with 2% of your portfolio.",
            "suggestions": ["Set up a DCA bot", "What about Grid trading?", "Which coin should I DCA?"]
        }

    if any(w in message for w in ["grid", "range", "sideways"]):
        return {
            "response": "**Grid Trading** is perfect for sideways/ranging markets.\n\nHow it works: You set a price range (e.g., BTC between $60K-$70K). The bot places buy orders at the bottom and sell orders at the top. Every time price bounces between levels, you profit.\n\nBest for: Markets that aren't trending strongly up or down.\n\n**Warning:** If price breaks below your range, you could be holding at a loss. Always set a stop-loss!",
            "suggestions": ["Set up a Grid bot", "What's the best range for BTC?", "How much should I invest?"]
        }

    if any(w in message for w in ["aggressive", "risky", "yolo", "moon", "degen"]):
        return {
            "response": "**Alpha Wolf** (Aggressive) or **Moon Shot** (DEGEN) modes trade frequently with larger positions.\n\nAggressive: Trades every 2 hours, uses 10% of portfolio per trade, tight 8% stop-loss.\nDegen: Trades every hour, uses 20% per trade, 5% stop-loss.\n\n**Higher risk = higher potential losses too.** I recommend starting with paper trading to test before going live.",
            "suggestions": ["Start aggressive paper trading", "What's the safest option?", "Show me the leaderboard"]
        }

    if any(w in message for w in ["safe", "conservative", "beginner", "new"]):
        return {
            "response": "**Safe Guardian** (Conservative) is perfect for beginners!\n\nIt trades once per day, uses only 2% of your portfolio per trade, and has a wide 25% stop-loss so it doesn't panic-sell on normal dips.\n\nMaximum investment: 30% of your portfolio — keeping 70% in cash.\n\n**Step 1:** Go to paper trading mode first.\n**Step 2:** Create a DCA bot with Conservative personality.\n**Step 3:** Watch it trade for a week.\n**Step 4:** Go live when you're confident.",
            "suggestions": ["Create a Conservative DCA bot", "How does paper trading work?", "What is stop-loss?"]
        }

    if any(w in message for w in ["stop loss", "stop-loss", "stoploss"]):
        return {
            "response": "**Stop-Loss** is your safety net. It automatically sells your position if the price drops below a certain percentage.\n\nExample: You buy BTC at $65,000 with a 10% stop-loss. If BTC drops to $58,500, the bot automatically sells to prevent further losses.\n\n**Conservative:** 25% stop-loss (rarely triggers)\n**Moderate:** 15% stop-loss (balanced)\n**Aggressive:** 8% stop-loss (triggers often)\n**Degen:** 5% stop-loss (very tight)",
            "suggestions": ["What's take-profit?", "Set up a bot with stop-loss", "Show me strategies"]
        }

    if any(w in message for w in ["paper", "test", "practice", "fake money"]):
        return {
            "response": "**Paper Trading** lets you practice with $100,000 in virtual money using real market prices.\n\nEverything works exactly like live trading — the bot buys and sells, tracks your P&L, shows your portfolio — but no real money is at risk.\n\nI always recommend testing a strategy in paper mode for at least 1-2 weeks before going live.\n\nYou're currently in **paper mode** by default!",
            "suggestions": ["Create my first bot", "Switch to live trading", "How do I connect Coinbase?"]
        }

    if any(w in message for w in ["bitcoin", "btc", "ethereum", "eth", "solana", "sol", "price"]):
        btc = await get_public_price("BTC-USD")
        eth = await get_public_price("ETH-USD")
        sol = await get_public_price("SOL-USD")
        return {
            "response": f"**Current Prices:**\n- Bitcoin: ${btc:,.2f}\n- Ethereum: ${eth:,.2f}\n- Solana: ${sol:,.2f}\n\nFor beginners, I recommend starting with **BTC or ETH** — they're the most stable and have the most trading volume.\n\nSOL and altcoins can have bigger swings (more profit potential but more risk).",
            "suggestions": ["Create a BTC DCA bot", "Create an ETH Grid bot", "What about altcoins?"]
        }

    return {
        "response": "I can help you with:\n\n**Trading Strategies** — DCA, Grid Trading, how they work\n**Bot Setup** — choosing personality, configuring your bot\n**Risk Management** — stop-loss, take-profit, position sizing\n**Market Info** — current prices, trends\n**Learning** — crypto basics for beginners\n\nJust ask me anything!",
        "suggestions": ["What strategy should I use?", "Explain crypto trading", "Set up my first bot", "Show current prices"]
    }
