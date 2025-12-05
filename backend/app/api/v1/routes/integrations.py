"""
Routes API pour les intégrations externes
Slack, Webhooks, Zapier, etc.
"""

from typing import List, Optional
from datetime import datetime
import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc
from pydantic import BaseModel

from app.db.session import get_db
from app.api.deps import get_current_user, get_current_tenant
from app.models.user import User
from app.models.tenant import Tenant
from app.models.notifications import Integration, IntegrationLog, IntegrationType

router = APIRouter()


# ==================== SCHEMAS ====================

class IntegrationCreate(BaseModel):
    name: str
    description: Optional[str] = None
    type: str
    config: dict
    credentials: Optional[dict] = None
    trigger_events: Optional[List[str]] = None


class IntegrationUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    config: Optional[dict] = None
    credentials: Optional[dict] = None
    trigger_events: Optional[List[str]] = None
    is_active: Optional[bool] = None


class WebhookPayload(BaseModel):
    event_type: str
    entity_type: str
    entity_id: str
    data: dict


# ==================== ROUTES ====================

@router.get("/")
async def list_integrations(
    type: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Liste des intégrations"""
    query = db.query(Integration).filter(Integration.tenant_id == current_tenant.id)
    
    if type:
        query = query.filter(Integration.type == type)
    if is_active is not None:
        query = query.filter(Integration.is_active == is_active)
    
    integrations = query.order_by(Integration.name).all()
    
    return [
        {
            "id": str(i.id),
            "name": i.name,
            "description": i.description,
            "type": i.type,
            "is_active": i.is_active,
            "trigger_events": i.trigger_events,
            "last_sync_at": i.last_sync_at.isoformat() if i.last_sync_at else None,
            "last_error": i.last_error,
            "created_at": i.created_at.isoformat() if i.created_at else None
        }
        for i in integrations
    ]


@router.post("/")
async def create_integration(
    data: IntegrationCreate,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Créer une intégration"""
    valid_types = [t.value for t in IntegrationType]
    if data.type not in valid_types:
        raise HTTPException(status_code=400, detail=f"Type invalide. Valeurs: {valid_types}")
    
    integration = Integration(
        name=data.name,
        description=data.description,
        type=data.type,
        config=data.config,
        credentials=data.credentials,
        trigger_events=data.trigger_events,
        is_active=True,
        tenant_id=current_tenant.id,
        created_by=current_user.id
    )
    
    db.add(integration)
    db.commit()
    db.refresh(integration)
    
    return {"id": str(integration.id), "message": "Intégration créée"}


@router.get("/{integration_id}")
async def get_integration(
    integration_id: str,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Détails d'une intégration"""
    integration = db.query(Integration).filter(
        and_(
            Integration.id == integration_id,
            Integration.tenant_id == current_tenant.id
        )
    ).first()
    
    if not integration:
        raise HTTPException(status_code=404, detail="Intégration non trouvée")
    
    return {
        "id": str(integration.id),
        "name": integration.name,
        "description": integration.description,
        "type": integration.type,
        "config": integration.config,
        "trigger_events": integration.trigger_events,
        "is_active": integration.is_active,
        "last_sync_at": integration.last_sync_at.isoformat() if integration.last_sync_at else None,
        "last_error": integration.last_error,
        "created_at": integration.created_at.isoformat() if integration.created_at else None
    }


@router.put("/{integration_id}")
async def update_integration(
    integration_id: str,
    data: IntegrationUpdate,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Modifier une intégration"""
    integration = db.query(Integration).filter(
        and_(
            Integration.id == integration_id,
            Integration.tenant_id == current_tenant.id
        )
    ).first()
    
    if not integration:
        raise HTTPException(status_code=404, detail="Intégration non trouvée")
    
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(integration, field, value)
    
    db.commit()
    
    return {"message": "Intégration mise à jour"}


@router.delete("/{integration_id}")
async def delete_integration(
    integration_id: str,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Supprimer une intégration"""
    integration = db.query(Integration).filter(
        and_(
            Integration.id == integration_id,
            Integration.tenant_id == current_tenant.id
        )
    ).first()
    
    if not integration:
        raise HTTPException(status_code=404, detail="Intégration non trouvée")
    
    db.delete(integration)
    db.commit()
    
    return {"message": "Intégration supprimée"}


@router.post("/{integration_id}/test")
async def test_integration(
    integration_id: str,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Tester une intégration"""
    integration = db.query(Integration).filter(
        and_(
            Integration.id == integration_id,
            Integration.tenant_id == current_tenant.id
        )
    ).first()
    
    if not integration:
        raise HTTPException(status_code=404, detail="Intégration non trouvée")
    
    try:
        result = await execute_integration(
            db, integration,
            event_type="test",
            entity_type="test",
            entity_id="test",
            data={"message": "Test de connexion"}
        )
        return {"success": True, "result": result}
    except Exception as e:
        return {"success": False, "error": str(e)}


@router.get("/{integration_id}/logs")
async def get_integration_logs(
    integration_id: str,
    limit: int = Query(50),
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Logs d'une intégration"""
    integration = db.query(Integration).filter(
        and_(
            Integration.id == integration_id,
            Integration.tenant_id == current_tenant.id
        )
    ).first()
    
    if not integration:
        raise HTTPException(status_code=404, detail="Intégration non trouvée")
    
    logs = db.query(IntegrationLog).filter(
        IntegrationLog.integration_id == integration_id
    ).order_by(desc(IntegrationLog.executed_at)).limit(limit).all()
    
    return [
        {
            "id": str(l.id),
            "event_type": l.event_type,
            "entity_type": l.entity_type,
            "success": l.success,
            "response_status": l.response_status,
            "error_message": l.error_message,
            "duration_ms": l.duration_ms,
            "executed_at": l.executed_at.isoformat() if l.executed_at else None
        }
        for l in logs
    ]


# ==================== TYPES D'INTÉGRATIONS ====================

@router.get("/types/list")
async def get_integration_types(
    current_user: User = Depends(get_current_user)
):
    """Liste des types d'intégrations disponibles"""
    return {
        "types": [
            {
                "value": "slack",
                "label": "Slack",
                "description": "Envoyer des notifications vers Slack",
                "config_schema": {"webhook_url": "string", "channel": "string"}
            },
            {
                "value": "webhook",
                "label": "Webhook",
                "description": "Appeler une URL externe",
                "config_schema": {"url": "string", "method": "string", "headers": "object"}
            },
            {
                "value": "zapier",
                "label": "Zapier",
                "description": "Connecter à Zapier",
                "config_schema": {"webhook_url": "string"}
            },
            {
                "value": "google_sheets",
                "label": "Google Sheets",
                "description": "Synchroniser avec Google Sheets",
                "config_schema": {"spreadsheet_id": "string", "sheet_name": "string"}
            },
            {
                "value": "custom",
                "label": "Personnalisé",
                "description": "Intégration personnalisée",
                "config_schema": {}
            }
        ]
    }


@router.get("/events/list")
async def get_trigger_events(
    current_user: User = Depends(get_current_user)
):
    """Liste des événements déclencheurs"""
    return {
        "events": [
            {"value": "lead_created", "label": "Lead créé"},
            {"value": "lead_converted", "label": "Lead converti"},
            {"value": "opportunity_won", "label": "Opportunité gagnée"},
            {"value": "opportunity_lost", "label": "Opportunité perdue"},
            {"value": "campaign_sent", "label": "Campagne envoyée"},
            {"value": "email_opened", "label": "Email ouvert"},
            {"value": "task_completed", "label": "Tâche terminée"},
            {"value": "invoice_paid", "label": "Facture payée"}
        ]
    }


# ==================== EXECUTION ====================

async def execute_integration(
    db: Session,
    integration: Integration,
    event_type: str,
    entity_type: str,
    entity_id: str,
    data: dict
) -> dict:
    """Exécute une intégration"""
    start_time = datetime.utcnow()
    log = IntegrationLog(
        integration_id=integration.id,
        event_type=event_type,
        entity_type=entity_type,
        entity_id=entity_id,
        request_data=data
    )
    
    try:
        if integration.type == "slack":
            result = await send_slack_message(integration.config, data)
        elif integration.type == "webhook":
            result = await call_webhook(integration.config, data)
        elif integration.type == "zapier":
            result = await call_webhook({"url": integration.config.get("webhook_url"), "method": "POST"}, data)
        else:
            result = {"status": "not_implemented"}
        
        log.success = True
        log.response_status = result.get("status_code", 200)
        log.response_data = result
        
        integration.last_sync_at = datetime.utcnow()
        integration.last_error = None
        
    except Exception as e:
        log.success = False
        log.error_message = str(e)
        integration.last_error = str(e)
        result = {"error": str(e)}
    
    log.duration_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)
    log.executed_at = datetime.utcnow()
    
    db.add(log)
    db.commit()
    
    return result


async def send_slack_message(config: dict, data: dict) -> dict:
    """Envoie un message Slack"""
    webhook_url = config.get("webhook_url")
    channel = config.get("channel", "#general")
    
    if not webhook_url:
        raise ValueError("webhook_url requis")
    
    payload = {
        "channel": channel,
        "text": data.get("message", "Notification CRM"),
        "attachments": [
            {
                "color": "#0070f3",
                "fields": [
                    {"title": k, "value": str(v), "short": True}
                    for k, v in data.items() if k != "message"
                ]
            }
        ]
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(webhook_url, json=payload)
        return {"status_code": response.status_code, "body": response.text}


async def call_webhook(config: dict, data: dict) -> dict:
    """Appelle un webhook externe"""
    url = config.get("url")
    method = config.get("method", "POST").upper()
    headers = config.get("headers", {})
    
    if not url:
        raise ValueError("url requis")
    
    async with httpx.AsyncClient() as client:
        if method == "POST":
            response = await client.post(url, json=data, headers=headers)
        elif method == "PUT":
            response = await client.put(url, json=data, headers=headers)
        else:
            response = await client.get(url, headers=headers)
        
        return {"status_code": response.status_code, "body": response.text[:500]}


# ==================== TRIGGER HELPER ====================

async def trigger_integrations(
    db: Session,
    tenant_id: str,
    event_type: str,
    entity_type: str,
    entity_id: str,
    data: dict
):
    """
    Déclenche toutes les intégrations actives pour un événement
    À appeler depuis d'autres modules
    """
    integrations = db.query(Integration).filter(
        and_(
            Integration.tenant_id == tenant_id,
            Integration.is_active == True
        )
    ).all()
    
    for integration in integrations:
        if integration.trigger_events and event_type in integration.trigger_events:
            try:
                await execute_integration(db, integration, event_type, entity_type, entity_id, data)
            except Exception as e:
                print(f"Erreur intégration {integration.id}: {e}")
