"""
API Routes Sales - Alias endpoints pour compatibilité frontend
Redirige vers les vrais endpoints: quotes, sales-invoices, purchase-orders, delivery-notes
"""

from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models.user import User

# Import des services réels
from app.services.quotes import quote_service
from app.services.sales_invoices import sales_invoice_service
from app.services.purchase_orders import purchase_order_service
from app.services.delivery_notes import delivery_note_service

router = APIRouter()

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
    Frontend calls /api/v1/sales/quotes/ → redirects to /quotes/ logic
    """
    return quote_service.get_quotes(
        db=db,
        tenant_id=str(current_user.tenant_id),
        skip=skip,
        limit=limit,
        status=status,
        client_id=client_id
    )


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
    Frontend calls /api/v1/sales/invoices/ → redirects to /sales-invoices/ logic
    """
    return sales_invoice_service.get_invoices(
        db=db,
        tenant_id=str(current_user.tenant_id),
        skip=skip,
        limit=limit,
        status=status,
        client_id=client_id
    )


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
    Frontend calls /api/v1/sales/purchase-orders/ → redirects to /purchase-orders/ logic
    """
    return purchase_order_service.get_purchase_orders(
        db=db,
        tenant_id=str(current_user.tenant_id),
        skip=skip,
        limit=limit,
        status=status,
        supplier_id=supplier_id
    )


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
    Frontend calls /api/v1/sales/delivery-notes/ → redirects to /delivery-notes/ logic
    """
    return delivery_note_service.get_delivery_notes(
        db=db,
        tenant_id=str(current_user.tenant_id),
        skip=skip,
        limit=limit,
        status=status
    )
