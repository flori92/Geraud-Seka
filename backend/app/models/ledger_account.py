"""
Ledger Account Model
Represents accounts in the chart of accounts (plan comptable)
"""
import uuid
from sqlalchemy import Column, String, Numeric, Enum as SQLEnum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum

from app.db.base import Base


class AccountType(str, enum.Enum):
    """Types de comptes selon SYSCOHADA"""
    ASSET = "asset"  # Actif
    LIABILITY = "liability"  # Passif
    EQUITY = "equity"  # Capitaux propres
    REVENUE = "revenue"  # Produits
    EXPENSE = "expense"  # Charges


class LedgerAccount(Base):
    """Compte du plan comptable"""
    __tablename__ = "ledger_accounts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    
    # Relations
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Informations du compte
    account_code = Column(String(20), nullable=False, index=True)  # Code SYSCOHADA
    account_name = Column(String(255), nullable=False)
    account_type = Column(SQLEnum(AccountType), nullable=False, index=True)
    
    # Solde et devise
    balance = Column(Numeric(15, 2), default=0, nullable=False)
    currency = Column(String(3), default="XOF", nullable=False)
    
    # Métadonnées
    description = Column(String(500), nullable=True)
    is_active = Column(String, default=True, nullable=False)
    
    # Relations
    journal_entries_debit = relationship("JournalEntry", foreign_keys="JournalEntry.debit_account_id", back_populates="debit_account")
    journal_entries_credit = relationship("JournalEntry", foreign_keys="JournalEntry.credit_account_id", back_populates="credit_account")
