from typing import Generator
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.security import decode_token
from app.crud import user as user_crud
from app.db.session import get_db
from app.models.tenant import Tenant
from app.schemas.auth import TokenPayload

reuseable_oauth = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


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
