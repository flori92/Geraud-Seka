"""
CRM routes removed (CRM feature deprecated).
This module kept as an empty router to avoid import errors.
"""

from fastapi import APIRouter

router = APIRouter()
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


@router.get("/leads/")
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
        query = db.query(Lead).filter(Lead.tenant_id == current_tenant.id)
        
        if status:
            query = query.filter(Lead.status == status)
        
        if score_min is not None:
            query = query.filter(Lead.score >= score_min)
        
        if assigned_to:
            query = query.filter(Lead.assigned_to == assigned_to)
        
        leads = query.options(
            selectinload(Lead.assignee),
            selectinload(Lead.activities)
        ).order_by(desc(Lead.score), desc(Lead.created_at)).offset(offset).limit(limit).all()
        
        total_count = query.count()
        
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


@router.get("/opportunities/")
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
    """
    try:
        query = db.query(Opportunity).filter(Opportunity.tenant_id == current_tenant.id)
        
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
        
        opp_list = []
        for opp in opportunities:
            try:
                opp_data = {
                    "id": str(opp.id),
                    "name": opp.name or "Opportunité sans nom",
                    "amount": float(opp.amount or 0),
                    "probability": opp.probability or 0,
                    "weighted_amount": getattr(opp, 'weighted_amount', 0) or 0,
                    "stage": opp.stage,
                    "expected_close_date": opp.expected_close_date.isoformat() if opp.expected_close_date else None,
                    "days_in_stage": getattr(opp, 'days_in_stage', 0),
                    "is_stale": getattr(opp, 'is_stale', False),
                    "client_name": (opp.client.name if opp.client else (opp.lead.company if opp.lead else "N/A")) if hasattr(opp, 'client') else "N/A",
                    "assignee": {
                        "id": str(opp.assignee.id),
                        "name": opp.assignee.full_name
                    } if opp.assignee else None,
                    "created_at": opp.created_at.isoformat() if opp.created_at else datetime.utcnow().isoformat()
                }
                opp_list.append(opp_data)
            except Exception as inner_e:
                continue
        
        return {
            "opportunities": opp_list,
            "count": len(opp_list)
        }
        
    except Exception as e:
        return {
            "opportunities": [],
            "count": 0,
            "error": str(e)
        }


@router.get("/conversion-funnel")
async def get_conversion_funnel(
    period_days: int = Query(30, ge=1, le=365),
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user)
):
    """
    Analyse du funnel de conversion des leads
    """
    try:
        funnel_analysis = await crm_service.analyze_lead_conversion_funnel(
            tenant_id=str(current_tenant.id),
            period_days=period_days
        )
        
        return funnel_analysis
        
    except Exception as e:
        return {
            "stages": [],
            "conversion_rates": {},
            "period_days": period_days,
            "error": str(e)
        }


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
    try:
        lead = db.query(Lead).filter(
            and_(
                Lead.id == lead_id,
                Lead.tenant_id == current_tenant.id
            )
        ).first()
        
        if not lead:
            raise HTTPException(status_code=404, detail="Lead non trouvé")
        
        background_tasks.add_task(
            crm_service.send_automated_follow_up,
            lead_id=lead_id
        )
        
        return {
            "message": f"Follow-up automatique envoyé à {lead.email}",
            "lead_id": str(lead.id)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/activities/")
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
    """
    try:
        start_date = datetime.utcnow() - timedelta(days=days_back)
        
        query = db.query(CRMActivity).filter(
            and_(
                CRMActivity.tenant_id == current_tenant.id,
                CRMActivity.created_at >= start_date
            )
        )
        
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
        
        activity_list = []
        for activity in activities:
            try:
                activity_data = {
                    "id": str(activity.id),
                    "type": activity.type,
                    "subject": activity.subject or "Sans objet",
                    "description": activity.description,
                    "due_date": activity.due_date.isoformat() if activity.due_date else None,
                    "is_completed": getattr(activity, 'is_completed', False),
                    "completed_at": activity.completed_at.isoformat() if getattr(activity, 'completed_at', None) else None,
                    "priority": getattr(activity, 'priority', 'medium'),
                    "outcome": getattr(activity, 'outcome', None),
                    "lead": {
                        "id": str(activity.lead.id),
                        "name": activity.lead.full_display_name
                    } if getattr(activity, 'lead', None) else None,
                    "client": {
                        "id": str(activity.client.id),
                        "name": activity.client.name
                    } if getattr(activity, 'client', None) else None,
                    "opportunity": {
                        "id": str(activity.opportunity.id),
                        "name": activity.opportunity.name
                    } if getattr(activity, 'opportunity', None) else None,
                    "assignee": {
                        "id": str(activity.assignee.id),
                        "name": activity.assignee.full_name
                    } if getattr(activity, 'assignee', None) else None,
                    "created_at": activity.created_at.isoformat() if activity.created_at else datetime.utcnow().isoformat()
                }
                activity_list.append(activity_data)
            except Exception:
                continue
        
        return {
            "activities": activity_list,
            "count": len(activity_list),
            "period_days": days_back
        }
        
    except Exception as e:
        return {
            "activities": [],
            "count": 0,
            "period_days": days_back,
            "error": str(e)
        }


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
        total_leads = db.query(Lead).filter(Lead.tenant_id == current_tenant.id).count()
        
        hot_leads_count = db.query(Lead).filter(
            and_(
                Lead.tenant_id == current_tenant.id,
                Lead.score >= 70
            )
        ).count()
        
        total_opportunities = db.query(Opportunity).filter(
            Opportunity.tenant_id == current_tenant.id
        ).count()
        
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



