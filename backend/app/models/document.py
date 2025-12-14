import uuid
import enum
from datetime import datetime
from sqlalchemy import Column, ForeignKey, String, Float, Date, DateTime, Enum, Text, Boolean, Integer, JSON
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
    # lead = relationship("Lead")  # Commented out due to CRM module removal
    # opportunity = relationship("Opportunity")  # Commented out due to CRM module removal
    parent_document = relationship("Document", remote_side=[id], backref="versions")
    accounting_entries = relationship("AccountingEntry", back_populates="document", cascade="all, delete-orphan")
    classifications = relationship("DocumentClassification", back_populates="document", cascade="all, delete-orphan")

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


# ==================== PERMISSIONS GED ====================

class PermissionLevel(str, enum.Enum):
    """Niveaux de permission pour les documents/dossiers"""
    VIEW = "view"           # Lecture seule
    DOWNLOAD = "download"   # Lecture + téléchargement
    EDIT = "edit"           # Modification
    DELETE = "delete"       # Suppression
    ADMIN = "admin"         # Tous les droits + gestion permissions


class ShareType(str, enum.Enum):
    """Types de partage"""
    USER = "user"           # Partage avec un utilisateur spécifique
    TEAM = "team"           # Partage avec une équipe/département
    PUBLIC = "public"       # Lien public (avec ou sans mot de passe)
    EXTERNAL = "external"   # Partage externe (email)


class DocumentPermission(Base, TimestampMixin):
    """
    Permissions sur les documents
    Permet de partager des documents avec des utilisateurs ou équipes
    """
    __tablename__ = "document_permissions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Document ou dossier concerné (un seul des deux)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), index=True)
    folder_id = Column(UUID(as_uuid=True), ForeignKey("document_folders.id", ondelete="CASCADE"), index=True)
    
    # Type de partage
    share_type = Column(String(20), nullable=False, default=ShareType.USER)
    
    # Bénéficiaire (selon le type)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    team_name = Column(String(100))  # Pour partage équipe
    external_email = Column(String(255))  # Pour partage externe
    
    # Niveau de permission
    permission_level = Column(String(20), nullable=False, default=PermissionLevel.VIEW)
    
    # Options
    can_reshare = Column(Boolean, default=False)  # Peut re-partager
    inherit_to_children = Column(Boolean, default=True)  # Hériter aux sous-dossiers/documents
    
    # Expiration
    expires_at = Column(DateTime)
    
    # Qui a partagé
    granted_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Métadonnées
    notes = Column(Text)  # Note pour le partage
    
    # Relations
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    
    # Relations inverses
    document = relationship("Document", backref="permissions")
    folder = relationship("DocumentFolder", backref="permissions")
    user = relationship("User", foreign_keys=[user_id], backref="document_permissions")
    granter = relationship("User", foreign_keys=[granted_by])
    tenant = relationship("Tenant")


class DocumentShareLink(Base, TimestampMixin):
    """
    Liens de partage public pour les documents
    Permet de générer des URLs uniques pour partager des documents
    """
    __tablename__ = "document_share_links"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Document ou dossier concerné
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), index=True)
    folder_id = Column(UUID(as_uuid=True), ForeignKey("document_folders.id", ondelete="CASCADE"), index=True)
    
    # Token unique pour l'URL
    share_token = Column(String(64), unique=True, nullable=False, index=True)
    
    # Sécurité
    password_hash = Column(String(255))  # Mot de passe optionnel (hashé)
    requires_password = Column(Boolean, default=False)
    
    # Permissions du lien
    permission_level = Column(String(20), nullable=False, default=PermissionLevel.VIEW)
    allow_download = Column(Boolean, default=True)
    
    # Limites
    max_views = Column(Integer)  # Nombre max de vues (null = illimité)
    max_downloads = Column(Integer)  # Nombre max de téléchargements
    current_views = Column(Integer, default=0)
    current_downloads = Column(Integer, default=0)
    
    # Expiration
    expires_at = Column(DateTime)
    
    # Statut
    is_active = Column(Boolean, default=True)
    
    # Métadonnées
    name = Column(String(255))  # Nom du lien (pour identification)
    notes = Column(Text)
    
    # Créateur
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Relations
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    
    # Relations inverses
    document = relationship("Document", backref="share_links")
    folder = relationship("DocumentFolder", backref="share_links")
    creator = relationship("User")
    tenant = relationship("Tenant")
    access_logs = relationship("ShareLinkAccessLog", back_populates="share_link", cascade="all, delete-orphan")

    @property
    def is_expired(self) -> bool:
        """Vérifie si le lien est expiré"""
        if self.expires_at and datetime.utcnow() > self.expires_at:
            return True
        return False
    
    @property
    def is_view_limit_reached(self) -> bool:
        """Vérifie si la limite de vues est atteinte"""
        if self.max_views and self.current_views >= self.max_views:
            return True
        return False
    
    @property
    def is_download_limit_reached(self) -> bool:
        """Vérifie si la limite de téléchargements est atteinte"""
        if self.max_downloads and self.current_downloads >= self.max_downloads:
            return True
        return False


class ShareLinkAccessLog(Base):
    """
    Journal des accès aux liens de partage
    Pour audit et statistiques
    """
    __tablename__ = "share_link_access_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Lien concerné
    share_link_id = Column(UUID(as_uuid=True), ForeignKey("document_share_links.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Type d'accès
    access_type = Column(String(20), nullable=False)  # view, download
    
    # Informations visiteur
    ip_address = Column(String(45))
    user_agent = Column(String(500))
    referer = Column(String(500))
    
    # Timestamp
    accessed_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relation
    share_link = relationship("DocumentShareLink", back_populates="access_logs")
