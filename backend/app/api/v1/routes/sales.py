"""
API Routes Sales - Alias endpoints pour compatibilité frontend
Utilise les vrais services pour queries DB multi-tenant
"""

from typing import Any, List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.quote import Quote
from app.models.sales_invoice import SalesInvoice
from app.models.purchase_order import PurchaseOrder, DeliveryNote
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
    Frontend calls /api/v1/sales/quotes/ → uses real DB queries
    """
    client_uuid: Optional[UUID] = None
    if client_id:
        try:
            client_uuid = UUID(client_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="client_id invalide")

    quotes = quote_service.get_quotes(
        db=db,
        tenant_id=current_user.tenant_id,
        skip=skip,
        limit=limit,
        status=status,
        client_id=client_uuid
    )

    # Count total quotes for pagination
    query = db.query(Quote).filter(Quote.tenant_id == current_user.tenant_id)
    if status:
        query = query.filter(Quote.status == status)
    if client_uuid:
        query = query.filter(Quote.client_id == client_uuid)
    total = query.count()

    return {
        "quotes": quotes,
        "total": total,
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
    Frontend calls /api/v1/sales/invoices/ → uses real DB queries
    """
    invoices = sales_invoice_service.get_invoices(
        db=db,
        tenant_id=str(current_user.tenant_id),
        skip=skip,
        limit=limit,
        status=status,
        client_id=client_id
    )

    # Count total invoices for pagination
    query = db.query(SalesInvoice).filter(SalesInvoice.tenant_id == str(current_user.tenant_id))
    if status:
        query = query.filter(SalesInvoice.status == status)
    if client_id:
        query = query.filter(SalesInvoice.client_id == client_id)
    total = query.count()

    return {
        "invoices": invoices,
        "total": total,
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
    Frontend calls /api/v1/sales/purchase-orders/ → uses real DB queries
    """
    orders = purchase_order_service.get_purchase_orders(
        db=db,
        tenant_id=str(current_user.tenant_id),
        skip=skip,
        limit=limit,
        status=status,
        supplier_id=supplier_id
    )

    # Count total purchase orders for pagination
    query = db.query(PurchaseOrder).filter(PurchaseOrder.tenant_id == str(current_user.tenant_id))
    if status:
        query = query.filter(PurchaseOrder.status == status)
    if supplier_id:
        query = query.filter(PurchaseOrder.supplier_id == supplier_id)
    total = query.count()

    return {
        "purchase_orders": orders,
        "total": total,
        "skip": skip,
        "limit": limit
    }


# ==================== DELIVERY NOTES ALIASES ====================

@router.get("/delivery-notes/")
async def get_delivery_notes_alias(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    status: Optional[str] = Query(None),
    purchase_order_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Alias endpoint for GET /delivery-notes/
    Frontend calls /api/v1/sales/delivery-notes/ → uses real DB queries
    """
    notes = delivery_note_service.get_delivery_notes(
        db=db,
        tenant_id=str(current_user.tenant_id),
        skip=skip,
        limit=limit,
        status=status,
        purchase_order_id=purchase_order_id
    )

    # Count total delivery notes for pagination
    query = db.query(DeliveryNote).filter(DeliveryNote.tenant_id == str(current_user.tenant_id))
    if status:
        query = query.filter(DeliveryNote.status == status)
    if purchase_order_id:
        query = query.filter(DeliveryNote.purchase_order_id == purchase_order_id)
    total = query.count()

    return {
        "delivery_notes": notes,
        "total": total,
        "skip": skip,
        "limit": limit
    }
