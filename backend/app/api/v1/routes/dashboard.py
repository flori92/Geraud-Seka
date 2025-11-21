from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core import deps
from app.models.client import Client
from app.models.document import Document, DocumentStatus
from app.models.user import User
from app.schemas.dashboard import DashboardStats

router = APIRouter()


@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(
    db: Session = Depends(deps.get_db_session),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get aggregated dashboard statistics.
    """
    # Mock implementation for now, replace with real queries
    total_clients = db.query(Client).count()
    active_clients = total_clients # Simplified
    
    documents_pending = db.query(Document).filter(
        Document.status.in_([DocumentStatus.UPLOADED, DocumentStatus.OCR_PROCESSING])
    ).count()
    
    documents_processed = db.query(Document).filter(
        Document.status == DocumentStatus.VALIDATED
    ).count() # Should filter by date
    
    return {
        "total_clients": total_clients,
        "active_clients": active_clients,
        "documents_pending": documents_pending,
        "documents_processed_this_month": documents_processed,
        "tasks_overdue": 6, # Mock
        "tasks_due_this_week": 9 # Mock
    }
