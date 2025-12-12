from fastapi import APIRouter

from app.api.v1.routes import (
    auth,
    health,
    documents,
    documents_ged,
    ged_permissions,
    dashboard,
    clients,
    activities,
    products,
    exports,
    analytics,
    crm,
    email_tracking,
    segments,
    campaigns,
    automations,
    notifications,
    scheduler,
    import_export,
    integrations,
    bot,
    chat,
    hr,
    payments,
    quotes,
    sales_invoices,
    purchase_orders,
    delivery_notes,
    bank_accounts,
    bank_transactions,
    payment_schedules,
    treasury_forecast,
    treasury_dashboard,
    treasury,
    accounting,
    accounting_advanced,
    accounting_entries,
    accounting_rules,
    treasury_advanced,
    stock,
    reports,
    billing,
    sales,
    suppliers,
    supplier_invoices,
    accounting_analytics,
)

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(health.router, prefix="", tags=["health"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(documents.router, prefix="/documents", tags=["documents"])
api_router.include_router(documents_ged.router, prefix="/ged", tags=["ged", "documents"])
api_router.include_router(ged_permissions.router, prefix="/ged/permissions", tags=["ged", "permissions"])
api_router.include_router(clients.router, prefix="/clients", tags=["clients"])
api_router.include_router(suppliers.router, prefix="/suppliers", tags=["suppliers"])
api_router.include_router(activities.router, prefix="/activities", tags=["activities"])
api_router.include_router(products.router, prefix="/products", tags=["products"])
api_router.include_router(exports.router, prefix="/exports", tags=["exports"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
api_router.include_router(crm.router, prefix="/crm", tags=["crm"])
api_router.include_router(email_tracking.router, prefix="/email", tags=["email", "tracking"])
api_router.include_router(segments.router, prefix="/segments", tags=["crm", "segments"])
api_router.include_router(campaigns.router, prefix="/campaigns", tags=["crm", "campaigns", "email"])
api_router.include_router(automations.router, prefix="/automations", tags=["crm", "automations"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
api_router.include_router(scheduler.router, prefix="/scheduler", tags=["scheduler", "tasks"])
api_router.include_router(import_export.router, prefix="/data", tags=["import", "export"])
api_router.include_router(integrations.router, prefix="/integrations", tags=["integrations"])
api_router.include_router(bot.router, prefix="/bot", tags=["bot"])
api_router.include_router(chat.router, prefix="/chat", tags=["chat"])
api_router.include_router(hr.router, prefix="/hr", tags=["hr"])
api_router.include_router(payments.router, prefix="/payments", tags=["payments"])

# Sales Module Routes
# Alias routes for frontend compatibility (/sales/*)
api_router.include_router(sales.router, prefix="/sales", tags=["sales"])
# Original routes
api_router.include_router(quotes.router, prefix="/quotes", tags=["sales", "quotes"])
api_router.include_router(sales_invoices.router, prefix="/sales-invoices", tags=["sales", "invoices"])

# Purchases/Achats Module Routes
api_router.include_router(supplier_invoices.router, prefix="/supplier-invoices", tags=["purchases", "supplier-invoices"])
api_router.include_router(purchase_orders.router, prefix="/purchase-orders", tags=["purchases", "orders"])
api_router.include_router(delivery_notes.router, prefix="/delivery-notes", tags=["purchases", "deliveries"])

# Treasury Module Routes
api_router.include_router(treasury.router, prefix="/treasury", tags=["treasury"])
api_router.include_router(bank_accounts.router, prefix="/treasury/accounts", tags=["treasury", "accounts"])
api_router.include_router(bank_transactions.router, prefix="/treasury/transactions", tags=["treasury", "transactions"])
api_router.include_router(payment_schedules.router, prefix="/treasury/payment-schedules", tags=["treasury", "schedules"])
api_router.include_router(treasury_forecast.router, prefix="/treasury/forecast", tags=["treasury", "forecast"])
api_router.include_router(treasury_dashboard.router, prefix="/treasury/dashboard", tags=["treasury", "dashboard"])

# Accounting Module Routes
api_router.include_router(accounting.router, prefix="/accounting", tags=["accounting"])
api_router.include_router(accounting_advanced.router, prefix="/accounting/advanced", tags=["accounting", "advanced"])
api_router.include_router(accounting_entries.router, prefix="/accounting-entries", tags=["accounting", "entries"])
api_router.include_router(accounting_rules.router, prefix="/accounting-rules", tags=["accounting", "rules", "ocr"])
api_router.include_router(accounting_analytics.router, prefix="/accounting/analytics", tags=["accounting", "analytics"])
api_router.include_router(treasury_advanced.router, prefix="/treasury/advanced", tags=["treasury", "advanced"])

# Stock Module Routes
api_router.include_router(stock.router, prefix="/stock", tags=["stock", "inventory"])

# Reports Module Routes
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])

# Billing Module Routes
api_router.include_router(billing.router, prefix="/billing", tags=["billing", "subscription"])
