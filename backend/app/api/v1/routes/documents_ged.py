"""
Routes API pour la GED (Gestion Électronique de Documents)
"""

from typing import List, Optional
from uuid import UUID
from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, BackgroundTasks
from fastapi.responses import FileResponse
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import and_, or_, desc, func

from app.db.session import get_db
from app.core.deps import get_current_user, get_current_tenant
from app.models.user import User
from app.models.tenant import Tenant
from app.models.document import Document, DocumentFolder, DocumentStatus, DocumentType, DocumentCategory
from app.schemas.document_ged import (
    DocumentFolderCreate, DocumentFolderUpdate, DocumentFolder as DocumentFolderSchema,
    DocumentFolderWithStats, DocumentCreate, DocumentUpdate, Document as DocumentSchema,
    DocumentWithRelations, DocumentSearchFilters, DocumentStats
)

router = APIRouter()


# ==================== DOSSIERS ====================

@router.get("/folders/", response_model=List[DocumentFolderSchema])
async def get_folders(
    parent_id: Optional[str] = Query(None),
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Récupérer les dossiers (racine ou sous-dossiers)"""
    query = db.query(DocumentFolder).filter(DocumentFolder.tenant_id == current_tenant.id)
    
    if parent_id:
        query = query.filter(DocumentFolder.parent_id == parent_id)
    else:
        query = query.filter(DocumentFolder.parent_id.is_(None))
    
    folders = query.order_by(DocumentFolder.name).all()
    return folders


@router.post("/folders/", response_model=DocumentFolderSchema)
async def create_folder(
    folder_in: DocumentFolderCreate,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Créer un nouveau dossier"""
    # Vérifier que le parent existe si spécifié
    if folder_in.parent_id:
        parent = db.query(DocumentFolder).filter(
            and_(
                DocumentFolder.id == folder_in.parent_id,
                DocumentFolder.tenant_id == current_tenant.id
            )
        ).first()
        if not parent:
            raise HTTPException(status_code=404, detail="Dossier parent non trouvé")
        
        # Construire le chemin
        path = f"{parent.path}/{folder_in.name}" if parent.path else folder_in.name
    else:
        path = folder_in.name
    
    folder = DocumentFolder(
        **folder_in.model_dump(),
        path=path,
        tenant_id=current_tenant.id,
        created_by=current_user.id
    )
    
    db.add(folder)
    db.commit()
    db.refresh(folder)
    
    return folder


@router.put("/folders/{folder_id}", response_model=DocumentFolderSchema)
async def update_folder(
    folder_id: str,
    folder_in: DocumentFolderUpdate,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mettre à jour un dossier"""
    folder = db.query(DocumentFolder).filter(
        and_(
            DocumentFolder.id == folder_id,
            DocumentFolder.tenant_id == current_tenant.id
        )
    ).first()
    
    if not folder:
        raise HTTPException(status_code=404, detail="Dossier non trouvé")
    
    update_data = folder_in.model_dump(exclude_unset=True)
    
    # Si le nom change, mettre à jour le chemin
    if 'name' in update_data and update_data['name'] != folder.name:
        old_path = folder.path
        if folder.parent_id:
            parent = folder.parent
            new_path = f"{parent.path}/{update_data['name']}" if parent.path else update_data['name']
        else:
            new_path = update_data['name']
        
        update_data['path'] = new_path
        
        # Mettre à jour les chemins des sous-dossiers
        subfolders = db.query(DocumentFolder).filter(
            DocumentFolder.path.like(f"{old_path}/%")
        ).all()
        
        for subfolder in subfolders:
            subfolder.path = subfolder.path.replace(old_path, new_path, 1)
    
    for field, value in update_data.items():
        setattr(folder, field, value)
    
    db.commit()
    db.refresh(folder)
    
    return folder


@router.delete("/folders/{folder_id}")
async def delete_folder(
    folder_id: str,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Supprimer un dossier (et ses sous-dossiers/documents)"""
    folder = db.query(DocumentFolder).filter(
        and_(
            DocumentFolder.id == folder_id,
            DocumentFolder.tenant_id == current_tenant.id
        )
    ).first()
    
    if not folder:
        raise HTTPException(status_code=404, detail="Dossier non trouvé")
    
    # Vérifier s'il y a des documents
    doc_count = db.query(func.count(Document.id)).filter(
        Document.folder_id == folder_id
    ).scalar()
    
    if doc_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Le dossier contient {doc_count} document(s). Veuillez les déplacer ou supprimer d'abord."
        )
    
    db.delete(folder)
    db.commit()
    
    return {"message": "Dossier supprimé avec succès", "id": folder_id}


@router.get("/folders/{folder_id}/stats", response_model=DocumentFolderWithStats)
async def get_folder_stats(
    folder_id: str,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Récupérer les statistiques d'un dossier"""
    folder = db.query(DocumentFolder).filter(
        and_(
            DocumentFolder.id == folder_id,
            DocumentFolder.tenant_id == current_tenant.id
        )
    ).first()
    
    if not folder:
        raise HTTPException(status_code=404, detail="Dossier non trouvé")
    
    # Compter les documents
    doc_count = db.query(func.count(Document.id)).filter(
        Document.folder_id == folder_id
    ).scalar()
    
    # Compter les sous-dossiers
    subfolder_count = db.query(func.count(DocumentFolder.id)).filter(
        DocumentFolder.parent_id == folder_id
    ).scalar()
    
    # Calculer la taille totale
    total_size = db.query(func.sum(Document.file_size)).filter(
        Document.folder_id == folder_id
    ).scalar() or 0
    
    return {
        **folder.__dict__,
        "document_count": doc_count,
        "subfolder_count": subfolder_count,
        "total_size": int(total_size)
    }


# ==================== DOCUMENTS ====================

@router.get("/", response_model=List[DocumentWithRelations])
async def get_documents(
    folder_id: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    is_archived: Optional[bool] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Récupérer les documents avec filtres"""
    query = db.query(Document).filter(Document.tenant_id == current_tenant.id)
    
    if folder_id:
        query = query.filter(Document.folder_id == folder_id)
    
    if category:
        query = query.filter(Document.category == category)
    
    if type:
        query = query.filter(Document.type == type)
    
    if status:
        query = query.filter(Document.status == status)
    
    if is_archived is not None:
        query = query.filter(Document.is_archived == is_archived)
    
    documents = query.options(
        selectinload(Document.folder),
        selectinload(Document.client),
        selectinload(Document.supplier),
        selectinload(Document.uploader)
    ).order_by(desc(Document.created_at)).offset(offset).limit(limit).all()
    
    # Formater la réponse
    result = []
    for doc in documents:
        base = jsonable_encoder(doc)
        result.append({
            **base,
            "folder_name": doc.folder.name if doc.folder else None,
            "client_name": doc.client.name if doc.client else None,
            "supplier_name": doc.supplier.name if doc.supplier else None,
            "uploader_name": doc.uploader.full_name if doc.uploader else None,
            "file_size_formatted": doc.file_size_formatted,
            "full_path": doc.full_path
        })
    
    return result


@router.post("/upload", response_model=DocumentSchema)
async def upload_document(
    file: UploadFile = File(...),
    folder_id: Optional[str] = None,
    title: Optional[str] = None,
    description: Optional[str] = None,
    category: Optional[str] = "other",
    type: Optional[str] = "OTHER",
    tags: Optional[str] = None,  # JSON string
    client_id: Optional[str] = None,
    supplier_id: Optional[str] = None,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload un nouveau document
    TODO: Intégrer avec le service de stockage (S3, R2, etc.)
    """
    import os
    import json
    from pathlib import Path
    
    # Vérifier le dossier si spécifié
    if folder_id:
        folder = db.query(DocumentFolder).filter(
            and_(
                DocumentFolder.id == folder_id,
                DocumentFolder.tenant_id == current_tenant.id
            )
        ).first()
        if not folder:
            raise HTTPException(status_code=404, detail="Dossier non trouvé")
    
    # Lire le fichier
    content = await file.read()
    file_size = len(content)
    
    # Extraire l'extension
    file_extension = Path(file.filename).suffix.lower()
    
    # TODO: Upload vers le stockage cloud
    # Pour l'instant, on simule avec un chemin local
    file_path = f"uploads/{current_tenant.id}/{file.filename}"
    
    # Parser les tags si fournis
    tags_list = None
    if tags:
        try:
            tags_list = json.loads(tags)
        except:
            tags_list = [tags]
    
    # Créer le document
    document = Document(
        filename=file.filename,
        original_filename=file.filename,
        file_path=file_path,
        content_type=file.content_type,
        file_size=file_size,
        file_extension=file_extension,
        title=title or file.filename,
        description=description,
        category=category,
        type=type,
        tags=tags_list,
        status=DocumentStatus.UPLOADED,
        folder_id=folder_id,
        client_id=client_id,
        supplier_id=supplier_id,
        tenant_id=current_tenant.id,
        uploaded_by=current_user.id
    )
    
    db.add(document)
    db.commit()
    db.refresh(document)
    
    return document


@router.get("/{document_id}", response_model=DocumentWithRelations)
async def get_document(
    document_id: str,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Récupérer un document par ID"""
    document = db.query(Document).options(
        selectinload(Document.folder),
        selectinload(Document.client),
        selectinload(Document.supplier),
        selectinload(Document.uploader),
        selectinload(Document.validator),
        selectinload(Document.versions)
    ).filter(
        and_(
            Document.id == document_id,
            Document.tenant_id == current_tenant.id
        )
    ).first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document non trouvé")

    base = jsonable_encoder(document)
    return {
        **base,
        "folder_name": document.folder.name if document.folder else None,
        "client_name": document.client.name if document.client else None,
        "supplier_name": document.supplier.name if document.supplier else None,
        "uploader_name": document.uploader.full_name if document.uploader else None,
        "validator_name": document.validator.full_name if document.validator else None,
        "file_size_formatted": document.file_size_formatted,
        "full_path": document.full_path
    }


@router.put("/{document_id}", response_model=DocumentSchema)
async def update_document(
    document_id: str,
    document_in: DocumentUpdate,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mettre à jour un document"""
    document = db.query(Document).filter(
        and_(
            Document.id == document_id,
            Document.tenant_id == current_tenant.id
        )
    ).first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document non trouvé")
    
    if document.is_locked:
        raise HTTPException(status_code=403, detail="Document verrouillé")
    
    update_data = document_in.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(document, field, value)
    
    db.commit()
    db.refresh(document)
    
    return document


@router.delete("/{document_id}")
async def delete_document(
    document_id: str,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Supprimer un document"""
    document = db.query(Document).filter(
        and_(
            Document.id == document_id,
            Document.tenant_id == current_tenant.id
        )
    ).first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document non trouvé")
    
    if document.is_locked:
        raise HTTPException(status_code=403, detail="Document verrouillé, impossible de supprimer")
    
    # TODO: Supprimer le fichier du stockage cloud
    
    db.delete(document)
    db.commit()
    
    return {"message": "Document supprimé avec succès", "id": document_id}


@router.post("/search", response_model=List[DocumentWithRelations])
async def search_documents(
    filters: DocumentSearchFilters,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Recherche avancée de documents"""
    query = db.query(Document).filter(Document.tenant_id == current_tenant.id)
    
    # Recherche textuelle
    if filters.query:
        search_term = f"%{filters.query}%"
        query = query.filter(
            or_(
                Document.title.ilike(search_term),
                Document.description.ilike(search_term),
                Document.filename.ilike(search_term),
                Document.reference_number.ilike(search_term)
            )
        )
    
    # Filtres
    if filters.category:
        query = query.filter(Document.category == filters.category)
    
    if filters.type:
        query = query.filter(Document.type == filters.type)
    
    if filters.folder_id:
        query = query.filter(Document.folder_id == filters.folder_id)
    
    if filters.client_id:
        query = query.filter(Document.client_id == filters.client_id)
    
    if filters.supplier_id:
        query = query.filter(Document.supplier_id == filters.supplier_id)
    
    if filters.lead_id:
        query = query.filter(Document.lead_id == filters.lead_id)
    
    if filters.opportunity_id:
        query = query.filter(Document.opportunity_id == filters.opportunity_id)
    
    if filters.is_confidential is not None:
        query = query.filter(Document.is_confidential == filters.is_confidential)
    
    if filters.is_archived is not None:
        query = query.filter(Document.is_archived == filters.is_archived)
    
    if filters.status:
        query = query.filter(Document.status == filters.status)
    
    if filters.uploaded_by:
        query = query.filter(Document.uploaded_by == filters.uploaded_by)
    
    # Filtres de dates
    if filters.date_from:
        query = query.filter(Document.document_date >= filters.date_from)
    
    if filters.date_to:
        query = query.filter(Document.document_date <= filters.date_to)
    
    # Filtres de taille
    if filters.min_size:
        query = query.filter(Document.file_size >= filters.min_size)
    
    if filters.max_size:
        query = query.filter(Document.file_size <= filters.max_size)
    
    # Tags
    if filters.tags:
        for tag in filters.tags:
            query = query.filter(Document.tags.contains([tag]))
    
    documents = query.options(
        selectinload(Document.folder),
        selectinload(Document.client),
        selectinload(Document.supplier),
        selectinload(Document.uploader)
    ).order_by(desc(Document.created_at)).offset(offset).limit(limit).all()
    
    # Formater la réponse
    result = []
    for doc in documents:
        base = jsonable_encoder(doc)
        result.append({
            **base,
            "folder_name": doc.folder.name if doc.folder else None,
            "client_name": doc.client.name if doc.client else None,
            "supplier_name": doc.supplier.name if doc.supplier else None,
            "uploader_name": doc.uploader.full_name if doc.uploader else None,
            "file_size_formatted": doc.file_size_formatted,
            "full_path": doc.full_path
        })
    
    return result


@router.get("/stats/overview", response_model=DocumentStats)
async def get_document_stats(
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Récupérer les statistiques globales des documents"""
    from datetime import timedelta
    
    # Total documents
    total_documents = db.query(func.count(Document.id)).filter(
        Document.tenant_id == current_tenant.id
    ).scalar()
    
    # Taille totale
    total_size = db.query(func.sum(Document.file_size)).filter(
        Document.tenant_id == current_tenant.id
    ).scalar() or 0
    
    # Par catégorie
    by_category = {}
    categories = db.query(
        Document.category,
        func.count(Document.id)
    ).filter(
        Document.tenant_id == current_tenant.id
    ).group_by(Document.category).all()
    
    for cat, count in categories:
        by_category[cat or "other"] = count
    
    # Par type
    by_type = {}
    types = db.query(
        Document.type,
        func.count(Document.id)
    ).filter(
        Document.tenant_id == current_tenant.id
    ).group_by(Document.type).all()
    
    for typ, count in types:
        by_type[typ or "OTHER"] = count
    
    # Par statut
    by_status = {}
    statuses = db.query(
        Document.status,
        func.count(Document.id)
    ).filter(
        Document.tenant_id == current_tenant.id
    ).group_by(Document.status).all()
    
    for status, count in statuses:
        by_status[status] = count
    
    # Uploads récents (7 derniers jours)
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    recent_uploads = db.query(func.count(Document.id)).filter(
        and_(
            Document.tenant_id == current_tenant.id,
            Document.created_at >= seven_days_ago
        )
    ).scalar()
    
    # En attente de validation
    pending_validation = db.query(func.count(Document.id)).filter(
        and_(
            Document.tenant_id == current_tenant.id,
            Document.requires_validation == True,
            Document.validated_by.is_(None)
        )
    ).scalar()
    
    # Formater la taille totale
    size = total_size
    for unit in ['B', 'KB', 'MB', 'GB']:
        if size < 1024.0:
            total_size_formatted = f"{size:.1f} {unit}"
            break
        size /= 1024.0
    else:
        total_size_formatted = f"{size:.1f} TB"
    
    return {
        "total_documents": total_documents,
        "total_size": int(total_size),
        "total_size_formatted": total_size_formatted,
        "by_category": by_category,
        "by_type": by_type,
        "by_status": by_status,
        "recent_uploads": recent_uploads,
        "pending_validation": pending_validation
    }
