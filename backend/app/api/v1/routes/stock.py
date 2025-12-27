"""
API Routes Stock/Inventaire pour SEKA Enterprise
Gestion inventaire et mouvements de stock
"""

from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from app.core.deps import get_current_user, get_current_tenant
from app.models.user import User
from app.models.tenant import Tenant

router = APIRouter()

MOCK_INVENTORY = [
    {
        "id": "inv-001",
        "product_id": "prod-001",
        "product_name": "Ordinateur Portable Dell XPS",
        "sku": "DELL-XPS-15",
        "quantity": 45,
        "reserved_quantity": 5,
        "available_quantity": 40,
        "unit_cost": 850000,
        "total_value": 38250000,
        "location": "Entrepôt Principal - A12",
        "reorder_point": 10,
        "reorder_quantity": 20,
        "status": "in_stock",
        "last_restocked": (datetime.now() - timedelta(days=15)).isoformat(),
        "unit": "pièce"
    },
    {
        "id": "inv-002",
        "product_id": "prod-002",
        "product_name": "Papier A4 - Ramette 500 feuilles",
        "sku": "PAPER-A4-500",
        "quantity": 12,
        "reserved_quantity": 0,
        "available_quantity": 12,
        "unit_cost": 3500,
        "total_value": 42000,
        "location": "Entrepôt Principal - B03",
        "reorder_point": 20,
        "reorder_quantity": 50,
        "status": "low_stock",
        "last_restocked": (datetime.now() - timedelta(days=30)).isoformat(),
        "unit": "ramette"
    },
    {
        "id": "inv-003",
        "product_id": "prod-003",
        "product_name": "Imprimante HP LaserJet Pro",
        "sku": "HP-LJ-PRO",
        "quantity": 0,
        "reserved_quantity": 0,
        "available_quantity": 0,
        "unit_cost": 250000,
        "total_value": 0,
        "location": "Entrepôt Principal - C05",
        "reorder_point": 5,
        "reorder_quantity": 10,
        "status": "out_of_stock",
        "last_restocked": (datetime.now() - timedelta(days=60)).isoformat(),
        "unit": "pièce"
    },
    {
        "id": "inv-004",
        "product_name": "Chaise de Bureau Ergonomique",
        "sku": "CHAIR-ERG-001",
        "quantity": 28,
        "reserved_quantity": 3,
        "available_quantity": 25,
        "unit_cost": 75000,
        "total_value": 2100000,
        "location": "Entrepôt Principal - D08",
        "reorder_point": 15,
        "reorder_quantity": 25,
        "status": "in_stock",
        "last_restocked": (datetime.now() - timedelta(days=7)).isoformat(),
        "unit": "pièce"
    }
]

MOCK_MOVEMENTS = [
    {
        "id": "mov-001",
        "product_id": "prod-001",
        "product_name": "Ordinateur Portable Dell XPS",
        "type": "in",
        "quantity": 20,
        "unit_cost": 850000,
        "total_cost": 17000000,
        "reference": "PO-2025-001",
        "reason": "purchase_order",
        "location": "Entrepôt Principal - A12",
        "created_at": (datetime.now() - timedelta(days=15)).isoformat(),
        "created_by": "Jean Dupont",
        "notes": "Réception commande fournisseur Dell"
    },
    {
        "id": "mov-002",
        "product_id": "prod-001",
        "product_name": "Ordinateur Portable Dell XPS",
        "type": "out",
        "quantity": 3,
        "unit_cost": 850000,
        "total_cost": 2550000,
        "reference": "SO-2025-015",
        "reason": "sale",
        "location": "Entrepôt Principal - A12",
        "created_at": (datetime.now() - timedelta(days=5)).isoformat(),
        "created_by": "Marie Martin",
        "notes": "Vente client - Bon de livraison BL-2025-015"
    },
    {
        "id": "mov-003",
        "product_id": "prod-002",
        "product_name": "Papier A4 - Ramette 500 feuilles",
        "type": "out",
        "quantity": 8,
        "unit_cost": 3500,
        "total_cost": 28000,
        "reference": "INTERNAL-001",
        "reason": "internal_use",
        "location": "Entrepôt Principal - B03",
        "created_at": (datetime.now() - timedelta(days=3)).isoformat(),
        "created_by": "Paul Bernard",
        "notes": "Usage interne - Service administratif"
    },
    {
        "id": "mov-004",
        "product_id": "prod-003",
        "product_name": "Imprimante HP LaserJet Pro",
        "type": "out",
        "quantity": 2,
        "unit_cost": 250000,
        "total_cost": 500000,
        "reference": "ADJ-2025-001",
        "reason": "damaged",
        "location": "Entrepôt Principal - C05",
        "created_at": (datetime.now() - timedelta(days=10)).isoformat(),
        "created_by": "Admin",
        "notes": "Ajustement inventaire - Produits endommagés"
    },
    {
        "id": "mov-005",
        "product_id": "prod-004",
        "product_name": "Chaise de Bureau Ergonomique",
        "type": "in",
        "quantity": 30,
        "unit_cost": 75000,
        "total_cost": 2250000,
        "reference": "PO-2025-005",
        "reason": "purchase_order",
        "location": "Entrepôt Principal - D08",
        "created_at": (datetime.now() - timedelta(days=7)).isoformat(),
        "created_by": "Jean Dupont",
        "notes": "Réception fournisseur mobilier"
    }
]


