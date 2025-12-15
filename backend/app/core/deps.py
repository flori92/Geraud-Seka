from typing import Generator, Optional
from uuid import UUID

from fastapi import Depends, HTTPException, Header, status
from fastapi.security import OAuth2PasswordBearer, HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.core.security import decode_token
from app.crud import user as user_crud
from app.db.session import get_db
from app.models.tenant import Tenant
from app.schemas.auth import TokenPayload

reuseable_oauth = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")
optional_oauth = HTTPBearer(auto_error=False)


def get_db_session() -> Generator[Session, None, None]:
    yield from get_db()


def get_current_user(
    token: str = Depends(reuseable_oauth), db: Session = Depends(get_db_session)
):
    try:
        payload = TokenPayload(**decode_token(token))
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token") from exc

    if payload.type != "access":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")

    user = user_crud.get(db, UUID(payload.sub))
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Inactive user")

    return user


def get_current_tenant(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db_session),
):
    """Récupère le tenant courant à partir de l'utilisateur authentifié."""
    if not getattr(current_user, "tenant_id", None):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aucun tenant associé à cet utilisateur",
        )

    tenant = (
        db.query(Tenant)
        .filter(Tenant.id == current_user.tenant_id, Tenant.is_active.is_(True))
        .first()
    )

    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant introuvable ou inactif",
        )

    return tenant


def get_current_user_optional(
    auth: Optional[HTTPAuthorizationCredentials] = Depends(optional_oauth),
    db: Session = Depends(get_db_session)
) -> Optional[object]:
    """Get current user if authenticated, None otherwise"""
    if not auth:
        return None

    try:
        payload = TokenPayload(**decode_token(auth.credentials))
        if payload.type != "access":
            return None

        user = user_crud.get(db, UUID(payload.sub))
        if not user or not user.is_active:
            return None

        return user
    except Exception:
        return None


def get_current_client_id_optional(
    x_client_id: Optional[str] = Header(default=None, alias="X-Client-Id"),
) -> Optional[UUID]:
    if not x_client_id:
        return None
    try:
        return UUID(x_client_id)
    except Exception:
        return None


def get_current_tenant_optional(
    current_user: Optional[object] = Depends(get_current_user_optional),
    db: Session = Depends(get_db_session)
) -> Optional[Tenant]:
    """Get current tenant if user is authenticated, None otherwise"""
    if not current_user or not getattr(current_user, "tenant_id", None):
        return None

    try:
        tenant = (
            db.query(Tenant)
            .filter(Tenant.id == current_user.tenant_id, Tenant.is_active.is_(True))
            .first()
        )
        return tenant
    except Exception:
        return None
