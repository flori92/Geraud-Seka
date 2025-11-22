"""Pydantic schemas for Treasury module."""
from datetime import date
from decimal import Decimal
from typing import Optional, List
from uuid import UUID

from pydantic import BaseModel, Field, ConfigDict


# ========== Bank Account Schemas ==========

class BankAccountBase(BaseModel):
    """Base schema for bank account."""
    name: str = Field(..., max_length=255)
    account_number: str = Field(..., max_length=50)
    iban: Optional[str] = Field(None, max_length=34)
    swift_bic: Optional[str] = Field(None, max_length=11)
    bank_name: str = Field(..., max_length=255)
    branch: Optional[str] = Field(None, max_length=255)
    account_type: str = Field(default="checking")
    currency: str = Field(default="XOF", max_length=3)
    is_active: bool = Field(default=True)
    is_default: bool = Field(default=False)
    overdraft_limit: Optional[Decimal] = None
    interest_rate: Optional[Decimal] = None
    contact_person: Optional[str] = Field(None, max_length=255)
    contact_phone: Optional[str] = Field(None, max_length=20)
    contact_email: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    notes: Optional[str] = None


class BankAccountCreate(BankAccountBase):
    """Schema for creating a bank account."""
    initial_balance: Decimal = Field(default=Decimal("0.00"))


class BankAccountUpdate(BaseModel):
    """Schema for updating a bank account."""
    name: Optional[str] = Field(None, max_length=255)
    iban: Optional[str] = Field(None, max_length=34)
    swift_bic: Optional[str] = Field(None, max_length=11)
    bank_name: Optional[str] = Field(None, max_length=255)
    branch: Optional[str] = Field(None, max_length=255)
    account_type: Optional[str] = None
    is_active: Optional[bool] = None
    is_default: Optional[bool] = None
    overdraft_limit: Optional[Decimal] = None
    interest_rate: Optional[Decimal] = None
    contact_person: Optional[str] = Field(None, max_length=255)
    contact_phone: Optional[str] = Field(None, max_length=20)
    contact_email: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    notes: Optional[str] = None


class BankAccount(BankAccountBase):
    """Schema for bank account response."""
    id: UUID
    tenant_id: UUID
    balance: Decimal
    initial_balance: Decimal
    created_at: date
    updated_at: date

    model_config = ConfigDict(from_attributes=True)


# ========== Bank Transaction Schemas ==========

class BankTransactionBase(BaseModel):
    """Base schema for bank transaction."""
    transaction_date: date
    value_date: Optional[date] = None
    transaction_type: str
    amount: Decimal
    currency: str = Field(default="XOF", max_length=3)
    description: str
    reference: Optional[str] = Field(None, max_length=100)
    check_number: Optional[str] = Field(None, max_length=50)
    counterparty: Optional[str] = Field(None, max_length=255)
    counterparty_account: Optional[str] = Field(None, max_length=50)
    category: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = None


class BankTransactionCreate(BankTransactionBase):
    """Schema for creating a bank transaction."""
    bank_account_id: UUID
    sales_invoice_id: Optional[UUID] = None
    purchase_order_id: Optional[UUID] = None
    status: str = Field(default="pending")


class BankTransactionUpdate(BaseModel):
    """Schema for updating a bank transaction."""
    transaction_date: Optional[date] = None
    value_date: Optional[date] = None
    transaction_type: Optional[str] = None
    amount: Optional[Decimal] = None
    description: Optional[str] = None
    reference: Optional[str] = Field(None, max_length=100)
    check_number: Optional[str] = Field(None, max_length=50)
    counterparty: Optional[str] = Field(None, max_length=255)
    counterparty_account: Optional[str] = Field(None, max_length=50)
    category: Optional[str] = Field(None, max_length=100)
    status: Optional[str] = None
    notes: Optional[str] = None


class BankTransaction(BankTransactionBase):
    """Schema for bank transaction response."""
    id: UUID
    tenant_id: UUID
    bank_account_id: UUID
    sales_invoice_id: Optional[UUID] = None
    purchase_order_id: Optional[UUID] = None
    status: str
    balance_after: Optional[Decimal] = None
    is_reconciled: bool
    reconciliation_date: Optional[date] = None
    created_at: date
    updated_at: date

    model_config = ConfigDict(from_attributes=True)


