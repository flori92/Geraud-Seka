"""
API Routes Billing pour SEKA Enterprise
Gestion abonnements et facturation
"""

from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from app.core.deps import get_current_user, get_current_tenant
from app.models.user import User
from app.models.tenant import Tenant

router = APIRouter()

# Mock subscription data
MOCK_SUBSCRIPTION = {
    "id": "sub_seka_123456",
    "tenant_id": "tenant_001",
    "plan_name": "Professional",
    "plan_code": "PRO",
    "status": "active",
    "price": 49900,
    "currency": "FCFA",
    "billing_interval": "monthly",
    "start_date": (datetime.now() - timedelta(days=180)).isoformat(),
    "current_period_start": (datetime.now() - timedelta(days=15)).isoformat(),
    "current_period_end": (datetime.now() + timedelta(days=15)).isoformat(),
    "next_billing_date": (datetime.now() + timedelta(days=15)).isoformat(),
    "features": [
        {"name": "Utilisateurs", "value": "Illimité"},
        {"name": "Stockage", "value": "50 GB"},
        {"name": "Documents mensuels", "value": "1000"},
        {"name": "Support", "value": "Email & Chat"},
        {"name": "API Access", "value": "Oui"}
    ],
    "usage": {
        "users": {"current": 8, "limit": -1},
        "storage_gb": {"current": 12.5, "limit": 50},
        "documents_this_month": {"current": 342, "limit": 1000},
        "api_calls_this_month": {"current": 15680, "limit": 100000}
    },
    "payment_method": {
        "type": "card",
        "last4": "4242",
        "brand": "Visa",
        "expires": "12/2026"
    }
}

# Mock billing history
MOCK_BILLING_HISTORY = [
    {
        "id": "inv_2025_03",
        "invoice_number": "INV-2025-0003",
        "date": datetime.now().isoformat(),
        "period_start": (datetime.now() - timedelta(days=15)).isoformat(),
        "period_end": (datetime.now() + timedelta(days=15)).isoformat(),
        "amount": 49900,
        "currency": "FCFA",
        "status": "paid",
        "paid_at": datetime.now().isoformat(),
        "description": "Abonnement Professional - Mars 2025",
        "pdf_url": "https://api.sekagestion.com/invoices/inv_2025_03.pdf"
    },
    {
        "id": "inv_2025_02",
        "invoice_number": "INV-2025-0002",
        "date": (datetime.now() - timedelta(days=30)).isoformat(),
        "period_start": (datetime.now() - timedelta(days=45)).isoformat(),
        "period_end": (datetime.now() - timedelta(days=15)).isoformat(),
        "amount": 49900,
        "currency": "FCFA",
        "status": "paid",
        "paid_at": (datetime.now() - timedelta(days=29)).isoformat(),
        "description": "Abonnement Professional - Février 2025",
        "pdf_url": "https://api.sekagestion.com/invoices/inv_2025_02.pdf"
    },
    {
        "id": "inv_2025_01",
        "invoice_number": "INV-2025-0001",
        "date": (datetime.now() - timedelta(days=60)).isoformat(),
        "period_start": (datetime.now() - timedelta(days=75)).isoformat(),
        "period_end": (datetime.now() - timedelta(days=45)).isoformat(),
        "amount": 49900,
        "currency": "FCFA",
        "status": "paid",
        "paid_at": (datetime.now() - timedelta(days=59)).isoformat(),
        "description": "Abonnement Professional - Janvier 2025",
        "pdf_url": "https://api.sekagestion.com/invoices/inv_2025_01.pdf"
    },
    {
        "id": "inv_2024_12",
        "invoice_number": "INV-2024-0012",
        "date": (datetime.now() - timedelta(days=90)).isoformat(),
        "period_start": (datetime.now() - timedelta(days=105)).isoformat(),
        "period_end": (datetime.now() - timedelta(days=75)).isoformat(),
        "amount": 49900,
        "currency": "FCFA",
        "status": "paid",
        "paid_at": (datetime.now() - timedelta(days=89)).isoformat(),
        "description": "Abonnement Professional - Décembre 2024",
        "pdf_url": "https://api.sekagestion.com/invoices/inv_2024_12.pdf"
    }
]


@router.get("/subscription")
async def get_subscription(
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
):
    """
    Récupère les détails de l'abonnement actuel
    """
    return {
        "subscription": MOCK_SUBSCRIPTION,
        "retrieved_at": datetime.now().isoformat()
    }


@router.get("/history")
async def get_billing_history(
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
):
    """
    Récupère l'historique de facturation
    """
    return {
        "invoices": MOCK_BILLING_HISTORY,
        "total_count": len(MOCK_BILLING_HISTORY),
        "total_paid": sum(inv["amount"] for inv in MOCK_BILLING_HISTORY if inv["status"] == "paid"),
        "currency": "FCFA",
        "retrieved_at": datetime.now().isoformat()
    }
