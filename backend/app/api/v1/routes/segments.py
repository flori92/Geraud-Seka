"""
Segments routes removed (CRM feature deprecated).
Empty router kept for compatibility.
"""

from fastapi import APIRouter

router = APIRouter()


# ==================== SCHEMAS ====================

class RuleCreate(BaseModel):
    field: str
    operator: str
    value: Optional[str] = None
    value_type: str = "string"
    order: int = 0


class SegmentCreate(BaseModel):
    name: str
    description: Optional[str] = None
    color: str = "#3B82F6"
    icon: str = "users"
    segment_type: str = "static"
    entity_type: str = "lead"
    rules_logic: str = "AND"
    rules: Optional[List[RuleCreate]] = None


class SegmentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None
    rules_logic: Optional[str] = None
    is_active: Optional[bool] = None


class AddMembersRequest(BaseModel):
    entity_ids: List[str]


# ==================== HELPERS ====================

def evaluate_rule(entity, rule: SegmentRule) -> bool:
    """Évalue si une entité correspond à une règle"""
    field_value = getattr(entity, rule.field, None)
    rule_value = rule.value
    
    # Conversion selon le type
    if rule.value_type == "number" and rule_value:
        try:
            rule_value = float(rule_value)
            field_value = float(field_value) if field_value else 0
        except:
            return False
    elif rule.value_type == "boolean":
        rule_value = rule_value.lower() == "true" if rule_value else False
    elif rule.value_type == "list" and rule_value:
        try:
            rule_value = json.loads(rule_value)
        except:
            rule_value = [rule_value]
    
    # Évaluation selon l'opérateur
    op = rule.operator
    
    if op == RuleOperator.EQUALS:
        return str(field_value).lower() == str(rule_value).lower() if field_value else False
    elif op == RuleOperator.NOT_EQUALS:
        return str(field_value).lower() != str(rule_value).lower() if field_value else True
    elif op == RuleOperator.CONTAINS:
        return str(rule_value).lower() in str(field_value).lower() if field_value else False
    elif op == RuleOperator.NOT_CONTAINS:
        return str(rule_value).lower() not in str(field_value).lower() if field_value else True
    elif op == RuleOperator.STARTS_WITH:
        return str(field_value).lower().startswith(str(rule_value).lower()) if field_value else False
    elif op == RuleOperator.ENDS_WITH:
        return str(field_value).lower().endswith(str(rule_value).lower()) if field_value else False
    elif op == RuleOperator.GREATER_THAN:
        return field_value > rule_value if field_value is not None else False
    elif op == RuleOperator.LESS_THAN:
        return field_value < rule_value if field_value is not None else False
    elif op == RuleOperator.GREATER_OR_EQUAL:
        return field_value >= rule_value if field_value is not None else False
    elif op == RuleOperator.LESS_OR_EQUAL:
        return field_value <= rule_value if field_value is not None else False
    elif op == RuleOperator.IS_EMPTY:
        return not field_value
    elif op == RuleOperator.IS_NOT_EMPTY:
        return bool(field_value)
    elif op == RuleOperator.IN_LIST:
        return str(field_value).lower() in [str(v).lower() for v in rule_value] if field_value else False
    elif op == RuleOperator.NOT_IN_LIST:
        return str(field_value).lower() not in [str(v).lower() for v in rule_value] if field_value else True
    elif op == RuleOperator.DAYS_AGO_LESS_THAN:
        if not field_value or not isinstance(field_value, datetime):
            return False
        days_ago = (datetime.utcnow() - field_value).days
        return days_ago < int(rule_value)
    elif op == RuleOperator.DAYS_AGO_MORE_THAN:
        if not field_value or not isinstance(field_value, datetime):
            return False
        days_ago = (datetime.utcnow() - field_value).days
        return days_ago > int(rule_value)
    
    return False


