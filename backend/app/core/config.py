from functools import lru_cache
from typing import List, Optional
import json
import os

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configuration principale de l'application."""

    project_name: str = "SEKA Backend"
    environment: str = "local"
    debug: bool = True

    api_v1_prefix: str = "/api/v1"
    backend_cors_origins: List[str] = [
        "http://localhost:3000",
        "https://www.sekagestion.com",
        "https://sekagestion.com",
        "https://app.sekagestion.com",
        "https://api.sekagestion.com"
    ]

    db_user: str = "postgres"
    db_password: str = "postgres"
    db_host: str = "localhost"
    db_port: int = 5432
    db_name: str = "seka"
    database_url: Optional[str] = None

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
    
    stripe_api_key: Optional[str] = None
    stripe_secret_key: Optional[str] = None
    stripe_webhook_secret: Optional[str] = None
    
    kkiapay_public_key: Optional[str] = None
    kkiapay_private_key: Optional[str] = None
    kkiapay_secret: Optional[str] = None
    
    resend_api_key: Optional[str] = None
    resend_from_email: str = "noreply@sekagestion.com"
    resend_from_name: str = "SEKA"
    
    domain: str = "sekagestion.com"
    frontend_url: str = "https://www.sekagestion.com"

    model_config = SettingsConfigDict(
        env_file=("../.env.local", "../.env", ".env.local", ".env"),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    from pydantic import field_validator, model_validator

    @field_validator("backend_cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        """Parse CORS origins from environment variable (can be JSON string or list)."""
        if isinstance(v, str):
            try:
                parsed = json.loads(v)
                if isinstance(parsed, list):
                    return parsed
            except json.JSONDecodeError:
                return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    @model_validator(mode='before')
    @classmethod
    def assemble_db_connection(cls, values: dict) -> dict:
        """
        Assembles the database_url from components if it's not provided.
        Ensures the correct psycopg driver is used.
        """
        db_url = values.get('database_url')

        if not db_url:
            db_url = (
                f"postgresql+psycopg://{values.get('db_user', 'postgres')}:"
                f"{values.get('db_password', 'postgres')}@{values.get('db_host', 'localhost')}:"
                f"{values.get('db_port', 5432)}/{values.get('db_name', 'seka')}"
            )
        
        # Ensure correct driver is used
        if db_url.startswith("postgres://"):
            db_url = db_url.replace("postgres://", "postgresql+psycopg://", 1)
        elif db_url.startswith("postgresql://") and "psycopg" not in db_url:
            db_url = db_url.replace("postgresql://", "postgresql+psycopg://", 1)
            
        values['database_url'] = db_url
        return values


@lru_cache
def get_settings() -> Settings:
    return Settings()
