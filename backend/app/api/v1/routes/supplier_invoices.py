"""API routes for Supplier Invoice management (Factures Fournisseurs) with Pennylane-style workflow."""
from typing import List, Any, Optional
from uuid import UUID
from decimal import Decimal
from datetime import datetime, date

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from pydantic import BaseModel

from app.core import deps
from app.models.user import User

router = APIRouter()


# Pydantic Models
class SupplierInvoiceBase(BaseModel):
    """Base model for supplier invoices."""
    supplier_id: UUID
    supplier_name: str
    number: str
    invoice_date: date
    due_date: date
    amount: Decimal
    tax_amount: Decimal
    total_amount: Decimal
    currency: str = "XOF"
    notes: Optional[str] = None


class SupplierInvoiceCreate(SupplierInvoiceBase):
    """Model for creating a supplier invoice."""
    pass


class SupplierInvoiceUpdate(BaseModel):
    """Model for updating a supplier invoice."""
    supplier_id: Optional[UUID] = None
    supplier_name: Optional[str] = None
    number: Optional[str] = None
    invoice_date: Optional[date] = None
    due_date: Optional[date] = None
    amount: Optional[Decimal] = None
    tax_amount: Optional[Decimal] = None
    total_amount: Optional[Decimal] = None
    notes: Optional[str] = None


class SupplierInvoice(SupplierInvoiceBase):
    """Model for returning supplier invoice data."""
    id: UUID
    workflow_status: str  # inbox, to_approve, to_pay, paid, rejected
    payment_status: str  # unpaid, partial, paid, overpaid
    received_at: datetime
    approved_at: Optional[datetime] = None
    approved_by: Optional[str] = None
    payment_date: Optional[date] = None
    has_attachment: bool = False
    ocr_processed: bool = False
    created_at: datetime

    class Config:
        from_attributes = True


class SupplierInvoiceStatsResponse(BaseModel):
    """Response model for supplier invoice statistics (Pennylane style)."""
    a_payer: Decimal  # Amount to pay
    paye: Decimal  # Amount paid
    factures_retard: int  # Overdue invoices count
    en_attente_approbation: int  # Awaiting approval count
    total_factures: int  # Total invoice count
    inbox_count: int  # Inbox invoices count


# Mock data store (replace with actual database queries)
# In production, this would use SQLAlchemy models
_supplier_invoices_store = []


