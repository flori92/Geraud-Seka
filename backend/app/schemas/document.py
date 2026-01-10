from datetime import date, datetime
import json
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

from app.models.document import DocumentStatus, DocumentType, DocumentCategory


class DocumentBase(BaseModel):
    filename: str
    status: DocumentStatus = DocumentStatus.UPLOADED
    type: Optional[DocumentType] = DocumentType.OTHER
    category: Optional[DocumentCategory] = DocumentCategory.OTHER
    reference_number: Optional[str] = None
    document_date: Optional[date] = Field(None, alias="date")  # Support both names
    due_date: Optional[date] = None
    amount_ht: Optional[float] = None
    amount_vat: Optional[float] = None
    amount_ttc: Optional[float] = None
    currency: Optional[str] = "XOF"


class DocumentCreate(DocumentBase):
    file_path: str
    content_type: str
    file_size: float
    client_id: Optional[UUID] = None  # Made optional


class DocumentUpdate(BaseModel):
    status: Optional[DocumentStatus] = None
    type: Optional[DocumentType] = None
    category: Optional[DocumentCategory] = None
    reference_number: Optional[str] = None
    document_date: Optional[date] = None
    due_date: Optional[date] = None
    amount_ht: Optional[float] = None
    amount_vat: Optional[float] = None
    amount_ttc: Optional[float] = None
    supplier_id: Optional[UUID] = None


class Document(DocumentBase):
    id: UUID
    file_path: str
    original_filename: Optional[str] = None
    file_extension: Optional[str] = None
    content_type: Optional[str] = None
    file_size: Optional[int] = None
    title: Optional[str] = None
    description: Optional[str] = None
    ocr_data: Optional[dict] = None
    ocr_confidence: Optional[float] = None
    ai_extracted_data: Optional[dict] = None
    tags: Optional[list] = None
    custom_fields: Optional[dict] = None
    supplier_name: Optional[str] = None
    customer_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    client_id: Optional[UUID] = None
    supplier_id: Optional[UUID] = None
    tenant_id: Optional[UUID] = None
    uploaded_by: Optional[UUID] = None

    @field_validator("ocr_data", "ai_extracted_data", "custom_fields", mode="before")
    @classmethod
    def parse_json_data(cls, v: Any):
        if v is None:
            return None
        if isinstance(v, dict):
            # Convert any non-serializable types to serializable ones
            return cls._sanitize_dict(v)
        if isinstance(v, str):
            try:
                parsed = json.loads(v)
                if isinstance(parsed, dict):
                    return cls._sanitize_dict(parsed)
            except Exception:
                return None
        return None

    @field_validator("tags", mode="before")
    @classmethod
    def parse_tags(cls, v: Any):
        if v is None:
            return None
        if isinstance(v, list):
            return v
        if isinstance(v, str):
            try:
                parsed = json.loads(v)
                if isinstance(parsed, list):
                    return parsed
            except Exception:
                return None
        return None

    @staticmethod
    def _sanitize_dict(d: dict) -> dict:
        """Convert non-serializable types in dict to serializable ones"""
        from decimal import Decimal
        result = {}
        for k, v in d.items():
            if isinstance(v, Decimal):
                result[k] = float(v)
            elif isinstance(v, dict):
                result[k] = Document._sanitize_dict(v)
            elif isinstance(v, list):
                result[k] = [
                    float(item) if isinstance(item, Decimal) else item
                    for item in v
                ]
            else:
                result[k] = v
        return result

    class Config:
        from_attributes = True
        populate_by_name = True


class DocumentUploadResponse(BaseModel):
    id: UUID
    filename: str
    file_path: str
    status: DocumentStatus


class OCRExtractionRequest(BaseModel):
    document_id: UUID


class OCRExtractionResponse(BaseModel):
    document_id: UUID
    extracted_data: dict
