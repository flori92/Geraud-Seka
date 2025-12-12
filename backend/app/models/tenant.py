import uuid

from sqlalchemy import Boolean, Column, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base import Base, TimestampMixin


class Tenant(Base, TimestampMixin):
    __tablename__ = "tenants"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), unique=True, nullable=False)
    subdomain = Column(String(150), unique=True, nullable=False)
    country = Column(String(64), nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    plan = Column(String(50), nullable=False, default="basic")
    stripe_customer_id = Column(String(255), nullable=True)
    subscription_status = Column(String(50), default="active")

    users = relationship(
        "User",
        back_populates="tenant",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    clients = relationship(
        "Client",
        back_populates="tenant",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    # Relations Module Ventes
    quotes = relationship(
        "Quote",
        back_populates="tenant",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    sales_invoices = relationship(
        "SalesInvoice",
        back_populates="tenant",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    purchase_orders = relationship(
        "PurchaseOrder",
        back_populates="tenant",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    delivery_notes = relationship(
        "DeliveryNote",
        back_populates="tenant",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    # Relations Module Trésorerie
    bank_accounts = relationship(
        "BankAccount",
        back_populates="tenant",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    bank_transactions = relationship(
        "BankTransaction",
        back_populates="tenant",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    payment_schedules = relationship(
        "PaymentSchedule",
        back_populates="tenant",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    cash_flow_forecasts = relationship(
        "CashFlowForecast",
        back_populates="tenant",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    treasury_alerts = relationship(
        "TreasuryAlert",
        back_populates="tenant",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    bank_statement_imports = relationship(
        "BankStatementImport",
        back_populates="tenant",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    # Relations Module Comptabilité
    accounting_rules = relationship(
        "AccountingRule",
        back_populates="tenant",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    # Relations Module RH
    employees = relationship(
        "Employee",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    
    contracts = relationship(
        "Contract",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    
    payslips = relationship(
        "Payslip",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    
    leave_requests = relationship(
        "LeaveRequest",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
