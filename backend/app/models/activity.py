import uuid
import enum
from sqlalchemy import Column, ForeignKey, String, Numeric, Date, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base import Base, TimestampMixin

class ActivityType(str, enum.Enum):
    REVENUE = "REVENUE"
    EXPENSE = "EXPENSE"

class Activity(Base, TimestampMixin):
    __tablename__ = "activities"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    type = Column(Enum(ActivityType), nullable=False)
    date = Column(Date, nullable=False)
    amount = Column(Numeric(15, 2), nullable=False)
    description = Column(String(255), nullable=True)
    
    # Links
    client_id = Column(UUID(as_uuid=True), ForeignKey("clients.id", ondelete="CASCADE"), nullable=False)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)

    client = relationship("Client")
    tenant = relationship("Tenant")

    __table_args__ = ({"sqlite_autoincrement": True},)
