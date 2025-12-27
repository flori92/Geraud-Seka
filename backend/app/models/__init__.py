try:
    from app.models.accounting import AccountingEntry
    from app.models.document import Document
    from app.models.tenant import Tenant
    from app.models.user import User
    from app.models.activity import Activity
    from app.models.product import Product
except Exception as e:
    print(f"⚠️  Model import failed (HR likely removed): {e}")
    Tenant = None
    User = None
    AccountingEntry = None
    Document = None
    Activity = None
    Product = None
from app.models.quote import Quote, QuoteItem
from app.models.sales_invoice import SalesInvoice, SalesInvoiceItem, Payment
from app.models.purchase_order import PurchaseOrder, PurchaseOrderItem, DeliveryNote, DeliveryNoteItem
from app.models.supplier import Supplier
from app.models.client import Client
from app.models.treasury import BankAccount, BankTransaction, PaymentSchedule
try:
    from app.models.crm import Lead, Opportunity, CRMActivity
except Exception:
    pass

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
    "AccountingRule",
    "DocumentClassification",
]
