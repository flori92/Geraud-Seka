"""
Service CRM Intelligent pour SEKA Enterprise
Pipeline de vente, lead scoring IA et automation
"""

import asyncio
from datetime import datetime, timedelta, date
from typing import Dict, List, Optional, Any, Tuple
from sqlalchemy import func, and_, or_, desc
from sqlalchemy.orm import Session, selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.crm import (
    Lead, Opportunity, CRMActivity, Campaign, LeadScoring,
    LeadStatus, OpportunityStage, ActivityType, Priority, LeadSource
)
from app.models.client import Client
from app.models.sales_invoice import SalesInvoice
from app.db.session import get_db
from app.services.monitoring import monitoring_service
from app.services.email import email_service


class CRMService:
    """Service CRM avec intelligence artificielle"""
    
    def __init__(self):
        self.monitoring = monitoring_service
        self.email_service = email_service
    
    async def calculate_lead_score(self, lead: Lead) -> int:
        """
        Calcul automatique du score de lead avec IA
        Score de 0 à 100 basé sur multiples critères
        """
        try:
            score = 0
            scoring_details = {}
            
            # 1. Informations de qualification (max 30 points)
            qualification_score = 0
            
            if lead.company:
                qualification_score += 8
                scoring_details["has_company"] = 8
            
            if lead.job_title:
                qualification_score += 5
                scoring_details["has_job_title"] = 5
            
            if lead.phone:
                qualification_score += 7
                scoring_details["has_phone"] = 7
            
            if lead.industry:
                qualification_score += 5
                scoring_details["has_industry"] = 5
            
            if lead.company_size:
                # Plus la société est grande, plus c'est intéressant
                size_scores = {
                    "1-10": 2,
                    "11-50": 5,
                    "51-200": 8,
                    "200+": 15
                }
                size_score = size_scores.get(lead.company_size, 0)
                qualification_score += size_score
                scoring_details["company_size"] = size_score
            
            score += min(qualification_score, 30)
            
            # 2. Source du lead (max 20 points)
            source_scores = {
                LeadSource.REFERRAL: 20,
                LeadSource.PARTNER: 15,
                LeadSource.TRADE_SHOW: 12,
                LeadSource.WEBSITE: 10,
                LeadSource.SOCIAL_MEDIA: 8,
                LeadSource.EMAIL_MARKETING: 7,
                LeadSource.ADVERTISING: 5,
                LeadSource.COLD_CALLING: 3,
                LeadSource.DIRECT: 5
            }
            source_score = source_scores.get(LeadSource(lead.source), 5)
            score += source_score
            scoring_details["source"] = source_score
            
            # 3. Engagement comportemental (max 25 points)
            engagement_score = 0
            
            # Engagement email
            if lead.email_opens > 0:
                engagement_score += min(lead.email_opens * 2, 10)
                scoring_details["email_opens"] = min(lead.email_opens * 2, 10)
            
            if lead.email_clicks > 0:
                engagement_score += min(lead.email_clicks * 4, 15)
                scoring_details["email_clicks"] = min(lead.email_clicks * 4, 15)
            
            # Visites site web
            if lead.website_visits > 0:
                engagement_score += min(lead.website_visits * 1.5, 8)
                scoring_details["website_visits"] = min(lead.website_visits * 1.5, 8)
            
            score += min(engagement_score, 25)
            
            # 4. Timing et récence (max 15 points)
            timing_score = 0
            
            if lead.last_activity_date:
                days_since_activity = (datetime.utcnow() - lead.last_activity_date).days
                if days_since_activity <= 1:
                    timing_score = 15
                elif days_since_activity <= 3:
                    timing_score = 12
                elif days_since_activity <= 7:
                    timing_score = 8
                elif days_since_activity <= 14:
                    timing_score = 4
                # Plus de 14 jours = 0 point
                
                scoring_details["activity_recency"] = timing_score
            
            score += timing_score
            
            # 5. Budget et timeline (max 10 points)
            intent_score = 0
            
            if lead.budget_range:
                budget_scores = {
                    "< 100k": 2,
                    "100k-500k": 5,
                    "500k-1M": 7,
                    "1M+": 10
                }
                budget_score = budget_scores.get(lead.budget_range, 3)
                intent_score += budget_score
                scoring_details["budget"] = budget_score
            
            if lead.timeline:
                timeline_scores = {
                    "immediate": 8,
                    "1-3months": 6,
                    "3-6months": 4,
                    "6+months": 2
                }
                timeline_score = timeline_scores.get(lead.timeline, 2)
                intent_score += timeline_score
                scoring_details["timeline"] = timeline_score
            
            score += min(intent_score, 10)
            
            # Score final sur 100
            final_score = min(score, 100)
            
            # Déterminer la qualité du lead
            if final_score >= 80:
                quality_grade = "A"
            elif final_score >= 60:
                quality_grade = "B"
            elif final_score >= 40:
                quality_grade = "C"
            else:
                quality_grade = "D"
            
            # Mettre à jour le lead
            lead.score = final_score
            lead.quality_grade = quality_grade
            
            # Log du scoring
            self.monitoring.log_business_event(
                event_type="lead_scored",
                description=f"Lead {lead.full_display_name} scoré: {final_score}/100 (Grade {quality_grade})",
                tenant_id=lead.tenant_id,
                metadata={
                    "lead_id": str(lead.id),
                    "score": final_score,
                    "grade": quality_grade,
                    "scoring_details": scoring_details
                }
            )
            
            return final_score
            
        except Exception as e:
            self.monitoring.log_error(
                error=e,
                context="calculate_lead_score",
                tenant_id=lead.tenant_id,
                extra_data={"lead_id": str(lead.id)}
            )
            return 0
    
    async def get_sales_pipeline(self, tenant_id: str, user_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Récupère le pipeline de vente avec métriques
        """
        try:
            async with AsyncSession() as db:
                # Base query
                query = db.query(Opportunity).filter(Opportunity.tenant_id == tenant_id)
                
                if user_id:
                    query = query.filter(Opportunity.assigned_to == user_id)
                
                opportunities = await query.options(
                    selectinload(Opportunity.lead),
                    selectinload(Opportunity.client),
                    selectinload(Opportunity.assignee)
                ).all()
                
                # Organiser par étape
                pipeline = {
                    OpportunityStage.QUALIFICATION: [],
                    OpportunityStage.NEEDS_ANALYSIS: [],
                    OpportunityStage.PROPOSAL: [],
                    OpportunityStage.NEGOTIATION: [],
                    OpportunityStage.CLOSING: [],
                    OpportunityStage.WON: [],
                    OpportunityStage.LOST: []
                }
                
                total_value = 0
                weighted_value = 0
                
                for opp in opportunities:
                    stage_data = {
                        "id": str(opp.id),
                        "name": opp.name,
                        "amount": float(opp.amount),
                        "probability": opp.probability,
                        "weighted_amount": opp.weighted_amount,
                        "expected_close_date": opp.expected_close_date.isoformat() if opp.expected_close_date else None,
                        "days_in_stage": opp.days_in_stage,
                        "is_stale": opp.is_stale,
                        "client_name": opp.client.name if opp.client else (opp.lead.company if opp.lead else "N/A"),
                        "assignee_name": opp.assignee.full_name if opp.assignee else "Non assigné"
                    }
                    
                    pipeline[OpportunityStage(opp.stage)].append(stage_data)
                    
                    # Calculs métriques
                    total_value += float(opp.amount)
                    if opp.stage not in [OpportunityStage.WON, OpportunityStage.LOST]:
                        weighted_value += opp.weighted_amount
                
                # Métriques du pipeline
                metrics = {
                    "total_opportunities": len(opportunities),
                    "total_value": total_value,
                    "weighted_value": weighted_value,
                    "average_deal_size": total_value / len(opportunities) if opportunities else 0,
                    "conversion_rate": await self._calculate_conversion_rate(tenant_id)
                }
                
                return {
                    "pipeline": pipeline,
                    "metrics": metrics
                }
                
        except Exception as e:
            self.monitoring.log_error(
                error=e,
                context="get_sales_pipeline",
                tenant_id=tenant_id
            )
            raise
    
    async def generate_next_actions(self, user_id: str, tenant_id: str) -> List[Dict[str, Any]]:
        """
        Génère des actions suggérées basées sur l'IA
        """
        actions = []
        
        try:
            async with AsyncSession() as db:
                # 1. Leads froids à relancer
                cold_leads = await db.query(Lead).filter(
                    and_(
                        Lead.tenant_id == tenant_id,
                        Lead.assigned_to == user_id,
                        Lead.status.in_([LeadStatus.NEW, LeadStatus.CONTACTED]),
                        or_(
                            Lead.last_contact_date < datetime.utcnow() - timedelta(days=7),
                            Lead.last_contact_date.is_(None)
                        )
                    )
                ).limit(5).all()
                
                for lead in cold_leads:
                    days_cold = lead.days_since_last_contact or 999
                    priority = "urgent" if days_cold > 14 else "high"
                    
                    actions.append({
                        "type": "call",
                        "priority": priority,
                        "title": f"Relancer {lead.full_display_name}",
                        "description": f"Aucun contact depuis {days_cold} jours",
                        "lead_id": str(lead.id),
                        "estimated_time": 15,
                        "suggested_message": f"Bonjour {lead.first_name}, je fais suite à notre dernier échange..."
                    })
                
                # 2. Opportunités qui stagnent
                stale_opportunities = await db.query(Opportunity).filter(
                    and_(
                        Opportunity.tenant_id == tenant_id,
                        Opportunity.assigned_to == user_id,
                        Opportunity.stage.in_([
                            OpportunityStage.QUALIFICATION,
                            OpportunityStage.PROPOSAL,
                            OpportunityStage.NEGOTIATION
                        ])
                    )
                ).all()
                
                for opp in stale_opportunities:
                    if opp.is_stale:
                        actions.append({
                            "type": "meeting",
                            "priority": "medium",
                            "title": f"Débloquer l'opportunité {opp.name}",
                            "description": f"Stagne depuis {opp.days_in_stage} jours en étape {opp.stage}",
                            "opportunity_id": str(opp.id),
                            "estimated_time": 30,
                            "suggested_action": "Organiser un point avec le client pour identifier les blocages"
                        })
                
                # 3. Leads chauds à convertir rapidement
                hot_leads = await db.query(Lead).filter(
                    and_(
                        Lead.tenant_id == tenant_id,
                        Lead.assigned_to == user_id,
                        Lead.score >= 70,
                        Lead.status == LeadStatus.QUALIFIED
                    )
                ).limit(3).all()
                
                for lead in hot_leads:
                    actions.append({
                        "type": "proposal",
                        "priority": "high",
                        "title": f"Proposer un devis à {lead.full_display_name}",
                        "description": f"Lead chaud (score: {lead.score}/100) - prêt pour conversion",
                        "lead_id": str(lead.id),
                        "estimated_time": 45,
                        "suggested_action": "Préparer et envoyer une proposition commerciale"
                    })
                
                # 4. Suivis de propositions envoyées
                pending_proposals = await db.query(Opportunity).filter(
                    and_(
                        Opportunity.tenant_id == tenant_id,
                        Opportunity.assigned_to == user_id,
                        Opportunity.stage == OpportunityStage.PROPOSAL,
                        Opportunity.expected_close_date <= date.today() + timedelta(days=7)
                    )
                ).all()
                
                for opp in pending_proposals:
                    actions.append({
                        "type": "follow_up",
                        "priority": "medium",
                        "title": f"Suivre la proposition {opp.name}",
                        "description": f"Proposition envoyée, closing prévu le {opp.expected_close_date}",
                        "opportunity_id": str(opp.id),
                        "estimated_time": 20,
                        "suggested_action": "Appeler pour connaître la décision"
                    })
                
                # Trier par priorité
                priority_order = {"urgent": 0, "high": 1, "medium": 2, "low": 3}
                actions.sort(key=lambda x: priority_order.get(x["priority"], 3))
                
                return actions[:10]  # Limiter à 10 actions max
                
        except Exception as e:
            self.monitoring.log_error(
                error=e,
                context="generate_next_actions",
                tenant_id=tenant_id
            )
            return []
    
    async def auto_assign_leads(self, tenant_id: str) -> int:
        """
        Assignation automatique intelligente des leads
        """
        try:
            async with AsyncSession() as db:
                # Récupérer les leads non assignés
                unassigned_leads = await db.query(Lead).filter(
                    and_(
                        Lead.tenant_id == tenant_id,
                        Lead.assigned_to.is_(None),
                        Lead.status == LeadStatus.NEW
                    )
                ).all()
                
                if not unassigned_leads:
                    return 0
                
                # Récupérer les commerciaux actifs
                from app.models.user import User
                salespeople = await db.query(User).filter(
                    and_(
                        User.tenant_id == tenant_id,
                        User.is_active == True,
                        User.role.in_(["sales", "admin"])  # Rôles commerciaux
                    )
                ).all()
                
                if not salespeople:
                    return 0
                
                # Calculer la charge de travail de chaque commercial
                workload = {}
                for person in salespeople:
                    active_leads_count = await db.query(func.count(Lead.id)).filter(
                        and_(
                            Lead.assigned_to == person.id,
                            Lead.status.in_([LeadStatus.NEW, LeadStatus.CONTACTED, LeadStatus.QUALIFIED])
                        )
                    ).scalar()
                    
                    workload[person.id] = active_leads_count
                
                assigned_count = 0
                
                # Assigner en mode round-robin équilibré
                for lead in unassigned_leads:
                    # Trouver le commercial avec le moins de leads
                    least_busy_id = min(workload.keys(), key=lambda k: workload[k])
                    
                    # Assigner le lead
                    lead.assigned_to = least_busy_id
                    workload[least_busy_id] += 1
                    assigned_count += 1
                    
                    # Calculer le score immédiatement
                    await self.calculate_lead_score(lead)
                
                await db.commit()
                
                self.monitoring.log_business_event(
                    event_type="leads_auto_assigned",
                    description=f"{assigned_count} leads assignés automatiquement",
                    tenant_id=tenant_id,
                    metadata={"assigned_count": assigned_count}
                )
                
                return assigned_count
                
        except Exception as e:
            self.monitoring.log_error(
                error=e,
                context="auto_assign_leads",
                tenant_id=tenant_id
            )
            return 0
    
    async def analyze_lead_conversion_funnel(self, tenant_id: str, period_days: int = 30) -> Dict[str, Any]:
        """
        Analyse du funnel de conversion des leads
        """
        try:
            async with AsyncSession() as db:
                start_date = datetime.utcnow() - timedelta(days=period_days)
                
                # Compter les leads par status
                funnel_data = {}
                
                for status in LeadStatus:
                    count = await db.query(func.count(Lead.id)).filter(
                        and_(
                            Lead.tenant_id == tenant_id,
                            Lead.created_at >= start_date,
                            Lead.status == status
                        )
                    ).scalar()
                    
                    funnel_data[status.value] = count
                
                # Calculer les taux de conversion
                total_leads = sum(funnel_data.values())
                conversion_rates = {}
                
                if total_leads > 0:
                    for status, count in funnel_data.items():
                        conversion_rates[status] = (count / total_leads) * 100
                
                # Analyser les goulots d'étranglement
                bottlenecks = []
                
                if conversion_rates.get("qualified", 0) < 30:
                    bottlenecks.append({
                        "stage": "qualification",
                        "issue": "Trop peu de leads qualifiés",
                        "recommendation": "Améliorer la qualification initiale"
                    })
                
                if conversion_rates.get("converted", 0) < 10:
                    bottlenecks.append({
                        "stage": "conversion",
                        "issue": "Taux de conversion faible",
                        "recommendation": "Revoir le processus de closing"
                    })
                
                return {
                    "funnel_data": funnel_data,
                    "conversion_rates": conversion_rates,
                    "total_leads": total_leads,
                    "bottlenecks": bottlenecks,
                    "period_days": period_days
                }
                
        except Exception as e:
            self.monitoring.log_error(
                error=e,
                context="analyze_lead_conversion_funnel",
                tenant_id=tenant_id
            )
            raise
    
    async def send_automated_follow_up(self, lead_id: str) -> bool:
        """
        Envoi automatique de follow-up personnalisé
        """
        try:
            async with AsyncSession() as db:
                lead = await db.query(Lead).filter(Lead.id == lead_id).first()
                
                if not lead:
                    return False
                
                # Générer un message personnalisé basé sur le profil du lead
                message = await self._generate_personalized_message(lead)
                
                # Envoyer l'email
                success = await self.email_service.send_lead_follow_up(
                    lead_email=lead.email,
                    lead_name=lead.first_name,
                    message=message,
                    tenant_id=lead.tenant_id
                )
                
                if success:
                    # Enregistrer l'activité
                    activity = CRMActivity(
                        type=ActivityType.EMAIL,
                        subject=f"Email de suivi automatique",
                        description=message,
                        lead_id=lead_id,
                        assigned_to=lead.assigned_to,
                        tenant_id=lead.tenant_id,
                        is_completed=True,
                        completed_at=datetime.utcnow()
                    )
                    
                    db.add(activity)
                    lead.last_contact_date = datetime.utcnow()
                    lead.last_activity_date = datetime.utcnow()
                    
                    await db.commit()
                
                return success
                
        except Exception as e:
            self.monitoring.log_error(
                error=e,
                context="send_automated_follow_up",
                extra_data={"lead_id": lead_id}
            )
            return False
    
    async def _generate_personalized_message(self, lead: Lead) -> str:
        """
        Génère un message personnalisé basé sur le profil du lead
        """
        # Template de base avec personnalisation
        templates = {
            "high_score": f"""
            Bonjour {lead.first_name},
            
            J'espère que vous allez bien. Je fais suite à notre dernier échange concernant les besoins de {lead.company} en gestion d'entreprise.
            
            Vu l'intérêt que vous avez manifesté, j'aimerais vous proposer une démonstration personnalisée de SEKA qui pourrait parfaitement répondre aux défis de votre secteur d'activité.
            
            Seriez-vous disponible cette semaine pour un entretien de 30 minutes ?
            
            Cordialement,
            """,
            "medium_score": f"""
            Bonjour {lead.first_name},
            
            J'aimerais reprendre contact avec vous concernant les solutions SEKA pour {lead.company}.
            
            Nous avons récemment aidé plusieurs entreprises de votre secteur à optimiser leur gestion. Je pense que cela pourrait vous intéresser.
            
            Auriez-vous 15 minutes pour en discuter ?
            
            Bien à vous,
            """,
            "low_score": f"""
            Bonjour {lead.first_name},
            
            Nous n'avons pas eu l'occasion d'échanger récemment. 
            
            Si vous êtes toujours à la recherche de solutions pour améliorer la gestion de {lead.company or "votre entreprise"}, n'hésitez pas à me contacter.
            
            Je reste disponible pour répondre à vos questions.
            
            Cordialement,
            """
        }
        
        if lead.score >= 70:
            return templates["high_score"]
        elif lead.score >= 40:
            return templates["medium_score"]
        else:
            return templates["low_score"]
    
    async def _calculate_conversion_rate(self, tenant_id: str) -> float:
        """Calcule le taux de conversion global"""
        async with AsyncSession() as db:
            total_leads = await db.query(func.count(Lead.id)).filter(
                Lead.tenant_id == tenant_id
            ).scalar()
            
            if total_leads == 0:
                return 0
            
            converted_leads = await db.query(func.count(Lead.id)).filter(
                and_(
                    Lead.tenant_id == tenant_id,
                    Lead.status == LeadStatus.CONVERTED
                )
            ).scalar()
            
            return (converted_leads / total_leads) * 100


# Instance singleton
crm_service = CRMService()