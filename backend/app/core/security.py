from datetime import datetime, timedelta
from typing import Any, Optional

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import get_settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
settings = get_settings()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def _create_token(subject: str, expires_delta: timedelta, token_type: str) -> str:
    expire = datetime.utcnow() + expires_delta
    to_encode: dict[str, Any] = {
        "sub": subject,
        "exp": expire,
        "type": token_type,
    }
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.token_algorithm)


def create_access_token(subject: str, expires_minutes: Optional[int] = None) -> str:
    minutes = expires_minutes or settings.access_token_expire_minutes
    return _create_token(subject, timedelta(minutes=minutes), token_type="access")


def create_refresh_token(subject: str, expires_minutes: Optional[int] = None) -> str:
    minutes = expires_minutes or settings.refresh_token_expire_minutes
    return _create_token(subject, timedelta(minutes=minutes), token_type="refresh")


def decode_token(token: str) -> dict[str, Any]:
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.token_algorithm])
    except JWTError as exc:
        raise ValueError("Invalid token") from exc
    return payload
