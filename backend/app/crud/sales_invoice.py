"""CRUD operations for Sales Invoices (Factures de Vente) and Payments."""
from datetime import date, timedelta
from decimal import Decimal
from typing import List, Optional
from uuid import UUID

from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

from app.models.sales_invoice import SalesInvoice, SalesInvoiceItem, Payment, PaymentStatus
from app.models.quote import Quote, QuoteStatus
from app.schemas.sales_invoice import (
    SalesInvoiceCreate,
    SalesInvoiceUpdate,
    PaymentCreate,
)


def get(db: Session, invoice_id: UUID) -> Optional[SalesInvoice]:
    """Get a sales invoice by ID."""
    return db.query(SalesInvoice).filter(SalesInvoice.id == invoice_id).first()


def get_by_number(db: Session, invoice_number: str, tenant_id: UUID) -> Optional[SalesInvoice]:
    """Get an invoice by number within a tenant."""
    return db.query(SalesInvoice).filter(
        and_(SalesInvoice.invoice_number == invoice_number, SalesInvoice.tenant_id == tenant_id)
    ).first()


def get_multi(
    db: Session,
    *,
    tenant_id: UUID,
    skip: int = 0,
    limit: int = 100,
    payment_status: Optional[str] = None,
    client_id: Optional[UUID] = None,
) -> List[SalesInvoice]:
    """Get multiple invoices with optional filters."""
    query = db.query(SalesInvoice).filter(SalesInvoice.tenant_id == tenant_id)

    if payment_status:
        query = query.filter(SalesInvoice.payment_status == payment_status)
    if client_id:
        query = query.filter(SalesInvoice.client_id == client_id)

    return query.order_by(SalesInvoice.created_at.desc()).offset(skip).limit(limit).all()


def generate_invoice_number(db: Session, tenant_id: UUID) -> str:
    """Generate next invoice number for tenant (FAC-2024-001)."""
    current_year = date.today().year
    prefix = f"FAC-{current_year}-"

    last_invoice = db.query(SalesInvoice).filter(
        and_(
            SalesInvoice.tenant_id == tenant_id,
            SalesInvoice.invoice_number.like(f"{prefix}%")
        )
    ).order_by(SalesInvoice.invoice_number.desc()).first()

    if last_invoice:
        last_number = int(last_invoice.invoice_number.split("-")[-1])
        new_number = last_number + 1
    else:
        new_number = 1

    return f"{prefix}{new_number:03d}"


def calculate_item_totals(item) -> dict:
    """Calculate totals for an invoice item."""
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


def calculate_invoice_totals(items: List[SalesInvoiceItem]) -> dict:
    """Calculate totals for the entire invoice."""
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
    obj_in: SalesInvoiceCreate,
    tenant_id: UUID,
    user_id: Optional[UUID] = None
) -> SalesInvoice:
    """Create a new sales invoice with items."""
    invoice_number = generate_invoice_number(db, tenant_id)

    invoice_data = obj_in.model_dump(exclude={"items"})
    db_invoice = SalesInvoice(
        **invoice_data,
        invoice_number=invoice_number,
        tenant_id=tenant_id,
        user_id=user_id,
        payment_status=PaymentStatus.UNPAID,
    )

    for item_in in obj_in.items:
        item_totals = calculate_item_totals(item_in)
        db_item = SalesInvoiceItem(
            **item_in.model_dump(),
            **item_totals,
        )
        db_invoice.items.append(db_item)

    db.add(db_invoice)
    db.flush()

    invoice_totals = calculate_invoice_totals(db_invoice.items)
    for field, value in invoice_totals.items():
        setattr(db_invoice, field, value)

    db_invoice.balance_due = db_invoice.total_ttc

    db.commit()
    db.refresh(db_invoice)
    return db_invoice


def convert_from_quote(db: Session, *, quote_id: UUID, due_days: int = 30) -> Optional[SalesInvoice]:
    """Convert an accepted quote to a sales invoice."""
    quote = db.query(Quote).filter(Quote.id == quote_id).first()

    if not quote or quote.status != QuoteStatus.ACCEPTED:
        return None

    invoice_data = {
        "title": quote.title,
        "description": quote.description,
        "client_id": quote.client_id,
        "quote_id": quote.id,
        "issue_date": date.today(),
        "due_date": date.today() + timedelta(days=due_days),
        "discount_percentage": quote.discount_percentage,
        "discount_amount": quote.discount_amount,
        "payment_terms": quote.payment_terms,
        "internal_notes": quote.internal_notes,
        "customer_notes": quote.customer_notes,
        "currency": quote.currency,
    }

    invoice_number = generate_invoice_number(db, quote.tenant_id)

    db_invoice = SalesInvoice(
        **invoice_data,
        invoice_number=invoice_number,
        tenant_id=quote.tenant_id,
        user_id=quote.user_id,
        payment_status=PaymentStatus.UNPAID,
    )

    for quote_item in quote.items:
        db_item = SalesInvoiceItem(
            description=quote_item.description,
            quantity=quote_item.quantity,
            unit_price=quote_item.unit_price,
            discount_percentage=quote_item.discount_percentage,
            vat_rate=quote_item.vat_rate,
            product_id=quote_item.product_id,
            position=quote_item.position,
            subtotal=quote_item.subtotal,
            discount_amount=quote_item.discount_amount,
            total_ht=quote_item.total_ht,
            total_vat=quote_item.total_vat,
            total_ttc=quote_item.total_ttc,
        )
        db_invoice.items.append(db_item)

    db.add(db_invoice)
    db.flush()

    db_invoice.subtotal_ht = quote.subtotal_ht
    db_invoice.total_ht = quote.total_ht
    db_invoice.total_vat = quote.total_vat
    db_invoice.total_ttc = quote.total_ttc
    db_invoice.balance_due = quote.total_ttc

    quote.status = QuoteStatus.CONVERTED
    quote.sales_invoice_id = db_invoice.id
    db.add(quote)

    db.commit()
    db.refresh(db_invoice)
    return db_invoice


