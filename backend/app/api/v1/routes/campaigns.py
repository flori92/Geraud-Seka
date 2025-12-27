"""
Campaigns routes removed (CRM feature deprecated).
This module kept as an empty router to avoid import errors.
"""

from fastapi import APIRouter

router = APIRouter()



class TemplateCreate(BaseModel):
    name: str
    description: Optional[str] = None
    category: str = "marketing"
    subject: str
    html_content: str
    text_content: Optional[str] = None
    preview_text: Optional[str] = None
    available_variables: Optional[List[str]] = None


class TemplateUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    subject: Optional[str] = None
    html_content: Optional[str] = None
    text_content: Optional[str] = None
    preview_text: Optional[str] = None
    is_active: Optional[bool] = None


class CampaignCreate(BaseModel):
    name: str
    description: Optional[str] = None
    template_id: Optional[str] = None
    subject: Optional[str] = None
    html_content: Optional[str] = None
    text_content: Optional[str] = None
    from_name: Optional[str] = None
    from_email: Optional[str] = None
    reply_to: Optional[str] = None
    segment_id: Optional[str] = None
    target_entity_type: str = "lead"
    scheduled_at: Optional[datetime] = None


class CampaignUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    subject: Optional[str] = None
    html_content: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    status: Optional[str] = None



def render_template(html: str, variables: dict) -> str:
    """Remplace les variables {{var}} dans le template"""
    for key, value in variables.items():
        html = html.replace(f"{{{{{key}}}}}", str(value) if value else "")
    return html


def extract_variables(html: str) -> List[str]:
    """Extrait les variables {{var}} d'un template"""
    pattern = r'\{\{(\w+)\}\}'
    return list(set(re.findall(pattern, html)))


def get_entity_variables(entity, entity_type: str) -> dict:
    """Récupère les variables d'une entité pour le template"""
    if entity_type == "lead":
        return {
            "first_name": entity.first_name,
            "last_name": entity.last_name,
            "full_name": entity.full_name or f"{entity.first_name} {entity.last_name}",
            "email": entity.email,
            "company": entity.company,
            "job_title": entity.job_title,
            "phone": entity.phone,
            "city": entity.city,
            "country": entity.country,
        }
    elif entity_type == "contact":
        return {
            "first_name": entity.first_name,
            "last_name": entity.last_name,
            "full_name": entity.full_name or f"{entity.first_name} {entity.last_name}",
            "email": entity.email,
            "job_title": entity.job_title,
            "department": entity.department,
            "phone": entity.phone,
            "city": entity.city,
            "country": entity.country,
        }
    elif entity_type == "client":
        return {
            "name": entity.name,
            "email": entity.email,
            "phone": entity.phone,
            "city": entity.city,
            "country": entity.country,
            "company": entity.name,
        }
    return {}



