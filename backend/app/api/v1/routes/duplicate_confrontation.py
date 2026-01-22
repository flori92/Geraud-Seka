"""
API Routes pour la confrontation des doublons (modal obligatoire)
"""
from typing import Any, List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core import deps
from app.models.user import User
from app.models.document import Document
from app.models.duplicate import DocumentDuplicate
from app.services.duplicate_detection import DuplicateDetectionService

router = APIRouter()


class ConfrontationResponse(BaseModel):
    """Réponse pour la modal de confrontation"""
    duplicate_id: str
    detection_reason: str
    new_document: dict
    existing_document: dict
    comparison: dict


@router.get("/{duplicate_id}/confrontation")
async def get_duplicate_confrontation(
    duplicate_id: str,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db_session)
) -> ConfrontationResponse:
    """
    Retourne les détails d'un doublon pour la modal de confrontation.
    """
    duplicate = db.query(DocumentDuplicate).filter(
        DocumentDuplicate.id == duplicate_id,
        DocumentDuplicate.tenant_id == current_user.tenant_id,
        DocumentDuplicate.resolution.is_(None)
    ).first()
    
    if not duplicate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doublon non trouvé ou déjà résolu"
        )
    
    # Charger les documents
    new_doc = db.query(Document).filter(Document.id == duplicate.new_document_id).first()
    existing_doc = db.query(Document).filter(Document.id == duplicate.existing_document_id).first()
    
    if not new_doc or not existing_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Documents associés introuvables"
        )
    
    # Comparer les documents
    service = DuplicateDetectionService(db, str(current_user.tenant_id))
    comparison = service.compare_documents(new_doc, existing_doc)
    
    return ConfrontationResponse(
        duplicate_id=str(duplicate.id),
        detection_reason=duplicate.detection_reason.value,
        new_document={
            "id": str(new_doc.id),
            "filename": new_doc.original_filename,
            "supplier_name": new_doc.supplier_name,
            "reference_number": new_doc.reference_number,
            "document_date": new_doc.document_date.isoformat() if new_doc.document_date else None,
            "amount_ttc": float(new_doc.amount_ttc) if new_doc.amount_ttc else None,
            "file_path": new_doc.file_path
        },
        existing_document={
            "id": str(existing_doc.id),
            "filename": existing_doc.original_filename,
            "supplier_name": existing_doc.supplier_name,
            "reference_number": existing_doc.reference_number,
            "document_date": existing_doc.document_date.isoformat() if existing_doc.document_date else None,
            "amount_ttc": float(existing_doc.amount_ttc) if existing_doc.amount_ttc else None,
            "status": existing_doc.status.value if hasattr(existing_doc.status, 'value') else existing_doc.status,
            "file_path": existing_doc.file_path,
            "created_at": existing_doc.created_at.isoformat() if existing_doc.created_at else None
        },
        comparison=comparison
    )


@router.get("/pending")
async def get_pending_duplicates_for_confrontation(
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db_session)
) -> List[dict]:
    """
    Retourne la liste des doublons en attente de confrontation.
    """
    duplicates = db.query(DocumentDuplicate).filter(
        DocumentDuplicate.tenant_id == current_user.tenant_id,
        DocumentDuplicate.resolution.is_(None)
    ).order_by(DocumentDuplicate.created_at.desc()).all()
    
    result = []
    for dup in duplicates:
        new_doc = db.query(Document).filter(Document.id == dup.new_document_id).first()
        if new_doc:
            result.append({
                "id": str(dup.id),
                "detection_reason": dup.detection_reason.value,
                "new_document": {
                    "id": str(new_doc.id),
                    "filename": new_doc.original_filename,
                    "supplier_name": new_doc.supplier_name,
                    "reference_number": new_doc.reference_number,
                    "amount_ttc": float(new_doc.amount_ttc) if new_doc.amount_ttc else None,
                    "status": new_doc.status.value if hasattr(new_doc.status, 'value') else new_doc.status
                },
                "created_at": dup.created_at.isoformat() if dup.created_at else None
            })
    
    return result


@router.post("/{duplicate_id}/resolve")
async def resolve_duplicate_from_confrontation(
    duplicate_id: str,
    resolution: str,
    resolution_reason: Optional[str] = None,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db_session)
) -> dict:
    """
    Résout un doublon depuis la modal de confrontation.
    """
    if resolution not in ["rejected", "kept_both", "replaced"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Resolution must be 'rejected', 'kept_both', or 'replaced'"
        )
    
    if resolution == "kept_both" and not resolution_reason:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Resolution reason is required when keeping both documents"
        )
    
    service = DuplicateDetectionService(db, str(current_user.tenant_id))
    
    try:
        duplicate = service.resolve_duplicate(
            duplicate_id=duplicate_id,
            resolution=resolution,
            user_id=str(current_user.id),
            resolution_reason=resolution_reason
        )
        
        db.commit()
        
        # Invalider le cache des stats pour mise à jour immédiate
        from app.core.cache import clear_cache
        clear_cache(pattern="dashboard")
        
        return {
            "success": True,
            "duplicate_id": str(duplicate.id),
            "resolution": duplicate.resolution.value,
            "message": "Doublon résolu avec succès"
        }
    
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
