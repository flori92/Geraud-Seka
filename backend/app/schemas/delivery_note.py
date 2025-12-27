"""Schemas Pydantic pour les Bons de Livraison (Delivery Notes)."""
from datetime import date, datetime
from decimal import Decimal
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field



class DeliveryNoteItemBase(BaseModel):
    """Base schema pour les lignes de bon de livraison."""
    description: str = Field(..., max_length=500)
    quantity_delivered: Decimal = Field(..., gt=0)
    quantity_accepted: Decimal = Field(default=Decimal("0"), ge=0)
    quantity_rejected: Decimal = Field(default=Decimal("0"), ge=0)
    rejection_reason: Optional[str] = Field(None, max_length=500)
    position: int = Field(default=0, ge=0)
    purchase_order_item_id: Optional[UUID] = None
    product_id: Optional[UUID] = None


class DeliveryNoteItemCreate(DeliveryNoteItemBase):
    """Schema pour la création d'une ligne de bon de livraison."""
    pass


class DeliveryNoteItemUpdate(BaseModel):
    """Schema pour la mise à jour d'une ligne de bon de livraison."""
    description: Optional[str] = Field(None, max_length=500)
    quantity_delivered: Optional[Decimal] = Field(None, gt=0)
    quantity_accepted: Optional[Decimal] = Field(None, ge=0)
    quantity_rejected: Optional[Decimal] = Field(None, ge=0)
    rejection_reason: Optional[str] = Field(None, max_length=500)
    position: Optional[int] = Field(None, ge=0)
    purchase_order_item_id: Optional[UUID] = None
    product_id: Optional[UUID] = None


class DeliveryNoteItem(DeliveryNoteItemBase):
    """Schema de réponse pour une ligne de bon de livraison."""
    id: UUID
    delivery_note_id: UUID

    model_config = ConfigDict(from_attributes=True)



class DeliveryNoteBase(BaseModel):
    """Base schema pour les bons de livraison."""
    delivery_date: date = Field(default_factory=date.today)
    carrier: Optional[str] = Field(None, max_length=100)
    tracking_number: Optional[str] = Field(None, max_length=100)
    delivery_address: Optional[str] = Field(None, max_length=500)
    received_by: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = Field(None, max_length=1000)
    purchase_order_id: Optional[UUID] = None
    supplier_id: Optional[UUID] = None


class DeliveryNoteCreate(DeliveryNoteBase):
    """Schema pour la création d'un bon de livraison."""
    items: List[DeliveryNoteItemCreate] = Field(default_factory=list)


class DeliveryNoteUpdate(BaseModel):
    """Schema pour la mise à jour d'un bon de livraison."""
    status: Optional[str] = None  # draft, delivered, partial, validated, rejected
    delivery_date: Optional[date] = None
    carrier: Optional[str] = Field(None, max_length=100)
    tracking_number: Optional[str] = Field(None, max_length=100)
    delivery_address: Optional[str] = Field(None, max_length=500)
    received_by: Optional[str] = Field(None, max_length=100)
    signature_url: Optional[str] = Field(None, max_length=512)
    notes: Optional[str] = Field(None, max_length=1000)
    purchase_order_id: Optional[UUID] = None
    supplier_id: Optional[UUID] = None


class DeliveryNote(DeliveryNoteBase):
    """Schema de réponse pour un bon de livraison."""
    id: UUID
    tenant_id: UUID
    delivery_number: str
    status: str
    user_id: Optional[UUID] = None
    signature_url: Optional[str] = None
    pdf_url: Optional[str] = None
    items: List[DeliveryNoteItem] = []
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DeliveryNoteWithItems(DeliveryNote):
    """Schema de réponse pour un bon de livraison avec ses lignes."""
    items: List[DeliveryNoteItem]

    model_config = ConfigDict(from_attributes=True)
