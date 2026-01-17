import uuid

from sqlalchemy import Column, ForeignKey, String, Text, Numeric, Boolean, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base import Base, TimestampMixin


class Client(Base, TimestampMixin):
    """
    Modèle Client (Tiers) avec interconnexion Plan Comptable et Règles
    
    Logique d'interconnexion SEKA Business:
    - Chaque client est lié à un compte auxiliaire (ex: 411CLI01)
    - Le compte auxiliaire est créé automatiquement lors de la création du client
    - Une règle d'imputation peut être associée pour l'auto-comptabilisation des factures de vente
    """
    __tablename__ = "clients"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Informations de base
    name = Column(String(255), nullable=False)
    slug = Column(String(150), nullable=False)
    code = Column(String(20), nullable=True, index=True)  # Code client (ex: CLI01, CLI02)
    sector = Column(String(128), nullable=True)
    nif = Column(String(50), nullable=True)  # Numéro d'Identification Fiscale (IFU)
    rccm = Column(String(50), nullable=True)  # Registre du Commerce
    
    # Coordonnées
    contact_name = Column(String(255), nullable=True)
    email = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    address = Column(Text, nullable=True)
    country = Column(String(100), nullable=True, default="Bénin")
    
    # ===== INTERCONNEXION PLAN COMPTABLE =====
    # Compte auxiliaire lié (créé automatiquement, ex: 411CLI01)
    auxiliary_account_id = Column(UUID(as_uuid=True), ForeignKey("chart_of_accounts.id", ondelete="SET NULL"), nullable=True)
    auxiliary_account_code = Column(String(20), nullable=True)  # Cache du code compte (ex: 411CLI01)
    
    # Compte collectif parent (par défaut 411 - Clients)
    collective_account_code = Column(String(10), nullable=True, default="411")
    
    # ===== RÈGLE D'IMPUTATION PAR DÉFAUT =====
    # Référence vers la règle d'imputation associée
    default_rule_id = Column(UUID(as_uuid=True), ForeignKey("accounting_rules.id", ondelete="SET NULL"), nullable=True)
    has_active_rule = Column(Boolean, default=False)  # Flag pour affichage rapide
    
    # Comptes par défaut pour imputation (utilisés si pas de règle)
    default_revenue_account = Column(String(20), nullable=True)  # Compte de produit (ex: 701, 706)
    default_vat_account = Column(String(20), nullable=True, default="4457")  # TVA collectée
    default_tax_rate = Column(Numeric(5, 2), nullable=True, default=18.00)  # Taux TVA (18% Bénin)
    default_journal = Column(String(10), nullable=True, default="VTE")  # Journal ventes
    default_description = Column(String(255), nullable=True)  # Template libellé
    
    # Mots-clés pour reconnaissance OCR
    ocr_keywords = Column(JSON, nullable=True)  # ["Entreprise ABC", "ABC SA"]
    
    # Métadonnées pour apprentissage et données additionnelles
    client_metadata = Column(JSON, nullable=True)  # {"learning_corrections": [...], "conditional_rules": [...]}
    
    # Tenant (entreprise)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"))

    # Relations
    tenant = relationship("Tenant", back_populates="clients")
    quotes = relationship("Quote", back_populates="client", cascade="all, delete-orphan")
    sales_invoices = relationship("SalesInvoice", back_populates="client", cascade="all, delete-orphan")
    
    # Relation vers le compte auxiliaire
    auxiliary_account = relationship("ChartOfAccounts", foreign_keys=[auxiliary_account_id])
    
    # Relation vers la règle d'imputation
    default_rule = relationship("AccountingRule", foreign_keys=[default_rule_id])

    __table_args__ = ({"sqlite_autoincrement": True},)
    
    def generate_auxiliary_code(self) -> str:
        """Génère le code du compte auxiliaire basé sur le code client"""
        base_code = self.collective_account_code or "411"
        client_code = (self.code or self.name[:6]).upper().replace(" ", "")
        
        # Ensure total length <= 20 (Account number limit)
        max_len = 20 - len(base_code)
        if len(client_code) > max_len:
            client_code = client_code[:max_len]
            
        return f"{base_code}{client_code}"
