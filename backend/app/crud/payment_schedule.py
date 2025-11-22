"""CRUD operations for Payment Schedules."""
from typing import List, Optional
from uuid import UUID
from decimal import Decimal
from datetime import date, timedelta

from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

from app.models.treasury import PaymentSchedule
from app.schemas.treasury import PaymentScheduleCreate, PaymentScheduleUpdate


def get(db: Session, schedule_id: UUID) -> Optional[PaymentSchedule]:
    """Get a payment schedule by ID."""
    return db.query(PaymentSchedule).filter(PaymentSchedule.id == schedule_id).first()


def get_multi(
    db: Session,
    *,
    tenant_id: UUID,
    skip: int = 0,
    limit: int = 100,
    is_income: Optional[bool] = None,
    status: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    category: Optional[str] = None,
) -> List[PaymentSchedule]:
    """Get multiple payment schedules with optional filters."""
    query = db.query(PaymentSchedule).filter(PaymentSchedule.tenant_id == tenant_id)

    if is_income is not None:
        query = query.filter(PaymentSchedule.is_income == is_income)
    if status:
        query = query.filter(PaymentSchedule.status == status)
    if start_date:
        query = query.filter(PaymentSchedule.due_date >= start_date)
    if end_date:
        query = query.filter(PaymentSchedule.due_date <= end_date)
    if category:
        query = query.filter(PaymentSchedule.category == category)

    return query.order_by(PaymentSchedule.due_date).offset(skip).limit(limit).all()


def create(
    db: Session,
    *,
    obj_in: PaymentScheduleCreate,
    tenant_id: UUID,
) -> PaymentSchedule:
    """Create a new payment schedule."""
    db_schedule = PaymentSchedule(
        **obj_in.model_dump(),
        tenant_id=tenant_id,
        paid_amount=Decimal("0.00"),
        remaining_amount=obj_in.total_amount,
    )

    db.add(db_schedule)
    db.commit()
    db.refresh(db_schedule)
    return db_schedule


def update(db: Session, *, db_obj: PaymentSchedule, obj_in: PaymentScheduleUpdate) -> PaymentSchedule:
    """Update a payment schedule."""
    update_data = obj_in.model_dump(exclude_unset=True)

    # Recalculate remaining_amount if total_amount or paid_amount changed
    new_total = update_data.get("total_amount", db_obj.total_amount)
    new_paid = db_obj.paid_amount  # paid_amount can only be updated via record_payment

    for field, value in update_data.items():
        setattr(db_obj, field, value)

    db_obj.remaining_amount = new_total - new_paid

    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def delete(db: Session, *, schedule_id: UUID) -> bool:
    """Delete a payment schedule."""
    schedule = db.query(PaymentSchedule).filter(PaymentSchedule.id == schedule_id).first()
    if schedule:
        db.delete(schedule)
        db.commit()
        return True
    return False


def record_payment(
    db: Session,
    *,
    schedule_id: UUID,
    amount: Decimal,
    payment_date: Optional[date] = None,
    payment_method: Optional[str] = None,
    reference: Optional[str] = None,
) -> Optional[PaymentSchedule]:
    """Record a payment against a schedule."""
    schedule = get(db, schedule_id)
    if not schedule:
        return None

    # Update paid amount
    schedule.paid_amount += amount
    schedule.remaining_amount = schedule.total_amount - schedule.paid_amount

    # Update payment info
    if payment_date:
        schedule.payment_date = payment_date
    if payment_method:
        schedule.payment_method = payment_method
    if reference:
        schedule.reference = reference

    # Update status based on payment
    if schedule.remaining_amount <= 0:
        schedule.status = "paid"
    elif schedule.paid_amount > 0:
        schedule.status = "partial"

    db.add(schedule)
    db.commit()
    db.refresh(schedule)
    return schedule


def mark_as_paid(db: Session, *, schedule_id: UUID, payment_date: Optional[date] = None) -> Optional[PaymentSchedule]:
    """Mark a payment schedule as fully paid."""
    schedule = get(db, schedule_id)
    if schedule:
        schedule.status = "paid"
        schedule.paid_amount = schedule.total_amount
        schedule.remaining_amount = Decimal("0.00")
        schedule.payment_date = payment_date or date.today()
        db.add(schedule)
        db.commit()
        db.refresh(schedule)
    return schedule


def mark_as_cancelled(db: Session, *, schedule_id: UUID) -> Optional[PaymentSchedule]:
    """Mark a payment schedule as cancelled."""
    schedule = get(db, schedule_id)
    if schedule:
        schedule.status = "cancelled"
        db.add(schedule)
        db.commit()
        db.refresh(schedule)
    return schedule


