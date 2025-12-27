"""Schemas Pydantic pour les Devis (Quotes)."""
from datetime import date, datetime
from decimal import Decimal
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field



class QuoteItemBase(BaseModel):
    """Base schema pour les lignes de devis."""
    description: str = Field(..., max_length=500)
    quantity: Decimal = Field(..., gt=0)
    unit_price: Decimal = Field(..., ge=0)
    discount_percentage: Decimal = Field(default=Decimal("0"), ge=0, le=100)
    vat_rate: Decimal = Field(default=Decimal("18.00"), ge=0, le=100)
    position: int = Field(default=0, ge=0)
    product_id: Optional[UUID] = None


class QuoteItemCreate(QuoteItemBase):
    """Schema pour la création d'une ligne de devis."""
    pass


class QuoteItemUpdate(BaseModel):
    """Schema pour la mise à jour d'une ligne de devis."""
    description: Optional[str] = Field(None, max_length=500)
    quantity: Optional[Decimal] = Field(None, gt=0)
    unit_price: Optional[Decimal] = Field(None, ge=0)
    discount_percentage: Optional[Decimal] = Field(None, ge=0, le=100)
    vat_rate: Optional[Decimal] = Field(None, ge=0, le=100)
    position: Optional[int] = Field(None, ge=0)
    product_id: Optional[UUID] = None


class QuoteItem(QuoteItemBase):
    """Schema de réponse pour une ligne de devis."""
    id: UUID
    quote_id: UUID
    subtotal: Decimal
    discount_amount: Decimal
    total_ht: Decimal
    total_vat: Decimal
    total_ttc: Decimal

    model_config = ConfigDict(from_attributes=True)



class QuoteBase(BaseModel):
    """Base schema pour les devis."""
    title: str = Field(..., max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    client_id: UUID
    issue_date: date = Field(default_factory=date.today)
    expiry_date: Optional[date] = None
    validity_days: int = Field(default=30, ge=1)
    discount_percentage: Decimal = Field(default=Decimal("0"), ge=0, le=100)
    discount_amount: Decimal = Field(default=Decimal("0"), ge=0)
    payment_terms: Optional[str] = Field(None, max_length=255)
    delivery_delay: Optional[str] = Field(None, max_length=100)
    internal_notes: Optional[str] = Field(None, max_length=1000)
    customer_notes: Optional[str] = Field(None, max_length=1000)
    currency: str = Field(default="XOF", max_length=3)


class QuoteCreate(QuoteBase):
    """Schema pour la création d'un devis."""
    items: List[QuoteItemCreate] = Field(default_factory=list)


class QuoteUpdate(BaseModel):
    """Schema pour la mise à jour d'un devis."""
    title: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    client_id: Optional[UUID] = None
    status: Optional[str] = None  # draft, sent, accepted, rejected, expired, converted
    issue_date: Optional[date] = None
    expiry_date: Optional[date] = None
    validity_days: Optional[int] = Field(None, ge=1)
    discount_percentage: Optional[Decimal] = Field(None, ge=0, le=100)
    discount_amount: Optional[Decimal] = Field(None, ge=0)
    payment_terms: Optional[str] = Field(None, max_length=255)
    delivery_delay: Optional[str] = Field(None, max_length=100)
    internal_notes: Optional[str] = Field(None, max_length=1000)
    customer_notes: Optional[str] = Field(None, max_length=1000)


class Quote(QuoteBase):
    """Schema de réponse pour un devis."""
    id: UUID
    tenant_id: UUID
    quote_number: str
    status: str
    subtotal_ht: Decimal
    total_ht: Decimal
    total_vat: Decimal
    total_ttc: Decimal
    pdf_url: Optional[str] = None
    sales_invoice_id: Optional[UUID] = None
    user_id: Optional[UUID] = None
    items: List[QuoteItem] = []
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class QuoteWithItems(Quote):
    """Schema de réponse pour un devis avec ses lignes."""
    items: List[QuoteItem]

    model_config = ConfigDict(from_attributes=True)
