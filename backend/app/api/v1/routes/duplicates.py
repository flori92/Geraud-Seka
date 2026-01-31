"""
API Routes pour la gestion des doublons
"""
import csv
import io
import logging
from datetime import datetime
from typing import Optional, Literal
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field, field_validator

from app.db.session import get_db
from app.core.deps import get_current_user, get_current_tenant
from app.models.user import User
from app.models.tenant import Tenant
from app.services.duplicate_detection import DuplicateDetectionService

logger = logging.getLogger(__name__)

router = APIRouter()

# Constantes de sécurité
MAX_PAGINATION_LIMIT = 100
DEFAULT_PAGINATION_LIMIT = 50


class DuplicateResolutionRequest(BaseModel):
    """Request pour résoudre un doublon avec validation stricte"""
    resolution: Literal["rejected", "kept_both", "replaced"]
    resolution_reason: Optional[str] = Field(None, max_length=500)

    @field_validator('resolution_reason')
    @classmethod
    def validate_reason(cls, v: Optional[str], info) -> Optional[str]:
        if info.data.get('resolution') == 'kept_both' and not v:
            raise ValueError("Resolution reason is required when keeping both documents")
        return v


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
    duplicate_id: UUID,
    request: DuplicateResolutionRequest,
    current_user: User = Depends(get_current_user),
    current_tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """
    Résout un doublon selon le choix de l'utilisateur.

    Security:
    - UUID validation on duplicate_id
    - Pydantic validation on resolution (Literal type)
    - Tenant isolation via service
    """
    service = DuplicateDetectionService(db, str(current_tenant.id))

    try:
        duplicate = service.resolve_duplicate(
            duplicate_id=str(duplicate_id),
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
            detail="Doublon non trouvé ou déjà résolu"
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Error resolving duplicate {duplicate_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de la résolution du doublon"
        )


@router.get("/history")
async def get_duplicate_history(
    limit: int = Query(
        default=DEFAULT_PAGINATION_LIMIT,
        ge=1,
        le=MAX_PAGINATION_LIMIT,
        description="Nombre maximum de résultats (1-100)"
    ),
    offset: int = Query(
        default=0,
        ge=0,
        description="Décalage pour la pagination"
    ),
    current_user: User = Depends(get_current_user),
    current_tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """
    Récupère l'historique des doublons traités.

    Security:
    - Pagination limitée à 100 résultats max
    - Offset validé >= 0
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


# Constante pour export CSV
MAX_CSV_EXPORT_LIMIT = 1000


@router.get("/history/export")
async def export_duplicate_history_csv(
    limit: int = Query(
        default=MAX_CSV_EXPORT_LIMIT,
        ge=1,
        le=MAX_CSV_EXPORT_LIMIT,
        description="Nombre maximum de résultats pour export (1-1000)"
    ),
    current_user: User = Depends(get_current_user),
    current_tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """
    Exporte l'historique des doublons au format CSV.

    Security:
    - Limite export à 1000 lignes max
    - Tenant isolation via service
    - Fichier généré en streaming (pas de stockage serveur)

    Headers CSV (SYSCOHADA compatible):
    - Date Détection, Raison Détection, Résolution, Date Résolution,
    - Résolu Par, Justification, Fournisseur, N° Facture Nouveau,
    - Montant TTC Nouveau, N° Facture Existant, Montant TTC Existant
    """
    service = DuplicateDetectionService(db, str(current_tenant.id))
    duplicates = service.get_duplicate_history(limit=limit, offset=0)

    # Créer le CSV en mémoire
    output = io.StringIO()
    writer = csv.writer(output, delimiter=';', quoting=csv.QUOTE_MINIMAL)

    # En-têtes CSV (français pour SYSCOHADA)
    headers = [
        "Date Détection",
        "Raison Détection",
        "Résolution",
        "Date Résolution",
        "Résolu Par",
        "Justification",
        "Fournisseur",
        "N° Facture (Nouveau)",
        "Montant TTC (Nouveau)",
        "N° Facture (Existant)",
        "Montant TTC (Existant)"
    ]
    writer.writerow(headers)

    # Traductions pour export lisible
    reason_labels = {
        "same_invoice_number": "Même N° facture",
        "same_amount_date": "Même montant + date"
    }
    resolution_labels = {
        "rejected": "Rejeté",
        "kept_both": "Les deux conservés",
        "replaced": "Remplacé"
    }

    # Écrire les données
    for dup in duplicates:
        new_doc = dup.new_document
        existing_doc = dup.existing_document

        row = [
            dup.created_at.strftime("%d/%m/%Y %H:%M") if dup.created_at else "",
            reason_labels.get(dup.detection_reason.value, dup.detection_reason.value),
            resolution_labels.get(dup.resolution.value, dup.resolution.value) if dup.resolution else "",
            dup.resolved_at.strftime("%d/%m/%Y %H:%M") if dup.resolved_at else "",
            dup.resolver.full_name if dup.resolver else "",
            dup.resolution_reason or "",
            new_doc.supplier_name or "",
            new_doc.reference_number or "",
            f"{float(new_doc.amount_ttc):.2f}".replace(".", ",") if new_doc.amount_ttc is not None else "",
            existing_doc.reference_number or "",
            f"{float(existing_doc.amount_ttc):.2f}".replace(".", ",") if existing_doc.amount_ttc is not None else ""
        ]
        writer.writerow(row)

    # Préparer la réponse streaming
    output.seek(0)

    # Nom de fichier avec date
    filename = f"historique_doublons_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Content-Type": "text/csv; charset=utf-8"
        }
    )
