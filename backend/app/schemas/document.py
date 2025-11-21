from datetime import date
from typing import Optional
from uuid import UUID

from pydantic import BaseModel

from app.models.document import DocumentStatus, DocumentType


class DocumentBase(BaseModel):
    filename: str
    status: DocumentStatus = DocumentStatus.UPLOADED
    type: Optional[DocumentType] = DocumentType.OTHER
    reference_number: Optional[str] = None
    date: Optional[date] = None
    due_date: Optional[date] = None
    amount_ht: Optional[float] = None
    amount_vat: Optional[float] = None
    amount_ttc: Optional[float] = None
    currency: Optional[str] = "XOF"


class DocumentCreate(DocumentBase):
    file_path: str
    content_type: str
    file_size: float
    client_id: UUID


class DocumentUpdate(BaseModel):
    status: Optional[DocumentStatus] = None
    type: Optional[DocumentType] = None
    reference_number: Optional[str] = None
    date: Optional[date] = None
    due_date: Optional[date] = None
    amount_ht: Optional[float] = None
    amount_vat: Optional[float] = None
    amount_ttc: Optional[float] = None
    supplier_id: Optional[UUID] = None


class Document(DocumentBase):
    id: UUID
    file_path: str
    created_at: date
    updated_at: date
    client_id: UUID
    supplier_id: Optional[UUID] = None

    class Config:
        from_attributes = True
