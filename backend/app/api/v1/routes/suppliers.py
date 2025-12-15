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
class SupplierBalance(BaseModel):
    supplier_id: str
    supplier_name: str
    balance: float
    payables: float
    overdue: float


class SupplierBalanceStats(BaseModel):
    total_suppliers: int
    total_payables: float
    total_overdue: float
    average_balance: float


@router.get("/balance", response_model=List[SupplierBalance])
async def get_suppliers_balance(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    sort_by: Optional[str] = Query("balance", regex="^(balance|supplier_name|payables|overdue)$"),
    sort_order: Optional[str] = Query("desc", regex="^(asc|desc)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get supplier balances calculated from accounting entries (account 401).
    """
    try:
        from app.models.accounting import AccountingEntry
        from datetime import date

        # Get all suppliers for tenant
        suppliers = db.query(Supplier).filter(
            Supplier.client_id == current_user.tenant_id
        ).all()

        balances = []
        for supplier in suppliers:
            # Calculate balance from account 401 (supplier payables)
            # Credit - Debit = amount we owe (payables are credits)
            entries = db.query(
                func.coalesce(func.sum(AccountingEntry.credit), 0).label('total_credit'),
                func.coalesce(func.sum(AccountingEntry.debit), 0).label('total_debit')
            ).filter(
                AccountingEntry.tenant_id == current_user.tenant_id,
                AccountingEntry.account_number.like('401%'),
                AccountingEntry.supplier_id == supplier.id
            ).first()

            total_credit = float(entries.total_credit) if entries else 0
            total_debit = float(entries.total_debit) if entries else 0
            balance = total_credit - total_debit  # Positive = we owe money
            payables = balance if balance > 0 else 0

            # Calculate overdue (simplified - entries older than 30 days)
            overdue_date = date.today()
            overdue_entries = db.query(
                func.coalesce(func.sum(AccountingEntry.credit - AccountingEntry.debit), 0)
            ).filter(
                AccountingEntry.tenant_id == current_user.tenant_id,
                AccountingEntry.account_number.like('401%'),
                AccountingEntry.supplier_id == supplier.id,
                AccountingEntry.date < overdue_date
            ).scalar()
            overdue = float(overdue_entries) if overdue_entries and overdue_entries > 0 else 0

            balances.append({
                "supplier_id": str(supplier.id),
                "supplier_name": supplier.name,
                "balance": balance,
                "payables": payables,
                "overdue": overdue
            })

        # Sort
        reverse = (sort_order == "desc")
        balances.sort(key=lambda x: x[sort_by], reverse=reverse)

        # Paginate
        return balances[skip:skip+limit]

    except Exception as e:
        print(f"Error getting supplier balances: {e}")
        import traceback
        traceback.print_exc()
        return []


@router.get("/balance/stats", response_model=SupplierBalanceStats)
async def get_suppliers_balance_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get aggregate statistics for supplier balances.
    """
    try:
        from app.models.accounting import AccountingEntry

        # Get total suppliers
        total_suppliers = db.query(func.count(Supplier.id)).filter(
            Supplier.client_id == current_user.tenant_id
        ).scalar() or 0

        # Calculate total payables from account 401
        entries = db.query(
            func.coalesce(func.sum(AccountingEntry.credit), 0).label('total_credit'),
            func.coalesce(func.sum(AccountingEntry.debit), 0).label('total_debit')
        ).filter(
            AccountingEntry.tenant_id == current_user.tenant_id,
            AccountingEntry.account_number.like('401%')
        ).first()

        total_credit = float(entries.total_credit) if entries else 0
        total_debit = float(entries.total_debit) if entries else 0
        total_payables = max(0, total_credit - total_debit)

        average_balance = total_payables / total_suppliers if total_suppliers > 0 else 0

        return {
            "total_suppliers": total_suppliers,
            "total_payables": total_payables,
            "total_overdue": 0,  # Simplified for now
            "average_balance": average_balance
        }

    except Exception as e:
        print(f"Error getting supplier balance stats: {e}")
        import traceback
        traceback.print_exc()
        return {
            "total_suppliers": 0,
            "total_payables": 0,
            "total_overdue": 0,
            "average_balance": 0
        }
