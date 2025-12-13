"""Tax/Fiscalité API Routes

Endpoints fiscaux (liasse, IS/IR, taxes diverses).
Calculés dynamiquement à partir des écritures comptables.
"""

from datetime import date
from typing import Any, Dict, List

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_tenant, get_current_user
from app.db.session import get_db
from app.models.tenant import Tenant
from app.models.user import User
from app.services.accounting_analytics import AccountingAnalyticsService

router = APIRouter()


@router.get("/liasse-fiscale")
async def get_liasse_fiscale(
    year: int = Query(date.today().year, ge=1900, le=2100),
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    service = AccountingAnalyticsService(db, current_tenant.id)

    income_statement = service.get_income_statement(year)
    sig = service.get_sig(year)

    # Liasse minimale: structure + indicateurs
    items: List[Dict[str, Any]] = [
        {"code": "CR", "label": "Compte de résultat", "status": "prêt" if (income_statement.get("revenue") or 0) != 0 else "à préparer"},
        {"code": "SIG", "label": "SIG", "status": "prêt" if (sig.get("lines") or []) else "à préparer"},
        {"code": "BIL", "label": "Bilan", "status": "à préparer"},
        {"code": "ANN", "label": "Annexes", "status": "à préparer"},
    ]

    return {
        "year": year,
        "items": items,
        "generated_at": date.today().isoformat(),
    }


@router.get("/is-ir")
async def get_is_ir(
    year: int = Query(date.today().year, ge=1900, le=2100),
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    service = AccountingAnalyticsService(db, current_tenant.id)
    data = service.get_is_ir(year)
    return data


@router.get("/other-taxes")
async def get_other_taxes(
    year: int = Query(date.today().year, ge=1900, le=2100),
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    service = AccountingAnalyticsService(db, current_tenant.id)
    data = service.get_other_taxes(year)
    return data


@router.get("/tva-declaration")
async def get_tva_declaration(
    year: int = Query(date.today().year, ge=1900, le=2100),
    month: int = Query(date.today().month, ge=1, le=12),
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """
    Récupère la déclaration TVA mensuelle calculée à partir des écritures comptables.

    - **year**: Année de la déclaration (défaut: année en cours)
    - **month**: Mois de la déclaration (défaut: mois en cours)

    Retourne:
    - TVA collectée et déductible
    - Détails par lignes (par taux et nature)
    - Historique des 3 dernières déclarations
    """
    service = AccountingAnalyticsService(db, current_tenant.id)
    data = service.get_tva_declaration(year, month)
    return data
