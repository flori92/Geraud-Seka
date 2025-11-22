"""Schemas Pydantic pour validation et sérialisation des données."""

# Base schemas
from .base import ORMBase, TimestampSchema, IDSchema

# Auth schemas
from .auth import Token, TokenPayload, LoginRequest

# User schemas
from .user import UserBase, UserCreate, UserUpdate, User

# Tenant schemas
from .tenant import TenantBase, TenantCreate, TenantUpdate, Tenant

# Client schemas
from .client import ClientBase, ClientCreate, ClientUpdate, Client

# Product schemas
from .product import ProductBase, ProductCreate, ProductUpdate, Product

# Document schemas
from .document import (
    DocumentBase,
    DocumentCreate,
    DocumentUpdate,
    Document,
    DocumentUploadResponse,
    OCRExtractionRequest,
    OCRExtractionResponse,
)

# Activity schemas
from .activity import ActivityBase, ActivityCreate, ActivityUpdate, Activity

# Accounting schemas
from .accounting import (
    AccountingEntryBase,
    AccountingEntryCreate,
    AccountingEntryUpdate,
    AccountingEntry,
)

# HR schemas
from .hr import (
    EmployeeBase,
    EmployeeCreate,
    EmployeeUpdate,
    Employee,
    ContractBase,
    ContractCreate,
    ContractUpdate,
    Contract,
    PayslipBase,
    PayslipCreate,
    PayslipUpdate,
    Payslip,
    LeaveRequestBase,
    LeaveRequestCreate,
    LeaveRequestUpdate,
    LeaveRequest,
)

# Dashboard schemas
from .dashboard import DashboardStats, FinancialMetrics

# Payment schemas (legacy - to be consolidated with sales_invoice.Payment)
from .payment import PaymentBase, PaymentCreate, PaymentUpdate, Payment as LegacyPayment

# ========== Sales Module Schemas ==========

# Quote schemas
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

# Sales Invoice schemas
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

# Purchase Order schemas
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

# Delivery Note schemas
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

__all__ = [
    # Base
    "ORMBase",
    "TimestampSchema",
    "IDSchema",
    # Auth
    "Token",
    "TokenPayload",
    "LoginRequest",
    # User
    "UserBase",
    "UserCreate",
    "UserUpdate",
    "User",
    # Tenant
    "TenantBase",
    "TenantCreate",
    "TenantUpdate",
    "Tenant",
    # Client
    "ClientBase",
    "ClientCreate",
    "ClientUpdate",
    "Client",
    # Product
    "ProductBase",
    "ProductCreate",
    "ProductUpdate",
    "Product",
    # Document
    "DocumentBase",
    "DocumentCreate",
    "DocumentUpdate",
    "Document",
    "DocumentUploadResponse",
    "OCRExtractionRequest",
    "OCRExtractionResponse",
    # Activity
    "ActivityBase",
    "ActivityCreate",
    "ActivityUpdate",
    "Activity",
    # Accounting
    "AccountingEntryBase",
    "AccountingEntryCreate",
    "AccountingEntryUpdate",
    "AccountingEntry",
    # HR
    "EmployeeBase",
    "EmployeeCreate",
    "EmployeeUpdate",
    "Employee",
    "ContractBase",
    "ContractCreate",
    "ContractUpdate",
    "Contract",
    "PayslipBase",
    "PayslipCreate",
    "PayslipUpdate",
    "Payslip",
    "LeaveRequestBase",
    "LeaveRequestCreate",
    "LeaveRequestUpdate",
    "LeaveRequest",
    # Dashboard
    "DashboardStats",
    "FinancialMetrics",
    # Legacy Payment
    "LegacyPayment",
    # Quote
    "QuoteItemBase",
    "QuoteItemCreate",
    "QuoteItemUpdate",
    "QuoteItem",
    "QuoteBase",
    "QuoteCreate",
    "QuoteUpdate",
    "Quote",
    "QuoteWithItems",
    # Sales Invoice
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
    # Purchase Order
    "PurchaseOrderItemBase",
    "PurchaseOrderItemCreate",
    "PurchaseOrderItemUpdate",
    "PurchaseOrderItem",
    "PurchaseOrderBase",
    "PurchaseOrderCreate",
    "PurchaseOrderUpdate",
    "PurchaseOrder",
    "PurchaseOrderWithItems",
    # Delivery Note
    "DeliveryNoteItemBase",
    "DeliveryNoteItemCreate",
    "DeliveryNoteItemUpdate",
    "DeliveryNoteItem",
    "DeliveryNoteBase",
    "DeliveryNoteCreate",
    "DeliveryNoteUpdate",
    "DeliveryNote",
    "DeliveryNoteWithItems",
]
