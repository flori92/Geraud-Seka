"""
Modèle pour les écritures comptables
"""
import uuid
from datetime import date
from sqlalchemy import Column, String, Numeric, Date, ForeignKey, Boolean, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base import Base, TimestampMixin


class AccountingEntry(Base, TimestampMixin):
    """
    Écriture comptable (ligne de journal)
    
    Une facture génère plusieurs écritures:
    - Ligne 1: Débit compte de charge (6061)
    - Ligne 2: Débit compte TVA (4454)
    - Ligne 3: Crédit compte fournisseur (401SBEE)
    """
    __tablename__ = "accounting_entries"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Liens
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), nullable=True, index=True)
    accounting_rule_id = Column(UUID(as_uuid=True), ForeignKey("accounting_rules.id", ondelete="SET NULL"), nullable=True)
    ledger_account_id = Column(UUID(as_uuid=True), ForeignKey("ledger_accounts.id", ondelete="RESTRICT"), nullable=False)
    journal_id = Column(UUID(as_uuid=True), ForeignKey("accounting_journals.id", ondelete="RESTRICT"), nullable=False)
    
    # Données de l'écriture
    entry_date = Column(Date, nullable=False, default=date.today)
    entry_number = Column(String(50), nullable=True)  # Numéro d'écriture (ex: ACH-2024-0001)
    label = Column(String(500), nullable=False)  # Libellé (ex: "Facture SBEE-2024-0892")
    reference = Column(String(255), nullable=True)  # Référence document (ex: SBEE-2024-0892)
    
    # Montants
    debit = Column(Numeric(15, 2), nullable=False, default=0)
    credit = Column(Numeric(15, 2), nullable=False, default=0)
    
    # Devise (future évolution multi-devises)
    currency = Column(String(3), nullable=False, default="XOF")
    
    # Statut
    is_validated = Column(Boolean, default=False)
    is_exported = Column(Boolean, default=False)
    exported_at = Column(Date, nullable=True)
    
    # Métadonnées
    notes = Column(Text, nullable=True)
    
    # Relations
    tenant = relationship("Tenant")
    document = relationship("Document", back_populates="accounting_entries")
    ledger_account = relationship("LedgerAccount")
    journal = relationship("AccountingJournal")
    accounting_rule = relationship("AccountingRule")
    
    def __repr__(self):
        return f"<AccountingEntry {self.label} - Débit:{self.debit} Crédit:{self.credit}>"


class AccountingJournal(Base, TimestampMixin):
    """
    Journal comptable (ACH, VTE, BQ, OD, etc.)
    """
    __tablename__ = "accounting_journals"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    
    code = Column(String(10), nullable=False)  # ACH, VTE, BQ, OD
    name = Column(String(255), nullable=False)  # Journal des achats, Journal des ventes
    journal_type = Column(String(50), nullable=False)  # purchase, sale, bank, misc
    
    is_active = Column(Boolean, default=True)
    
    # Relations
    tenant = relationship("Tenant")
    
    def __repr__(self):
        return f"<AccountingJournal {self.code} - {self.name}>"
