"""
Routes API pour les permissions et partage GED
"""

import secrets
import hashlib
from typing import List, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from pydantic import BaseModel

from app.db.session import get_db
from app.core.deps import get_current_user, get_current_tenant
from app.models.user import User
from app.models.tenant import Tenant
from app.models.document import (
    Document, DocumentFolder, DocumentPermission, DocumentShareLink,
    ShareLinkAccessLog, PermissionLevel, ShareType
)

router = APIRouter()


def generate_share_token() -> str:
    """Génère un token de partage unique"""
    return secrets.token_urlsafe(32)


def hash_password(password: str) -> str:
    """Hash un mot de passe pour les liens protégés"""
    return hashlib.sha256(password.encode()).hexdigest()


def verify_password(password: str, hashed: str) -> bool:
    """Vérifie un mot de passe"""
    return hash_password(password) == hashed


# ==================== SCHEMAS ====================

class PermissionCreate(BaseModel):
    document_id: Optional[str] = None
    folder_id: Optional[str] = None
    share_type: str = "user"
    user_id: Optional[str] = None
    team_name: Optional[str] = None
    external_email: Optional[str] = None
    permission_level: str = "view"
    can_reshare: bool = False
    inherit_to_children: bool = True
    expires_in_days: Optional[int] = None
    notes: Optional[str] = None


class ShareLinkCreate(BaseModel):
    document_id: Optional[str] = None
    folder_id: Optional[str] = None
    name: Optional[str] = None
    password: Optional[str] = None
    permission_level: str = "view"
    allow_download: bool = True
    max_views: Optional[int] = None
    max_downloads: Optional[int] = None
    expires_in_days: Optional[int] = None
    notes: Optional[str] = None


class ShareLinkAccess(BaseModel):
    password: Optional[str] = None


# ==================== PERMISSIONS ====================

