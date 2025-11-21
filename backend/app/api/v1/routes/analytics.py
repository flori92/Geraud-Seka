from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.models.user import User
from app.services.ai_analytics import ai_analytics_service

router = APIRouter()

@router.get("/cash-flow-prediction", response_model=Any)
def get_cash_flow_prediction(
    days: int = 30,
    db: Session = Depends(deps.get_db_session),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Obtenir les prévisions de trésorerie basées sur l'IA.
    """
    return ai_analytics_service.predict_cash_flow(db, str(current_user.tenant_id), days)

@router.get("/anomalies", response_model=Any)
def get_accounting_anomalies(
    db: Session = Depends(deps.get_db_session),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Détecter les anomalies comptables (fraude potentielle, erreurs).
    """
    return ai_analytics_service.detect_anomalies(db, str(current_user.tenant_id))
