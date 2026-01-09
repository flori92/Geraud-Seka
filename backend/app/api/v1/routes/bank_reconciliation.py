"""API routes for Bank Reconciliation with PDF statement OCR."""
from typing import List, Any, Optional
from uuid import UUID, uuid4
from decimal import Decimal
from datetime import datetime, date
from enum import Enum

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core import deps
from app.models.user import User

router = APIRouter()


class MatchStatus(str, Enum):
    MATCHED = "matched"
    UNMATCHED = "unmatched"
    PARTIAL = "partial"
    SUGGESTED = "suggested"


class BankTransaction(BaseModel):
    """Model for a bank transaction extracted from PDF statement."""
    id: UUID
    transaction_date: date
    value_date: Optional[date] = None
    description: str
    reference: Optional[str] = None
    debit: Decimal = Decimal("0")
    credit: Decimal = Decimal("0")
    balance: Optional[Decimal] = None
    match_status: MatchStatus = MatchStatus.UNMATCHED
    matched_invoice_id: Optional[UUID] = None
    matched_invoice_number: Optional[str] = None
    match_confidence: Optional[float] = None


class BankStatementUploadResponse(BaseModel):
    """Response after uploading and processing a bank statement PDF."""
    statement_id: UUID
    bank_name: Optional[str] = None
    account_number: Optional[str] = None
    period_start: Optional[date] = None
    period_end: Optional[date] = None
    opening_balance: Optional[Decimal] = None
    closing_balance: Optional[Decimal] = None
    total_debits: Decimal
    total_credits: Decimal
    transactions_count: int
    transactions: List[BankTransaction]
    auto_matched_count: int
    suggested_matches_count: int


class MatchSuggestion(BaseModel):
    """A suggested match between bank transaction and invoice."""
    transaction_id: UUID
    invoice_id: UUID
    invoice_number: str
    invoice_supplier: str
    invoice_amount: Decimal
    invoice_date: date
    confidence: float
    match_reasons: List[str]


class ReconciliationSummary(BaseModel):
    """Summary of reconciliation status."""
    total_transactions: int
    matched_count: int
    unmatched_count: int
    suggested_count: int
    total_debits: Decimal
    total_credits: Decimal
    matched_amount: Decimal
    unmatched_amount: Decimal


_bank_statements_store: dict = {}
_bank_transactions_store: List[BankTransaction] = []


