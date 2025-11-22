"""CRUD operations for Bank Transactions."""
from typing import List, Optional
from uuid import UUID
from decimal import Decimal
from datetime import date

from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc

from app.models.treasury import BankTransaction, BankAccount
from app.schemas.treasury import BankTransactionCreate, BankTransactionUpdate


def get(db: Session, transaction_id: UUID) -> Optional[BankTransaction]:
    """Get a bank transaction by ID."""
    return db.query(BankTransaction).filter(BankTransaction.id == transaction_id).first()


def get_by_reference(db: Session, reference: str, tenant_id: UUID) -> Optional[BankTransaction]:
    """Get a bank transaction by reference within a tenant."""
    return db.query(BankTransaction).filter(
        and_(BankTransaction.reference == reference, BankTransaction.tenant_id == tenant_id)
    ).first()


def get_multi(
    db: Session,
    *,
    tenant_id: UUID,
    skip: int = 0,
    limit: int = 100,
    bank_account_id: Optional[UUID] = None,
    transaction_type: Optional[str] = None,
    status: Optional[str] = None,
    is_reconciled: Optional[bool] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    category: Optional[str] = None,
) -> List[BankTransaction]:
    """Get multiple bank transactions with optional filters."""
    query = db.query(BankTransaction).filter(BankTransaction.tenant_id == tenant_id)

    if bank_account_id:
        query = query.filter(BankTransaction.bank_account_id == bank_account_id)
    if transaction_type:
        query = query.filter(BankTransaction.transaction_type == transaction_type)
    if status:
        query = query.filter(BankTransaction.status == status)
    if is_reconciled is not None:
        query = query.filter(BankTransaction.is_reconciled == is_reconciled)
    if start_date:
        query = query.filter(BankTransaction.transaction_date >= start_date)
    if end_date:
        query = query.filter(BankTransaction.transaction_date <= end_date)
    if category:
        query = query.filter(BankTransaction.category == category)

    return query.order_by(desc(BankTransaction.transaction_date), desc(BankTransaction.created_at)).offset(skip).limit(limit).all()


def create(
    db: Session,
    *,
    obj_in: BankTransactionCreate,
    tenant_id: UUID,
) -> BankTransaction:
    """Create a new bank transaction and update account balance."""
    from app.crud import bank_account as ba_crud

    # Get the bank account
    bank_account = ba_crud.get(db, obj_in.bank_account_id)
    if not bank_account:
        raise ValueError(f"Bank account {obj_in.bank_account_id} not found")

    # Calculate balance after transaction
    balance_after = bank_account.balance + obj_in.amount

    db_transaction = BankTransaction(
        **obj_in.model_dump(),
        tenant_id=tenant_id,
        balance_after=balance_after,
    )

    db.add(db_transaction)

    # Update account balance if transaction is cleared
    if obj_in.status == "cleared":
        ba_crud.update_balance(db, account_id=obj_in.bank_account_id, amount=obj_in.amount)

    db.commit()
    db.refresh(db_transaction)
    return db_transaction


def update(db: Session, *, db_obj: BankTransaction, obj_in: BankTransactionUpdate) -> BankTransaction:
    """Update a bank transaction."""
    from app.crud import bank_account as ba_crud

    update_data = obj_in.model_dump(exclude_unset=True)

    # If amount changed and transaction is cleared, adjust account balance
    old_amount = db_obj.amount
    old_status = db_obj.status
    new_amount = update_data.get("amount", old_amount)
    new_status = update_data.get("status", old_status)

    # Handle status changes
    if old_status != "cleared" and new_status == "cleared":
        # Transaction is being cleared, update balance
        ba_crud.update_balance(db, account_id=db_obj.bank_account_id, amount=new_amount)
    elif old_status == "cleared" and new_status != "cleared":
        # Transaction is being uncleared, reverse balance update
        ba_crud.update_balance(db, account_id=db_obj.bank_account_id, amount=-old_amount)
    elif old_status == "cleared" and new_status == "cleared" and old_amount != new_amount:
        # Amount changed on cleared transaction
        difference = new_amount - old_amount
        ba_crud.update_balance(db, account_id=db_obj.bank_account_id, amount=difference)

    # Recalculate balance_after if amount changed
    if "amount" in update_data:
        bank_account = ba_crud.get(db, db_obj.bank_account_id)
        db_obj.balance_after = bank_account.balance

    for field, value in update_data.items():
        setattr(db_obj, field, value)

    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def delete(db: Session, *, transaction_id: UUID) -> bool:
    """Delete a bank transaction."""
    from app.crud import bank_account as ba_crud

    transaction = db.query(BankTransaction).filter(BankTransaction.id == transaction_id).first()
    if transaction:
        # If transaction was cleared, reverse the balance update
        if transaction.status == "cleared":
            ba_crud.update_balance(db, account_id=transaction.bank_account_id, amount=-transaction.amount)

        db.delete(transaction)
        db.commit()
        return True
    return False


def mark_as_reconciled(
    db: Session,
    *,
    transaction_id: UUID,
    reconciliation_date: Optional[date] = None,
    bank_statement_line: Optional[str] = None,
) -> Optional[BankTransaction]:
    """Mark a transaction as reconciled."""
    transaction = get(db, transaction_id)
    if transaction:
        transaction.is_reconciled = True
        transaction.reconciliation_date = reconciliation_date or date.today()
        if bank_statement_line:
            transaction.bank_statement_line = bank_statement_line
        db.add(transaction)
        db.commit()
        db.refresh(transaction)
    return transaction


