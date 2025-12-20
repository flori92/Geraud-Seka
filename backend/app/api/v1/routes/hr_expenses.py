"""HR Expenses API Routes - Notes de frais"""

from datetime import date
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_tenant, get_current_user
from app.db.session import get_db
from app.models.tenant import Tenant
from app.models.user import User

router = APIRouter()


@router.get("/")
async def get_expenses(
    status: Optional[str] = None,
    employee_id: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Liste des notes de frais."""
    return {"expenses": [], "total": 0, "total_amount": 0.0}


@router.post("/")
async def create_expense(
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Crée une nouvelle note de frais."""
    return {"success": True, "expense_id": None}


@router.get("/{expense_id}")
async def get_expense(
    expense_id: str,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Détails d'une note de frais."""
    return {"expense": None}


@router.put("/{expense_id}/approve")
async def approve_expense(
    expense_id: str,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Approuve une note de frais."""
    return {"success": True}


@router.put("/{expense_id}/reject")
async def reject_expense(
    expense_id: str,
    reason: str = Query(...),
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Rejette une note de frais."""
    return {"success": True}
