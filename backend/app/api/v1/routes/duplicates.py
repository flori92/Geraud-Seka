"""
API Routes pour la gestion des doublons
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.session import get_db
from app.core.deps import get_current_user, get_current_tenant
from app.models.user import User
from app.models.tenant import Tenant
from app.services.duplicate_detection import DuplicateDetectionService

router = APIRouter()


class DuplicateResolutionRequest(BaseModel):
    """Request pour résoudre un doublon"""
    resolution: str  # "rejected", "kept_both", "replaced"
    resolution_reason: Optional[str] = None


@router.get("/pending")
async def get_pending_duplicates(
    current_user: User = Depends(get_current_user),
    current_tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """
    Récupère la liste des doublons en attente de résolution.
    """
    service = DuplicateDetectionService(db, str(current_tenant.id))
    duplicates = service.get_pending_duplicates()
    
    result = []
    for dup in duplicates:
        # Charger les documents associés
        new_doc = dup.new_document
        existing_doc = dup.existing_document
        
        # Comparer les documents
        comparison = service.compare_documents(new_doc, existing_doc)
        
        result.append({
            "id": str(dup.id),
            "detection_reason": dup.detection_reason.value,
            "created_at": dup.created_at.isoformat(),
            "new_document": {
                "id": str(new_doc.id),
                "filename": new_doc.original_filename,
                "supplier_name": new_doc.supplier_name,
                "reference_number": new_doc.reference_number,
                "document_date": new_doc.document_date.isoformat() if new_doc.document_date else None,
                "amount_ttc": float(new_doc.amount_ttc) if new_doc.amount_ttc is not None else None,
                "file_path": new_doc.file_path
            },
            "existing_document": {
                "id": str(existing_doc.id),
                "filename": existing_doc.original_filename,
                "supplier_name": existing_doc.supplier_name,
                "reference_number": existing_doc.reference_number,
                "document_date": existing_doc.document_date.isoformat() if existing_doc.document_date else None,
                "amount_ttc": float(existing_doc.amount_ttc) if existing_doc.amount_ttc is not None else None,
                "status": existing_doc.status.value if hasattr(existing_doc.status, 'value') else existing_doc.status,
                "file_path": existing_doc.file_path,
                "created_at": existing_doc.created_at.isoformat() if existing_doc.created_at else None
            },
            "comparison": comparison
        })
    
    return {"duplicates": result, "count": len(result)}


@router.post("/{duplicate_id}/resolve")
async def resolve_duplicate(
    duplicate_id: str,
    request: DuplicateResolutionRequest,
    current_user: User = Depends(get_current_user),
    current_tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """
    Résout un doublon selon le choix de l'utilisateur.
    """
    # Validation
    if request.resolution not in ["rejected", "kept_both", "replaced"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Resolution must be 'rejected', 'kept_both', or 'replaced'"
        )
    
    if request.resolution == "kept_both" and not request.resolution_reason:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Resolution reason is required when keeping both documents"
        )
    
    service = DuplicateDetectionService(db, str(current_tenant.id))
    
    try:
        duplicate = service.resolve_duplicate(
            duplicate_id=duplicate_id,
            resolution=request.resolution,
            user_id=str(current_user.id),
            resolution_reason=request.resolution_reason
        )
        
        db.commit()
        
        # Invalider le cache des stats pour mise à jour immédiate
        from app.core.cache import clear_cache
        clear_cache(pattern="dashboard")
        
        return duplicate
    
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error resolving duplicate: {str(e)}"
        )


@router.get("/history")
async def get_duplicate_history(
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    current_tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """
    Récupère l'historique des doublons traités.
    """
    service = DuplicateDetectionService(db, str(current_tenant.id))
    duplicates = service.get_duplicate_history(limit=limit, offset=offset)
    
    result = []
    for dup in duplicates:
        new_doc = dup.new_document
        existing_doc = dup.existing_document
        
        result.append({
            "id": str(dup.id),
            "detection_reason": dup.detection_reason.value,
            "resolution": dup.resolution.value if dup.resolution else None,
            "resolution_reason": dup.resolution_reason,
            "resolved_at": dup.resolved_at.isoformat() if dup.resolved_at else None,
            "resolved_by_name": dup.resolver.full_name if dup.resolver else None,
            "new_document": {
                "filename": new_doc.original_filename,
                "supplier_name": new_doc.supplier_name,
                "reference_number": new_doc.reference_number,
                "amount_ttc": float(new_doc.amount_ttc) if new_doc.amount_ttc is not None else None
            },
            "existing_document": {
                "id": str(existing_doc.id),
                "filename": existing_doc.original_filename,
                "reference_number": existing_doc.reference_number
            }
        })
    
    return {"history": result, "count": len(result)}
