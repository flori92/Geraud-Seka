"""
API Routes pour la Gestion des Doublons
=======================================

Endpoints pour:
- Détecter les doublons lors de l'upload
- Afficher l'interface de confrontation
- Résoudre les doublons (rejeter/conserver/remplacer)
- Consulter l'historique des doublons traités
"""

from typing import List, Optional
from uuid import UUID
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.session import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.services.duplicate_detection import (
    get_duplicate_detection_service,
    DuplicateAction,
    DuplicateReason
)


router = APIRouter()


# =============================================================================
# SCHEMAS
# =============================================================================

class DuplicateCheckRequest(BaseModel):
    """Requête de vérification de doublon"""
    supplier_id: Optional[str] = None
    supplier_name: Optional[str] = None
    invoice_number: Optional[str] = None
    amount_ttc: Optional[float] = None
    invoice_date: Optional[str] = None  # ISO format: YYYY-MM-DD
    exclude_document_id: Optional[str] = None


class ExistingDocumentInfo(BaseModel):
    """Informations sur le document existant"""
    id: str
    supplier_name: Optional[str] = None
    supplier_id: Optional[str] = None
    reference_number: Optional[str] = None
    document_date: Optional[str] = None
    due_date: Optional[str] = None
    amount_ht: Optional[float] = None
    amount_vat: Optional[float] = None
    amount_ttc: Optional[float] = None
    status: Optional[str] = None
    created_at: Optional[str] = None
    validated_at: Optional[str] = None
    exported_at: Optional[str] = None
    file_url: Optional[str] = None
    filename: Optional[str] = None


class DuplicateCheckResponse(BaseModel):
    """Réponse de vérification de doublon"""
    is_duplicate: bool
    reason: Optional[str] = None
    reason_text: Optional[str] = None
    existing_document: Optional[ExistingDocumentInfo] = None


class ResolveRequest(BaseModel):
    """Requête de résolution de doublon"""
    new_document_id: str
    existing_document_id: str
    action: str  # "reject", "keep_both", "replace"
    reason: Optional[str] = None  # Obligatoire pour keep_both


class ResolveResponse(BaseModel):
    """Réponse de résolution"""
    success: bool
    action: Optional[str] = None
    message: Optional[str] = None
    error: Optional[str] = None
    new_document_id: Optional[str] = None
    existing_document_id: Optional[str] = None
    resolved_at: Optional[str] = None


class ComparisonField(BaseModel):
    """Champ de comparaison"""
    field: str
    label: str
    value_1: Optional[str] = None
    value_2: Optional[str] = None
    identical: bool


class DocumentInfo(BaseModel):
    """Info document pour comparaison"""
    id: str
    filename: Optional[str] = None
    file_url: Optional[str] = None
    status: Optional[str] = None
    created_at: Optional[str] = None
    validated_at: Optional[str] = None
    exported_at: Optional[str] = None


class CompareResponse(BaseModel):
    """Réponse de comparaison"""
    document_1: DocumentInfo
    document_2: DocumentInfo
    comparison: List[ComparisonField]
    identical_fields: int
    total_fields: int
    all_identical: bool
    conclusion: str


class DuplicateHistoryItem(BaseModel):
    """Élément de l'historique des doublons"""
    id: str
    reference_number: Optional[str] = None
    supplier_name: Optional[str] = None
    amount_ttc: Optional[float] = None
    action: Optional[str] = None
    existing_document_id: Optional[str] = None
    reason: Optional[str] = None
    resolved_by: Optional[str] = None
    resolved_at: Optional[str] = None


class PendingDuplicate(BaseModel):
    """Doublon en attente de traitement"""
    id: str
    supplier_name: Optional[str] = None
    reference_number: Optional[str] = None
    document_date: Optional[str] = None
    amount_ttc: Optional[float] = None
    created_at: Optional[str] = None
    duplicate_of_id: Optional[str] = None
    reason: Optional[str] = None
    reason_text: Optional[str] = None


# =============================================================================
# ENDPOINTS
# =============================================================================

