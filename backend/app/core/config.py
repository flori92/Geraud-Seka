from functools import lru_cache
from typing import List, Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configuration principale de l’application."""

    project_name: str = "SEKA Backend"
    environment: str = "local"
    debug: bool = True

    api_v1_prefix: str = "/api/v1"
    backend_cors_origins: List[str] = ["http://localhost:3000"]

    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/seka"
    redis_url: str = "redis://localhost:6379/0"

    secret_key: str = "CHANGE_ME"
    access_token_expire_minutes: int = 60
    refresh_token_expire_minutes: int = 60 * 24 * 7
    token_algorithm: str = "HS256"

    r2_account_id: Optional[str] = None
    r2_access_key_id: Optional[str] = None
    r2_secret_access_key: Optional[str] = None
    r2_bucket_name: str = "seka-documents-local"
    r2_public_base_url: Optional[str] = None

    mindee_api_key: Optional[str] = None
    sentry_dsn: Optional[str] = None
    
    # Payment Providers
    stripe_api_key: Optional[str] = None
    stripe_secret_key: Optional[str] = None
    stripe_webhook_secret: Optional[str] = None
    
    kkiapay_public_key: Optional[str] = None
    kkiapay_private_key: Optional[str] = None
    kkiapay_secret: Optional[str] = None
    
    # Email
    resend_api_key: Optional[str] = None
    resend_from_email: str = "noreply@sekagestion.com"
    resend_from_name: str = "SEKA"
    
    # Domain
    domain: str = "sekagestion.com"
    frontend_url: str = "https://app.sekagestion.com"

    model_config = SettingsConfigDict(
        env_file=("../.env", ".env"),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
