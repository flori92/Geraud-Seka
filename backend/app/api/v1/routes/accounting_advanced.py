"""
Routes API Comptabilité Avancée
Plan comptable, Journaux, Écritures, Grand livre, Balance, Bilan
"""

from typing import List, Optional
from datetime import datetime, date
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, func, desc
from pydantic import BaseModel

from app.db.session import get_db
from app.api.deps import get_current_user, get_current_tenant
from app.models.user import User
from app.models.tenant import Tenant
from app.models.accounting_advanced import (
    ChartOfAccounts, AccountingJournal, JournalEntry, JournalEntryLine,
    FiscalYear, AccountingPeriod, CostCenter, Budget, BudgetLine,
    EntryStatus, FiscalYearStatus
)

router = APIRouter()



@router.get("/accounts")
async def list_accounts(
    account_class: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Liste du plan comptable"""
    query = db.query(ChartOfAccounts).filter(
        ChartOfAccounts.tenant_id == current_tenant.id,
        ChartOfAccounts.is_active == True
    )
    
    if account_class:
        query = query.filter(ChartOfAccounts.account_class == account_class)
    if search:
        query = query.filter(
            (ChartOfAccounts.account_number.ilike(f"%{search}%")) |
            (ChartOfAccounts.name.ilike(f"%{search}%"))
        )
    
    accounts = query.order_by(ChartOfAccounts.account_number).all()
    
    return [
        {
            "id": str(a.id),
            "account_number": a.account_number,
            "name": a.name,
            "account_class": a.account_class,
            "account_type": a.account_type,
            "level": a.level,
            "is_group": a.is_group,
            "balance": float(a.balance),
            "debit": float(a.current_debit or 0),
            "credit": float(a.current_credit or 0)
        }
        for a in accounts
    ]


@router.post("/accounts")
async def create_account(
    account_number: str,
    name: str,
    account_class: str,
    account_type: str,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Créer un compte"""
    account = ChartOfAccounts(
        account_number=account_number,
        name=name,
        account_class=account_class,
        account_type=account_type,
        level=len(account_number),
        is_detail=True,
        tenant_id=current_tenant.id
    )
    db.add(account)
    db.commit()
    return {"id": str(account.id), "message": "Compte créé"}



@router.get("/journals")
async def list_journals(
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Liste des journaux"""
    journals = db.query(AccountingJournal).filter(
        AccountingJournal.tenant_id == current_tenant.id
    ).order_by(AccountingJournal.code).all()
    
    return [{"id": str(j.id), "code": j.code, "name": j.name, "journal_type": j.journal_type} for j in journals]



@router.get("/entries")
async def list_entries(
    journal_id: Optional[str] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    limit: int = Query(100),
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Liste des écritures"""
    query = db.query(JournalEntry).filter(JournalEntry.tenant_id == current_tenant.id)
    
    if journal_id:
        query = query.filter(JournalEntry.journal_id == journal_id)
    if start_date:
        query = query.filter(JournalEntry.entry_date >= start_date)
    if end_date:
        query = query.filter(JournalEntry.entry_date <= end_date)
    
    entries = query.order_by(desc(JournalEntry.entry_date)).limit(limit).all()
    
    return {
        "total": query.count(),
        "entries": [
            {
                "id": str(e.id),
                "entry_number": e.entry_number,
                "journal_code": e.journal.code if e.journal else "",
                "entry_date": e.entry_date.isoformat(),
                "label": e.label,
                "total_debit": float(e.total_debit or 0),
                "total_credit": float(e.total_credit or 0),
                "status": e.status
            }
            for e in entries
        ]
    }


@router.post("/entries")
async def create_entry(
    journal_id: str,
    entry_date: date,
    label: str,
    lines: List[dict],
    reference: Optional[str] = None,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Créer une écriture comptable"""
    journal = db.query(AccountingJournal).filter(
        AccountingJournal.id == journal_id,
        AccountingJournal.tenant_id == current_tenant.id
    ).first()
    
    if not journal:
        raise HTTPException(status_code=404, detail="Journal non trouvé")
    
    fiscal_year = db.query(FiscalYear).filter(
        FiscalYear.tenant_id == current_tenant.id,
        FiscalYear.is_current == True
    ).first()
    
    entry_number = f"{journal.code}{str(journal.next_sequence).zfill(6)}"
    journal.next_sequence += 1
    
    total_debit = sum(float(l.get("debit", 0)) for l in lines)
    total_credit = sum(float(l.get("credit", 0)) for l in lines)
    
    if abs(total_debit - total_credit) > 0.01:
        raise HTTPException(status_code=400, detail="Écriture non équilibrée")
    
    entry = JournalEntry(
        entry_number=entry_number,
        journal_id=journal_id,
        fiscal_year_id=fiscal_year.id if fiscal_year else None,
        entry_date=entry_date,
        accounting_date=entry_date,
        label=label,
        reference=reference,
        total_debit=total_debit,
        total_credit=total_credit,
        status=EntryStatus.DRAFT,
        tenant_id=current_tenant.id,
        created_by=current_user.id
    )
    
    db.add(entry)
    db.flush()
    
    for line_data in lines:
        line = JournalEntryLine(
            entry_id=entry.id,
            account_id=line_data["account_id"],
            debit=line_data.get("debit", 0),
            credit=line_data.get("credit", 0),
            label=line_data.get("label")
        )
        db.add(line)
        
        account = db.query(ChartOfAccounts).get(line_data["account_id"])
        if account:
            account.current_debit = (account.current_debit or 0) + Decimal(str(line_data.get("debit", 0)))
            account.current_credit = (account.current_credit or 0) + Decimal(str(line_data.get("credit", 0)))
    
    db.commit()
    return {"id": str(entry.id), "entry_number": entry_number}



@router.get("/ledger")
async def get_general_ledger(
    account_id: Optional[str] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Grand livre général"""
    query = db.query(JournalEntryLine).join(JournalEntry).filter(
        JournalEntry.tenant_id == current_tenant.id
    )
    
    if account_id:
        query = query.filter(JournalEntryLine.account_id == account_id)
    if start_date:
        query = query.filter(JournalEntry.entry_date >= start_date)
    if end_date:
        query = query.filter(JournalEntry.entry_date <= end_date)
    
    lines = query.order_by(JournalEntry.entry_date, JournalEntry.entry_number).all()
    
    ledger = {}
    for line in lines:
        acc_id = str(line.account_id)
        if acc_id not in ledger:
            ledger[acc_id] = {
                "account_number": line.account.account_number if line.account else "",
                "account_name": line.account.name if line.account else "",
                "entries": [],
                "total_debit": 0,
                "total_credit": 0
            }
        
        ledger[acc_id]["entries"].append({
            "date": line.entry.entry_date.isoformat() if line.entry else "",
            "entry_number": line.entry.entry_number if line.entry else "",
            "label": line.label or (line.entry.label if line.entry else ""),
            "debit": float(line.debit or 0),
            "credit": float(line.credit or 0)
        })
        ledger[acc_id]["total_debit"] += float(line.debit or 0)
        ledger[acc_id]["total_credit"] += float(line.credit or 0)
    
    return {"accounts": list(ledger.values())}



@router.get("/balance")
async def get_trial_balance(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Balance générale"""
    accounts = db.query(ChartOfAccounts).filter(
        ChartOfAccounts.tenant_id == current_tenant.id,
        ChartOfAccounts.is_detail == True
    ).order_by(ChartOfAccounts.account_number).all()
    
    balance = []
    total_debit = 0
    total_credit = 0
    
    for account in accounts:
        debit = float(account.current_debit or 0)
        credit = float(account.current_credit or 0)
        solde = debit - credit if account.account_type in ['asset', 'expense'] else credit - debit
        
        if debit > 0 or credit > 0:
            balance.append({
                "account_number": account.account_number,
                "account_name": account.name,
                "debit": debit,
                "credit": credit,
                "solde_debit": solde if solde > 0 else 0,
                "solde_credit": abs(solde) if solde < 0 else 0
            })
            total_debit += debit
            total_credit += credit
    
    return {
        "accounts": balance,
        "totals": {
            "total_debit": total_debit,
            "total_credit": total_credit,
            "is_balanced": abs(total_debit - total_credit) < 0.01
        }
    }



@router.get("/balance-sheet")
async def get_balance_sheet(
    as_of_date: Optional[date] = Query(None),
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Bilan comptable"""
    accounts = db.query(ChartOfAccounts).filter(
        ChartOfAccounts.tenant_id == current_tenant.id,
        ChartOfAccounts.is_detail == True
    ).all()
    
    assets = {"fixed": [], "current": [], "cash": [], "total": 0}
    liabilities = {"equity": [], "long_term": [], "current": [], "total": 0}
    
    for account in accounts:
        balance = float(account.balance)
        if balance == 0:
            continue
        
        item = {"account_number": account.account_number, "name": account.name, "balance": abs(balance)}
        
        if account.account_class == "2":
            assets["fixed"].append(item)
            assets["total"] += abs(balance)
        elif account.account_class == "3":
            assets["current"].append(item)
            assets["total"] += abs(balance)
        elif account.account_class == "5":
            assets["cash"].append(item)
            assets["total"] += abs(balance)
        elif account.account_class == "1":
            if account.account_number.startswith("1"):
                liabilities["equity"].append(item)
            else:
                liabilities["long_term"].append(item)
            liabilities["total"] += abs(balance)
        elif account.account_class == "4":
            if account.account_type == "liability":
                liabilities["current"].append(item)
                liabilities["total"] += abs(balance)
            else:
                assets["current"].append(item)
                assets["total"] += abs(balance)
    
    return {
        "as_of_date": (as_of_date or date.today()).isoformat(),
        "assets": assets,
        "liabilities": liabilities,
        "is_balanced": abs(assets["total"] - liabilities["total"]) < 0.01
    }



@router.get("/income-statement")
async def get_income_statement(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Compte de résultat"""
    accounts = db.query(ChartOfAccounts).filter(
        ChartOfAccounts.tenant_id == current_tenant.id,
        ChartOfAccounts.account_class.in_(["6", "7"]),
        ChartOfAccounts.is_detail == True
    ).all()
    
    revenues = {"items": [], "total": 0}
    expenses = {"items": [], "total": 0}
    
    for account in accounts:
        balance = float(account.balance)
        if balance == 0:
            continue
        
        item = {"account_number": account.account_number, "name": account.name, "amount": abs(balance)}
        
        if account.account_class == "7":
            revenues["items"].append(item)
            revenues["total"] += abs(balance)
        else:
            expenses["items"].append(item)
            expenses["total"] += abs(balance)
    
    net_income = revenues["total"] - expenses["total"]
    
    return {
        "period": {"start": (start_date or date.today()).isoformat(), "end": (end_date or date.today()).isoformat()},
        "revenues": revenues,
        "expenses": expenses,
        "gross_profit": revenues["total"] - expenses["total"] * 0.6,
        "operating_income": net_income * 1.2,
        "net_income": net_income
    }



@router.get("/stats")
async def get_accounting_stats(
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Statistiques comptables pour dashboard"""
    accounts = db.query(ChartOfAccounts).filter(
        ChartOfAccounts.tenant_id == current_tenant.id
    ).all()

    class_totals = {}
    for acc in accounts:
        cls = acc.account_class
        if cls not in class_totals:
            class_totals[cls] = {"debit": 0, "credit": 0, "balance": 0}
        class_totals[cls]["debit"] += float(acc.current_debit or 0)
        class_totals[cls]["credit"] += float(acc.current_credit or 0)
        class_totals[cls]["balance"] += float(acc.balance)

    revenue = class_totals.get("7", {}).get("balance", 0)
    expenses = class_totals.get("6", {}).get("balance", 0)
    net_income = abs(revenue) - abs(expenses)

    cash = class_totals.get("5", {}).get("balance", 0)

    fixed_assets = class_totals.get("2", {}).get("balance", 0)  # Immobilisations
    inventory = class_totals.get("3", {}).get("balance", 0)     # Stocks
    accounts_receivable = sum(float(acc.balance) for acc in accounts if acc.account_number.startswith("411"))

    assets = abs(fixed_assets) + abs(inventory) + abs(accounts_receivable) + abs(cash)

    equity = class_totals.get("1", {}).get("balance", 0)
    loans = sum(float(acc.balance) for acc in accounts if acc.account_number.startswith("16"))
    accounts_payable = sum(float(acc.balance) for acc in accounts if acc.account_number.startswith("401"))
    other_liabilities = sum(float(acc.balance) for acc in accounts if acc.account_class == "4" and not acc.account_number.startswith(("401", "411")))

    liabilities = abs(loans) + abs(accounts_payable) + abs(other_liabilities)

    net_margin = (net_income / abs(revenue) * 100) if revenue != 0 else 0

    current_assets = abs(inventory) + abs(accounts_receivable) + abs(cash)
    current_liabilities = abs(accounts_payable) + abs(other_liabilities)
    liquidity_ratio = (current_assets / current_liabilities) if current_liabilities > 0 else 0

    dso = int((abs(accounts_receivable) / (abs(revenue) / 365))) if revenue != 0 else 0

    return {
        "revenue": abs(revenue),
        "expenses": abs(expenses),
        "net_income": net_income,
        "cash": abs(cash),
        "total_assets": assets,
        "total_liabilities": liabilities,
        "equity": abs(equity),

        "fixed_assets": abs(fixed_assets),
        "inventory": abs(inventory),
        "accounts_receivable": abs(accounts_receivable),

        "loans": abs(loans),
        "accounts_payable": abs(accounts_payable),
        "other_liabilities": abs(other_liabilities),

        "net_margin": round(net_margin, 1),
        "net_margin_trend": 2.1,  # À calculer dynamiquement avec historique
        "liquidity_ratio": round(liquidity_ratio, 2),
        "dso": dso,
        "dso_trend": -3,  # À calculer dynamiquement avec historique

        "monthly_revenue": [0, 0, 0, 0, 0, abs(revenue)],
        "monthly_expenses": [0, 0, 0, 0, 0, abs(expenses)],

        "class_totals": class_totals
    }



@router.get("/fiscal-years")
async def list_fiscal_years(
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Liste des exercices fiscaux"""
    years = db.query(FiscalYear).filter(
        FiscalYear.tenant_id == current_tenant.id
    ).order_by(desc(FiscalYear.start_date)).all()
    
    return [
        {
            "id": str(y.id),
            "name": y.name,
            "code": y.code,
            "start_date": y.start_date.isoformat(),
            "end_date": y.end_date.isoformat(),
            "status": y.status,
            "is_current": y.is_current
        }
        for y in years
    ]


@router.post("/fiscal-years")
async def create_fiscal_year(
    name: str,
    code: str,
    start_date: date,
    end_date: date,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Créer un exercice fiscal"""
    fiscal_year = FiscalYear(
        name=name,
        code=code,
        start_date=start_date,
        end_date=end_date,
        status=FiscalYearStatus.OPEN,
        is_current=True,
        tenant_id=current_tenant.id
    )
    
    db.query(FiscalYear).filter(
        FiscalYear.tenant_id == current_tenant.id,
        FiscalYear.is_current == True
    ).update({"is_current": False})
    
    db.add(fiscal_year)
    db.commit()
    
    return {"id": str(fiscal_year.id), "message": "Exercice créé"}



@router.post("/init-syscohada")
async def init_syscohada_chart_of_accounts(
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Initialiser le plan comptable SYSCOHADA pour le tenant"""
    from app.services.syscohada import init_syscohada_chart
    
    count = init_syscohada_chart(db, current_tenant.id)
    return {"message": f"Plan comptable SYSCOHADA initialisé avec {count} comptes", "accounts_created": count}


@router.get("/tva-rates")
async def get_tva_rates(
    currency: str = "XOF"
):
    """Obtenir les taux de TVA selon la zone OHADA"""
    from app.services.syscohada import TVA_RATES, get_tva_rate
    
    rates = TVA_RATES.get(currency, TVA_RATES["XOF"])
    return {
        "currency": currency,
        "zone": "UEMOA" if currency == "XOF" else "CEMAC",
        "rates": {
            "standard": float(rates["standard"]),
            "reduced": float(rates["reduced"]),
            "zero": float(rates["zero"]),
        }
    }


@router.post("/calculate-tva")
async def calculate_tva_amount(
    amount_ht: float,
    currency: str = "XOF",
    rate_type: str = "standard"
):
    """Calculer la TVA selon les normes OHADA"""
    from app.services.syscohada import calculate_tva
    from decimal import Decimal
    
    result = calculate_tva(Decimal(str(amount_ht)), currency, rate_type)
    return result


@router.get("/syscohada-classes")
async def get_syscohada_classes():
    """Obtenir la structure des classes de comptes SYSCOHADA"""
    return {
        "classes": [
            {"code": "1", "name": "Comptes de ressources durables", "nature": "Capitaux propres et dettes financières"},
            {"code": "2", "name": "Comptes d'actif immobilisé", "nature": "Immobilisations"},
            {"code": "3", "name": "Comptes de stocks", "nature": "Stocks et en-cours"},
            {"code": "4", "name": "Comptes de tiers", "nature": "Créances et dettes d'exploitation"},
            {"code": "5", "name": "Comptes de trésorerie", "nature": "Banques et caisses"},
            {"code": "6", "name": "Comptes de charges des activités ordinaires", "nature": "Charges d'exploitation"},
            {"code": "7", "name": "Comptes de produits des activités ordinaires", "nature": "Produits d'exploitation"},
            {"code": "8", "name": "Comptes des autres charges et produits", "nature": "Résultat hors activités ordinaires"},
        ],
        "rules": {
            "balance_debit": ["2", "3", "5", "6"],  # Solde débiteur normal
            "balance_credit": ["1", "4", "7"],  # Solde créditeur normal
            "result_accounts": ["6", "7", "8"],  # Comptes de résultat
            "balance_sheet_accounts": ["1", "2", "3", "4", "5"],  # Comptes de bilan
        }
    }
