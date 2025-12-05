"""
Accounting API Routes
Provides endpoints for accounting operations: ledger, journal, balance sheet
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from pydantic import BaseModel
from datetime import date, datetime
from decimal import Decimal

from app.db.session import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.ledger_account import LedgerAccount, AccountType
from app.models.accounting_advanced import JournalEntry

router = APIRouter()


# Pydantic schemas
class LedgerAccountCreate(BaseModel):
    account_code: str
    account_name: str
    account_type: str
    currency: str = "XOF"
    initial_balance: float = 0


class LedgerAccountResponse(BaseModel):
    id: str
    account_code: str
    account_name: str
    account_type: str
    balance: float
    currency: str
    
    class Config:
        from_attributes = True


class JournalEntryCreate(BaseModel):
    date: str
    description: str
    debit_account: str  # account_code
    credit_account: str  # account_code
    amount: float
    reference: str | None = None


class JournalEntryResponse(BaseModel):
    id: str
    entry_number: str
    date: str
    description: str
    debit_account: str
    credit_account: str
    amount: float
    reference: str | None
    created_at: str
    
    class Config:
        from_attributes = True


# Mock data for ledger accounts (will be replaced with real DB queries)
MOCK_LEDGER_ACCOUNTS = [
    {
        "id": "1",
        "account_code": "101000",
        "account_name": "Capital social",
        "account_type": "equity",
        "balance": 50000000,
        "currency": "FCFA"
    },
    {
        "id": "2",
        "account_code": "401000",
        "account_name": "Fournisseurs",
        "account_type": "liability",
        "balance": -15000000,
        "currency": "FCFA"
    },
    {
        "id": "3",
        "account_code": "411000",
        "account_name": "Clients",
        "account_type": "asset",
        "balance": 25000000,
        "currency": "FCFA"
    },
    {
        "id": "4",
        "account_code": "445100",
        "account_name": "TVA collectée",
        "account_type": "liability",
        "balance": -2500000,
        "currency": "FCFA"
    },
    {
        "id": "5",
        "account_code": "445660",
        "account_name": "TVA déductible",
        "account_type": "asset",
        "balance": 1800000,
        "currency": "FCFA"
    },
    {
        "id": "6",
        "account_code": "512000",
        "account_name": "Banque",
        "account_type": "asset",
        "balance": 35000000,
        "currency": "FCFA"
    },
    {
        "id": "7",
        "account_code": "530000",
        "account_name": "Caisse",
        "account_type": "asset",
        "balance": 5000000,
        "currency": "FCFA"
    },
    {
        "id": "8",
        "account_code": "601000",
        "account_name": "Achats de marchandises",
        "account_type": "expense",
        "balance": 45000000,
        "currency": "FCFA"
    },
    {
        "id": "9",
        "account_name": "Achats de fournitures",
        "account_code": "605000",
        "account_type": "expense",
        "balance": 3500000,
        "currency": "FCFA"
    },
    {
        "id": "10",
        "account_code": "621000",
        "account_name": "Personnel extérieur",
        "account_type": "expense",
        "balance": 8000000,
        "currency": "FCFA"
    },
    {
        "id": "11",
        "account_code": "622000",
        "account_name": "Rémunérations du personnel",
        "account_type": "expense",
        "balance": 18000000,
        "currency": "FCFA"
    },
    {
        "id": "12",
        "account_code": "625000",
        "account_name": "Déplacements, missions",
        "account_type": "expense",
        "balance": 4500000,
        "currency": "FCFA"
    },
    {
        "id": "13",
        "account_code": "626000",
        "account_name": "Frais postaux et télécommunications",
        "account_type": "expense",
        "balance": 1200000,
        "currency": "FCFA"
    },
    {
        "id": "14",
        "account_code": "631000",
        "account_name": "Impôts et taxes",
        "account_type": "expense",
        "balance": 6500000,
        "currency": "FCFA"
    },
    {
        "id": "15",
        "account_code": "701000",
        "account_name": "Ventes de marchandises",
        "account_type": "revenue",
        "balance": -125000000,
        "currency": "FCFA"
    },
    {
        "id": "16",
        "account_code": "706000",
        "account_name": "Prestations de services",
        "account_type": "revenue",
        "balance": -45000000,
        "currency": "FCFA"
    },
    {
        "id": "17",
        "account_code": "213000",
        "account_name": "Constructions",
        "account_type": "asset",
        "balance": 75000000,
        "currency": "FCFA"
    },
    {
        "id": "18",
        "account_code": "218000",
        "account_name": "Matériel de bureau et informatique",
        "account_type": "asset",
        "balance": 12000000,
        "currency": "FCFA"
    },
    {
        "id": "19",
        "account_code": "164000",
        "account_name": "Emprunts bancaires",
        "account_type": "liability",
        "balance": -30000000,
        "currency": "FCFA"
    },
    {
        "id": "20",
        "account_code": "658000",
        "account_name": "Charges diverses",
        "account_type": "expense",
        "balance": 2800000,
        "currency": "FCFA"
    }
]


@router.get("/ledger/", response_model=List[LedgerAccountResponse])
def get_ledger_accounts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all ledger accounts (chart of accounts)
    Returns the complete chart of accounts with balances
    """
    accounts = db.query(LedgerAccount).filter(
        LedgerAccount.tenant_id == current_user.tenant_id,
        LedgerAccount.is_active == True
    ).order_by(LedgerAccount.account_code).all()
    
    return [
        LedgerAccountResponse(
            id=str(acc.id),
            account_code=acc.account_code,
            account_name=acc.account_name,
            account_type=acc.account_type.value,
            balance=float(acc.balance),
            currency=acc.currency
        )
        for acc in accounts
    ]


