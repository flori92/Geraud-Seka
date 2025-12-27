"""CRUD operations for Delivery Notes (Bons de Livraison)."""
from datetime import date
from decimal import Decimal
from typing import List, Optional
from uuid import UUID

from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.models.purchase_order import DeliveryNote, DeliveryNoteItem, DeliveryNoteStatus
from app.schemas.delivery_note import DeliveryNoteCreate, DeliveryNoteUpdate


def get(db: Session, delivery_note_id: UUID) -> Optional[DeliveryNote]:
    """Get a delivery note by ID."""
    return db.query(DeliveryNote).filter(DeliveryNote.id == delivery_note_id).first()


def get_by_number(db: Session, delivery_number: str, tenant_id: UUID) -> Optional[DeliveryNote]:
    """Get a delivery note by number within a tenant."""
    return db.query(DeliveryNote).filter(
        and_(DeliveryNote.delivery_number == delivery_number, DeliveryNote.tenant_id == tenant_id)
    ).first()


def get_multi(
    db: Session,
    *,
    tenant_id: UUID,
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    purchase_order_id: Optional[UUID] = None,
    supplier_id: Optional[UUID] = None,
) -> List[DeliveryNote]:
    """Get multiple delivery notes with optional filters."""
    query = db.query(DeliveryNote).filter(DeliveryNote.tenant_id == tenant_id)

    if status:
        query = query.filter(DeliveryNote.status == status)
    if purchase_order_id:
        query = query.filter(DeliveryNote.purchase_order_id == purchase_order_id)
    if supplier_id:
        query = query.filter(DeliveryNote.supplier_id == supplier_id)

    return query.order_by(DeliveryNote.created_at.desc()).offset(skip).limit(limit).all()


def generate_delivery_number(db: Session, tenant_id: UUID) -> str:
    """Generate next delivery note number for tenant (BL-2024-001)."""
    current_year = date.today().year
    prefix = f"BL-{current_year}-"

    last_dn = db.query(DeliveryNote).filter(
        and_(
            DeliveryNote.tenant_id == tenant_id,
            DeliveryNote.delivery_number.like(f"{prefix}%")
        )
    ).order_by(DeliveryNote.delivery_number.desc()).first()

    if last_dn:
        last_number = int(last_dn.delivery_number.split("-")[-1])
        new_number = last_number + 1
    else:
        new_number = 1

    return f"{prefix}{new_number:03d}"


def create(
    db: Session,
    *,
    obj_in: DeliveryNoteCreate,
    tenant_id: UUID,
    user_id: Optional[UUID] = None
) -> DeliveryNote:
    """Create a new delivery note with items."""
    delivery_number = generate_delivery_number(db, tenant_id)

    dn_data = obj_in.model_dump(exclude={"items"})
    db_dn = DeliveryNote(
        **dn_data,
        delivery_number=delivery_number,
        tenant_id=tenant_id,
        user_id=user_id,
        status=DeliveryNoteStatus.DRAFT,
    )

    for item_in in obj_in.items:
        db_item = DeliveryNoteItem(**item_in.model_dump())
        db_dn.items.append(db_item)

    db.add(db_dn)
    db.commit()
    db.refresh(db_dn)
    return db_dn


def update(db: Session, *, db_obj: DeliveryNote, obj_in: DeliveryNoteUpdate) -> DeliveryNote:
    """Update a delivery note."""
    update_data = obj_in.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(db_obj, field, value)

    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def delete(db: Session, *, delivery_note_id: UUID) -> bool:
    """Delete a delivery note."""
    dn = db.query(DeliveryNote).filter(DeliveryNote.id == delivery_note_id).first()
    if dn:
        db.delete(dn)
        db.commit()
        return True
    return False


def change_status(db: Session, *, delivery_note_id: UUID, status: DeliveryNoteStatus) -> Optional[DeliveryNote]:
    """Change delivery note status."""
    dn = get(db, delivery_note_id)
    if dn:
        dn.status = status
        db.add(dn)
        db.commit()
        db.refresh(dn)
    return dn


def mark_as_delivered(db: Session, *, delivery_note_id: UUID) -> Optional[DeliveryNote]:
    """Mark delivery note as delivered."""
    return change_status(db, delivery_note_id=delivery_note_id, status=DeliveryNoteStatus.DELIVERED)


def validate_delivery(
    db: Session,
    *,
    delivery_note_id: UUID,
    received_by: str,
    signature_url: Optional[str] = None
) -> Optional[DeliveryNote]:
    """Validate a delivery and update related purchase order quantities."""
    from app.crud import purchase_order as po_crud

    dn = get(db, delivery_note_id)
    if not dn:
        return None

    dn.status = DeliveryNoteStatus.VALIDATED
    dn.received_by = received_by
    if signature_url:
        dn.signature_url = signature_url

    db.add(dn)

    if dn.purchase_order_id:
        for item in dn.items:
            if item.purchase_order_item_id and item.quantity_accepted > 0:
                po_crud.update_received_quantity(
                    db,
                    po_id=dn.purchase_order_id,
                    item_id=item.purchase_order_item_id,
                    quantity_received=item.quantity_accepted
                )

    db.commit()
    db.refresh(dn)
    return dn


def reject_delivery(
    db: Session,
    *,
    delivery_note_id: UUID,
    rejection_reason: str
) -> Optional[DeliveryNote]:
    """Reject a delivery."""
    dn = get(db, delivery_note_id)
    if dn:
        dn.status = DeliveryNoteStatus.REJECTED
        dn.notes = f"REJETÉ: {rejection_reason}"
        db.add(dn)
        db.commit()
        db.refresh(dn)
    return dn


def get_pending_validation(db: Session, *, tenant_id: UUID) -> List[DeliveryNote]:
    """Get delivery notes pending validation."""
    return db.query(DeliveryNote).filter(
        and_(
            DeliveryNote.tenant_id == tenant_id,
            DeliveryNote.status == DeliveryNoteStatus.DELIVERED
        )
    ).order_by(DeliveryNote.delivery_date).all()