class BankTransactionWithAccount(BankTransaction):
    """Schema for transaction with bank account details."""
    bank_account: BankAccount

    model_config = ConfigDict(from_attributes=True)


# ========== Payment Schedule Schemas ==========

class PaymentScheduleBase(BaseModel):
    """Base schema for payment schedule."""
    description: str = Field(..., max_length=500)
    is_income: bool = Field(default=True)
    total_amount: Decimal
    currency: str = Field(default="XOF", max_length=3)
    due_date: date
    counterparty_name: Optional[str] = Field(None, max_length=255)
    counterparty_reference: Optional[str] = Field(None, max_length=100)
    payment_method: Optional[str] = Field(None, max_length=50)
    reference: Optional[str] = Field(None, max_length=100)
    is_recurring: bool = Field(default=False)
    recurrence_pattern: Optional[str] = Field(None, max_length=50)
    recurrence_end_date: Optional[date] = None
    category: Optional[str] = Field(None, max_length=100)
    send_reminder: bool = Field(default=True)
    reminder_days_before: Optional[int] = Field(default=7)
    notes: Optional[str] = None


class PaymentScheduleCreate(PaymentScheduleBase):
    """Schema for creating a payment schedule."""
    sales_invoice_id: Optional[UUID] = None
    purchase_order_id: Optional[UUID] = None
    bank_account_id: Optional[UUID] = None
    status: str = Field(default="pending")


class PaymentScheduleUpdate(BaseModel):
    """Schema for updating a payment schedule."""
    description: Optional[str] = Field(None, max_length=500)
    is_income: Optional[bool] = None
    total_amount: Optional[Decimal] = None
    due_date: Optional[date] = None
    status: Optional[str] = None
    payment_date: Optional[date] = None
    counterparty_name: Optional[str] = Field(None, max_length=255)
    counterparty_reference: Optional[str] = Field(None, max_length=100)
    payment_method: Optional[str] = Field(None, max_length=50)
    reference: Optional[str] = Field(None, max_length=100)
    is_recurring: Optional[bool] = None
    recurrence_pattern: Optional[str] = Field(None, max_length=50)
    recurrence_end_date: Optional[date] = None
    category: Optional[str] = None
    send_reminder: Optional[bool] = None
    reminder_days_before: Optional[int] = None
    notes: Optional[str] = None


class PaymentSchedule(PaymentScheduleBase):
    """Schema for payment schedule response."""
    id: UUID
    tenant_id: UUID
    sales_invoice_id: Optional[UUID] = None
    purchase_order_id: Optional[UUID] = None
    bank_account_id: Optional[UUID] = None
    status: str
    paid_amount: Decimal
    remaining_amount: Decimal
    payment_date: Optional[date] = None
    created_at: date
    updated_at: date

    model_config = ConfigDict(from_attributes=True)


class PaymentScheduleWithDetails(PaymentSchedule):
    """Schema for payment schedule with related entities."""
    bank_account: Optional[BankAccount] = None

    model_config = ConfigDict(from_attributes=True)


# ========== Cash Flow Schemas ==========

class CashFlowSummary(BaseModel):
    """Summary of cash flow for a period."""
    period_start: date
    period_end: date
    opening_balance: Decimal
    total_income: Decimal
    total_expenses: Decimal
    net_cash_flow: Decimal
    closing_balance: Decimal
    currency: str = "XOF"


class CashFlowByCategory(BaseModel):
    """Cash flow breakdown by category."""
    category: str
    income: Decimal
    expenses: Decimal
    net: Decimal
    percentage: Decimal


class CashFlowForecast(BaseModel):
    """Cash flow forecast for future periods."""
    forecast_date: date
    expected_income: Decimal
    expected_expenses: Decimal
    projected_balance: Decimal
    confidence_level: float  # 0.0 to 1.0


# ========== Bank Reconciliation Schemas ==========

class ReconciliationItem(BaseModel):
    """Item for bank reconciliation."""
    transaction_id: UUID
    transaction_date: date
    description: str
    amount: Decimal
    is_reconciled: bool


class BankReconciliation(BaseModel):
    """Bank reconciliation summary."""
    bank_account_id: UUID
    reconciliation_date: date
    statement_balance: Decimal
    book_balance: Decimal
    unreconciled_transactions: List[ReconciliationItem]
    difference: Decimal
