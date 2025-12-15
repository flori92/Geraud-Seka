"""API routes for Bank Account management (Comptes Bancaires)."""
from typing import List, Any, Optional
from uuid import UUID
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core import deps
from app.models.user import User
from app.schemas.treasury import (
    BankAccount,
    BankAccountCreate,
    BankAccountUpdate,
)
from app.crud import bank_account as ba_crud

router = APIRouter()


@router.get("/", response_model=List[BankAccount])
def list_bank_accounts(
    db: Session = Depends(deps.get_db_session),
    skip: int = 0,
    limit: int = 100,
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    account_type: Optional[str] = Query(None, description="Filter by account type"),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Retrieve bank accounts for the current tenant.
    """
    try:
        accounts = ba_crud.get_multi(
            db,
            tenant_id=current_user.tenant_id,
            skip=skip,
            limit=limit,
            is_active=is_active,
            account_type=account_type,
        )
        return accounts
    except AttributeError as e:
        print(f"Bank accounts CRUD error: {str(e)}")
        return []
    except Exception as e:
        print(f"Error listing bank accounts: {str(e)}")
        import traceback
        traceback.print_exc()
        return []


@router.post("/", response_model=BankAccount, status_code=201)
def create_bank_account(
    *,
    db: Session = Depends(deps.get_db_session),
    account_in: BankAccountCreate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Create new bank account.
    """
    # Check if account number already exists
    existing = ba_crud.get_by_account_number(
        db, account_number=account_in.account_number, tenant_id=current_user.tenant_id
    )
    if existing:
        raise HTTPException(status_code=400, detail="Account number already exists")

    account = ba_crud.create(
        db,
        obj_in=account_in,
        tenant_id=current_user.tenant_id,
    )
    return account


@router.get("/default", response_model=BankAccount)
def get_default_account(
    db: Session = Depends(deps.get_db_session),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get the default bank account for the current tenant.
    """
    account = ba_crud.get_default(db, tenant_id=current_user.tenant_id)
    if not account:
        raise HTTPException(status_code=404, detail="No default bank account found")
    return account


@router.get("/total-balance", response_model=dict)
def get_total_balance(
    db: Session = Depends(deps.get_db_session),
    currency: str = Query("XOF", description="Currency code"),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get total balance across all active accounts for a currency.
    """
    total = ba_crud.get_total_balance(db, tenant_id=current_user.tenant_id, currency=currency)
    return {
        "currency": currency,
        "total_balance": total,
    }


@router.get("/{account_id}", response_model=BankAccount)
def get_bank_account(
    *,
    db: Session = Depends(deps.get_db_session),
    account_id: UUID,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get bank account by ID.
    """
    account = ba_crud.get(db, account_id=account_id)
    if not account:
        raise HTTPException(status_code=404, detail="Bank account not found")
    if account.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=403, detail="Not authorized to access this bank account")
    return account


@router.put("/{account_id}", response_model=BankAccount)
def update_bank_account(
    *,
    db: Session = Depends(deps.get_db_session),
    account_id: UUID,
    account_in: BankAccountUpdate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Update a bank account.
    """
    account = ba_crud.get(db, account_id=account_id)
    if not account:
        raise HTTPException(status_code=404, detail="Bank account not found")
    if account.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this bank account")

    account = ba_crud.update(db, db_obj=account, obj_in=account_in)
    return account


@router.delete("/{account_id}", status_code=204)
def delete_bank_account(
    *,
    db: Session = Depends(deps.get_db_session),
    account_id: UUID,
    current_user: User = Depends(deps.get_current_user),
) -> None:
    """
    Delete a bank account.
    """
    account = ba_crud.get(db, account_id=account_id)
    if not account:
        raise HTTPException(status_code=404, detail="Bank account not found")
    if account.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this bank account")

    success = ba_crud.delete(db, account_id=account_id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete bank account")