@router.get("/templates")
async def list_templates(
    category: Optional[str] = Query(None),
    is_active: bool = Query(True),
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Liste tous les templates email"""
    query = db.query(EmailTemplate).filter(
        EmailTemplate.tenant_id == current_tenant.id
    )
    
    if category:
        query = query.filter(EmailTemplate.category == category)
    if is_active is not None:
        query = query.filter(EmailTemplate.is_active == is_active)
    
    templates = query.order_by(EmailTemplate.name).all()
    
    return [
        {
            "id": str(t.id),
            "name": t.name,
            "description": t.description,
            "category": t.category,
            "subject": t.subject,
            "preview_text": t.preview_text,
            "is_active": t.is_active,
            "is_system": t.is_system,
            "usage_count": t.usage_count,
            "available_variables": t.available_variables or [],
            "created_at": t.created_at.isoformat() if t.created_at else None
        }
        for t in templates
    ]


@router.post("/templates")
async def create_template(
    data: TemplateCreate,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Créer un nouveau template email"""
    variables = data.available_variables or extract_variables(data.html_content)
    
    template = EmailTemplate(
        name=data.name,
        description=data.description,
        category=data.category,
        subject=data.subject,
        html_content=data.html_content,
        text_content=data.text_content,
        preview_text=data.preview_text,
        available_variables=variables,
        tenant_id=current_tenant.id,
        created_by=current_user.id
    )
    
    db.add(template)
    db.commit()
    db.refresh(template)
    
    return {
        "id": str(template.id),
        "name": template.name,
        "available_variables": variables,
        "message": "Template créé avec succès"
    }


@router.get("/templates/{template_id}")
async def get_template(
    template_id: str,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Détails d'un template"""
    template = db.query(EmailTemplate).filter(
        and_(
            EmailTemplate.id == template_id,
            EmailTemplate.tenant_id == current_tenant.id
        )
    ).first()
    
    if not template:
        raise HTTPException(status_code=404, detail="Template non trouvé")
    
    return {
        "id": str(template.id),
        "name": template.name,
        "description": template.description,
        "category": template.category,
        "subject": template.subject,
        "html_content": template.html_content,
        "text_content": template.text_content,
        "preview_text": template.preview_text,
        "available_variables": template.available_variables or [],
        "is_active": template.is_active,
        "is_system": template.is_system,
        "usage_count": template.usage_count,
        "created_at": template.created_at.isoformat() if template.created_at else None,
        "created_by": template.creator.full_name if template.creator else None
    }


@router.put("/templates/{template_id}")
async def update_template(
    template_id: str,
    data: TemplateUpdate,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Modifier un template"""
    template = db.query(EmailTemplate).filter(
        and_(
            EmailTemplate.id == template_id,
            EmailTemplate.tenant_id == current_tenant.id
        )
    ).first()
    
    if not template:
        raise HTTPException(status_code=404, detail="Template non trouvé")
    
    if template.is_system:
        raise HTTPException(status_code=403, detail="Les templates système ne peuvent pas être modifiés")
    
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(template, field, value)
    
    if data.html_content:
        template.available_variables = extract_variables(data.html_content)
    
    db.commit()
    
    return {"message": "Template mis à jour", "id": str(template.id)}


@router.delete("/templates/{template_id}")
async def delete_template(
    template_id: str,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Supprimer un template"""
    template = db.query(EmailTemplate).filter(
        and_(
            EmailTemplate.id == template_id,
            EmailTemplate.tenant_id == current_tenant.id
        )
    ).first()
    
    if not template:
        raise HTTPException(status_code=404, detail="Template non trouvé")
    
    if template.is_system:
        raise HTTPException(status_code=403, detail="Les templates système ne peuvent pas être supprimés")
    
    db.delete(template)
    db.commit()
    
    return {"message": "Template supprimé"}


@router.post("/templates/{template_id}/preview")
async def preview_template(
    template_id: str,
    variables: dict = {},
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Prévisualiser un template avec des variables de test"""
    template = db.query(EmailTemplate).filter(
        and_(
            EmailTemplate.id == template_id,
            EmailTemplate.tenant_id == current_tenant.id
        )
    ).first()
    
    if not template:
        raise HTTPException(status_code=404, detail="Template non trouvé")
    
    test_vars = {
        "first_name": "Jean",
        "last_name": "Dupont",
        "full_name": "Jean Dupont",
        "email": "jean.dupont@example.com",
        "company": "Entreprise Test",
        "job_title": "Directeur",
        "phone": "+33 1 23 45 67 89",
        "city": "Paris",
        "country": "France",
        "unsubscribe_link": "#",
        **variables
    }
    
    rendered_subject = render_template(template.subject, test_vars)
    rendered_html = render_template(template.html_content, test_vars)
    
    return {
        "subject": rendered_subject,
        "html_content": rendered_html,
        "variables_used": test_vars
    }



@router.get("/")
async def list_campaigns(
    status: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Liste toutes les campagnes"""
    query = db.query(EmailCampaign).filter(
        EmailCampaign.tenant_id == current_tenant.id
    )
    
    if status:
        query = query.filter(EmailCampaign.status == status)
    
    total = query.count()
    campaigns = query.order_by(desc(EmailCampaign.created_at)).offset(offset).limit(limit).all()
    
    return {
        "total": total,
        "campaigns": [
            {
                "id": str(c.id),
                "name": c.name,
                "description": c.description,
                "status": c.status,
                "subject": c.subject,
                "template_name": c.template.name if c.template else None,
                "segment_name": c.segment.name if c.segment else None,
                "target_entity_type": c.target_entity_type,
                "total_recipients": c.total_recipients,
                "sent_count": c.sent_count,
                "opened_count": c.opened_count,
                "clicked_count": c.clicked_count,
                "open_rate": c.open_rate,
                "click_rate": c.click_rate,
                "scheduled_at": c.scheduled_at.isoformat() if c.scheduled_at else None,
                "started_at": c.started_at.isoformat() if c.started_at else None,
                "completed_at": c.completed_at.isoformat() if c.completed_at else None,
                "created_at": c.created_at.isoformat() if c.created_at else None
            }
            for c in campaigns
        ]
    }


@router.post("/")
async def create_campaign(
    data: CampaignCreate,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Créer une nouvelle campagne"""
    if data.template_id:
        template = db.query(EmailTemplate).filter(
            and_(
                EmailTemplate.id == data.template_id,
                EmailTemplate.tenant_id == current_tenant.id
            )
        ).first()
        if not template:
            raise HTTPException(status_code=404, detail="Template non trouvé")
    
    if data.segment_id:
        segment = db.query(Segment).filter(
            and_(
                Segment.id == data.segment_id,
                Segment.tenant_id == current_tenant.id
            )
        ).first()
        if not segment:
            raise HTTPException(status_code=404, detail="Segment non trouvé")
    
    status = CampaignStatus.SCHEDULED if data.scheduled_at else CampaignStatus.DRAFT
    
    campaign = EmailCampaign(
        name=data.name,
        description=data.description,
        template_id=data.template_id,
        subject=data.subject,
        html_content=data.html_content,
        text_content=data.text_content,
        from_name=data.from_name,
        from_email=data.from_email,
        reply_to=data.reply_to,
        segment_id=data.segment_id,
        target_entity_type=data.target_entity_type,
        status=status,
        scheduled_at=data.scheduled_at,
        tenant_id=current_tenant.id,
        created_by=current_user.id
    )
    
    db.add(campaign)
    db.commit()
    db.refresh(campaign)
    
    return {
        "id": str(campaign.id),
        "name": campaign.name,
        "status": campaign.status,
        "message": "Campagne créée avec succès"
    }


@router.get("/{campaign_id}")
async def get_campaign(
    campaign_id: str,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Détails d'une campagne"""
    campaign = db.query(EmailCampaign).filter(
        and_(
            EmailCampaign.id == campaign_id,
            EmailCampaign.tenant_id == current_tenant.id
        )
    ).first()
    
    if not campaign:
        raise HTTPException(status_code=404, detail="Campagne non trouvée")
    
    return {
        "id": str(campaign.id),
        "name": campaign.name,
        "description": campaign.description,
        "status": campaign.status,
        "subject": campaign.subject,
        "html_content": campaign.html_content,
        "text_content": campaign.text_content,
        "from_name": campaign.from_name,
        "from_email": campaign.from_email,
        "reply_to": campaign.reply_to,
        "template": {
            "id": str(campaign.template.id),
            "name": campaign.template.name
        } if campaign.template else None,
        "segment": {
            "id": str(campaign.segment.id),
            "name": campaign.segment.name,
            "member_count": campaign.segment.member_count
        } if campaign.segment else None,
        "target_entity_type": campaign.target_entity_type,
        "scheduled_at": campaign.scheduled_at.isoformat() if campaign.scheduled_at else None,
        "started_at": campaign.started_at.isoformat() if campaign.started_at else None,
        "completed_at": campaign.completed_at.isoformat() if campaign.completed_at else None,
        "stats": {
            "total_recipients": campaign.total_recipients,
            "sent_count": campaign.sent_count,
            "delivered_count": campaign.delivered_count,
            "opened_count": campaign.opened_count,
            "clicked_count": campaign.clicked_count,
            "bounced_count": campaign.bounced_count,
            "unsubscribed_count": campaign.unsubscribed_count,
            "open_rate": campaign.open_rate,
            "click_rate": campaign.click_rate,
            "bounce_rate": campaign.bounce_rate
        },
        "created_at": campaign.created_at.isoformat() if campaign.created_at else None,
        "created_by": campaign.creator.full_name if campaign.creator else None
    }


@router.put("/{campaign_id}")
async def update_campaign(
    campaign_id: str,
    data: CampaignUpdate,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Modifier une campagne (seulement si brouillon)"""
    campaign = db.query(EmailCampaign).filter(
        and_(
            EmailCampaign.id == campaign_id,
            EmailCampaign.tenant_id == current_tenant.id
        )
    ).first()
    
    if not campaign:
        raise HTTPException(status_code=404, detail="Campagne non trouvée")
    
    if campaign.status not in [CampaignStatus.DRAFT, CampaignStatus.SCHEDULED]:
        raise HTTPException(status_code=400, detail="Seules les campagnes en brouillon ou programmées peuvent être modifiées")
    
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(campaign, field, value)
    
    db.commit()
    
    return {"message": "Campagne mise à jour", "id": str(campaign.id)}


@router.delete("/{campaign_id}")
async def delete_campaign(
    campaign_id: str,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Supprimer une campagne"""
    campaign = db.query(EmailCampaign).filter(
        and_(
            EmailCampaign.id == campaign_id,
            EmailCampaign.tenant_id == current_tenant.id
        )
    ).first()
    
    if not campaign:
        raise HTTPException(status_code=404, detail="Campagne non trouvée")
    
    if campaign.status == CampaignStatus.SENDING:
        raise HTTPException(status_code=400, detail="Impossible de supprimer une campagne en cours d'envoi")
    
    db.delete(campaign)
    db.commit()
    
    return {"message": "Campagne supprimée"}



@router.post("/{campaign_id}/prepare")
async def prepare_campaign(
    campaign_id: str,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Préparer les destinataires d'une campagne"""
    campaign = db.query(EmailCampaign).filter(
        and_(
            EmailCampaign.id == campaign_id,
            EmailCampaign.tenant_id == current_tenant.id
        )
    ).first()
    
    if not campaign:
        raise HTTPException(status_code=404, detail="Campagne non trouvée")
    
    if campaign.status not in [CampaignStatus.DRAFT, CampaignStatus.SCHEDULED]:
        raise HTTPException(status_code=400, detail="La campagne ne peut pas être préparée dans cet état")
    
    db.query(CampaignRecipient).filter(
        CampaignRecipient.campaign_id == campaign_id
    ).delete()
    
    recipients = []
    
    if campaign.segment_id:
        memberships = db.query(SegmentMembership).filter(
            SegmentMembership.segment_id == campaign.segment_id
        ).all()
        
        for m in memberships:
            if campaign.target_entity_type == "lead" and m.lead_id:
                lead = db.query(Lead).get(m.lead_id)
                if lead and lead.email:
                    recipients.append({
                        "lead_id": lead.id,
                        "email": lead.email
                    })
            elif campaign.target_entity_type == "contact" and m.contact_id:
                contact = db.query(Contact).get(m.contact_id)
                if contact and contact.email and not contact.email_opt_out:
                    recipients.append({
                        "contact_id": contact.id,
                        "email": contact.email
                    })
            elif campaign.target_entity_type == "client" and m.client_id:
                client = db.query(Client).get(m.client_id)
                if client and client.email:
                    recipients.append({
                        "client_id": client.id,
                        "email": client.email
                    })
    else:
        if campaign.target_entity_type == "lead":
            leads = db.query(Lead).filter(Lead.tenant_id == current_tenant.id).all()
            for lead in leads:
                if lead.email:
                    recipients.append({"lead_id": lead.id, "email": lead.email})
        elif campaign.target_entity_type == "contact":
            contacts = db.query(Contact).filter(
                and_(
                    Contact.tenant_id == current_tenant.id,
                    Contact.email_opt_out == False
                )
            ).all()
            for contact in contacts:
                if contact.email:
                    recipients.append({"contact_id": contact.id, "email": contact.email})
        elif campaign.target_entity_type == "client":
            clients = db.query(Client).filter(Client.tenant_id == current_tenant.id).all()
            for client in clients:
                if client.email:
                    recipients.append({"client_id": client.id, "email": client.email})
    
    seen_emails = set()
    unique_recipients = []
    for r in recipients:
        if r["email"].lower() not in seen_emails:
            seen_emails.add(r["email"].lower())
            unique_recipients.append(r)
    
    for r in unique_recipients:
        recipient = CampaignRecipient(
            campaign_id=campaign.id,
            lead_id=r.get("lead_id"),
            contact_id=r.get("contact_id"),
            client_id=r.get("client_id"),
            email=r["email"],
            status="pending"
        )
        db.add(recipient)
    
    campaign.total_recipients = len(unique_recipients)
    db.commit()
    
    return {
        "message": f"Campagne préparée avec {len(unique_recipients)} destinataires",
        "total_recipients": len(unique_recipients)
    }


@router.post("/{campaign_id}/send")
async def send_campaign(
    campaign_id: str,
    background_tasks: BackgroundTasks,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lancer l'envoi d'une campagne"""
    campaign = db.query(EmailCampaign).filter(
        and_(
            EmailCampaign.id == campaign_id,
            EmailCampaign.tenant_id == current_tenant.id
        )
    ).first()
    
    if not campaign:
        raise HTTPException(status_code=404, detail="Campagne non trouvée")
    
    if campaign.status not in [CampaignStatus.DRAFT, CampaignStatus.SCHEDULED]:
        raise HTTPException(status_code=400, detail="La campagne ne peut pas être envoyée dans cet état")
    
    if campaign.total_recipients == 0:
        raise HTTPException(status_code=400, detail="Aucun destinataire. Préparez d'abord la campagne.")
    
    subject = campaign.subject
    html_content = campaign.html_content
    
    if campaign.template:
        subject = subject or campaign.template.subject
        html_content = html_content or campaign.template.html_content
    
    if not subject or not html_content:
        raise HTTPException(status_code=400, detail="Sujet et contenu HTML requis")
    
    campaign.status = CampaignStatus.SENDING
    campaign.started_at = datetime.utcnow()
    db.commit()
    
    background_tasks.add_task(
        send_campaign_emails,
        campaign_id=str(campaign.id),
        tenant_id=str(current_tenant.id)
    )
    
    return {
        "message": "Envoi de la campagne lancé",
        "campaign_id": str(campaign.id),
        "total_recipients": campaign.total_recipients
    }


async def send_campaign_emails(campaign_id: str, tenant_id: str):
    """Tâche d'arrière-plan pour envoyer les emails"""
    from app.db.session import SessionLocal
    
    db = SessionLocal()
    email_service = EmailService()
    
    try:
        campaign = db.query(EmailCampaign).get(campaign_id)
        if not campaign:
            return
        
        subject = campaign.subject or (campaign.template.subject if campaign.template else "")
        html_content = campaign.html_content or (campaign.template.html_content if campaign.template else "")
        
        recipients = db.query(CampaignRecipient).filter(
            and_(
                CampaignRecipient.campaign_id == campaign_id,
                CampaignRecipient.status == "pending"
            )
        ).all()
        
        sent_count = 0
        
        for recipient in recipients:
            try:
                entity = None
                entity_type = campaign.target_entity_type
                
                if recipient.lead_id:
                    entity = db.query(Lead).get(recipient.lead_id)
                elif recipient.contact_id:
                    entity = db.query(Contact).get(recipient.contact_id)
                elif recipient.client_id:
                    entity = db.query(Client).get(recipient.client_id)
                
                variables = get_entity_variables(entity, entity_type) if entity else {}
                variables["unsubscribe_link"] = f"https://www.sekagestion.com/unsubscribe/{recipient.id}"
                
                rendered_subject = render_template(subject, variables)
                rendered_html = render_template(html_content, variables)
                
                result = await email_service.send_tracked_email(
                    db=db,
                    to=recipient.email,
                    subject=rendered_subject,
                    html=rendered_html,
                    tenant_id=tenant_id,
                    lead_id=str(recipient.lead_id) if recipient.lead_id else None,
                    contact_id=str(recipient.contact_id) if recipient.contact_id else None,
                    campaign_id=campaign_id,
                    template_name=campaign.template.name if campaign.template else None,
                    sent_by=str(campaign.created_by) if campaign.created_by else None
                )
                
                recipient.status = "sent"
                recipient.sent_at = datetime.utcnow()
                if "tracking_id" in result:
                    recipient.tracking_id = result["tracking_id"]
                
                sent_count += 1
                
            except Exception as e:
                recipient.status = "failed"
                recipient.error_message = str(e)
            
            db.commit()
        
        campaign.sent_count = sent_count
        campaign.status = CampaignStatus.SENT
        campaign.completed_at = datetime.utcnow()
        db.commit()
        
    except Exception as e:
        print(f"Erreur envoi campagne: {e}")
    finally:
        db.close()


@router.post("/{campaign_id}/pause")
async def pause_campaign(
    campaign_id: str,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mettre en pause une campagne en cours"""
    campaign = db.query(EmailCampaign).filter(
        and_(
            EmailCampaign.id == campaign_id,
            EmailCampaign.tenant_id == current_tenant.id
        )
    ).first()
    
    if not campaign:
        raise HTTPException(status_code=404, detail="Campagne non trouvée")
    
    if campaign.status != CampaignStatus.SENDING:
        raise HTTPException(status_code=400, detail="Seules les campagnes en cours peuvent être mises en pause")
    
    campaign.status = CampaignStatus.PAUSED
    db.commit()
    
    return {"message": "Campagne mise en pause"}



@router.get("/{campaign_id}/stats")
async def get_campaign_stats(
    campaign_id: str,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Statistiques détaillées d'une campagne"""
    campaign = db.query(EmailCampaign).filter(
        and_(
            EmailCampaign.id == campaign_id,
            EmailCampaign.tenant_id == current_tenant.id
        )
    ).first()
    
    if not campaign:
        raise HTTPException(status_code=404, detail="Campagne non trouvée")
    
    status_counts = db.query(
        CampaignRecipient.status,
        func.count(CampaignRecipient.id)
    ).filter(
        CampaignRecipient.campaign_id == campaign_id
    ).group_by(CampaignRecipient.status).all()
    
    status_dict = {s: c for s, c in status_counts}
    
    
    return {
        "campaign_id": campaign_id,
        "campaign_name": campaign.name,
        "status": campaign.status,
        "overview": {
            "total_recipients": campaign.total_recipients,
            "sent": campaign.sent_count,
            "delivered": campaign.delivered_count,
            "opened": campaign.opened_count,
            "clicked": campaign.clicked_count,
            "bounced": campaign.bounced_count,
            "unsubscribed": campaign.unsubscribed_count
        },
        "rates": {
            "open_rate": campaign.open_rate,
            "click_rate": campaign.click_rate,
            "bounce_rate": campaign.bounce_rate,
            "click_to_open_rate": round((campaign.clicked_count / campaign.opened_count) * 100, 2) if campaign.opened_count > 0 else 0
        },
        "by_status": status_dict,
        "timeline": {
            "created_at": campaign.created_at.isoformat() if campaign.created_at else None,
            "scheduled_at": campaign.scheduled_at.isoformat() if campaign.scheduled_at else None,
            "started_at": campaign.started_at.isoformat() if campaign.started_at else None,
            "completed_at": campaign.completed_at.isoformat() if campaign.completed_at else None
        }
    }


@router.get("/{campaign_id}/recipients")
async def get_campaign_recipients(
    campaign_id: str,
    status: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Liste des destinataires d'une campagne"""
    campaign = db.query(EmailCampaign).filter(
        and_(
            EmailCampaign.id == campaign_id,
            EmailCampaign.tenant_id == current_tenant.id
        )
    ).first()
    
    if not campaign:
        raise HTTPException(status_code=404, detail="Campagne non trouvée")
    
    query = db.query(CampaignRecipient).filter(
        CampaignRecipient.campaign_id == campaign_id
    )
    
    if status:
        query = query.filter(CampaignRecipient.status == status)
    
    total = query.count()
    recipients = query.offset(offset).limit(limit).all()
    
    return {
        "total": total,
        "recipients": [
            {
                "id": str(r.id),
                "email": r.email,
                "status": r.status,
                "sent_at": r.sent_at.isoformat() if r.sent_at else None,
                "opened": r.opened,
                "opened_at": r.opened_at.isoformat() if r.opened_at else None,
                "clicked": r.clicked,
                "clicked_at": r.clicked_at.isoformat() if r.clicked_at else None,
                "error_message": r.error_message,
                "entity_type": "lead" if r.lead_id else ("contact" if r.contact_id else "client"),
                "entity_name": (
                    r.lead.full_name if r.lead else
                    (r.contact.full_name if r.contact else
                     (r.client.name if r.client else None))
                )
            }
            for r in recipients
        ]
    }
