"""
Journal Entry Model
Represents accounting journal entries (écritures comptables)
"""
import uuid
from datetime import date
from sqlalchemy import Column, String, Numeric, Date, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base_class import Base


class JournalEntry(Base):
    """Écriture de journal comptable"""
    __tablename__ = "journal_entries"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    
    # Relations
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    debit_account_id = Column(UUID(as_uuid=True), ForeignKey("ledger_accounts.id"), nullable=False)
    credit_account_id = Column(UUID(as_uuid=True), ForeignKey("ledger_accounts.id"), nullable=False)
    
    # Informations de l'écriture
    entry_number = Column(String(50), nullable=False, unique=True, index=True)
    date = Column(Date, nullable=False, default=date.today, index=True)
    description = Column(String(500), nullable=False)
    amount = Column(Numeric(15, 2), nullable=False)
    reference = Column(String(100), nullable=True)  # Référence externe (facture, etc.)
    
    # Métadonnées
    notes = Column(Text, nullable=True)
    
    # Relations
    debit_account = relationship("LedgerAccount", foreign_keys=[debit_account_id], back_populates="journal_entries_debit")
    credit_account = relationship("LedgerAccount", foreign_keys=[credit_account_id], back_populates="journal_entries_credit")
