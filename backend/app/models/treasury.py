"""Treasury Management Models (Gestion de Trésorerie)."""
from datetime import date, datetime
from decimal import Decimal
from enum import Enum
from sqlalchemy import Column, String, Date, Numeric, Boolean, ForeignKey, Enum as SQLEnum, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import uuid

from app.db.base import Base


class BankAccountType(str, Enum):
    """Types de comptes bancaires."""
    CHECKING = "checking"  # Compte courant
    SAVINGS = "savings"  # Compte épargne
    LOAN = "loan"  # Compte de prêt
    CREDIT_CARD = "credit_card"  # Carte de crédit
    OTHER = "other"  # Autre


class TransactionType(str, Enum):
    """Types de transactions bancaires."""
    DEPOSIT = "deposit"  # Dépôt / Crédit
    WITHDRAWAL = "withdrawal"  # Retrait / Débit
    TRANSFER = "transfer"  # Virement
    FEE = "fee"  # Frais bancaires
    INTEREST = "interest"  # Intérêts
    CHECK = "check"  # Chèque
    CARD_PAYMENT = "card_payment"  # Paiement par carte
    DIRECT_DEBIT = "direct_debit"  # Prélèvement automatique
    OTHER = "other"  # Autre


class TransactionStatus(str, Enum):
    """Statuts des transactions."""
    PENDING = "pending"  # En attente
    CLEARED = "cleared"  # Compensé
    RECONCILED = "reconciled"  # Rapproché
    CANCELLED = "cancelled"  # Annulé


class PaymentScheduleStatus(str, Enum):
    """Statuts des échéanciers de paiement."""
    PENDING = "pending"  # En attente
    PAID = "paid"  # Payé
    PARTIAL = "partial"  # Partiellement payé
    OVERDUE = "overdue"  # En retard
    CANCELLED = "cancelled"  # Annulé


