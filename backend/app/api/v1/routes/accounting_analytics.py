
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Dict, Any

from app.db.session import get_db
from app.api.deps import get_current_tenant
from app.models.tenant import Tenant
from app.services.accounting_analytics import AccountingAnalyticsService

router = APIRouter()

@router.get("/dashboard-stats")
async def get_accounting_stats(
    year: int = 2024,
    current_tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Retourne les statistiques agrégées pour le tableau de bord comptable.
    Calculé dynamiquement à partir des écritures.
    """
    service = AccountingAnalyticsService(db, str(current_tenant.id))
    return service.get_dashboard_summary()

@router.get("/reports/income-statement")
async def get_income_statement(
    year: int = 2024,
    current_tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Retourne le compte de résultat pour l'année donnée"""
    service = AccountingAnalyticsService(db, str(current_tenant.id))
    return service.get_income_statement(year)

@router.get("/reports/monthly-trends")
async def get_monthly_trends(
    year: int = 2024,
    current_tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Retourne les données pour les graphiques mensuels"""
    service = AccountingAnalyticsService(db, str(current_tenant.id))
    return service.get_monthly_trends(year)
