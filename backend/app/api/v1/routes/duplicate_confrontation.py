"""
API Routes pour la confrontation des doublons (modal obligatoire)
"""
import logging
from typing import Any, List, Optional, Literal
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from app.core import deps
from app.models.user import User
from app.models.document import Document
from app.models.duplicate import DocumentDuplicate
from app.services.duplicate_detection import DuplicateDetectionService
from app.services.audit_logger import audit_duplicate_resolution

logger = logging.getLogger(__name__)

router = APIRouter()


class ConfrontationResponse(BaseModel):
    """Réponse pour la modal de confrontation"""
    duplicate_id: str
    detection_reason: str
    new_document: dict
    existing_document: dict
    comparison: dict


class ConfrontationResolutionRequest(BaseModel):
    """Request body pour résolution de confrontation (sécurisé)"""
    resolution: Literal["rejected", "kept_both", "replaced"]
    resolution_reason: Optional[str] = Field(None, max_length=500)


@router.get("/{duplicate_id}/confrontation")
async def get_duplicate_confrontation(
    duplicate_id: UUID,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db_session)
) -> ConfrontationResponse:
    """
    Retourne les détails d'un doublon pour la modal de confrontation.
    """
    duplicate = db.query(DocumentDuplicate).filter(
        DocumentDuplicate.id == str(duplicate_id),
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
    duplicate_id: UUID,
    request: ConfrontationResolutionRequest,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db_session)
) -> dict:
    """
    Résout un doublon depuis la modal de confrontation.

    Security:
    - UUID validation sur duplicate_id
    - Request body au lieu de query params (évite log exposure)
    - Validation Pydantic stricte (Literal type)
    - Tenant isolation via service
    """
    # Validation supplémentaire pour kept_both
    if request.resolution == "kept_both" and not request.resolution_reason:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Justification requise pour conserver les deux documents"
        )

    service = DuplicateDetectionService(db, str(current_user.tenant_id))

    try:
        duplicate = service.resolve_duplicate(
            duplicate_id=str(duplicate_id),
            resolution=request.resolution,
            user_id=str(current_user.id),
            resolution_reason=request.resolution_reason
        )

        db.commit()

        # Log audit de la resolution
        audit_duplicate_resolution(
            duplicate_id=str(duplicate_id),
            resolution=request.resolution,
            user_id=str(current_user.id),
            tenant_id=str(current_user.tenant_id),
            new_document_id=str(duplicate.new_document_id),
            existing_document_id=str(duplicate.existing_document_id),
            resolution_reason=request.resolution_reason,
        )

        # Invalider le cache des stats pour mise à jour immédiate
        from app.core.cache import clear_cache
        clear_cache(pattern="dashboard")

        return {
            "success": True,
            "duplicate_id": str(duplicate.id),
            "resolution": duplicate.resolution.value,
            "message": "Doublon résolu avec succès"
        }

    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doublon non trouvé ou déjà résolu"
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Error resolving duplicate {duplicate_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de la résolution du doublon"
        )
