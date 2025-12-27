"""
API Routes Treasury - Endpoints principaux de trésorerie
"""

from datetime import date, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core import deps
from app.models.user import User
from app.schemas.treasury import CashFlowSummary
from app.services.treasury import TreasuryService

router = APIRouter()


@router.get("/cash-flow", response_model=CashFlowSummary)
def get_cash_flow(
    *,
    db: Session = Depends(deps.get_db_session),
    period: str = Query("month", description="Period: day, week, month, quarter, year"),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    current_user: User = Depends(deps.get_current_user),
):
    """
    Get cash flow data for a specific period.

    This is an alias endpoint that provides the same data as /treasury/dashboard/cash-flow-summary
    but with a simpler path for frontend compatibility.

    - **period**: Time period (day, week, month, quarter, year)
    - **start_date**: Optional start date (YYYY-MM-DD)
    - **end_date**: Optional end date (YYYY-MM-DD)
    """
    today = date.today()

    if start_date and end_date:
        try:
            start = date.fromisoformat(start_date)
            end = date.fromisoformat(end_date)
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail="Invalid date format. Use YYYY-MM-DD"
            )
    else:
        if period == "day":
            start = today
            end = today
        elif period == "week":
            start = today - timedelta(days=today.weekday())
            end = today
        elif period == "month":
            start = date(today.year, today.month, 1)
            end = today
        elif period == "quarter":
            quarter = (today.month - 1) // 3
            start = date(today.year, quarter * 3 + 1, 1)
            end = today
        elif period == "year":
            start = date(today.year, 1, 1)
            end = today
        else:
            raise HTTPException(
                status_code=400,
                detail="Invalid period. Use: day, week, month, quarter, or year"
            )

    treasury_service = TreasuryService(db)
    summary = treasury_service.get_cash_flow_summary(
        tenant_id=current_user.tenant_id,
        start_date=start,
        end_date=end
    )
    return summary
