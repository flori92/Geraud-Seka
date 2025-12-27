"""API routes for Treasury Dashboard."""
from typing import Any
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import ProgrammingError, OperationalError

from app.core import deps
from app.models.user import User
from app.schemas.treasury import (
    TreasuryDashboardResponse,
    TreasuryKPIs,
    CashFlowSummary,
)
from app.services.treasury import TreasuryService
from datetime import date, timedelta

router = APIRouter()


def get_empty_dashboard_response() -> dict:
    """Return empty dashboard data when tables don't exist."""
    today = date.today()
    return {
        "total_balance": Decimal("0"),
        "total_balance_by_currency": {"XOF": Decimal("0")},
        "accounts_summary": [],
        "recent_transactions": [],
        "upcoming_payments": [],
        "cash_runway_days": 0,
        "alerts": [],
        "cash_flow_summary": {
            "period_start": date(today.year, today.month, 1),
            "period_end": today,
            "opening_balance": Decimal("0"),
            "total_income": Decimal("0"),
            "total_expenses": Decimal("0"),
            "net_cash_flow": Decimal("0"),
            "closing_balance": Decimal("0"),
        }
    }


@router.get("/")
def get_treasury_dashboard(
    *,
    db: Session = Depends(deps.get_db_session),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get complete treasury dashboard data.
    """
    try:
        treasury_service = TreasuryService(db)
        dashboard_data = treasury_service.get_dashboard_data(current_user.tenant_id)
        return dashboard_data
    except (ProgrammingError, OperationalError) as e:
        db.rollback()
        return get_empty_dashboard_response()
    except Exception as e:
        db.rollback()
        print(f"Treasury dashboard error: {str(e)}")
        return get_empty_dashboard_response()


@router.get("/kpis", response_model=TreasuryKPIs)
def get_treasury_kpis(
    *,
    db: Session = Depends(deps.get_db_session),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get treasury key performance indicators.
    """
    treasury_service = TreasuryService(db)
    kpis = treasury_service.get_kpis(current_user.tenant_id)
    return kpis


@router.get("/cash-flow-summary", response_model=CashFlowSummary)
def get_cash_flow_summary(
    *,
    db: Session = Depends(deps.get_db_session),
    period: str = "month",  # month, quarter, year
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get cash flow summary for a period.
    """
    today = date.today()
    
    if period == "month":
        start_date = date(today.year, today.month, 1)
        end_date = today
    elif period == "quarter":
        quarter = (today.month - 1) // 3
        start_date = date(today.year, quarter * 3 + 1, 1)
        end_date = today
    elif period == "year":
        start_date = date(today.year, 1, 1)
        end_date = today
    else:
        raise HTTPException(status_code=400, detail="Invalid period. Use: month, quarter, or year")

    treasury_service = TreasuryService(db)
    summary = treasury_service.get_cash_flow_summary(
        tenant_id=current_user.tenant_id,
        start_date=start_date,
        end_date=end_date
    )
    return summary


@router.get("/balance-history", response_model=list)
def get_balance_history(
    *,
    db: Session = Depends(deps.get_db_session),
    months: int = 12,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get balance history for the last N months.
    """
    treasury_service = TreasuryService(db)
    history = treasury_service.get_balance_history(
        tenant_id=current_user.tenant_id,
        months=months
    )
    return history


@router.post("/generate-alerts", response_model=dict)
def generate_alerts(
    *,
    db: Session = Depends(deps.get_db_session),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Generate treasury alerts based on current state.
    """
    treasury_service = TreasuryService(db)
    alerts = treasury_service.generate_alerts(current_user.tenant_id)
    
    return {
        "alerts_generated": len(alerts),
        "alerts": [
            {
                "type": alert.alert_type,
                "severity": alert.severity,
                "title": alert.title,
                "message": alert.message,
            }
            for alert in alerts
        ]
    }
