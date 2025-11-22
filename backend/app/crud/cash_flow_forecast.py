"""CRUD operations for Cash Flow Forecasts."""
from typing import List, Optional
from uuid import UUID
from datetime import date, datetime

from sqlalchemy.orm import Session
from sqlalchemy import and_, desc

from app.models.treasury import CashFlowForecast
from app.schemas.treasury import CashFlowForecastResponse


def get(db: Session, forecast_id: UUID) -> Optional[CashFlowForecast]:
    """Get a cash flow forecast by ID."""
    return db.query(CashFlowForecast).filter(CashFlowForecast.id == forecast_id).first()


def get_multi(
    db: Session,
    *,
    tenant_id: UUID,
    skip: int = 0,
    limit: int = 100,
    scenario: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
) -> List[CashFlowForecast]:
    """Get multiple forecasts with optional filters."""
    query = db.query(CashFlowForecast).filter(CashFlowForecast.tenant_id == tenant_id)

    if scenario:
        query = query.filter(CashFlowForecast.scenario == scenario)
    if start_date:
        query = query.filter(CashFlowForecast.forecast_date >= start_date)
    if end_date:
        query = query.filter(CashFlowForecast.forecast_date <= end_date)

    return query.order_by(CashFlowForecast.forecast_date).offset(skip).limit(limit).all()


def save_forecast(
    db: Session,
    *,
    tenant_id: UUID,
    forecasts: List[dict],
) -> List[CashFlowForecast]:
    """Save multiple forecast records."""
    saved_forecasts = []

    for forecast_data in forecasts:
        db_forecast = CashFlowForecast(
            tenant_id=tenant_id,
            **forecast_data
        )
        db.add(db_forecast)
        saved_forecasts.append(db_forecast)

    db.commit()
    for forecast in saved_forecasts:
        db.refresh(forecast)

    return saved_forecasts


def get_latest_forecast(
    db: Session,
    *,
    tenant_id: UUID,
    scenario: str = "realistic",
) -> List[CashFlowForecast]:
    """Get the most recent forecast for a tenant."""
    # Get the latest creation date
    latest_created = db.query(CashFlowForecast.created_at).filter(
        and_(
            CashFlowForecast.tenant_id == tenant_id,
            CashFlowForecast.scenario == scenario
        )
    ).order_by(desc(CashFlowForecast.created_at)).first()

    if not latest_created:
        return []

    # Get all forecasts from that creation date
    return db.query(CashFlowForecast).filter(
        and_(
            CashFlowForecast.tenant_id == tenant_id,
            CashFlowForecast.scenario == scenario,
            CashFlowForecast.created_at == latest_created[0]
        )
    ).order_by(CashFlowForecast.forecast_date).all()


def get_by_scenario(
    db: Session,
    *,
    tenant_id: UUID,
    scenario: str,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
) -> List[CashFlowForecast]:
    """Get forecasts filtered by scenario."""
    query = db.query(CashFlowForecast).filter(
        and_(
            CashFlowForecast.tenant_id == tenant_id,
            CashFlowForecast.scenario == scenario
        )
    )

    if start_date:
        query = query.filter(CashFlowForecast.forecast_date >= start_date)
    if end_date:
        query = query.filter(CashFlowForecast.forecast_date <= end_date)

    # Get the latest batch
    latest_created = query.order_by(desc(CashFlowForecast.created_at)).first()
    if not latest_created:
        return []

    return query.filter(
        CashFlowForecast.created_at == latest_created.created_at
    ).order_by(CashFlowForecast.forecast_date).all()


def delete_old_forecasts(
    db: Session,
    *,
    tenant_id: UUID,
    days_to_keep: int = 30,
) -> int:
    """Delete forecasts older than N days."""
    cutoff_date = datetime.utcnow() - timedelta(days=days_to_keep)

    deleted_count = db.query(CashFlowForecast).filter(
        and_(
            CashFlowForecast.tenant_id == tenant_id,
            CashFlowForecast.created_at < cutoff_date
        )
    ).delete()

    db.commit()
    return deleted_count


def get_all_scenarios(
    db: Session,
    *,
    tenant_id: UUID,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
) -> dict:
    """Get latest forecasts for all scenarios (optimistic, realistic, pessimistic)."""
    scenarios = {}

    for scenario in ["optimistic", "realistic", "pessimistic"]:
        forecasts = get_by_scenario(
            db,
            tenant_id=tenant_id,
            scenario=scenario,
            start_date=start_date,
            end_date=end_date
        )
        scenarios[scenario] = forecasts

    return scenarios


def delete_by_tenant(db: Session, *, tenant_id: UUID) -> int:
    """Delete all forecasts for a tenant."""
    deleted_count = db.query(CashFlowForecast).filter(
        CashFlowForecast.tenant_id == tenant_id
    ).delete()

    db.commit()
    return deleted_count


from datetime import timedelta
