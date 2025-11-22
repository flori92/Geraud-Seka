"""Schemas Pydantic pour les Bons de Commande Achat (Purchase Orders)."""
from datetime import date, datetime
from decimal import Decimal
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


# ========== PurchaseOrderItem Schemas ==========

class PurchaseOrderItemBase(BaseModel):
    """Base schema pour les lignes de bon de commande."""
    description: str = Field(..., max_length=500)
    quantity_ordered: Decimal = Field(..., gt=0)
    unit_price: Decimal = Field(..., ge=0)
    discount_percentage: Decimal = Field(default=Decimal("0"), ge=0, le=100)
    vat_rate: Decimal = Field(default=Decimal("18.00"), ge=0, le=100)
    position: int = Field(default=0, ge=0)
    product_id: Optional[UUID] = None


class PurchaseOrderItemCreate(PurchaseOrderItemBase):
    """Schema pour la création d'une ligne de bon de commande."""
    pass


class PurchaseOrderItemUpdate(BaseModel):
    """Schema pour la mise à jour d'une ligne de bon de commande."""
    description: Optional[str] = Field(None, max_length=500)
    quantity_ordered: Optional[Decimal] = Field(None, gt=0)
    quantity_received: Optional[Decimal] = Field(None, ge=0)
    unit_price: Optional[Decimal] = Field(None, ge=0)
    discount_percentage: Optional[Decimal] = Field(None, ge=0, le=100)
    vat_rate: Optional[Decimal] = Field(None, ge=0, le=100)
    position: Optional[int] = Field(None, ge=0)
    product_id: Optional[UUID] = None


class PurchaseOrderItem(PurchaseOrderItemBase):
    """Schema de réponse pour une ligne de bon de commande."""
    id: UUID
    purchase_order_id: UUID
    quantity_received: Decimal
    subtotal: Decimal
    discount_amount: Decimal
    total_ht: Decimal
    total_vat: Decimal
    total_ttc: Decimal

    model_config = ConfigDict(from_attributes=True)


# ========== PurchaseOrder Schemas ==========

class PurchaseOrderBase(BaseModel):
    """Base schema pour les bons de commande."""
    title: str = Field(..., max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    supplier_id: UUID
    order_date: date = Field(default_factory=date.today)
    expected_delivery_date: Optional[date] = None
    discount_percentage: Decimal = Field(default=Decimal("0"), ge=0, le=100)
    discount_amount: Decimal = Field(default=Decimal("0"), ge=0)
    payment_terms: Optional[str] = Field(None, max_length=255)
    delivery_address: Optional[str] = Field(None, max_length=500)
    internal_notes: Optional[str] = Field(None, max_length=1000)
    supplier_notes: Optional[str] = Field(None, max_length=1000)
    currency: str = Field(default="XOF", max_length=3)


class PurchaseOrderCreate(PurchaseOrderBase):
    """Schema pour la création d'un bon de commande."""
    items: List[PurchaseOrderItemCreate] = Field(default_factory=list)


class PurchaseOrderUpdate(BaseModel):
    """Schema pour la mise à jour d'un bon de commande."""
    title: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    supplier_id: Optional[UUID] = None
    status: Optional[str] = None  # draft, sent, confirmed, partial, received, cancelled
    order_date: Optional[date] = None
    expected_delivery_date: Optional[date] = None
    actual_delivery_date: Optional[date] = None
    discount_percentage: Optional[Decimal] = Field(None, ge=0, le=100)
    discount_amount: Optional[Decimal] = Field(None, ge=0)
    payment_terms: Optional[str] = Field(None, max_length=255)
    delivery_address: Optional[str] = Field(None, max_length=500)
    internal_notes: Optional[str] = Field(None, max_length=1000)
    supplier_notes: Optional[str] = Field(None, max_length=1000)


class PurchaseOrder(PurchaseOrderBase):
    """Schema de réponse pour un bon de commande."""
    id: UUID
    tenant_id: UUID
    po_number: str
    status: str
    user_id: Optional[UUID] = None
    subtotal_ht: Decimal
    total_ht: Decimal
    total_vat: Decimal
    total_ttc: Decimal
    actual_delivery_date: Optional[date] = None
    pdf_url: Optional[str] = None
    items: List[PurchaseOrderItem] = []
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PurchaseOrderWithItems(PurchaseOrder):
    """Schema de réponse pour un bon de commande avec ses lignes."""
    items: List[PurchaseOrderItem]

    model_config = ConfigDict(from_attributes=True)