@router.get("/contacts/", response_model=List[contact_schema.ContactWithRelations])
async def get_contacts(
    client_id: Optional[str] = Query(None),
    lead_id: Optional[str] = Query(None),
    contact_type: Optional[str] = Query(None),
    is_primary: Optional[bool] = Query(None),
    is_active: Optional[bool] = Query(True),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Récupère la liste des contacts avec filtres
    
    - **client_id**: Filtrer par client
    - **lead_id**: Filtrer par lead
    - **contact_type**: Filtrer par type (decision_maker, influencer, etc.)
    - **is_primary**: Filtrer les contacts principaux
    - **is_active**: Filtrer les contacts actifs (défaut: True)
    """
    try:
        query = db.query(Contact).filter(Contact.tenant_id == current_tenant.id)
        
        if client_id:
            query = query.filter(Contact.client_id == client_id)
        
        if lead_id:
            query = query.filter(Contact.lead_id == lead_id)
        
        if contact_type:
            query = query.filter(Contact.contact_type == contact_type)
        
        if is_primary is not None:
            query = query.filter(Contact.is_primary == is_primary)
        
        if is_active is not None:
            query = query.filter(Contact.is_active == is_active)
        
        contacts = query.options(
            selectinload(Contact.client),
            selectinload(Contact.lead),
            selectinload(Contact.assignee)
        ).order_by(desc(Contact.is_primary), Contact.last_name).offset(offset).limit(limit).all()
        
        contact_list = []
        for contact in contacts:
            contact_data = {
                "id": str(contact.id),
                "first_name": contact.first_name,
                "last_name": contact.last_name,
                "full_name": contact.full_display_name,
                "email": contact.email,
                "phone": contact.phone,
                "mobile": contact.mobile,
                "job_title": contact.job_title,
                "department": contact.department,
                "contact_type": contact.contact_type,
                "address": contact.address,
                "city": contact.city,
                "postal_code": contact.postal_code,
                "country": contact.country,
                "preferred_contact_method": contact.preferred_contact_method,
                "language": contact.language,
                "timezone": contact.timezone,
                "linkedin_url": contact.linkedin_url,
                "twitter_handle": contact.twitter_handle,
                "is_primary": contact.is_primary,
                "is_active": contact.is_active,
                "do_not_contact": contact.do_not_contact,
                "email_opt_out": contact.email_opt_out,
                "notes": contact.notes,
                "tags": contact.tags,
                "custom_fields": contact.custom_fields,
                "client_id": str(contact.client_id) if contact.client_id else None,
                "lead_id": str(contact.lead_id) if contact.lead_id else None,
                "assigned_to": str(contact.assigned_to) if contact.assigned_to else None,
                "tenant_id": str(contact.tenant_id),
                "last_contact_date": contact.last_contact_date.isoformat() if contact.last_contact_date else None,
                "last_email_sent": contact.last_email_sent.isoformat() if contact.last_email_sent else None,
                "last_email_opened": contact.last_email_opened.isoformat() if contact.last_email_opened else None,
                "email_bounced": contact.email_bounced,
                "created_at": contact.created_at.isoformat(),
                "updated_at": contact.updated_at.isoformat(),
                "client_name": contact.client.name if contact.client else None,
                "lead_name": contact.lead.full_display_name if contact.lead else None,
                "assignee_name": contact.assignee.full_name if contact.assignee else None,
                "days_since_last_contact": contact.days_since_last_contact,
                "is_engaged": contact.is_engaged
            }
            contact_list.append(contact_data)
        
        return contact_list
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de la récupération des contacts: {str(e)}"
        )


@router.post("/contacts/", response_model=contact_schema.Contact)
async def create_contact(
    contact_in: contact_schema.ContactCreate,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Créer un nouveau contact"""
    try:
        if contact_in.client_id:
            client = db.query(Client).filter(
                and_(
                    Client.id == contact_in.client_id,
                    Client.tenant_id == current_tenant.id
                )
            ).first()
            if not client:
                raise HTTPException(status_code=404, detail="Client non trouvé")
        
        if contact_in.lead_id:
            lead = db.query(Lead).filter(
                and_(
                    Lead.id == contact_in.lead_id,
                    Lead.tenant_id == current_tenant.id
                )
            ).first()
            if not lead:
                raise HTTPException(status_code=404, detail="Lead non trouvé")
        
        contact = Contact(
            **contact_in.model_dump(exclude={'assigned_to'}),
            full_name=f"{contact_in.first_name} {contact_in.last_name}",
            assigned_to=contact_in.assigned_to or current_user.id,
            tenant_id=current_tenant.id
        )
        
        db.add(contact)
        db.commit()
        db.refresh(contact)
        
        return contact
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de la création du contact: {str(e)}"
        )


