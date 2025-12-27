"""
Modèles comptabilité avancée - Système OHADA/SYSCOHADA
Plan comptable, Journaux, Écritures, Exercices fiscaux
"""

import uuid
import enum
from datetime import datetime, date
from decimal import Decimal
from sqlalchemy import Column, ForeignKey, String, Text, Boolean, Integer, DateTime, Date, Numeric, Index
from sqlalchemy.dialects.postgresql import UUID, JSON
from sqlalchemy.orm import relationship

from app.db.base import Base, TimestampMixin



class AccountType(str, enum.Enum):
    """Types de comptes selon OHADA"""
    ASSET = "asset"                    # Actif (classe 2, 3, 4, 5)
    LIABILITY = "liability"            # Passif (classe 1, 4)
    EQUITY = "equity"                  # Capitaux propres (classe 1)
    REVENUE = "revenue"                # Produits (classe 7)
    EXPENSE = "expense"                # Charges (classe 6)
    CONTRA = "contra"                  # Compte de contrepartie


class AccountClass(str, enum.Enum):
    """Classes de comptes OHADA"""
    CLASS_1 = "1"  # Comptes de ressources durables
    CLASS_2 = "2"  # Comptes d'actif immobilisé
    CLASS_3 = "3"  # Comptes de stocks
    CLASS_4 = "4"  # Comptes de tiers
    CLASS_5 = "5"  # Comptes de trésorerie
    CLASS_6 = "6"  # Comptes de charges
    CLASS_7 = "7"  # Comptes de produits
    CLASS_8 = "8"  # Comptes des autres charges et produits


class JournalType(str, enum.Enum):
    """Types de journaux comptables"""
    PURCHASE = "ACH"      # Achats
    SALES = "VTE"         # Ventes
    BANK = "BQ"           # Banque
    CASH = "CA"           # Caisse
    MISC = "OD"           # Opérations diverses
    PAYROLL = "PAI"       # Paie
    OPENING = "AN"        # À nouveau
    CLOSING = "CLO"       # Clôture


class FiscalYearStatus(str, enum.Enum):
    """Statut exercice fiscal"""
    OPEN = "open"
    CLOSING = "closing"
    CLOSED = "closed"


class EntryStatus(str, enum.Enum):
    """Statut écriture comptable"""
    DRAFT = "draft"
    VALIDATED = "validated"
    POSTED = "posted"


class ReconciliationStatus(str, enum.Enum):
    """Statut rapprochement"""
    PENDING = "pending"
    PARTIAL = "partial"
    RECONCILED = "reconciled"



class ChartOfAccounts(Base, TimestampMixin):
    """
    Plan comptable - Structure hiérarchique des comptes
    Conforme OHADA/SYSCOHADA
    """
    __tablename__ = "chart_of_accounts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    account_number = Column(String(20), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    
    account_class = Column(String(1), nullable=False)  # 1-8
    account_type = Column(String(20), nullable=False)  # asset, liability, etc.
    
    parent_id = Column(UUID(as_uuid=True), ForeignKey("chart_of_accounts.id"), nullable=True)
    level = Column(Integer, default=1)  # Niveau dans la hiérarchie
    is_group = Column(Boolean, default=False)  # Compte de regroupement
    is_detail = Column(Boolean, default=True)  # Compte de détail (mouvementé)
    
    is_active = Column(Boolean, default=True)
    is_reconcilable = Column(Boolean, default=False)  # Lettrable
    is_bank_account = Column(Boolean, default=False)
    is_cash_account = Column(Boolean, default=False)
    
    opening_debit = Column(Numeric(18, 2), default=0)
    opening_credit = Column(Numeric(18, 2), default=0)
    current_debit = Column(Numeric(18, 2), default=0)
    current_credit = Column(Numeric(18, 2), default=0)
    
    notes = Column(Text)
    tags = Column(JSON)
    
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    
    parent = relationship("ChartOfAccounts", remote_side=[id], backref="children")
    tenant = relationship("Tenant")
    entries = relationship("JournalEntryLine", back_populates="account")

    __table_args__ = (
        Index('ix_coa_tenant_number', 'tenant_id', 'account_number', unique=True),
    )

    @property
    def balance(self) -> Decimal:
        """Solde du compte"""
        if self.account_type in ['asset', 'expense']:
            return (self.current_debit or 0) - (self.current_credit or 0)
        return (self.current_credit or 0) - (self.current_debit or 0)



