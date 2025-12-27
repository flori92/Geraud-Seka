"""
API Routes Analytics pour SEKA Enterprise
Endpoints pour dashboard temps réel et métriques business
"""

from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc, or_

from app.db.session import get_db
from app.core.deps import get_current_user, get_current_tenant
from app.models.user import User
from app.models.tenant import Tenant
from app.models.analytics import Metric, Dashboard, Alert, BusinessInsight, KPITarget
from app.services.analytics import analytics_service
from app.services.ai_analytics import ai_analytics_service

router = APIRouter()


@router.get("/metrics/realtime")
async def get_realtime_metrics(
    period: str = Query("month", regex="^(day|week|month|quarter|year)$"),
    category: Optional[str] = Query(None),
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Récupère les métriques business en temps réel
    
    - **period**: Période d'analyse (day, week, month, quarter, year)
    - **category**: Filtrer par catégorie (sales, finance, customer, inventory, hr)
    """
    try:
        metrics = await analytics_service.calculate_real_time_metrics(
            tenant_id=str(current_tenant.id),
            period=period
        )
        
        if category:
            metrics = {
                name: data for name, data in metrics.items()
                if data.get("category") == category
            }
        
        return {
            "metrics": metrics,
            "period": period,
            "calculated_at": datetime.utcnow().isoformat(),
            "tenant_id": str(current_tenant.id)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors du calcul des métriques: {str(e)}"
        )


@router.get("/insights")
async def get_business_insights(
    limit: int = Query(10, ge=1, le=50),
    dismissed: bool = Query(False),
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Récupère les insights business générés par IA
    
    - **limit**: Nombre maximum d'insights à retourner
    - **dismissed**: Inclure les insights rejetés
    """
    try:
        fresh_insights = await analytics_service.generate_business_insights(
            tenant_id=str(current_tenant.id)
        )
        
        query = db.query(BusinessInsight).filter(
            BusinessInsight.tenant_id == current_tenant.id
        )
        
        if not dismissed:
            query = query.filter(BusinessInsight.is_dismissed == False)
        
        db_insights = query.order_by(desc(BusinessInsight.created_at)).limit(limit).all()
        
        insights = []
        for insight in db_insights:
            insights.append({
                "id": str(insight.id),
                "title": insight.title,
                "description": insight.description,
                "insight_type": insight.insight_type,
                "confidence_score": insight.confidence_score,
                "priority": insight.priority,
                "recommendations": insight.recommendations or [],
                "is_dismissed": insight.is_dismissed,
                "is_acted_upon": insight.is_acted_upon,
                "created_at": insight.created_at.isoformat()
            })
        
        return insights
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de la récupération des insights: {str(e)}"
        )


@router.get("/alerts")
async def get_alerts(
    unread_only: bool = Query(False),
    severity: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Récupère les alertes système

    - **unread_only**: Afficher uniquement les alertes non lues
    - **severity**: Filtrer par niveau de sévérité (info, warning, error, critical)
    - **limit**: Nombre maximum d'alertes
    """
    try:

        query = db.query(Alert).filter(
            Alert.tenant_id == current_tenant.id
        )

        if hasattr(Alert, 'user_id'):
            query = query.filter(
                or_(
                    Alert.user_id == current_user.id,
                    Alert.user_id == None
                )
            )

        if unread_only:
            query = query.filter(Alert.is_read == False)

        if severity:
            query = query.filter(Alert.severity == severity)

        alerts = query.order_by(desc(Alert.created_at)).limit(limit).all()

        alert_responses = []
        for alert in alerts:
            alert_responses.append({
                "id": str(alert.id),
                "title": alert.title,
                "message": alert.message,
                "severity": alert.severity,
                "metric_name": alert.metric_name if hasattr(alert, 'metric_name') else None,
                "threshold_value": alert.threshold_value if hasattr(alert, 'threshold_value') else None,
                "actual_value": alert.actual_value if hasattr(alert, 'actual_value') else None,
                "condition": alert.condition if hasattr(alert, 'condition') else None,
                "is_read": alert.is_read if hasattr(alert, 'is_read') else False,
                "is_resolved": alert.is_resolved if hasattr(alert, 'is_resolved') else False,
                "suggested_actions": alert.suggested_actions if hasattr(alert, 'suggested_actions') else [],
                "created_at": alert.created_at.isoformat()
            })

        return alert_responses

    except Exception as e:
        print(f"Error fetching alerts: {str(e)}")
        import traceback
        traceback.print_exc()
        return []


@router.post("/alerts/{alert_id}/read")
async def mark_alert_as_read(
    alert_id: str,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Marquer une alerte comme lue"""
    alert = db.query(Alert).filter(
        and_(
            Alert.id == alert_id,
            Alert.tenant_id == current_tenant.id,
            Alert.user_id == current_user.id
        )
    ).first()
    
    if not alert:
        raise HTTPException(status_code=404, detail="Alerte non trouvée")
    
    alert.is_read = True
    db.commit()
    
    return {"message": "Alerte marquée comme lue"}


@router.post("/alerts/read-all")
async def mark_all_alerts_as_read(
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Marquer toutes les alertes comme lues"""
    try:
        updated_count = db.query(Alert).filter(
            and_(
                Alert.tenant_id == current_tenant.id,
                Alert.user_id == current_user.id,
                Alert.is_read == False
            )
        ).update({"is_read": True})
        
        db.commit()
        
        return {
            "message": "Toutes les alertes ont été marquées comme lues",
            "count": updated_count
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de la mise à jour des alertes: {str(e)}"
        )


@router.get("/performance/summary")
async def get_performance_summary(
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user)
):
    """Résumé des performances business"""
    try:
        current_month = await analytics_service.calculate_real_time_metrics(
            tenant_id=str(current_tenant.id),
            period="month"
        )
        
        summary = {
            "monthly": {
                "revenue": current_month.get("total_revenue", {}).get("value", 0),
                "growth_rate": current_month.get("revenue_growth_rate", {}).get("value", 0),
                "customers": current_month.get("active_customers", {}).get("value", 0),
                "conversion_rate": current_month.get("conversion_rate", {}).get("value", 0)
            },
            "calculated_at": datetime.utcnow().isoformat()
        }
        
        return summary
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors du calcul du résumé: {str(e)}"
        )


@router.get("/cash-flow-prediction", response_model=Any)
def get_cash_flow_prediction(
    days: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Obtenir les prévisions de trésorerie basées sur l'IA.
    """
    return ai_analytics_service.predict_cash_flow(db, str(current_user.tenant_id), days)

@router.get("/anomalies", response_model=Any)
def get_accounting_anomalies(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Détecter les anomalies comptables (fraude potentielle, erreurs).
    """
    return ai_analytics_service.detect_anomalies(db, str(current_user.tenant_id))
