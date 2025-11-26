from fastapi import APIRouter

from app.api.v1.routes import (
    auth,
    health,
    documents,
    dashboard,
    clients,
    activities,
    products,
    exports,
    analytics,
    crm,
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
)

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(health.router, prefix="", tags=["health"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(clients.router, prefix="/clients", tags=["clients"])
api_router.include_router(activities.router, prefix="/activities", tags=["activities"])
api_router.include_router(products.router, prefix="/products", tags=["products"])
api_router.include_router(exports.router, prefix="/exports", tags=["exports"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
api_router.include_router(crm.router, prefix="/crm", tags=["crm"])
api_router.include_router(bot.router, prefix="/bot", tags=["bot"])
api_router.include_router(chat.router, prefix="/chat", tags=["chat"])
api_router.include_router(hr.router, prefix="/hr", tags=["hr"])
api_router.include_router(payments.router, prefix="/payments", tags=["payments"])

# Sales Module Routes
api_router.include_router(quotes.router, prefix="/quotes", tags=["sales", "quotes"])
api_router.include_router(sales_invoices.router, prefix="/sales-invoices", tags=["sales", "invoices"])
api_router.include_router(purchase_orders.router, prefix="/purchase-orders", tags=["purchases", "orders"])
api_router.include_router(delivery_notes.router, prefix="/delivery-notes", tags=["purchases", "deliveries"])

# Treasury Module Routes
api_router.include_router(bank_accounts.router, prefix="/treasury/accounts", tags=["treasury", "accounts"])
api_router.include_router(bank_transactions.router, prefix="/treasury/transactions", tags=["treasury", "transactions"])
api_router.include_router(payment_schedules.router, prefix="/treasury/payment-schedules", tags=["treasury", "schedules"])
api_router.include_router(treasury_forecast.router, prefix="/treasury/forecast", tags=["treasury", "forecast"])
api_router.include_router(treasury_dashboard.router, prefix="/treasury/dashboard", tags=["treasury", "dashboard"])
