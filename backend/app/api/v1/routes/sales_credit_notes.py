"""Sales Credit Notes API Routes - Avoirs"""

from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_tenant, get_current_user
from app.db.session import get_db
from app.models.tenant import Tenant
from app.models.user import User

router = APIRouter()


@router.get("/")
async def get_credit_notes(
    status: Optional[str] = None,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Liste des avoirs."""
    return {"credit_notes": [], "total": 0}


@router.post("/")
async def create_credit_note(
    invoice_id: str = Query(...),
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Crée un avoir à partir d'une facture."""
    return {"success": True, "credit_note_id": None}


@router.get("/{credit_note_id}")
async def get_credit_note(
    credit_note_id: str,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Détails d'un avoir."""
    return {"credit_note": None}
