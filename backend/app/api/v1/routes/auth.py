import uuid
import logging

from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List

from app.core.deps import get_current_user, get_db_session
from app.core.security import create_access_token, create_refresh_token, get_password_hash
from app.crud import tenant as tenant_crud
from app.crud import user as user_crud
from app.schemas.auth import RegisterRequest, TokenPair
from app.schemas.tenant import TenantCreate
from app.schemas.user import UserCreate, UserRead
from app.models.tenant import Tenant
from app.models.user import User

router = APIRouter()
logger = logging.getLogger(__name__)


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
    import logging
    logger = logging.getLogger(__name__)
    
    try:
        logger.info(f"Login attempt for: {form_data.username}")
        user = user_crud.authenticate(db, email=form_data.username, password=form_data.password)
        logger.info(f"User found: {user is not None}")
        
        if not user:
            logger.warning("Authentication failed - incorrect credentials")
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect credentials")
        if not user.is_active:
            logger.warning("Authentication failed - user inactive")
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Inactive user")

        access = create_access_token(str(user.id))
        refresh = create_refresh_token(str(user.id))
        logger.info(f"Login successful for user: {user.email}")
        return TokenPair(access_token=access, refresh_token=refresh)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Login error: {str(e)}")


@router.get("/me", response_model=UserRead)
def read_me(current_user=Depends(get_current_user)):
    return current_user


@router.post("/setup-test-accounts", status_code=status.HTTP_201_CREATED)
def setup_test_accounts(
    secret_key: str = Query(..., description="Secret key to authorize this action"),
    db: Session = Depends(get_db_session),
):
    """
    Crée les comptes de test pour SEKA Business V1.
    Nécessite une clé secrète pour être exécuté.
    
    Usage: POST /api/v1/auth/setup-test-accounts?secret_key=SEKA_SETUP_2026
    """
    # Vérification de la clé secrète
    if secret_key != "SEKA_SETUP_2026":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid secret key"
        )
    
    created_accounts = []
    
    try:
        # 1. Créer/Vérifier les tenants
        
        # Tenant Entreprise
        enterprise_tenant = db.query(Tenant).filter(Tenant.subdomain == "entreprise-demo").first()
        if not enterprise_tenant:
            enterprise_tenant = Tenant(
                id=uuid.uuid4(),
                name="Entreprise ABC SARL",
                subdomain="entreprise-demo",
                country="BJ",
                is_active=True,
                plan="premium"
            )
            db.add(enterprise_tenant)
            db.flush()
            logger.info("Created tenant: Entreprise ABC SARL")
        
        # Tenant Cabinet
        cabinet_tenant = db.query(Tenant).filter(Tenant.subdomain == "cabinet-demo").first()
        if not cabinet_tenant:
            cabinet_tenant = Tenant(
                id=uuid.uuid4(),
                name="Cabinet KOUTON & Associés",
                subdomain="cabinet-demo",
                country="BJ",
                is_active=True,
                plan="cabinet"
            )
            db.add(cabinet_tenant)
            db.flush()
            logger.info("Created tenant: Cabinet KOUTON & Associés")
        
        # 2. Définir les comptes de test
        test_accounts = [
            # MODE ENTREPRISE
            {
                "email": "admin@entreprise-demo.seka.app",
                "password": "Admin123!",
                "full_name": "Jean ADMIN",
                "role": "admin",
                "is_superuser": True,
                "tenant": enterprise_tenant,
                "mode": "Entreprise"
            },
            {
                "email": "comptable@entreprise-demo.seka.app",
                "password": "Compta123!",
                "full_name": "Marie COMPTABLE",
                "role": "accountant",
                "is_superuser": False,
                "tenant": enterprise_tenant,
                "mode": "Entreprise"
            },
            {
                "email": "collaborateur@entreprise-demo.seka.app",
                "password": "Collab123!",
                "full_name": "Pierre COLLABORATEUR",
                "role": "collaborator",
                "is_superuser": False,
                "tenant": enterprise_tenant,
                "mode": "Entreprise"
            },
            # MODE CABINET
            {
                "email": "admin@cabinet-demo.seka.app",
                "password": "CabAdmin123!",
                "full_name": "Maître KOUTON",
                "role": "admin",
                "is_superuser": True,
                "tenant": cabinet_tenant,
                "mode": "Cabinet"
            },
            {
                "email": "comptable@cabinet-demo.seka.app",
                "password": "CabCompta123!",
                "full_name": "Sophie EXPERTISE",
                "role": "accountant",
                "is_superuser": False,
                "tenant": cabinet_tenant,
                "mode": "Cabinet"
            },
            {
                "email": "assistant@cabinet-demo.seka.app",
                "password": "CabAssist123!",
                "full_name": "Alain ASSISTANT",
                "role": "collaborator",
                "is_superuser": False,
                "tenant": cabinet_tenant,
                "mode": "Cabinet"
            },
        ]
        
        # 3. Créer les utilisateurs
        for account in test_accounts:
            existing = db.query(User).filter(User.email == account["email"]).first()
            
            if existing:
                created_accounts.append({
                    "email": account["email"],
                    "password": account["password"],
                    "role": account["role"],
                    "mode": account["mode"],
                    "tenant": account["tenant"].name,
                    "status": "already_exists"
                })
            else:
                user = User(
                    id=uuid.uuid4(),
                    email=account["email"],
                    hashed_password=get_password_hash(account["password"]),
                    full_name=account["full_name"],
                    role=account["role"],
                    is_active=True,
                    is_superuser=account["is_superuser"],
                    tenant_id=account["tenant"].id
                )
                db.add(user)
                created_accounts.append({
                    "email": account["email"],
                    "password": account["password"],
                    "role": account["role"],
                    "mode": account["mode"],
                    "tenant": account["tenant"].name,
                    "status": "created"
                })
                logger.info(f"Created user: {account['email']}")
        
        db.commit()
        
        return {
            "success": True,
            "message": "Test accounts setup completed",
            "accounts": created_accounts
        }
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating test accounts: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating test accounts: {str(e)}"
        )
