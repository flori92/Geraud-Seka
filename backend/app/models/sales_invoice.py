"""Modèle Facture de Vente (Sales Invoice)."""
from datetime import date, datetime
from decimal import Decimal
from enum import Enum
from sqlalchemy import Column, String, Date, Numeric, Integer, ForeignKey, Enum as SQLEnum, Boolean
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import uuid

from app.db.base import Base


class PaymentStatus(str, Enum):
    """Statuts de paiement."""
    UNPAID = "unpaid"
    PARTIAL = "partial"
    PAID = "paid"
    OVERDUE = "overdue"
    CANCELLED = "cancelled"


class SalesInvoice(Base):
    """Facture de vente client."""
    __tablename__ = "sales_invoices"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)

    # Numérotation
    invoice_number = Column(String(50), unique=True, nullable=False, index=True)  # FAC-2024-001

    # Relations
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    client_id = Column(UUID(as_uuid=True), ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)
    quote_id = Column(UUID(as_uuid=True), ForeignKey("quotes.id", ondelete="SET NULL"), nullable=True)  # Devis source
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)  # Commercial

    # Informations générales
    title = Column(String(255), nullable=False)
    description = Column(String(1000), nullable=True)

    # Dates
    issue_date = Column(Date, default=date.today, nullable=False, index=True)
    due_date = Column(Date, nullable=False, index=True)  # Date d'échéance
    payment_date = Column(Date, nullable=True)  # Date de paiement effectif

    # Montants
    subtotal_ht = Column(Numeric(15, 2), default=0, nullable=False)
    discount_percentage = Column(Numeric(5, 2), default=0, nullable=False)
    discount_amount = Column(Numeric(15, 2), default=0, nullable=False)
    total_ht = Column(Numeric(15, 2), default=0, nullable=False)
    total_vat = Column(Numeric(15, 2), default=0, nullable=False)
    total_ttc = Column(Numeric(15, 2), default=0, nullable=False)
    currency = Column(String(3), default="XOF", nullable=False)

    # Paiement
    payment_status = Column(SQLEnum(PaymentStatus), default=PaymentStatus.UNPAID, nullable=False, index=True)
    paid_amount = Column(Numeric(15, 2), default=0, nullable=False)  # Montant déjà payé
    balance_due = Column(Numeric(15, 2), nullable=False)  # Solde à payer
    payment_method = Column(String(50), nullable=True)  # virement, espèces, carte, etc.
    payment_reference = Column(String(100), nullable=True)  # Référence transaction

    # Pénalités de retard
    late_fee_enabled = Column(Boolean, default=False, nullable=False)
    late_fee_percentage = Column(Numeric(5, 2), default=0, nullable=False)
    late_fee_amount = Column(Numeric(15, 2), default=0, nullable=False)

    # Acomptes
    deposit_required = Column(Boolean, default=False, nullable=False)
    deposit_percentage = Column(Numeric(5, 2), default=0, nullable=False)
    deposit_amount = Column(Numeric(15, 2), default=0, nullable=False)
    deposit_paid = Column(Boolean, default=False, nullable=False)

    # Notes
    internal_notes = Column(String(1000), nullable=True)
    customer_notes = Column(String(1000), nullable=True)

    # Fichiers
    pdf_url = Column(String(512), nullable=True)

    # Récurrence (pour abonnements)
    is_recurring = Column(Boolean, default=False, nullable=False)
    recurrence_interval = Column(String(20), nullable=True)  # monthly, quarterly, yearly
    next_invoice_date = Column(Date, nullable=True)

    # Relances
    reminder_sent_count = Column(Integer, default=0, nullable=False)
    last_reminder_sent = Column(Date, nullable=True)

    # Métadonnées
    extra_metadata = Column("metadata", JSONB, nullable=True)  # Champs personnalisés

    # Timestamps
    created_at = Column(Date, default=datetime.utcnow, nullable=False)
    updated_at = Column(Date, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relations
    tenant = relationship("Tenant", back_populates="sales_invoices")
    client = relationship("Client", back_populates="sales_invoices")
    user = relationship("User", back_populates="sales_invoices")
    quote = relationship("Quote", back_populates="sales_invoices", foreign_keys=[quote_id])
    items = relationship("SalesInvoiceItem", back_populates="sales_invoice", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="sales_invoice", cascade="all, delete-orphan")


class SalesInvoiceItem(Base):
    """Ligne de facture de vente."""
    __tablename__ = "sales_invoice_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)

    # Relations
    sales_invoice_id = Column(UUID(as_uuid=True), ForeignKey("sales_invoices.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id", ondelete="SET NULL"), nullable=True)

    # Détails
    description = Column(String(500), nullable=False)
    quantity = Column(Numeric(10, 2), default=1, nullable=False)
    unit_price = Column(Numeric(15, 2), nullable=False)
    discount_percentage = Column(Numeric(5, 2), default=0, nullable=False)
    vat_rate = Column(Numeric(5, 2), default=18.00, nullable=False)

    # Montants
    subtotal = Column(Numeric(15, 2), nullable=False)
    discount_amount = Column(Numeric(15, 2), default=0, nullable=False)
    total_ht = Column(Numeric(15, 2), nullable=False)
    total_vat = Column(Numeric(15, 2), nullable=False)
    total_ttc = Column(Numeric(15, 2), nullable=False)

    # Ordre
    position = Column(Integer, default=0, nullable=False)

    # Relations
    sales_invoice = relationship("SalesInvoice", back_populates="items")
    product = relationship("Product")


class Payment(Base):
    """Paiement reçu pour une facture."""
    __tablename__ = "payments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)

    # Relations
    sales_invoice_id = Column(UUID(as_uuid=True), ForeignKey("sales_invoices.id", ondelete="CASCADE"), nullable=False, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)

    # Détails paiement
    payment_date = Column(Date, default=date.today, nullable=False, index=True)
    amount = Column(Numeric(15, 2), nullable=False)
    payment_method = Column(String(50), nullable=False)  # virement, espèces, carte, mobile_money
    reference = Column(String(100), nullable=True)  # Numéro transaction
    notes = Column(String(500), nullable=True)

    # Timestamps
    created_at = Column(Date, default=datetime.utcnow, nullable=False)

    # Relations
    sales_invoice = relationship("SalesInvoice", back_populates="payments")
    tenant = relationship("Tenant")
