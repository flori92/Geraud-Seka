"""Modèle Bon de Commande Achat (Purchase Order) et Bon de Livraison (Delivery Note)."""
from datetime import date, datetime
from decimal import Decimal
from enum import Enum
from sqlalchemy import Column, String, Date, Numeric, Integer, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import uuid

from app.db.base import Base


class PurchaseOrderStatus(str, Enum):
    """Statuts d'un bon de commande."""
    DRAFT = "draft"
    SENT = "sent"
    CONFIRMED = "confirmed"
    PARTIAL = "partial"  # Partiellement reçu
    RECEIVED = "received"  # Complètement reçu
    CANCELLED = "cancelled"


class PurchaseOrder(Base):
    """Bon de commande fournisseur."""
    __tablename__ = "purchase_orders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)

    po_number = Column(String(50), unique=True, nullable=False, index=True)  # BC-2024-001

    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    supplier_id = Column(UUID(as_uuid=True), ForeignKey("suppliers.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)  # Acheteur

    title = Column(String(255), nullable=False)
    description = Column(String(1000), nullable=True)
    status = Column(SQLEnum(PurchaseOrderStatus), default=PurchaseOrderStatus.DRAFT, nullable=False, index=True)

    order_date = Column(Date, default=date.today, nullable=False, index=True)
    expected_delivery_date = Column(Date, nullable=True)
    actual_delivery_date = Column(Date, nullable=True)

    subtotal_ht = Column(Numeric(15, 2), default=0, nullable=False)
    discount_percentage = Column(Numeric(5, 2), default=0, nullable=False)
    discount_amount = Column(Numeric(15, 2), default=0, nullable=False)
    total_ht = Column(Numeric(15, 2), default=0, nullable=False)
    total_vat = Column(Numeric(15, 2), default=0, nullable=False)
    total_ttc = Column(Numeric(15, 2), default=0, nullable=False)
    currency = Column(String(3), default="XOF", nullable=False)

    payment_terms = Column(String(255), nullable=True)
    delivery_address = Column(String(500), nullable=True)

    internal_notes = Column(String(1000), nullable=True)
    supplier_notes = Column(String(1000), nullable=True)

    pdf_url = Column(String(512), nullable=True)

    extra_metadata = Column("metadata", JSONB, nullable=True)

    created_at = Column(Date, default=datetime.utcnow, nullable=False)
    updated_at = Column(Date, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    tenant = relationship("Tenant", back_populates="purchase_orders")
    supplier = relationship("Supplier", back_populates="purchase_orders")
    user = relationship("User", back_populates="purchase_orders")
    items = relationship("PurchaseOrderItem", back_populates="purchase_order", cascade="all, delete-orphan")
    delivery_notes = relationship("DeliveryNote", back_populates="purchase_order", cascade="all, delete-orphan")


class PurchaseOrderItem(Base):
    """Ligne de bon de commande."""
    __tablename__ = "purchase_order_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)

    purchase_order_id = Column(UUID(as_uuid=True), ForeignKey("purchase_orders.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id", ondelete="SET NULL"), nullable=True)

    description = Column(String(500), nullable=False)
    quantity_ordered = Column(Numeric(10, 2), nullable=False)
    quantity_received = Column(Numeric(10, 2), default=0, nullable=False)
    unit_price = Column(Numeric(15, 2), nullable=False)
    discount_percentage = Column(Numeric(5, 2), default=0, nullable=False)
    vat_rate = Column(Numeric(5, 2), default=18.00, nullable=False)

    subtotal = Column(Numeric(15, 2), nullable=False)
    discount_amount = Column(Numeric(15, 2), default=0, nullable=False)
    total_ht = Column(Numeric(15, 2), nullable=False)
    total_vat = Column(Numeric(15, 2), nullable=False)
    total_ttc = Column(Numeric(15, 2), nullable=False)

    position = Column(Integer, default=0, nullable=False)

    purchase_order = relationship("PurchaseOrder", back_populates="items")
    product = relationship("Product")


class DeliveryNoteStatus(str, Enum):
    """Statuts d'un bon de livraison."""
    DRAFT = "draft"
    DELIVERED = "delivered"
    PARTIAL = "partial"
    VALIDATED = "validated"
    REJECTED = "rejected"


class DeliveryNote(Base):
    """Bon de livraison (réception marchandise)."""
    __tablename__ = "delivery_notes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)

    delivery_number = Column(String(50), unique=True, nullable=False, index=True)  # BL-2024-001

    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    purchase_order_id = Column(UUID(as_uuid=True), ForeignKey("purchase_orders.id", ondelete="CASCADE"), nullable=True, index=True)
    supplier_id = Column(UUID(as_uuid=True), ForeignKey("suppliers.id", ondelete="CASCADE"), nullable=True, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)  # Réceptionnaire

    status = Column(SQLEnum(DeliveryNoteStatus), default=DeliveryNoteStatus.DRAFT, nullable=False, index=True)
    delivery_date = Column(Date, default=date.today, nullable=False, index=True)

    carrier = Column(String(100), nullable=True)  # Transporteur
    tracking_number = Column(String(100), nullable=True)
    delivery_address = Column(String(500), nullable=True)

    received_by = Column(String(100), nullable=True)  # Nom du réceptionnaire
    signature_url = Column(String(512), nullable=True)  # URL signature scannée
    notes = Column(String(1000), nullable=True)

    pdf_url = Column(String(512), nullable=True)

    extra_metadata = Column("metadata", JSONB, nullable=True)

    created_at = Column(Date, default=datetime.utcnow, nullable=False)
    updated_at = Column(Date, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    tenant = relationship("Tenant", back_populates="delivery_notes")
    purchase_order = relationship("PurchaseOrder", back_populates="delivery_notes")
    supplier = relationship("Supplier", back_populates="delivery_notes")
    user = relationship("User", back_populates="delivery_notes")
    items = relationship("DeliveryNoteItem", back_populates="delivery_note", cascade="all, delete-orphan")


class DeliveryNoteItem(Base):
    """Ligne de bon de livraison."""
    __tablename__ = "delivery_note_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)

    delivery_note_id = Column(UUID(as_uuid=True), ForeignKey("delivery_notes.id", ondelete="CASCADE"), nullable=False, index=True)
    purchase_order_item_id = Column(UUID(as_uuid=True), ForeignKey("purchase_order_items.id", ondelete="SET NULL"), nullable=True)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id", ondelete="SET NULL"), nullable=True)

    description = Column(String(500), nullable=False)
    quantity_delivered = Column(Numeric(10, 2), nullable=False)
    quantity_accepted = Column(Numeric(10, 2), default=0, nullable=False)
    quantity_rejected = Column(Numeric(10, 2), default=0, nullable=False)

    rejection_reason = Column(String(500), nullable=True)

    position = Column(Integer, default=0, nullable=False)

    delivery_note = relationship("DeliveryNote", back_populates="items")
    purchase_order_item = relationship("PurchaseOrderItem")
    product = relationship("Product")
