"""Accounting Assets API Routes - Gestion des immobilisations"""

from datetime import date
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_tenant, get_current_user
from app.db.session import get_db
from app.models.tenant import Tenant
from app.models.user import User

router = APIRouter()


@router.get("/")
async def get_assets(
    category: Optional[str] = None,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Liste des immobilisations."""
    # Placeholder - table à créer
    return {"assets": [], "total": 0}


@router.get("/categories")
async def get_asset_categories(
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Catégories d'immobilisations SYSCOHADA."""
    categories = [
        {"code": "21", "name": "Immobilisations incorporelles", "depreciation_rate": 20.0},
        {"code": "22", "name": "Terrains", "depreciation_rate": 0.0},
        {"code": "23", "name": "Bâtiments", "depreciation_rate": 5.0},
        {"code": "24", "name": "Matériel", "depreciation_rate": 10.0},
        {"code": "25", "name": "Matériel de transport", "depreciation_rate": 20.0},
        {"code": "26", "name": "Titres de participation", "depreciation_rate": 0.0},
        {"code": "27", "name": "Autres immobilisations financières", "depreciation_rate": 0.0},
    ]
    return {"categories": categories}


@router.post("/calculate-depreciation")
async def calculate_depreciation(
    year: int = Query(date.today().year),
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Calcule les amortissements pour une année."""
    return {
        "year": year,
        "total_depreciation": 0.0,
        "entries_generated": 0,
        "details": [],
    }


@router.get("/export")
async def export_assets(
    format: str = Query("csv", enum=["csv", "xlsx", "pdf"]),
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Exporte le tableau des immobilisations."""
    return {"download_url": None, "message": "Export en cours de développement"}
