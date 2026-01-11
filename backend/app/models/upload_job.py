from datetime import datetime
from enum import Enum
from uuid import uuid4

from sqlalchemy import Column, String, Integer, DateTime, JSON, Enum as SQLEnum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PGUUID

from app.db.base import Base


class UploadJobStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    PARTIAL = "partial"
    FAILED = "failed"
    CANCELLED = "cancelled"


class UploadJob(Base):
    __tablename__ = "upload_jobs"
    
    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    tenant_id = Column(PGUUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    user_id = Column(PGUUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    total_pages = Column(Integer, nullable=False)
    pages_per_document = Column(Integer, default=1)
    status = Column(SQLEnum(UploadJobStatus), default=UploadJobStatus.PENDING, nullable=False)
    processed_pages = Column(Integer, default=0)
    successful_documents = Column(Integer, default=0)
    failed_documents = Column(Integer, default=0)
    created_document_ids = Column(JSON, default=list)
    errors = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    client_id = Column(PGUUID(as_uuid=True), ForeignKey("clients.id"), nullable=True)
    
    @property
    def progress_percent(self) -> int:
        if self.total_pages == 0:
            return 0
        expected_docs = (self.total_pages + self.pages_per_document - 1) // self.pages_per_document
        return min(100, int((self.successful_documents + self.failed_documents) / expected_docs * 100))
    
    @property
    def expected_documents(self) -> int:
        return (self.total_pages + self.pages_per_document - 1) // self.pages_per_document
    
    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "status": self.status.value,
            "original_filename": self.original_filename,
            "total_pages": self.total_pages,
            "pages_per_document": self.pages_per_document,
            "expected_documents": self.expected_documents,
            "processed_pages": self.processed_pages,
            "successful_documents": self.successful_documents,
            "failed_documents": self.failed_documents,
            "progress_percent": self.progress_percent,
            "created_document_ids": self.created_document_ids or [],
            "errors": self.errors or [],
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
        }
