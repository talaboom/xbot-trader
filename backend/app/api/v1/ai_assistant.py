from decimal import Decimal

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.database import get_db
from app.models.strategy import Strategy
from app.models.trade import Trade
from app.models.user import User
from app.strategies.bot_personalities import get_all_personalities, apply_personality_to_config
from app.services.coinbase_service import get_public_price
from app.services.paper_trading_service import get_paper_holdings

router = APIRouter(prefix="/ai", tags=["ai"])


class ChatMessage(BaseModel):
    message: str
    context: str | None = None


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


async def _get_user_context(user: User, db: AsyncSession) -> str:
    """Build portfolio context string for the AI to reference."""
    # Get strategies
    result = await db.execute(
        select(Strategy).where(Strategy.user_id == user.id)
    )
    strategies = result.scalars().all()
    active_bots = [s for s in strategies if s.status == "running"]

    # Get trade count
    result = await db.execute(select(func.count()).where(Trade.user_id == user.id))
    trade_count = result.scalar() or 0

    # Get P&L
    result = await db.execute(
        select(func.coalesce(func.sum(Strategy.pnl), 0)).where(Strategy.user_id == user.id)
    )
    total_pnl = result.scalar() or Decimal("0")

    # Get holdings
    holdings = await get_paper_holdings(db, user.id)
    holdings_str = ", ".join(f"{qty:.4f} {sym}" for sym, qty in holdings.items()) if holdings else "none"

    ctx = (
        f"User: {user.username} | Mode: {'paper' if user.is_paper_mode else 'live'} | "
        f"Cash: ${user.paper_balance:,.2f} | Holdings: {holdings_str} | "
        f"Bots: {len(active_bots)} active / {len(strategies)} total | "
        f"Trades: {trade_count} | P&L: ${total_pnl:,.2f}"
    )
    return ctx


