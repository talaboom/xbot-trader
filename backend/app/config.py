from pathlib import Path

from pydantic_settings import BaseSettings

# Look for .env in current dir or parent dir (supports running from backend/ or project root)
_env_file = Path(".env")
if not _env_file.exists():
    _parent_env = Path("../.env")
    if _parent_env.exists():
        _env_file = _parent_env


class Settings(BaseSettings):
    DATABASE_URL: str
    DATABASE_URL_SYNC: str = ""
    REDIS_URL: str
    SECRET_KEY: str
    ENCRYPTION_MASTER_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ALLOWED_ORIGINS: str = "http://localhost:3000,https://aix.8bit.ca"
    ANTHROPIC_API_KEY: str = ""
    DEEPSEEK_API_KEY: str = ""
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

    # OAuth
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    MICROSOFT_CLIENT_ID: str = ""
    MICROSOFT_CLIENT_SECRET: str = ""
    FACEBOOK_APP_ID: str = ""
    FACEBOOK_APP_SECRET: str = ""
    TELEGRAM_BOT_TOKEN: str = ""
    TELEGRAM_CHANNEL_URL: str = "https://t.me/xbottrader"

    class Config:
        env_file = str(_env_file)
        extra = "ignore"


settings = Settings()