def get_entity_model(entity_type: str):
    """Retourne le modèle SQLAlchemy pour un type d'entité"""
    if entity_type == SegmentEntityType.LEAD:
        return Lead
    elif entity_type == SegmentEntityType.CONTACT:
        return Contact
    elif entity_type == SegmentEntityType.CLIENT:
        return Client
    raise ValueError(f"Type d'entité inconnu: {entity_type}")


def get_membership_field(entity_type: str) -> str:
    """Retourne le nom du champ de membership pour un type d'entité"""
    if entity_type == SegmentEntityType.LEAD:
        return "lead_id"
    elif entity_type == SegmentEntityType.CONTACT:
        return "contact_id"
    elif entity_type == SegmentEntityType.CLIENT:
        return "client_id"
    raise ValueError(f"Type d'entité inconnu: {entity_type}")


# ==================== ROUTES SEGMENTS ====================

@router.get("/")
async def list_segments(
    entity_type: Optional[str] = Query(None),
    segment_type: Optional[str] = Query(None),
    is_active: bool = Query(True),
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Liste tous les segments du tenant"""
    query = db.query(Segment).filter(
        Segment.tenant_id == current_tenant.id
    )
    
    if entity_type:
        query = query.filter(Segment.entity_type == entity_type)
    if segment_type:
        query = query.filter(Segment.segment_type == segment_type)
    if is_active is not None:
        query = query.filter(Segment.is_active == is_active)
    
    segments = query.order_by(Segment.name).all()
    
    return [
        {
            "id": str(s.id),
            "name": s.name,
            "description": s.description,
            "color": s.color,
            "icon": s.icon,
            "segment_type": s.segment_type,
            "entity_type": s.entity_type,
            "rules_logic": s.rules_logic,
            "is_active": s.is_active,
            "is_system": s.is_system,
            "member_count": s.member_count,
            "rule_count": len(s.rules),
            "last_computed_at": s.last_computed_at.isoformat() if s.last_computed_at else None,
            "created_at": s.created_at.isoformat() if s.created_at else None
        }
        for s in segments
    ]


@router.post("/")
async def create_segment(
    data: SegmentCreate,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Créer un nouveau segment"""
    # Créer le segment
    segment = Segment(
        name=data.name,
        description=data.description,
        color=data.color,
        icon=data.icon,
        segment_type=data.segment_type,
        entity_type=data.entity_type,
        rules_logic=data.rules_logic,
        tenant_id=current_tenant.id,
        created_by=current_user.id
    )
    
    db.add(segment)
    db.flush()
    
    # Ajouter les règles si segment dynamique
    if data.rules and data.segment_type == SegmentType.DYNAMIC:
        for i, rule_data in enumerate(data.rules):
            rule = SegmentRule(
                segment_id=segment.id,
                field=rule_data.field,
                operator=rule_data.operator,
                value=rule_data.value,
                value_type=rule_data.value_type,
                order=rule_data.order or i
            )
            db.add(rule)
    
    db.commit()
    db.refresh(segment)
    
    return {
        "id": str(segment.id),
        "name": segment.name,
        "segment_type": segment.segment_type,
        "entity_type": segment.entity_type,
        "message": "Segment créé avec succès"
    }


@router.get("/{segment_id}")
async def get_segment(
    segment_id: str,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Détails d'un segment"""
    segment = db.query(Segment).filter(
        and_(
            Segment.id == segment_id,
            Segment.tenant_id == current_tenant.id
        )
    ).first()
    
    if not segment:
        raise HTTPException(status_code=404, detail="Segment non trouvé")
    
    return {
        "id": str(segment.id),
        "name": segment.name,
        "description": segment.description,
        "color": segment.color,
        "icon": segment.icon,
        "segment_type": segment.segment_type,
        "entity_type": segment.entity_type,
        "rules_logic": segment.rules_logic,
        "is_active": segment.is_active,
        "is_system": segment.is_system,
        "member_count": segment.member_count,
        "last_computed_at": segment.last_computed_at.isoformat() if segment.last_computed_at else None,
        "created_at": segment.created_at.isoformat() if segment.created_at else None,
        "rules": [
            {
                "id": str(r.id),
                "field": r.field,
                "operator": r.operator,
                "value": r.value,
                "value_type": r.value_type,
                "order": r.order
            }
            for r in sorted(segment.rules, key=lambda x: x.order)
        ]
    }


@router.put("/{segment_id}")
async def update_segment(
    segment_id: str,
    data: SegmentUpdate,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mettre à jour un segment"""
    segment = db.query(Segment).filter(
        and_(
            Segment.id == segment_id,
            Segment.tenant_id == current_tenant.id
        )
    ).first()
    
    if not segment:
        raise HTTPException(status_code=404, detail="Segment non trouvé")
    
    if segment.is_system:
        raise HTTPException(status_code=403, detail="Les segments système ne peuvent pas être modifiés")
    
    # Mise à jour des champs
    if data.name is not None:
        segment.name = data.name
    if data.description is not None:
        segment.description = data.description
    if data.color is not None:
        segment.color = data.color
    if data.icon is not None:
        segment.icon = data.icon
    if data.rules_logic is not None:
        segment.rules_logic = data.rules_logic
    if data.is_active is not None:
        segment.is_active = data.is_active
    
    db.commit()
    
    return {"message": "Segment mis à jour", "id": str(segment.id)}


@router.delete("/{segment_id}")
async def delete_segment(
    segment_id: str,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Supprimer un segment"""
    segment = db.query(Segment).filter(
        and_(
            Segment.id == segment_id,
            Segment.tenant_id == current_tenant.id
        )
    ).first()
    
    if not segment:
        raise HTTPException(status_code=404, detail="Segment non trouvé")
    
    if segment.is_system:
        raise HTTPException(status_code=403, detail="Les segments système ne peuvent pas être supprimés")
    
    db.delete(segment)
    db.commit()
    
    return {"message": "Segment supprimé"}


# ==================== ROUTES RÈGLES ====================

@router.post("/{segment_id}/rules")
async def add_rule(
    segment_id: str,
    data: RuleCreate,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Ajouter une règle à un segment dynamique"""
    segment = db.query(Segment).filter(
        and_(
            Segment.id == segment_id,
            Segment.tenant_id == current_tenant.id
        )
    ).first()
    
    if not segment:
        raise HTTPException(status_code=404, detail="Segment non trouvé")
    
    if segment.segment_type != SegmentType.DYNAMIC:
        raise HTTPException(status_code=400, detail="Les règles ne peuvent être ajoutées qu'aux segments dynamiques")
    
    rule = SegmentRule(
        segment_id=segment.id,
        field=data.field,
        operator=data.operator,
        value=data.value,
        value_type=data.value_type,
        order=data.order
    )
    
    db.add(rule)
    db.commit()
    
    return {"message": "Règle ajoutée", "rule_id": str(rule.id)}


@router.delete("/{segment_id}/rules/{rule_id}")
async def delete_rule(
    segment_id: str,
    rule_id: str,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Supprimer une règle"""
    segment = db.query(Segment).filter(
        and_(
            Segment.id == segment_id,
            Segment.tenant_id == current_tenant.id
        )
    ).first()
    
    if not segment:
        raise HTTPException(status_code=404, detail="Segment non trouvé")
    
    rule = db.query(SegmentRule).filter(
        and_(
            SegmentRule.id == rule_id,
            SegmentRule.segment_id == segment_id
        )
    ).first()
    
    if not rule:
        raise HTTPException(status_code=404, detail="Règle non trouvée")
    
    db.delete(rule)
    db.commit()
    
    return {"message": "Règle supprimée"}


# ==================== ROUTES MEMBRES ====================

@router.get("/{segment_id}/members")
async def get_segment_members(
    segment_id: str,
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Liste les membres d'un segment"""
    segment = db.query(Segment).filter(
        and_(
            Segment.id == segment_id,
            Segment.tenant_id == current_tenant.id
        )
    ).first()
    
    if not segment:
        raise HTTPException(status_code=404, detail="Segment non trouvé")
    
    # Récupérer les memberships
    memberships = db.query(SegmentMembership).filter(
        SegmentMembership.segment_id == segment_id
    ).offset(offset).limit(limit).all()
    
    members = []
    for m in memberships:
        member_data = {
            "membership_id": str(m.id),
            "added_at": m.added_at.isoformat() if m.added_at else None
        }
        
        if m.lead_id and m.lead:
            member_data.update({
                "entity_type": "lead",
                "entity_id": str(m.lead_id),
                "name": m.lead.full_display_name,
                "email": m.lead.email,
                "company": m.lead.company,
                "status": m.lead.status
            })
        elif m.contact_id and m.contact:
            member_data.update({
                "entity_type": "contact",
                "entity_id": str(m.contact_id),
                "name": m.contact.full_display_name,
                "email": m.contact.email,
                "job_title": m.contact.job_title
            })
        elif m.client_id and m.client:
            member_data.update({
                "entity_type": "client",
                "entity_id": str(m.client_id),
                "name": m.client.name,
                "email": m.client.email
            })
        
        members.append(member_data)
    
    return {
        "segment_id": segment_id,
        "segment_name": segment.name,
        "entity_type": segment.entity_type,
        "total_members": segment.member_count,
        "members": members,
        "limit": limit,
        "offset": offset
    }


@router.post("/{segment_id}/members")
async def add_members(
    segment_id: str,
    data: AddMembersRequest,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Ajouter des membres à un segment statique"""
    segment = db.query(Segment).filter(
        and_(
            Segment.id == segment_id,
            Segment.tenant_id == current_tenant.id
        )
    ).first()
    
    if not segment:
        raise HTTPException(status_code=404, detail="Segment non trouvé")
    
    if segment.segment_type != SegmentType.STATIC:
        raise HTTPException(status_code=400, detail="Les membres ne peuvent être ajoutés manuellement qu'aux segments statiques")
    
    field_name = get_membership_field(segment.entity_type)
    added = 0
    
    for entity_id in data.entity_ids:
        # Vérifier si déjà membre
        existing = db.query(SegmentMembership).filter(
            and_(
                SegmentMembership.segment_id == segment_id,
                getattr(SegmentMembership, field_name) == entity_id
            )
        ).first()
        
        if not existing:
            membership = SegmentMembership(
                segment_id=segment_id,
                added_by=current_user.id
            )
            setattr(membership, field_name, entity_id)
            db.add(membership)
            added += 1
    
    # Mettre à jour le compteur
    segment.member_count = db.query(SegmentMembership).filter(
        SegmentMembership.segment_id == segment_id
    ).count()
    
    db.commit()
    
    return {"message": f"{added} membre(s) ajouté(s)", "total_members": segment.member_count}


@router.delete("/{segment_id}/members/{entity_id}")
async def remove_member(
    segment_id: str,
    entity_id: str,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retirer un membre d'un segment"""
    segment = db.query(Segment).filter(
        and_(
            Segment.id == segment_id,
            Segment.tenant_id == current_tenant.id
        )
    ).first()
    
    if not segment:
        raise HTTPException(status_code=404, detail="Segment non trouvé")
    
    field_name = get_membership_field(segment.entity_type)
    
    membership = db.query(SegmentMembership).filter(
        and_(
            SegmentMembership.segment_id == segment_id,
            getattr(SegmentMembership, field_name) == entity_id
        )
    ).first()
    
    if not membership:
        raise HTTPException(status_code=404, detail="Membre non trouvé dans ce segment")
    
    db.delete(membership)
    
    # Mettre à jour le compteur
    segment.member_count = db.query(SegmentMembership).filter(
        SegmentMembership.segment_id == segment_id
    ).count()
    
    db.commit()
    
    return {"message": "Membre retiré", "total_members": segment.member_count}


# ==================== ROUTES CALCUL DYNAMIQUE ====================

@router.post("/{segment_id}/compute")
async def compute_segment(
    segment_id: str,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Recalculer les membres d'un segment dynamique"""
    segment = db.query(Segment).filter(
        and_(
            Segment.id == segment_id,
            Segment.tenant_id == current_tenant.id
        )
    ).first()
    
    if not segment:
        raise HTTPException(status_code=404, detail="Segment non trouvé")
    
    if segment.segment_type != SegmentType.DYNAMIC:
        raise HTTPException(status_code=400, detail="Seuls les segments dynamiques peuvent être recalculés")
    
    if not segment.rules:
        raise HTTPException(status_code=400, detail="Le segment n'a pas de règles définies")
    
    # Récupérer le modèle d'entité
    EntityModel = get_entity_model(segment.entity_type)
    field_name = get_membership_field(segment.entity_type)
    
    # Récupérer toutes les entités du tenant
    entities = db.query(EntityModel).filter(
        EntityModel.tenant_id == current_tenant.id
    ).all()
    
    # Supprimer les anciens membres
    db.query(SegmentMembership).filter(
        SegmentMembership.segment_id == segment_id
    ).delete()
    
    # Évaluer chaque entité
    matched = 0
    rules = sorted(segment.rules, key=lambda x: x.order)
    
    for entity in entities:
        # Évaluer les règles
        if segment.rules_logic == "AND":
            matches = all(evaluate_rule(entity, rule) for rule in rules)
        else:  # OR
            matches = any(evaluate_rule(entity, rule) for rule in rules)
        
        if matches:
            membership = SegmentMembership(
                segment_id=segment_id,
                last_matched_at=datetime.utcnow()
            )
            setattr(membership, field_name, entity.id)
            db.add(membership)
            matched += 1
    
    # Mettre à jour les stats
    segment.member_count = matched
    segment.last_computed_at = datetime.utcnow()
    
    db.commit()
    
    return {
        "message": f"Segment recalculé: {matched} membre(s) trouvé(s)",
        "member_count": matched,
        "computed_at": segment.last_computed_at.isoformat()
    }


# ==================== ROUTES UTILITAIRES ====================

@router.get("/fields/{entity_type}")
async def get_segmentable_fields(
    entity_type: str,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Liste les champs disponibles pour la segmentation"""
    fields = {
        "lead": [
            {"field": "status", "label": "Statut", "type": "string", "options": ["new", "contacted", "qualified", "proposal_sent", "negotiation", "converted", "lost", "unqualified"]},
            {"field": "source", "label": "Source", "type": "string", "options": ["website", "referral", "social_media", "email_marketing", "cold_calling", "trade_show", "advertising", "partner", "direct"]},
            {"field": "score", "label": "Score", "type": "number"},
            {"field": "email", "label": "Email", "type": "string"},
            {"field": "company", "label": "Entreprise", "type": "string"},
            {"field": "city", "label": "Ville", "type": "string"},
            {"field": "country", "label": "Pays", "type": "string"},
            {"field": "industry", "label": "Secteur", "type": "string"},
            {"field": "company_size", "label": "Taille entreprise", "type": "string"},
            {"field": "email_opens", "label": "Ouvertures email", "type": "number"},
            {"field": "email_clicks", "label": "Clics email", "type": "number"},
            {"field": "last_activity_date", "label": "Dernière activité", "type": "date"},
            {"field": "created_at", "label": "Date création", "type": "date"},
        ],
        "contact": [
            {"field": "email", "label": "Email", "type": "string"},
            {"field": "job_title", "label": "Poste", "type": "string"},
            {"field": "department", "label": "Département", "type": "string"},
            {"field": "city", "label": "Ville", "type": "string"},
            {"field": "country", "label": "Pays", "type": "string"},
            {"field": "is_primary", "label": "Contact principal", "type": "boolean"},
            {"field": "is_active", "label": "Actif", "type": "boolean"},
            {"field": "email_opt_out", "label": "Désinscrit emails", "type": "boolean"},
            {"field": "last_contact_date", "label": "Dernier contact", "type": "date"},
            {"field": "last_email_opened", "label": "Dernier email ouvert", "type": "date"},
            {"field": "created_at", "label": "Date création", "type": "date"},
        ],
        "client": [
            {"field": "name", "label": "Nom", "type": "string"},
            {"field": "email", "label": "Email", "type": "string"},
            {"field": "city", "label": "Ville", "type": "string"},
            {"field": "country", "label": "Pays", "type": "string"},
            {"field": "client_type", "label": "Type client", "type": "string"},
            {"field": "is_active", "label": "Actif", "type": "boolean"},
            {"field": "created_at", "label": "Date création", "type": "date"},
        ]
    }
    
    if entity_type not in fields:
        raise HTTPException(status_code=400, detail="Type d'entité invalide")
    
    return {
        "entity_type": entity_type,
        "fields": fields[entity_type],
        "operators": [
            {"value": "equals", "label": "Égal à", "types": ["string", "number", "boolean"]},
            {"value": "not_equals", "label": "Différent de", "types": ["string", "number", "boolean"]},
            {"value": "contains", "label": "Contient", "types": ["string"]},
            {"value": "not_contains", "label": "Ne contient pas", "types": ["string"]},
            {"value": "starts_with", "label": "Commence par", "types": ["string"]},
            {"value": "ends_with", "label": "Termine par", "types": ["string"]},
            {"value": "greater_than", "label": "Supérieur à", "types": ["number"]},
            {"value": "less_than", "label": "Inférieur à", "types": ["number"]},
            {"value": "greater_or_equal", "label": "Supérieur ou égal", "types": ["number"]},
            {"value": "less_or_equal", "label": "Inférieur ou égal", "types": ["number"]},
            {"value": "is_empty", "label": "Est vide", "types": ["string", "date"]},
            {"value": "is_not_empty", "label": "N'est pas vide", "types": ["string", "date"]},
            {"value": "in_list", "label": "Dans la liste", "types": ["string"]},
            {"value": "not_in_list", "label": "Pas dans la liste", "types": ["string"]},
            {"value": "days_ago_less_than", "label": "Il y a moins de X jours", "types": ["date"]},
            {"value": "days_ago_more_than", "label": "Il y a plus de X jours", "types": ["date"]},
        ]
    }


@router.get("/stats")
async def get_segments_stats(
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Statistiques globales des segments"""
    segments = db.query(Segment).filter(
        Segment.tenant_id == current_tenant.id
    ).all()
    
    total_segments = len(segments)
    static_segments = len([s for s in segments if s.segment_type == SegmentType.STATIC])
    dynamic_segments = len([s for s in segments if s.segment_type == SegmentType.DYNAMIC])
    
    by_entity = {}
    for entity_type in [SegmentEntityType.LEAD, SegmentEntityType.CONTACT, SegmentEntityType.CLIENT]:
        entity_segments = [s for s in segments if s.entity_type == entity_type]
        by_entity[entity_type] = {
            "count": len(entity_segments),
            "total_members": sum(s.member_count for s in entity_segments)
        }
    
    return {
        "total_segments": total_segments,
        "static_segments": static_segments,
        "dynamic_segments": dynamic_segments,
        "active_segments": len([s for s in segments if s.is_active]),
        "by_entity_type": by_entity,
        "largest_segments": [
            {"id": str(s.id), "name": s.name, "member_count": s.member_count}
            for s in sorted(segments, key=lambda x: x.member_count, reverse=True)[:5]
        ]
    }
