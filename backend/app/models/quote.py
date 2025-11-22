"""Modèle Devis (Quote)."""
from datetime import date, datetime
from decimal import Decimal
from enum import Enum
from sqlalchemy import Column, String, Date, Numeric, Integer, ForeignKey, Enum as SQLEnum, JSON
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import uuid

from app.db.base import Base


class QuoteStatus(str, Enum):
    """Statuts possibles d'un devis."""
    DRAFT = "draft"
    SENT = "sent"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    EXPIRED = "expired"
    CONVERTED = "converted"  # Converti en facture


class Quote(Base):
    """Devis/Proposition commerciale."""
    __tablename__ = "quotes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)

    # Numérotation
    quote_number = Column(String(50), unique=True, nullable=False, index=True)  # QUOTE-2024-001

    # Relations
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    client_id = Column(UUID(as_uuid=True), ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)  # Commercial assigné
    opportunity_id = Column(UUID(as_uuid=True), ForeignKey("opportunities.id", ondelete="SET NULL"), nullable=True)  # Opportunité source

    # Informations générales
    title = Column(String(255), nullable=False)
    description = Column(String(1000), nullable=True)
    status = Column(SQLEnum(QuoteStatus), default=QuoteStatus.DRAFT, nullable=False, index=True)

    # Dates
    issue_date = Column(Date, default=date.today, nullable=False)
    expiry_date = Column(Date, nullable=False)  # Date de validité
    sent_at = Column(Date, nullable=True)
    accepted_at = Column(Date, nullable=True)
    rejected_at = Column(Date, nullable=True)

    # Montants
    subtotal_ht = Column(Numeric(15, 2), default=0, nullable=False)  # Total HT avant remise
    discount_percentage = Column(Numeric(5, 2), default=0, nullable=False)  # Remise %
    discount_amount = Column(Numeric(15, 2), default=0, nullable=False)  # Remise montant
    total_ht = Column(Numeric(15, 2), default=0, nullable=False)  # HT après remise
    total_vat = Column(Numeric(15, 2), default=0, nullable=False)  # TVA totale
    total_ttc = Column(Numeric(15, 2), default=0, nullable=False)  # TTC final
    currency = Column(String(3), default="XOF", nullable=False)

    # Conditions commerciales
    payment_terms = Column(String(255), nullable=True)  # Conditions paiement
    delivery_delay = Column(String(100), nullable=True)  # Délai livraison
    validity_days = Column(Integer, default=30, nullable=False)  # Validité en jours

    # Notes
    internal_notes = Column(String(1000), nullable=True)  # Notes internes (non visibles client)
    customer_notes = Column(String(1000), nullable=True)  # Notes visibles client

    # Fichiers
    pdf_url = Column(String(512), nullable=True)  # URL PDF généré

    # Conversion
    sales_invoice_id = Column(UUID(as_uuid=True), ForeignKey("sales_invoices.id", ondelete="SET NULL"), nullable=True)

    # Métadonnées
    extra_metadata = Column("metadata", JSONB, nullable=True)  # Champs personnalisés

    # Timestamps
    created_at = Column(Date, default=datetime.utcnow, nullable=False)
    updated_at = Column(Date, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relations
    tenant = relationship("Tenant", back_populates="quotes")
    client = relationship("Client", back_populates="quotes")
    user = relationship("User", back_populates="quotes")
    items = relationship("QuoteItem", back_populates="quote", cascade="all, delete-orphan")
    sales_invoice = relationship(
        "SalesInvoice",
        back_populates="quote",
        primaryjoin="Quote.sales_invoice_id==SalesInvoice.id",
        uselist=False,
    )
    opportunity = relationship("Opportunity", back_populates="quotes")


class QuoteItem(Base):
    """Ligne de devis (produit/service)."""
    __tablename__ = "quote_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)

    # Relations
    quote_id = Column(UUID(as_uuid=True), ForeignKey("quotes.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id", ondelete="SET NULL"), nullable=True)

    # Ligne manuelle ou produit
    description = Column(String(500), nullable=False)
    quantity = Column(Numeric(10, 2), default=1, nullable=False)
    unit_price = Column(Numeric(15, 2), nullable=False)
    discount_percentage = Column(Numeric(5, 2), default=0, nullable=False)
    vat_rate = Column(Numeric(5, 2), default=18.00, nullable=False)  # Taux TVA (18% défaut)

    # Montants calculés
    subtotal = Column(Numeric(15, 2), nullable=False)  # quantity * unit_price
    discount_amount = Column(Numeric(15, 2), default=0, nullable=False)
    total_ht = Column(Numeric(15, 2), nullable=False)  # subtotal - discount
    total_vat = Column(Numeric(15, 2), nullable=False)  # total_ht * vat_rate
    total_ttc = Column(Numeric(15, 2), nullable=False)  # total_ht + total_vat

    # Ordre d'affichage
    position = Column(Integer, default=0, nullable=False)

    # Relations
    quote = relationship("Quote", back_populates="items")
    product = relationship("Product")
