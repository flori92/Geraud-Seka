import uuid
import enum
from sqlalchemy import Column, ForeignKey, String, Float, Date, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base import Base, TimestampMixin


class DocumentStatus(str, enum.Enum):
    UPLOADED = "UPLOADED"
    OCR_PROCESSING = "OCR_PROCESSING"
    OCR_COMPLETED = "OCR_COMPLETED"
    VALIDATED = "VALIDATED"
    REJECTED = "REJECTED"
    ARCHIVED = "ARCHIVED"


class DocumentType(str, enum.Enum):
    INVOICE_PURCHASE = "INVOICE_PURCHASE"  # Facture Achat
    INVOICE_SALES = "INVOICE_SALES"      # Facture Vente
    RECEIPT = "RECEIPT"                  # Reçu
    EXPENSE_REPORT = "EXPENSE_REPORT"    # Note de frais
    OTHER = "OTHER"


class Document(Base, TimestampMixin):
    __tablename__ = "documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(512), nullable=False)  # Path in R2/Storage
    content_type = Column(String(100), nullable=True)
    file_size = Column(Float, nullable=True)
    
    status = Column(Enum(DocumentStatus), default=DocumentStatus.UPLOADED, nullable=False)
    type = Column(Enum(DocumentType), default=DocumentType.OTHER, nullable=True)
    
    # Données extraites / saisies
    reference_number = Column(String(100), nullable=True)
    date = Column(Date, nullable=True)
    due_date = Column(Date, nullable=True)
    
    amount_ht = Column(Float, nullable=True)
    amount_vat = Column(Float, nullable=True)
    amount_ttc = Column(Float, nullable=True)
    currency = Column(String(3), default="XOF", nullable=True)
    
    ocr_data = Column(String, nullable=True) # JSON string pour stocker les données brutes OCR si besoin, ou utiliser JSONB avec Postgres
    
    client_id = Column(UUID(as_uuid=True), ForeignKey("clients.id", ondelete="CASCADE"), nullable=False)
    supplier_id = Column(UUID(as_uuid=True), ForeignKey("suppliers.id", ondelete="SET NULL"), nullable=True)
    
    client = relationship("Client", backref="documents")
    supplier = relationship("Supplier", back_populates="documents")
    accounting_entries = relationship("AccountingEntry", back_populates="document", cascade="all, delete-orphan")

    __table_args__ = ({"sqlite_autoincrement": True},)
