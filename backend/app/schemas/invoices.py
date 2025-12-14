"""
Schemas Pydantic pour les Factures (Sales Invoices)
Utilisés pour la validation et sérialisation des requêtes/réponses API
"""

from datetime import datetime
from typing import Optional
from decimal import Decimal
from enum import Enum

from pydantic import BaseModel, Field


class InvoiceStatus(str, Enum):
    """États possibles d'une facture"""
    DRAFT = "draft"
    PENDING = "pending"
    PAID = "paid"
    OVERDUE = "overdue"
    CANCELLED = "cancelled"


class InvoiceItemBase(BaseModel):
    """Base pour les items de facture"""
    product_id: Optional[str] = None
    product_name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    quantity: Decimal = Field(..., gt=0)
    unit_price: Decimal = Field(..., ge=0)
    tax_rate: Decimal = Field(default=0, ge=0, le=100)
    
    class Config:
        json_schema_extra = {
            "example": {
                "product_name": "Consultation",
                "description": "Service de consultation",
                "quantity": 5,
                "unit_price": 50000,
                "tax_rate": 18
            }
        }


class InvoiceItemResponse(InvoiceItemBase):
    """Response pour un item de facture"""
    id: str
    total_ht: Decimal = Field(..., description="Total HT (sans taxe)")
    total_ttc: Decimal = Field(..., description="Total TTC (avec taxe)")

    class Config:
        from_attributes = True


class InvoiceBase(BaseModel):
    """Base pour les factures"""
    reference_number: str = Field(..., min_length=1, max_length=50, description="Numéro de facture unique")
    client_id: str = Field(..., description="UUID du client")
    invoice_date: datetime = Field(default_factory=datetime.now, description="Date de facturation")
    due_date: datetime = Field(..., description="Date d'échéance")
    description: Optional[str] = None
    notes: Optional[str] = None
    status: InvoiceStatus = Field(default=InvoiceStatus.DRAFT, description="État de la facture")
    
    class Config:
        json_schema_extra = {
            "example": {
                "reference_number": "INV-2025-001",
                "client_id": "550e8400-e29b-41d4-a716-446655440000",
                "due_date": "2025-01-31T00:00:00",
                "description": "Facture de vente",
                "status": "draft"
            }
        }


class InvoiceCreate(InvoiceBase):
    """Création d'une facture"""
    items: list[InvoiceItemBase] = Field(..., min_items=1)


class InvoiceUpdate(BaseModel):
    """Mise à jour d'une facture (partiellement)"""
    reference_number: Optional[str] = None
    client_id: Optional[str] = None
    invoice_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    description: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[InvoiceStatus] = None
    items: Optional[list[InvoiceItemBase]] = None


class InvoiceResponse(InvoiceBase):
    """Response complète d'une facture"""
    id: str = Field(..., description="UUID de la facture")
    items: list[InvoiceItemResponse] = Field(default=[], description="Items de la facture")
    total_ht: Decimal = Field(..., description="Montant HT total")
    total_tax: Decimal = Field(..., description="Montant taxe total")
    total_ttc: Decimal = Field(..., description="Montant TTC total")
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "reference_number": "INV-2025-001",
                "client_id": "550e8400-e29b-41d4-a716-446655440001",
                "invoice_date": "2025-01-15T00:00:00",
                "due_date": "2025-02-15T00:00:00",
                "status": "paid",
                "items": [
                    {
                        "id": "550e8400-e29b-41d4-a716-446655440002",
                        "product_name": "Consultation",
                        "quantity": 5,
                        "unit_price": "50000.00",
                        "total_ht": "250000.00",
                        "total_ttc": "295000.00"
                    }
                ],
                "total_ht": "250000.00",
                "total_tax": "45000.00",
                "total_ttc": "295000.00",
                "created_at": "2025-01-15T10:00:00",
                "updated_at": "2025-01-20T15:00:00"
            }
        }


class InvoiceListResponse(BaseModel):
    """Response pour une liste de factures avec pagination"""
    items: list[InvoiceResponse]
    total: int = Field(..., description="Nombre total de factures")
    skip: int = Field(..., description="Nombre d'éléments ignorés")
    limit: int = Field(..., description="Limite par page")
    
    class Config:
        json_schema_extra = {
            "example": {
                "items": [],
                "total": 0,
                "skip": 0,
                "limit": 20
            }
        }


class InvoiceStats(BaseModel):
    """Statistiques sur les factures"""
    total_amount: Decimal = Field(..., description="Montant total de toutes les factures")
    paid_amount: Decimal = Field(..., description="Montant total payé")
    pending_amount: Decimal = Field(..., description="Montant total en attente")
    overdue_amount: Decimal = Field(..., description="Montant total en retard")
    draft_count: int = Field(..., description="Nombre de brouillons")
    pending_count: int = Field(..., description="Nombre en attente")
    paid_count: int = Field(..., description="Nombre payées")
    overdue_count: int = Field(..., description="Nombre en retard")
    
    class Config:
        json_schema_extra = {
            "example": {
                "total_amount": "1000000.00",
                "paid_amount": "600000.00",
                "pending_amount": "300000.00",
                "overdue_amount": "100000.00",
                "draft_count": 2,
                "pending_count": 3,
                "paid_count": 5,
                "overdue_count": 1
            }
        }
