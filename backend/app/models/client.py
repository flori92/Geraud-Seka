import uuid

from sqlalchemy import Column, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base import Base, TimestampMixin


class Client(Base, TimestampMixin):
    __tablename__ = "clients"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    slug = Column(String(150), nullable=False)
    sector = Column(String(128), nullable=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"))

    tenant = relationship("Tenant", back_populates="clients")

    # Relations Module Ventes
    quotes = relationship("Quote", back_populates="client", cascade="all, delete-orphan")
    sales_invoices = relationship("SalesInvoice", back_populates="client", cascade="all, delete-orphan")

    # Relations Module CRM (commentées car module CRM supprimé)
    # opportunities = relationship("Opportunity", back_populates="client", cascade="all, delete-orphan")
    # crm_activities = relationship("CRMActivity", back_populates="client", cascade="all, delete-orphan")
    # contacts = relationship("Contact", back_populates="client", cascade="all, delete-orphan")

    __table_args__ = ({"sqlite_autoincrement": True},)