def unreconcile(db: Session, *, transaction_id: UUID) -> Optional[BankTransaction]:
    """Unreconcile a transaction."""
    transaction = get(db, transaction_id)
    if transaction:
        transaction.is_reconciled = False
        transaction.reconciliation_date = None
        transaction.bank_statement_line = None
        db.add(transaction)
        db.commit()
        db.refresh(transaction)
    return transaction


def get_unreconciled(db: Session, *, tenant_id: UUID, bank_account_id: Optional[UUID] = None) -> List[BankTransaction]:
    """Get all unreconciled transactions for a tenant."""
    query = db.query(BankTransaction).filter(
        and_(BankTransaction.tenant_id == tenant_id, BankTransaction.is_reconciled == False)
    )

    if bank_account_id:
        query = query.filter(BankTransaction.bank_account_id == bank_account_id)

    return query.order_by(BankTransaction.transaction_date).all()


def get_by_category(db: Session, *, tenant_id: UUID, category: str, start_date: date, end_date: date) -> List[BankTransaction]:
    """Get transactions by category within a date range."""
    return db.query(BankTransaction).filter(
        and_(
            BankTransaction.tenant_id == tenant_id,
            BankTransaction.category == category,
            BankTransaction.transaction_date >= start_date,
            BankTransaction.transaction_date <= end_date
        )
    ).order_by(BankTransaction.transaction_date).all()


def get_total_by_type(
    db: Session,
    *,
    tenant_id: UUID,
    transaction_type: str,
    start_date: date,
    end_date: date,
    bank_account_id: Optional[UUID] = None,
) -> Decimal:
    """Get total amount by transaction type within a date range."""
    query = db.query(BankTransaction).filter(
        and_(
            BankTransaction.tenant_id == tenant_id,
            BankTransaction.transaction_type == transaction_type,
            BankTransaction.status == "cleared",
            BankTransaction.transaction_date >= start_date,
            BankTransaction.transaction_date <= end_date
        )
    )

    if bank_account_id:
        query = query.filter(BankTransaction.bank_account_id == bank_account_id)

    result = query.all()
    total = sum(t.amount for t in result)
    return Decimal(str(total))



def get_by_date_range(
    db: Session,
    *,
    tenant_id: UUID,
    start_date: date,
    end_date: date,
    bank_account_id: Optional[UUID] = None,
) -> List[BankTransaction]:
    """Get transactions within a date range."""
    query = db.query(BankTransaction).filter(
        and_(
            BankTransaction.tenant_id == tenant_id,
            BankTransaction.transaction_date >= start_date,
            BankTransaction.transaction_date <= end_date
        )
    )

    if bank_account_id:
        query = query.filter(BankTransaction.bank_account_id == bank_account_id)

    return query.order_by(BankTransaction.transaction_date).all()


def bulk_reconcile(
    db: Session,
    *,
    transaction_ids: List[UUID],
    reconciliation_date: Optional[date] = None,
    bank_statement_lines: Optional[dict] = None,
) -> List[BankTransaction]:
    """Bulk reconcile multiple transactions."""
    reconciled_transactions = []
    rec_date = reconciliation_date or date.today()

    for transaction_id in transaction_ids:
        transaction = get(db, transaction_id)
        if transaction:
            transaction.is_reconciled = True
            transaction.reconciliation_date = rec_date
            if bank_statement_lines and str(transaction_id) in bank_statement_lines:
                transaction.bank_statement_line = bank_statement_lines[str(transaction_id)]
            db.add(transaction)
            reconciled_transactions.append(transaction)

    db.commit()
    for transaction in reconciled_transactions:
        db.refresh(transaction)

    return reconciled_transactions


def update_balance_after(db: Session, *, transaction: BankTransaction) -> BankTransaction:
    """Recalculate and update the balance_after field for a transaction."""
    from app.crud import bank_account as ba_crud

    bank_account = ba_crud.get(db, transaction.bank_account_id)
    if bank_account:
        transaction.balance_after = bank_account.balance
        db.add(transaction)
        db.commit()
        db.refresh(transaction)

    return transaction


def get_recent(
    db: Session,
    *,
    tenant_id: UUID,
    limit: int = 10,
    bank_account_id: Optional[UUID] = None,
) -> List[BankTransaction]:
    """Get the most recent transactions."""
    query = db.query(BankTransaction).filter(BankTransaction.tenant_id == tenant_id)

    if bank_account_id:
        query = query.filter(BankTransaction.bank_account_id == bank_account_id)

    return query.order_by(desc(BankTransaction.transaction_date), desc(BankTransaction.created_at)).limit(limit).all()


def get_count(
    db: Session,
    *,
    tenant_id: UUID,
    bank_account_id: Optional[UUID] = None,
    status: Optional[str] = None,
    is_reconciled: Optional[bool] = None,
) -> int:
    """Get count of transactions with optional filters."""
    query = db.query(BankTransaction).filter(BankTransaction.tenant_id == tenant_id)

    if bank_account_id:
        query = query.filter(BankTransaction.bank_account_id == bank_account_id)
    if status:
        query = query.filter(BankTransaction.status == status)
    if is_reconciled is not None:
        query = query.filter(BankTransaction.is_reconciled == is_reconciled)

    return query.count()
