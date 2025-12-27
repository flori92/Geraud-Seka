"""Pydantic schemas for data validation and serialization."""

from .base import ORMBase, TimestampSchema, IDSchema

from .auth import Token, TokenPayload, LoginRequest

from .user import UserBase, UserCreate, UserUpdate, User

from .tenant import TenantBase, TenantCreate, TenantUpdate, Tenant

from .client import ClientBase, ClientCreate, ClientUpdate, Client

from .product import ProductBase, ProductCreate, ProductUpdate, Product

from .document import (
    DocumentBase,
    DocumentCreate,
    DocumentUpdate,
    Document,
    DocumentUploadResponse,
    OCRExtractionRequest,
    OCRExtractionResponse,
)

from .activity import ActivityBase, ActivityCreate, ActivityUpdate, Activity

from .accounting import (
    AccountingEntryBase,
    AccountingEntryCreate,
    AccountingEntryUpdate,
    AccountingEntry,
)


from .dashboard import DashboardStats, FinancialMetrics

from .payment import PaymentBase, PaymentCreate, PaymentUpdate, Payment as LegacyPayment


from .quote import (
    QuoteItemBase,
    QuoteItemCreate,
    QuoteItemUpdate,
    QuoteItem,
    QuoteBase,
    QuoteCreate,
    QuoteUpdate,
    Quote,
    QuoteWithItems,
)

from .sales_invoice import (
    PaymentBase as SalesPaymentBase,
    PaymentCreate as SalesPaymentCreate,
    PaymentUpdate as SalesPaymentUpdate,
    Payment as SalesPayment,
    SalesInvoiceItemBase,
    SalesInvoiceItemCreate,
    SalesInvoiceItemUpdate,
    SalesInvoiceItem,
    SalesInvoiceBase,
    SalesInvoiceCreate,
    SalesInvoiceUpdate,
    SalesInvoice,
    SalesInvoiceWithDetails,
)

from .purchase_order import (
    PurchaseOrderItemBase,
    PurchaseOrderItemCreate,
    PurchaseOrderItemUpdate,
    PurchaseOrderItem,
    PurchaseOrderBase,
    PurchaseOrderCreate,
    PurchaseOrderUpdate,
    PurchaseOrder,
    PurchaseOrderWithItems,
)

from .delivery_note import (
    DeliveryNoteItemBase,
    DeliveryNoteItemCreate,
    DeliveryNoteItemUpdate,
    DeliveryNoteItem,
    DeliveryNoteBase,
    DeliveryNoteCreate,
    DeliveryNoteUpdate,
    DeliveryNote,
    DeliveryNoteWithItems,
)

from .treasury import (
    BankAccountBase,
    BankAccountCreate,
    BankAccountUpdate,
    BankAccount,
    BankTransactionBase,
    BankTransactionCreate,
    BankTransactionUpdate,
    BankTransaction,
    BankTransactionWithAccount,
    PaymentScheduleBase,
    PaymentScheduleCreate,
    PaymentScheduleUpdate,
    PaymentSchedule,
    PaymentScheduleWithDetails,
    CashFlowSummary,
    CashFlowByCategory,
    CashFlowForecast,
    BankReconciliation,
    ReconciliationItem,
)

__all__ = [
    "ORMBase",
    "TimestampSchema",
    "IDSchema",
    "Token",
    "TokenPayload",
    "LoginRequest",
    "UserBase",
    "UserCreate",
    "UserUpdate",
    "User",
    "TenantBase",
    "TenantCreate",
    "TenantUpdate",
    "Tenant",
    "ClientBase",
    "ClientCreate",
    "ClientUpdate",
    "Client",
    "ProductBase",
    "ProductCreate",
    "ProductUpdate",
    "Product",
    "DocumentBase",
    "DocumentCreate",
    "DocumentUpdate",
    "Document",
    "DocumentUploadResponse",
    "OCRExtractionRequest",
    "OCRExtractionResponse",
    "ActivityBase",
    "ActivityCreate",
    "ActivityUpdate",
    "Activity",
    "AccountingEntryBase",
    "AccountingEntryCreate",
    "AccountingEntryUpdate",
    "AccountingEntry",
    "DashboardStats",
    "FinancialMetrics",
    "LegacyPayment",
    "QuoteItemBase",
    "QuoteItemCreate",
    "QuoteItemUpdate",
    "QuoteItem",
    "QuoteBase",
    "QuoteCreate",
    "QuoteUpdate",
    "Quote",
    "QuoteWithItems",
    "SalesPaymentBase",
    "SalesPaymentCreate",
    "SalesPaymentUpdate",
    "SalesPayment",
    "SalesInvoiceItemBase",
    "SalesInvoiceItemCreate",
    "SalesInvoiceItemUpdate",
    "SalesInvoiceItem",
    "SalesInvoiceBase",
    "SalesInvoiceCreate",
    "SalesInvoiceUpdate",
    "SalesInvoice",
    "SalesInvoiceWithDetails",
    "PurchaseOrderItemBase",
    "PurchaseOrderItemCreate",
    "PurchaseOrderItemUpdate",
    "PurchaseOrderItem",
    "PurchaseOrderBase",
    "PurchaseOrderCreate",
    "PurchaseOrderUpdate",
    "PurchaseOrder",
    "PurchaseOrderWithItems",
    "DeliveryNoteItemBase",
    "DeliveryNoteItemCreate",
    "DeliveryNoteItemUpdate",
    "DeliveryNoteItem",
    "DeliveryNoteBase",
    "DeliveryNoteCreate",
    "DeliveryNoteUpdate",
    "DeliveryNote",
    "DeliveryNoteWithItems",
    "BankAccountBase",
    "BankAccountCreate",
    "BankAccountUpdate",
    "BankAccount",
    "BankTransactionBase",
    "BankTransactionCreate",
    "BankTransactionUpdate",
    "BankTransaction",
    "BankTransactionWithAccount",
    "PaymentScheduleBase",
    "PaymentScheduleCreate",
    "PaymentScheduleUpdate",
    "PaymentSchedule",
    "PaymentScheduleWithDetails",
    "CashFlowSummary",
    "CashFlowByCategory",
    "CashFlowForecast",
    "BankReconciliation",
    "ReconciliationItem",
]
