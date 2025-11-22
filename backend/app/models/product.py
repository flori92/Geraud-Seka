import uuid
from sqlalchemy import Column, ForeignKey, String, Numeric, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base import Base, TimestampMixin

class Product(Base, TimestampMixin):
    __tablename__ = "products"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    name = Column(String(255), nullable=False)
    sku = Column(String(100), nullable=True) # Stock Keeping Unit / Reference
    price = Column(Numeric(15, 2), nullable=False, default=0)
    stock_quantity = Column(Integer, nullable=False, default=0)
    min_stock_alert = Column(Integer, nullable=True, default=5)
    
    # Links
    client_id = Column(UUID(as_uuid=True), ForeignKey("clients.id", ondelete="CASCADE"), nullable=False)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)

    client = relationship("Client")
    tenant = relationship("Tenant")

    # Note: Product est référencé par QuoteItem, SalesInvoiceItem, PurchaseOrderItem, DeliveryNoteItem
    # Les relations inverses sont gérées automatiquement par SQLAlchemy via les ForeignKeys

    __table_args__ = ({"sqlite_autoincrement": True},)
