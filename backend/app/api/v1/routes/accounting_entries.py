from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from typing import List, Optional
from datetime import date, datetime
from decimal import Decimal
import json

from app.db.session import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.accounting_entries import (
    AccountingEntryHeader, AccountingEntryLine, 
    AccountingRevision, EntryStatus, JournalType
)
from app.models.accounting_advanced import BankReconciliation
from app.models.ledger_account import LedgerAccount
from app.schemas.accounting_entries import (
    AccountingEntryHeaderCreate, AccountingEntryHeaderResponse,
    AccountingEntryHeaderUpdate, BankReconciliationCreate,
    BankReconciliationResponse, AccountingRevisionCreate,
    AccountingRevisionResponse, LettrageRequest, ValidationRequest
)

router = APIRouter()


@router.post("/entries/", response_model=AccountingEntryHeaderResponse)
def create_accounting_entry(
    entry_data: AccountingEntryHeaderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    count = db.query(func.count(AccountingEntryHeader.id)).filter(
        AccountingEntryHeader.tenant_id == current_user.tenant_id
    ).scalar() or 0
    
    entry_number = f"{entry_data.journal_type}-{datetime.now().year}-{count + 1:06d}"
    
    entry = AccountingEntryHeader(
        tenant_id=current_user.tenant_id,
        entry_number=entry_number,
        journal_type=JournalType(entry_data.journal_type),
        date=entry_data.date,
        reference=entry_data.reference,
        description=entry_data.description,
        status=EntryStatus.DRAFT
    )
    
    db.add(entry)
    db.flush()
    
    for line_data in entry_data.lines:
        account = db.query(LedgerAccount).filter(
            LedgerAccount.id == line_data.account_id,
            LedgerAccount.tenant_id == current_user.tenant_id
        ).first()
        
        if not account:
            raise HTTPException(status_code=404, detail=f"Compte {line_data.account_id} introuvable")
        
        line = AccountingEntryLine(
            tenant_id=current_user.tenant_id,
            entry_id=entry.id,
            account_id=line_data.account_id,
            label=line_data.label,
            debit=line_data.debit,
            credit=line_data.credit,
            analytic_code=line_data.analytic_code,
            partner_id=line_data.partner_id,
            partner_type=line_data.partner_type
        )
        db.add(line)
    
    db.commit()
    db.refresh(entry)
    
    return entry


@router.get("/entries/", response_model=List[AccountingEntryHeaderResponse])
def get_accounting_entries(
    status: Optional[str] = None,
    journal_type: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(AccountingEntryHeader).filter(
        AccountingEntryHeader.tenant_id == current_user.tenant_id
    )
    
    if status:
        query = query.filter(AccountingEntryHeader.status == status)
    if journal_type:
        query = query.filter(AccountingEntryHeader.journal_type == journal_type)
    if date_from:
        query = query.filter(AccountingEntryHeader.date >= date_from)
    if date_to:
        query = query.filter(AccountingEntryHeader.date <= date_to)
    
    entries = query.order_by(AccountingEntryHeader.date.desc()).all()
    return entries


@router.get("/entries/{entry_id}", response_model=AccountingEntryHeaderResponse)
def get_accounting_entry(
    entry_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    entry = db.query(AccountingEntryHeader).filter(
        AccountingEntryHeader.id == entry_id,
        AccountingEntryHeader.tenant_id == current_user.tenant_id
    ).first()
    
    if not entry:
        raise HTTPException(status_code=404, detail="Écriture introuvable")
    
    return entry


@router.put("/entries/{entry_id}", response_model=AccountingEntryHeaderResponse)
def update_accounting_entry(
    entry_id: str,
    entry_data: AccountingEntryHeaderUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    entry = db.query(AccountingEntryHeader).filter(
        AccountingEntryHeader.id == entry_id,
        AccountingEntryHeader.tenant_id == current_user.tenant_id
    ).first()
    
    if not entry:
        raise HTTPException(status_code=404, detail="Écriture introuvable")
    
    if entry.status != EntryStatus.DRAFT:
        raise HTTPException(status_code=400, detail="Seules les écritures en brouillon peuvent être modifiées")
    
    for field, value in entry_data.dict(exclude_unset=True).items():
        setattr(entry, field, value)
    
    db.commit()
    db.refresh(entry)
    
    return entry


@router.post("/entries/{entry_id}/validate")
def validate_entry(
    entry_id: str,
    validation: ValidationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    entry = db.query(AccountingEntryHeader).filter(
        AccountingEntryHeader.id == entry_id,
        AccountingEntryHeader.tenant_id == current_user.tenant_id
    ).first()
    
    if not entry:
        raise HTTPException(status_code=404, detail="Écriture introuvable")
    
    if entry.status != EntryStatus.DRAFT:
        raise HTTPException(status_code=400, detail="Cette écriture ne peut pas être validée")
    
    total_debit = sum(line.debit for line in entry.lines)
    total_credit = sum(line.credit for line in entry.lines)
    
    if abs(total_debit - total_credit) > Decimal("0.01"):
        raise HTTPException(status_code=400, detail="L'écriture n'est pas équilibrée")
    
    entry.status = EntryStatus.VALIDATED
    entry.validated_by = current_user.id
    entry.validated_at = datetime.now().date()
    
    revision = AccountingRevision(
        tenant_id=current_user.tenant_id,
        entry_id=entry.id,
        revision_type="validation",
        old_value="draft",
        new_value="validated",
        comment=validation.comment,
        revised_by=current_user.id
    )
    db.add(revision)
    
    db.commit()
    
    return {"message": "Écriture validée avec succès", "entry_id": str(entry.id)}


@router.post("/entries/{entry_id}/post")
def post_entry(
    entry_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    entry = db.query(AccountingEntryHeader).filter(
        AccountingEntryHeader.id == entry_id,
        AccountingEntryHeader.tenant_id == current_user.tenant_id
    ).first()
    
    if not entry:
        raise HTTPException(status_code=404, detail="Écriture introuvable")
    
    if entry.status != EntryStatus.VALIDATED:
        raise HTTPException(status_code=400, detail="Seules les écritures validées peuvent être comptabilisées")
    
    for line in entry.lines:
        account = db.query(LedgerAccount).filter(
            LedgerAccount.id == line.account_id
        ).first()
        
        if account:
            account.balance += (line.debit - line.credit)
    
    entry.status = EntryStatus.POSTED
    entry.posted_by = current_user.id
    entry.posted_at = datetime.now().date()
    
    revision = AccountingRevision(
        tenant_id=current_user.tenant_id,
        entry_id=entry.id,
        revision_type="posting",
        old_value="validated",
        new_value="posted",
        revised_by=current_user.id
    )
    db.add(revision)
    
    db.commit()
    
    return {"message": "Écriture comptabilisée avec succès", "entry_id": str(entry.id)}


@router.post("/lettrage/")
def lettrage_entries(
    lettrage: LettrageRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    lines = db.query(AccountingEntryLine).filter(
        AccountingEntryLine.id.in_(lettrage.line_ids),
        AccountingEntryLine.tenant_id == current_user.tenant_id
    ).all()
    
    if len(lines) != len(lettrage.line_ids):
        raise HTTPException(status_code=404, detail="Certaines lignes sont introuvables")
    
    total_debit = sum(line.debit for line in lines)
    total_credit = sum(line.credit for line in lines)
    
    if abs(total_debit - total_credit) > Decimal("0.01"):
        raise HTTPException(
            status_code=400, 
            detail=f"Les lignes ne sont pas équilibrées: Débit={total_debit}, Crédit={total_credit}"
        )
    
    for line in lines:
        line.reconciled = True
        line.reconciliation_ref = lettrage.reconciliation_ref
    
    db.commit()
    
    return {"message": "Lettrage effectué avec succès", "reconciliation_ref": lettrage.reconciliation_ref}


@router.post("/reconciliation/", response_model=BankReconciliationResponse)
def create_bank_reconciliation(
    reconciliation_data: BankReconciliationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    book_balance = Decimal("0.00")
    
    reconciliation = BankReconciliation(
        tenant_id=current_user.tenant_id,
        bank_account_id=reconciliation_data.bank_account_id,
        period_start=reconciliation_data.period_start,
        period_end=reconciliation_data.period_end,
        statement_balance=reconciliation_data.statement_balance,
        book_balance=book_balance,
        difference=reconciliation_data.statement_balance - book_balance,
        status="in_progress"
    )
    
    db.add(reconciliation)
    db.commit()
    db.refresh(reconciliation)
    
    return reconciliation


@router.get("/reconciliation/", response_model=List[BankReconciliationResponse])
def get_bank_reconciliations(
    bank_account_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(BankReconciliation).filter(
        BankReconciliation.tenant_id == current_user.tenant_id
    )
    
    if bank_account_id:
        query = query.filter(BankReconciliation.bank_account_id == bank_account_id)
    
    reconciliations = query.order_by(BankReconciliation.period_end.desc()).all()
    return reconciliations


@router.get("/revisions/{entry_id}", response_model=List[AccountingRevisionResponse])
def get_entry_revisions(
    entry_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    revisions = db.query(AccountingRevision).filter(
        AccountingRevision.entry_id == entry_id,
        AccountingRevision.tenant_id == current_user.tenant_id
    ).order_by(AccountingRevision.created_at.desc()).all()
    
    return revisions


@router.delete("/entries/{entry_id}")
def delete_entry(
    entry_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    entry = db.query(AccountingEntryHeader).filter(
        AccountingEntryHeader.id == entry_id,
        AccountingEntryHeader.tenant_id == current_user.tenant_id
    ).first()
    
    if not entry:
        raise HTTPException(status_code=404, detail="Écriture introuvable")
    
    if entry.status == EntryStatus.POSTED:
        raise HTTPException(status_code=400, detail="Les écritures comptabilisées ne peuvent pas être supprimées")
    
    db.delete(entry)
    db.commit()
    
    return {"message": "Écriture supprimée avec succès"}
