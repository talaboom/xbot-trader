"""Test bootstrap — set required env vars before any app imports happen."""
import os

os.environ.setdefault("DATABASE_URL", "postgresql+asyncpg://test:test@localhost/testdb")
os.environ.setdefault("REDIS_URL", "redis://localhost:6379/0")
os.environ.setdefault("SECRET_KEY", "test-secret-key-not-for-production")
os.environ.setdefault("ENCRYPTION_MASTER_KEY", "aGVsbG8tdGVzdC1tYXN0ZXIta2V5LTMyLWJ5dGVzIQ==")
os.environ.setdefault("ANTHROPIC_API_KEY", "sk-test-not-real")
os.environ.setdefault("SEC_USER_AGENT", "X Bot Trader Test (test@example.com)")
