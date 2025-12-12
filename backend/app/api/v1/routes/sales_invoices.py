"""API routes for Sales Invoice management (Factures de Vente)."""
from typing import List, Any, Optional
from uuid import UUID
from decimal import Decimal
from datetime import datetime, date

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from pydantic import BaseModel

from app.core import deps
from app.models.user import User
from app.schemas.sales_invoice import (
    SalesInvoice,
    SalesInvoiceCreate,
    SalesInvoiceUpdate,
    SalesInvoiceWithDetails,
    PaymentCreate,
)
from app.crud import sales_invoice as invoice_crud
from app.services.pdf_generator import PDFGenerator
from app.models.sales_invoice import SalesInvoice as SalesInvoiceModel

router = APIRouter()


@router.get("/", response_model=List[SalesInvoiceWithDetails])
def list_invoices(
    db: Session = Depends(deps.get_db_session),
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = Query(None, description="Filter by status"),
    client_id: Optional[UUID] = Query(None, description="Filter by client"),
    payment_status: Optional[str] = Query(None, description="Filter by payment status"),
    filter: Optional[str] = Query(None, description="Pennylane-style filter: all, to_process, upcoming, overdue, paid"),
    search: Optional[str] = Query(None, description="Search query for invoice number or client name"),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Retrieve sales invoices for the current tenant with Pennylane-style filtering.

    Filters:
    - all: All non-cancelled invoices
    - to_process: Draft or pending invoices
    - upcoming: Invoices with future issue dates
    - overdue: Overdue unpaid invoices
    - paid: Fully paid invoices
    """
    try:
        today = date.today()

        # Base query
        query = db.query(SalesInvoiceModel).filter(
            SalesInvoiceModel.tenant_id == current_user.tenant_id,
            SalesInvoiceModel.status != 'cancelled'
        )

        # Apply Pennylane-style filter
        if filter == 'to_process':
            # Draft or pending (not paid, not overdue)
            query = query.filter(
                or_(
                    SalesInvoiceModel.status == 'draft',
                    and_(
                        SalesInvoiceModel.payment_status.notin_(['paid', 'overpaid']),
                        SalesInvoiceModel.due_date >= today,
                        SalesInvoiceModel.issue_date <= today
                    )
                )
            )
        elif filter == 'upcoming':
            # Future issue date
            query = query.filter(SalesInvoiceModel.issue_date > today)
        elif filter == 'overdue':
            # Overdue and not paid
            query = query.filter(
                SalesInvoiceModel.payment_status.notin_(['paid', 'overpaid']),
                SalesInvoiceModel.due_date < today
            )
        elif filter == 'paid':
            # Fully paid
            query = query.filter(
                or_(
                    SalesInvoiceModel.payment_status == 'paid',
                    SalesInvoiceModel.payment_status == 'overpaid'
                )
            )

        # Apply traditional filters
        if status:
            query = query.filter(SalesInvoiceModel.status == status)
        if client_id:
            query = query.filter(SalesInvoiceModel.client_id == client_id)
        if payment_status:
            query = query.filter(SalesInvoiceModel.payment_status == payment_status)

        # Apply search
        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                or_(
                    SalesInvoiceModel.invoice_number.ilike(search_pattern),
                    SalesInvoiceModel.client_name.ilike(search_pattern)
                )
            )

        # Order by issue date descending
        query = query.order_by(SalesInvoiceModel.issue_date.desc())

        # Apply pagination
        invoices = query.offset(skip).limit(limit).all()

        return invoices
    except Exception as e:
        # Return empty list on error
        print(f"Error fetching invoices: {e}")
        return []


@router.post("/", response_model=SalesInvoiceWithDetails, status_code=201)
def create_invoice(
    *,
    db: Session = Depends(deps.get_db_session),
    invoice_in: SalesInvoiceCreate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Create new sales invoice with items.
    """
    invoice = invoice_crud.create(
        db,
        obj_in=invoice_in,
        tenant_id=current_user.tenant_id,
        user_id=current_user.id,
    )
    return invoice


@router.get("/{invoice_id}", response_model=SalesInvoiceWithDetails)
def get_invoice(
    *,
    db: Session = Depends(deps.get_db_session),
    invoice_id: UUID,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get sales invoice by ID.
    """
    invoice = invoice_crud.get(db, invoice_id=invoice_id)
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    if invoice.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=403, detail="Not authorized to access this invoice")
    return invoice


@router.get("/number/{invoice_number}", response_model=SalesInvoiceWithDetails)
def get_invoice_by_number(
    *,
    db: Session = Depends(deps.get_db_session),
    invoice_number: str,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get sales invoice by invoice number.
    """
    invoice = invoice_crud.get_by_number(db, invoice_number=invoice_number, tenant_id=current_user.tenant_id)
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return invoice


@router.put("/{invoice_id}", response_model=SalesInvoiceWithDetails)
def update_invoice(
    *,
    db: Session = Depends(deps.get_db_session),
    invoice_id: UUID,
    invoice_in: SalesInvoiceUpdate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Update a sales invoice.
    """
    invoice = invoice_crud.get(db, invoice_id=invoice_id)
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    if invoice.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this invoice")

    invoice = invoice_crud.update(db, db_obj=invoice, obj_in=invoice_in)
    return invoice


@router.delete("/{invoice_id}", status_code=204)
def delete_invoice(
    *,
    db: Session = Depends(deps.get_db_session),
    invoice_id: UUID,
    current_user: User = Depends(deps.get_current_user),
) -> None:
    """
    Delete a sales invoice.
    """
    invoice = invoice_crud.get(db, invoice_id=invoice_id)
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    if invoice.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this invoice")

    success = invoice_crud.delete(db, invoice_id=invoice_id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete invoice")


@router.post("/{invoice_id}/send", response_model=SalesInvoiceWithDetails)
def send_invoice(
    *,
    db: Session = Depends(deps.get_db_session),
    invoice_id: UUID,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Mark invoice as sent to client.
    """
    invoice = invoice_crud.get(db, invoice_id=invoice_id)
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    if invoice.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this invoice")

    invoice = invoice_crud.mark_as_sent(db, invoice_id=invoice_id)
    return invoice


@router.post("/{invoice_id}/validate", response_model=SalesInvoiceWithDetails)
def validate_invoice(
    *,
    db: Session = Depends(deps.get_db_session),
    invoice_id: UUID,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Validate invoice (mark as finalized, can no longer be edited).
    """
    invoice = invoice_crud.get(db, invoice_id=invoice_id)
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    if invoice.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=403, detail="Not authorized to validate this invoice")

    invoice = invoice_crud.mark_as_validated(db, invoice_id=invoice_id)
    return invoice


@router.post("/{invoice_id}/cancel", response_model=SalesInvoiceWithDetails)
def cancel_invoice(
    *,
    db: Session = Depends(deps.get_db_session),
    invoice_id: UUID,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Cancel an invoice.
    """
    invoice = invoice_crud.get(db, invoice_id=invoice_id)
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    if invoice.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=403, detail="Not authorized to cancel this invoice")

    invoice = invoice_crud.mark_as_cancelled(db, invoice_id=invoice_id)
    return invoice


class PaymentRequest(BaseModel):
    """Request body for recording a payment."""
    amount: Decimal
    payment_date: str
    payment_method: str
    reference: Optional[str] = None
    notes: Optional[str] = None


@router.post("/{invoice_id}/payments", response_model=SalesInvoiceWithDetails)
def record_payment(
    *,
    db: Session = Depends(deps.get_db_session),
    invoice_id: UUID,
    payment: PaymentRequest,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Record a payment for this invoice.
    """
    invoice = invoice_crud.get(db, invoice_id=invoice_id)
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    if invoice.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=403, detail="Not authorized to record payment for this invoice")

    from datetime import datetime

    invoice = invoice_crud.record_payment(
        db,
        invoice_id=invoice_id,
        amount=payment.amount,
        payment_date=datetime.fromisoformat(payment.payment_date).date(),
        payment_method=payment.payment_method,
        reference=payment.reference,
        notes=payment.notes,
    )

    if not invoice:
        raise HTTPException(status_code=400, detail="Failed to record payment")

    return invoice


@router.get("/overdue/list", response_model=List[SalesInvoiceWithDetails])
def get_overdue_invoices(
    db: Session = Depends(deps.get_db_session),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get all overdue invoices for the current tenant.
    """
    invoices = invoice_crud.get_overdue(db, tenant_id=current_user.tenant_id)
    return invoices


@router.get("/unpaid/list", response_model=List[SalesInvoiceWithDetails])
def get_unpaid_invoices(
    db: Session = Depends(deps.get_db_session),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get all unpaid or partially paid invoices for the current tenant.
    """
    invoices = invoice_crud.get_unpaid(db, tenant_id=current_user.tenant_id)
    return invoices


class InvoiceStatsResponse(BaseModel):
    """Response model for invoice statistics (Pennylane style)."""
    ca_facture: Decimal  # Total invoiced revenue
    ca_paye: Decimal  # Total paid revenue
    factures_retard: int  # Count of overdue invoices
    factures_non_envoyees: int  # Count of unsent invoices
    total_factures: int  # Total invoice count
    factures_a_venir: int  # Upcoming invoices (future issue date)
    factures_en_attente: int  # Pending invoices


@router.get("/stats", response_model=InvoiceStatsResponse)
def get_invoice_stats(
    db: Session = Depends(deps.get_db_session),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get Pennylane-style invoice statistics for dashboard.

    Calculates:
    - CA facturé: Total invoiced amount (all non-cancelled invoices)
    - CA payé: Total paid amount
    - Factures en retard: Count of overdue unpaid invoices
    - Factures non envoyées: Count of invoices not sent to clients
    """
    today = date.today()

    try:
        # Base query for tenant's invoices
        base_query = db.query(SalesInvoiceModel).filter(
            SalesInvoiceModel.tenant_id == current_user.tenant_id,
            SalesInvoiceModel.status != 'cancelled'
        )

        # Total invoiced amount (all non-cancelled invoices)
        ca_facture = db.query(
            func.coalesce(func.sum(SalesInvoiceModel.total_amount), 0)
        ).filter(
            SalesInvoiceModel.tenant_id == current_user.tenant_id,
            SalesInvoiceModel.status != 'cancelled'
        ).scalar() or Decimal('0')

        # Total paid amount (invoices with payment_status = 'paid' or 'overpaid')
        ca_paye = db.query(
            func.coalesce(func.sum(SalesInvoiceModel.paid_amount), 0)
        ).filter(
            SalesInvoiceModel.tenant_id == current_user.tenant_id,
            or_(
                SalesInvoiceModel.payment_status == 'paid',
                SalesInvoiceModel.payment_status == 'overpaid'
            )
        ).scalar() or Decimal('0')

        # Overdue invoices: due_date < today AND payment_status != 'paid'
        factures_retard = db.query(func.count(SalesInvoiceModel.id)).filter(
            SalesInvoiceModel.tenant_id == current_user.tenant_id,
            SalesInvoiceModel.status != 'cancelled',
            SalesInvoiceModel.payment_status.notin_(['paid', 'overpaid']),
            SalesInvoiceModel.due_date < today
        ).scalar() or 0

        # Unsent invoices: sent_at is NULL and status != 'draft'
        factures_non_envoyees = db.query(func.count(SalesInvoiceModel.id)).filter(
            SalesInvoiceModel.tenant_id == current_user.tenant_id,
            SalesInvoiceModel.status != 'cancelled',
            SalesInvoiceModel.status != 'draft',
            SalesInvoiceModel.sent_at.is_(None)
        ).scalar() or 0

        # Total invoices
        total_factures = db.query(func.count(SalesInvoiceModel.id)).filter(
            SalesInvoiceModel.tenant_id == current_user.tenant_id,
            SalesInvoiceModel.status != 'cancelled'
        ).scalar() or 0

        # Upcoming invoices (issue_date > today)
        factures_a_venir = db.query(func.count(SalesInvoiceModel.id)).filter(
            SalesInvoiceModel.tenant_id == current_user.tenant_id,
            SalesInvoiceModel.status != 'cancelled',
            SalesInvoiceModel.issue_date > today
        ).scalar() or 0

        # Pending invoices (not paid, not overdue, issue_date <= today)
        factures_en_attente = db.query(func.count(SalesInvoiceModel.id)).filter(
            SalesInvoiceModel.tenant_id == current_user.tenant_id,
            SalesInvoiceModel.status != 'cancelled',
            SalesInvoiceModel.payment_status.notin_(['paid', 'overpaid']),
            SalesInvoiceModel.due_date >= today,
            SalesInvoiceModel.issue_date <= today
        ).scalar() or 0

        return InvoiceStatsResponse(
            ca_facture=ca_facture,
            ca_paye=ca_paye,
            factures_retard=factures_retard,
            factures_non_envoyees=factures_non_envoyees,
            total_factures=total_factures,
            factures_a_venir=factures_a_venir,
            factures_en_attente=factures_en_attente
        )
    except Exception as e:
        # Return zeros on error rather than failing
        return InvoiceStatsResponse(
            ca_facture=Decimal('0'),
            ca_paye=Decimal('0'),
            factures_retard=0,
            factures_non_envoyees=0,
            total_factures=0,
            factures_a_venir=0,
            factures_en_attente=0
        )


@router.get("/{invoice_id}/pdf")
def generate_invoice_pdf(
    *,
    db: Session = Depends(deps.get_db_session),
    invoice_id: UUID,
    current_user: User = Depends(deps.get_current_user),
) -> FileResponse:
    """
    Generate and download PDF for this invoice.
    """
    invoice = invoice_crud.get(db, invoice_id=invoice_id)
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    if invoice.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=403, detail="Not authorized to access this invoice")

    try:
        pdf_gen = PDFGenerator()
        pdf_path = pdf_gen.generate_invoice_pdf(invoice, current_user.tenant)

        return FileResponse(
            pdf_path,
            media_type='application/pdf',
            filename=f"facture_{invoice.invoice_number}.pdf"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate PDF: {str(e)}")