class FiscalYear(Base, TimestampMixin):
    """
    Exercice fiscal / comptable
    """
    __tablename__ = "fiscal_years"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    name = Column(String(100), nullable=False)  # Ex: "Exercice 2024"
    code = Column(String(10), nullable=False)   # Ex: "2024"
    
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    
    status = Column(String(20), default=FiscalYearStatus.OPEN)
    is_current = Column(Boolean, default=False)
    
    closed_at = Column(DateTime)
    closed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    
    total_revenue = Column(Numeric(18, 2), default=0)
    total_expense = Column(Numeric(18, 2), default=0)
    net_result = Column(Numeric(18, 2), default=0)
    
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    
    tenant = relationship("Tenant")
    periods = relationship("AccountingPeriod", back_populates="fiscal_year", cascade="all, delete-orphan")


class AccountingPeriod(Base, TimestampMixin):
    """
    Période comptable (mois)
    """
    __tablename__ = "accounting_periods"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    fiscal_year_id = Column(UUID(as_uuid=True), ForeignKey("fiscal_years.id", ondelete="CASCADE"), nullable=False)
    
    name = Column(String(50), nullable=False)  # Ex: "Janvier 2024"
    period_number = Column(Integer, nullable=False)  # 1-12
    
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    
    is_closed = Column(Boolean, default=False)
    closed_at = Column(DateTime)
    
    fiscal_year = relationship("FiscalYear", back_populates="periods")



class AccountingJournal(Base, TimestampMixin):
    """
    Journal comptable
    """
    __tablename__ = "accounting_journals"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    code = Column(String(10), nullable=False)  # ACH, VTE, BQ, etc.
    name = Column(String(100), nullable=False)
    journal_type = Column(String(10), nullable=False)
    
    is_active = Column(Boolean, default=True)
    default_debit_account_id = Column(UUID(as_uuid=True), ForeignKey("chart_of_accounts.id"))
    default_credit_account_id = Column(UUID(as_uuid=True), ForeignKey("chart_of_accounts.id"))
    
    sequence_prefix = Column(String(10))
    next_sequence = Column(Integer, default=1)
    
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    
    tenant = relationship("Tenant")
    entries = relationship("JournalEntry", back_populates="journal")

    __table_args__ = (
        Index('ix_journal_tenant_code', 'tenant_id', 'code', unique=True),
    )



class JournalEntry(Base, TimestampMixin):
    """
    Écriture comptable (pièce)
    """
    __tablename__ = "journal_entries"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    entry_number = Column(String(50), nullable=False, index=True)
    reference = Column(String(100))  # Référence externe (facture, etc.)
    
    journal_id = Column(UUID(as_uuid=True), ForeignKey("accounting_journals.id"), nullable=False)
    fiscal_year_id = Column(UUID(as_uuid=True), ForeignKey("fiscal_years.id"), nullable=False)
    period_id = Column(UUID(as_uuid=True), ForeignKey("accounting_periods.id"))
    
    entry_date = Column(Date, nullable=False, index=True)
    accounting_date = Column(Date, nullable=False)
    
    label = Column(String(255), nullable=False)
    notes = Column(Text)
    
    total_debit = Column(Numeric(18, 2), default=0)
    total_credit = Column(Numeric(18, 2), default=0)
    
    status = Column(String(20), default=EntryStatus.DRAFT)
    validated_at = Column(DateTime)
    validated_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    posted_at = Column(DateTime)
    
    source_type = Column(String(50))  # invoice, payment, etc.
    source_id = Column(UUID(as_uuid=True))
    
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    
    tenant = relationship("Tenant")
    journal = relationship("AccountingJournal", back_populates="entries")
    fiscal_year = relationship("FiscalYear")
    lines = relationship("JournalEntryLine", back_populates="entry", cascade="all, delete-orphan")
    creator = relationship("User", foreign_keys=[created_by])

    __table_args__ = (
        Index('ix_entry_tenant_number', 'tenant_id', 'entry_number', unique=True),
    )

    @property
    def is_balanced(self) -> bool:
        """Vérifie si l'écriture est équilibrée"""
        return abs(self.total_debit - self.total_credit) < 0.01