@router.post("/ledger/", response_model=LedgerAccountResponse)
def create_ledger_account(
    account: LedgerAccountCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new ledger account
    """
    # Vérifier si le code compte existe déjà
    existing = db.query(LedgerAccount).filter(
        LedgerAccount.tenant_id == current_user.tenant_id,
        LedgerAccount.account_code == account.account_code
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Ce code de compte existe déjà")
    
    # Créer le nouveau compte
    new_account = LedgerAccount(
        tenant_id=current_user.tenant_id,
        account_code=account.account_code,
        account_name=account.account_name,
        account_type=AccountType(account.account_type),
        balance=Decimal(str(account.initial_balance)),
        currency=account.currency
    )
    
    db.add(new_account)
    db.commit()
    db.refresh(new_account)
    
    return LedgerAccountResponse(
        id=str(new_account.id),
        account_code=new_account.account_code,
        account_name=new_account.account_name,
        account_type=new_account.account_type.value,
        balance=float(new_account.balance),
        currency=new_account.currency
    )


@router.get("/journal/", response_model=List[JournalEntryResponse])
def get_journal_entries(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get journal entries
    Returns chronological list of accounting entries
    """
    entries = db.query(JournalEntry).filter(
        JournalEntry.tenant_id == current_user.tenant_id
    ).order_by(JournalEntry.date.desc(), JournalEntry.created_at.desc()).all()
    
    return [
        JournalEntryResponse(
            id=str(entry.id),
            entry_number=entry.entry_number,
            date=entry.date.isoformat(),
            description=entry.description,
            debit_account=entry.debit_account.account_code,
            credit_account=entry.credit_account.account_code,
            amount=float(entry.amount),
            reference=entry.reference,
            created_at=entry.created_at.isoformat()
        )
        for entry in entries
    ]


@router.post("/journal/", response_model=JournalEntryResponse)
def create_journal_entry(
    entry: JournalEntryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new journal entry and update account balances
    """
    # Trouver les comptes par code
    debit_account = db.query(LedgerAccount).filter(
        LedgerAccount.tenant_id == current_user.tenant_id,
        LedgerAccount.account_code == entry.debit_account
    ).first()
    
    credit_account = db.query(LedgerAccount).filter(
        LedgerAccount.tenant_id == current_user.tenant_id,
        LedgerAccount.account_code == entry.credit_account
    ).first()
    
    if not debit_account:
        raise HTTPException(status_code=404, detail=f"Compte débit {entry.debit_account} introuvable")
    if not credit_account:
        raise HTTPException(status_code=404, detail=f"Compte crédit {entry.credit_account} introuvable")
    
    # Générer numéro d'écriture
    count = db.query(func.count(JournalEntry.id)).filter(
        JournalEntry.tenant_id == current_user.tenant_id
    ).scalar()
    entry_number = f"JE-{count + 1:06d}"
    
    # Créer l'écriture
    new_entry = JournalEntry(
        tenant_id=current_user.tenant_id,
        debit_account_id=debit_account.id,
        credit_account_id=credit_account.id,
        entry_number=entry_number,
        date=datetime.fromisoformat(entry.date).date(),
        description=entry.description,
        amount=Decimal(str(entry.amount)),
        reference=entry.reference
    )
    
    # Mettre à jour les balances
    amount_decimal = Decimal(str(entry.amount))
    debit_account.balance += amount_decimal
    credit_account.balance -= amount_decimal
    
    db.add(new_entry)
    db.commit()
    db.refresh(new_entry)
    
    return JournalEntryResponse(
        id=str(new_entry.id),
        entry_number=new_entry.entry_number,
        date=new_entry.date.isoformat(),
        description=new_entry.description,
        debit_account=entry.debit_account,
        credit_account=entry.credit_account,
        amount=float(new_entry.amount),
        reference=new_entry.reference,
        created_at=new_entry.created_at.isoformat()
    )


@router.get("/balance/")
def get_balance_sheet(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get balance sheet
    Returns assets, liabilities, and equity
    """
    try:
        # Vérifier que l'utilisateur a un tenant_id
        if not current_user.tenant_id:
            raise HTTPException(status_code=400, detail="Utilisateur sans tenant_id")
        
        # Calculer les totaux depuis la DB
        accounts = db.query(LedgerAccount).filter(
            LedgerAccount.tenant_id == current_user.tenant_id,
            LedgerAccount.is_active == True
        ).all()
        
        # Si aucun compte, retourner des valeurs à zéro
        if not accounts:
            return {
                "assets": {
                    "current_assets": 0,
                    "fixed_assets": 0,
                    "total_assets": 0
                },
                "liabilities": {
                    "current_liabilities": 0,
                    "long_term_liabilities": 0,
                    "total_liabilities": 0
                },
                "equity": {
                    "share_capital": 0,
                    "retained_earnings": 0,
                    "total_equity": 0
                },
                "period": datetime.now().strftime("%Y-%m")
            }
        
        assets = sum(float(acc.balance) for acc in accounts if acc.account_type == AccountType.ASSET)
        liabilities = abs(sum(float(acc.balance) for acc in accounts if acc.account_type == AccountType.LIABILITY))
        equity = abs(sum(float(acc.balance) for acc in accounts if acc.account_type == AccountType.EQUITY))

        return {
            "assets": {
                "current_assets": round(assets * 0.6, 2),
                "fixed_assets": round(assets * 0.4, 2),
                "total_assets": round(assets, 2)
            },
            "liabilities": {
                "current_liabilities": round(liabilities * 0.7, 2),
                "long_term_liabilities": round(liabilities * 0.3, 2),
                "total_liabilities": round(liabilities, 2)
            },
            "equity": {
                "share_capital": round(equity, 2),
                "retained_earnings": round(assets - liabilities - equity, 2),
                "total_equity": round(equity + (assets - liabilities - equity), 2)
            },
            "period": datetime.now().strftime("%Y-%m")
        }
    except Exception as e:
        # Log l'erreur et retourner des valeurs par défaut
        print(f"Error in get_balance_sheet: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur lors du calcul de la balance: {str(e)}")