class BankAccount(Base):
    """Compte bancaire de l'entreprise."""
    __tablename__ = "bank_accounts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)

    # Relations
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)

    # Informations de base
    name = Column(String(255), nullable=False)  # Nom du compte
    account_number = Column(String(50), nullable=False, index=True)  # Numéro de compte
    iban = Column(String(34), nullable=True)  # IBAN (si applicable)
    swift_bic = Column(String(11), nullable=True)  # SWIFT/BIC
    bank_name = Column(String(255), nullable=False)  # Nom de la banque
    branch = Column(String(255), nullable=True)  # Agence
    account_type = Column(SQLEnum(BankAccountType), nullable=False, default=BankAccountType.CHECKING, index=True)

    # Soldes
    balance = Column(Numeric(15, 2), nullable=False, default=0)  # Solde actuel
    initial_balance = Column(Numeric(15, 2), nullable=False, default=0)  # Solde initial
    currency = Column(String(3), nullable=False, default="XOF")

    # Informations additionnelles
    is_active = Column(Boolean, nullable=False, default=True, index=True)
    is_default = Column(Boolean, nullable=False, default=False)  # Compte par défaut
    overdraft_limit = Column(Numeric(15, 2), nullable=True)  # Découvert autorisé
    interest_rate = Column(Numeric(5, 2), nullable=True)  # Taux d'intérêt (si applicable)

    # Contactinformation
    contact_person = Column(String(255), nullable=True)
    contact_phone = Column(String(20), nullable=True)
    contact_email = Column(String(255), nullable=True)

    # Notes
    description = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)

    # Métadonnées
    extra_metadata = Column("metadata", JSONB, nullable=True)

    # Timestamps
    created_at = Column(Date, default=datetime.utcnow, nullable=False)
    updated_at = Column(Date, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relations
    tenant = relationship("Tenant", back_populates="bank_accounts")
    transactions = relationship("BankTransaction", back_populates="bank_account", cascade="all, delete-orphan")


class BankTransaction(Base):
    """Transaction bancaire."""
    __tablename__ = "bank_transactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)

    # Relations
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    bank_account_id = Column(UUID(as_uuid=True), ForeignKey("bank_accounts.id", ondelete="CASCADE"), nullable=False, index=True)
    sales_invoice_id = Column(UUID(as_uuid=True), ForeignKey("sales_invoices.id", ondelete="SET NULL"), nullable=True)  # Lien avec facture vente
    purchase_order_id = Column(UUID(as_uuid=True), ForeignKey("purchase_orders.id", ondelete="SET NULL"), nullable=True)  # Lien avec BC achat

    # Informations de transaction
    transaction_date = Column(Date, nullable=False, index=True)
    value_date = Column(Date, nullable=True)  # Date de valeur (peut différer de transaction_date)
    transaction_type = Column(SQLEnum(TransactionType), nullable=False, index=True)
    status = Column(SQLEnum(TransactionStatus), nullable=False, default=TransactionStatus.PENDING, index=True)

    # Montants
    amount = Column(Numeric(15, 2), nullable=False)  # Montant (positif pour crédit, négatif pour débit)
    balance_after = Column(Numeric(15, 2), nullable=True)  # Solde après transaction
    currency = Column(String(3), nullable=False, default="XOF")

    # Détails
    description = Column(Text, nullable=False)
    reference = Column(String(100), nullable=True, index=True)  # Référence bancaire
    check_number = Column(String(50), nullable=True)  # Numéro de chèque (si applicable)
    counterparty = Column(String(255), nullable=True)  # Contrepartie (nom du tiers)
    counterparty_account = Column(String(50), nullable=True)  # Compte de la contrepartie

    # Catégorisation
    category = Column(String(100), nullable=True, index=True)  # Catégorie (ex: "Salaires", "Fournisseurs")
    tags = Column(JSONB, nullable=True)  # Tags pour filtrage avancé

    # Rapprochement bancaire
    is_reconciled = Column(Boolean, nullable=False, default=False, index=True)
    reconciliation_date = Column(Date, nullable=True)
    bank_statement_line = Column(String(255), nullable=True)  # Ligne du relevé bancaire

    # Fichiers attachés
    attachment_url = Column(String(512), nullable=True)  # URL du justificatif

    # Notes
    notes = Column(Text, nullable=True)

    # Métadonnées
    extra_metadata = Column("metadata", JSONB, nullable=True)

    # Timestamps
    created_at = Column(Date, default=datetime.utcnow, nullable=False)
    updated_at = Column(Date, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relations
    tenant = relationship("Tenant", back_populates="bank_transactions")
    bank_account = relationship("BankAccount", back_populates="transactions")


class PaymentSchedule(Base):
    """Échéancier de paiement (prévu ou reçu)."""
    __tablename__ = "payment_schedules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)

    # Relations
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    sales_invoice_id = Column(UUID(as_uuid=True), ForeignKey("sales_invoices.id", ondelete="CASCADE"), nullable=True)  # Facture vente
    purchase_order_id = Column(UUID(as_uuid=True), ForeignKey("purchase_orders.id", ondelete="CASCADE"), nullable=True)  # BC achat
    bank_account_id = Column(UUID(as_uuid=True), ForeignKey("bank_accounts.id", ondelete="SET NULL"), nullable=True)  # Compte bancaire

    # Informations de base
    description = Column(String(500), nullable=False)
    is_income = Column(Boolean, nullable=False, default=True)  # True = à recevoir, False = à payer
    status = Column(SQLEnum(PaymentScheduleStatus), nullable=False, default=PaymentScheduleStatus.PENDING, index=True)

    # Montants
    total_amount = Column(Numeric(15, 2), nullable=False)  # Montant total
    paid_amount = Column(Numeric(15, 2), nullable=False, default=0)  # Montant déjà payé
    remaining_amount = Column(Numeric(15, 2), nullable=False)  # Montant restant
    currency = Column(String(3), nullable=False, default="XOF")

    # Dates
    due_date = Column(Date, nullable=False, index=True)  # Date d'échéance
    payment_date = Column(Date, nullable=True)  # Date de paiement effectif

    # Contrepartie
    counterparty_name = Column(String(255), nullable=True)  # Nom du client/fournisseur
    counterparty_reference = Column(String(100), nullable=True)  # Référence externe

    # Méthode de paiement
    payment_method = Column(String(50), nullable=True)  # Méthode de paiement prévue/utilisée
    reference = Column(String(100), nullable=True)  # Référence de paiement

    # Récurrence (pour paiements récurrents)
    is_recurring = Column(Boolean, nullable=False, default=False)
    recurrence_pattern = Column(String(50), nullable=True)  # monthly, quarterly, yearly, etc.
    recurrence_end_date = Column(Date, nullable=True)

    # Catégorisation
    category = Column(String(100), nullable=True, index=True)
    tags = Column(JSONB, nullable=True)

    # Alertes
    send_reminder = Column(Boolean, nullable=False, default=True)
    reminder_days_before = Column(Numeric(3, 0), nullable=True, default=7)  # Jours avant échéance pour rappel

    # Notes
    notes = Column(Text, nullable=True)

    # Métadonnées
    extra_metadata = Column("metadata", JSONB, nullable=True)

    # Timestamps
    created_at = Column(Date, default=datetime.utcnow, nullable=False)
    updated_at = Column(Date, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relations
    tenant = relationship("Tenant", back_populates="payment_schedules")



class CashFlowForecast(Base):
    """Prévision de flux de trésorerie générée par ML."""
    __tablename__ = "cash_flow_forecasts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)

    # Relations
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)

    # Date de prévision
    forecast_date = Column(Date, nullable=False, index=True)

    # Prévisions
    predicted_balance = Column(Numeric(15, 2), nullable=False)
    predicted_income = Column(Numeric(15, 2), nullable=False, default=0)
    predicted_expenses = Column(Numeric(15, 2), nullable=False, default=0)

    # Intervalles de confiance
    confidence_lower = Column(Numeric(15, 2), nullable=False)  # Borne inférieure
    confidence_upper = Column(Numeric(15, 2), nullable=False)  # Borne supérieure

    # Scénario
    scenario = Column(String(20), nullable=False, default="realistic", index=True)  # optimistic, realistic, pessimistic

    # Métadonnées du modèle
    model_type = Column(String(20), nullable=False)  # prophet, lstm, linear
    model_accuracy = Column(Numeric(5, 4), nullable=True)  # Score de précision (0-1)

    # Timestamps
    created_at = Column(Date, default=datetime.utcnow, nullable=False, index=True)

    # Relations
    tenant = relationship("Tenant", back_populates="cash_flow_forecasts")


class TreasuryAlert(Base):
    """Alerte de trésorerie."""
    __tablename__ = "treasury_alerts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)

    # Relations
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)

    # Type et sévérité
    alert_type = Column(String(50), nullable=False, index=True)  # low_balance, overdue_payment, negative_forecast, anomaly
    severity = Column(String(20), nullable=False, default="info", index=True)  # info, warning, critical

    # Contenu
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)

    # Entité liée (optionnel)
    related_entity_type = Column(String(50), nullable=True)  # bank_account, transaction, payment_schedule
    related_entity_id = Column(UUID(as_uuid=True), nullable=True)

    # Statut
    is_read = Column(Boolean, nullable=False, default=False, index=True)
    is_resolved = Column(Boolean, nullable=False, default=False, index=True)

    # Timestamps
    created_at = Column(Date, default=datetime.utcnow, nullable=False, index=True)
    resolved_at = Column(Date, nullable=True)

    # Relations
    tenant = relationship("Tenant", back_populates="treasury_alerts")


class BankStatementImport(Base):
    """Import de relevé bancaire."""
    __tablename__ = "bank_statement_imports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)

    # Relations
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    bank_account_id = Column(UUID(as_uuid=True), ForeignKey("bank_accounts.id", ondelete="CASCADE"), nullable=False, index=True)

    # Fichier
    file_name = Column(String(255), nullable=False)
    file_url = Column(String(512), nullable=True)

    # Statut de l'import
    import_date = Column(Date, default=datetime.utcnow, nullable=False)
    status = Column(String(20), nullable=False, default="pending", index=True)  # pending, processing, completed, failed

    # Statistiques
    total_lines = Column(Numeric(10, 0), nullable=False, default=0)
    matched_lines = Column(Numeric(10, 0), nullable=False, default=0)
    unmatched_lines = Column(Numeric(10, 0), nullable=False, default=0)

    # Erreurs
    error_message = Column(Text, nullable=True)

    # Timestamps
    created_at = Column(Date, default=datetime.utcnow, nullable=False)

    # Relations
    tenant = relationship("Tenant", back_populates="bank_statement_imports")
