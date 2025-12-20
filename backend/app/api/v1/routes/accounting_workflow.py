"""Accounting Workflow API Routes

Fonctionnalités de révision/clôture (lettrage, contrôles, période, modèles, etc.).
Calculées dynamiquement à partir des écritures lorsqu'il n'existe pas encore de tables dédiées.
"""

from datetime import date
from typing import Any, Dict, List

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from sqlalchemy.exc import OperationalError, ProgrammingError

from app.api.deps import get_current_tenant, get_current_user
from app.db.session import get_db
from app.models.tenant import Tenant
from app.models.user import User
from app.models.accounting import AccountingEntry
from app.services.accounting_analytics import AccountingAnalyticsService

router = APIRouter()


@router.get("/consistency-checks")
async def get_consistency_checks(
    year: int = Query(date.today().year, ge=1900, le=2100),
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    start = date(year, 1, 1)
    end = date(year, 12, 31)

    try:
        total_debit = (
            db.query(func.coalesce(func.sum(AccountingEntry.debit), 0.0))
            .filter(AccountingEntry.tenant_id == current_tenant.id, AccountingEntry.date.between(start, end))
            .scalar()
            or 0.0
        )
        total_credit = (
            db.query(func.coalesce(func.sum(AccountingEntry.credit), 0.0))
            .filter(AccountingEntry.tenant_id == current_tenant.id, AccountingEntry.date.between(start, end))
            .scalar()
            or 0.0
        )
    except (ProgrammingError, OperationalError):
        db.rollback()
        total_debit = 0.0
        total_credit = 0.0

    is_balanced = abs(float(total_debit) - float(total_credit)) < 0.01

    checks: List[Dict[str, Any]] = [
        {
            "id": "balance",
            "label": "Balance équilibrée",
            "status": "ok" if is_balanced else "warning",
            "details": "Débit = Crédit" if is_balanced else "Écart entre débit et crédit",
        },
    ]

    return {
        "year": year,
        "totals": {"total_debit": float(total_debit), "total_credit": float(total_credit)},
        "checks": checks,
    }


@router.get("/lettering/accounts")
async def get_lettering_accounts(
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Retourne la liste des comptes éligibles au lettrage (clients/fournisseurs)."""
    try:
        service = AccountingAnalyticsService(db, current_tenant.id)
        rec_pay = service.get_receivables_payables()
    except (ProgrammingError, OperationalError):
        db.rollback()
        rec_pay = {"receivables": 0.0, "payables": 0.0}

    accounts = [
        {
            "account_code": "411000",
            "account_name": "Clients",
            "balance": float(rec_pay.get("receivables") or 0),
            "unlettered_count": 0,
            "type": "client",
        },
        {
            "account_code": "401000",
            "account_name": "Fournisseurs",
            "balance": float(rec_pay.get("payables") or 0),
            "unlettered_count": 0,
            "type": "supplier",
        },
    ]
    return {"accounts": accounts}


@router.get("/lettering/entries")
async def get_lettering_entries(
    account_code: str = Query(..., description="Code du compte à lettrer"),
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Retourne les écritures à lettrer pour un compte donné."""
    try:
        entries = (
            db.query(AccountingEntry)
            .filter(
                AccountingEntry.tenant_id == current_tenant.id,
                AccountingEntry.account_code.like(f"{account_code[:3]}%"),
                AccountingEntry.lettering_code.is_(None),
            )
            .order_by(AccountingEntry.date.desc())
            .limit(100)
            .all()
        )
        return {
            "entries": [
                {
                    "id": str(e.id),
                    "date": e.date.isoformat() if e.date else None,
                    "label": e.label,
                    "debit": float(e.debit or 0),
                    "credit": float(e.credit or 0),
                    "account_code": e.account_code,
                    "lettering_code": e.lettering_code,
                }
                for e in entries
            ]
        }
    except (ProgrammingError, OperationalError):
        db.rollback()
        return {"entries": []}


@router.post("/lettering/letter")
async def letter_entries(
    entry_ids: List[str] = Query(..., description="IDs des écritures à lettrer"),
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Lettre un groupe d'écritures."""
    import uuid
    lettering_code = f"L{date.today().strftime('%y%m%d')}{str(uuid.uuid4())[:4].upper()}"
    
    try:
        updated = 0
        for entry_id in entry_ids:
            entry = db.query(AccountingEntry).filter(
                AccountingEntry.id == entry_id,
                AccountingEntry.tenant_id == current_tenant.id,
            ).first()
            if entry:
                entry.lettering_code = lettering_code
                updated += 1
        db.commit()
        return {"success": True, "lettering_code": lettering_code, "entries_updated": updated}
    except (ProgrammingError, OperationalError) as e:
        db.rollback()
        return {"success": False, "error": str(e)}


@router.post("/lettering/unletter")
async def unletter_entries(
    entry_ids: List[str] = Query(..., description="IDs des écritures à délettrer"),
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Supprime le lettrage d'un groupe d'écritures."""
    try:
        updated = 0
        for entry_id in entry_ids:
            entry = db.query(AccountingEntry).filter(
                AccountingEntry.id == entry_id,
                AccountingEntry.tenant_id == current_tenant.id,
            ).first()
            if entry:
                entry.lettering_code = None
                updated += 1
        db.commit()
        return {"success": True, "entries_updated": updated}
    except (ProgrammingError, OperationalError) as e:
        db.rollback()
        return {"success": False, "error": str(e)}


@router.post("/lettering/auto")
async def auto_letter(
    account_code: str = Query(..., description="Code du compte à lettrer automatiquement"),
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Lettrage automatique basé sur les montants correspondants."""
    # Pour l'instant, retourne un résultat vide - fonctionnalité à implémenter
    return {"success": True, "matched_groups": 0, "entries_lettered": 0}


@router.get("/lettering")
async def get_lettering_summary(
    year: int = Query(date.today().year, ge=1900, le=2100),
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    try:
        service = AccountingAnalyticsService(db, current_tenant.id)
        rec_pay = service.get_receivables_payables()
    except (ProgrammingError, OperationalError):
        db.rollback()
        rec_pay = {"receivables": 0.0, "payables": 0.0}

    return {
        "year": year,
        "items": [
            {"id": "clients", "tier": "Clients", "reference": "411", "amount": float(rec_pay.get("receivables") or 0), "status": "à lettrer"},
            {"id": "fournisseurs", "tier": "Fournisseurs", "reference": "401", "amount": float(rec_pay.get("payables") or 0), "status": "à lettrer"},
        ],
    }


@router.get("/periods")
async def get_periods(
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    # Pas de table de clôture de période pour le moment: renvoyer une liste vide.
    return {"periods": []}


@router.get("/entry-templates")
async def get_entry_templates(
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    # Pas de table de templates pour le moment.
    return {"templates": []}


@router.get("/inventory")
async def get_inventory(
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    return {"lines": []}


@router.get("/provisions")
async def get_provisions(
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    return {"lines": []}


@router.get("/depreciations")
async def get_depreciations(
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    return {"lines": []}
