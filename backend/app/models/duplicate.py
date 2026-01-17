"""
Modèle pour la gestion des doublons de factures
"""
import uuid
import enum
from datetime import datetime
from sqlalchemy import Column, ForeignKey, String, Text, DateTime, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base import Base, TimestampMixin


class DuplicateResolution(str, enum.Enum):
    """Type de résolution du doublon"""
    REJECTED = "rejected"  # Doublon rejeté, on garde l'existant
    KEPT_BOTH = "kept_both"  # Les deux conservés (pas un vrai doublon)
    REPLACED = "replaced"  # L'ancien remplacé par le nouveau


class DuplicateDetectionReason(str, enum.Enum):
    """Raison de la détection du doublon"""
    SAME_INVOICE_NUMBER = "same_invoice_number"  # Même fournisseur + même N° facture
    SAME_AMOUNT_DATE = "same_amount_date"  # Même fournisseur + même montant + même date


class DocumentDuplicate(Base, TimestampMixin):
    """
    Historique des doublons détectés et leur résolution
    """
    __tablename__ = "document_duplicates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Document nouvellement uploadé (potentiel doublon)
    new_document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    
    # Document existant (original)
    existing_document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    
    # Raison de la détection
    detection_reason = Column(SQLEnum(DuplicateDetectionReason), nullable=False)
    
    # Résolution choisie par l'utilisateur
    resolution = Column(SQLEnum(DuplicateResolution), nullable=True)
    resolution_reason = Column(Text, nullable=True)  # Motif si kept_both
    
    # Métadonnées de comparaison
    comparison_data = Column(Text, nullable=True)  # JSON des différences
    
    # Qui a résolu
    resolved_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    
    # Tenant
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    
    # Relations
    new_document = relationship("Document", foreign_keys=[new_document_id])
    existing_document = relationship("Document", foreign_keys=[existing_document_id])
    resolver = relationship("User", foreign_keys=[resolved_by])
    tenant = relationship("Tenant")

    __table_args__ = ({"sqlite_autoincrement": True},)
