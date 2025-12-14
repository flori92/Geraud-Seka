"""
Automations routes removed (CRM feature deprecated).
This module provides an empty router kept for compatibility.
"""

from fastapi import APIRouter

router = APIRouter()


@router.post("/")
async def create_automation(
    data: AutomationCreate,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Créer une nouvelle automatisation"""
    # Valider le trigger_type
    valid_triggers = [t.value for t in AutomationTriggerType]
    if data.trigger_type not in valid_triggers:
        raise HTTPException(status_code=400, detail=f"Type de déclencheur invalide. Valeurs possibles: {valid_triggers}")
    
    automation = Automation(
        name=data.name,
        description=data.description,
        trigger_type=data.trigger_type,
        trigger_config=data.trigger_config,
        conditions=data.conditions,
        status=AutomationStatus.DRAFT,
        tenant_id=current_tenant.id,
        created_by=current_user.id
    )
    
    db.add(automation)
    db.flush()
    
    # Ajouter les actions si fournies
    if data.actions:
        for i, action_data in enumerate(data.actions):
            action = AutomationAction(
                automation_id=automation.id,
                action_type=action_data.action_type,
                config=action_data.config,
                order=action_data.order or i
            )
            db.add(action)
    
    db.commit()
    db.refresh(automation)
    
    return {
        "id": str(automation.id),
        "name": automation.name,
        "status": automation.status,
        "message": "Automatisation créée avec succès"
    }


@router.get("/{automation_id}")
async def get_automation(
    automation_id: str,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Détails d'une automatisation"""
    automation = db.query(Automation).filter(
        and_(
            Automation.id == automation_id,
            Automation.tenant_id == current_tenant.id
        )
    ).first()
    
    if not automation:
        raise HTTPException(status_code=404, detail="Automatisation non trouvée")
    
    return {
        "id": str(automation.id),
        "name": automation.name,
        "description": automation.description,
        "trigger_type": automation.trigger_type,
        "trigger_config": automation.trigger_config,
        "conditions": automation.conditions,
        "status": automation.status,
        "execution_count": automation.execution_count,
        "success_count": automation.success_count,
        "error_count": automation.error_count,
        "last_executed_at": automation.last_executed_at.isoformat() if automation.last_executed_at else None,
        "actions": [
            {
                "id": str(a.id),
                "action_type": a.action_type,
                "config": a.config,
                "order": a.order
            }
            for a in sorted(automation.actions, key=lambda x: x.order)
        ],
        "created_at": automation.created_at.isoformat() if automation.created_at else None,
        "created_by": automation.creator.full_name if automation.creator else None
    }


@router.put("/{automation_id}")
async def update_automation(
    automation_id: str,
    data: AutomationUpdate,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Modifier une automatisation"""
    automation = db.query(Automation).filter(
        and_(
            Automation.id == automation_id,
            Automation.tenant_id == current_tenant.id
        )
    ).first()
    
    if not automation:
        raise HTTPException(status_code=404, detail="Automatisation non trouvée")
    
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(automation, field, value)
    
    db.commit()
    
    return {"message": "Automatisation mise à jour", "id": str(automation.id)}


@router.delete("/{automation_id}")
async def delete_automation(
    automation_id: str,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Supprimer une automatisation"""
    automation = db.query(Automation).filter(
        and_(
            Automation.id == automation_id,
            Automation.tenant_id == current_tenant.id
        )
    ).first()
    
    if not automation:
        raise HTTPException(status_code=404, detail="Automatisation non trouvée")
    
    db.delete(automation)
    db.commit()
    
    return {"message": "Automatisation supprimée"}


# ==================== ACTIVATION / DÉSACTIVATION ====================

@router.post("/{automation_id}/activate")
async def activate_automation(
    automation_id: str,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Activer une automatisation"""
    automation = db.query(Automation).filter(
        and_(
            Automation.id == automation_id,
            Automation.tenant_id == current_tenant.id
        )
    ).first()
    
    if not automation:
        raise HTTPException(status_code=404, detail="Automatisation non trouvée")
    
    if not automation.actions:
        raise HTTPException(status_code=400, detail="L'automatisation doit avoir au moins une action")
    
    automation.status = AutomationStatus.ACTIVE
    db.commit()
    
    return {"message": "Automatisation activée", "status": automation.status}


@router.post("/{automation_id}/pause")
async def pause_automation(
    automation_id: str,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mettre en pause une automatisation"""
    automation = db.query(Automation).filter(
        and_(
            Automation.id == automation_id,
            Automation.tenant_id == current_tenant.id
        )
    ).first()
    
    if not automation:
        raise HTTPException(status_code=404, detail="Automatisation non trouvée")
    
    automation.status = AutomationStatus.PAUSED
    db.commit()
    
    return {"message": "Automatisation mise en pause", "status": automation.status}


# ==================== ACTIONS ====================

@router.post("/{automation_id}/actions")
async def add_action(
    automation_id: str,
    data: ActionCreate,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Ajouter une action à une automatisation"""
    automation = db.query(Automation).filter(
        and_(
            Automation.id == automation_id,
            Automation.tenant_id == current_tenant.id
        )
    ).first()
    
    if not automation:
        raise HTTPException(status_code=404, detail="Automatisation non trouvée")
    
    # Valider le type d'action
    valid_actions = [a.value for a in AutomationActionType]
    if data.action_type not in valid_actions:
        raise HTTPException(status_code=400, detail=f"Type d'action invalide. Valeurs possibles: {valid_actions}")
    
    action = AutomationAction(
        automation_id=automation.id,
        action_type=data.action_type,
        config=data.config,
        order=data.order
    )
    
    db.add(action)
    db.commit()
    db.refresh(action)
    
    return {
        "id": str(action.id),
        "action_type": action.action_type,
        "message": "Action ajoutée"
    }


@router.put("/{automation_id}/actions/{action_id}")
async def update_action(
    automation_id: str,
    action_id: str,
    data: ActionCreate,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Modifier une action"""
    automation = db.query(Automation).filter(
        and_(
            Automation.id == automation_id,
            Automation.tenant_id == current_tenant.id
        )
    ).first()
    
    if not automation:
        raise HTTPException(status_code=404, detail="Automatisation non trouvée")
    
    action = db.query(AutomationAction).filter(
        and_(
            AutomationAction.id == action_id,
            AutomationAction.automation_id == automation_id
        )
    ).first()
    
    if not action:
        raise HTTPException(status_code=404, detail="Action non trouvée")
    
    action.action_type = data.action_type
    action.config = data.config
    action.order = data.order
    
    db.commit()
    
    return {"message": "Action mise à jour"}


@router.delete("/{automation_id}/actions/{action_id}")
async def delete_action(
    automation_id: str,
    action_id: str,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Supprimer une action"""
    automation = db.query(Automation).filter(
        and_(
            Automation.id == automation_id,
            Automation.tenant_id == current_tenant.id
        )
    ).first()
    
    if not automation:
        raise HTTPException(status_code=404, detail="Automatisation non trouvée")
    
    action = db.query(AutomationAction).filter(
        and_(
            AutomationAction.id == action_id,
            AutomationAction.automation_id == automation_id
        )
    ).first()
    
    if not action:
        raise HTTPException(status_code=404, detail="Action non trouvée")
    
    db.delete(action)
    db.commit()
    
    return {"message": "Action supprimée"}


# ==================== EXÉCUTION MANUELLE ====================

@router.post("/{automation_id}/test")
async def test_automation(
    automation_id: str,
    entity_type: str = Query(...),
    entity_id: str = Query(...),
    background_tasks: BackgroundTasks = None,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Tester une automatisation sur une entité spécifique"""
    automation = db.query(Automation).filter(
        and_(
            Automation.id == automation_id,
            Automation.tenant_id == current_tenant.id
        )
    ).first()
    
    if not automation:
        raise HTTPException(status_code=404, detail="Automatisation non trouvée")
    
    if not automation.actions:
        raise HTTPException(status_code=400, detail="L'automatisation n'a pas d'actions")
    
    # Créer une exécution de test
    execution = AutomationExecution(
        automation_id=automation.id,
        entity_type=entity_type,
        entity_id=entity_id,
        status="running"
    )
    
    db.add(execution)
    db.commit()
    db.refresh(execution)
    
    # Lancer l'exécution en arrière-plan
    if background_tasks:
        background_tasks.add_task(
            execute_automation,
            execution_id=str(execution.id),
            tenant_id=str(current_tenant.id)
        )
    
    return {
        "execution_id": str(execution.id),
        "message": "Test d'automatisation lancé"
    }


# ==================== HISTORIQUE ====================

@router.get("/{automation_id}/executions")
async def get_executions(
    automation_id: str,
    status: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Historique des exécutions d'une automatisation"""
    automation = db.query(Automation).filter(
        and_(
            Automation.id == automation_id,
            Automation.tenant_id == current_tenant.id
        )
    ).first()
    
    if not automation:
        raise HTTPException(status_code=404, detail="Automatisation non trouvée")
    
    query = db.query(AutomationExecution).filter(
        AutomationExecution.automation_id == automation_id
    )
    
    if status:
        query = query.filter(AutomationExecution.status == status)
    
    total = query.count()
    executions = query.order_by(desc(AutomationExecution.started_at)).offset(offset).limit(limit).all()
    
    return {
        "total": total,
        "executions": [
            {
                "id": str(e.id),
                "entity_type": e.entity_type,
                "entity_id": str(e.entity_id) if e.entity_id else None,
                "status": e.status,
                "started_at": e.started_at.isoformat() if e.started_at else None,
                "completed_at": e.completed_at.isoformat() if e.completed_at else None,
                "actions_completed": e.actions_completed,
                "error_message": e.error_message
            }
            for e in executions
        ]
    }


# ==================== UTILITAIRES ====================

@router.get("/triggers/types")
async def get_trigger_types(
    current_user: User = Depends(get_current_user)
):
    """Liste des types de déclencheurs disponibles"""
    return {
        "triggers": [
            {"value": "lead_created", "label": "Lead créé", "category": "lead"},
            {"value": "lead_status_changed", "label": "Statut lead changé", "category": "lead"},
            {"value": "lead_score_changed", "label": "Score lead changé", "category": "lead"},
            {"value": "lead_assigned", "label": "Lead assigné", "category": "lead"},
            {"value": "contact_created", "label": "Contact créé", "category": "contact"},
            {"value": "contact_updated", "label": "Contact modifié", "category": "contact"},
            {"value": "opportunity_created", "label": "Opportunité créée", "category": "opportunity"},
            {"value": "opportunity_stage_changed", "label": "Étape opportunité changée", "category": "opportunity"},
            {"value": "opportunity_won", "label": "Opportunité gagnée", "category": "opportunity"},
            {"value": "opportunity_lost", "label": "Opportunité perdue", "category": "opportunity"},
            {"value": "email_opened", "label": "Email ouvert", "category": "email"},
            {"value": "email_clicked", "label": "Lien email cliqué", "category": "email"},
            {"value": "email_bounced", "label": "Email rebondi", "category": "email"},
            {"value": "scheduled", "label": "Programmé", "category": "time"},
            {"value": "inactivity", "label": "Période d'inactivité", "category": "time"},
        ]
    }


@router.get("/actions/types")
async def get_action_types(
    current_user: User = Depends(get_current_user)
):
    """Liste des types d'actions disponibles"""
    return {
        "actions": [
            {"value": "send_email", "label": "Envoyer un email", "category": "email", "config_schema": {"template_id": "string", "delay_minutes": "number"}},
            {"value": "add_to_campaign", "label": "Ajouter à une campagne", "category": "email", "config_schema": {"campaign_id": "string"}},
            {"value": "update_lead", "label": "Modifier le lead", "category": "crm", "config_schema": {"field": "string", "value": "any"}},
            {"value": "update_contact", "label": "Modifier le contact", "category": "crm", "config_schema": {"field": "string", "value": "any"}},
            {"value": "update_opportunity", "label": "Modifier l'opportunité", "category": "crm", "config_schema": {"field": "string", "value": "any"}},
            {"value": "assign_to_user", "label": "Assigner à un utilisateur", "category": "crm", "config_schema": {"user_id": "string"}},
            {"value": "add_to_segment", "label": "Ajouter à un segment", "category": "crm", "config_schema": {"segment_id": "string"}},
            {"value": "remove_from_segment", "label": "Retirer d'un segment", "category": "crm", "config_schema": {"segment_id": "string"}},
            {"value": "create_activity", "label": "Créer une activité", "category": "crm", "config_schema": {"type": "string", "subject": "string", "notes": "string"}},
            {"value": "create_task", "label": "Créer une tâche", "category": "crm", "config_schema": {"title": "string", "due_days": "number", "assigned_to": "string"}},
            {"value": "send_notification", "label": "Envoyer une notification", "category": "notification", "config_schema": {"user_id": "string", "message": "string"}},
            {"value": "send_webhook", "label": "Appeler un webhook", "category": "notification", "config_schema": {"url": "string", "method": "string"}},
            {"value": "wait", "label": "Attendre", "category": "flow", "config_schema": {"duration_hours": "number"}},
            {"value": "condition", "label": "Condition", "category": "flow", "config_schema": {"field": "string", "operator": "string", "value": "any"}},
        ]
    }


@router.get("/stats")
async def get_automations_stats(
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Statistiques globales des automatisations"""
    automations = db.query(Automation).filter(
        Automation.tenant_id == current_tenant.id
    ).all()
    
    total = len(automations)
    active = len([a for a in automations if a.status == AutomationStatus.ACTIVE])
    paused = len([a for a in automations if a.status == AutomationStatus.PAUSED])
    
    total_executions = sum(a.execution_count for a in automations)
    total_success = sum(a.success_count for a in automations)
    total_errors = sum(a.error_count for a in automations)
    
    # Top automatisations par exécutions
    top_by_executions = sorted(automations, key=lambda x: x.execution_count, reverse=True)[:5]
    
    return {
        "total_automations": total,
        "active": active,
        "paused": paused,
        "draft": len([a for a in automations if a.status == AutomationStatus.DRAFT]),
        "total_executions": total_executions,
        "total_success": total_success,
        "total_errors": total_errors,
        "success_rate": round((total_success / total_executions) * 100, 2) if total_executions > 0 else 0,
        "top_automations": [
            {
                "id": str(a.id),
                "name": a.name,
                "execution_count": a.execution_count,
                "success_rate": round((a.success_count / a.execution_count) * 100, 2) if a.execution_count > 0 else 0
            }
            for a in top_by_executions
        ]
    }


# ==================== FONCTION D'EXÉCUTION ====================

async def execute_automation(execution_id: str, tenant_id: str):
    """Exécute une automatisation (tâche d'arrière-plan)"""
    from app.db.session import SessionLocal
    from app.models.crm import Lead, Contact, Opportunity, CRMActivity, SegmentMembership
    from app.services.email import EmailService
    
    db = SessionLocal()
    
    try:
        execution = db.query(AutomationExecution).get(execution_id)
        if not execution:
            return
        
        automation = execution.automation
        actions = sorted(automation.actions, key=lambda x: x.order)
        
        execution_log = []
        
        # Récupérer l'entité
        entity = None
        if execution.entity_type == "lead":
            entity = db.query(Lead).get(execution.entity_id)
        elif execution.entity_type == "contact":
            entity = db.query(Contact).get(execution.entity_id)
        elif execution.entity_type == "opportunity":
            entity = db.query(Opportunity).get(execution.entity_id)
        
        if not entity:
            execution.status = "failed"
            execution.error_message = "Entité non trouvée"
            db.commit()
            return
        
        # Exécuter chaque action
        for action in actions:
            try:
                execution.current_action_id = action.id
                db.commit()
                
                result = await execute_action(db, action, entity, execution.entity_type, tenant_id)
                
                execution_log.append({
                    "action_id": str(action.id),
                    "action_type": action.action_type,
                    "status": "success",
                    "result": result,
                    "timestamp": datetime.utcnow().isoformat()
                })
                
                execution.actions_completed += 1
                db.commit()
                
            except Exception as e:
                execution_log.append({
                    "action_id": str(action.id),
                    "action_type": action.action_type,
                    "status": "error",
                    "error": str(e),
                    "timestamp": datetime.utcnow().isoformat()
                })
                
                execution.status = "failed"
                execution.error_message = str(e)
                execution.execution_log = execution_log
                execution.completed_at = datetime.utcnow()
                
                automation.error_count += 1
                db.commit()
                return
        
        # Succès
        execution.status = "completed"
        execution.execution_log = execution_log
        execution.completed_at = datetime.utcnow()
        
        automation.execution_count += 1
        automation.success_count += 1
        automation.last_executed_at = datetime.utcnow()
        
        db.commit()
        
    except Exception as e:
        print(f"Erreur exécution automatisation: {e}")
    finally:
        db.close()


async def execute_action(db, action: AutomationAction, entity, entity_type: str, tenant_id: str) -> dict:
    """Exécute une action spécifique"""
    from app.models.crm import Lead, Contact, Opportunity, CRMActivity, SegmentMembership
    from app.services.email import EmailService
    
    config = action.config
    action_type = action.action_type
    
    if action_type == "update_lead" and entity_type == "lead":
        field = config.get("field")
        value = config.get("value")
        if hasattr(entity, field):
            setattr(entity, field, value)
            db.commit()
        return {"field": field, "value": value}
    
    elif action_type == "update_contact" and entity_type == "contact":
        field = config.get("field")
        value = config.get("value")
        if hasattr(entity, field):
            setattr(entity, field, value)
            db.commit()
        return {"field": field, "value": value}
    
    elif action_type == "assign_to_user":
        user_id = config.get("user_id")
        if hasattr(entity, "assigned_to"):
            entity.assigned_to = user_id
            db.commit()
        return {"assigned_to": user_id}
    
    elif action_type == "add_to_segment":
        segment_id = config.get("segment_id")
        field_name = f"{entity_type}_id"
        
        # Vérifier si déjà membre
        existing = db.query(SegmentMembership).filter(
            and_(
                SegmentMembership.segment_id == segment_id,
                getattr(SegmentMembership, field_name) == entity.id
            )
        ).first()
        
        if not existing:
            membership = SegmentMembership(segment_id=segment_id)
            setattr(membership, field_name, entity.id)
            db.add(membership)
            db.commit()
        
        return {"segment_id": segment_id, "added": not existing}
    
    elif action_type == "remove_from_segment":
        segment_id = config.get("segment_id")
        field_name = f"{entity_type}_id"
        
        membership = db.query(SegmentMembership).filter(
            and_(
                SegmentMembership.segment_id == segment_id,
                getattr(SegmentMembership, field_name) == entity.id
            )
        ).first()
        
        if membership:
            db.delete(membership)
            db.commit()
        
        return {"segment_id": segment_id, "removed": membership is not None}
    
    elif action_type == "create_activity":
        activity = CRMActivity(
            type=config.get("type", "note"),
            subject=config.get("subject", "Activité automatique"),
            notes=config.get("notes"),
            tenant_id=tenant_id
        )
        
        if entity_type == "lead":
            activity.lead_id = entity.id
        elif entity_type == "contact":
            activity.contact_id = entity.id
        elif entity_type == "opportunity":
            activity.opportunity_id = entity.id
        
        db.add(activity)
        db.commit()
        
        return {"activity_id": str(activity.id)}
    
    elif action_type == "send_email":
        template_id = config.get("template_id")
        # TODO: Implémenter l'envoi d'email via EmailService
        return {"template_id": template_id, "sent": True}
    
    elif action_type == "wait":
        # L'attente est gérée différemment (via scheduler)
        duration_hours = config.get("duration_hours", 1)
        return {"wait_hours": duration_hours}
    
    elif action_type == "send_webhook":
        import httpx
        url = config.get("url")
        method = config.get("method", "POST")
        
        async with httpx.AsyncClient() as client:
            if method == "POST":
                response = await client.post(url, json={"entity_type": entity_type, "entity_id": str(entity.id)})
            else:
                response = await client.get(url)
        
        return {"url": url, "status_code": response.status_code}
    
    return {"action": action_type, "status": "not_implemented"}
