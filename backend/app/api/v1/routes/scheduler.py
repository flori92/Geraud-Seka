"""
Routes API pour les tâches planifiées (Scheduler)
"""

from typing import List, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc
from pydantic import BaseModel
from croniter import croniter

from app.db.session import get_db
from app.api.deps import get_current_user, get_current_tenant
from app.models.user import User
from app.models.tenant import Tenant
from app.models.notifications import ScheduledTask, ScheduledTaskStatus, ScheduledTaskType

router = APIRouter()


# ==================== SCHEMAS ====================

class TaskCreate(BaseModel):
    name: str
    description: Optional[str] = None
    task_type: str
    scheduled_at: datetime
    is_recurring: bool = False
    cron_expression: Optional[str] = None
    config: dict


class TaskUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    is_recurring: Optional[bool] = None
    cron_expression: Optional[str] = None
    config: Optional[dict] = None


# ==================== ROUTES ====================

@router.get("/")
async def list_tasks(
    status: Optional[str] = Query(None),
    task_type: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Liste les tâches planifiées"""
    query = db.query(ScheduledTask).filter(
        ScheduledTask.tenant_id == current_tenant.id
    )
    
    if status:
        query = query.filter(ScheduledTask.status == status)
    if task_type:
        query = query.filter(ScheduledTask.task_type == task_type)
    
    total = query.count()
    tasks = query.order_by(ScheduledTask.scheduled_at).offset(offset).limit(limit).all()
    
    return {
        "total": total,
        "tasks": [
            {
                "id": str(t.id),
                "name": t.name,
                "description": t.description,
                "task_type": t.task_type,
                "scheduled_at": t.scheduled_at.isoformat() if t.scheduled_at else None,
                "executed_at": t.executed_at.isoformat() if t.executed_at else None,
                "is_recurring": t.is_recurring,
                "cron_expression": t.cron_expression,
                "next_run_at": t.next_run_at.isoformat() if t.next_run_at else None,
                "status": t.status,
                "retry_count": t.retry_count,
                "error_message": t.error_message,
                "created_at": t.created_at.isoformat() if t.created_at else None
            }
            for t in tasks
        ]
    }


@router.post("/")
async def create_task(
    data: TaskCreate,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Créer une tâche planifiée"""
    # Valider le type de tâche
    valid_types = [t.value for t in ScheduledTaskType]
    if data.task_type not in valid_types:
        raise HTTPException(status_code=400, detail=f"Type invalide. Valeurs: {valid_types}")
    
    # Valider l'expression cron si récurrente
    next_run = None
    if data.is_recurring and data.cron_expression:
        try:
            cron = croniter(data.cron_expression, datetime.utcnow())
            next_run = cron.get_next(datetime)
        except:
            raise HTTPException(status_code=400, detail="Expression cron invalide")
    
    task = ScheduledTask(
        name=data.name,
        description=data.description,
        task_type=data.task_type,
        scheduled_at=data.scheduled_at,
        is_recurring=data.is_recurring,
        cron_expression=data.cron_expression,
        next_run_at=next_run,
        config=data.config,
        status=ScheduledTaskStatus.PENDING,
        tenant_id=current_tenant.id,
        created_by=current_user.id
    )
    
    db.add(task)
    db.commit()
    db.refresh(task)
    
    return {
        "id": str(task.id),
        "name": task.name,
        "scheduled_at": task.scheduled_at.isoformat(),
        "message": "Tâche planifiée créée"
    }


@router.get("/{task_id}")
async def get_task(
    task_id: str,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Détails d'une tâche"""
    task = db.query(ScheduledTask).filter(
        and_(
            ScheduledTask.id == task_id,
            ScheduledTask.tenant_id == current_tenant.id
        )
    ).first()
    
    if not task:
        raise HTTPException(status_code=404, detail="Tâche non trouvée")
    
    return {
        "id": str(task.id),
        "name": task.name,
        "description": task.description,
        "task_type": task.task_type,
        "scheduled_at": task.scheduled_at.isoformat() if task.scheduled_at else None,
        "executed_at": task.executed_at.isoformat() if task.executed_at else None,
        "is_recurring": task.is_recurring,
        "cron_expression": task.cron_expression,
        "next_run_at": task.next_run_at.isoformat() if task.next_run_at else None,
        "config": task.config,
        "status": task.status,
        "retry_count": task.retry_count,
        "max_retries": task.max_retries,
        "error_message": task.error_message,
        "result": task.result,
        "created_at": task.created_at.isoformat() if task.created_at else None,
        "created_by": task.creator.full_name if task.creator else None
    }


@router.put("/{task_id}")
async def update_task(
    task_id: str,
    data: TaskUpdate,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Modifier une tâche"""
    task = db.query(ScheduledTask).filter(
        and_(
            ScheduledTask.id == task_id,
            ScheduledTask.tenant_id == current_tenant.id
        )
    ).first()
    
    if not task:
        raise HTTPException(status_code=404, detail="Tâche non trouvée")
    
    if task.status not in [ScheduledTaskStatus.PENDING, ScheduledTaskStatus.FAILED]:
        raise HTTPException(status_code=400, detail="Seules les tâches en attente peuvent être modifiées")
    
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(task, field, value)
    
    # Recalculer next_run si cron modifié
    if data.cron_expression and task.is_recurring:
        try:
            cron = croniter(data.cron_expression, datetime.utcnow())
            task.next_run_at = cron.get_next(datetime)
        except:
            pass
    
    db.commit()
    
    return {"message": "Tâche mise à jour"}


@router.delete("/{task_id}")
async def delete_task(
    task_id: str,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Supprimer une tâche"""
    task = db.query(ScheduledTask).filter(
        and_(
            ScheduledTask.id == task_id,
            ScheduledTask.tenant_id == current_tenant.id
        )
    ).first()
    
    if not task:
        raise HTTPException(status_code=404, detail="Tâche non trouvée")
    
    if task.status == ScheduledTaskStatus.RUNNING:
        raise HTTPException(status_code=400, detail="Impossible de supprimer une tâche en cours")
    
    db.delete(task)
    db.commit()
    
    return {"message": "Tâche supprimée"}


@router.post("/{task_id}/cancel")
async def cancel_task(
    task_id: str,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Annuler une tâche"""
    task = db.query(ScheduledTask).filter(
        and_(
            ScheduledTask.id == task_id,
            ScheduledTask.tenant_id == current_tenant.id
        )
    ).first()
    
    if not task:
        raise HTTPException(status_code=404, detail="Tâche non trouvée")
    
    if task.status not in [ScheduledTaskStatus.PENDING]:
        raise HTTPException(status_code=400, detail="Seules les tâches en attente peuvent être annulées")
    
    task.status = ScheduledTaskStatus.CANCELLED
    db.commit()
    
    return {"message": "Tâche annulée"}


@router.post("/{task_id}/retry")
async def retry_task(
    task_id: str,
    background_tasks: BackgroundTasks,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Relancer une tâche échouée"""
    task = db.query(ScheduledTask).filter(
        and_(
            ScheduledTask.id == task_id,
            ScheduledTask.tenant_id == current_tenant.id
        )
    ).first()
    
    if not task:
        raise HTTPException(status_code=404, detail="Tâche non trouvée")
    
    if task.status != ScheduledTaskStatus.FAILED:
        raise HTTPException(status_code=400, detail="Seules les tâches échouées peuvent être relancées")
    
    task.status = ScheduledTaskStatus.PENDING
    task.scheduled_at = datetime.utcnow()
    task.error_message = None
    db.commit()
    
    return {"message": "Tâche reprogrammée"}


@router.get("/types/list")
async def get_task_types(
    current_user: User = Depends(get_current_user)
):
    """Liste des types de tâches disponibles"""
    return {
        "types": [
            {"value": "send_campaign", "label": "Envoyer une campagne"},
            {"value": "run_automation", "label": "Exécuter une automatisation"},
            {"value": "generate_report", "label": "Générer un rapport"},
            {"value": "send_reminder", "label": "Envoyer un rappel"},
            {"value": "cleanup", "label": "Nettoyage"},
            {"value": "sync", "label": "Synchronisation"},
            {"value": "custom", "label": "Personnalisé"}
        ]
    }


# ==================== WORKER (à appeler périodiquement) ====================

async def process_pending_tasks():
    """
    Traite les tâches en attente
    À appeler via un cron job ou un worker
    """
    from app.db.session import SessionLocal
    
    db = SessionLocal()
    
    try:
        # Récupérer les tâches à exécuter
        now = datetime.utcnow()
        tasks = db.query(ScheduledTask).filter(
            and_(
                ScheduledTask.status == ScheduledTaskStatus.PENDING,
                ScheduledTask.scheduled_at <= now
            )
        ).all()
        
        for task in tasks:
            try:
                task.status = ScheduledTaskStatus.RUNNING
                db.commit()
                
                # Exécuter la tâche selon son type
                result = await execute_task(db, task)
                
                task.status = ScheduledTaskStatus.COMPLETED
                task.executed_at = datetime.utcnow()
                task.result = result
                
                # Si récurrente, planifier la prochaine exécution
                if task.is_recurring and task.cron_expression:
                    cron = croniter(task.cron_expression, datetime.utcnow())
                    task.next_run_at = cron.get_next(datetime)
                    task.scheduled_at = task.next_run_at
                    task.status = ScheduledTaskStatus.PENDING
                
            except Exception as e:
                task.status = ScheduledTaskStatus.FAILED
                task.error_message = str(e)
                task.retry_count += 1
                
                # Réessayer si possible
                if task.retry_count < task.max_retries:
                    task.status = ScheduledTaskStatus.PENDING
                    task.scheduled_at = datetime.utcnow() + timedelta(minutes=5 * task.retry_count)
            
            db.commit()
            
    finally:
        db.close()


async def execute_task(db: Session, task: ScheduledTask) -> dict:
    """Exécute une tâche selon son type"""
    config = task.config or {}
    
    if task.task_type == "send_campaign":
        # Envoyer une campagne
        campaign_id = config.get("campaign_id")
        # TODO: Appeler la logique d'envoi de campagne
        return {"campaign_id": campaign_id, "status": "sent"}
    
    elif task.task_type == "run_automation":
        # Exécuter une automatisation
        automation_id = config.get("automation_id")
        entity_type = config.get("entity_type")
        entity_id = config.get("entity_id")
        # TODO: Appeler la logique d'automatisation
        return {"automation_id": automation_id, "status": "executed"}
    
    elif task.task_type == "generate_report":
        # Générer un rapport
        report_type = config.get("report_type")
        # TODO: Appeler la logique de génération de rapport
        return {"report_type": report_type, "status": "generated"}
    
    elif task.task_type == "send_reminder":
        # Envoyer un rappel
        user_id = config.get("user_id")
        message = config.get("message")
        # TODO: Créer une notification
        return {"user_id": user_id, "status": "sent"}
    
    elif task.task_type == "cleanup":
        # Nettoyage
        target = config.get("target")
        # TODO: Logique de nettoyage
        return {"target": target, "status": "cleaned"}
    
    elif task.task_type == "sync":
        # Synchronisation
        integration_id = config.get("integration_id")
        # TODO: Logique de synchronisation
        return {"integration_id": integration_id, "status": "synced"}
    
    return {"status": "unknown_task_type"}
