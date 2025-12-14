# IMPORTANT: Import order matters for SQLAlchemy relationships
# Import Quote and SalesInvoice BEFORE Client to avoid mapper initialization errors
try:
    from app.models.accounting import AccountingEntry
    from app.models.document import Document
    from app.models.tenant import Tenant
    from app.models.user import User
    from app.models.activity import Activity
    from app.models.product import Product
except Exception as e:
    # If import fails due to HR module removal, set to None and handle later
    print(f"⚠️  Model import failed (HR likely removed): {e}")
    Tenant = None
    User = None
    AccountingEntry = None
    Document = None
    Activity = None
    Product = None
# Import models that Client depends on FIRST
from app.models.quote import Quote, QuoteItem
from app.models.sales_invoice import SalesInvoice, SalesInvoiceItem, Payment
# Import PurchaseOrder and DeliveryNote BEFORE Supplier (which references them)
from app.models.purchase_order import PurchaseOrder, PurchaseOrderItem, DeliveryNote, DeliveryNoteItem
# Now import Supplier (which references PurchaseOrder and DeliveryNote)
from app.models.supplier import Supplier
# Now import Client (which references Quote and SalesInvoice)
from app.models.client import Client
# Import Treasury models AFTER SalesInvoice and PurchaseOrder (which they reference)
from app.models.treasury import BankAccount, BankTransaction, PaymentSchedule
# Import CRM models
from app.models.crm import Lead, Opportunity, CRMActivity

from app.models.accounting_rules import AccountingRule, DocumentClassification

__all__ = [
    "Tenant",
    "User",
    "Client",
    "Document",
    "Supplier",
    "AccountingEntry",
    "Activity",
    "Product",
    "Quote",
    "QuoteItem",
    "SalesInvoice",
    "SalesInvoiceItem",
    "Payment",
    "PurchaseOrder",
    "PurchaseOrderItem",
    "DeliveryNote",
    "DeliveryNoteItem",
    "BankAccount",
    "BankTransaction",
    "PaymentSchedule",
    "Lead",
    "Opportunity",
    "CRMActivity",
    "AccountingRule",
    "DocumentClassification",
]