def update(db: Session, *, db_obj: SalesInvoice, obj_in: SalesInvoiceUpdate) -> SalesInvoice:
    """Update a sales invoice."""
    update_data = obj_in.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(db_obj, field, value)

    if db_obj.items:
        invoice_totals = calculate_invoice_totals(db_obj.items)
        for field, value in invoice_totals.items():
            setattr(db_obj, field, value)

    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def delete(db: Session, *, invoice_id: UUID) -> bool:
    """Delete an invoice."""
    invoice = db.query(SalesInvoice).filter(SalesInvoice.id == invoice_id).first()
    if invoice:
        db.delete(invoice)
        db.commit()
        return True
    return False



def record_payment(
    db: Session,
    *,
    invoice_id: UUID,
    payment_in: PaymentCreate,
    tenant_id: UUID
) -> Optional[SalesInvoice]:
    """Record a payment for an invoice and update payment status."""
    invoice = get(db, invoice_id)
    if not invoice:
        return None

    db_payment = Payment(
        **payment_in.model_dump(exclude={"sales_invoice_id"}),
        sales_invoice_id=invoice_id,
        tenant_id=tenant_id,
    )
    db.add(db_payment)
    db.flush()

    invoice.paid_amount += payment_in.amount
    invoice.balance_due = invoice.total_ttc - invoice.paid_amount

    if invoice.balance_due <= Decimal("0"):
        invoice.payment_status = PaymentStatus.PAID
        invoice.payment_date = date.today()
    elif invoice.paid_amount > Decimal("0"):
        invoice.payment_status = PaymentStatus.PARTIAL
    else:
        invoice.payment_status = PaymentStatus.UNPAID

    db.add(invoice)
    db.commit()
    db.refresh(invoice)
    return invoice


def calculate_balance(db: Session, *, invoice_id: UUID) -> Optional[Decimal]:
    """Calculate and return the balance due for an invoice."""
    invoice = get(db, invoice_id)
    if invoice:
        total_payments = sum(payment.amount for payment in invoice.payments)
        return invoice.total_ttc - total_payments
    return None


def get_overdue_invoices(db: Session, *, tenant_id: UUID) -> List[SalesInvoice]:
    """Get all overdue unpaid/partial invoices."""
    today = date.today()
    return db.query(SalesInvoice).filter(
        and_(
            SalesInvoice.tenant_id == tenant_id,
            SalesInvoice.due_date < today,
            or_(
                SalesInvoice.payment_status == PaymentStatus.UNPAID,
                SalesInvoice.payment_status == PaymentStatus.PARTIAL
            )
        )
    ).all()


def mark_overdue_invoices(db: Session, *, tenant_id: UUID) -> int:
    """Mark overdue invoices and calculate late fees if enabled. Returns count."""
    overdue_invoices = get_overdue_invoices(db, tenant_id=tenant_id)

    for invoice in overdue_invoices:
        invoice.payment_status = PaymentStatus.OVERDUE

        if invoice.late_fee_enabled and invoice.late_fee_percentage > 0:
            days_overdue = (date.today() - invoice.due_date).days
            if days_overdue > 0:
                late_fee = invoice.total_ttc * (invoice.late_fee_percentage / Decimal("100"))
                invoice.late_fee_amount = late_fee
                invoice.balance_due = invoice.total_ttc - invoice.paid_amount + late_fee

        db.add(invoice)

    db.commit()
    return len(overdue_invoices)


def send_reminder(db: Session, *, invoice_id: UUID) -> Optional[SalesInvoice]:
    """Record that a payment reminder was sent."""
    invoice = get(db, invoice_id)
    if invoice:
        invoice.reminder_sent_count += 1
        invoice.last_reminder_sent = date.today()
        db.add(invoice)
        db.commit()
        db.refresh(invoice)
    return invoice
