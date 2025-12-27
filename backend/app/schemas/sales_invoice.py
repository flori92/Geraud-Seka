"""Schemas Pydantic pour les Factures de Vente (Sales Invoices) et Paiements."""
from datetime import date, datetime
from decimal import Decimal
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field



class PaymentBase(BaseModel):
    """Base schema pour les paiements."""
    amount: Decimal = Field(..., gt=0)
    payment_method: str = Field(..., max_length=50)  # virement, espèces, carte, mobile_money
    payment_date: date = Field(default_factory=date.today)
    reference: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = Field(None, max_length=500)


class PaymentCreate(PaymentBase):
    """Schema pour l'enregistrement d'un paiement."""
    sales_invoice_id: UUID


class PaymentUpdate(BaseModel):
    """Schema pour la mise à jour d'un paiement."""
    amount: Optional[Decimal] = Field(None, gt=0)
    payment_method: Optional[str] = Field(None, max_length=50)
    payment_date: Optional[date] = None
    reference: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = Field(None, max_length=500)


class Payment(PaymentBase):
    """Schema de réponse pour un paiement."""
    id: UUID
    sales_invoice_id: UUID
    tenant_id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)



class SalesInvoiceItemBase(BaseModel):
    """Base schema pour les lignes de facture."""
    description: str = Field(..., max_length=500)
    quantity: Decimal = Field(..., gt=0)
    unit_price: Decimal = Field(..., ge=0)
    discount_percentage: Decimal = Field(default=Decimal("0"), ge=0, le=100)
    vat_rate: Decimal = Field(default=Decimal("18.00"), ge=0, le=100)
    position: int = Field(default=0, ge=0)
    product_id: Optional[UUID] = None


class SalesInvoiceItemCreate(SalesInvoiceItemBase):
    """Schema pour la création d'une ligne de facture."""
    pass


class SalesInvoiceItemUpdate(BaseModel):
    """Schema pour la mise à jour d'une ligne de facture."""
    description: Optional[str] = Field(None, max_length=500)
    quantity: Optional[Decimal] = Field(None, gt=0)
    unit_price: Optional[Decimal] = Field(None, ge=0)
    discount_percentage: Optional[Decimal] = Field(None, ge=0, le=100)
    vat_rate: Optional[Decimal] = Field(None, ge=0, le=100)
    position: Optional[int] = Field(None, ge=0)
    product_id: Optional[UUID] = None


class SalesInvoiceItem(SalesInvoiceItemBase):
    """Schema de réponse pour une ligne de facture."""
    id: UUID
    sales_invoice_id: UUID
    subtotal: Decimal
    discount_amount: Decimal
    total_ht: Decimal
    total_vat: Decimal
    total_ttc: Decimal

    model_config = ConfigDict(from_attributes=True)



class SalesInvoiceBase(BaseModel):
    """Base schema pour les factures de vente."""
    title: str = Field(..., max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    client_id: UUID
    issue_date: date = Field(default_factory=date.today)
    due_date: date
    discount_percentage: Decimal = Field(default=Decimal("0"), ge=0, le=100)
    discount_amount: Decimal = Field(default=Decimal("0"), ge=0)
    payment_method: Optional[str] = Field(None, max_length=50)
    late_fee_enabled: bool = Field(default=False)
    late_fee_percentage: Decimal = Field(default=Decimal("0"), ge=0, le=100)
    deposit_required: bool = Field(default=False)
    deposit_percentage: Decimal = Field(default=Decimal("0"), ge=0, le=100)
    deposit_amount: Decimal = Field(default=Decimal("0"), ge=0)
    internal_notes: Optional[str] = Field(None, max_length=1000)
    customer_notes: Optional[str] = Field(None, max_length=1000)
    currency: str = Field(default="XOF", max_length=3)
    is_recurring: bool = Field(default=False)
    recurrence_interval: Optional[str] = Field(None, max_length=20)  # monthly, quarterly, yearly


class SalesInvoiceCreate(SalesInvoiceBase):
    """Schema pour la création d'une facture de vente."""
    quote_id: Optional[UUID] = None
    items: List[SalesInvoiceItemCreate] = Field(default_factory=list)


class SalesInvoiceUpdate(BaseModel):
    """Schema pour la mise à jour d'une facture de vente."""
    title: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    client_id: Optional[UUID] = None
    payment_status: Optional[str] = None  # unpaid, partial, paid, overdue, cancelled
    issue_date: Optional[date] = None
    due_date: Optional[date] = None
    payment_date: Optional[date] = None
    discount_percentage: Optional[Decimal] = Field(None, ge=0, le=100)
    discount_amount: Optional[Decimal] = Field(None, ge=0)
    payment_method: Optional[str] = Field(None, max_length=50)
    payment_reference: Optional[str] = Field(None, max_length=100)
    late_fee_enabled: Optional[bool] = None
    late_fee_percentage: Optional[Decimal] = Field(None, ge=0, le=100)
    deposit_required: Optional[bool] = None
    deposit_percentage: Optional[Decimal] = Field(None, ge=0, le=100)
    deposit_paid: Optional[bool] = None
    internal_notes: Optional[str] = Field(None, max_length=1000)
    customer_notes: Optional[str] = Field(None, max_length=1000)
    is_recurring: Optional[bool] = None
    recurrence_interval: Optional[str] = Field(None, max_length=20)
    next_invoice_date: Optional[date] = None


class SalesInvoice(SalesInvoiceBase):
    """Schema de réponse pour une facture de vente."""
    id: UUID
    tenant_id: UUID
    invoice_number: str
    payment_status: str
    quote_id: Optional[UUID] = None
    user_id: Optional[UUID] = None
    subtotal_ht: Decimal
    total_ht: Decimal
    total_vat: Decimal
    total_ttc: Decimal
    paid_amount: Decimal
    balance_due: Decimal
    late_fee_amount: Decimal
    deposit_paid: bool
    payment_date: Optional[date] = None
    payment_reference: Optional[str] = None
    pdf_url: Optional[str] = None
    reminder_sent_count: int
    last_reminder_sent: Optional[date] = None
    next_invoice_date: Optional[date] = None
    items: List[SalesInvoiceItem] = []
    payments: List[Payment] = []
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SalesInvoiceWithDetails(SalesInvoice):
    """Schema de réponse pour une facture avec tous ses détails."""
    items: List[SalesInvoiceItem]
    payments: List[Payment]

    model_config = ConfigDict(from_attributes=True)