class JournalEntryLine(Base, TimestampMixin):
    """
    Ligne d'écriture comptable
    """
    __tablename__ = "journal_entry_lines"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    entry_id = Column(UUID(as_uuid=True), ForeignKey("journal_entries.id", ondelete="CASCADE"), nullable=False)
    account_id = Column(UUID(as_uuid=True), ForeignKey("chart_of_accounts.id"), nullable=False)
    
    debit = Column(Numeric(18, 2), default=0)
    credit = Column(Numeric(18, 2), default=0)
    
    label = Column(String(255))
    
    cost_center_id = Column(UUID(as_uuid=True), ForeignKey("cost_centers.id"))
    project_id = Column(UUID(as_uuid=True))
    
    partner_type = Column(String(20))  # client, supplier
    partner_id = Column(UUID(as_uuid=True))
    
    due_date = Column(Date)
    
    reconciliation_id = Column(UUID(as_uuid=True), ForeignKey("reconciliations.id"))
    reconciliation_code = Column(String(20))
    is_reconciled = Column(Boolean, default=False)
    
    entry = relationship("JournalEntry", back_populates="lines")
    account = relationship("ChartOfAccounts", back_populates="entries")
    cost_center = relationship("CostCenter")
    reconciliation = relationship("Reconciliation", back_populates="lines")



class CostCenter(Base, TimestampMixin):
    """
    Centre de coûts pour comptabilité analytique
    """
    __tablename__ = "cost_centers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    code = Column(String(20), nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    
    parent_id = Column(UUID(as_uuid=True), ForeignKey("cost_centers.id"))
    is_active = Column(Boolean, default=True)
    
    annual_budget = Column(Numeric(18, 2), default=0)
    
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    
    parent = relationship("CostCenter", remote_side=[id], backref="children")
    tenant = relationship("Tenant")



class Reconciliation(Base, TimestampMixin):
    """
    Lettrage / Rapprochement de comptes
    """
    __tablename__ = "reconciliations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    code = Column(String(20), nullable=False)  # Code de lettrage (AA, AB, etc.)
    account_id = Column(UUID(as_uuid=True), ForeignKey("chart_of_accounts.id"), nullable=False)
    
    total_debit = Column(Numeric(18, 2), default=0)
    total_credit = Column(Numeric(18, 2), default=0)
    balance = Column(Numeric(18, 2), default=0)
    
    status = Column(String(20), default=ReconciliationStatus.PENDING)
    reconciled_at = Column(DateTime)
    reconciled_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    
    account = relationship("ChartOfAccounts")
    lines = relationship("JournalEntryLine", back_populates="reconciliation")



class BankReconciliation(Base, TimestampMixin):
    """
    Rapprochement bancaire
    """
    __tablename__ = "bank_reconciliations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    bank_account_id = Column(UUID(as_uuid=True), ForeignKey("bank_accounts.id"), nullable=False)
    
    statement_date = Column(Date, nullable=False)
    period_start = Column(Date, nullable=False)
    period_end = Column(Date, nullable=False)
    
    statement_opening_balance = Column(Numeric(18, 2), nullable=False)
    statement_closing_balance = Column(Numeric(18, 2), nullable=False)
    
    book_opening_balance = Column(Numeric(18, 2), nullable=False)
    book_closing_balance = Column(Numeric(18, 2), nullable=False)
    
    unreconciled_deposits = Column(Numeric(18, 2), default=0)
    unreconciled_withdrawals = Column(Numeric(18, 2), default=0)
    difference = Column(Numeric(18, 2), default=0)
    
    is_reconciled = Column(Boolean, default=False)
    reconciled_at = Column(DateTime)
    reconciled_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    
    notes = Column(Text)
    
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    
    bank_account = relationship("BankAccount")
    items = relationship("BankReconciliationItem", back_populates="reconciliation", cascade="all, delete-orphan")


