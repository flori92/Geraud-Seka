"""
Email tracking routes removed (CRM feature deprecated).
This module kept as an empty router to avoid import errors.
"""

from fastapi import APIRouter

router = APIRouter()

TRACKING_PIXEL = bytes([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00,
    0x0A, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
    0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49,
    0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
])


def generate_tracking_token() -> str:
    """Génère un token de tracking unique et sécurisé"""
    return secrets.token_urlsafe(32)


def parse_user_agent(user_agent: str) -> dict:
    """Parse le User-Agent pour extraire device, browser, OS"""
    result = {
        "device_type": "desktop",
        "browser": "unknown",
        "os": "unknown"
    }
    
    if not user_agent:
        return result
    
    ua_lower = user_agent.lower()
    
    if "mobile" in ua_lower or "android" in ua_lower and "mobile" in ua_lower:
        result["device_type"] = "mobile"
    elif "tablet" in ua_lower or "ipad" in ua_lower:
        result["device_type"] = "tablet"
    
    if "chrome" in ua_lower and "edg" not in ua_lower:
        result["browser"] = "Chrome"
    elif "firefox" in ua_lower:
        result["browser"] = "Firefox"
    elif "safari" in ua_lower and "chrome" not in ua_lower:
        result["browser"] = "Safari"
    elif "edg" in ua_lower:
        result["browser"] = "Edge"
    elif "opera" in ua_lower or "opr" in ua_lower:
        result["browser"] = "Opera"
    
    if "windows" in ua_lower:
        result["os"] = "Windows"
    elif "mac os" in ua_lower or "macintosh" in ua_lower:
        result["os"] = "macOS"
    elif "linux" in ua_lower and "android" not in ua_lower:
        result["os"] = "Linux"
    elif "android" in ua_lower:
        result["os"] = "Android"
    elif "iphone" in ua_lower or "ipad" in ua_lower:
        result["os"] = "iOS"
    
    return result