@router.get("/document/{document_id}")
async def get_document_permissions(
    document_id: str,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Liste les permissions d'un document"""
    # Vérifier que le document existe
    document = db.query(Document).filter(
        and_(
            Document.id == document_id,
            Document.tenant_id == current_tenant.id
        )
    ).first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document non trouvé")
    
    permissions = db.query(DocumentPermission).filter(
        DocumentPermission.document_id == document_id
    ).all()
    
    return {
        "document_id": document_id,
        "document_name": document.title or document.filename,
        "permissions": [
            {
                "id": str(p.id),
                "share_type": p.share_type,
                "user_id": str(p.user_id) if p.user_id else None,
                "user_name": p.user.full_name if p.user else None,
                "team_name": p.team_name,
                "external_email": p.external_email,
                "permission_level": p.permission_level,
                "can_reshare": p.can_reshare,
                "expires_at": p.expires_at.isoformat() if p.expires_at else None,
                "granted_by": str(p.granted_by),
                "granter_name": p.granter.full_name if p.granter else None,
                "created_at": p.created_at.isoformat() if p.created_at else None
            }
            for p in permissions
        ]
    }


@router.post("/")
async def create_permission(
    data: PermissionCreate,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Créer une permission (partager un document/dossier)"""
    # Vérifier qu'on a soit document_id soit folder_id
    if not data.document_id and not data.folder_id:
        raise HTTPException(status_code=400, detail="document_id ou folder_id requis")
    
    # Vérifier que l'entité existe
    if data.document_id:
        entity = db.query(Document).filter(
            and_(
                Document.id == data.document_id,
                Document.tenant_id == current_tenant.id
            )
        ).first()
        if not entity:
            raise HTTPException(status_code=404, detail="Document non trouvé")
    else:
        entity = db.query(DocumentFolder).filter(
            and_(
                DocumentFolder.id == data.folder_id,
                DocumentFolder.tenant_id == current_tenant.id
            )
        ).first()
        if not entity:
            raise HTTPException(status_code=404, detail="Dossier non trouvé")
    
    # Calculer l'expiration
    expires_at = None
    if data.expires_in_days:
        expires_at = datetime.utcnow() + timedelta(days=data.expires_in_days)
    
    # Créer la permission
    permission = DocumentPermission(
        document_id=data.document_id,
        folder_id=data.folder_id,
        share_type=data.share_type,
        user_id=data.user_id,
        team_name=data.team_name,
        external_email=data.external_email,
        permission_level=data.permission_level,
        can_reshare=data.can_reshare,
        inherit_to_children=data.inherit_to_children,
        expires_at=expires_at,
        granted_by=current_user.id,
        notes=data.notes,
        tenant_id=current_tenant.id
    )
    
    db.add(permission)
    db.commit()
    db.refresh(permission)
    
    return {
        "id": str(permission.id),
        "message": "Permission créée avec succès"
    }


@router.delete("/{permission_id}")
async def delete_permission(
    permission_id: str,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Supprimer une permission"""
    permission = db.query(DocumentPermission).filter(
        and_(
            DocumentPermission.id == permission_id,
            DocumentPermission.tenant_id == current_tenant.id
        )
    ).first()
    
    if not permission:
        raise HTTPException(status_code=404, detail="Permission non trouvée")
    
    db.delete(permission)
    db.commit()
    
    return {"message": "Permission supprimée"}


# ==================== LIENS DE PARTAGE ====================

@router.get("/links/document/{document_id}")
async def get_document_share_links(
    document_id: str,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Liste les liens de partage d'un document"""
    links = db.query(DocumentShareLink).filter(
        and_(
            DocumentShareLink.document_id == document_id,
            DocumentShareLink.tenant_id == current_tenant.id
        )
    ).all()
    
    base_url = "https://www.sekagestion.com/share"
    
    return [
        {
            "id": str(link.id),
            "name": link.name,
            "share_url": f"{base_url}/{link.share_token}",
            "requires_password": link.requires_password,
            "permission_level": link.permission_level,
            "allow_download": link.allow_download,
            "max_views": link.max_views,
            "current_views": link.current_views,
            "max_downloads": link.max_downloads,
            "current_downloads": link.current_downloads,
            "expires_at": link.expires_at.isoformat() if link.expires_at else None,
            "is_active": link.is_active,
            "is_expired": link.is_expired,
            "created_at": link.created_at.isoformat() if link.created_at else None,
            "created_by": link.creator.full_name if link.creator else None
        }
        for link in links
    ]


@router.post("/links")
async def create_share_link(
    data: ShareLinkCreate,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Créer un lien de partage public"""
    # Vérifier qu'on a soit document_id soit folder_id
    if not data.document_id and not data.folder_id:
        raise HTTPException(status_code=400, detail="document_id ou folder_id requis")
    
    # Vérifier que l'entité existe
    if data.document_id:
        entity = db.query(Document).filter(
            and_(
                Document.id == data.document_id,
                Document.tenant_id == current_tenant.id
            )
        ).first()
        if not entity:
            raise HTTPException(status_code=404, detail="Document non trouvé")
        entity_name = entity.title or entity.filename
    else:
        entity = db.query(DocumentFolder).filter(
            and_(
                DocumentFolder.id == data.folder_id,
                DocumentFolder.tenant_id == current_tenant.id
            )
        ).first()
        if not entity:
            raise HTTPException(status_code=404, detail="Dossier non trouvé")
        entity_name = entity.name
    
    # Générer le token
    share_token = generate_share_token()
    
    # Hash du mot de passe si fourni
    password_hash = None
    requires_password = False
    if data.password:
        password_hash = hash_password(data.password)
        requires_password = True
    
    # Calculer l'expiration
    expires_at = None
    if data.expires_in_days:
        expires_at = datetime.utcnow() + timedelta(days=data.expires_in_days)
    
    # Créer le lien
    link = DocumentShareLink(
        document_id=data.document_id,
        folder_id=data.folder_id,
        share_token=share_token,
        password_hash=password_hash,
        requires_password=requires_password,
        permission_level=data.permission_level,
        allow_download=data.allow_download,
        max_views=data.max_views,
        max_downloads=data.max_downloads,
        expires_at=expires_at,
        name=data.name or f"Lien pour {entity_name}",
        notes=data.notes,
        created_by=current_user.id,
        tenant_id=current_tenant.id
    )
    
    db.add(link)
    db.commit()
    db.refresh(link)
    
    base_url = "https://www.sekagestion.com/share"
    
    return {
        "id": str(link.id),
        "share_token": share_token,
        "share_url": f"{base_url}/{share_token}",
        "requires_password": requires_password,
        "expires_at": expires_at.isoformat() if expires_at else None,
        "message": "Lien de partage créé"
    }


@router.put("/links/{link_id}")
async def update_share_link(
    link_id: str,
    is_active: Optional[bool] = None,
    max_views: Optional[int] = None,
    max_downloads: Optional[int] = None,
    expires_in_days: Optional[int] = None,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Modifier un lien de partage"""
    link = db.query(DocumentShareLink).filter(
        and_(
            DocumentShareLink.id == link_id,
            DocumentShareLink.tenant_id == current_tenant.id
        )
    ).first()
    
    if not link:
        raise HTTPException(status_code=404, detail="Lien non trouvé")
    
    if is_active is not None:
        link.is_active = is_active
    if max_views is not None:
        link.max_views = max_views
    if max_downloads is not None:
        link.max_downloads = max_downloads
    if expires_in_days is not None:
        link.expires_at = datetime.utcnow() + timedelta(days=expires_in_days)
    
    db.commit()
    
    return {"message": "Lien mis à jour"}


@router.delete("/links/{link_id}")
async def delete_share_link(
    link_id: str,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Supprimer un lien de partage"""
    link = db.query(DocumentShareLink).filter(
        and_(
            DocumentShareLink.id == link_id,
            DocumentShareLink.tenant_id == current_tenant.id
        )
    ).first()
    
    if not link:
        raise HTTPException(status_code=404, detail="Lien non trouvé")
    
    db.delete(link)
    db.commit()
    
    return {"message": "Lien supprimé"}


# ==================== ACCÈS PUBLIC (sans auth) ====================

@router.get("/public/{share_token}")
async def access_share_link(
    share_token: str,
    password: Optional[str] = Query(None),
    request: Request = None,
    db: Session = Depends(get_db)
):
    """
    Accéder à un document via un lien de partage public
    Route publique (pas d'authentification requise)
    """
    link = db.query(DocumentShareLink).filter(
        DocumentShareLink.share_token == share_token
    ).first()
    
    if not link:
        raise HTTPException(status_code=404, detail="Lien non trouvé ou expiré")
    
    # Vérifications
    if not link.is_active:
        raise HTTPException(status_code=403, detail="Ce lien a été désactivé")
    
    if link.is_expired:
        raise HTTPException(status_code=403, detail="Ce lien a expiré")
    
    if link.is_view_limit_reached:
        raise HTTPException(status_code=403, detail="Limite de vues atteinte")
    
    # Vérifier le mot de passe si requis
    if link.requires_password:
        if not password:
            return {
                "requires_password": True,
                "message": "Mot de passe requis"
            }
        if not verify_password(password, link.password_hash):
            raise HTTPException(status_code=403, detail="Mot de passe incorrect")
    
    # Incrémenter le compteur de vues
    link.current_views += 1
    
    # Logger l'accès
    log = ShareLinkAccessLog(
        share_link_id=link.id,
        access_type="view",
        ip_address=request.client.host if request and request.client else None,
        user_agent=request.headers.get("user-agent", "")[:500] if request else None,
        referer=request.headers.get("referer", "")[:500] if request else None
    )
    db.add(log)
    db.commit()
    
    # Retourner les infos du document
    if link.document_id:
        doc = link.document
        return {
            "type": "document",
            "id": str(doc.id),
            "name": doc.title or doc.filename,
            "file_type": doc.file_extension,
            "file_size": doc.file_size,
            "content_type": doc.content_type,
            "allow_download": link.allow_download,
            "download_url": f"/api/v1/ged/permissions/public/{share_token}/download" if link.allow_download else None
        }
    else:
        folder = link.folder
        # Lister les documents du dossier
        documents = db.query(Document).filter(
            Document.folder_id == folder.id
        ).all()
        
        return {
            "type": "folder",
            "id": str(folder.id),
            "name": folder.name,
            "allow_download": link.allow_download,
            "documents": [
                {
                    "id": str(d.id),
                    "name": d.title or d.filename,
                    "file_type": d.file_extension,
                    "file_size": d.file_size
                }
                for d in documents
            ]
        }


@router.get("/public/{share_token}/download")
async def download_via_share_link(
    share_token: str,
    password: Optional[str] = Query(None),
    request: Request = None,
    db: Session = Depends(get_db)
):
    """
    Télécharger un document via un lien de partage
    Route publique (pas d'authentification requise)
    """
    link = db.query(DocumentShareLink).filter(
        DocumentShareLink.share_token == share_token
    ).first()
    
    if not link:
        raise HTTPException(status_code=404, detail="Lien non trouvé")
    
    if not link.is_active or link.is_expired:
        raise HTTPException(status_code=403, detail="Lien expiré ou désactivé")
    
    if not link.allow_download:
        raise HTTPException(status_code=403, detail="Téléchargement non autorisé")
    
    if link.is_download_limit_reached:
        raise HTTPException(status_code=403, detail="Limite de téléchargements atteinte")
    
    # Vérifier le mot de passe
    if link.requires_password:
        if not password or not verify_password(password, link.password_hash):
            raise HTTPException(status_code=403, detail="Mot de passe requis ou incorrect")
    
    # Incrémenter le compteur
    link.current_downloads += 1
    
    # Logger l'accès
    log = ShareLinkAccessLog(
        share_link_id=link.id,
        access_type="download",
        ip_address=request.client.host if request and request.client else None,
        user_agent=request.headers.get("user-agent", "")[:500] if request else None
    )
    db.add(log)
    db.commit()
    
    # Rediriger vers le fichier
    if link.document_id:
        doc = link.document
        # Retourner l'URL de téléchargement (à adapter selon votre stockage)
        return {
            "download_url": doc.file_path,
            "filename": doc.original_filename
        }
    
    raise HTTPException(status_code=400, detail="Téléchargement de dossier non supporté")


@router.get("/links/{link_id}/stats")
async def get_share_link_stats(
    link_id: str,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Statistiques d'un lien de partage"""
    link = db.query(DocumentShareLink).filter(
        and_(
            DocumentShareLink.id == link_id,
            DocumentShareLink.tenant_id == current_tenant.id
        )
    ).first()
    
    if not link:
        raise HTTPException(status_code=404, detail="Lien non trouvé")
    
    # Récupérer les logs
    logs = db.query(ShareLinkAccessLog).filter(
        ShareLinkAccessLog.share_link_id == link_id
    ).order_by(ShareLinkAccessLog.accessed_at.desc()).limit(50).all()
    
    views = [l for l in logs if l.access_type == "view"]
    downloads = [l for l in logs if l.access_type == "download"]
    
    return {
        "link_id": link_id,
        "total_views": link.current_views,
        "total_downloads": link.current_downloads,
        "max_views": link.max_views,
        "max_downloads": link.max_downloads,
        "is_active": link.is_active,
        "is_expired": link.is_expired,
        "recent_access": [
            {
                "type": log.access_type,
                "ip": log.ip_address,
                "user_agent": log.user_agent[:100] if log.user_agent else None,
                "at": log.accessed_at.isoformat()
            }
            for log in logs[:20]
        ]
    }
