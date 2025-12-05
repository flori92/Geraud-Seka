"""
Routes API pour les notifications temps réel
"""

from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc
from pydantic import BaseModel

from app.db.session import get_db
from app.api.deps import get_current_user, get_current_tenant
from app.models.user import User
from app.models.tenant import Tenant
from app.models.notifications import Notification, NotificationType

router = APIRouter()


# ==================== SCHEMAS ====================

class NotificationCreate(BaseModel):
    user_id: str
    title: str
    message: Optional[str] = None
    type: str = "info"
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None
    action_url: Optional[str] = None
    data: Optional[dict] = None


# ==================== WEBSOCKET MANAGER ====================

class ConnectionManager:
    """Gestionnaire de connexions WebSocket"""
    
    def __init__(self):
        self.active_connections: dict[str, List[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)
    
    def disconnect(self, websocket: WebSocket, user_id: str):
        if user_id in self.active_connections:
            self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
    
    async def send_to_user(self, user_id: str, message: dict):
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_json(message)
                except:
                    pass
    
    async def broadcast_to_tenant(self, tenant_id: str, message: dict, db: Session):
        # Récupérer tous les utilisateurs du tenant
        from app.models.user import User
        users = db.query(User).filter(User.tenant_id == tenant_id).all()
        for user in users:
            await self.send_to_user(str(user.id), message)


manager = ConnectionManager()


# ==================== WEBSOCKET ENDPOINT ====================

@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    """
    Endpoint WebSocket pour les notifications temps réel
    """
    await manager.connect(websocket, user_id)
    try:
        while True:
            # Garder la connexion ouverte
            data = await websocket.receive_text()
            # Peut être utilisé pour des commandes (ping, etc.)
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)


# ==================== ROUTES ====================

@router.get("/")
async def list_notifications(
    is_read: Optional[bool] = Query(None),
    type: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Liste les notifications de l'utilisateur"""
    query = db.query(Notification).filter(
        and_(
            Notification.user_id == current_user.id,
            Notification.tenant_id == current_tenant.id
        )
    )
    
    if is_read is not None:
        query = query.filter(Notification.is_read == is_read)
    if type:
        query = query.filter(Notification.type == type)
    
    total = query.count()
    unread_count = db.query(Notification).filter(
        and_(
            Notification.user_id == current_user.id,
            Notification.is_read == False
        )
    ).count()
    
    notifications = query.order_by(desc(Notification.created_at)).offset(offset).limit(limit).all()
    
    return {
        "total": total,
        "unread_count": unread_count,
        "notifications": [
            {
                "id": str(n.id),
                "title": n.title,
                "message": n.message,
                "type": n.type,
                "entity_type": n.entity_type,
                "entity_id": str(n.entity_id) if n.entity_id else None,
                "action_url": n.action_url,
                "is_read": n.is_read,
                "read_at": n.read_at.isoformat() if n.read_at else None,
                "data": n.data,
                "created_at": n.created_at.isoformat() if n.created_at else None
            }
            for n in notifications
        ]
    }


@router.post("/")
async def create_notification(
    data: NotificationCreate,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Créer une notification (admin/système)"""
    notification = Notification(
        user_id=data.user_id,
        title=data.title,
        message=data.message,
        type=data.type,
        entity_type=data.entity_type,
        entity_id=data.entity_id,
        action_url=data.action_url,
        data=data.data,
        tenant_id=current_tenant.id
    )
    
    db.add(notification)
    db.commit()
    db.refresh(notification)
    
    # Envoyer via WebSocket
    await manager.send_to_user(data.user_id, {
        "type": "notification",
        "data": {
            "id": str(notification.id),
            "title": notification.title,
            "message": notification.message,
            "type": notification.type,
            "action_url": notification.action_url
        }
    })
    
    return {"id": str(notification.id), "message": "Notification créée"}


@router.put("/{notification_id}/read")
async def mark_as_read(
    notification_id: str,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Marquer une notification comme lue"""
    notification = db.query(Notification).filter(
        and_(
            Notification.id == notification_id,
            Notification.user_id == current_user.id
        )
    ).first()
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification non trouvée")
    
    notification.is_read = True
    notification.read_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Notification marquée comme lue"}


@router.put("/read-all")
async def mark_all_as_read(
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Marquer toutes les notifications comme lues"""
    db.query(Notification).filter(
        and_(
            Notification.user_id == current_user.id,
            Notification.is_read == False
        )
    ).update({
        "is_read": True,
        "read_at": datetime.utcnow()
    })
    
    db.commit()
    
    return {"message": "Toutes les notifications marquées comme lues"}


@router.delete("/{notification_id}")
async def delete_notification(
    notification_id: str,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Supprimer une notification"""
    notification = db.query(Notification).filter(
        and_(
            Notification.id == notification_id,
            Notification.user_id == current_user.id
        )
    ).first()
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification non trouvée")
    
    db.delete(notification)
    db.commit()
    
    return {"message": "Notification supprimée"}


@router.delete("/")
async def clear_notifications(
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Supprimer toutes les notifications lues"""
    db.query(Notification).filter(
        and_(
            Notification.user_id == current_user.id,
            Notification.is_read == True
        )
    ).delete()
    
    db.commit()
    
    return {"message": "Notifications lues supprimées"}


# ==================== HELPER FUNCTIONS ====================

async def send_notification(
    db: Session,
    user_id: str,
    tenant_id: str,
    title: str,
    message: str = None,
    type: str = "info",
    entity_type: str = None,
    entity_id: str = None,
    action_url: str = None,
    data: dict = None
):
    """
    Helper pour créer et envoyer une notification
    Utilisable depuis d'autres modules
    """
    notification = Notification(
        user_id=user_id,
        title=title,
        message=message,
        type=type,
        entity_type=entity_type,
        entity_id=entity_id,
        action_url=action_url,
        data=data,
        tenant_id=tenant_id
    )
    
    db.add(notification)
    db.commit()
    db.refresh(notification)
    
    # Envoyer via WebSocket
    await manager.send_to_user(user_id, {
        "type": "notification",
        "data": {
            "id": str(notification.id),
            "title": title,
            "message": message,
            "type": type,
            "action_url": action_url
        }
    })
    
    return notification
