from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_db_session
from app.core.security import create_access_token, create_refresh_token
from app.crud import tenant as tenant_crud
from app.crud import user as user_crud
from app.schemas.auth import RegisterRequest, TokenPair
from app.schemas.tenant import TenantCreate
from app.schemas.user import UserCreate, UserRead

router = APIRouter()


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register(
    payload: RegisterRequest,
    db: Session = Depends(get_db_session),
):
    if tenant_crud.get_by_slug(db, payload.tenant_slug):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Tenant already exists")
    if user_crud.get_by_email(db, payload.email):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User already exists")

    tenant = tenant_crud.create(
        db,
        obj_in=TenantCreate(name=payload.tenant_name, slug=payload.tenant_slug, country=payload.tenant_country),
    )

    user = user_crud.create(
        db,
        obj_in=UserCreate(
            email=payload.email,
            password=payload.password,
            full_name=payload.full_name,
            role=payload.role,
            is_active=True,
            is_superuser=True,
            tenant_id=tenant.id,
        ),
    )

    return UserRead.model_validate(user)


@router.post("/login", response_model=TokenPair)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db_session),
):
    print(f"Login attempt for: {form_data.username}")
    user = user_crud.authenticate(db, email=form_data.username, password=form_data.password)
    print(f"User found: {user}")
    if not user:
        print("Authentication failed")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect credentials")
    if not user.is_active:
        print("User inactive")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Inactive user")

    access = create_access_token(str(user.id))
    refresh = create_refresh_token(str(user.id))
    return TokenPair(access_token=access, refresh_token=refresh)


@router.get("/me", response_model=UserRead)
def read_me(current_user=Depends(get_current_user)):
    return current_user
