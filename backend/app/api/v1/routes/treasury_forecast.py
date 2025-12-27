"""API routes for Treasury Forecasting."""
from typing import List, Any, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session

from app.core import deps
from app.models.user import User
from app.schemas.treasury import (
    CashFlowForecastCreate,
    CashFlowForecastResponse,
    CashFlowForecastSummary,
)
from app.services.forecasting import ForecastingService
from app.crud import cash_flow_forecast as forecast_crud

router = APIRouter()


@router.post("/generate", response_model=dict, status_code=202)
def generate_forecast(
    *,
    db: Session = Depends(deps.get_db_session),
    forecast_request: CashFlowForecastCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Generate cash flow forecast (async).
    Returns immediately with task info.
    """
    background_tasks.add_task(
        _generate_forecast_task,
        db,
        current_user.tenant_id,
        forecast_request.forecast_horizon_days,
        forecast_request.model_type
    )

    return {
        "status": "processing",
        "message": "Forecast generation started",
        "tenant_id": str(current_user.tenant_id),
    }


def _generate_forecast_task(
    db: Session,
    tenant_id: UUID,
    horizon_days: int,
    model_type: str
):
    """Background task to generate forecast."""
    try:
        forecasting_service = ForecastingService(db)
        forecast_data = forecasting_service.generate_forecast(
            tenant_id=tenant_id,
            horizon_days=horizon_days,
            model_type=model_type
        )

        forecasting_service.save_forecasts(tenant_id, forecast_data)

    except Exception as e:
        print(f"Error generating forecast: {e}")


@router.get("/latest", response_model=List[CashFlowForecastResponse])
def get_latest_forecast(
    *,
    db: Session = Depends(deps.get_db_session),
    scenario: str = "realistic",
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get the latest forecast for a tenant.
    """
    forecasts = forecast_crud.get_latest_forecast(
        db,
        tenant_id=current_user.tenant_id,
        scenario=scenario
    )

    if not forecasts:
        raise HTTPException(
            status_code=404,
            detail="No forecast found. Please generate a forecast first."
        )

    return [CashFlowForecastResponse.model_validate(f) for f in forecasts]


@router.get("/scenarios", response_model=dict)
def get_forecast_scenarios(
    *,
    db: Session = Depends(deps.get_db_session),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get latest forecasts for all scenarios.
    """
    scenarios = forecast_crud.get_all_scenarios(
        db,
        tenant_id=current_user.tenant_id
    )

    if not any(scenarios.values()):
        raise HTTPException(
            status_code=404,
            detail="No forecasts found. Please generate forecasts first."
        )

    return {
        scenario: [CashFlowForecastResponse.model_validate(f) for f in forecasts]
        for scenario, forecasts in scenarios.items()
    }


@router.get("/risks", response_model=dict)
def get_forecast_risks(
    *,
    db: Session = Depends(deps.get_db_session),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Analyze forecast for risks.
    """
    forecasts = forecast_crud.get_latest_forecast(
        db,
        tenant_id=current_user.tenant_id,
        scenario="realistic"
    )

    if not forecasts:
        raise HTTPException(
            status_code=404,
            detail="No forecast found. Please generate a forecast first."
        )

    risks = []
    recommendations = []

    negative_forecasts = [f for f in forecasts if f.predicted_balance < 0]
    if negative_forecasts:
        first_negative = negative_forecasts[0]
        from datetime import date
        days_until = (first_negative.forecast_date - date.today()).days
        risks.append(f"Trésorerie négative prévue dans {days_until} jours")
        recommendations.append("Réduire les dépenses ou chercher un financement")

    low_balance_forecasts = [
        f for f in forecasts
        if 0 < f.predicted_balance < 100000
    ]
    if low_balance_forecasts:
        risks.append("Solde faible prévu dans les prochains mois")
        recommendations.append("Surveiller la trésorerie de près")

    return {
        "risks": risks,
        "recommendations": recommendations,
        "has_risks": len(risks) > 0,
    }


@router.delete("/", status_code=204)
def delete_forecasts(
    *,
    db: Session = Depends(deps.get_db_session),
    current_user: User = Depends(deps.get_current_user),
) -> None:
    """
    Delete all forecasts for the current tenant.
    """
    forecast_crud.delete_by_tenant(db, tenant_id=current_user.tenant_id)
