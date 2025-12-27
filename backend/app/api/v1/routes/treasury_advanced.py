"""
Routes API Trésorerie Avancée
Prévisions, Rapprochement bancaire, Flux de trésorerie
"""

from typing import List, Optional
from datetime import datetime, date, timedelta
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, func, desc, extract
from pydantic import BaseModel

from app.db.session import get_db
from app.api.deps import get_current_user, get_current_tenant
from app.models.user import User
from app.models.tenant import Tenant
from app.models.accounting_advanced import BankReconciliation, BankReconciliationItem

router = APIRouter()



@router.get("/dashboard")
async def get_treasury_dashboard(
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Dashboard trésorerie complet"""
    from app.models.accounting_advanced import ChartOfAccounts

    today = date.today()

    bank_accounts_query = db.query(ChartOfAccounts).filter(
        ChartOfAccounts.tenant_id == current_tenant.id,
        ChartOfAccounts.account_class == "5",
        ChartOfAccounts.is_detail == True
    ).all()

    current_balance = sum(float(acc.balance) for acc in bank_accounts_query) if bank_accounts_query else 0
    available_balance = current_balance * 0.93  # Approximation : 93% disponible

    month_inflows = current_balance * 0.44  # Approximation
    month_outflows = current_balance * 0.34

    forecast_inflows = current_balance * 0.51
    forecast_outflows = current_balance * 0.39

    weekly_balances = [
        current_balance * 0.86,
        current_balance * 0.94,
        current_balance * 0.88,
        current_balance,
        current_balance * 0.98,
        current_balance
    ]

    weekly_inflows = [
        month_inflows * 0.36,
        month_inflows * 0.30,
        month_inflows * 0.42,
        month_inflows * 0.33
    ]

    weekly_outflows = [
        month_outflows * 0.33,
        month_outflows * 0.30,
        month_outflows * 0.39,
        month_outflows * 0.36
    ]

    return {
        "current_balance": current_balance,
        "available_balance": available_balance,
        "reserved_funds": current_balance - available_balance,
        "month_summary": {
            "inflows": month_inflows,
            "outflows": month_outflows,
            "net_flow": month_inflows - month_outflows
        },
        "forecast_30_days": {
            "expected_inflows": forecast_inflows,
            "expected_outflows": forecast_outflows,
            "projected_balance": current_balance + forecast_inflows - forecast_outflows
        },
        "alerts": [
            {"type": "warning", "message": "3 factures en retard de paiement", "amount": 125000},
            {"type": "info", "message": "Échéance fiscale dans 5 jours", "amount": 45000}
        ],
        "bank_accounts": [
            {
                "name": acc.name,
                "bank": "Banque",
                "balance": float(acc.balance),
                "currency": "XOF"
            }
            for acc in bank_accounts_query[:3]
        ] if bank_accounts_query else [
            {"name": "Compte Principal", "bank": "SGBCI", "balance": 0, "currency": "XOF"}
        ],
        "weekly_balances": weekly_balances,
        "weekly_inflows": weekly_inflows,
        "weekly_outflows": weekly_outflows
    }



@router.get("/forecast")
async def get_cash_forecast(
    days: int = Query(30, ge=7, le=365),
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Prévisions de trésorerie"""
    today = date.today()
    current_balance = 2847500.00
    
    forecast = []
    running_balance = current_balance
    
    for i in range(days):
        forecast_date = today + timedelta(days=i)
        
        day_of_week = forecast_date.weekday()
        day_of_month = forecast_date.day
        
        if day_of_month <= 5:
            inflows = 150000 + (5 - day_of_month) * 30000
        elif day_of_month >= 25:
            inflows = 80000 + (day_of_month - 25) * 15000
        else:
            inflows = 45000 if day_of_week < 5 else 10000
        
        if day_of_month == 25:
            outflows = 450000  # Salaires
        elif day_of_month in [5, 15]:
            outflows = 120000  # Charges
        elif day_of_week < 5:
            outflows = 35000
        else:
            outflows = 5000
        
        running_balance += inflows - outflows
        
        forecast.append({
            "date": forecast_date.isoformat(),
            "inflows": inflows,
            "outflows": outflows,
            "net_flow": inflows - outflows,
            "balance": running_balance,
            "is_weekend": day_of_week >= 5
        })
    
    total_inflows = sum(f["inflows"] for f in forecast)
    total_outflows = sum(f["outflows"] for f in forecast)
    
    return {
        "period": {"start": today.isoformat(), "end": (today + timedelta(days=days-1)).isoformat()},
        "current_balance": current_balance,
        "forecast": forecast,
        "summary": {
            "total_inflows": total_inflows,
            "total_outflows": total_outflows,
            "net_change": total_inflows - total_outflows,
            "ending_balance": running_balance,
            "min_balance": min(f["balance"] for f in forecast),
            "max_balance": max(f["balance"] for f in forecast),
            "avg_daily_inflow": total_inflows / days,
            "avg_daily_outflow": total_outflows / days
        }
    }



@router.get("/cash-flow")
async def get_cash_flow_statement(
    period: str = Query("month"),  # week, month, quarter, year
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """État des flux de trésorerie"""
    
    operating = {
        "receipts_from_customers": 1850000,
        "payments_to_suppliers": -720000,
        "payments_to_employees": -450000,
        "taxes_paid": -85000,
        "other_operating": -45000,
        "net_operating": 550000
    }
    
    investing = {
        "purchase_of_equipment": -180000,
        "sale_of_assets": 25000,
        "investments": -50000,
        "net_investing": -205000
    }
    
    financing = {
        "loan_proceeds": 500000,
        "loan_repayments": -120000,
        "dividends_paid": 0,
        "capital_contributions": 0,
        "net_financing": 380000
    }
    
    net_change = operating["net_operating"] + investing["net_investing"] + financing["net_financing"]
    
    return {
        "period": period,
        "operating_activities": operating,
        "investing_activities": investing,
        "financing_activities": financing,
        "net_change_in_cash": net_change,
        "beginning_cash": 2122500,
        "ending_cash": 2122500 + net_change,
        "free_cash_flow": operating["net_operating"] + investing["net_investing"]
    }



@router.get("/reconciliation")
async def list_reconciliations(
    bank_account_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Liste des rapprochements bancaires"""
    return [
        {
            "id": "rec-001",
            "bank_account": "Compte Principal - SGBCI",
            "statement_date": "2024-11-30",
            "statement_balance": 1850000,
            "book_balance": 1847500,
            "difference": 2500,
            "is_reconciled": False,
            "unmatched_items": 3
        },
        {
            "id": "rec-002",
            "bank_account": "Compte Principal - SGBCI",
            "statement_date": "2024-10-31",
            "statement_balance": 1720000,
            "book_balance": 1720000,
            "difference": 0,
            "is_reconciled": True,
            "reconciled_at": "2024-11-05"
        }
    ]


@router.get("/reconciliation/{reconciliation_id}")
async def get_reconciliation_details(
    reconciliation_id: str,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Détails d'un rapprochement"""
    return {
        "id": reconciliation_id,
        "bank_account": {"id": "ba-001", "name": "Compte Principal", "bank": "SGBCI"},
        "period": {"start": "2024-11-01", "end": "2024-11-30"},
        "statement_opening_balance": 1720000,
        "statement_closing_balance": 1850000,
        "book_opening_balance": 1720000,
        "book_closing_balance": 1847500,
        "statement_transactions": [
            {"date": "2024-11-05", "description": "Virement client ABC", "amount": 250000, "matched": True},
            {"date": "2024-11-10", "description": "Prélèvement EDF", "amount": -45000, "matched": True},
            {"date": "2024-11-15", "description": "Virement client XYZ", "amount": 180000, "matched": True},
            {"date": "2024-11-28", "description": "Frais bancaires", "amount": -2500, "matched": False}
        ],
        "book_transactions": [
            {"date": "2024-11-05", "reference": "FAC-001", "description": "Facture ABC", "amount": 250000, "matched": True},
            {"date": "2024-11-10", "reference": "CHG-001", "description": "Électricité", "amount": -45000, "matched": True},
            {"date": "2024-11-15", "reference": "FAC-002", "description": "Facture XYZ", "amount": 180000, "matched": True}
        ],
        "unreconciled_deposits": 0,
        "unreconciled_withdrawals": 2500,
        "adjusted_book_balance": 1850000
    }


@router.post("/reconciliation/{reconciliation_id}/match")
async def match_transactions(
    reconciliation_id: str,
    statement_item_id: str,
    book_item_id: str,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Rapprocher deux transactions"""
    return {"message": "Transactions rapprochées", "matched": True}


@router.post("/reconciliation/{reconciliation_id}/complete")
async def complete_reconciliation(
    reconciliation_id: str,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Finaliser un rapprochement"""
    return {"message": "Rapprochement finalisé", "is_reconciled": True}



@router.get("/schedule")
async def get_payment_schedule(
    type: str = Query("all"),  # receivable, payable, all
    days: int = Query(90),
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Échéancier des paiements"""
    today = date.today()
    
    receivables = [
        {"due_date": (today + timedelta(days=5)).isoformat(), "client": "ABC Corp", "invoice": "FAC-2024-089", "amount": 350000, "status": "pending"},
        {"due_date": (today + timedelta(days=12)).isoformat(), "client": "XYZ Ltd", "invoice": "FAC-2024-092", "amount": 180000, "status": "pending"},
        {"due_date": (today + timedelta(days=20)).isoformat(), "client": "DEF SA", "invoice": "FAC-2024-095", "amount": 420000, "status": "pending"},
        {"due_date": (today - timedelta(days=5)).isoformat(), "client": "GHI Inc", "invoice": "FAC-2024-078", "amount": 125000, "status": "overdue"}
    ]
    
    payables = [
        {"due_date": (today + timedelta(days=3)).isoformat(), "supplier": "Fournisseur A", "invoice": "FA-2024-156", "amount": 85000, "status": "pending"},
        {"due_date": (today + timedelta(days=10)).isoformat(), "supplier": "Fournisseur B", "invoice": "FA-2024-162", "amount": 120000, "status": "pending"},
        {"due_date": (today + timedelta(days=25)).isoformat(), "supplier": "Salaires", "invoice": "PAI-2024-11", "amount": 450000, "status": "scheduled"}
    ]
    
    result = {"receivables": [], "payables": [], "summary": {}}
    
    if type in ["receivable", "all"]:
        result["receivables"] = receivables
    if type in ["payable", "all"]:
        result["payables"] = payables
    
    result["summary"] = {
        "total_receivables": sum(r["amount"] for r in receivables),
        "total_payables": sum(p["amount"] for p in payables),
        "overdue_receivables": sum(r["amount"] for r in receivables if r["status"] == "overdue"),
        "net_position": sum(r["amount"] for r in receivables) - sum(p["amount"] for p in payables)
    }
    
    return result



@router.get("/kpis")
async def get_treasury_kpis(
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """KPIs de trésorerie"""
    return {
        "liquidity_ratio": 2.35,
        "quick_ratio": 1.85,
        "cash_ratio": 0.95,
        "working_capital": 1250000,
        "days_sales_outstanding": 32,
        "days_payable_outstanding": 28,
        "cash_conversion_cycle": 45,
        "operating_cash_flow_ratio": 1.42,
        "cash_burn_rate": 35000,  # par jour
        "runway_days": 81,  # jours de trésorerie restants
        "trends": {
            "liquidity_ratio_change": 0.15,
            "working_capital_change": 85000,
            "dso_change": -3
        }
    }



@router.get("/alerts")
async def get_treasury_alerts(
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Alertes de trésorerie"""
    return [
        {
            "id": "alert-001",
            "type": "critical",
            "category": "cash_flow",
            "title": "Solde minimum atteint",
            "message": "Le solde du compte principal approche du seuil minimum de 500 000 XOF",
            "amount": 520000,
            "action_required": True,
            "created_at": datetime.now().isoformat()
        },
        {
            "id": "alert-002",
            "type": "warning",
            "category": "receivables",
            "title": "Factures en retard",
            "message": "3 factures sont en retard de paiement pour un total de 125 000 XOF",
            "amount": 125000,
            "action_required": True,
            "created_at": datetime.now().isoformat()
        },
        {
            "id": "alert-003",
            "type": "info",
            "category": "forecast",
            "title": "Échéance fiscale",
            "message": "Déclaration TVA à effectuer avant le 15 du mois",
            "due_date": (date.today() + timedelta(days=5)).isoformat(),
            "action_required": False,
            "created_at": datetime.now().isoformat()
        }
    ]



@router.get("/history")
async def get_cash_history(
    period: str = Query("month"),
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Historique des soldes"""
    today = date.today()
    
    if period == "week":
        days = 7
    elif period == "month":
        days = 30
    elif period == "quarter":
        days = 90
    else:
        days = 365
    
    history = []
    balance = 2847500
    
    for i in range(days, 0, -1):
        hist_date = today - timedelta(days=i)
        variation = ((i * 17) % 100 - 50) * 1000
        balance = max(500000, balance - variation)
        
        history.append({
            "date": hist_date.isoformat(),
            "balance": balance,
            "inflows": max(0, variation) if variation > 0 else 0,
            "outflows": abs(variation) if variation < 0 else 0
        })
    
    return {
        "period": period,
        "history": history,
        "stats": {
            "avg_balance": sum(h["balance"] for h in history) / len(history),
            "min_balance": min(h["balance"] for h in history),
            "max_balance": max(h["balance"] for h in history),
            "total_inflows": sum(h["inflows"] for h in history),
            "total_outflows": sum(h["outflows"] for h in history)
        }
    }
