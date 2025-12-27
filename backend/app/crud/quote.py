"""CRUD operations for Quotes (Devis)."""
from datetime import date, timedelta
from decimal import Decimal
from typing import List, Optional
from uuid import UUID

from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.models.quote import Quote, QuoteItem, QuoteStatus
from app.schemas.quote import QuoteCreate, QuoteUpdate, QuoteItemCreate


def get(db: Session, quote_id: UUID) -> Optional[Quote]:
    """Get a quote by ID."""
    return db.query(Quote).filter(Quote.id == quote_id).first()


def get_by_number(db: Session, quote_number: str, tenant_id: UUID) -> Optional[Quote]:
    """Get a quote by number within a tenant."""
    return db.query(Quote).filter(
        and_(Quote.quote_number == quote_number, Quote.tenant_id == tenant_id)
    ).first()


def get_multi(
    db: Session,
    *,
    tenant_id: UUID,
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    client_id: Optional[UUID] = None,
) -> List[Quote]:
    """Get multiple quotes with optional filters."""
    query = db.query(Quote).filter(Quote.tenant_id == tenant_id)

    if status:
        query = query.filter(Quote.status == status)
    if client_id:
        query = query.filter(Quote.client_id == client_id)

    return query.order_by(Quote.created_at.desc()).offset(skip).limit(limit).all()


def generate_quote_number(db: Session, tenant_id: UUID) -> str:
    """Generate next quote number for tenant (QUOTE-2024-001)."""
    current_year = date.today().year
    prefix = f"QUOTE-{current_year}-"

    last_quote = db.query(Quote).filter(
        and_(
            Quote.tenant_id == tenant_id,
            Quote.quote_number.like(f"{prefix}%")
        )
    ).order_by(Quote.quote_number.desc()).first()

    if last_quote:
        last_number = int(last_quote.quote_number.split("-")[-1])
        new_number = last_number + 1
    else:
        new_number = 1

    return f"{prefix}{new_number:03d}"


def calculate_item_totals(item: QuoteItemCreate) -> dict:
    """Calculate totals for a quote item."""
    subtotal = item.quantity * item.unit_price
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


def calculate_quote_totals(items: List[QuoteItem]) -> dict:
    """Calculate totals for the entire quote."""
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


def create(db: Session, *, obj_in: QuoteCreate, tenant_id: UUID, user_id: Optional[UUID] = None) -> Quote:
    """Create a new quote with items."""
    quote_number = generate_quote_number(db, tenant_id)

    expiry_date = obj_in.expiry_date or (obj_in.issue_date + timedelta(days=obj_in.validity_days))

    quote_data = obj_in.model_dump(exclude={"items"})
    db_quote = Quote(
        **quote_data,
        quote_number=quote_number,
        tenant_id=tenant_id,
        user_id=user_id,
        expiry_date=expiry_date,
        status=QuoteStatus.DRAFT,
    )

    for item_in in obj_in.items:
        item_totals = calculate_item_totals(item_in)
        db_item = QuoteItem(
            **item_in.model_dump(),
            **item_totals,
        )
        db_quote.items.append(db_item)

    db.add(db_quote)
    db.flush()  # Flush to get the items with calculated totals

    quote_totals = calculate_quote_totals(db_quote.items)
    for field, value in quote_totals.items():
        setattr(db_quote, field, value)

    db.commit()
    db.refresh(db_quote)
    return db_quote


def update(db: Session, *, db_obj: Quote, obj_in: QuoteUpdate) -> Quote:
    """Update a quote."""
    update_data = obj_in.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(db_obj, field, value)

    if db_obj.items:
        quote_totals = calculate_quote_totals(db_obj.items)
        for field, value in quote_totals.items():
            setattr(db_obj, field, value)

    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def delete(db: Session, *, quote_id: UUID) -> bool:
    """Delete a quote."""
    quote = db.query(Quote).filter(Quote.id == quote_id).first()
    if quote:
        db.delete(quote)
        db.commit()
        return True
    return False


def change_status(db: Session, *, quote_id: UUID, status: QuoteStatus) -> Optional[Quote]:
    """Change quote status."""
    quote = get(db, quote_id)
    if quote:
        quote.status = status
        db.add(quote)
        db.commit()
        db.refresh(quote)
    return quote


def mark_as_sent(db: Session, *, quote_id: UUID) -> Optional[Quote]:
    """Mark quote as sent to client."""
    return change_status(db, quote_id=quote_id, status=QuoteStatus.SENT)


def mark_as_accepted(db: Session, *, quote_id: UUID) -> Optional[Quote]:
    """Mark quote as accepted by client."""
    return change_status(db, quote_id=quote_id, status=QuoteStatus.ACCEPTED)


def mark_as_rejected(db: Session, *, quote_id: UUID) -> Optional[Quote]:
    """Mark quote as rejected by client."""
    return change_status(db, quote_id=quote_id, status=QuoteStatus.REJECTED)


def check_and_expire_quotes(db: Session, tenant_id: UUID) -> int:
    """Check and mark expired quotes. Returns count of expired quotes."""
    today = date.today()
    expired_quotes = db.query(Quote).filter(
        and_(
            Quote.tenant_id == tenant_id,
            Quote.status == QuoteStatus.SENT,
            Quote.expiry_date < today
        )
    ).all()

    for quote in expired_quotes:
        quote.status = QuoteStatus.EXPIRED
        db.add(quote)

    db.commit()
    return len(expired_quotes)