@router.post("/chat")
async def chat(
    msg: ChatMessage,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    message = msg.message.lower()
    user_ctx = await _get_user_context(user, db)

    # Portfolio analysis
    if any(w in message for w in ["portfolio", "analyze", "analysis", "how am i doing", "my stats", "my balance"]):
        holdings = await get_paper_holdings(db, user.id)
        result = await db.execute(
            select(Strategy).where(Strategy.user_id == user.id)
        )
        strategies = result.scalars().all()
        active = [s for s in strategies if s.status == "running"]

        result = await db.execute(
            select(func.coalesce(func.sum(Strategy.pnl), 0)).where(Strategy.user_id == user.id)
        )
        total_pnl = result.scalar() or Decimal("0")

        holdings_lines = []
        total_holdings_value = Decimal("0")
        for sym, qty in holdings.items():
            price = await get_public_price(f"{sym}-USD")
            if price:
                val = qty * Decimal(str(price))
                total_holdings_value += val
                holdings_lines.append(f"  - {sym}: {qty:.6f} (${val:,.2f})")

        total_value = user.paper_balance + total_holdings_value
        pnl_emoji = "📈" if total_pnl >= 0 else "📉"

        resp = f"**Your Portfolio {pnl_emoji}**\n\n"
        resp += f"💰 **Total Value:** ${total_value:,.2f}\n"
        resp += f"💵 **Cash:** ${user.paper_balance:,.2f}\n"
        if holdings_lines:
            resp += f"🪙 **Holdings:**\n" + "\n".join(holdings_lines) + "\n"
        resp += f"\n{pnl_emoji} **Total P&L:** ${total_pnl:,.2f}\n"
        resp += f"🤖 **Active Bots:** {len(active)} / {len(strategies)}\n"

        if total_pnl > 0:
            resp += "\nNice work! Your strategies are making money. Consider taking some profits."
        elif total_pnl < 0:
            resp += "\nDon't worry — losses are normal, especially early on. Consider adjusting your strategy or risk level."
        else:
            resp += "\nYou're just getting started! Create a bot to begin trading."

        return {
            "response": resp,
            "suggestions": ["Suggest a strategy", "Show current prices", "Create a new bot"],
        }

    # Strategy recommendation
    if any(w in message for w in ["suggest", "recommend", "what should", "which strategy", "help me pick"]):
        holdings = await get_paper_holdings(db, user.id)
        cash = user.paper_balance

        if cash > 50000:
            risk = "conservative"
            reason = "You have a large cash position — let's protect it"
        elif cash > 10000:
            risk = "moderate"
            reason = "You have a good balance to work with"
        elif cash > 1000:
            risk = "aggressive"
            reason = "With a smaller balance, you might want higher returns"
        else:
            risk = "conservative"
            reason = "Your balance is low — let's be careful"

        btc_price = await get_public_price("BTC-USD")
        eth_price = await get_public_price("ETH-USD")

        resp = f"Based on your portfolio (${cash:,.2f} cash), here's my suggestion:\n\n"
        resp += f"**Strategy:** DCA (Dollar Cost Averaging)\n"
        resp += f"**Personality:** {risk.title()}\n"
        resp += f"**Reason:** {reason}\n\n"
        resp += f"**Recommended coins:**\n"
        resp += f"  - BTC (${btc_price:,.2f}) — safest bet, most stable\n" if btc_price else ""
        resp += f"  - ETH (${eth_price:,.2f}) — strong #2, good for DCA\n" if eth_price else ""
        resp += f"\n**Next step:** Go to My Bots → Create Bot → pick {risk.title()} personality"

        return {
            "response": resp,
            "suggestions": [f"Create a {risk} BTC bot", f"Create a {risk} ETH bot", "Tell me about risk levels"],
        }

    # Prices with more context
    if any(w in message for w in ["price", "bitcoin", "btc", "ethereum", "eth", "solana", "sol", "market", "crypto"]):
        prices = {}
        for pid in ["BTC-USD", "ETH-USD", "SOL-USD", "DOGE-USD", "ADA-USD", "XRP-USD"]:
            p = await get_public_price(pid)
            if p:
                prices[pid] = p

        resp = "**Live Crypto Prices:**\n\n"
        for pid, p in prices.items():
            symbol = pid.replace("-USD", "")
            resp += f"  - **{symbol}:** ${p:,.2f}\n"

        resp += "\nWant me to suggest which one to trade?"
        return {
            "response": resp,
            "suggestions": ["Which coin should I buy?", "Create a BTC bot", "Suggest a strategy"],
        }

    if any(w in message for w in ["hello", "hi", "hey", "start"]):
        return {
            "response": f"Hey {user.username}! I'm your X Bot trading assistant.\n\n{user_ctx}\n\nHow can I help you today?",
            "suggestions": ["Analyze my portfolio", "Suggest a strategy", "Explain DCA trading", "Show me prices"],
        }

    if any(w in message for w in ["dca", "dollar cost", "averaging"]):
        return {
            "response": "**DCA (Dollar Cost Averaging)** is the simplest and most popular strategy.\n\nHow it works: You invest a fixed amount at regular intervals, regardless of price. If BTC is $70K today and $60K next week, you buy both times.\n\nWhy it works: You get a better average price over time because you buy more when it's cheap and less when it's expensive.\n\n**My recommendation:** Start with the 🛡️ Conservative personality — it DCA's once per day with 2% of your portfolio.",
            "suggestions": ["Set up a DCA bot", "What about Grid trading?", "Which coin should I DCA?"],
        }

    if any(w in message for w in ["grid", "range", "sideways"]):
        return {
            "response": "**Grid Trading** is perfect for sideways/ranging markets.\n\nHow it works: You set a price range (e.g., BTC between $60K-$70K). The bot places buy orders at the bottom and sell orders at the top. Every time price bounces between levels, you profit.\n\nBest for: Markets that aren't trending strongly up or down.\n\n**Warning:** If price breaks below your range, you could be holding at a loss. Always set a stop-loss!",
            "suggestions": ["Set up a Grid bot", "What's the best range for BTC?", "How much should I invest?"],
        }

    if any(w in message for w in ["aggressive", "risky", "yolo", "moon", "degen"]):
        return {
            "response": "🐺 **Alpha Wolf** (Aggressive) or 🚀 **Moon Shot** (DEGEN) modes trade frequently with larger positions.\n\nAggressive: Trades every 2 hours, uses 10% of portfolio per trade, tight 8% stop-loss.\nDegen: Trades every hour, uses 20% per trade, 5% stop-loss.\n\n⚠️ **Higher risk = higher potential losses too.** I recommend starting with paper trading to test before going live.",
            "suggestions": ["Start aggressive paper trading", "What's the safest option?", "Show me the leaderboard"],
        }

    if any(w in message for w in ["safe", "conservative", "beginner", "new"]):
        return {
            "response": "🛡️ **Safe Guardian** (Conservative) is perfect for beginners!\n\nIt trades once per day, uses only 2% of your portfolio per trade, and has a wide 25% stop-loss so it doesn't panic-sell on normal dips.\n\nMaximum investment: 30% of your portfolio — keeping 70% in cash.\n\n**Step 1:** Start in paper trading mode.\n**Step 2:** Create a DCA bot with Conservative personality.\n**Step 3:** Watch it trade for a week.\n**Step 4:** Go live when you're confident.",
            "suggestions": ["Create a Conservative DCA bot", "How does paper trading work?", "What is stop-loss?"],
        }

    if any(w in message for w in ["stop loss", "stop-loss", "stoploss"]):
        return {
            "response": "**Stop-Loss** is your safety net. It automatically sells your position if the price drops below a certain percentage.\n\nExample: You buy BTC at $65,000 with a 10% stop-loss. If BTC drops to $58,500, the bot automatically sells to prevent further losses.\n\n**Conservative:** 25% stop-loss (rarely triggers)\n**Moderate:** 15% stop-loss (balanced)\n**Aggressive:** 8% stop-loss (triggers often)\n**Degen:** 5% stop-loss (very tight, many triggers)",
            "suggestions": ["What's take-profit?", "Set up a bot with stop-loss", "Show me strategies"],
        }

    if any(w in message for w in ["paper", "test", "practice", "fake money"]):
        return {
            "response": f"**Paper Trading** lets you practice with virtual money using real market prices.\n\nYour current paper balance: **${user.paper_balance:,.2f}**\n\nEverything works exactly like live trading — the bot buys and sells, tracks your P&L — but no real money is at risk.\n\nI always recommend testing a strategy in paper mode for at least 1-2 weeks before going live.",
            "suggestions": ["Create my first bot", "Analyze my portfolio", "How do I connect Coinbase?"],
        }

    # Default
    return {
        "response": f"I can help you with:\n\n📈 **Trading Strategies** — DCA, Grid Trading, how they work\n🤖 **Bot Setup** — choosing personality, configuring your bot\n💰 **Risk Management** — stop-loss, take-profit, position sizing\n📊 **Market Info** — current prices, trends\n📋 **Portfolio Analysis** — how your bots are performing\n🎓 **Learning** — crypto basics for beginners\n\nJust ask me anything!",
        "suggestions": ["Analyze my portfolio", "Suggest a strategy", "Show current prices", "Set up my first bot"],
    }
