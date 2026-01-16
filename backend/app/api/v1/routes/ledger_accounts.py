"""
API Routes pour la gestion du Plan Comptable
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from uuid import UUID

from app.db.session import get_db
from app.core.deps import get_current_user, get_current_tenant
from app.models.user import User
from app.models.tenant import Tenant
from app.models.ledger_account import LedgerAccount

router = APIRouter()


class LedgerAccountCreate(BaseModel):
    account_code: str
    account_name: str
    parent_account_id: Optional[str] = None
    is_auxiliary: bool = False
    is_collective: bool = False
    account_type: Optional[str] = None


class LedgerAccountResponse(BaseModel):
    id: str
    account_code: str
    account_name: str
    is_active: bool
    parent_account_id: Optional[str] = None
    is_auxiliary: bool
    is_collective: bool
    account_type: Optional[str] = None

    class Config:
        from_attributes = True


@router.get("", response_model=List[LedgerAccountResponse])
async def list_ledger_accounts(
    current_tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """Liste tous les comptes du plan comptable."""
    accounts = db.query(LedgerAccount).filter(
        LedgerAccount.tenant_id == current_tenant.id
    ).order_by(LedgerAccount.account_code).all()
    
    return accounts


@router.post("", response_model=LedgerAccountResponse)
async def create_ledger_account(
    data: LedgerAccountCreate,
    current_user: User = Depends(get_current_user),
    current_tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """Crée un nouveau compte (général ou auxiliaire)."""
    
    # Vérifier si le code existe déjà
    existing = db.query(LedgerAccount).filter(
        LedgerAccount.tenant_id == current_tenant.id,
        LedgerAccount.account_code == data.account_code
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Ce code de compte existe déjà")
    
    account = LedgerAccount(
        tenant_id=current_tenant.id,
        account_code=data.account_code,
        account_name=data.account_name,
        parent_account_id=data.parent_account_id,
        is_auxiliary=data.is_auxiliary,
        is_collective=data.is_collective,
        account_type=data.account_type,
        is_active=True
    )
    
    db.add(account)
    db.commit()
    db.refresh(account)
    
    return account


@router.post("/create-auxiliary")
async def create_auxiliary_account(
    account_code: str,
    account_name: str,
    parent_account_code: str,
    current_tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """
    Crée un compte auxiliaire sous un compte collectif.
    Ex: Créer 401SBEE sous 401
    """
    
    # Trouver le compte parent
    parent = db.query(LedgerAccount).filter(
        LedgerAccount.tenant_id == current_tenant.id,
        LedgerAccount.account_code == parent_account_code
    ).first()
    
    if not parent:
        raise HTTPException(status_code=404, detail=f"Compte parent {parent_account_code} introuvable")
    
    # Vérifier si le code existe déjà
    existing = db.query(LedgerAccount).filter(
        LedgerAccount.tenant_id == current_tenant.id,
        LedgerAccount.account_code == account_code
    ).first()
    
    if existing:
        return {"id": str(existing.id), "message": "Compte auxiliaire existe déjà"}
    
    # Créer le compte auxiliaire
    auxiliary = LedgerAccount(
        tenant_id=current_tenant.id,
        account_code=account_code,
        account_name=account_name,
        parent_account_id=parent.id,
        is_auxiliary=True,
        is_collective=False,
        account_type=parent.account_type,
        is_active=True
    )
    
    db.add(auxiliary)
    db.commit()
    db.refresh(auxiliary)
    
    return {
        "id": str(auxiliary.id),
        "account_code": auxiliary.account_code,
        "account_name": auxiliary.account_name,
        "parent_account_code": parent_account_code,
        "message": "Compte auxiliaire créé avec succès"
    }
