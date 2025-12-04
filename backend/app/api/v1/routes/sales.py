"""
API Routes Sales - Alias endpoints pour compatibilité frontend
Retourne des données mock pour quotes, invoices, purchase-orders, delivery-notes
"""

from datetime import datetime, timedelta
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models.user import User

router = APIRouter()

# Mock data
MOCK_QUOTES = [
    {"id": "q1", "number": "DEV-2025-001", "client_name": "ACME Corp", "amount": 5000000, "status": "draft", "created_at": datetime.now().isoformat()},
    {"id": "q2", "number": "DEV-2025-002", "client_name": "Tech Solutions", "amount": 3500000, "status": "sent", "created_at": (datetime.now() - timedelta(days=5)).isoformat()},
]

MOCK_INVOICES = [
    {"id": "i1", "number": "FAC-2025-001", "client_name": "ACME Corp", "amount": 5000000, "status": "paid", "created_at": datetime.now().isoformat()},
    {"id": "i2", "number": "FAC-2025-002", "client_name": "Tech Solutions", "amount": 3500000, "status": "sent", "created_at": (datetime.now() - timedelta(days=3)).isoformat()},
]

MOCK_PURCHASE_ORDERS = [
    {"id": "po1", "number": "BC-2025-001", "supplier_name": "Fournisseur A", "amount": 2000000, "status": "approved", "created_at": datetime.now().isoformat()},
    {"id": "po2", "number": "BC-2025-002", "supplier_name": "Fournisseur B", "amount": 1500000, "status": "pending", "created_at": (datetime.now() - timedelta(days=2)).isoformat()},
]

MOCK_DELIVERY_NOTES = [
    {"id": "dn1", "number": "BL-2025-001", "reference": "FAC-2025-001", "status": "delivered", "created_at": datetime.now().isoformat()},
    {"id": "dn2", "number": "BL-2025-002", "reference": "FAC-2025-002", "status": "pending", "created_at": (datetime.now() - timedelta(days=1)).isoformat()},
]

# ==================== QUOTES ALIASES ====================

@router.get("/quotes/")
async def get_quotes_alias(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    status: Optional[str] = Query(None),
    client_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Alias endpoint for GET /quotes/
    Frontend calls /api/v1/sales/quotes/ → returns mock data
    """
    quotes = MOCK_QUOTES.copy()
    if status:
        quotes = [q for q in quotes if q["status"] == status]

    return {
        "quotes": quotes[skip:skip+limit],
        "total": len(MOCK_QUOTES),
        "skip": skip,
        "limit": limit
    }


# ==================== INVOICES ALIASES ====================

@router.get("/invoices/")
async def get_invoices_alias(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    status: Optional[str] = Query(None),
    client_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Alias endpoint for GET /sales-invoices/
    Frontend calls /api/v1/sales/invoices/ → returns mock data
    """
    invoices = MOCK_INVOICES.copy()
    if status:
        invoices = [i for i in invoices if i["status"] == status]

    return {
        "invoices": invoices[skip:skip+limit],
        "total": len(MOCK_INVOICES),
        "skip": skip,
        "limit": limit
    }


# ==================== PURCHASE ORDERS ALIASES ====================

@router.get("/purchase-orders/")
async def get_purchase_orders_alias(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    status: Optional[str] = Query(None),
    supplier_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Alias endpoint for GET /purchase-orders/
    Frontend calls /api/v1/sales/purchase-orders/ → returns mock data
    """
    orders = MOCK_PURCHASE_ORDERS.copy()
    if status:
        orders = [o for o in orders if o["status"] == status]

    return {
        "purchase_orders": orders[skip:skip+limit],
        "total": len(MOCK_PURCHASE_ORDERS),
        "skip": skip,
        "limit": limit
    }


# ==================== DELIVERY NOTES ALIASES ====================

@router.get("/delivery-notes/")
async def get_delivery_notes_alias(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Alias endpoint for GET /delivery-notes/
    Frontend calls /api/v1/sales/delivery-notes/ → returns mock data
    """
    notes = MOCK_DELIVERY_NOTES.copy()
    if status:
        notes = [n for n in notes if n["status"] == status]

    return {
        "delivery_notes": notes[skip:skip+limit],
        "total": len(MOCK_DELIVERY_NOTES),
        "skip": skip,
        "limit": limit
    }
