"""API routes for Payment Schedule management (Échéanciers de Paiement)."""
from typing import List, Any, Optional
from uuid import UUID
from datetime import date
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core import deps
from app.models.user import User
from app.schemas.treasury import (
    PaymentSchedule,
    PaymentScheduleCreate,
    PaymentScheduleUpdate,
    PaymentScheduleWithDetails,
)
from app.crud import payment_schedule as ps_crud

router = APIRouter()


@router.get("/", response_model=List[PaymentSchedule])
def list_payment_schedules(
    db: Session = Depends(deps.get_db_session),
    skip: int = 0,
    limit: int = 100,
    is_income: Optional[bool] = Query(None, description="Filter by income/expense"),
    status: Optional[str] = Query(None, description="Filter by status"),
    start_date: Optional[date] = Query(None, description="Start date"),
    end_date: Optional[date] = Query(None, description="End date"),
    category: Optional[str] = Query(None, description="Filter by category"),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Retrieve payment schedules for the current tenant.
    """
    schedules = ps_crud.get_multi(
        db,
        tenant_id=current_user.tenant_id,
        skip=skip,
        limit=limit,
        is_income=is_income,
        status=status,
        start_date=start_date,
        end_date=end_date,
        category=category,
    )
    return schedules


@router.post("/", response_model=PaymentSchedule, status_code=201)
def create_payment_schedule(
    *,
    db: Session = Depends(deps.get_db_session),
    schedule_in: PaymentScheduleCreate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Create new payment schedule.
    """
    schedule = ps_crud.create(
        db,
        obj_in=schedule_in,
        tenant_id=current_user.tenant_id,
    )
    return schedule


@router.get("/due-soon", response_model=List[PaymentSchedule])
def get_due_soon(
    db: Session = Depends(deps.get_db_session),
    days: int = Query(7, description="Number of days ahead to check"),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get payment schedules due within the next N days.
    """
    schedules = ps_crud.get_due_soon(db, tenant_id=current_user.tenant_id, days=days)
    return schedules


@router.get("/overdue", response_model=List[PaymentSchedule])
def get_overdue(
    db: Session = Depends(deps.get_db_session),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get overdue payment schedules.
    """
    schedules = ps_crud.get_overdue(db, tenant_id=current_user.tenant_id)
    return schedules


@router.get("/receivables", response_model=List[PaymentSchedule])
def get_receivables(
    db: Session = Depends(deps.get_db_session),
    pending_only: bool = Query(True, description="Only pending/partial/overdue"),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get all receivables (amounts to receive from clients).
    """
    receivables = ps_crud.get_receivables(db, tenant_id=current_user.tenant_id, pending_only=pending_only)
    return receivables


@router.get("/payables", response_model=List[PaymentSchedule])
def get_payables(
    db: Session = Depends(deps.get_db_session),
    pending_only: bool = Query(True, description="Only pending/partial/overdue"),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get all payables (amounts to pay to suppliers).
    """
    payables = ps_crud.get_payables(db, tenant_id=current_user.tenant_id, pending_only=pending_only)
    return payables


@router.get("/totals", response_model=dict)
def get_totals(
    db: Session = Depends(deps.get_db_session),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get total receivables and payables.
    """
    total_receivables = ps_crud.get_total_receivables(db, tenant_id=current_user.tenant_id)
    total_payables = ps_crud.get_total_payables(db, tenant_id=current_user.tenant_id)

    return {
        "total_receivables": total_receivables,
        "total_payables": total_payables,
        "net_position": total_receivables - total_payables,
    }


@router.get("/{schedule_id}", response_model=PaymentSchedule)
def get_payment_schedule(
    *,
    db: Session = Depends(deps.get_db_session),
    schedule_id: UUID,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get payment schedule by ID.
    """
    schedule = ps_crud.get(db, schedule_id=schedule_id)
    if not schedule:
        raise HTTPException(status_code=404, detail="Payment schedule not found")
    if schedule.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=403, detail="Not authorized to access this payment schedule")
    return schedule


@router.put("/{schedule_id}", response_model=PaymentSchedule)
def update_payment_schedule(
    *,
    db: Session = Depends(deps.get_db_session),
    schedule_id: UUID,
    schedule_in: PaymentScheduleUpdate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Update a payment schedule.
    """
    schedule = ps_crud.get(db, schedule_id=schedule_id)
    if not schedule:
        raise HTTPException(status_code=404, detail="Payment schedule not found")
    if schedule.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this payment schedule")

    schedule = ps_crud.update(db, db_obj=schedule, obj_in=schedule_in)
    return schedule


@router.delete("/{schedule_id}", status_code=204)
def delete_payment_schedule(
    *,
    db: Session = Depends(deps.get_db_session),
    schedule_id: UUID,
    current_user: User = Depends(deps.get_current_user),
) -> None:
    """
    Delete a payment schedule.
    """
    schedule = ps_crud.get(db, schedule_id=schedule_id)
    if not schedule:
        raise HTTPException(status_code=404, detail="Payment schedule not found")
    if schedule.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this payment schedule")

    success = ps_crud.delete(db, schedule_id=schedule_id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete payment schedule")


class RecordPaymentRequest(BaseModel):
    """Request body for recording a payment."""
    amount: Decimal
    payment_date: Optional[date] = None
    payment_method: Optional[str] = None
    reference: Optional[str] = None


@router.post("/{schedule_id}/record-payment", response_model=PaymentSchedule)
def record_payment(
    *,
    db: Session = Depends(deps.get_db_session),
    schedule_id: UUID,
    payment: RecordPaymentRequest,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Record a payment against a payment schedule.
    """
    schedule = ps_crud.get(db, schedule_id=schedule_id)
    if not schedule:
        raise HTTPException(status_code=404, detail="Payment schedule not found")
    if schedule.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this payment schedule")

    schedule = ps_crud.record_payment(
        db,
        schedule_id=schedule_id,
        amount=payment.amount,
        payment_date=payment.payment_date,
        payment_method=payment.payment_method,
        reference=payment.reference,
    )

    if not schedule:
        raise HTTPException(status_code=400, detail="Failed to record payment")

    return schedule


@router.post("/{schedule_id}/mark-paid", response_model=PaymentSchedule)
def mark_as_paid(
    *,
    db: Session = Depends(deps.get_db_session),
    schedule_id: UUID,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Mark payment schedule as fully paid.
    """
    schedule = ps_crud.get(db, schedule_id=schedule_id)
    if not schedule:
        raise HTTPException(status_code=404, detail="Payment schedule not found")
    if schedule.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this payment schedule")

    schedule = ps_crud.mark_as_paid(db, schedule_id=schedule_id)
    return schedule


@router.post("/{schedule_id}/cancel", response_model=PaymentSchedule)
def cancel_payment_schedule(
    *,
    db: Session = Depends(deps.get_db_session),
    schedule_id: UUID,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Cancel a payment schedule.
    """
    schedule = ps_crud.get(db, schedule_id=schedule_id)
    if not schedule:
        raise HTTPException(status_code=404, detail="Payment schedule not found")
    if schedule.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=403, detail="Not authorized to cancel this payment schedule")

    schedule = ps_crud.mark_as_cancelled(db, schedule_id=schedule_id)
    return schedule