@router.get("/contacts/{contact_id}", response_model=contact_schema.ContactWithRelations)
async def get_contact(
    contact_id: str,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Récupérer un contact par ID"""
    contact = db.query(Contact).options(
        selectinload(Contact.client),
        selectinload(Contact.lead),
        selectinload(Contact.assignee),
        selectinload(Contact.activities)
    ).filter(
        and_(
            Contact.id == contact_id,
            Contact.tenant_id == current_tenant.id
        )
    ).first()
    
    if not contact:
        raise HTTPException(status_code=404, detail="Contact non trouvé")
    
    return {
        **contact.__dict__,
        "client_name": contact.client.name if contact.client else None,
        "lead_name": contact.lead.full_display_name if contact.lead else None,
        "assignee_name": contact.assignee.full_name if contact.assignee else None,
        "days_since_last_contact": contact.days_since_last_contact,
        "is_engaged": contact.is_engaged
    }


@router.get("/contacts/{contact_id}/timeline")
async def get_contact_timeline(
    contact_id: str,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Récupérer la timeline complète d'un contact avec:
    - Activités CRM
    - Emails envoyés/reçus
    - Opportunités
    - Devis
    - Historique de modifications
    """
    contact = db.query(Contact).options(
        selectinload(Contact.client),
        selectinload(Contact.lead),
        selectinload(Contact.assignee),
        selectinload(Contact.activities)
    ).filter(
        and_(
            Contact.id == contact_id,
            Contact.tenant_id == current_tenant.id
        )
    ).first()
    
    if not contact:
        raise HTTPException(status_code=404, detail="Contact non trouvé")
    
    timeline = []
    
    for activity in contact.activities:
        timeline.append({
            "type": "activity",
            "icon": "activity",
            "title": activity.subject,
            "description": activity.description,
            "activity_type": activity.type,
            "date": activity.created_at.isoformat(),
            "is_completed": activity.is_completed,
            "metadata": {
                "id": str(activity.id),
                "due_date": activity.due_date.isoformat() if activity.due_date else None
            }
        })
    
    if contact.client_id:
        opportunities = db.query(Opportunity).filter(
            Opportunity.client_id == contact.client_id
        ).all()
        
        for opp in opportunities:
            timeline.append({
                "type": "opportunity",
                "icon": "trending-up",
                "title": f"Opportunité: {opp.name}",
                "description": f"Montant: {opp.amount} {opp.currency} - Probabilité: {opp.probability}%",
                "date": opp.created_at.isoformat(),
                "metadata": {
                    "id": str(opp.id),
                    "stage": opp.stage,
                    "status": opp.status,
                    "amount": float(opp.amount)
                }
            })
    
    if contact.client_id:
        quotes = db.query(Quote).filter(
            Quote.client_id == contact.client_id
        ).order_by(desc(Quote.created_at)).limit(10).all()
        
        for quote in quotes:
            timeline.append({
                "type": "quote",
                "icon": "file-text",
                "title": f"Devis {quote.quote_number}",
                "description": f"{quote.title} - {quote.total_ttc} {quote.currency}",
                "date": quote.created_at.isoformat() if quote.created_at else None,
                "metadata": {
                    "id": str(quote.id),
                    "status": quote.status,
                    "total_ttc": float(quote.total_ttc)
                }
            })
    
    timeline.append({
        "type": "created",
        "icon": "user-plus",
        "title": "Contact créé",
        "description": f"Ajouté par {contact.assignee.full_name if contact.assignee else 'Système'}",
        "date": contact.created_at.isoformat(),
        "metadata": {}
    })
    
    timeline.sort(key=lambda x: x["date"], reverse=True)
    
    return {
        "contact_id": str(contact.id),
        "contact_name": contact.full_display_name,
        "timeline": timeline,
        "total_events": len(timeline)
    }


@router.put("/contacts/{contact_id}", response_model=contact_schema.Contact)
async def update_contact(
    contact_id: str,
    contact_in: contact_schema.ContactUpdate,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mettre à jour un contact"""
    contact = db.query(Contact).filter(
        and_(
            Contact.id == contact_id,
            Contact.tenant_id == current_tenant.id
        )
    ).first()
    
    if not contact:
        raise HTTPException(status_code=404, detail="Contact non trouvé")
    
    try:
        update_data = contact_in.model_dump(exclude_unset=True)
        
        if 'first_name' in update_data or 'last_name' in update_data:
            first_name = update_data.get('first_name', contact.first_name)
            last_name = update_data.get('last_name', contact.last_name)
            update_data['full_name'] = f"{first_name} {last_name}"
        
        for field, value in update_data.items():
            setattr(contact, field, value)
        
        db.commit()
        db.refresh(contact)
        
        return contact
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de la mise à jour du contact: {str(e)}"
        )


@router.delete("/contacts/{contact_id}")
async def delete_contact(
    contact_id: str,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Supprimer un contact"""
    contact = db.query(Contact).filter(
        and_(
            Contact.id == contact_id,
            Contact.tenant_id == current_tenant.id
        )
    ).first()
    
    if not contact:
        raise HTTPException(status_code=404, detail="Contact non trouvé")
    
    try:
        db.delete(contact)
        db.commit()
        
        return {"message": "Contact supprimé avec succès", "id": contact_id}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de la suppression du contact: {str(e)}"
        )



@router.get("/opportunities/{opportunity_id}/quotes")
async def get_opportunity_quotes(
    opportunity_id: str,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Récupérer tous les devis liés à une opportunité"""
    opportunity = db.query(Opportunity).filter(
        and_(
            Opportunity.id == opportunity_id,
            Opportunity.tenant_id == current_tenant.id
        )
    ).first()
    
    if not opportunity:
        raise HTTPException(status_code=404, detail="Opportunité non trouvée")
    
    quotes = db.query(Quote).filter(
        and_(
            Quote.opportunity_id == opportunity_id,
            Quote.tenant_id == current_tenant.id
        )
    ).options(
        selectinload(Quote.client),
        selectinload(Quote.user),
        selectinload(Quote.items)
    ).order_by(desc(Quote.created_at)).all()
    
    return {
        "opportunity_id": str(opportunity.id),
        "opportunity_name": opportunity.name,
        "quotes": [
            {
                "id": str(q.id),
                "quote_number": q.quote_number,
                "title": q.title,
                "status": q.status,
                "total_ttc": float(q.total_ttc),
                "currency": q.currency,
                "issue_date": q.issue_date.isoformat() if q.issue_date else None,
                "expiry_date": q.expiry_date.isoformat() if q.expiry_date else None,
                "client_name": q.client.name if q.client else None,
                "created_at": q.created_at.isoformat() if q.created_at else None
            }
            for q in quotes
        ]
    }


@router.post("/opportunities/{opportunity_id}/convert-to-quote")
async def convert_opportunity_to_quote(
    opportunity_id: str,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Convertir une opportunité en devis
    Crée automatiquement un devis pré-rempli depuis l'opportunité
    """
    opportunity = db.query(Opportunity).filter(
        and_(
            Opportunity.id == opportunity_id,
            Opportunity.tenant_id == current_tenant.id
        )
    ).first()
    
    if not opportunity:
        raise HTTPException(status_code=404, detail="Opportunité non trouvée")
    
    if not opportunity.client_id:
        raise HTTPException(
            status_code=400,
            detail="L'opportunité doit être liée à un client pour créer un devis"
        )
    
    try:
        from datetime import date
        year = date.today().year
        last_quote = db.query(Quote).filter(
            Quote.tenant_id == current_tenant.id
        ).order_by(desc(Quote.created_at)).first()
        
        if last_quote and last_quote.quote_number:
            try:
                last_num = int(last_quote.quote_number.split('-')[-1])
                new_num = last_num + 1
            except:
                new_num = 1
        else:
            new_num = 1
        
        quote_number = f"QUOTE-{year}-{new_num:04d}"
        
        from decimal import Decimal
        from datetime import timedelta
        
        new_quote = Quote(
            quote_number=quote_number,
            tenant_id=current_tenant.id,
            client_id=opportunity.client_id,
            user_id=opportunity.assigned_to,
            opportunity_id=opportunity.id,
            title=opportunity.name,
            description=opportunity.description or "",
            status=QuoteStatus.DRAFT,
            issue_date=date.today(),
            expiry_date=date.today() + timedelta(days=30),
            total_ht=Decimal(str(opportunity.amount)),
            total_ttc=Decimal(str(opportunity.amount)),
            currency="XOF",
            validity_days=30,
            internal_notes=f"Devis créé depuis l'opportunité: {opportunity.name}"
        )
        
        db.add(new_quote)
        db.commit()
        db.refresh(new_quote)
        
        opportunity.stage = OpportunityStage.PROPOSAL
        db.commit()
        
        return {
            "message": "Devis créé avec succès",
            "quote_id": str(new_quote.id),
            "quote_number": new_quote.quote_number,
            "opportunity_updated": True
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de la création du devis: {str(e)}"
        )


@router.get("/opportunities/{opportunity_id}/summary")
async def get_opportunity_summary(
    opportunity_id: str,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Récupérer un résumé complet de l'opportunité avec:
    - Informations de base
    - Activités récentes
    - Devis associés
    - Lead source
    """
    opportunity = db.query(Opportunity).options(
        selectinload(Opportunity.lead),
        selectinload(Opportunity.client),
        selectinload(Opportunity.assignee),
        selectinload(Opportunity.activities),
        selectinload(Opportunity.quotes)
    ).filter(
        and_(
            Opportunity.id == opportunity_id,
            Opportunity.tenant_id == current_tenant.id
        )
    ).first()
    
    if not opportunity:
        raise HTTPException(status_code=404, detail="Opportunité non trouvée")
    
    recent_activities = sorted(
        opportunity.activities,
        key=lambda x: x.created_at,
        reverse=True
    )[:5]
    
    return {
        "id": str(opportunity.id),
        "name": opportunity.name,
        "amount": float(opportunity.amount),
        "probability": opportunity.probability,
        "stage": opportunity.stage,
        "status": opportunity.status,
        "expected_close_date": opportunity.expected_close_date.isoformat() if opportunity.expected_close_date else None,
        "weighted_amount": opportunity.weighted_amount,
        "days_in_stage": opportunity.days_in_stage,
        "is_stale": opportunity.is_stale,
        "lead": {
            "id": str(opportunity.lead.id),
            "name": opportunity.lead.full_display_name,
            "company": opportunity.lead.company
        } if opportunity.lead else None,
        "client": {
            "id": str(opportunity.client.id),
            "name": opportunity.client.name
        } if opportunity.client else None,
        "assignee": {
            "id": str(opportunity.assignee.id),
            "name": opportunity.assignee.full_name
        } if opportunity.assignee else None,
        "recent_activities": [
            {
                "id": str(a.id),
                "type": a.type,
                "subject": a.subject,
                "created_at": a.created_at.isoformat()
            }
            for a in recent_activities
        ],
        "quotes": [
            {
                "id": str(q.id),
                "quote_number": q.quote_number,
                "status": q.status,
                "total_ttc": float(q.total_ttc),
                "created_at": q.created_at.isoformat() if q.created_at else None
            }
            for q in opportunity.quotes
        ],
        "quote_count": len(opportunity.quotes),
        "activity_count": len(opportunity.activities)
    }



@router.get("/reports/performance")
async def get_performance_report(
    user_id: Optional[str] = Query(None),
    period: str = Query("month"),  # month, quarter, year
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Rapport de performance commerciale par utilisateur
    Métriques: leads, opportunités, devis, taux de conversion
    """
    from datetime import timedelta
    
    now = datetime.utcnow()
    if period == "month":
        start_date = now - timedelta(days=30)
    elif period == "quarter":
        start_date = now - timedelta(days=90)
    elif period == "year":
        start_date = now - timedelta(days=365)
    else:
        start_date = now - timedelta(days=30)
    
    query_filter = and_(
        Opportunity.tenant_id == current_tenant.id,
        Opportunity.created_at >= start_date
    )
    
    if user_id:
        query_filter = and_(query_filter, Opportunity.assigned_to == user_id)
    
    opportunities = db.query(Opportunity).filter(query_filter).all()
    
    lead_query_filter = and_(
        Lead.tenant_id == current_tenant.id,
        Lead.created_at >= start_date
    )
    if user_id:
        lead_query_filter = and_(lead_query_filter, Lead.assigned_to == user_id)
    
    leads = db.query(Lead).filter(lead_query_filter).all()
    
    total_leads = len(leads)
    qualified_leads = len([l for l in leads if l.status in [LeadStatus.QUALIFIED, LeadStatus.CONVERTED]])
    converted_leads = len([l for l in leads if l.status == LeadStatus.CONVERTED])
    
    total_opportunities = len(opportunities)
    won_opportunities = len([o for o in opportunities if o.status == "won"])
    lost_opportunities = len([o for o in opportunities if o.status == "lost"])
    
    total_value = sum(float(o.amount) for o in opportunities)
    won_value = sum(float(o.amount) for o in opportunities if o.status == "won")
    
    lead_conversion_rate = (converted_leads / total_leads * 100) if total_leads > 0 else 0
    opportunity_win_rate = (won_opportunities / total_opportunities * 100) if total_opportunities > 0 else 0
    
    by_stage = {}
    for stage in OpportunityStage:
        count = len([o for o in opportunities if o.stage == stage])
        by_stage[stage] = count
    
    return {
        "period": period,
        "start_date": start_date.isoformat(),
        "end_date": now.isoformat(),
        "user_id": user_id,
        "leads": {
            "total": total_leads,
            "qualified": qualified_leads,
            "converted": converted_leads,
            "conversion_rate": round(lead_conversion_rate, 2)
        },
        "opportunities": {
            "total": total_opportunities,
            "won": won_opportunities,
            "lost": lost_opportunities,
            "in_progress": total_opportunities - won_opportunities - lost_opportunities,
            "win_rate": round(opportunity_win_rate, 2),
            "by_stage": by_stage
        },
        "revenue": {
            "total_pipeline": round(total_value, 2),
            "won_revenue": round(won_value, 2),
            "average_deal_size": round(total_value / total_opportunities, 2) if total_opportunities > 0 else 0
        }
    }


@router.get("/reports/pipeline")
async def get_pipeline_report(
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Analyse du pipeline de ventes
    Vue d'ensemble des opportunités par étape avec métriques
    """
    opportunities = db.query(Opportunity).filter(
        and_(
            Opportunity.tenant_id == current_tenant.id,
            Opportunity.status.in_(["open", "in_progress"])
        )
    ).all()
    
    pipeline = {}
    total_value = 0
    total_weighted_value = 0
    
    for stage in OpportunityStage:
        stage_opps = [o for o in opportunities if o.stage == stage]
        stage_value = sum(float(o.amount) for o in stage_opps)
        stage_weighted = sum(o.weighted_amount for o in stage_opps)
        
        pipeline[stage] = {
            "count": len(stage_opps),
            "total_value": round(stage_value, 2),
            "weighted_value": round(stage_weighted, 2),
            "average_probability": round(sum(o.probability for o in stage_opps) / len(stage_opps), 2) if stage_opps else 0,
            "opportunities": [
                {
                    "id": str(o.id),
                    "name": o.name,
                    "amount": float(o.amount),
                    "probability": o.probability,
                    "weighted_amount": o.weighted_amount,
                    "days_in_stage": o.days_in_stage,
                    "is_stale": o.is_stale
                }
                for o in stage_opps[:5]  # Top 5 par étape
            ]
        }
        
        total_value += stage_value
        total_weighted_value += stage_weighted
    
    return {
        "total_opportunities": len(opportunities),
        "total_pipeline_value": round(total_value, 2),
        "total_weighted_value": round(total_weighted_value, 2),
        "pipeline_by_stage": pipeline,
        "health_metrics": {
            "stale_opportunities": len([o for o in opportunities if o.is_stale]),
            "high_value_deals": len([o for o in opportunities if float(o.amount) > 1000000]),
            "closing_soon": len([o for o in opportunities if o.expected_close_date and (o.expected_close_date - datetime.utcnow().date()).days <= 30])
        }
    }


@router.get("/reports/forecast")
async def get_sales_forecast(
    months: int = Query(3, ge=1, le=12),
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Prévisions de ventes basées sur le pipeline actuel
    Projection sur X mois avec différents scénarios
    """
    from datetime import timedelta
    from dateutil.relativedelta import relativedelta
    
    opportunities = db.query(Opportunity).filter(
        and_(
            Opportunity.tenant_id == current_tenant.id,
            Opportunity.status.in_(["open", "in_progress"])
        )
    ).all()
    
    six_months_ago = datetime.utcnow() - relativedelta(months=6)
    historical_won = db.query(Opportunity).filter(
        and_(
            Opportunity.tenant_id == current_tenant.id,
            Opportunity.status == "won",
            Opportunity.actual_close_date >= six_months_ago.date()
        )
    ).all()
    
    total_historical = db.query(func.count(Opportunity.id)).filter(
        and_(
            Opportunity.tenant_id == current_tenant.id,
            Opportunity.created_at >= six_months_ago
        )
    ).scalar()
    
    historical_win_rate = (len(historical_won) / total_historical * 100) if total_historical > 0 else 30
    
    monthly_revenue = {}
    for i in range(6):
        month_start = datetime.utcnow() - relativedelta(months=i+1)
        month_end = datetime.utcnow() - relativedelta(months=i)
        
        month_won = [o for o in historical_won if month_start.date() <= o.actual_close_date < month_end.date()]
        monthly_revenue[month_start.strftime("%Y-%m")] = sum(float(o.amount) for o in month_won)
    
    avg_monthly_revenue = sum(monthly_revenue.values()) / 6 if monthly_revenue else 0
    
    forecasts = []
    now = datetime.utcnow()
    
    for i in range(months):
        forecast_month = now + relativedelta(months=i+1)
        month_key = forecast_month.strftime("%Y-%m")
        
        month_opportunities = [
            o for o in opportunities 
            if o.expected_close_date and 
            o.expected_close_date.month == forecast_month.month and
            o.expected_close_date.year == forecast_month.year
        ]
        
        optimistic = sum(float(o.amount) for o in month_opportunities)  # 100% des opportunités
        realistic = sum(o.weighted_amount for o in month_opportunities)  # Basé sur probabilité
        conservative = realistic * (historical_win_rate / 100)  # Basé sur taux historique
        
        forecasts.append({
            "month": month_key,
            "opportunity_count": len(month_opportunities),
            "scenarios": {
                "optimistic": round(optimistic, 2),
                "realistic": round(realistic, 2),
                "conservative": round(conservative, 2)
            },
            "trend": round(avg_monthly_revenue, 2)
        })
    
    return {
        "forecast_period": f"{months} mois",
        "historical_win_rate": round(historical_win_rate, 2),
        "average_monthly_revenue": round(avg_monthly_revenue, 2),
        "current_pipeline_value": round(sum(float(o.amount) for o in opportunities), 2),
        "forecasts": forecasts,
        "recommendations": [
            "Augmenter le nombre de leads qualifiés" if len(opportunities) < 10 else None,
            "Accélérer les opportunités stagnantes" if len([o for o in opportunities if o.is_stale]) > 5 else None,
            "Focus sur la conversion" if historical_win_rate < 25 else None
        ]
    }


@router.get("/reports/conversion-funnel")
async def get_conversion_funnel(
    period: str = Query("month"),
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Analyse du funnel de conversion
    Lead → Opportunité → Devis → Vente
    """
    from datetime import timedelta
    
    now = datetime.utcnow()
    if period == "month":
        start_date = now - timedelta(days=30)
    elif period == "quarter":
        start_date = now - timedelta(days=90)
    else:
        start_date = now - timedelta(days=365)
    
    total_leads = db.query(func.count(Lead.id)).filter(
        and_(
            Lead.tenant_id == current_tenant.id,
            Lead.created_at >= start_date
        )
    ).scalar()
    
    qualified_leads = db.query(func.count(Lead.id)).filter(
        and_(
            Lead.tenant_id == current_tenant.id,
            Lead.created_at >= start_date,
            Lead.status == LeadStatus.QUALIFIED
        )
    ).scalar()
    
    total_opportunities = db.query(func.count(Opportunity.id)).filter(
        and_(
            Opportunity.tenant_id == current_tenant.id,
            Opportunity.created_at >= start_date
        )
    ).scalar()
    
    total_quotes = db.query(func.count(Quote.id)).filter(
        and_(
            Quote.tenant_id == current_tenant.id,
            Quote.created_at >= start_date
        )
    ).scalar()
    
    accepted_quotes = db.query(func.count(Quote.id)).filter(
        and_(
            Quote.tenant_id == current_tenant.id,
            Quote.created_at >= start_date,
            Quote.status == QuoteStatus.ACCEPTED
        )
    ).scalar()
    
    won_opportunities = db.query(func.count(Opportunity.id)).filter(
        and_(
            Opportunity.tenant_id == current_tenant.id,
            Opportunity.created_at >= start_date,
            Opportunity.status == "won"
        )
    ).scalar()
    
    lead_to_opportunity = (total_opportunities / total_leads * 100) if total_leads > 0 else 0
    opportunity_to_quote = (total_quotes / total_opportunities * 100) if total_opportunities > 0 else 0
    quote_to_sale = (accepted_quotes / total_quotes * 100) if total_quotes > 0 else 0
    overall_conversion = (won_opportunities / total_leads * 100) if total_leads > 0 else 0
    
    return {
        "period": period,
        "funnel": [
            {
                "stage": "Leads",
                "count": total_leads,
                "conversion_rate": 100,
                "drop_off": 0
            },
            {
                "stage": "Leads qualifiés",
                "count": qualified_leads,
                "conversion_rate": round((qualified_leads / total_leads * 100) if total_leads > 0 else 0, 2),
                "drop_off": total_leads - qualified_leads
            },
            {
                "stage": "Opportunités",
                "count": total_opportunities,
                "conversion_rate": round(lead_to_opportunity, 2),
                "drop_off": total_leads - total_opportunities
            },
            {
                "stage": "Devis",
                "count": total_quotes,
                "conversion_rate": round(opportunity_to_quote, 2),
                "drop_off": total_opportunities - total_quotes
            },
            {
                "stage": "Ventes",
                "count": won_opportunities,
                "conversion_rate": round(quote_to_sale, 2),
                "drop_off": total_quotes - won_opportunities
            }
        ],
        "overall_conversion_rate": round(overall_conversion, 2),
        "bottlenecks": [
            {"stage": "Lead → Opportunité", "rate": round(lead_to_opportunity, 2)},
            {"stage": "Opportunité → Devis", "rate": round(opportunity_to_quote, 2)},
            {"stage": "Devis → Vente", "rate": round(quote_to_sale, 2)}
        ]
    }