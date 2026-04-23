from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str
    DATABASE_URL_SYNC: str = ""
    REDIS_URL: str
    SECRET_KEY: str
    ENCRYPTION_MASTER_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ALLOWED_ORIGINS: str = "http://localhost:3000,https://www.xbottrader.ca,https://xbottrader.ca"
    ANTHROPIC_API_KEY: str = ""
    GEMINI_API_KEY: str = ""
    ANTIGRAVITY_API_KEY: str = ""
    ANTIGRAVITY_BASE_URL: str = ""
    ANTIGRAVITY_MODEL: str = "claude-sonnet-4.5"
    COINBASE_SANDBOX_URL: str = "https://api-sandbox.coinbase.com"
    COINBASE_PRODUCTION_URL: str = "https://api.coinbase.com"
    RESEND_API_KEY: str = ""
    EMAIL_FROM: str = "X Bot Trader <onboarding@resend.dev>"
    STRIPE_SECRET_KEY: str = ""
    STRIPE_PUBLISHABLE_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""
    STRIPE_PRICE_TRADER: str = ""
    STRIPE_PRICE_PRO: str = ""
    FRONTEND_URL: str = "http://localhost:3000"
    FACEBOOK_APP_ID: str = ""
    FACEBOOK_APP_SECRET: str = ""

    # OAuth
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    MICROSOFT_CLIENT_ID: str = ""
    MICROSOFT_CLIENT_SECRET: str = ""
    TELEGRAM_BOT_TOKEN: str = ""
    TELEGRAM_CHANNEL_URL: str = "https://t.me/xbottrader"

    # Alpaca Stocks
    ALPACA_API_KEY: str = ""
    ALPACA_SECRET_KEY: str = ""

    # SEC Radar (EDGAR requires a descriptive User-Agent with contact email per their fair-access policy)
    SEC_USER_AGENT: str = "X Bot Trader (support@xbottrader.ca)"
    SEC_RADAR_CLAUDE_MODEL: str = "claude-sonnet-4-6"

    class Config:
        env_file = ".env"


settings = Settings()
