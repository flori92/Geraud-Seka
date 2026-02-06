"""
Routes API pour le referentiel SYSCOHADA

Endpoints:
- GET /accounts           Liste des comptes SYSCOHADA
- GET /accounts/search    Recherche de comptes
- GET /accounts/hierarchy Arborescence pour navigation
- GET /categories         Liste des categories fournisseurs
- POST /categories        Creer une categorie custom
- GET /suggest            Suggestion de compte pour un fournisseur
"""
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.session import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.services.syscohada_service import SyscohadaService
from app.services.account_suggestion_service import AccountSuggestionService


router = APIRouter()


# =============================================================================
# SCHEMAS
# =============================================================================

class SyscohadaAccountResponse(BaseModel):
    """Schema pour un compte SYSCOHADA"""
    id: UUID
    account_number: str
    account_label: str
    account_class: int
    parent_account: Optional[str] = None
    level: int
    is_detail: bool
    description: Optional[str] = None

    class Config:
        from_attributes = True


class AccountSearchResult(BaseModel):
    """Resultat de recherche simplifie"""
    account_number: str
    account_label: str
    account_class: int
    is_detail: bool


class SupplierCategoryResponse(BaseModel):
    """Schema pour une categorie fournisseur"""
    id: UUID
    code: str
    label: str
    default_charge_account: str
    keywords: List[str]

    class Config:
        from_attributes = True


class SupplierCategoryCreate(BaseModel):
    """Schema pour creer une categorie"""
    code: str
    label: str
    default_charge_account: str
    keywords: List[str] = []


class SuggestionResponse(BaseModel):
    """Reponse de suggestion de compte"""
    category: Optional[dict] = None
    charge_account: str
    confidence: float
    source: str


# =============================================================================
# ENDPOINTS - COMPTES SYSCOHADA
# =============================================================================

@router.get("/accounts", response_model=List[SyscohadaAccountResponse])
async def list_accounts(
    account_class: Optional[int] = Query(None, ge=1, le=8, description="Filtrer par classe (1-8)"),
    detail_only: bool = Query(False, description="Retourner uniquement les comptes de detail"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Liste les comptes SYSCOHADA.

    - **account_class**: Filtrer par classe (1-8)
    - **detail_only**: Retourner uniquement les comptes utilisables pour ecritures
    """
    service = SyscohadaService(db)

    if detail_only:
        accounts = service.get_detail_accounts(account_class)
    else:
        accounts = service.get_all_accounts(account_class)

    return accounts


@router.get("/accounts/search", response_model=List[AccountSearchResult])
async def search_accounts(
    q: str = Query(..., min_length=1, description="Terme de recherche"),
    limit: int = Query(20, ge=1, le=100, description="Nombre max de resultats"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Recherche de comptes par numero ou libelle.

    Exemples:
    - q=6061 -> trouve "6061 - Electricite"
    - q=electricite -> trouve "6061 - Electricite"
    - q=tva -> trouve tous les comptes TVA
    """
    service = SyscohadaService(db)
    accounts = service.search_accounts(q, limit)

    return [
        AccountSearchResult(
            account_number=a.account_number,
            account_label=a.account_label,
            account_class=a.account_class,
            is_detail=a.is_detail
        )
        for a in accounts
    ]


@router.get("/accounts/hierarchy")
async def get_hierarchy(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retourne l'arborescence complete pour navigation.

    Structure:
    ```json
    {
        "6": {
            "label": "Charges",
            "accounts": {
                "60": {
                    "label": "Achats",
                    "is_detail": false,
                    "children": [
                        {"number": "601", "label": "Achats marchandises", "is_detail": true}
                    ]
                }
            }
        }
    }
    ```
    """
    service = SyscohadaService(db)
    return service.get_account_hierarchy()


@router.get("/accounts/{account_number}", response_model=SyscohadaAccountResponse)
async def get_account(
    account_number: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Recupere un compte par son numero exact."""
    service = SyscohadaService(db)
    account = service.get_account_by_number(account_number)

    if not account:
        raise HTTPException(status_code=404, detail=f"Compte {account_number} non trouve")

    return account


# =============================================================================
# ENDPOINTS - CATEGORIES FOURNISSEURS
# =============================================================================

@router.get("/categories", response_model=List[SupplierCategoryResponse])
async def list_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Liste les categories de fournisseurs.

    Retourne les categories systeme + celles du tenant.
    """
    service = SyscohadaService(db)
    return service.get_categories(str(current_user.tenant_id))


@router.post("/categories", response_model=SupplierCategoryResponse)
async def create_category(
    category_data: SupplierCategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Cree une categorie fournisseur personnalisee.

    Les categories personnalisees sont liees au tenant.
    """
    service = SyscohadaService(db)

    # Verifier que le code n'existe pas deja
    existing = service.get_category_by_code(category_data.code)
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"La categorie avec le code '{category_data.code}' existe deja"
        )

    category = service.create_category(
        code=category_data.code,
        label=category_data.label,
        default_charge_account=category_data.default_charge_account,
        keywords=category_data.keywords,
        tenant_id=str(current_user.tenant_id)
    )

    db.commit()

    return category


# =============================================================================
# ENDPOINTS - SUGGESTION
# =============================================================================

@router.get("/suggest", response_model=SuggestionResponse)
async def suggest_account(
    name: str = Query(..., min_length=1, description="Nom du fournisseur"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Suggere un compte et une categorie pour un nom de fournisseur.

    Logique de suggestion:
    1. Fournisseur existant avec categorie -> utiliser sa categorie
    2. Match dans les categories par mots-cles -> suggerer la categorie
    3. Match dans account_keywords -> suggerer le compte
    4. Fallback -> compte 601 (achats marchandises)

    Exemple:
    - name=SBEE -> categorie ENERGIE, compte 6061, confidence 0.9
    - name=MTN -> categorie TELECOM, compte 6261, confidence 0.9
    - name=Societe XYZ -> compte 601, confidence 0.3
    """
    service = AccountSuggestionService(db, str(current_user.tenant_id))
    return service.suggest_for_supplier(name)


@router.get("/suggest/category")
async def suggest_category_only(
    name: str = Query(..., min_length=1, description="Nom du fournisseur"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Suggere uniquement une categorie pour un nom de fournisseur.

    Retourne null si aucune categorie ne correspond.
    """
    service = AccountSuggestionService(db, str(current_user.tenant_id))
    category = service.suggest_category(name)

    return {"category": category}
