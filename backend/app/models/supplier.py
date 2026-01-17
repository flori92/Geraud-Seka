import uuid

from sqlalchemy import Column, ForeignKey, String, Text, Numeric, Boolean, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base import Base, TimestampMixin


class Supplier(Base, TimestampMixin):
    """
    Modèle Fournisseur (Tiers) avec interconnexion Plan Comptable et Règles
    
    Logique d'interconnexion SEKA Business:
    - Chaque fournisseur est lié à un compte auxiliaire (ex: 401SBEE)
    - Le compte auxiliaire est créé automatiquement lors de la création du fournisseur
    - Une règle d'imputation peut être associée pour l'auto-comptabilisation
    """
    __tablename__ = "suppliers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Informations de base
    code = Column(String(20), nullable=True, index=True)  # Code fournisseur (ex: SBEE, MTN)
    name = Column(String(255), nullable=False)
    nif = Column(String(50), nullable=True)  # Numéro d'Identification Fiscale (IFU)
    rccm = Column(String(50), nullable=True)  # Registre du Commerce
    
    # Coordonnées
    contact_name = Column(String(255), nullable=True)
    email = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    address = Column(Text, nullable=True)
    country = Column(String(100), nullable=True, default="Bénin")
    
    # ===== INTERCONNEXION PLAN COMPTABLE =====
    # Compte auxiliaire lié (créé automatiquement, ex: 401SBEE)
    auxiliary_account_id = Column(UUID(as_uuid=True), ForeignKey("chart_of_accounts.id", ondelete="SET NULL"), nullable=True)
    auxiliary_account_code = Column(String(20), nullable=True)  # Cache du code compte (ex: 401SBEE)
    
    # Compte collectif parent (par défaut 401 - Fournisseurs)
    collective_account_code = Column(String(10), nullable=True, default="401")
    
    # ===== RÈGLE D'IMPUTATION PAR DÉFAUT =====
    # Référence vers la règle d'imputation associée
    default_rule_id = Column(UUID(as_uuid=True), ForeignKey("accounting_rules.id", ondelete="SET NULL"), nullable=True)
    has_active_rule = Column(Boolean, default=False)  # Flag pour affichage rapide
    
    # Comptes par défaut pour imputation (utilisés si pas de règle)
    default_charge_account = Column(String(20), nullable=True)  # Compte de charge (ex: 6061)
    default_vat_account = Column(String(20), nullable=True, default="4454")  # TVA déductible
    default_account = Column(String(20), nullable=True)  # Legacy - kept for compatibility
    default_tax_rate = Column(Numeric(5, 2), nullable=True, default=18.00)  # Taux TVA (18% Bénin)
    default_journal = Column(String(10), nullable=True, default="ACH")  # Journal achats
    default_description = Column(String(255), nullable=True)  # Template libellé
    
    # Mots-clés pour reconnaissance OCR
    ocr_keywords = Column(JSON, nullable=True)  # ["SBEE", "Société Béninoise d'Énergie"]
    
    # Métadonnées pour apprentissage et données additionnelles
    supplier_metadata = Column(JSON, nullable=True)  # {"learning_corrections": [...], "conditional_rules": [...]}
    
    # Tenant (entreprise)
    client_id = Column(UUID(as_uuid=True), ForeignKey("clients.id", ondelete="CASCADE"), nullable=False)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=True)
    
    # Relations
    client = relationship("Client", backref="suppliers")
    documents = relationship("Document", back_populates="supplier")
    purchase_orders = relationship("PurchaseOrder", back_populates="supplier")
    delivery_notes = relationship("DeliveryNote", back_populates="supplier")
    
    # Relation vers le compte auxiliaire
    auxiliary_account = relationship("ChartOfAccounts", foreign_keys=[auxiliary_account_id])
    
    # Relation vers la règle d'imputation
    default_rule = relationship("AccountingRule", foreign_keys=[default_rule_id])

    __table_args__ = ({"sqlite_autoincrement": True},)
    
    def generate_auxiliary_code(self) -> str:
        """Génère le code du compte auxiliaire basé sur le code fournisseur"""
        base_code = self.collective_account_code or "401"
        supplier_code = (self.code or self.name[:6]).upper().replace(" ", "")
        
        # Ensure total length <= 20 (Account number limit)
        max_len = 20 - len(base_code)
        if len(supplier_code) > max_len:
            supplier_code = supplier_code[:max_len]
            
        return f"{base_code}{supplier_code}"
