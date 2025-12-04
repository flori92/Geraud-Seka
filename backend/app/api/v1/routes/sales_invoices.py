"""API routes for Sales Invoice management (Factures de Vente)."""
from typing import List, Any, Optional
from uuid import UUID
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
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

router = APIRouter()


@router.get("/", response_model=List[SalesInvoiceWithDetails])
def list_invoices(
    db: Session = Depends(deps.get_db_session),
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = Query(None, description="Filter by status"),
    client_id: Optional[UUID] = Query(None, description="Filter by client"),
    payment_status: Optional[str] = Query(None, description="Filter by payment status"),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Retrieve sales invoices for the current tenant.
    """
    try:
        invoices = invoice_crud.get_multi(
            db,
            tenant_id=current_user.tenant_id,
            skip=skip,
            limit=limit,
            status=status,
            client_id=client_id,
            payment_status=payment_status,
        )
        return invoices
    except Exception as e:
        # Return empty list on error
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
