from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str
    DATABASE_URL_SYNC: str = ""
    REDIS_URL: str
    SECRET_KEY: str
    ENCRYPTION_MASTER_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ALLOWED_ORIGINS: str = "http://localhost:3000,https://www.xbottrader.shop,https://xbottrader.shop"
    ANTHROPIC_API_KEY: str = ""
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

    class Config:
        env_file = ".env"


settings = Settings()