@router.get("/open/{token}.png")
async def track_email_open(
    token: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Pixel de tracking d'ouverture email
    Retourne une image PNG transparente 1x1
    """
    try:
        tracking = db.query(EmailTracking).filter(
            EmailTracking.tracking_token == token
        ).first()
        
        if tracking:
            tracking.open_count += 1
            tracking.last_opened_at = datetime.utcnow()
            if not tracking.first_opened_at:
                tracking.first_opened_at = datetime.utcnow()
            
            user_agent = request.headers.get("user-agent", "")
            ua_info = parse_user_agent(user_agent)
            
            event = EmailEvent(
                tracking_id=tracking.id,
                event_type=EmailEventType.OPENED,
                user_agent=user_agent[:500] if user_agent else None,
                ip_address=request.client.host if request.client else None,
                device_type=ua_info["device_type"],
                browser=ua_info["browser"],
                os=ua_info["os"]
            )
            db.add(event)
            
            if tracking.lead_id:
                lead = db.query(Lead).filter(Lead.id == tracking.lead_id).first()
                """
                Email tracking routes removed (CRM feature deprecated).
                Empty router kept for compatibility.
                """

                from fastapi import APIRouter

                router = APIRouter()

@router.get("/click/{token}")
async def track_email_click(
    token: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Tracking de clic sur un lien dans l'email
    Redirige vers l'URL de destination après enregistrement
    """
    link = db.query(EmailLink).filter(
        EmailLink.link_token == token
    ).first()
    
    if not link:
        raise HTTPException(status_code=404, detail="Lien non trouvé")
    
    try:
        link.click_count += 1
        
        tracking = link.tracking
        if tracking:
            tracking.click_count += 1
            tracking.last_clicked_at = datetime.utcnow()
            if not tracking.first_clicked_at:
                tracking.first_clicked_at = datetime.utcnow()
            
            user_agent = request.headers.get("user-agent", "")
            ua_info = parse_user_agent(user_agent)
            
            event = EmailEvent(
                tracking_id=tracking.id,
                event_type=EmailEventType.CLICKED,
                clicked_url=link.original_url,
                user_agent=user_agent[:500] if user_agent else None,
                ip_address=request.client.host if request.client else None,
                device_type=ua_info["device_type"],
                browser=ua_info["browser"],
                os=ua_info["os"]
            )
            db.add(event)
            
            if tracking.lead_id:
                lead = db.query(Lead).filter(Lead.id == tracking.lead_id).first()
                if lead:
                    lead.email_clicks = (lead.email_clicks or 0) + 1
                    lead.last_activity_date = datetime.utcnow()
            
            if tracking.contact_id:
                contact = db.query(Contact).filter(Contact.id == tracking.contact_id).first()
                if contact:
                    contact.last_contact_date = datetime.utcnow()
        
        db.commit()
    except Exception as e:
        print(f"Error tracking email click: {e}")
        db.rollback()
    
    return RedirectResponse(url=link.original_url, status_code=302)



class CreateTrackingRequest(BaseModel):
    """Requête pour créer un tracking email"""
    recipient_email: str
    subject: str
    lead_id: Optional[str] = None
    contact_id: Optional[str] = None
    campaign_id: Optional[str] = None
    template_name: Optional[str] = None


class CreateTrackingResponse(BaseModel):
    """Réponse avec les URLs de tracking"""
    tracking_id: str
    tracking_token: str
    open_pixel_url: str
    base_click_url: str


@router.post("/create", response_model=CreateTrackingResponse)
async def create_email_tracking(
    data: CreateTrackingRequest,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Créer un nouveau tracking pour un email à envoyer
    Retourne les URLs de tracking à insérer dans l'email
    """
    token = generate_tracking_token()
    
    tracking = EmailTracking(
        tracking_token=token,
        recipient_email=data.recipient_email,
        subject=data.subject,
        lead_id=data.lead_id,
        contact_id=data.contact_id,
        campaign_id=data.campaign_id,
        template_name=data.template_name,
        tenant_id=current_tenant.id,
        sent_by=current_user.id
    )
    
    db.add(tracking)
    db.commit()
    db.refresh(tracking)
    
    base_url = "https://www.sekagestion.com/api/v1/email"
    
    return CreateTrackingResponse(
        tracking_id=str(tracking.id),
        tracking_token=token,
        open_pixel_url=f"{base_url}/open/{token}.png",
        base_click_url=f"{base_url}/click"
    )


class CreateLinkRequest(BaseModel):
    """Requête pour créer un lien tracké"""
    tracking_id: str
    original_url: str


class CreateLinkResponse(BaseModel):
    """Réponse avec l'URL trackée"""
    link_token: str
    tracked_url: str


@router.post("/link", response_model=CreateLinkResponse)
async def create_tracked_link(
    data: CreateLinkRequest,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Créer un lien tracké pour un email
    """
    tracking = db.query(EmailTracking).filter(
        and_(
            EmailTracking.id == data.tracking_id,
            EmailTracking.tenant_id == current_tenant.id
        )
    ).first()
    
    if not tracking:
        raise HTTPException(status_code=404, detail="Tracking non trouvé")
    
    link_token = generate_tracking_token()
    
    link = EmailLink(
        link_token=link_token,
        tracking_id=tracking.id,
        original_url=data.original_url
    )
    
    db.add(link)
    db.commit()
    
    base_url = "https://www.sekagestion.com/api/v1/email"
    
    return CreateLinkResponse(
        link_token=link_token,
        tracked_url=f"{base_url}/click/{link_token}"
    )


@router.get("/stats")
async def get_email_stats(
    lead_id: Optional[str] = Query(None),
    contact_id: Optional[str] = Query(None),
    campaign_id: Optional[str] = Query(None),
    days: int = Query(30, ge=1, le=365),
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Statistiques d'engagement email
    Filtrable par lead, contact ou campagne
    """
    from datetime import timedelta
    
    query = db.query(EmailTracking).filter(
        EmailTracking.tenant_id == current_tenant.id,
        EmailTracking.created_at >= datetime.utcnow() - timedelta(days=days)
    )
    
    if lead_id:
        query = query.filter(EmailTracking.lead_id == lead_id)
    if contact_id:
        query = query.filter(EmailTracking.contact_id == contact_id)
    if campaign_id:
        query = query.filter(EmailTracking.campaign_id == campaign_id)
    
    trackings = query.all()
    
    total_sent = len(trackings)
    total_opened = len([t for t in trackings if t.open_count > 0])
    total_clicked = len([t for t in trackings if t.click_count > 0])
    total_bounced = len([t for t in trackings if t.is_bounced])
    
    total_opens = sum(t.open_count for t in trackings)
    total_clicks = sum(t.click_count for t in trackings)
    
    open_rate = (total_opened / total_sent * 100) if total_sent > 0 else 0
    click_rate = (total_clicked / total_sent * 100) if total_sent > 0 else 0
    click_to_open_rate = (total_clicked / total_opened * 100) if total_opened > 0 else 0
    bounce_rate = (total_bounced / total_sent * 100) if total_sent > 0 else 0
    
    return {
        "period_days": days,
        "totals": {
            "sent": total_sent,
            "opened": total_opened,
            "clicked": total_clicked,
            "bounced": total_bounced,
            "total_opens": total_opens,
            "total_clicks": total_clicks
        },
        "rates": {
            "open_rate": round(open_rate, 2),
            "click_rate": round(click_rate, 2),
            "click_to_open_rate": round(click_to_open_rate, 2),
            "bounce_rate": round(bounce_rate, 2)
        },
        "filters": {
            "lead_id": lead_id,
            "contact_id": contact_id,
            "campaign_id": campaign_id
        }
    }


@router.get("/history/{entity_type}/{entity_id}")
async def get_email_history(
    entity_type: str,  # "lead" ou "contact"
    entity_id: str,
    limit: int = Query(20, ge=1, le=100),
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Historique des emails envoyés à un lead ou contact
    """
    if entity_type not in ["lead", "contact"]:
        raise HTTPException(status_code=400, detail="entity_type doit être 'lead' ou 'contact'")
    
    query = db.query(EmailTracking).filter(
        EmailTracking.tenant_id == current_tenant.id
    )
    
    if entity_type == "lead":
        query = query.filter(EmailTracking.lead_id == entity_id)
    else:
        query = query.filter(EmailTracking.contact_id == entity_id)
    
    trackings = query.order_by(desc(EmailTracking.created_at)).limit(limit).all()
    
    return {
        "entity_type": entity_type,
        "entity_id": entity_id,
        "emails": [
            {
                "id": str(t.id),
                "subject": t.subject,
                "recipient_email": t.recipient_email,
                "sent_at": t.created_at.isoformat() if t.created_at else None,
                "open_count": t.open_count,
                "click_count": t.click_count,
                "first_opened_at": t.first_opened_at.isoformat() if t.first_opened_at else None,
                "last_opened_at": t.last_opened_at.isoformat() if t.last_opened_at else None,
                "first_clicked_at": t.first_clicked_at.isoformat() if t.first_clicked_at else None,
                "is_bounced": t.is_bounced,
                "campaign_id": t.campaign_id,
                "template_name": t.template_name
            }
            for t in trackings
        ],
        "total": len(trackings)
    }


@router.get("/events/{tracking_id}")
async def get_tracking_events(
    tracking_id: str,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Détail des événements pour un email spécifique
    """
    tracking = db.query(EmailTracking).filter(
        and_(
            EmailTracking.id == tracking_id,
            EmailTracking.tenant_id == current_tenant.id
        )
    ).first()
    
    if not tracking:
        raise HTTPException(status_code=404, detail="Tracking non trouvé")
    
    events = db.query(EmailEvent).filter(
        EmailEvent.tracking_id == tracking_id
    ).order_by(desc(EmailEvent.occurred_at)).all()
    
    return {
        "tracking_id": tracking_id,
        "subject": tracking.subject,
        "recipient_email": tracking.recipient_email,
        "sent_at": tracking.created_at.isoformat() if tracking.created_at else None,
        "summary": {
            "open_count": tracking.open_count,
            "click_count": tracking.click_count,
            "is_bounced": tracking.is_bounced
        },
        "events": [
            {
                "id": str(e.id),
                "type": e.event_type,
                "occurred_at": e.occurred_at.isoformat() if e.occurred_at else None,
                "clicked_url": e.clicked_url,
                "device_type": e.device_type,
                "browser": e.browser,
                "os": e.os,
                "ip_address": e.ip_address
            }
            for e in events
        ],
        "total_events": len(events)
    }