@router.post("/check", response_model=DuplicateCheckResponse)
async def check_duplicate(
    request: DuplicateCheckRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Vérifie si une facture est un doublon.
    
    Critères de détection:
    1. Même fournisseur + Même N° facture → DOUBLON
    2. Même fournisseur + Même montant TTC + Même date → DOUBLON
    
    Si doublon détecté, retourne les informations du document existant
    pour permettre la confrontation.
    """
    service = get_duplicate_detection_service(db, str(current_user.tenant_id))
    
    # Parser la date si fournie
    invoice_date = None
    if request.invoice_date:
        try:
            invoice_date = date.fromisoformat(request.invoice_date)
        except ValueError:
            pass
    
    result = service.detect_duplicate(
        supplier_id=request.supplier_id,
        supplier_name=request.supplier_name,
        invoice_number=request.invoice_number,
        amount_ttc=request.amount_ttc,
        invoice_date=invoice_date,
        exclude_document_id=request.exclude_document_id
    )
    
    if result:
        return DuplicateCheckResponse(
            is_duplicate=True,
            reason=result.get("reason"),
            reason_text=result.get("reason_text"),
            existing_document=ExistingDocumentInfo(**result["existing_document"])
        )
    
    return DuplicateCheckResponse(is_duplicate=False)


@router.post("/resolve", response_model=ResolveResponse)
async def resolve_duplicate(
    request: ResolveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Résout un doublon avec l'action choisie par l'utilisateur.
    
    Actions possibles:
    - **reject**: Rejeter la nouvelle facture (garder l'existante)
    - **keep_both**: Conserver les deux (motif OBLIGATOIRE)
    - **replace**: Remplacer l'existante par la nouvelle
    
    Pour "keep_both", le champ "reason" est obligatoire.
    Exemples de motifs: "Facture rectificative", "Avoir", "Versions différentes"
    """
    # Valider l'action
    try:
        action = DuplicateAction(request.action)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Action invalide. Valeurs acceptées: {[a.value for a in DuplicateAction]}"
        )
    
    service = get_duplicate_detection_service(db, str(current_user.tenant_id))
    
    result = service.resolve_duplicate(
        new_document_id=request.new_document_id,
        existing_document_id=request.existing_document_id,
        action=action,
        reason=request.reason,
        resolved_by=str(current_user.id)
    )
    
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error"))
    
    return ResolveResponse(**result)


@router.get("/compare/{document_id_1}/{document_id_2}", response_model=CompareResponse)
async def compare_documents(
    document_id_1: str,
    document_id_2: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Compare deux documents champ par champ.
    
    Retourne un tableau comparatif avec:
    - Les valeurs de chaque document pour chaque champ
    - Si les valeurs sont identiques ou différentes
    - Une conclusion (DOUBLON CONFIRMÉ ou DIFFÉRENCES DÉTECTÉES)
    
    Utile pour l'interface de confrontation.
    """
    service = get_duplicate_detection_service(db, str(current_user.tenant_id))
    
    result = service.compare_documents(document_id_1, document_id_2)
    
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    
    return CompareResponse(
        document_1=DocumentInfo(**result["document_1"]),
        document_2=DocumentInfo(**result["document_2"]),
        comparison=[ComparisonField(**c) for c in result["comparison"]],
        identical_fields=result["identical_fields"],
        total_fields=result["total_fields"],
        all_identical=result["all_identical"],
        conclusion=result["conclusion"]
    )


@router.get("/pending", response_model=List[PendingDuplicate])
async def get_pending_duplicates(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Récupère la liste des doublons en attente de traitement.
    
    Ces doublons ont été détectés mais l'utilisateur n'a pas encore
    choisi l'action à effectuer (rejeter/conserver/remplacer).
    """
    service = get_duplicate_detection_service(db, str(current_user.tenant_id))
    duplicates = service.get_pending_duplicates()
    return [PendingDuplicate(**d) for d in duplicates]


@router.get("/history", response_model=List[DuplicateHistoryItem])
async def get_duplicate_history(
    limit: int = Query(50, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Récupère l'historique des doublons traités.
    
    Inclut:
    - La facture concernée
    - L'action effectuée (rejeté/conservé/remplacé)
    - Le motif (si conservé)
    - L'utilisateur qui a traité
    - La date de traitement
    
    Utile pour l'audit et le suivi.
    """
    service = get_duplicate_detection_service(db, str(current_user.tenant_id))
    history = service.get_duplicate_history(limit=limit, offset=offset)
    return [DuplicateHistoryItem(**h) for h in history]


@router.get("/groups")
async def get_duplicate_groups(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Récupère tous les groupes de documents potentiellement en doublon.
    
    Groupés par numéro de facture + fournisseur.
    Utile pour un rapport d'analyse des doublons.
    """
    service = get_duplicate_detection_service(db, str(current_user.tenant_id))
    return service.get_all_duplicates()


@router.get("/stats")
async def get_duplicate_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Statistiques sur les doublons.
    
    Retourne:
    - Nombre de doublons détectés (total)
    - Nombre de doublons rejetés
    - Nombre de doublons conservés (avec motif)
    - Nombre de doublons remplacés
    - Nombre de doublons en attente
    """
    service = get_duplicate_detection_service(db, str(current_user.tenant_id))
    
    pending = service.get_pending_duplicates()
    history = service.get_duplicate_history(limit=1000)
    
    # Compter par action
    rejected = len([h for h in history if h.get('action') == 'reject'])
    kept_both = len([h for h in history if h.get('action') == 'keep_both'])
    replaced = len([h for h in history if h.get('action') == 'replace'])
    
    return {
        "total_detected": len(history) + len(pending),
        "pending": len(pending),
        "resolved": len(history),
        "by_action": {
            "rejected": rejected,
            "kept_both": kept_both,
            "replaced": replaced
        }
    }