@router.get("/", response_model=List[SupplierInvoice])
def list_supplier_invoices(
    db: Session = Depends(deps.get_db_session),
    skip: int = 0,
    limit: int = 100,
    workflow_status: Optional[str] = Query(None, description="Filter by workflow status: inbox, to_approve, to_pay, paid"),
    supplier_id: Optional[UUID] = Query(None, description="Filter by supplier"),
    search: Optional[str] = Query(None, description="Search query for invoice number or supplier name"),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Retrieve supplier invoices with Pennylane-style workflow filtering.

    Workflow statuses:
    - inbox: Newly received invoices awaiting categorization
    - to_approve: Invoices awaiting approval
    - to_pay: Approved invoices ready for payment
    - paid: Invoices that have been paid
    - rejected: Rejected invoices
    """
    # For now, return mock data
    # In production, replace with actual database queries
    invoices = []

    # Mock invoice for demo
    if len(_supplier_invoices_store) == 0:
        mock_invoice = {
            "id": "550e8400-e29b-41d4-a716-446655440000",
            "supplier_id": "550e8400-e29b-41d4-a716-446655440001",
            "supplier_name": "Fournisseur Test",
            "number": "FA2024-001",
            "invoice_date": date.today(),
            "due_date": date.today(),
            "amount": Decimal("100000"),
            "tax_amount": Decimal("18000"),
            "total_amount": Decimal("118000"),
            "currency": "XOF",
            "workflow_status": "inbox",
            "payment_status": "unpaid",
            "received_at": datetime.now(),
            "has_attachment": True,
            "ocr_processed": True,
            "created_at": datetime.now()
        }
        invoices = [SupplierInvoice(**mock_invoice)]
    else:
        invoices = _supplier_invoices_store

    # Apply filters
    if workflow_status:
        invoices = [inv for inv in invoices if inv.workflow_status == workflow_status]

    if supplier_id:
        invoices = [inv for inv in invoices if str(inv.supplier_id) == str(supplier_id)]

    if search:
        search_lower = search.lower()
        invoices = [
            inv for inv in invoices
            if search_lower in inv.number.lower() or search_lower in inv.supplier_name.lower()
        ]

    return invoices[skip:skip + limit]


@router.post("/", response_model=SupplierInvoice, status_code=201)
def create_supplier_invoice(
    *,
    db: Session = Depends(deps.get_db_session),
    invoice_in: SupplierInvoiceCreate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Create a new supplier invoice.
    Initial workflow_status is 'inbox'.
    """
    # In production, create in database
    # For now, add to mock store
    new_invoice = SupplierInvoice(
        id=UUID("550e8400-e29b-41d4-a716-446655440000"),
        **invoice_in.dict(),
        workflow_status="inbox",
        payment_status="unpaid",
        received_at=datetime.now(),
        has_attachment=False,
        ocr_processed=False,
        created_at=datetime.now()
    )
    _supplier_invoices_store.append(new_invoice)
    return new_invoice


@router.get("/stats", response_model=SupplierInvoiceStatsResponse)
def get_supplier_invoice_stats(
    db: Session = Depends(deps.get_db_session),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get Pennylane-style supplier invoice statistics for dashboard.

    Calculates:
    - À payer: Total amount for invoices in 'to_pay' status
    - Payé: Total amount for invoices in 'paid' status
    - Factures en retard: Count of overdue unpaid invoices
    - En attente d'approbation: Count of invoices in 'to_approve' status
    """
    today = date.today()

    try:
        # For mock data, calculate from store
        invoices = _supplier_invoices_store if _supplier_invoices_store else []

        # In production, use database queries like this:
        # base_query = db.query(SupplierInvoiceModel).filter(
        #     SupplierInvoiceModel.tenant_id == current_user.tenant_id,
        #     SupplierInvoiceModel.workflow_status != 'rejected'
        # )

        # Amount to pay (workflow_status = 'to_pay')
        a_payer = sum(
            inv.total_amount for inv in invoices
            if inv.workflow_status == 'to_pay'
        )

        # Amount paid (workflow_status = 'paid')
        paye = sum(
            inv.total_amount for inv in invoices
            if inv.workflow_status == 'paid'
        )

        # Overdue invoices count
        factures_retard = len([
            inv for inv in invoices
            if inv.due_date < today and inv.workflow_status not in ['paid', 'rejected']
        ])

        # Awaiting approval count
        en_attente_approbation = len([
            inv for inv in invoices
            if inv.workflow_status == 'to_approve'
        ])

        # Total invoices
        total_factures = len([
            inv for inv in invoices
            if inv.workflow_status != 'rejected'
        ])

        # Inbox count
        inbox_count = len([
            inv for inv in invoices
            if inv.workflow_status == 'inbox'
        ])

        return SupplierInvoiceStatsResponse(
            a_payer=Decimal(str(a_payer)),
            paye=Decimal(str(paye)),
            factures_retard=factures_retard,
            en_attente_approbation=en_attente_approbation,
            total_factures=total_factures,
            inbox_count=inbox_count
        )
    except Exception as e:
        # Return zeros on error
        return SupplierInvoiceStatsResponse(
            a_payer=Decimal('0'),
            paye=Decimal('0'),
            factures_retard=0,
            en_attente_approbation=0,
            total_factures=0,
            inbox_count=0
        )


@router.get("/{invoice_id}", response_model=SupplierInvoice)
def get_supplier_invoice(
    *,
    db: Session = Depends(deps.get_db_session),
    invoice_id: UUID,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get supplier invoice by ID.
    """
    # In production, fetch from database
    for inv in _supplier_invoices_store:
        if str(inv.id) == str(invoice_id):
            return inv
    raise HTTPException(status_code=404, detail="Supplier invoice not found")


@router.put("/{invoice_id}", response_model=SupplierInvoice)
def update_supplier_invoice(
    *,
    db: Session = Depends(deps.get_db_session),
    invoice_id: UUID,
    invoice_in: SupplierInvoiceUpdate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Update a supplier invoice.
    """
    # In production, update in database
    for idx, inv in enumerate(_supplier_invoices_store):
        if str(inv.id) == str(invoice_id):
            # Update fields
            update_data = invoice_in.dict(exclude_unset=True)
            for field, value in update_data.items():
                setattr(inv, field, value)
            return inv
    raise HTTPException(status_code=404, detail="Supplier invoice not found")


@router.post("/{invoice_id}/approve", response_model=SupplierInvoice)
def approve_supplier_invoice(
    *,
    db: Session = Depends(deps.get_db_session),
    invoice_id: UUID,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Approve a supplier invoice.
    Moves workflow_status from 'to_approve' to 'to_pay'.
    """
    for inv in _supplier_invoices_store:
        if str(inv.id) == str(invoice_id):
            if inv.workflow_status != 'to_approve':
                raise HTTPException(
                    status_code=400,
                    detail=f"Cannot approve invoice with status '{inv.workflow_status}'"
                )
            inv.workflow_status = 'to_pay'
            inv.approved_at = datetime.now()
            inv.approved_by = current_user.full_name or current_user.email
            return inv
    raise HTTPException(status_code=404, detail="Supplier invoice not found")


@router.post("/{invoice_id}/mark-to-pay", response_model=SupplierInvoice)
def mark_supplier_invoice_to_pay(
    *,
    db: Session = Depends(deps.get_db_session),
    invoice_id: UUID,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Mark a supplier invoice as ready to pay.
    Moves workflow_status from 'inbox' to 'to_approve'.
    """
    for inv in _supplier_invoices_store:
        if str(inv.id) == str(invoice_id):
            if inv.workflow_status != 'inbox':
                raise HTTPException(
                    status_code=400,
                    detail=f"Cannot mark invoice with status '{inv.workflow_status}' to pay"
                )
            inv.workflow_status = 'to_approve'
            return inv
    raise HTTPException(status_code=404, detail="Supplier invoice not found")


@router.post("/{invoice_id}/reject", response_model=SupplierInvoice)
def reject_supplier_invoice(
    *,
    db: Session = Depends(deps.get_db_session),
    invoice_id: UUID,
    reason: Optional[str] = None,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Reject a supplier invoice.
    Sets workflow_status to 'rejected'.
    """
    for inv in _supplier_invoices_store:
        if str(inv.id) == str(invoice_id):
            inv.workflow_status = 'rejected'
            if reason:
                inv.notes = f"Rejetée: {reason}"
            return inv
    raise HTTPException(status_code=404, detail="Supplier invoice not found")


class PaymentRequest(BaseModel):
    """Request body for recording a payment."""
    amount: Decimal
    payment_date: date
    payment_method: str
    reference: Optional[str] = None


@router.post("/{invoice_id}/record-payment", response_model=SupplierInvoice)
def record_supplier_payment(
    *,
    db: Session = Depends(deps.get_db_session),
    invoice_id: UUID,
    payment: PaymentRequest,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Record a payment for a supplier invoice.
    Updates workflow_status to 'paid' and payment_status accordingly.
    """
    for inv in _supplier_invoices_store:
        if str(inv.id) == str(invoice_id):
            inv.payment_date = payment.payment_date
            inv.workflow_status = 'paid'

            # Determine payment_status
            if payment.amount >= inv.total_amount:
                inv.payment_status = 'paid'
            elif payment.amount > 0:
                inv.payment_status = 'partial'

            return inv
    raise HTTPException(status_code=404, detail="Supplier invoice not found")


@router.post("/upload", response_model=SupplierInvoice)
async def upload_supplier_invoice(
    *,
    db: Session = Depends(deps.get_db_session),
    file: UploadFile = File(...),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Upload a supplier invoice file (PDF, PNG, JPG).
    Triggers OCR processing to extract invoice data.
    Creates invoice with workflow_status='inbox'.
    """
    # Validate file type
    allowed_types = ['application/pdf', 'image/png', 'image/jpeg']
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed types: PDF, PNG, JPG"
        )

    # In production:
    # 1. Save file to storage
    # 2. Trigger OCR processing
    # 3. Extract invoice data
    # 4. Create invoice record

    # Mock OCR-extracted data
    new_invoice = SupplierInvoice(
        id=UUID("550e8400-e29b-41d4-a716-446655440099"),
        supplier_id=UUID("550e8400-e29b-41d4-a716-446655440001"),
        supplier_name="Fournisseur OCR",
        number=f"FA-OCR-{datetime.now().strftime('%Y%m%d')}",
        invoice_date=date.today(),
        due_date=date.today(),
        amount=Decimal("50000"),
        tax_amount=Decimal("9000"),
        total_amount=Decimal("59000"),
        currency="XOF",
        workflow_status="inbox",
        payment_status="unpaid",
        received_at=datetime.now(),
        has_attachment=True,
        ocr_processed=True,
        created_at=datetime.now()
    )

    _supplier_invoices_store.append(new_invoice)
    return new_invoice


@router.delete("/{invoice_id}", status_code=204)
def delete_supplier_invoice(
    *,
    db: Session = Depends(deps.get_db_session),
    invoice_id: UUID,
    current_user: User = Depends(deps.get_current_user),
) -> None:
    """
    Delete a supplier invoice.
    """
    for idx, inv in enumerate(_supplier_invoices_store):
        if str(inv.id) == str(invoice_id):
            _supplier_invoices_store.pop(idx)
            return
    raise HTTPException(status_code=404, detail="Supplier invoice not found")
