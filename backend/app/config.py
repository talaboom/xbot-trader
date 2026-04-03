from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str
    DATABASE_URL_SYNC: str = ""
    REDIS_URL: str
    SECRET_KEY: str
    ENCRYPTION_MASTER_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    COINBASE_SANDBOX_URL: str = "https://api-sandbox.coinbase.com"
    COINBASE_PRODUCTION_URL: str = "https://api.coinbase.com"

    class Config:
        env_file = ".env"


settings = Settings()
