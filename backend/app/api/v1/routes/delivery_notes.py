"""API routes for Delivery Note management (Bons de Livraison)."""
from typing import List, Any, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core import deps
from app.models.user import User
from app.schemas.delivery_note import (
    DeliveryNote,
    DeliveryNoteCreate,
    DeliveryNoteUpdate,
    DeliveryNoteWithItems,
)
from app.crud import delivery_note as dn_crud

router = APIRouter()


@router.get("/", response_model=List[DeliveryNoteWithItems])
def list_delivery_notes(
    db: Session = Depends(deps.get_db_session),
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = Query(None, description="Filter by status"),
    purchase_order_id: Optional[UUID] = Query(None, description="Filter by purchase order"),
    supplier_id: Optional[UUID] = Query(None, description="Filter by supplier"),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Retrieve delivery notes for the current tenant.
    """
    dns = dn_crud.get_multi(
        db,
        tenant_id=current_user.tenant_id,
        skip=skip,
        limit=limit,
        status=status,
        purchase_order_id=purchase_order_id,
        supplier_id=supplier_id,
    )
    return dns


@router.post("/", response_model=DeliveryNoteWithItems, status_code=201)
def create_delivery_note(
    *,
    db: Session = Depends(deps.get_db_session),
    dn_in: DeliveryNoteCreate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Create new delivery note with items.
    """
    dn = dn_crud.create(
        db,
        obj_in=dn_in,
        tenant_id=current_user.tenant_id,
        user_id=current_user.id,
    )
    return dn


@router.get("/{delivery_note_id}", response_model=DeliveryNoteWithItems)
def get_delivery_note(
    *,
    db: Session = Depends(deps.get_db_session),
    delivery_note_id: UUID,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get delivery note by ID.
    """
    dn = dn_crud.get(db, delivery_note_id=delivery_note_id)
    if not dn:
        raise HTTPException(status_code=404, detail="Delivery note not found")
    if dn.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=403, detail="Not authorized to access this delivery note")
    return dn


@router.get("/number/{delivery_number}", response_model=DeliveryNoteWithItems)
def get_delivery_note_by_number(
    *,
    db: Session = Depends(deps.get_db_session),
    delivery_number: str,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get delivery note by delivery number.
    """
    dn = dn_crud.get_by_number(db, delivery_number=delivery_number, tenant_id=current_user.tenant_id)
    if not dn:
        raise HTTPException(status_code=404, detail="Delivery note not found")
    return dn


@router.put("/{delivery_note_id}", response_model=DeliveryNoteWithItems)
def update_delivery_note(
    *,
    db: Session = Depends(deps.get_db_session),
    delivery_note_id: UUID,
    dn_in: DeliveryNoteUpdate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Update a delivery note.
    """
    dn = dn_crud.get(db, delivery_note_id=delivery_note_id)
    if not dn:
        raise HTTPException(status_code=404, detail="Delivery note not found")
    if dn.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this delivery note")

    dn = dn_crud.update(db, db_obj=dn, obj_in=dn_in)
    return dn


@router.delete("/{delivery_note_id}", status_code=204)
def delete_delivery_note(
    *,
    db: Session = Depends(deps.get_db_session),
    delivery_note_id: UUID,
    current_user: User = Depends(deps.get_current_user),
) -> None:
    """
    Delete a delivery note.
    """
    dn = dn_crud.get(db, delivery_note_id=delivery_note_id)
    if not dn:
        raise HTTPException(status_code=404, detail="Delivery note not found")
    if dn.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this delivery note")

    success = dn_crud.delete(db, delivery_note_id=delivery_note_id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete delivery note")


@router.post("/{delivery_note_id}/delivered", response_model=DeliveryNoteWithItems)
def mark_as_delivered(
    *,
    db: Session = Depends(deps.get_db_session),
    delivery_note_id: UUID,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Mark delivery note as delivered.
    """
    dn = dn_crud.get(db, delivery_note_id=delivery_note_id)
    if not dn:
        raise HTTPException(status_code=404, detail="Delivery note not found")
    if dn.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this delivery note")

    dn = dn_crud.mark_as_delivered(db, delivery_note_id=delivery_note_id)
    return dn


class ValidateDeliveryRequest(BaseModel):
    """Request body for validating a delivery."""
    received_by: str
    signature_url: Optional[str] = None


@router.post("/{delivery_note_id}/validate", response_model=DeliveryNoteWithItems)
def validate_delivery(
    *,
    db: Session = Depends(deps.get_db_session),
    delivery_note_id: UUID,
    validation: ValidateDeliveryRequest,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Validate a delivery and update related purchase order quantities.
    This will automatically update the linked purchase order's received quantities.
    """
    dn = dn_crud.get(db, delivery_note_id=delivery_note_id)
    if not dn:
        raise HTTPException(status_code=404, detail="Delivery note not found")
    if dn.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=403, detail="Not authorized to validate this delivery note")

    dn = dn_crud.validate_delivery(
        db,
        delivery_note_id=delivery_note_id,
        received_by=validation.received_by,
        signature_url=validation.signature_url,
    )

    if not dn:
        raise HTTPException(status_code=400, detail="Failed to validate delivery")

    return dn


class RejectDeliveryRequest(BaseModel):
    """Request body for rejecting a delivery."""
    rejection_reason: str


@router.post("/{delivery_note_id}/reject", response_model=DeliveryNoteWithItems)
def reject_delivery(
    *,
    db: Session = Depends(deps.get_db_session),
    delivery_note_id: UUID,
    rejection: RejectDeliveryRequest,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Reject a delivery.
    """
    dn = dn_crud.get(db, delivery_note_id=delivery_note_id)
    if not dn:
        raise HTTPException(status_code=404, detail="Delivery note not found")
    if dn.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=403, detail="Not authorized to reject this delivery note")

    dn = dn_crud.reject_delivery(
        db,
        delivery_note_id=delivery_note_id,
        rejection_reason=rejection.rejection_reason,
    )

    if not dn:
        raise HTTPException(status_code=400, detail="Failed to reject delivery")

    return dn


@router.get("/pending-validation/list", response_model=List[DeliveryNoteWithItems])
def get_pending_validation(
    db: Session = Depends(deps.get_db_session),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get all delivery notes pending validation (delivered but not yet validated).
    """
    dns = dn_crud.get_pending_validation(db, tenant_id=current_user.tenant_id)
    return dns
