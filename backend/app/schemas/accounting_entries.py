from datetime import date
from enum import Enum
from typing import Optional, List
from uuid import UUID
from decimal import Decimal

from pydantic import BaseModel, Field, root_validator, validator


class AccountingEntryLineBase(BaseModel):
    account_id: Optional[UUID] = None
    account_code: Optional[str] = None
    label: str
    debit: Decimal = Field(default=Decimal("0.00"), ge=0)
    credit: Decimal = Field(default=Decimal("0.00"), ge=0)
    analytic_code: Optional[str] = None
    partner_id: Optional[UUID] = None
    partner_type: Optional[str] = None

    @root_validator
    def validate_account_identifier(cls, values):
        account_id = values.get('account_id')
        account_code = values.get('account_code')
        if account_id is None and not account_code:
            raise ValueError("account_id ou account_code est requis")
        return values

    @validator('debit', 'credit')
    def validate_amounts(cls, v):
        if v < 0:
            raise ValueError("Les montants ne peuvent pas être négatifs")
        return v


class AccountingEntryLineCreate(AccountingEntryLineBase):
    pass


class AccountingEntryLineResponse(AccountingEntryLineBase):
    id: UUID
    entry_id: UUID
    reconciled: bool
    reconciliation_ref: Optional[str]
    
    class Config:
        from_attributes = True


class AccountingEntryHeaderBase(BaseModel):
    journal_type: str
    date: date
    reference: Optional[str] = None
    description: str
    document_id: Optional[UUID] = None


class AccountingEntryHeaderCreate(AccountingEntryHeaderBase):
    lines: List[AccountingEntryLineCreate]

    @validator('lines')
    def validate_balanced(cls, lines):
        if len(lines) < 2:
            raise ValueError("Une écriture doit avoir au moins 2 lignes")
        
        total_debit = sum(line.debit for line in lines)
        total_credit = sum(line.credit for line in lines)
        
        if abs(total_debit - total_credit) > Decimal("0.01"):
            raise ValueError(f"L'écriture n'est pas équilibrée: Débit={total_debit}, Crédit={total_credit}")
        
        return lines


class AccountingEntryHeaderUpdate(BaseModel):
    date: Optional[date] = None
    reference: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None


class AccountingEntryHeaderResponse(AccountingEntryHeaderBase):
    id: UUID
    entry_number: str
    status: str
    document_id: Optional[UUID]
    validated_by: Optional[UUID]
    validated_at: Optional[date]
    posted_by: Optional[UUID]
    posted_at: Optional[date]
    lines: List[AccountingEntryLineResponse]
    
    class Config:
        from_attributes = True


class BankReconciliationCreate(BaseModel):
    bank_account_id: UUID
    period_start: date
    period_end: date
    statement_balance: Decimal


class BankReconciliationResponse(BaseModel):
    id: UUID
    bank_account_id: UUID
    period_start: date
    period_end: date
    statement_balance: Decimal
    book_balance: Decimal
    difference: Decimal
    status: str
    reconciled_by: Optional[UUID]
    reconciled_at: Optional[date]
    notes: Optional[str]
    
    class Config:
        from_attributes = True


class AccountingRevisionCreate(BaseModel):
    entry_id: UUID
    revision_type: str
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    comment: Optional[str] = None


class AccountingRevisionResponse(BaseModel):
    id: UUID
    entry_id: UUID
    revision_type: str
    old_value: Optional[str]
    new_value: Optional[str]
    comment: Optional[str]
    revised_by: UUID
    created_at: date
    
    class Config:
        from_attributes = True


class LettrageRequest(BaseModel):
    line_ids: List[UUID]
    reconciliation_ref: str


class ValidationRequest(BaseModel):
    entry_id: UUID
    comment: Optional[str] = None


class EntryExportFormat(str, Enum):
    CSV = "csv"
    EXCEL = "excel"
    FEC = "fec"
    PDF = "pdf"


class EntrySearchCriteria(BaseModel):
    journal_types: Optional[List[str]] = None
    statuses: Optional[List[str]] = None
    date_from: Optional[date] = None
    date_to: Optional[date] = None
    reference: Optional[str] = None
    description: Optional[str] = None
    account_number: Optional[str] = None
    partner_id: Optional[UUID] = None
    analytic_code: Optional[str] = None
    sort_by: Optional[str] = None
    sort_order: str = "desc"
    limit: Optional[int] = None
    offset: Optional[int] = None
