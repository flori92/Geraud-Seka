import uuid
import enum
from sqlalchemy import Column, ForeignKey, String, Float, Date, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base import Base, TimestampMixin


class EntryType(str, enum.Enum):
    DEBIT = "DEBIT"
    CREDIT = "CREDIT"


class AccountingEntry(Base, TimestampMixin):
    __tablename__ = "accounting_entries"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    entry_type = Column(Enum(EntryType), nullable=True)  # DEBIT ou CREDIT
    journal_code = Column(String(10), nullable=False) # ACH, VTE, OD, BQ, CA
    account_number = Column(String(20), nullable=False)
    label = Column(String(255), nullable=False)
    
    debit = Column(Float, default=0.0)
    credit = Column(Float, default=0.0)
    
    date = Column(Date, nullable=False)
    due_date = Column(Date, nullable=True)
    reference = Column(String(100), nullable=True)
    
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), nullable=True)
    client_id = Column(UUID(as_uuid=True), ForeignKey("clients.id", ondelete="CASCADE"), nullable=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    
    document = relationship("Document", back_populates="accounting_entries")
    client = relationship("Client")
    tenant = relationship("Tenant")

    __table_args__ = ({"sqlite_autoincrement": True},)
