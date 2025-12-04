import uuid
import enum
from sqlalchemy import Column, ForeignKey, String, Float, Date, Enum, Text, Boolean, Integer, JSON
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
    # Documents comptables
    INVOICE_PURCHASE = "INVOICE_PURCHASE"  # Facture Achat
    INVOICE_SALES = "INVOICE_SALES"      # Facture Vente
    RECEIPT = "RECEIPT"                  # Reçu
    EXPENSE_REPORT = "EXPENSE_REPORT"    # Note de frais
    QUOTE = "QUOTE"                      # Devis
    DELIVERY_NOTE = "DELIVERY_NOTE"      # Bon de livraison
    PURCHASE_ORDER = "PURCHASE_ORDER"    # Bon de commande
    
    # Documents RH
    CONTRACT = "CONTRACT"                # Contrat
    PAYSLIP = "PAYSLIP"                  # Bulletin de paie
    LEAVE_REQUEST = "LEAVE_REQUEST"      # Demande de congé
    ID_DOCUMENT = "ID_DOCUMENT"          # Pièce d'identité
    DIPLOMA = "DIPLOMA"                  # Diplôme
    
    # Documents juridiques
    LEGAL_DOCUMENT = "LEGAL_DOCUMENT"    # Document juridique
    CERTIFICATE = "CERTIFICATE"          # Certificat
    LICENSE = "LICENSE"                  # Licence
    
    # Documents commerciaux
    PRESENTATION = "PRESENTATION"        # Présentation
    PROPOSAL = "PROPOSAL"                # Proposition commerciale
    AGREEMENT = "AGREEMENT"              # Accord
    
    # Autres
    REPORT = "REPORT"                    # Rapport
    SPREADSHEET = "SPREADSHEET"          # Tableur
    IMAGE = "IMAGE"                      # Image
    OTHER = "OTHER"                      # Autre


class DocumentCategory(str, enum.Enum):
    """Catégories principales de documents"""
    ACCOUNTING = "accounting"            # Comptabilité
    HR = "hr"                            # Ressources Humaines
    SALES = "sales"                      # Commercial/Ventes
    PURCHASES = "purchases"              # Achats
    LEGAL = "legal"                      # Juridique
    ADMINISTRATIVE = "administrative"    # Administratif
    TECHNICAL = "technical"              # Technique
    MARKETING = "marketing"              # Marketing
    PROJECT = "project"                  # Projet
    OTHER = "other"                      # Autre


class DocumentFolder(Base, TimestampMixin):
    """Dossiers pour organiser les documents en arborescence"""
    __tablename__ = "document_folders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    color = Column(String(7))  # Code couleur hex
    icon = Column(String(50))  # Nom de l'icône
    
    # Arborescence
    parent_id = Column(UUID(as_uuid=True), ForeignKey("document_folders.id", ondelete="CASCADE"))
    path = Column(String(1000))  # Chemin complet pour recherche rapide
    
    # Permissions
    is_public = Column(Boolean, default=False)
    
    # Relations
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    
    # Relations inverses
    tenant = relationship("Tenant")
    creator = relationship("User")
    parent = relationship("DocumentFolder", remote_side=[id], backref="subfolders")
    documents = relationship("Document", back_populates="folder")

    __table_args__ = ({"sqlite_autoincrement": True},)


class Document(Base, TimestampMixin):
    """Modèle de document pour la GED (Gestion Électronique de Documents)"""
    __tablename__ = "documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Informations fichier
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)  # Nom original
    file_path = Column(String(512), nullable=False)  # Path in R2/Storage
    content_type = Column(String(100), nullable=True)
    file_size = Column(Integer, nullable=True)  # En bytes
    file_extension = Column(String(10))  # .pdf, .docx, etc.
    
    # Classification
    title = Column(String(500))  # Titre du document
    description = Column(Text)  # Description
    status = Column(Enum(DocumentStatus), default=DocumentStatus.UPLOADED, nullable=False)
    type = Column(Enum(DocumentType), default=DocumentType.OTHER, nullable=True)
    category = Column(Enum(DocumentCategory), default=DocumentCategory.OTHER, nullable=True)
    
    # Métadonnées
    tags = Column(JSON)  # Liste de tags
    custom_fields = Column(JSON)  # Champs personnalisés
    reference_number = Column(String(100), nullable=True)  # Numéro de référence
    
    # Dates importantes
    document_date = Column(Date, nullable=True)  # Date du document
    due_date = Column(Date, nullable=True)  # Date d'échéance
    expiry_date = Column(Date, nullable=True)  # Date d'expiration
    
    # Données financières (pour factures, devis, etc.)
    amount_ht = Column(Float, nullable=True)
    amount_vat = Column(Float, nullable=True)
    amount_ttc = Column(Float, nullable=True)
    currency = Column(String(3), default="XOF", nullable=True)
    
    # Versioning
    version = Column(Integer, default=1)
    parent_document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="SET NULL"))
    is_latest_version = Column(Boolean, default=True)
    
    # OCR et IA
    ocr_data = Column(JSON)  # Données OCR extraites
    ocr_confidence = Column(Float)  # Score de confiance OCR
    ai_extracted_data = Column(JSON)  # Données extraites par IA
    
    # Sécurité et permissions
    is_confidential = Column(Boolean, default=False)
    is_archived = Column(Boolean, default=False)
    is_locked = Column(Boolean, default=False)  # Verrouillé pour modification
    
    # Workflow
    requires_validation = Column(Boolean, default=False)
    validated_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    validated_at = Column(Date)
    
    # Relations flexibles (optionnelles)
    folder_id = Column(UUID(as_uuid=True), ForeignKey("document_folders.id", ondelete="SET NULL"))
    client_id = Column(UUID(as_uuid=True), ForeignKey("clients.id", ondelete="SET NULL"))
    supplier_id = Column(UUID(as_uuid=True), ForeignKey("suppliers.id", ondelete="SET NULL"))
    lead_id = Column(UUID(as_uuid=True), ForeignKey("leads.id", ondelete="SET NULL"))
    opportunity_id = Column(UUID(as_uuid=True), ForeignKey("opportunities.id", ondelete="SET NULL"))
    
    # Relations système
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    uploaded_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Relations inverses
    tenant = relationship("Tenant")
    uploader = relationship("User", foreign_keys=[uploaded_by])
    validator = relationship("User", foreign_keys=[validated_by])
    folder = relationship("DocumentFolder", back_populates="documents")
    client = relationship("Client", backref="documents")
    supplier = relationship("Supplier", back_populates="documents")
    lead = relationship("Lead")
    opportunity = relationship("Opportunity")
    parent_document = relationship("Document", remote_side=[id], backref="versions")
    accounting_entries = relationship("AccountingEntry", back_populates="document", cascade="all, delete-orphan")

    @property
    def file_size_formatted(self) -> str:
        """Taille du fichier formatée"""
        if not self.file_size:
            return "0 B"
        
        size = self.file_size
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size < 1024.0:
                return f"{size:.1f} {unit}"
            size /= 1024.0
        return f"{size:.1f} TB"
    
    @property
    def full_path(self) -> str:
        """Chemin complet du document avec dossiers"""
        if self.folder and self.folder.path:
            return f"{self.folder.path}/{self.filename}"
        return self.filename

    __table_args__ = ({"sqlite_autoincrement": True},)
