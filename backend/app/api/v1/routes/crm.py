"""
API Routes CRM pour SEKA Enterprise
Pipeline de vente, leads, opportunités avec IA
"""

from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import and_, desc, or_

from app.db.session import get_db
from app.core.deps import get_current_user, get_current_tenant
from app.models.user import User
from app.models.tenant import Tenant
from app.models.crm import (
    Lead, Opportunity, CRMActivity, Campaign,
    LeadStatus, OpportunityStage, ActivityType, Priority
)
from app.services.crm import crm_service

router = APIRouter()


@router.get("/pipeline")
async def get_sales_pipeline(
    user_filter: Optional[str] = Query(None),
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Récupère le pipeline de vente visuel
    
    - **user_filter**: Filtrer par utilisateur assigné (optionnel)
    """
    try:
        pipeline_data = await crm_service.get_sales_pipeline(
            tenant_id=str(current_tenant.id),
            user_id=user_filter
        )
        
        return pipeline_data
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de la récupération du pipeline: {str(e)}"
        )


@router.get("/leads")
async def get_leads(
    status: Optional[str] = Query(None),
    score_min: Optional[int] = Query(None, ge=0, le=100),
    assigned_to: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Récupère la liste des leads avec filtres
    
    - **status**: Filtrer par statut (new, contacted, qualified, etc.)
    - **score_min**: Score minimum (0-100)
    - **assigned_to**: Filtrer par commercial assigné
    - **limit**: Nombre de leads à retourner
    - **offset**: Pagination
    """
    try:
        # Base query
        query = db.query(Lead).filter(Lead.tenant_id == current_tenant.id)
        
        # Filtres
        if status:
            query = query.filter(Lead.status == status)
        
        if score_min is not None:
            query = query.filter(Lead.score >= score_min)
        
        if assigned_to:
            query = query.filter(Lead.assigned_to == assigned_to)
        
        # Récupérer avec relations
        leads = query.options(
            selectinload(Lead.assignee),
            selectinload(Lead.activities)
        ).order_by(desc(Lead.score), desc(Lead.created_at)).offset(offset).limit(limit).all()
        
        # Count total pour pagination
        total_count = query.count()
        
        # Format response
        lead_list = []
        for lead in leads:
            lead_data = {
                "id": str(lead.id),
                "first_name": lead.first_name,
                "last_name": lead.last_name,
                "email": lead.email,
                "phone": lead.phone,
                "company": lead.company,
                "job_title": lead.job_title,
                "status": lead.status,
                "score": lead.score,
                "quality_grade": lead.quality_grade,
                "source": lead.source,
                "last_contact_date": lead.last_contact_date.isoformat() if lead.last_contact_date else None,
                "next_action_date": lead.next_action_date.isoformat() if lead.next_action_date else None,
                "assigned_to": {
                    "id": str(lead.assignee.id),
                    "name": lead.assignee.full_name
                } if lead.assignee else None,
                "days_since_last_contact": lead.days_since_last_contact,
                "is_hot_lead": lead.is_hot_lead,
                "created_at": lead.created_at.isoformat()
            }
            lead_list.append(lead_data)
        
        return {
            "leads": lead_list,
            "total_count": total_count,
            "limit": limit,
            "offset": offset,
            "has_more": (offset + limit) < total_count
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de la récupération des leads: {str(e)}"
        )


@router.post("/leads/{lead_id}/score")
async def recalculate_lead_score(
    lead_id: str,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Recalculer le score d'un lead avec l'IA
    """
    lead = db.query(Lead).filter(
        and_(
            Lead.id == lead_id,
            Lead.tenant_id == current_tenant.id
        )
    ).first()
    
    if not lead:
        raise HTTPException(status_code=404, detail="Lead non trouvé")
    
    try:
        # Recalculer le score
        new_score = await crm_service.calculate_lead_score(lead)
        db.commit()
        
        return {
            "lead_id": str(lead.id),
            "new_score": new_score,
            "quality_grade": lead.quality_grade,
            "message": f"Score mis à jour: {new_score}/100 (Grade {lead.quality_grade})"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors du calcul du score: {str(e)}"
        )


@router.get("/leads/hot")
async def get_hot_leads(
    limit: int = Query(10, ge=1, le=50),
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Récupère les leads chauds (score élevé + activité récente)
    """
    try:
        hot_leads = db.query(Lead).filter(
            and_(
                Lead.tenant_id == current_tenant.id,
                Lead.score >= 70,
                Lead.last_activity_date >= datetime.utcnow() - timedelta(days=7),
                Lead.status.in_([LeadStatus.CONTACTED, LeadStatus.QUALIFIED])
            )
        ).order_by(desc(Lead.score)).limit(limit).all()
        
        hot_leads_data = []
        for lead in hot_leads:
            hot_leads_data.append({
                "id": str(lead.id),
                "name": lead.full_display_name,
                "company": lead.company,
                "score": lead.score,
                "last_activity": lead.last_activity_date.isoformat() if lead.last_activity_date else None,
                "email": lead.email,
                "phone": lead.phone,
                "status": lead.status
            })
        
        return {
            "hot_leads": hot_leads_data,
            "count": len(hot_leads_data)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de la récupération des leads chauds: {str(e)}"
        )


@router.get("/next-actions")
async def get_next_actions(
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Récupère les prochaines actions suggérées par l'IA
    """
    try:
        actions = await crm_service.generate_next_actions(
            user_id=str(current_user.id),
            tenant_id=str(current_tenant.id)
        )
        
        return {
            "actions": actions,
            "count": len(actions),
            "generated_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de la génération des actions: {str(e)}"
        )


@router.post("/leads/auto-assign")
async def auto_assign_leads(
    background_tasks: BackgroundTasks,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user)
):
    """
    Assignation automatique des leads non assignés
    """
    background_tasks.add_task(
        crm_service.auto_assign_leads,
        tenant_id=str(current_tenant.id)
    )
    
    return {
        "message": "Assignation automatique des leads lancée en arrière-plan"
    }


@router.get("/opportunities")
async def get_opportunities(
    stage: Optional[str] = Query(None),
    assigned_to: Optional[str] = Query(None),
    probability_min: Optional[int] = Query(None, ge=0, le=100),
    limit: int = Query(50, ge=1, le=200),
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Récupère les opportunités avec filtres
    
    - **stage**: Filtrer par étape du pipeline
    - **assigned_to**: Filtrer par commercial assigné
    - **probability_min**: Probabilité minimale de closing
    """
    try:
        # Base query
        query = db.query(Opportunity).filter(Opportunity.tenant_id == current_tenant.id)
        
        # Filtres
        if stage:
            query = query.filter(Opportunity.stage == stage)
        
        if assigned_to:
            query = query.filter(Opportunity.assigned_to == assigned_to)
        
        if probability_min is not None:
            query = query.filter(Opportunity.probability >= probability_min)
        
        opportunities = query.options(
            selectinload(Opportunity.lead),
            selectinload(Opportunity.client),
            selectinload(Opportunity.assignee)
        ).order_by(desc(Opportunity.amount)).limit(limit).all()
        
        # Format response
        opp_list = []
        for opp in opportunities:
            opp_data = {
                "id": str(opp.id),
                "name": opp.name,
                "amount": float(opp.amount),
                "probability": opp.probability,
                "weighted_amount": opp.weighted_amount,
                "stage": opp.stage,
                "expected_close_date": opp.expected_close_date.isoformat() if opp.expected_close_date else None,
                "days_in_stage": opp.days_in_stage,
                "is_stale": opp.is_stale,
                "client_name": opp.client.name if opp.client else (opp.lead.company if opp.lead else "N/A"),
                "assignee": {
                    "id": str(opp.assignee.id),
                    "name": opp.assignee.full_name
                } if opp.assignee else None,
                "created_at": opp.created_at.isoformat()
            }
            opp_list.append(opp_data)
        
        return {
            "opportunities": opp_list,
            "count": len(opp_list)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de la récupération des opportunités: {str(e)}"
        )


@router.get("/conversion-funnel")
async def get_conversion_funnel(
    period_days: int = Query(30, ge=1, le=365),
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user)
):
    """
    Analyse du funnel de conversion des leads
    
    - **period_days**: Période d'analyse en jours
    """
    try:
        funnel_analysis = await crm_service.analyze_lead_conversion_funnel(
            tenant_id=str(current_tenant.id),
            period_days=period_days
        )
        
        return funnel_analysis
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de l'analyse du funnel: {str(e)}"
        )


@router.post("/leads/{lead_id}/follow-up")
async def send_follow_up(
    lead_id: str,
    background_tasks: BackgroundTasks,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Envoyer un follow-up automatique personnalisé
    """
    # Vérifier que le lead existe
    lead = db.query(Lead).filter(
        and_(
            Lead.id == lead_id,
            Lead.tenant_id == current_tenant.id
        )
    ).first()
    
    if not lead:
        raise HTTPException(status_code=404, detail="Lead non trouvé")
    
    # Lancer l'envoi en arrière-plan
    background_tasks.add_task(
        crm_service.send_automated_follow_up,
        lead_id=lead_id
    )
    
    return {
        "message": f"Follow-up automatique envoyé à {lead.email}",
        "lead_id": str(lead.id)
    }


@router.get("/activities")
async def get_crm_activities(
    activity_type: Optional[str] = Query(None),
    assigned_to: Optional[str] = Query(None),
    completed: Optional[bool] = Query(None),
    days_back: int = Query(7, ge=1, le=90),
    limit: int = Query(50, ge=1, le=200),
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Récupère les activités CRM avec filtres
    
    - **activity_type**: Type d'activité (call, email, meeting, etc.)
    - **assigned_to**: Filtrer par utilisateur assigné
    - **completed**: Filtrer par statut de completion
    - **days_back**: Nombre de jours historique
    """
    try:
        start_date = datetime.utcnow() - timedelta(days=days_back)
        
        # Base query
        query = db.query(CRMActivity).filter(
            and_(
                CRMActivity.tenant_id == current_tenant.id,
                CRMActivity.created_at >= start_date
            )
        )
        
        # Filtres
        if activity_type:
            query = query.filter(CRMActivity.type == activity_type)
        
        if assigned_to:
            query = query.filter(CRMActivity.assigned_to == assigned_to)
        
        if completed is not None:
            query = query.filter(CRMActivity.is_completed == completed)
        
        activities = query.options(
            selectinload(CRMActivity.lead),
            selectinload(CRMActivity.client),
            selectinload(CRMActivity.opportunity),
            selectinload(CRMActivity.assignee)
        ).order_by(desc(CRMActivity.created_at)).limit(limit).all()
        
        # Format response
        activity_list = []
        for activity in activities:
            activity_data = {
                "id": str(activity.id),
                "type": activity.type,
                "subject": activity.subject,
                "description": activity.description,
                "due_date": activity.due_date.isoformat() if activity.due_date else None,
                "is_completed": activity.is_completed,
                "completed_at": activity.completed_at.isoformat() if activity.completed_at else None,
                "priority": activity.priority,
                "outcome": activity.outcome,
                "lead": {
                    "id": str(activity.lead.id),
                    "name": activity.lead.full_display_name
                } if activity.lead else None,
                "client": {
                    "id": str(activity.client.id),
                    "name": activity.client.name
                } if activity.client else None,
                "opportunity": {
                    "id": str(activity.opportunity.id),
                    "name": activity.opportunity.name
                } if activity.opportunity else None,
                "assignee": {
                    "id": str(activity.assignee.id),
                    "name": activity.assignee.full_name
                } if activity.assignee else None,
                "created_at": activity.created_at.isoformat()
            }
            activity_list.append(activity_data)
        
        return {
            "activities": activity_list,
            "count": len(activity_list),
            "period_days": days_back
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de la récupération des activités: {str(e)}"
        )


@router.get("/dashboard")
async def get_crm_dashboard(
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Dashboard CRM avec métriques clés
    """
    try:
        # Métriques leads
        total_leads = db.query(Lead).filter(Lead.tenant_id == current_tenant.id).count()
        
        hot_leads_count = db.query(Lead).filter(
            and_(
                Lead.tenant_id == current_tenant.id,
                Lead.score >= 70
            )
        ).count()
        
        # Métriques opportunités
        total_opportunities = db.query(Opportunity).filter(
            Opportunity.tenant_id == current_tenant.id
        ).count()
        
        # Pipeline value
        pipeline_value = db.query(func.sum(Opportunity.amount)).filter(
            and_(
                Opportunity.tenant_id == current_tenant.id,
                Opportunity.stage.in_([
                    OpportunityStage.QUALIFICATION,
                    OpportunityStage.PROPOSAL,
                    OpportunityStage.NEGOTIATION,
                    OpportunityStage.CLOSING
                ])
            )
        ).scalar() or 0
        
        # Activités cette semaine
        week_start = datetime.utcnow() - timedelta(days=7)
        activities_this_week = db.query(CRMActivity).filter(
            and_(
                CRMActivity.tenant_id == current_tenant.id,
                CRMActivity.created_at >= week_start
            )
        ).count()
        
        return {
            "dashboard": {
                "leads": {
                    "total": total_leads,
                    "hot_leads": hot_leads_count,
                    "hot_leads_percentage": (hot_leads_count / total_leads * 100) if total_leads > 0 else 0
                },
                "opportunities": {
                    "total": total_opportunities,
                    "pipeline_value": float(pipeline_value),
                    "average_deal_size": float(pipeline_value) / total_opportunities if total_opportunities > 0 else 0
                },
                "activities": {
                    "this_week": activities_this_week
                }
            },
            "generated_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de la génération du dashboard: {str(e)}"
        )