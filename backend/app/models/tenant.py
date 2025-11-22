import uuid

from sqlalchemy import Boolean, Column, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base import Base, TimestampMixin


class Tenant(Base, TimestampMixin):
    __tablename__ = "tenants"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), unique=True, nullable=False)
    subdomain = Column(String(150), unique=True, nullable=False)
    country = Column(String(64), nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    plan = Column(String(50), nullable=False, default="basic")
    stripe_customer_id = Column(String(255), nullable=True)
    subscription_status = Column(String(50), default="active")

    users = relationship(
        "User",
        back_populates="tenant",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    clients = relationship(
        "Client",
        back_populates="tenant",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    # Relations Module Ventes
    quotes = relationship(
        "Quote",
        back_populates="tenant",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    sales_invoices = relationship(
        "SalesInvoice",
        back_populates="tenant",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    purchase_orders = relationship(
        "PurchaseOrder",
        back_populates="tenant",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    delivery_notes = relationship(
        "DeliveryNote",
        back_populates="tenant",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
