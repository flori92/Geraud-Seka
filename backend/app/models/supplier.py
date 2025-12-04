import uuid

from sqlalchemy import Column, ForeignKey, String, Text, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base import Base, TimestampMixin


class Supplier(Base, TimestampMixin):
    __tablename__ = "suppliers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    nif = Column(String(50), nullable=True)  # Numéro d'Identification Fiscale
    
    # Contact Information
    contact_name = Column(String(255), nullable=True)
    email = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    address = Column(Text, nullable=True)
    country = Column(String(100), nullable=True, default="Bénin")
    
    # Accounting Rules (Auto-imputation)
    default_account = Column(String(20), nullable=True)  # e.g., "601100"
    default_tax_rate = Column(Numeric(5, 2), nullable=True)  # e.g., 18.00
    default_journal = Column(String(10), nullable=True)  # e.g., "ACH"
    default_description = Column(String(255), nullable=True) # e.g. "Achat chez {name}"
    
    client_id = Column(UUID(as_uuid=True), ForeignKey("clients.id", ondelete="CASCADE"), nullable=False)
    
    client = relationship("Client", backref="suppliers")
    documents = relationship("Document", back_populates="supplier")

    # Relations Module Ventes
    purchase_orders = relationship("PurchaseOrder", back_populates="supplier")
    delivery_notes = relationship("DeliveryNote", back_populates="supplier")

    __table_args__ = ({"sqlite_autoincrement": True},)