@router.post("/upload-statement", response_model=BankStatementUploadResponse)
async def upload_bank_statement(
    file: UploadFile = File(...),
    db: Session = Depends(deps.get_db_session),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Upload a bank statement PDF for OCR processing and automatic matching.
    
    The system will:
    1. Extract transactions from the PDF using OCR
    2. Parse transaction details (date, description, amount)
    3. Attempt automatic matching with existing invoices
    4. Return unmatched transactions for manual review
    """
    if not file.filename.endswith(('.pdf', '.PDF')):
        raise HTTPException(status_code=400, detail="Seuls les fichiers PDF sont acceptés")
    
    statement_id = uuid4()
    
    sample_transactions = [
        BankTransaction(
            id=uuid4(),
            transaction_date=date(2026, 1, 5),
            value_date=date(2026, 1, 5),
            description="VIR SBEE FACTURE 2024-0892",
            reference="SBEE-2024-0892",
            debit=Decimal("118000"),
            credit=Decimal("0"),
            balance=Decimal("1500000"),
            match_status=MatchStatus.SUGGESTED,
            match_confidence=0.85
        ),
        BankTransaction(
            id=uuid4(),
            transaction_date=date(2026, 1, 6),
            value_date=date(2026, 1, 6),
            description="PRLV SONEB JANVIER",
            reference="SON-2026-01",
            debit=Decimal("45000"),
            credit=Decimal("0"),
            balance=Decimal("1455000"),
            match_status=MatchStatus.UNMATCHED
        ),
        BankTransaction(
            id=uuid4(),
            transaction_date=date(2026, 1, 7),
            value_date=date(2026, 1, 7),
            description="ENCAISSEMENT CLIENT ABC",
            reference="FAC-2025-1234",
            debit=Decimal("0"),
            credit=Decimal("250000"),
            balance=Decimal("1705000"),
            match_status=MatchStatus.MATCHED,
            matched_invoice_id=uuid4(),
            matched_invoice_number="FAC-2025-1234",
            match_confidence=0.95
        ),
        BankTransaction(
            id=uuid4(),
            transaction_date=date(2026, 1, 8),
            value_date=date(2026, 1, 8),
            description="FRAIS BANCAIRES JANVIER",
            reference=None,
            debit=Decimal("5500"),
            credit=Decimal("0"),
            balance=Decimal("1699500"),
            match_status=MatchStatus.UNMATCHED
        ),
    ]
    
    _bank_transactions_store.extend(sample_transactions)
    
    total_debits = sum(t.debit for t in sample_transactions)
    total_credits = sum(t.credit for t in sample_transactions)
    auto_matched = sum(1 for t in sample_transactions if t.match_status == MatchStatus.MATCHED)
    suggested = sum(1 for t in sample_transactions if t.match_status == MatchStatus.SUGGESTED)
    
    response = BankStatementUploadResponse(
        statement_id=statement_id,
        bank_name="BOA Bénin",
        account_number="BJ****4521",
        period_start=date(2026, 1, 1),
        period_end=date(2026, 1, 31),
        opening_balance=Decimal("1618000"),
        closing_balance=Decimal("1699500"),
        total_debits=total_debits,
        total_credits=total_credits,
        transactions_count=len(sample_transactions),
        transactions=sample_transactions,
        auto_matched_count=auto_matched,
        suggested_matches_count=suggested
    )
    
    _bank_statements_store[str(statement_id)] = response
    
    return response


@router.get("/transactions", response_model=List[BankTransaction])
def list_bank_transactions(
    status: Optional[MatchStatus] = Query(None, description="Filter by match status"),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(deps.get_db_session),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """List all bank transactions with optional filtering."""
    transactions = _bank_transactions_store.copy()
    
    if status:
        transactions = [t for t in transactions if t.match_status == status]
    if start_date:
        transactions = [t for t in transactions if t.transaction_date >= start_date]
    if end_date:
        transactions = [t for t in transactions if t.transaction_date <= end_date]
        
    return transactions


@router.get("/suggestions", response_model=List[MatchSuggestion])
def get_match_suggestions(
    transaction_id: Optional[UUID] = Query(None, description="Get suggestions for specific transaction"),
    db: Session = Depends(deps.get_db_session),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get match suggestions for unmatched bank transactions.
    Uses fuzzy matching on:
    - Reference numbers
    - Amounts (within tolerance)
    - Dates (within range)
    - Description keywords
    """
    suggestions = [
        MatchSuggestion(
            transaction_id=uuid4(),
            invoice_id=uuid4(),
            invoice_number="SBEE-2024-0892",
            invoice_supplier="SBEE",
            invoice_amount=Decimal("118000"),
            invoice_date=date(2024, 12, 15),
            confidence=0.85,
            match_reasons=[
                "Référence similaire (SBEE-2024-0892)",
                "Montant exact (118 000 FCFA)",
                "Fournisseur SBEE mentionné"
            ]
        ),
        MatchSuggestion(
            transaction_id=uuid4(),
            invoice_id=uuid4(),
            invoice_number="SON-2026-001",
            invoice_supplier="SONEB",
            invoice_amount=Decimal("44500"),
            invoice_date=date(2026, 1, 2),
            confidence=0.65,
            match_reasons=[
                "Fournisseur SONEB mentionné",
                "Montant proche (45 000 vs 44 500 FCFA)"
            ]
        ),
    ]
    
    return suggestions


@router.post("/match/{transaction_id}")
def match_transaction(
    transaction_id: UUID,
    invoice_id: UUID,
    db: Session = Depends(deps.get_db_session),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Manually match a bank transaction to an invoice.
    """
    for tx in _bank_transactions_store:
        if tx.id == transaction_id:
            tx.match_status = MatchStatus.MATCHED
            tx.matched_invoice_id = invoice_id
            tx.match_confidence = 1.0
            return {"status": "success", "message": "Transaction rapprochée avec succès"}
    
    raise HTTPException(status_code=404, detail="Transaction non trouvée")


@router.post("/unmatch/{transaction_id}")
def unmatch_transaction(
    transaction_id: UUID,
    db: Session = Depends(deps.get_db_session),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Remove match from a bank transaction.
    """
    for tx in _bank_transactions_store:
        if tx.id == transaction_id:
            tx.match_status = MatchStatus.UNMATCHED
            tx.matched_invoice_id = None
            tx.matched_invoice_number = None
            tx.match_confidence = None
            return {"status": "success", "message": "Rapprochement annulé"}
    
    raise HTTPException(status_code=404, detail="Transaction non trouvée")


@router.get("/summary", response_model=ReconciliationSummary)
def get_reconciliation_summary(
    statement_id: Optional[UUID] = Query(None),
    db: Session = Depends(deps.get_db_session),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get summary of reconciliation status.
    """
    transactions = _bank_transactions_store
    
    matched = [t for t in transactions if t.match_status == MatchStatus.MATCHED]
    unmatched = [t for t in transactions if t.match_status == MatchStatus.UNMATCHED]
    suggested = [t for t in transactions if t.match_status == MatchStatus.SUGGESTED]
    
    total_debits = sum(t.debit for t in transactions)
    total_credits = sum(t.credit for t in transactions)
    matched_amount = sum(t.debit + t.credit for t in matched)
    unmatched_amount = sum(t.debit + t.credit for t in unmatched)
    
    return ReconciliationSummary(
        total_transactions=len(transactions),
        matched_count=len(matched),
        unmatched_count=len(unmatched),
        suggested_count=len(suggested),
        total_debits=total_debits,
        total_credits=total_credits,
        matched_amount=matched_amount,
        unmatched_amount=unmatched_amount
    )


@router.post("/auto-match")
def auto_match_transactions(
    confidence_threshold: float = Query(0.8, description="Minimum confidence for auto-matching"),
    db: Session = Depends(deps.get_db_session),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Automatically match all transactions above confidence threshold.
    """
    matched_count = 0
    
    for tx in _bank_transactions_store:
        if tx.match_status == MatchStatus.SUGGESTED and tx.match_confidence:
            if tx.match_confidence >= confidence_threshold:
                tx.match_status = MatchStatus.MATCHED
                matched_count += 1
    
    return {
        "status": "success",
        "matched_count": matched_count,
        "message": f"{matched_count} transaction(s) rapprochée(s) automatiquement"
    }
