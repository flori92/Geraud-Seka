"""
Suppliers API Routes
CRUD operations for supplier management
"""
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.session import get_db
from app.models.supplier import Supplier
from app.models.purchase_order import PurchaseOrder
from app.core.deps import get_current_user
from app.models.user import User
from pydantic import BaseModel
from datetime import date, timedelta


router = APIRouter()


# Pydantic Schemas
class SupplierBase(BaseModel):
    name: str
    nif: Optional[str] = None
    default_account: Optional[str] = None
    default_tax_rate: Optional[float] = None
    default_journal: Optional[str] = None
    default_description: Optional[str] = None
    contact_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    country: Optional[str] = None


class SupplierCreate(SupplierBase):
    pass


class SupplierUpdate(SupplierBase):
    name: Optional[str] = None


class SupplierResponse(SupplierBase):
    id: UUID
    total_orders: int = 0
    total_spent: float = 0
    status: str = "active"

    class Config:
        from_attributes = True


@router.get("/", response_model=List[SupplierResponse])
async def list_suppliers(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List all suppliers for the current tenant with order statistics.
    """
    try:
        query = db.query(Supplier).filter(Supplier.client_id == current_user.tenant_id)
        
        if search:
            search_filter = f"%{search}%"
            query = query.filter(
                Supplier.name.ilike(search_filter)
            )
        
        suppliers = query.offset(skip).limit(limit).all()
        
        # Calculate order stats for each supplier
        result = []
        for supplier in suppliers:
            # Get order stats
            order_stats = db.query(
                func.count(PurchaseOrder.id).label('total_orders'),
                func.coalesce(func.sum(PurchaseOrder.total_amount), 0).label('total_spent')
            ).filter(
                PurchaseOrder.supplier_id == supplier.id
            ).first()
            
            supplier_dict = {
                "id": supplier.id,
                "name": supplier.name,
                "nif": supplier.nif,
                "default_account": supplier.default_account,
                "default_tax_rate": float(supplier.default_tax_rate) if supplier.default_tax_rate else None,
                "default_journal": supplier.default_journal,
                "default_description": supplier.default_description,
                "contact_name": getattr(supplier, 'contact_name', None),
                "email": getattr(supplier, 'email', None),
                "phone": getattr(supplier, 'phone', None),
                "address": getattr(supplier, 'address', None),
                "country": getattr(supplier, 'country', None),
                "total_orders": order_stats.total_orders if order_stats else 0,
                "total_spent": float(order_stats.total_spent) if order_stats else 0,
                "status": "active"
            }
            result.append(supplier_dict)
        
        return result
    except Exception as e:
        print(f"Error listing suppliers: {e}")
        return []


@router.get("/{supplier_id}", response_model=SupplierResponse)
async def get_supplier(
    supplier_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get a specific supplier by ID.
    """
    supplier = db.query(Supplier).filter(
        Supplier.id == supplier_id,
        Supplier.client_id == current_user.tenant_id
    ).first()
    
    if not supplier:
        raise HTTPException(status_code=404, detail="Fournisseur non trouvé")
    
    # Get order stats
    order_stats = db.query(
        func.count(PurchaseOrder.id).label('total_orders'),
        func.coalesce(func.sum(PurchaseOrder.total_amount), 0).label('total_spent')
    ).filter(
        PurchaseOrder.supplier_id == supplier.id
    ).first()
    
    return {
        "id": supplier.id,
        "name": supplier.name,
        "nif": supplier.nif,
        "default_account": supplier.default_account,
        "default_tax_rate": float(supplier.default_tax_rate) if supplier.default_tax_rate else None,
        "default_journal": supplier.default_journal,
        "default_description": supplier.default_description,
        "contact_name": getattr(supplier, 'contact_name', None),
        "email": getattr(supplier, 'email', None),
        "phone": getattr(supplier, 'phone', None),
        "address": getattr(supplier, 'address', None),
        "country": getattr(supplier, 'country', None),
        "total_orders": order_stats.total_orders if order_stats else 0,
        "total_spent": float(order_stats.total_spent) if order_stats else 0,
        "status": "active"
    }


@router.post("/", response_model=SupplierResponse)
async def create_supplier(
    supplier_data: SupplierCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new supplier.
    """
    try:
        supplier = Supplier(
            name=supplier_data.name,
            nif=supplier_data.nif,
            default_account=supplier_data.default_account,
            default_tax_rate=supplier_data.default_tax_rate,
            default_journal=supplier_data.default_journal,
            default_description=supplier_data.default_description,
            client_id=current_user.tenant_id
        )
        
        # Add optional contact fields if the model supports them
        if hasattr(supplier, 'contact_name'):
            supplier.contact_name = supplier_data.contact_name
        if hasattr(supplier, 'email'):
            supplier.email = supplier_data.email
        if hasattr(supplier, 'phone'):
            supplier.phone = supplier_data.phone
        if hasattr(supplier, 'address'):
            supplier.address = supplier_data.address
        if hasattr(supplier, 'country'):
            supplier.country = supplier_data.country
        
        db.add(supplier)
        db.commit()
        db.refresh(supplier)
        
        return {
            "id": supplier.id,
            "name": supplier.name,
            "nif": supplier.nif,
            "default_account": supplier.default_account,
            "default_tax_rate": float(supplier.default_tax_rate) if supplier.default_tax_rate else None,
            "default_journal": supplier.default_journal,
            "default_description": supplier.default_description,
            "contact_name": getattr(supplier, 'contact_name', None),
            "email": getattr(supplier, 'email', None),
            "phone": getattr(supplier, 'phone', None),
            "address": getattr(supplier, 'address', None),
            "country": getattr(supplier, 'country', None),
            "total_orders": 0,
            "total_spent": 0,
            "status": "active"
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Erreur lors de la création: {str(e)}")


@router.put("/{supplier_id}", response_model=SupplierResponse)
async def update_supplier(
    supplier_id: UUID,
    supplier_data: SupplierUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update an existing supplier.
    """
    supplier = db.query(Supplier).filter(
        Supplier.id == supplier_id,
        Supplier.client_id == current_user.tenant_id
    ).first()
    
    if not supplier:
        raise HTTPException(status_code=404, detail="Fournisseur non trouvé")
    
    try:
        update_data = supplier_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if hasattr(supplier, field) and value is not None:
                setattr(supplier, field, value)
        
        db.commit()
        db.refresh(supplier)
        
        # Get order stats
        order_stats = db.query(
            func.count(PurchaseOrder.id).label('total_orders'),
            func.coalesce(func.sum(PurchaseOrder.total_amount), 0).label('total_spent')
        ).filter(
            PurchaseOrder.supplier_id == supplier.id
        ).first()
        
        return {
            "id": supplier.id,
            "name": supplier.name,
            "nif": supplier.nif,
            "default_account": supplier.default_account,
            "default_tax_rate": float(supplier.default_tax_rate) if supplier.default_tax_rate else None,
            "default_journal": supplier.default_journal,
            "default_description": supplier.default_description,
            "contact_name": getattr(supplier, 'contact_name', None),
            "email": getattr(supplier, 'email', None),
            "phone": getattr(supplier, 'phone', None),
            "address": getattr(supplier, 'address', None),
            "country": getattr(supplier, 'country', None),
            "total_orders": order_stats.total_orders if order_stats else 0,
            "total_spent": float(order_stats.total_spent) if order_stats else 0,
            "status": "active"
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Erreur lors de la mise à jour: {str(e)}")


@router.delete("/{supplier_id}")
async def delete_supplier(
    supplier_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a supplier.
    """
    supplier = db.query(Supplier).filter(
        Supplier.id == supplier_id,
        Supplier.client_id == current_user.tenant_id
    ).first()

    if not supplier:
        raise HTTPException(status_code=404, detail="Fournisseur non trouvé")

    try:
        db.delete(supplier)
        db.commit()
        return {"message": "Fournisseur supprimé avec succès"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Erreur lors de la suppression: {str(e)}")


# New balance endpoints
class SupplierBalanceRow(BaseModel):
    id: str
    supplier_name: str
    supplier_code: str
    balance: float
    overdue_amount: float
    upcoming_30d_amount: float
    last_invoice_date: str
    last_invoice_number: str
    payment_terms: str
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    invoices_count: int
    oldest_overdue_date: Optional[str] = None


class SupplierBalanceStatsResponse(BaseModel):
    total_du: float
    en_retard: float
    a_payer_30j: float
    fournisseurs_actifs: int


@router.get("/balance", response_model=List[SupplierBalanceRow])
async def get_suppliers_balance(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    search: Optional[str] = Query(None),
    sort_by: Optional[str] = Query("balance"),
    sort_order: Optional[str] = Query("desc"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get supplier balances for the current tenant.

    Implémentation locale (MVP): calculs basés sur les bons de commande (purchase_orders).
    On considère que la somme des PO (total_ttc) représente un "montant dû".
    """
    try:
        today = date.today()
        horizon = today + timedelta(days=30)

        requested_sort = (sort_by or "balance").strip()
        sort_key = requested_sort
        if requested_sort == "name":
            sort_key = "supplier_name"
        elif requested_sort == "overdue":
            sort_key = "overdue_amount"

        allowed_sort_keys = {
            "balance",
            "supplier_name",
            "overdue_amount",
            "upcoming_30d_amount",
        }
        if sort_key not in allowed_sort_keys:
            sort_key = "balance"

        order = (sort_order or "desc").strip().lower()
        reverse = order != "asc"

        # Get all suppliers for tenant
        suppliers = db.query(Supplier).filter(
            Supplier.client_id == current_user.tenant_id
        ).all()

        rows: list[dict] = []
        for supplier in suppliers:
            if search and search.strip():
                q = search.strip().lower()
                if q not in (supplier.name or "").lower():
                    continue

            po_query = db.query(PurchaseOrder).filter(
                PurchaseOrder.tenant_id == current_user.tenant_id,
                PurchaseOrder.supplier_id == supplier.id,
            )

            invoices_count = po_query.count()
            total_due = float(po_query.with_entities(func.coalesce(func.sum(PurchaseOrder.total_ttc), 0)).scalar() or 0)

            overdue_amount = float(
                po_query.filter(
                    PurchaseOrder.expected_delivery_date.isnot(None),
                    PurchaseOrder.expected_delivery_date < today,
                ).with_entities(func.coalesce(func.sum(PurchaseOrder.total_ttc), 0)).scalar() or 0
            )

            upcoming_30d_amount = float(
                po_query.filter(
                    PurchaseOrder.expected_delivery_date.isnot(None),
                    PurchaseOrder.expected_delivery_date >= today,
                    PurchaseOrder.expected_delivery_date <= horizon,
                ).with_entities(func.coalesce(func.sum(PurchaseOrder.total_ttc), 0)).scalar() or 0
            )

            oldest_overdue = (
                po_query.filter(
                    PurchaseOrder.expected_delivery_date.isnot(None),
                    PurchaseOrder.expected_delivery_date < today,
                )
                .order_by(PurchaseOrder.expected_delivery_date.asc())
                .with_entities(PurchaseOrder.expected_delivery_date)
                .first()
            )

            last_po = (
                po_query.order_by(PurchaseOrder.order_date.desc())
                .with_entities(
                    PurchaseOrder.order_date,
                    PurchaseOrder.po_number,
                    PurchaseOrder.payment_terms,
                )
                .first()
            )

            last_invoice_date = last_po.order_date.isoformat() if last_po and last_po.order_date else ""
            last_invoice_number = last_po.po_number if last_po and last_po.po_number else ""
            payment_terms = last_po.payment_terms if last_po and last_po.payment_terms else ""

            supplier_code = str(supplier.id)[:8]

            rows.append(
                {
                    "id": str(supplier.id),
                    "supplier_name": supplier.name,
                    "supplier_code": supplier_code,
                    "balance": total_due,
                    "overdue_amount": overdue_amount,
                    "upcoming_30d_amount": upcoming_30d_amount,
                    "last_invoice_date": last_invoice_date,
                    "last_invoice_number": last_invoice_number,
                    "payment_terms": payment_terms,
                    "contact_email": getattr(supplier, "email", None),
                    "contact_phone": getattr(supplier, "phone", None),
                    "invoices_count": invoices_count,
                    "oldest_overdue_date": oldest_overdue.expected_delivery_date.isoformat() if oldest_overdue and oldest_overdue.expected_delivery_date else None,
                }
            )

        rows.sort(key=lambda x: x.get(sort_key) or 0, reverse=reverse)
        return rows[skip : skip + limit]

    except Exception as e:
        print(f"Error getting supplier balances: {e}")
        import traceback
        traceback.print_exc()
        return []


@router.get("/balance/stats", response_model=SupplierBalanceStatsResponse)
async def get_suppliers_balance_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get aggregate statistics for supplier balances.
    """
    try:
        today = date.today()
        horizon = today + timedelta(days=30)

        supplier_ids = [
            s[0]
            for s in db.query(Supplier.id).filter(Supplier.client_id == current_user.tenant_id).all()
        ]

        if not supplier_ids:
            return {
                "total_du": 0,
                "en_retard": 0,
                "a_payer_30j": 0,
                "fournisseurs_actifs": 0,
            }

        po_base = db.query(PurchaseOrder).filter(
            PurchaseOrder.tenant_id == current_user.tenant_id,
            PurchaseOrder.supplier_id.in_(supplier_ids),
        )

        total_du = float(po_base.with_entities(func.coalesce(func.sum(PurchaseOrder.total_ttc), 0)).scalar() or 0)

        en_retard = float(
            po_base.filter(
                PurchaseOrder.expected_delivery_date.isnot(None),
                PurchaseOrder.expected_delivery_date < today,
            )
            .with_entities(func.coalesce(func.sum(PurchaseOrder.total_ttc), 0))
            .scalar()
            or 0
        )

        a_payer_30j = float(
            po_base.filter(
                PurchaseOrder.expected_delivery_date.isnot(None),
                PurchaseOrder.expected_delivery_date >= today,
                PurchaseOrder.expected_delivery_date <= horizon,
            )
            .with_entities(func.coalesce(func.sum(PurchaseOrder.total_ttc), 0))
            .scalar()
            or 0
        )

        fournisseurs_actifs = (
            db.query(PurchaseOrder.supplier_id)
            .filter(
                PurchaseOrder.tenant_id == current_user.tenant_id,
                PurchaseOrder.total_ttc > 0,
            )
            .distinct()
            .count()
        )

        return {
            "total_du": total_du,
            "en_retard": en_retard,
            "a_payer_30j": a_payer_30j,
            "fournisseurs_actifs": fournisseurs_actifs,
        }

    except Exception as e:
        print(f"Error getting supplier balance stats: {e}")
        import traceback
        traceback.print_exc()
        return {
            "total_du": 0,
            "en_retard": 0,
            "a_payer_30j": 0,
            "fournisseurs_actifs": 0,
        }
