"""CRUD operations for Purchase Orders (Bons de Commande Achat)."""
from datetime import date
from decimal import Decimal
from typing import List, Optional
from uuid import UUID

from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

from app.models.purchase_order import PurchaseOrder, PurchaseOrderItem, PurchaseOrderStatus
from app.schemas.purchase_order import PurchaseOrderCreate, PurchaseOrderUpdate


def get(db: Session, po_id: UUID) -> Optional[PurchaseOrder]:
    """Get a purchase order by ID."""
    return db.query(PurchaseOrder).filter(PurchaseOrder.id == po_id).first()


def get_by_number(db: Session, po_number: str, tenant_id: UUID) -> Optional[PurchaseOrder]:
    """Get a purchase order by number within a tenant."""
    return db.query(PurchaseOrder).filter(
        and_(PurchaseOrder.po_number == po_number, PurchaseOrder.tenant_id == tenant_id)
    ).first()


def get_multi(
    db: Session,
    *,
    tenant_id: UUID,
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    supplier_id: Optional[UUID] = None,
) -> List[PurchaseOrder]:
    """Get multiple purchase orders with optional filters."""
    query = db.query(PurchaseOrder).filter(PurchaseOrder.tenant_id == tenant_id)

    if status:
        query = query.filter(PurchaseOrder.status == status)
    if supplier_id:
        query = query.filter(PurchaseOrder.supplier_id == supplier_id)

    return query.order_by(PurchaseOrder.created_at.desc()).offset(skip).limit(limit).all()


def generate_po_number(db: Session, tenant_id: UUID) -> str:
    """Generate next purchase order number for tenant (BC-2024-001)."""
    current_year = date.today().year
    prefix = f"BC-{current_year}-"

    last_po = db.query(PurchaseOrder).filter(
        and_(
            PurchaseOrder.tenant_id == tenant_id,
            PurchaseOrder.po_number.like(f"{prefix}%")
        )
    ).order_by(PurchaseOrder.po_number.desc()).first()

    if last_po:
        last_number = int(last_po.po_number.split("-")[-1])
        new_number = last_number + 1
    else:
        new_number = 1

    return f"{prefix}{new_number:03d}"


def calculate_item_totals(item) -> dict:
    """Calculate totals for a purchase order item."""
    subtotal = item.quantity_ordered * item.unit_price
    discount_amount = subtotal * (item.discount_percentage / Decimal("100"))
    total_ht = subtotal - discount_amount
    total_vat = total_ht * (item.vat_rate / Decimal("100"))
    total_ttc = total_ht + total_vat

    return {
        "subtotal": subtotal,
        "discount_amount": discount_amount,
        "total_ht": total_ht,
        "total_vat": total_vat,
        "total_ttc": total_ttc,
    }


def calculate_po_totals(items: List[PurchaseOrderItem]) -> dict:
    """Calculate totals for the entire purchase order."""
    subtotal_ht = sum(item.subtotal for item in items)
    total_ht = sum(item.total_ht for item in items)
    total_vat = sum(item.total_vat for item in items)
    total_ttc = sum(item.total_ttc for item in items)

    return {
        "subtotal_ht": subtotal_ht,
        "total_ht": total_ht,
        "total_vat": total_vat,
        "total_ttc": total_ttc,
    }


def create(
    db: Session,
    *,
    obj_in: PurchaseOrderCreate,
    tenant_id: UUID,
    user_id: Optional[UUID] = None
) -> PurchaseOrder:
    """Create a new purchase order with items."""
    po_number = generate_po_number(db, tenant_id)

    # Create the purchase order (without items first)
    po_data = obj_in.model_dump(exclude={"items"})
    db_po = PurchaseOrder(
        **po_data,
        po_number=po_number,
        tenant_id=tenant_id,
        user_id=user_id,
        status=PurchaseOrderStatus.DRAFT,
    )

    # Create purchase order items
    for item_in in obj_in.items:
        item_totals = calculate_item_totals(item_in)
        db_item = PurchaseOrderItem(
            **item_in.model_dump(),
            **item_totals,
        )
        db_po.items.append(db_item)

    # Calculate purchase order totals
    db.add(db_po)
    db.flush()

    po_totals = calculate_po_totals(db_po.items)
    for field, value in po_totals.items():
        setattr(db_po, field, value)

    db.commit()
    db.refresh(db_po)
    return db_po


def update(db: Session, *, db_obj: PurchaseOrder, obj_in: PurchaseOrderUpdate) -> PurchaseOrder:
    """Update a purchase order."""
    update_data = obj_in.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(db_obj, field, value)

    # Recalculate totals if items were modified
    if db_obj.items:
        po_totals = calculate_po_totals(db_obj.items)
        for field, value in po_totals.items():
            setattr(db_obj, field, value)

    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def delete(db: Session, *, po_id: UUID) -> bool:
    """Delete a purchase order."""
    po = db.query(PurchaseOrder).filter(PurchaseOrder.id == po_id).first()
    if po:
        db.delete(po)
        db.commit()
        return True
    return False


def change_status(db: Session, *, po_id: UUID, status: PurchaseOrderStatus) -> Optional[PurchaseOrder]:
    """Change purchase order status."""
    po = get(db, po_id)
    if po:
        po.status = status
        db.add(po)
        db.commit()
        db.refresh(po)
    return po


def mark_as_sent(db: Session, *, po_id: UUID) -> Optional[PurchaseOrder]:
    """Mark purchase order as sent to supplier."""
    return change_status(db, po_id=po_id, status=PurchaseOrderStatus.SENT)


def mark_as_confirmed(db: Session, *, po_id: UUID) -> Optional[PurchaseOrder]:
    """Mark purchase order as confirmed by supplier."""
    return change_status(db, po_id=po_id, status=PurchaseOrderStatus.CONFIRMED)


def update_received_quantity(
    db: Session,
    *,
    po_id: UUID,
    item_id: UUID,
    quantity_received: Decimal
) -> Optional[PurchaseOrder]:
    """Update the received quantity for a purchase order item and update PO status."""
    po = get(db, po_id)
    if not po:
        return None

    # Find and update the item
    item = None
    for po_item in po.items:
        if po_item.id == item_id:
            item = po_item
            break

    if not item:
        return None

    item.quantity_received += quantity_received
    db.add(item)

    # Check if all items are fully received
    all_received = True
    partially_received = False

    for po_item in po.items:
        if po_item.quantity_received < po_item.quantity_ordered:
            all_received = False
        if po_item.quantity_received > 0:
            partially_received = True

    # Update PO status
    if all_received:
        po.status = PurchaseOrderStatus.RECEIVED
        po.actual_delivery_date = date.today()
    elif partially_received:
        po.status = PurchaseOrderStatus.PARTIAL

    db.add(po)
    db.commit()
    db.refresh(po)
    return po


def get_pending_delivery(db: Session, *, tenant_id: UUID) -> List[PurchaseOrder]:
    """Get purchase orders pending delivery (sent or confirmed status)."""
    return db.query(PurchaseOrder).filter(
        and_(
            PurchaseOrder.tenant_id == tenant_id,
            or_(
                PurchaseOrder.status == PurchaseOrderStatus.SENT,
                PurchaseOrder.status == PurchaseOrderStatus.CONFIRMED,
                PurchaseOrder.status == PurchaseOrderStatus.PARTIAL
            )
        )
    ).order_by(PurchaseOrder.expected_delivery_date).all()
