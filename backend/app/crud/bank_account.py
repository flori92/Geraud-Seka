"""CRUD operations for Bank Accounts."""
from typing import List, Optional
from uuid import UUID
from decimal import Decimal

from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.models.treasury import BankAccount
from app.schemas.treasury import BankAccountCreate, BankAccountUpdate


def get(db: Session, account_id: UUID) -> Optional[BankAccount]:
    """Get a bank account by ID."""
    return db.query(BankAccount).filter(BankAccount.id == account_id).first()


def get_by_account_number(db: Session, account_number: str, tenant_id: UUID) -> Optional[BankAccount]:
    """Get a bank account by account number within a tenant."""
    return db.query(BankAccount).filter(
        and_(BankAccount.account_number == account_number, BankAccount.tenant_id == tenant_id)
    ).first()


def get_multi(
    db: Session,
    *,
    tenant_id: UUID,
    skip: int = 0,
    limit: int = 100,
    is_active: Optional[bool] = None,
    account_type: Optional[str] = None,
) -> List[BankAccount]:
    """Get multiple bank accounts with optional filters."""
    query = db.query(BankAccount).filter(BankAccount.tenant_id == tenant_id)

    if is_active is not None:
        query = query.filter(BankAccount.is_active == is_active)
    if account_type:
        query = query.filter(BankAccount.account_type == account_type)

    return query.order_by(BankAccount.is_default.desc(), BankAccount.name).offset(skip).limit(limit).all()


def get_default(db: Session, tenant_id: UUID) -> Optional[BankAccount]:
    """Get the default bank account for a tenant."""
    return db.query(BankAccount).filter(
        and_(BankAccount.tenant_id == tenant_id, BankAccount.is_default == True, BankAccount.is_active == True)
    ).first()


def create(
    db: Session,
    *,
    obj_in: BankAccountCreate,
    tenant_id: UUID,
) -> BankAccount:
    """Create a new bank account."""
    if obj_in.is_default:
        db.query(BankAccount).filter(
            and_(BankAccount.tenant_id == tenant_id, BankAccount.is_default == True)
        ).update({"is_default": False})

    db_account = BankAccount(
        **obj_in.model_dump(),
        tenant_id=tenant_id,
        balance=obj_in.initial_balance,
    )

    db.add(db_account)
    db.commit()
    db.refresh(db_account)
    return db_account


def update(db: Session, *, db_obj: BankAccount, obj_in: BankAccountUpdate) -> BankAccount:
    """Update a bank account."""
    update_data = obj_in.model_dump(exclude_unset=True)

    if update_data.get("is_default") is True:
        db.query(BankAccount).filter(
            and_(BankAccount.tenant_id == db_obj.tenant_id, BankAccount.is_default == True, BankAccount.id != db_obj.id)
        ).update({"is_default": False})

    for field, value in update_data.items():
        setattr(db_obj, field, value)

    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def delete(db: Session, *, account_id: UUID) -> bool:
    """Delete a bank account."""
    account = db.query(BankAccount).filter(BankAccount.id == account_id).first()
    if account:
        db.delete(account)
        db.commit()
        return True
    return False


def update_balance(db: Session, *, account_id: UUID, amount: Decimal) -> Optional[BankAccount]:
    """Update the balance of a bank account."""
    account = get(db, account_id)
    if account:
        account.balance += amount
        db.add(account)
        db.commit()
        db.refresh(account)
    return account


def get_total_balance(db: Session, *, tenant_id: UUID, currency: str = "XOF") -> Decimal:
    """Get total balance across all active accounts for a tenant."""
    result = db.query(BankAccount).filter(
        and_(
            BankAccount.tenant_id == tenant_id,
            BankAccount.is_active == True,
            BankAccount.currency == currency
        )
    ).all()

    total = sum(account.balance for account in result)
    return Decimal(str(total))
