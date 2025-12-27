"""
CRM service removed — lightweight compatibility shim.

This module provides a minimal `CRMService` stub so other modules
that import `app.services.crm` do not crash after the CRM feature
was removed. Implementations are intentionally no-ops and return
safe defaults.
"""

from typing import Dict, Any, List, Optional


class CRMService:
    """Stub CRM service used for compatibility after removal."""

    def __init__(self):
        pass

    async def calculate_lead_score(self, lead) -> int:
        return 0

    async def get_sales_pipeline(self, tenant_id: str, user_id: Optional[str] = None) -> Dict[str, Any]:
        return {"pipeline": []}

    async def get_opportunity(self, opportunity_id: str):
        return None

    async def find_hot_leads(self, tenant_id: str) -> List:
        return []


crm_service = CRMService()
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
                    
                    total_value += float(opp.amount)
                    if opp.stage not in [OpportunityStage.WON, OpportunityStage.LOST]:
                        weighted_value += opp.weighted_amount
                
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
                unassigned_leads = await db.query(Lead).filter(
                    and_(
                        Lead.tenant_id == tenant_id,
                        Lead.assigned_to.is_(None),
                        Lead.status == LeadStatus.NEW
                    )
                ).all()
                
                if not unassigned_leads:
                    return 0
                
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
                
                for lead in unassigned_leads:
                    least_busy_id = min(workload.keys(), key=lambda k: workload[k])
                    
                    lead.assigned_to = least_busy_id
                    workload[least_busy_id] += 1
                    assigned_count += 1
                    
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
                
                total_leads = sum(funnel_data.values())
                conversion_rates = {}
                
                if total_leads > 0:
                    for status, count in funnel_data.items():
                        conversion_rates[status] = (count / total_leads) * 100
                
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
                
                message = await self._generate_personalized_message(lead)
                
                success = await self.email_service.send_lead_follow_up(
                    lead_email=lead.email,
                    lead_name=lead.first_name,
                    message=message,
                    tenant_id=lead.tenant_id
                )
                
                if success:
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


crm_service = CRMService()