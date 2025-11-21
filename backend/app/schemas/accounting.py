from datetime import date
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class AccountingEntryBase(BaseModel):
    journal_code: str
    account_number: str
    label: str
    debit: float = 0.0
    credit: float = 0.0
    date: date
    due_date: Optional[date] = None
    reference: Optional[str] = None


class AccountingEntryCreate(AccountingEntryBase):
    document_id: Optional[UUID] = None
    client_id: UUID


class AccountingEntry(AccountingEntryBase):
    id: UUID
    document_id: Optional[UUID] = None
    client_id: UUID

    class Config:
        from_attributes = True
