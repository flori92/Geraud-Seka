"""Settings Fiscal Closing API Routes - Clôture fiscale"""

from datetime import date
from typing import Any, Dict

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_tenant, get_current_user
from app.db.session import get_db
from app.models.tenant import Tenant
from app.models.user import User

router = APIRouter()


@router.get("/")
async def get_fiscal_closing_status(
    year: int = Query(date.today().year),
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Statut de clôture fiscale."""
    return {
        "year": year,
        "status": "open",
        "can_close": False,
        "checks": [
            {"id": "balance", "label": "Balance équilibrée", "status": "pending"},
            {"id": "reconciliation", "label": "Rapprochements bancaires", "status": "pending"},
            {"id": "provisions", "label": "Provisions comptabilisées", "status": "pending"},
            {"id": "depreciation", "label": "Amortissements calculés", "status": "pending"},
        ],
    }


@router.post("/close")
async def close_fiscal_year(
    year: int = Query(...),
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Clôture l'exercice fiscal."""
    return {"success": False, "message": "Veuillez compléter tous les contrôles avant clôture"}


@router.post("/reopen")
async def reopen_fiscal_year(
    year: int = Query(...),
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Réouvre un exercice fiscal clôturé."""
    return {"success": False, "message": "Fonctionnalité restreinte aux administrateurs"}
