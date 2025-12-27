"""API routes for Bank Transaction management (Transactions Bancaires)."""
from typing import List, Any, Optional
from uuid import UUID
from datetime import date
from decimal import Decimal
from hashlib import sha1

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core import deps
from app.models.user import User
from app.schemas.treasury import (
    BankTransaction,
    BankTransactionCreate,
    BankTransactionUpdate,
    BankTransactionWithAccount,
    MobileMoneySyncRequest,
    MobileMoneySyncResult,
)
from app.crud import bank_transaction as bt_crud
from app.crud import bank_account as ba_crud
from app.services.reconciliation import ReconciliationService
from app.core.config import get_settings

router = APIRouter()


@router.get("/", response_model=List[BankTransaction])
def list_transactions(
    db: Session = Depends(deps.get_db_session),
    skip: int = 0,
    limit: int = 100,
    bank_account_id: Optional[UUID] = Query(None, description="Filter by bank account"),
    transaction_type: Optional[str] = Query(None, description="Filter by transaction type"),
    status: Optional[str] = Query(None, description="Filter by status"),
    is_reconciled: Optional[bool] = Query(None, description="Filter by reconciliation status"),
    start_date: Optional[date] = Query(None, description="Start date"),
    end_date: Optional[date] = Query(None, description="End date"),
    category: Optional[str] = Query(None, description="Filter by category"),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Retrieve bank transactions for the current tenant.
    """
    transactions = bt_crud.get_multi(
        db,
        tenant_id=current_user.tenant_id,
        skip=skip,
        limit=limit,
        bank_account_id=bank_account_id,
        transaction_type=transaction_type,
        status=status,
        is_reconciled=is_reconciled,
        start_date=start_date,
        end_date=end_date,
        category=category,
    )
    return transactions


@router.post("/", response_model=BankTransaction, status_code=201)
def create_transaction(
    *,
    db: Session = Depends(deps.get_db_session),
    transaction_in: BankTransactionCreate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Create new bank transaction.
    """
    try:
        transaction = bt_crud.create(
            db,
            obj_in=transaction_in,
            tenant_id=current_user.tenant_id,
        )
        return transaction
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/unreconciled", response_model=List[BankTransaction])
def get_unreconciled_transactions(
    db: Session = Depends(deps.get_db_session),
    bank_account_id: Optional[UUID] = Query(None, description="Filter by bank account"),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get all unreconciled transactions.
    """
    transactions = bt_crud.get_unreconciled(
        db,
        tenant_id=current_user.tenant_id,
        bank_account_id=bank_account_id,
    )
    return transactions


@router.get("/{transaction_id}", response_model=BankTransaction)
def get_transaction(
    *,
    db: Session = Depends(deps.get_db_session),
    transaction_id: UUID,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get bank transaction by ID.
    """
    transaction = bt_crud.get(db, transaction_id=transaction_id)
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    if transaction.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=403, detail="Not authorized to access this transaction")
    return transaction


@router.put("/{transaction_id}", response_model=BankTransaction)
def update_transaction(
    *,
    db: Session = Depends(deps.get_db_session),
    transaction_id: UUID,
    transaction_in: BankTransactionUpdate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Update a bank transaction.
    """
    transaction = bt_crud.get(db, transaction_id=transaction_id)
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    if transaction.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this transaction")

    transaction = bt_crud.update(db, db_obj=transaction, obj_in=transaction_in)
    return transaction


@router.delete("/{transaction_id}", status_code=204)
def delete_transaction(
    *,
    db: Session = Depends(deps.get_db_session),
    transaction_id: UUID,
    current_user: User = Depends(deps.get_current_user),
) -> None:
    """
    Delete a bank transaction.
    """
    transaction = bt_crud.get(db, transaction_id=transaction_id)
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    if transaction.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this transaction")

    success = bt_crud.delete(db, transaction_id=transaction_id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete transaction")


class ReconcileRequest(BaseModel):
    """Request body for reconciling a transaction."""
    bank_statement_line: Optional[str] = None


@router.post("/import/csv", response_model=MobileMoneySyncResult)
def import_bank_statement_csv(
    *,
    db: Session = Depends(deps.get_db_session),
    bank_account_id: UUID = Query(..., description="Target bank account"),
    file: UploadFile = File(...),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    account = ba_crud.get(db, account_id=bank_account_id)
    if not account or account.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=404, detail="Bank account not found")

    content = file.file.read()
    service = ReconciliationService(db)
    lines = service.parse_bank_statement(content, format="csv")

    created = 0
    duplicates = 0
    errors = 0

    for line in lines:
        try:
            amount = Decimal(str(line.amount))
            description = line.description
            reference = line.reference
            if not reference:
                base = f"{line.transaction_date.isoformat()}|{amount}|{description}"
                reference = sha1(base.encode("utf-8")).hexdigest()[:24]

            existing = bt_crud.get_by_reference(db, reference=reference, tenant_id=current_user.tenant_id)
            if existing:
                duplicates += 1
                continue

            transaction_type = "deposit" if amount >= 0 else "withdrawal"

            tx_in = BankTransactionCreate(
                bank_account_id=bank_account_id,
                transaction_date=line.transaction_date,
                value_date=None,
                transaction_type=transaction_type,
                amount=amount,
                currency=account.currency,
                description=description,
                reference=reference,
                check_number=None,
                counterparty=None,
                counterparty_account=None,
                category=None,
                notes=None,
                sales_invoice_id=None,
                purchase_order_id=None,
                status="cleared",
            )
            bt_crud.create(db, obj_in=tx_in, tenant_id=current_user.tenant_id)
            created += 1
        except Exception:
            errors += 1
            continue

    return {
        "total": len(lines),
        "created": created,
        "duplicates": duplicates,
        "errors": errors,
    }


@router.post("/mobile-money/sync", response_model=MobileMoneySyncResult)
async def sync_mobile_money(
    *,
    db: Session = Depends(deps.get_db_session),
    data: MobileMoneySyncRequest,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    account = ba_crud.get(db, account_id=data.bank_account_id)
    if not account or account.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=404, detail="Bank account not found")

    settings = get_settings()
    created = 0
    duplicates = 0
    errors = 0

    if not settings.kkiapay_private_key:
        mock = [
            {
                "date": date.today().isoformat(),
                "description": "Mobile Money - Encaissement client",
                "amount": Decimal("150000"),
                "reference": f"MM_{data.bank_account_id.hex[:8]}_{date.today().strftime('%Y%m%d')}_001",
            },
            {
                "date": date.today().isoformat(),
                "description": "Mobile Money - Paiement fournisseur",
                "amount": Decimal("-45000"),
                "reference": f"MM_{data.bank_account_id.hex[:8]}_{date.today().strftime('%Y%m%d')}_002",
            },
        ]
    else:
        mock = []

    for item in mock:
        try:
            reference = item.get("reference")
            if not reference:
                continue
            existing = bt_crud.get_by_reference(db, reference=reference, tenant_id=current_user.tenant_id)
            if existing:
                duplicates += 1
                continue

            amount = Decimal(str(item.get("amount")))
            tx_type = "deposit" if amount >= 0 else "withdrawal"
            tx_in = BankTransactionCreate(
                bank_account_id=data.bank_account_id,
                transaction_date=date.fromisoformat(item.get("date")),
                value_date=None,
                transaction_type=tx_type,
                amount=amount,
                currency=account.currency,
                description=item.get("description"),
                reference=reference,
                check_number=None,
                counterparty=None,
                counterparty_account=None,
                category=None,
                notes=None,
                sales_invoice_id=None,
                purchase_order_id=None,
                status="cleared",
            )
            bt_crud.create(db, obj_in=tx_in, tenant_id=current_user.tenant_id)
            created += 1
        except Exception:
            errors += 1

    return {
        "total": len(mock),
        "created": created,
        "duplicates": duplicates,
        "errors": errors,
    }


@router.post("/{transaction_id}/reconcile", response_model=BankTransaction)
def reconcile_transaction(
    *,
    db: Session = Depends(deps.get_db_session),
    transaction_id: UUID,
    reconcile_data: ReconcileRequest,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Mark transaction as reconciled.
    """
    transaction = bt_crud.get(db, transaction_id=transaction_id)
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    if transaction.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=403, detail="Not authorized to reconcile this transaction")

    transaction = bt_crud.mark_as_reconciled(
        db,
        transaction_id=transaction_id,
        bank_statement_line=reconcile_data.bank_statement_line,
    )
    return transaction


@router.post("/{transaction_id}/unreconcile", response_model=BankTransaction)
def unreconcile_transaction(
    *,
    db: Session = Depends(deps.get_db_session),
    transaction_id: UUID,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Unreconcile a transaction.
    """
    transaction = bt_crud.get(db, transaction_id=transaction_id)
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    if transaction.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=403, detail="Not authorized to unreconcile this transaction")

    transaction = bt_crud.unreconcile(db, transaction_id=transaction_id)
    return transaction