def get_due_soon(db: Session, *, tenant_id: UUID, days: int = 7) -> List[PaymentSchedule]:
    """Get payment schedules due within the next N days."""
    today = date.today()
    end_date = today + timedelta(days=days)

    return db.query(PaymentSchedule).filter(
        and_(
            PaymentSchedule.tenant_id == tenant_id,
            PaymentSchedule.status.in_(["pending", "partial"]),
            PaymentSchedule.due_date >= today,
            PaymentSchedule.due_date <= end_date
        )
    ).order_by(PaymentSchedule.due_date).all()


def get_overdue(db: Session, *, tenant_id: UUID) -> List[PaymentSchedule]:
    """Get overdue payment schedules."""
    today = date.today()

    # Update status to overdue for unpaid schedules past due date
    db.query(PaymentSchedule).filter(
        and_(
            PaymentSchedule.tenant_id == tenant_id,
            PaymentSchedule.status.in_(["pending", "partial"]),
            PaymentSchedule.due_date < today
        )
    ).update({"status": "overdue"})

    db.commit()

    return db.query(PaymentSchedule).filter(
        and_(
            PaymentSchedule.tenant_id == tenant_id,
            PaymentSchedule.status == "overdue"
        )
    ).order_by(PaymentSchedule.due_date).all()


def get_receivables(db: Session, *, tenant_id: UUID, pending_only: bool = True) -> List[PaymentSchedule]:
    """Get receivables (amounts to receive)."""
    query = db.query(PaymentSchedule).filter(
        and_(
            PaymentSchedule.tenant_id == tenant_id,
            PaymentSchedule.is_income == True
        )
    )

    if pending_only:
        query = query.filter(PaymentSchedule.status.in_(["pending", "partial", "overdue"]))

    return query.order_by(PaymentSchedule.due_date).all()


def get_payables(db: Session, *, tenant_id: UUID, pending_only: bool = True) -> List[PaymentSchedule]:
    """Get payables (amounts to pay)."""
    query = db.query(PaymentSchedule).filter(
        and_(
            PaymentSchedule.tenant_id == tenant_id,
            PaymentSchedule.is_income == False
        )
    )

    if pending_only:
        query = query.filter(PaymentSchedule.status.in_(["pending", "partial", "overdue"]))

    return query.order_by(PaymentSchedule.due_date).all()


def get_total_receivables(db: Session, *, tenant_id: UUID) -> Decimal:
    """Get total pending receivables."""
    result = db.query(PaymentSchedule).filter(
        and_(
            PaymentSchedule.tenant_id == tenant_id,
            PaymentSchedule.is_income == True,
            PaymentSchedule.status.in_(["pending", "partial", "overdue"])
        )
    ).all()

    total = sum(schedule.remaining_amount for schedule in result)
    return Decimal(str(total))


def get_total_payables(db: Session, *, tenant_id: UUID) -> Decimal:
    """Get total pending payables."""
    result = db.query(PaymentSchedule).filter(
        and_(
            PaymentSchedule.tenant_id == tenant_id,
            PaymentSchedule.is_income == False,
            PaymentSchedule.status.in_(["pending", "partial", "overdue"])
        )
    ).all()

    total = sum(schedule.remaining_amount for schedule in result)
    return Decimal(str(total))


def create_recurring_schedules(db: Session, *, template_schedule_id: UUID) -> List[PaymentSchedule]:
    """Create recurring payment schedules based on a template."""
    template = get(db, template_schedule_id)
    if not template or not template.is_recurring:
        return []

    created_schedules = []
    current_due_date = template.due_date

    # Determine increment based on recurrence pattern
    if template.recurrence_pattern == "monthly":
        increment = timedelta(days=30)
    elif template.recurrence_pattern == "quarterly":
        increment = timedelta(days=90)
    elif template.recurrence_pattern == "yearly":
        increment = timedelta(days=365)
    else:
        return []

    # Create schedules until recurrence end date
    while current_due_date <= template.recurrence_end_date:
        current_due_date += increment

        if current_due_date > template.recurrence_end_date:
            break

        # Create new schedule based on template
        new_schedule_data = PaymentScheduleCreate(
            description=template.description,
            is_income=template.is_income,
            total_amount=template.total_amount,
            currency=template.currency,
            due_date=current_due_date,
            counterparty_name=template.counterparty_name,
            counterparty_reference=template.counterparty_reference,
            payment_method=template.payment_method,
            category=template.category,
            is_recurring=False,  # Don't make the copies recurring
            send_reminder=template.send_reminder,
            reminder_days_before=template.reminder_days_before,
            notes=template.notes,
            sales_invoice_id=template.sales_invoice_id,
            purchase_order_id=template.purchase_order_id,
            bank_account_id=template.bank_account_id,
        )

        new_schedule = create(db, obj_in=new_schedule_data, tenant_id=template.tenant_id)
        created_schedules.append(new_schedule)

    return created_schedules
