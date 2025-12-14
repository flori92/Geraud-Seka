"""
API publique pour les factures (frontend example)
Endpoint simple pour tester le frontend sans mock data

NOTE: En production, cette API devrait être protégée par authentification JWT
"""

from decimal import Decimal
from datetime import datetime, timedelta
from uuid import uuid4

from fastapi import APIRouter, Query
from pydantic import BaseModel
from typing import Optional

from app.schemas.invoices import InvoiceResponse, InvoiceListResponse, InvoiceStats, InvoiceStatus

router = APIRouter(tags=["Invoices - Public"])


# Simulated in-memory database for demonstration
MOCK_INVOICES = {
    "inv-001": {
        "id": "inv-001",
        "reference_number": "INV-2025-001",
        "client_id": "client-001",
        "client_name": "Example Client 1",
        "invoice_date": datetime.now(),
        "due_date": datetime.now() + timedelta(days=30),
        "description": "Consultation services",
        "status": "paid",
        "items": [
            {
                "id": "item-001",
                "product_name": "Consultation",
                "quantity": Decimal("5"),
                "unit_price": Decimal("50000"),
                "tax_rate": Decimal("18"),
                "total_ht": Decimal("250000"),
                "total_ttc": Decimal("295000"),
            }
        ],
        "total_ht": Decimal("250000"),
        "total_tax": Decimal("45000"),
        "total_ttc": Decimal("295000"),
        "created_at": datetime.now() - timedelta(days=10),
        "updated_at": datetime.now() - timedelta(days=5),
    },
    "inv-002": {
        "id": "inv-002",
        "reference_number": "INV-2025-002",
        "client_id": "client-002",
        "client_name": "Example Client 2",
        "invoice_date": datetime.now() - timedelta(days=3),
        "due_date": datetime.now() + timedelta(days=27),
        "description": "Design work",
        "status": "pending",
        "items": [
            {
                "id": "item-002",
                "product_name": "Web Design",
                "quantity": Decimal("8"),
                "unit_price": Decimal("25000"),
                "tax_rate": Decimal("18"),
                "total_ht": Decimal("200000"),
                "total_ttc": Decimal("236000"),
            }
        ],
        "total_ht": Decimal("200000"),
        "total_tax": Decimal("36000"),
        "total_ttc": Decimal("236000"),
        "created_at": datetime.now() - timedelta(days=3),
        "updated_at": datetime.now() - timedelta(days=3),
    },
    "inv-003": {
        "id": "inv-003",
        "reference_number": "INV-2024-150",
        "client_id": "client-003",
        "client_name": "Example Client 3",
        "invoice_date": datetime.now() - timedelta(days=45),
        "due_date": datetime.now() - timedelta(days=15),
        "description": "Development services",
        "status": "overdue",
        "items": [
            {
                "id": "item-003",
                "product_name": "Development",
                "quantity": Decimal("20"),
                "unit_price": Decimal("60000"),
                "tax_rate": Decimal("18"),
                "total_ht": Decimal("1200000"),
                "total_ttc": Decimal("1416000"),
            }
        ],
        "total_ht": Decimal("1200000"),
        "total_tax": Decimal("216000"),
        "total_ttc": Decimal("1416000"),
        "created_at": datetime.now() - timedelta(days=45),
        "updated_at": datetime.now() - timedelta(days=45),
    },
    "inv-004": {
        "id": "inv-004",
        "reference_number": "INV-2025-004",
        "client_id": "client-004",
        "client_name": "Example Client 4",
        "invoice_date": datetime.now(),
        "due_date": datetime.now() + timedelta(days=30),
        "description": "Project planning",
        "status": "draft",
        "items": [
            {
                "id": "item-004",
                "product_name": "Project Planning",
                "quantity": Decimal("3"),
                "unit_price": Decimal("75000"),
                "tax_rate": Decimal("18"),
                "total_ht": Decimal("225000"),
                "total_ttc": Decimal("265500"),
            }
        ],
        "total_ht": Decimal("225000"),
        "total_tax": Decimal("40500"),
        "total_ttc": Decimal("265500"),
        "created_at": datetime.now(),
        "updated_at": datetime.now(),
    },
}


@router.get(
    "",
    response_model=InvoiceListResponse,
    summary="Lister les factures (exemple)",
    description="Retourne une liste d'exemples de factures pour le développement du frontend",
)
async def list_invoices(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
) -> InvoiceListResponse:
    """
    Endpoint public retournant les factures d'exemple.
    
    **À remplacer en production** par l'endpoint sécurisé /api/v1/sales-invoices
    """
    invoices = list(MOCK_INVOICES.values())
    
    if status:
        invoices = [i for i in invoices if i["status"] == status]
    
    if search:
        invoices = [
            i for i in invoices
            if search.lower() in i["reference_number"].lower()
            or search.lower() in i["description"].lower()
        ]
    
    total = len(invoices)
    paginated = invoices[skip : skip + limit]
    
    return InvoiceListResponse(
        items=[InvoiceResponse(**inv) for inv in paginated],
        total=total,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/stats",
    response_model=InvoiceStats,
    summary="Statistiques des factures (exemple)",
    description="Retourne les stats des factures d'exemple",
)
async def get_invoice_stats() -> InvoiceStats:
    """Endpoint public retournant les stats d'exemple."""
    invoices = list(MOCK_INVOICES.values())
    
    total_amount = sum(Decimal(str(i["total_ttc"])) for i in invoices)
    paid_amount = sum(
        Decimal(str(i["total_ttc"])) for i in invoices if i["status"] == "paid"
    )
    pending_amount = sum(
        Decimal(str(i["total_ttc"])) for i in invoices if i["status"] == "pending"
    )
    overdue_amount = sum(
        Decimal(str(i["total_ttc"])) for i in invoices if i["status"] == "overdue"
    )
    
    return InvoiceStats(
        total_amount=total_amount,
        paid_amount=paid_amount,
        pending_amount=pending_amount,
        overdue_amount=overdue_amount,
        draft_count=len([i for i in invoices if i["status"] == "draft"]),
        pending_count=len([i for i in invoices if i["status"] == "pending"]),
        paid_count=len([i for i in invoices if i["status"] == "paid"]),
        overdue_count=len([i for i in invoices if i["status"] == "overdue"]),
    )


@router.get(
    "/{invoice_id}",
    response_model=InvoiceResponse,
    summary="Récupérer une facture (exemple)",
    description="Retourne une facture d'exemple spécifique",
)
async def get_invoice(invoice_id: str) -> InvoiceResponse:
    """Endpoint public retournant une facture d'exemple."""
    if invoice_id not in MOCK_INVOICES:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Facture non trouvée")
    
    return InvoiceResponse(**MOCK_INVOICES[invoice_id])
