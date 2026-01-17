import uuid
import enum
from datetime import datetime
from sqlalchemy import Column, ForeignKey, String, Numeric, Date, Boolean, Text, Integer, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from decimal import Decimal

from app.db.base import Base, TimestampMixin


class EntryStatus(str, enum.Enum):
    DRAFT = "draft"
    VALIDATED = "validated"
    POSTED = "posted"
    CANCELLED = "cancelled"


class JournalType(str, enum.Enum):
    PURCHASE = "ACH"
    SALE = "VTE"
    BANK = "BQ"
    CASH = "CA"
    MISC = "OD"


class AccountingEntryLine(Base, TimestampMixin):
    __tablename__ = "accounting_entry_lines"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    
    entry_id = Column(UUID(as_uuid=True), ForeignKey("accounting_entries_header.id", ondelete="CASCADE"), nullable=False)
    account_id = Column(UUID(as_uuid=True), ForeignKey("ledger_accounts.id"), nullable=False)
    
    label = Column(String(255), nullable=False)
    debit = Column(Numeric(15, 2), default=0)
    credit = Column(Numeric(15, 2), default=0)
    
    analytic_code = Column(String(50), nullable=True)
    partner_id = Column(UUID(as_uuid=True), nullable=True)
    partner_type = Column(String(20), nullable=True)
    
    reconciled = Column(Boolean, default=False)
    reconciliation_ref = Column(String(100), nullable=True)
    
    entry = relationship("AccountingEntryHeader", back_populates="lines")
    account = relationship("LedgerAccount")


class AccountingEntryHeader(Base, TimestampMixin):
    __tablename__ = "accounting_entries_header"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    
    entry_number = Column(String(50), unique=True, nullable=False)
    journal_type = Column(Enum(JournalType), nullable=False)
    
    date = Column(Date, nullable=False)
    reference = Column(String(100), nullable=True)
    description = Column(Text, nullable=False)
    
    status = Column(Enum(EntryStatus), default=EntryStatus.DRAFT)
    
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="SET NULL"), nullable=True)
    
    validated_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    validated_at = Column(Date, nullable=True)
    
    posted_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    posted_at = Column(Date, nullable=True)
    
    lines = relationship("AccountingEntryLine", back_populates="entry", cascade="all, delete-orphan")
    document = relationship("Document", foreign_keys=[document_id])





class AccountingRevision(Base, TimestampMixin):
    __tablename__ = "accounting_revisions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    
    entry_id = Column(UUID(as_uuid=True), ForeignKey("accounting_entries_header.id"), nullable=False)
    
    revision_type = Column(String(50), nullable=False)
    old_value = Column(Text, nullable=True)
    new_value = Column(Text, nullable=True)
    
    comment = Column(Text, nullable=True)
    revised_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    entry = relationship("AccountingEntryHeader")
