import uuid
import enum
from datetime import datetime
from sqlalchemy import Column, ForeignKey, String, Text, DateTime, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base import Base, TimestampMixin


class DuplicateResolution(str, enum.Enum):
    REJECTED = "rejected"
    KEPT_BOTH = "kept_both"
    REPLACED = "replaced"


class DuplicateDetectionReason(str, enum.Enum):
    SAME_INVOICE_NUMBER = "same_invoice_number"
    SAME_AMOUNT_DATE = "same_amount_date"


class DocumentDuplicate(Base, TimestampMixin):
    __tablename__ = "document_duplicates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    new_document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    existing_document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    detection_reason = Column(SQLEnum(DuplicateDetectionReason), nullable=False)
    resolution = Column(SQLEnum(DuplicateResolution), nullable=True)
    resolution_reason = Column(Text, nullable=True)
    comparison_data = Column(Text, nullable=True)
    resolved_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    
    new_document = relationship("Document", foreign_keys=[new_document_id])
    existing_document = relationship("Document", foreign_keys=[existing_document_id])
    resolver = relationship("User", foreign_keys=[resolved_by])
    tenant = relationship("Tenant")

    __table_args__ = ({"sqlite_autoincrement": True},)
