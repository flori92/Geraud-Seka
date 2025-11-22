# IMPORTANT: Import order matters for SQLAlchemy relationships
# Import Quote and SalesInvoice BEFORE Client to avoid mapper initialization errors
from app.models.accounting import AccountingEntry
from app.models.document import Document
from app.models.tenant import Tenant
from app.models.user import User
from app.models.activity import Activity
from app.models.product import Product
from app.models.hr import Employee, Contract, Payslip, LeaveRequest
# Import models that Client depends on FIRST
from app.models.quote import Quote, QuoteItem
from app.models.sales_invoice import SalesInvoice, SalesInvoiceItem, Payment
# Import PurchaseOrder and DeliveryNote BEFORE Supplier (which references them)
from app.models.purchase_order import PurchaseOrder, PurchaseOrderItem, DeliveryNote, DeliveryNoteItem
# Now import Supplier (which references PurchaseOrder and DeliveryNote)
from app.models.supplier import Supplier
# Now import Client (which references Quote and SalesInvoice)
from app.models.client import Client

__all__ = [
    "Tenant",
    "User",
    "Client",
    "Document",
    "Supplier",
    "AccountingEntry",
    "Activity",
    "Product",
    "Employee",
    "Contract",
    "Payslip",
    "LeaveRequest",
    "Quote",
    "QuoteItem",
    "SalesInvoice",
    "SalesInvoiceItem",
    "Payment",
    "PurchaseOrder",
    "PurchaseOrderItem",
    "DeliveryNote",
    "DeliveryNoteItem",
]
