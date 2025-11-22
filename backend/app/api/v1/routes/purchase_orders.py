"""API routes for Purchase Order management (Bons de Commande Achat)."""
from typing import List, Any, Optional
from uuid import UUID
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core import deps
from app.models.user import User
from app.schemas.purchase_order import (
    PurchaseOrder,
    PurchaseOrderCreate,
    PurchaseOrderUpdate,
    PurchaseOrderWithItems,
)
from app.crud import purchase_order as po_crud

router = APIRouter()


@router.get("/", response_model=List[PurchaseOrderWithItems])
def list_purchase_orders(
    db: Session = Depends(deps.get_db_session),
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = Query(None, description="Filter by status"),
    supplier_id: Optional[UUID] = Query(None, description="Filter by supplier"),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Retrieve purchase orders for the current tenant.
    """
    pos = po_crud.get_multi(
        db,
        tenant_id=current_user.tenant_id,
        skip=skip,
        limit=limit,
        status=status,
        supplier_id=supplier_id,
    )
    return pos


@router.post("/", response_model=PurchaseOrderWithItems, status_code=201)
def create_purchase_order(
    *,
    db: Session = Depends(deps.get_db_session),
    po_in: PurchaseOrderCreate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Create new purchase order with items.
    """
    po = po_crud.create(
        db,
        obj_in=po_in,
        tenant_id=current_user.tenant_id,
        user_id=current_user.id,
    )
    return po


@router.get("/{po_id}", response_model=PurchaseOrderWithItems)
def get_purchase_order(
    *,
    db: Session = Depends(deps.get_db_session),
    po_id: UUID,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get purchase order by ID.
    """
    po = po_crud.get(db, po_id=po_id)
    if not po:
        raise HTTPException(status_code=404, detail="Purchase order not found")
    if po.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=403, detail="Not authorized to access this purchase order")
    return po


@router.get("/number/{po_number}", response_model=PurchaseOrderWithItems)
def get_purchase_order_by_number(
    *,
    db: Session = Depends(deps.get_db_session),
    po_number: str,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get purchase order by PO number.
    """
    po = po_crud.get_by_number(db, po_number=po_number, tenant_id=current_user.tenant_id)
    if not po:
        raise HTTPException(status_code=404, detail="Purchase order not found")
    return po


@router.put("/{po_id}", response_model=PurchaseOrderWithItems)
def update_purchase_order(
    *,
    db: Session = Depends(deps.get_db_session),
    po_id: UUID,
    po_in: PurchaseOrderUpdate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Update a purchase order.
    """
    po = po_crud.get(db, po_id=po_id)
    if not po:
        raise HTTPException(status_code=404, detail="Purchase order not found")
    if po.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this purchase order")

    po = po_crud.update(db, db_obj=po, obj_in=po_in)
    return po


@router.delete("/{po_id}", status_code=204)
def delete_purchase_order(
    *,
    db: Session = Depends(deps.get_db_session),
    po_id: UUID,
    current_user: User = Depends(deps.get_current_user),
) -> None:
    """
    Delete a purchase order.
    """
    po = po_crud.get(db, po_id=po_id)
    if not po:
        raise HTTPException(status_code=404, detail="Purchase order not found")
    if po.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this purchase order")

    success = po_crud.delete(db, po_id=po_id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete purchase order")


@router.post("/{po_id}/send", response_model=PurchaseOrderWithItems)
def send_purchase_order(
    *,
    db: Session = Depends(deps.get_db_session),
    po_id: UUID,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Mark purchase order as sent to supplier.
    """
    po = po_crud.get(db, po_id=po_id)
    if not po:
        raise HTTPException(status_code=404, detail="Purchase order not found")
    if po.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this purchase order")

    po = po_crud.mark_as_sent(db, po_id=po_id)
    return po


@router.post("/{po_id}/confirm", response_model=PurchaseOrderWithItems)
def confirm_purchase_order(
    *,
    db: Session = Depends(deps.get_db_session),
    po_id: UUID,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Mark purchase order as confirmed by supplier.
    """
    po = po_crud.get(db, po_id=po_id)
    if not po:
        raise HTTPException(status_code=404, detail="Purchase order not found")
    if po.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this purchase order")

    po = po_crud.mark_as_confirmed(db, po_id=po_id)
    return po


class ReceiveQuantityRequest(BaseModel):
    """Request body for updating received quantity."""
    item_id: UUID
    quantity_received: Decimal


@router.post("/{po_id}/receive", response_model=PurchaseOrderWithItems)
def receive_items(
    *,
    db: Session = Depends(deps.get_db_session),
    po_id: UUID,
    receive: ReceiveQuantityRequest,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Update received quantity for a purchase order item.
    This will automatically update the PO status based on fulfillment.
    """
    po = po_crud.get(db, po_id=po_id)
    if not po:
        raise HTTPException(status_code=404, detail="Purchase order not found")
    if po.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this purchase order")

    po = po_crud.update_received_quantity(
        db,
        po_id=po_id,
        item_id=receive.item_id,
        quantity_received=receive.quantity_received,
    )

    if not po:
        raise HTTPException(status_code=400, detail="Failed to update received quantity")

    return po


@router.get("/pending-delivery/list", response_model=List[PurchaseOrderWithItems])
def get_pending_delivery(
    db: Session = Depends(deps.get_db_session),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get all purchase orders pending delivery (sent, confirmed, or partially received).
    """
    pos = po_crud.get_pending_delivery(db, tenant_id=current_user.tenant_id)
    return pos
