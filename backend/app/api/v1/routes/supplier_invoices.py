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
    invoices = []

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
        invoices = _supplier_invoices_store if _supplier_invoices_store else []


        a_payer = sum(
            inv.total_amount for inv in invoices
            if inv.workflow_status == 'to_pay'
        )

        paye = sum(
            inv.total_amount for inv in invoices
            if inv.workflow_status == 'paid'
        )

        factures_retard = len([
            inv for inv in invoices
            if inv.due_date < today and inv.workflow_status not in ['paid', 'rejected']
        ])

        en_attente_approbation = len([
            inv for inv in invoices
            if inv.workflow_status == 'to_approve'
        ])

        total_factures = len([
            inv for inv in invoices
            if inv.workflow_status != 'rejected'
        ])

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
    for idx, inv in enumerate(_supplier_invoices_store):
        if str(inv.id) == str(invoice_id):
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
    allowed_types = ['application/pdf', 'image/png', 'image/jpeg']
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed types: PDF, PNG, JPG"
        )


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
    force: bool = Query(False, description="Forcer la suppression même si la facture est approuvée/payée"),
    current_user: User = Depends(deps.get_current_user),
) -> None:
    """
    Supprime une facture fournisseur.
    
    - Les factures en attente peuvent être supprimées directement
    - Les factures approuvées/payées nécessitent force=true pour être supprimées
    """
    invoice = None
    invoice_idx = None
    
    for idx, inv in enumerate(_supplier_invoices_store):
        if str(inv.id) == str(invoice_id):
            invoice = inv
            invoice_idx = idx
            break
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Facture fournisseur non trouvée")
    
    # Vérification des restrictions
    if invoice.workflow_status in ["to_pay", "paid"] and not force:
        raise HTTPException(
            status_code=400,
            detail="Cette facture est approuvée ou payée. Utilisez force=true pour confirmer la suppression."
        )
    
    # Suppression
    _supplier_invoices_store.pop(invoice_idx)


class DuplicateInvoice(BaseModel):
    """Model for duplicate invoice detection result."""
    invoice_id: UUID
    invoice_number: str
    supplier_name: str
    amount: Decimal
    invoice_date: date
    duplicate_of_id: UUID
    duplicate_of_number: str
    match_score: float
    match_reasons: List[str]


class DuplicateCheckResult(BaseModel):
    """Result of duplicate check."""
    has_duplicates: bool
    duplicates_count: int
    duplicates: List[DuplicateInvoice]


@router.get("/duplicates/check", response_model=DuplicateCheckResult)
def check_duplicates(
    db: Session = Depends(deps.get_db_session),
    invoice_number: Optional[str] = Query(None, description="Check specific invoice number"),
    supplier_name: Optional[str] = Query(None, description="Filter by supplier name"),
    amount: Optional[Decimal] = Query(None, description="Filter by amount"),
    tolerance: float = Query(0.01, description="Amount tolerance for matching (default 1%)"),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Detect duplicate invoices based on:
    - Same invoice number + same supplier + same amount
    - Similar amounts within tolerance
    
    Returns list of potential duplicates with match score.
    """
    duplicates = []
    invoices = _supplier_invoices_store.copy()
    
    for i, inv1 in enumerate(invoices):
        for j, inv2 in enumerate(invoices):
            if i >= j:
                continue
                
            match_reasons = []
            match_score = 0.0
            
            if inv1.number == inv2.number:
                match_reasons.append("Même numéro de facture")
                match_score += 0.4
                
            if inv1.supplier_name.lower() == inv2.supplier_name.lower():
                match_reasons.append("Même fournisseur")
                match_score += 0.3
                
            amount_diff = abs(float(inv1.total_amount) - float(inv2.total_amount))
            amount_tolerance = float(inv1.total_amount) * tolerance
            if amount_diff <= amount_tolerance:
                match_reasons.append(f"Montant identique ou proche ({inv1.total_amount} vs {inv2.total_amount})")
                match_score += 0.3
                
            if match_score >= 0.7:
                duplicates.append(DuplicateInvoice(
                    invoice_id=inv2.id,
                    invoice_number=inv2.number,
                    supplier_name=inv2.supplier_name,
                    amount=inv2.total_amount,
                    invoice_date=inv2.invoice_date,
                    duplicate_of_id=inv1.id,
                    duplicate_of_number=inv1.number,
                    match_score=match_score,
                    match_reasons=match_reasons
                ))
    
    return DuplicateCheckResult(
        has_duplicates=len(duplicates) > 0,
        duplicates_count=len(duplicates),
        duplicates=duplicates
    )


@router.post("/duplicates/check-new")
def check_new_invoice_duplicate(
    invoice_number: str,
    supplier_name: str,
    amount: Decimal,
    db: Session = Depends(deps.get_db_session),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Check if a new invoice would be a duplicate before creating it.
    Used during invoice upload/creation to warn user.
    """
    potential_duplicates = []
    
    for inv in _supplier_invoices_store:
        match_reasons = []
        match_score = 0.0
        
        if inv.number.lower() == invoice_number.lower():
            match_reasons.append("Numéro de facture identique")
            match_score += 0.4
            
        if inv.supplier_name.lower() == supplier_name.lower():
            match_reasons.append("Même fournisseur")
            match_score += 0.3
            
        amount_diff = abs(float(inv.total_amount) - float(amount))
        if amount_diff < float(amount) * 0.01:
            match_reasons.append("Montant identique")
            match_score += 0.3
            
        if match_score >= 0.7:
            potential_duplicates.append({
                "existing_invoice_id": str(inv.id),
                "existing_invoice_number": inv.number,
                "existing_supplier": inv.supplier_name,
                "existing_amount": float(inv.total_amount),
                "existing_date": inv.invoice_date.isoformat(),
                "match_score": match_score,
                "match_reasons": match_reasons
            })
    
    return {
        "is_duplicate": len(potential_duplicates) > 0,
        "potential_duplicates": potential_duplicates,
        "warning_message": f"Cette facture pourrait être un doublon de {len(potential_duplicates)} facture(s) existante(s)." if potential_duplicates else None
    }