@router.get("/inventory/")
async def get_inventory(
    status: Optional[str] = Query(None, description="Filter by stock status (in_stock, low_stock, out_of_stock)"),
    location: Optional[str] = Query(None, description="Filter by warehouse location"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
):
    """
    Récupère l'inventaire avec filtres

    - **status**: Filtrer par statut (in_stock, low_stock, out_of_stock)
    - **location**: Filtrer par emplacement entrepôt
    - **limit**: Nombre d'items à retourner
    - **offset**: Pagination
    """
    inventory = MOCK_INVENTORY.copy()

    if status:
        inventory = [item for item in inventory if item["status"] == status]

    if location:
        inventory = [item for item in inventory if location.lower() in item["location"].lower()]

    total_count = len(inventory)
    inventory = inventory[offset:offset + limit]

    total_value = sum(item["total_value"] for item in MOCK_INVENTORY)
    low_stock_count = sum(1 for item in MOCK_INVENTORY if item["status"] == "low_stock")
    out_of_stock_count = sum(1 for item in MOCK_INVENTORY if item["status"] == "out_of_stock")

    return {
        "inventory": inventory,
        "total_count": total_count,
        "limit": limit,
        "offset": offset,
        "has_more": (offset + limit) < total_count,
        "summary": {
            "total_items": len(MOCK_INVENTORY),
            "total_value": total_value,
            "low_stock_items": low_stock_count,
            "out_of_stock_items": out_of_stock_count
        }
    }


@router.get("/movements/")
async def get_stock_movements(
    product_id: Optional[str] = Query(None, description="Filter by product ID"),
    movement_type: Optional[str] = Query(None, description="Filter by type (in/out)"),
    reason: Optional[str] = Query(None, description="Filter by reason (purchase_order, sale, internal_use, etc.)"),
    days_back: int = Query(30, ge=1, le=365, description="Number of days to look back"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
):
    """
    Récupère les mouvements de stock avec filtres

    - **product_id**: Filtrer par produit
    - **movement_type**: Type de mouvement (in/out)
    - **reason**: Raison du mouvement
    - **days_back**: Nombre de jours historique (défaut: 30)
    - **limit**: Nombre de mouvements à retourner
    - **offset**: Pagination
    """
    movements = MOCK_MOVEMENTS.copy()

    cutoff_date = datetime.now() - timedelta(days=days_back)
    movements = [
        mov for mov in movements
        if datetime.fromisoformat(mov["created_at"]) >= cutoff_date
    ]

    if product_id:
        movements = [mov for mov in movements if mov.get("product_id") == product_id]

    if movement_type:
        movements = [mov for mov in movements if mov["type"] == movement_type]

    if reason:
        movements = [mov for mov in movements if mov["reason"] == reason]

    total_count = len(movements)
    movements = movements[offset:offset + limit]

    total_in = sum(mov["quantity"] for mov in MOCK_MOVEMENTS if mov["type"] == "in")
    total_out = sum(mov["quantity"] for mov in MOCK_MOVEMENTS if mov["type"] == "out")
    total_value_in = sum(mov["total_cost"] for mov in MOCK_MOVEMENTS if mov["type"] == "in")
    total_value_out = sum(mov["total_cost"] for mov in MOCK_MOVEMENTS if mov["type"] == "out")

    return {
        "movements": movements,
        "total_count": total_count,
        "limit": limit,
        "offset": offset,
        "has_more": (offset + limit) < total_count,
        "summary": {
            "total_in": total_in,
            "total_out": total_out,
            "net_movement": total_in - total_out,
            "total_value_in": total_value_in,
            "total_value_out": total_value_out,
            "period_days": days_back
        }
    }
