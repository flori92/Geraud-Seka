"""
Schémas Pydantic pour la GED (Gestion Électronique de Documents)
"""

from typing import Optional, List
from datetime import date, datetime
from pydantic import BaseModel, Field
from uuid import UUID


# ==================== DOSSIERS ====================

class DocumentFolderBase(BaseModel):
    """Schéma de base pour un dossier"""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    color: Optional[str] = Field(None, max_length=7)  # #FF5733
    icon: Optional[str] = Field(None, max_length=50)
    parent_id: Optional[UUID] = None
    is_public: bool = False


class DocumentFolderCreate(DocumentFolderBase):
    """Schéma pour créer un dossier"""
    pass


class DocumentFolderUpdate(BaseModel):
    """Schéma pour mettre à jour un dossier"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    color: Optional[str] = Field(None, max_length=7)
    icon: Optional[str] = Field(None, max_length=50)
    parent_id: Optional[UUID] = None
    is_public: Optional[bool] = None


class DocumentFolder(DocumentFolderBase):
    """Schéma complet pour un dossier"""
    id: UUID
    path: Optional[str] = None
    tenant_id: UUID
    created_by: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DocumentFolderWithStats(DocumentFolder):
    """Dossier avec statistiques"""
    document_count: int = 0
    subfolder_count: int = 0
    total_size: int = 0


# ==================== DOCUMENTS ====================

class DocumentBase(BaseModel):
    """Schéma de base pour un document"""
    title: Optional[str] = Field(None, max_length=500)
    description: Optional[str] = None
    type: Optional[str] = "OTHER"
    category: Optional[str] = "other"
    tags: Optional[List[str]] = None
    custom_fields: Optional[dict] = None
    reference_number: Optional[str] = Field(None, max_length=100)
    document_date: Optional[date] = None
    due_date: Optional[date] = None
    expiry_date: Optional[date] = None
    is_confidential: bool = False
    requires_validation: bool = False


class DocumentCreate(DocumentBase):
    """Schéma pour créer un document"""
    folder_id: Optional[UUID] = None
    client_id: Optional[UUID] = None
    supplier_id: Optional[UUID] = None
    lead_id: Optional[UUID] = None
    opportunity_id: Optional[UUID] = None


class DocumentUpdate(BaseModel):
    """Schéma pour mettre à jour un document"""
    title: Optional[str] = Field(None, max_length=500)
    description: Optional[str] = None
    type: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = None
    custom_fields: Optional[dict] = None
    reference_number: Optional[str] = Field(None, max_length=100)
    document_date: Optional[date] = None
    due_date: Optional[date] = None
    expiry_date: Optional[date] = None
    is_confidential: Optional[bool] = None
    is_archived: Optional[bool] = None
    is_locked: Optional[bool] = None
    requires_validation: Optional[bool] = None
    folder_id: Optional[UUID] = None
    client_id: Optional[UUID] = None
    supplier_id: Optional[UUID] = None
    lead_id: Optional[UUID] = None
    opportunity_id: Optional[UUID] = None
    amount_ht: Optional[float] = None
    amount_vat: Optional[float] = None
    amount_ttc: Optional[float] = None
    currency: Optional[str] = None


class Document(DocumentBase):
    """Schéma complet pour un document"""
    id: UUID
    filename: str
    original_filename: str
    file_path: str
    content_type: Optional[str] = None
    file_size: Optional[int] = None
    file_extension: Optional[str] = None
    status: str
    version: int = 1
    parent_document_id: Optional[UUID] = None
    is_latest_version: bool = True
    ocr_data: Optional[dict] = None
    ocr_confidence: Optional[float] = None
    ai_extracted_data: Optional[dict] = None
    is_confidential: bool = False
    is_archived: bool = False
    is_locked: bool = False
    requires_validation: bool = False
    validated_by: Optional[UUID] = None
    validated_at: Optional[date] = None
    folder_id: Optional[UUID] = None
    client_id: Optional[UUID] = None
    supplier_id: Optional[UUID] = None
    lead_id: Optional[UUID] = None
    opportunity_id: Optional[UUID] = None
    tenant_id: UUID
    uploaded_by: UUID
    amount_ht: Optional[float] = None
    amount_vat: Optional[float] = None
    amount_ttc: Optional[float] = None
    currency: Optional[str] = "XOF"
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DocumentWithRelations(Document):
    """Document avec relations"""
    folder_name: Optional[str] = None
    client_name: Optional[str] = None
    supplier_name: Optional[str] = None
    uploader_name: Optional[str] = None
    validator_name: Optional[str] = None
    file_size_formatted: str = "0 B"
    full_path: str = ""


class DocumentSearchFilters(BaseModel):
    """Filtres de recherche pour les documents"""
    query: Optional[str] = None  # Recherche dans titre, description, filename
    category: Optional[str] = None
    type: Optional[str] = None
    folder_id: Optional[UUID] = None
    client_id: Optional[UUID] = None
    supplier_id: Optional[UUID] = None
    lead_id: Optional[UUID] = None
    opportunity_id: Optional[UUID] = None
    tags: Optional[List[str]] = None
    is_confidential: Optional[bool] = None
    is_archived: Optional[bool] = None
    status: Optional[str] = None
    uploaded_by: Optional[UUID] = None
    date_from: Optional[date] = None
    date_to: Optional[date] = None
    min_size: Optional[int] = None
    max_size: Optional[int] = None


class DocumentStats(BaseModel):
    """Statistiques sur les documents"""
    total_documents: int = 0
    total_size: int = 0
    total_size_formatted: str = "0 B"
    by_category: dict = {}
    by_type: dict = {}
    by_status: dict = {}
    recent_uploads: int = 0  # 7 derniers jours
    pending_validation: int = 0
