"""
Accounting API Routes
Provides endpoints for accounting operations: ledger, journal, balance sheet
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.core.deps import get_current_user

router = APIRouter()


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


@router.get("/ledger/")
def get_ledger_accounts(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all ledger accounts (chart of accounts)
    Returns the complete chart of accounts with balances
    """
    # TODO: Replace with actual database query
    # For now, return mock data
    return MOCK_LEDGER_ACCOUNTS


@router.get("/journal/")
def get_journal_entries(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get journal entries
    Returns chronological list of accounting entries
    """
    # TODO: Implement actual journal entries from database
    return []


@router.get("/balance/")
def get_balance_sheet(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get balance sheet
    Returns assets, liabilities, and equity
    """
    # Calculate totals from mock data
    assets = sum(acc["balance"] for acc in MOCK_LEDGER_ACCOUNTS if acc["account_type"] == "asset")
    liabilities = abs(sum(acc["balance"] for acc in MOCK_LEDGER_ACCOUNTS if acc["account_type"] == "liability"))
    equity = abs(sum(acc["balance"] for acc in MOCK_LEDGER_ACCOUNTS if acc["account_type"] == "equity"))

    return {
        "assets": {
            "current_assets": assets * 0.6,
            "fixed_assets": assets * 0.4,
            "total_assets": assets
        },
        "liabilities": {
            "current_liabilities": liabilities * 0.7,
            "long_term_liabilities": liabilities * 0.3,
            "total_liabilities": liabilities
        },
        "equity": {
            "share_capital": equity,
            "retained_earnings": assets - liabilities - equity,
            "total_equity": equity + (assets - liabilities - equity)
        },
        "period": "2025-11"
    }
