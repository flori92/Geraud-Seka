"""Sales Reminders API Routes - Relances clients"""

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_tenant, get_current_user
from app.db.session import get_db
from app.models.tenant import Tenant
from app.models.user import User

router = APIRouter()


@router.get("/")
async def get_reminders(
    status: Optional[str] = None,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Liste des relances clients."""
    return {"reminders": [], "total": 0}


@router.post("/")
async def create_reminder(
    client_id: str = Query(...),
    invoice_id: str = Query(...),
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Crée une nouvelle relance."""
    return {"success": True, "reminder_id": None}


@router.post("/send-all")
async def send_all_reminders(
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Envoie toutes les relances en attente."""
    return {"success": True, "sent_count": 0}


@router.get("/settings")
async def get_reminder_settings(
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Paramètres de relance."""
    return {
        "settings": {
            "auto_reminder_enabled": False,
            "reminder_days": [7, 14, 30],
            "email_template": None,
        }
    }


@router.put("/settings")
async def update_reminder_settings(
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Met à jour les paramètres de relance."""
    return {"success": True}