class BankReconciliationItem(Base):
    """
    Ligne de rapprochement bancaire
    """
    __tablename__ = "bank_reconciliation_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    reconciliation_id = Column(UUID(as_uuid=True), ForeignKey("bank_reconciliations.id", ondelete="CASCADE"), nullable=False)
    
    transaction_id = Column(UUID(as_uuid=True), ForeignKey("bank_transactions.id"))
    entry_line_id = Column(UUID(as_uuid=True), ForeignKey("journal_entry_lines.id"))
    
    amount = Column(Numeric(18, 2), nullable=False)
    
    is_matched = Column(Boolean, default=False)
    matched_at = Column(DateTime)
    
    reconciliation = relationship("BankReconciliation", back_populates="items")



class Budget(Base, TimestampMixin):
    """
    Budget annuel par compte
    """
    __tablename__ = "budgets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    name = Column(String(100), nullable=False)
    fiscal_year_id = Column(UUID(as_uuid=True), ForeignKey("fiscal_years.id"), nullable=False)
    
    budget_type = Column(String(20), default="expense")  # expense, revenue
    
    is_active = Column(Boolean, default=True)
    is_approved = Column(Boolean, default=False)
    approved_at = Column(DateTime)
    approved_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    
    total_budget = Column(Numeric(18, 2), default=0)
    total_actual = Column(Numeric(18, 2), default=0)
    variance = Column(Numeric(18, 2), default=0)
    
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    
    fiscal_year = relationship("FiscalYear")
    lines = relationship("BudgetLine", back_populates="budget", cascade="all, delete-orphan")


class BudgetLine(Base, TimestampMixin):
    """
    Ligne de budget par compte et période
    """
    __tablename__ = "budget_lines"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    budget_id = Column(UUID(as_uuid=True), ForeignKey("budgets.id", ondelete="CASCADE"), nullable=False)
    account_id = Column(UUID(as_uuid=True), ForeignKey("chart_of_accounts.id"), nullable=False)
    period_id = Column(UUID(as_uuid=True), ForeignKey("accounting_periods.id"))
    cost_center_id = Column(UUID(as_uuid=True), ForeignKey("cost_centers.id"))
    
    budget_amount = Column(Numeric(18, 2), default=0)
    actual_amount = Column(Numeric(18, 2), default=0)
    variance = Column(Numeric(18, 2), default=0)
    variance_percent = Column(Numeric(5, 2), default=0)
    
    notes = Column(Text)
    
    budget = relationship("Budget", back_populates="lines")
    account = relationship("ChartOfAccounts")
    period = relationship("AccountingPeriod")
    cost_center = relationship("CostCenter")



class VATDeclaration(Base, TimestampMixin):
    """
    Déclaration de TVA
    """
    __tablename__ = "vat_declarations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    period_start = Column(Date, nullable=False)
    period_end = Column(Date, nullable=False)
    declaration_type = Column(String(20), default="monthly")  # monthly, quarterly
    
    vat_collected = Column(Numeric(18, 2), default=0)  # TVA collectée
    vat_deductible = Column(Numeric(18, 2), default=0)  # TVA déductible
    vat_due = Column(Numeric(18, 2), default=0)  # TVA à payer
    vat_credit = Column(Numeric(18, 2), default=0)  # Crédit de TVA
    
    sales_amount = Column(Numeric(18, 2), default=0)
    purchases_amount = Column(Numeric(18, 2), default=0)
    
    status = Column(String(20), default="draft")  # draft, submitted, paid
    submitted_at = Column(DateTime)
    paid_at = Column(DateTime)
    payment_reference = Column(String(100))
    
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    
    tenant = relationship("Tenant")
