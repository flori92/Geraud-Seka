"""
API Routes avancées pour les règles d'imputation
=================================================

Endpoints pour:
1. Import/Export de règles (CSV/JSON)
2. Apprentissage automatique
3. Alertes et notifications
4. Règles conditionnelles
6. Templates SYSCOHADA
"""

from typing import List, Optional, Dict, Any
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Body
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
import io

from app.db.session import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.services.rules_advanced import get_rules_advanced_service, RuleConditionType


router = APIRouter()


# =============================================================================
# SCHEMAS
# =============================================================================

class ImportResult(BaseModel):
    success: bool
    imported: int = 0
    updated: int = 0
    skipped: int = 0
    errors: List[str] = []


class CorrectionRequest(BaseModel):
    supplier_name: str
    original_account: str
    corrected_account: str
    invoice_id: Optional[str] = None


class CorrectionResponse(BaseModel):
    recorded: bool
    supplier_found: bool
    recommendation: Optional[Dict[str, Any]] = None
    confidence_improvement: float = 0.0


class ApplyLearningRequest(BaseModel):
    supplier_id: str
    new_charge_account: str


class ConditionalRuleCondition(BaseModel):
    type: str  # amount_greater, amount_less, amount_between, etc.
    value: Optional[float] = None
    min_value: Optional[float] = None
    max_value: Optional[float] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    expected_amount: Optional[float] = None
    tolerance_percent: Optional[float] = 5


class ConditionalRuleAction(BaseModel):
    type: str  # assign_account, set_vat_rate, etc.
    debit_account: Optional[str] = None
    credit_account: Optional[str] = None
    vat_account: Optional[str] = None
    vat_rate: Optional[float] = None


class CreateConditionalRuleRequest(BaseModel):
    supplier_id: str
    name: Optional[str] = None
    conditions: List[ConditionalRuleCondition]
    actions: List[ConditionalRuleAction]
    priority: int = 10


class EvaluateRulesRequest(BaseModel):
    supplier_id: str
    amount_ttc: float
    date: Optional[str] = None
    description: Optional[str] = None


class ApplyTemplateRequest(BaseModel):
    template_id: str
    selected_suppliers: Optional[List[str]] = None  # None = tous
    overwrite: bool = False


class Alert(BaseModel):
    id: str
    type: str
    severity: str
    title: str
    message: str
    supplier_id: Optional[str] = None
    supplier_name: Optional[str] = None
    action: Optional[Dict[str, Any]] = None
    created_at: str


# =============================================================================
# 1. IMPORT / EXPORT
# =============================================================================

@router.get("/export/json")
async def export_rules_json(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Exporte toutes les règles en format JSON.
    
    Retourne un fichier JSON téléchargeable contenant:
    - Toutes les règles d'imputation
    - Les fournisseurs associés
    - Les mots-clés OCR
    """
    service = get_rules_advanced_service(db, str(current_user.tenant_id))
    json_data = service.export_rules_to_json()
    
    return StreamingResponse(
        io.BytesIO(json_data.encode('utf-8')),
        media_type="application/json",
        headers={
            "Content-Disposition": "attachment; filename=regles_imputation.json"
        }
    )


@router.get("/export/csv")
async def export_rules_csv(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Exporte toutes les règles en format CSV.
    
    Format: supplier_name;supplier_code;charge_account;vat_account;supplier_account;vat_rate;journal_code;ocr_keywords
    """
    service = get_rules_advanced_service(db, str(current_user.tenant_id))
    csv_data = service.export_rules_to_csv()
    
    return StreamingResponse(
        io.BytesIO(csv_data.encode('utf-8')),
        media_type="text/csv",
        headers={
            "Content-Disposition": "attachment; filename=regles_imputation.csv"
        }
    )


@router.post("/import/json", response_model=ImportResult)
async def import_rules_json(
    file: UploadFile = File(...),
    overwrite: bool = Query(False, description="Écraser les règles existantes"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Importe des règles depuis un fichier JSON.
    
    Le fichier doit contenir un tableau "rules" avec les champs:
    - supplier_name (obligatoire)
    - supplier_code
    - charge_account
    - vat_account
    - vat_rate
    - journal_code
    - ocr_keywords
    """
    content = await file.read()
    json_data = content.decode('utf-8')
    
    service = get_rules_advanced_service(db, str(current_user.tenant_id))
    result = service.import_rules_from_json(
        json_data, 
        overwrite=overwrite,
        client_id=current_user.tenant_id
    )
    
    return ImportResult(**result)


@router.post("/import/csv", response_model=ImportResult)
async def import_rules_csv(
    file: UploadFile = File(...),
    overwrite: bool = Query(False, description="Écraser les règles existantes"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Importe des règles depuis un fichier CSV.
    
    Le fichier doit avoir un header avec les colonnes:
    supplier_name;supplier_code;charge_account;vat_account;supplier_account;vat_rate;journal_code;ocr_keywords
    """
    content = await file.read()
    csv_data = content.decode('utf-8')
    
    service = get_rules_advanced_service(db, str(current_user.tenant_id))
    result = service.import_rules_from_csv(
        csv_data, 
        overwrite=overwrite,
        client_id=current_user.tenant_id
    )
    
    return ImportResult(**result)


# =============================================================================
# 2. APPRENTISSAGE AUTOMATIQUE
# =============================================================================

@router.post("/learning/record-correction", response_model=CorrectionResponse)
async def record_correction(
    request: CorrectionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Enregistre une correction manuelle pour l'apprentissage.
    
    Quand l'utilisateur corrige une suggestion de compte,
    cette information est mémorisée pour améliorer les futures suggestions.
    
    Après plusieurs corrections similaires, le système suggère
    de mettre à jour la règle automatiquement.
    """
    service = get_rules_advanced_service(db, str(current_user.tenant_id))
    result = service.record_correction(
        supplier_name=request.supplier_name,
        original_account=request.original_account,
        corrected_account=request.corrected_account,
        user_id=str(current_user.id),
        invoice_id=request.invoice_id
    )
    
    db.commit()
    return CorrectionResponse(**result)


@router.post("/learning/apply")
async def apply_learning(
    request: ApplyLearningRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Applique l'apprentissage en mettant à jour la règle d'un fournisseur.
    
    Utilisé après que le système a suggéré une mise à jour basée sur les corrections.
    """
    service = get_rules_advanced_service(db, str(current_user.tenant_id))
    result = service.apply_learning(
        supplier_id=request.supplier_id,
        new_charge_account=request.new_charge_account
    )
    
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error"))
    
    return result


@router.get("/learning/suggestions")
async def get_learning_suggestions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retourne les suggestions d'amélioration basées sur l'apprentissage.
    
    Liste les fournisseurs dont les règles pourraient être améliorées
    basé sur les corrections manuelles effectuées.
    """
    service = get_rules_advanced_service(db, str(current_user.tenant_id))
    return service.get_learning_suggestions()


# =============================================================================
# 3. ALERTES ET NOTIFICATIONS
# =============================================================================

@router.get("/alerts", response_model=List[Alert])
async def get_alerts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retourne la liste des alertes concernant les règles d'imputation.
    
    Types d'alertes:
    - supplier_no_rule: Fournisseur sans règle d'imputation
    - invoice_no_match: Facture non reconnue
    - low_confidence: Règle avec faible confiance (beaucoup de corrections)
    """
    service = get_rules_advanced_service(db, str(current_user.tenant_id))
    alerts = service.get_alerts()
    return [Alert(**a) for a in alerts]


@router.get("/alerts/summary")
async def get_alerts_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retourne un résumé des alertes pour le dashboard.
    
    Inclut le nombre total d'alertes par type et par sévérité.
    """
    service = get_rules_advanced_service(db, str(current_user.tenant_id))
    return service.get_alert_summary()


# =============================================================================
# 4. RÈGLES CONDITIONNELLES AVANCÉES
# =============================================================================

@router.post("/conditional-rules")
async def create_conditional_rule(
    request: CreateConditionalRuleRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Crée une règle conditionnelle avancée.
    
    Types de conditions supportées:
    - amount_greater: Montant supérieur à X
    - amount_less: Montant inférieur à X
    - amount_between: Montant entre X et Y
    - date_range: Date dans une période
    - description_contains: Description contient un mot
    - period_monthly: Facture mensuelle récurrente
    
    Exemple d'utilisation:
    - Si montant > 1 000 000 FCFA → imputer sur un compte différent
    - Si facture mensuelle fixe de ~50 000 FCFA → auto-valider
    """
    service = get_rules_advanced_service(db, str(current_user.tenant_id))
    
    conditions = [c.dict() for c in request.conditions]
    actions = [a.dict() for a in request.actions]
    
    result = service.create_conditional_rule(
        supplier_id=request.supplier_id,
        conditions=conditions,
        actions=actions,
        name=request.name,
        priority=request.priority
    )
    
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error"))
    
    return result


@router.get("/conditional-rules")
async def list_conditional_rules(
    supplier_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Liste les règles conditionnelles.
    
    Optionnellement filtré par fournisseur.
    """
    service = get_rules_advanced_service(db, str(current_user.tenant_id))
    return service.get_conditional_rules(supplier_id)


@router.post("/conditional-rules/evaluate")
async def evaluate_conditional_rules(
    request: EvaluateRulesRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Évalue les règles conditionnelles pour une facture.
    
    Retourne la règle applicable et les actions à effectuer
    si une des conditions est remplie.
    """
    service = get_rules_advanced_service(db, str(current_user.tenant_id))
    
    invoice_data = {
        "amount_ttc": request.amount_ttc,
        "date": request.date,
        "description": request.description
    }
    
    return service.evaluate_conditional_rules(request.supplier_id, invoice_data)


@router.get("/condition-types")
async def get_condition_types():
    """
    Retourne la liste des types de conditions disponibles pour les règles avancées.
    """
    return [
        {
            "type": RuleConditionType.AMOUNT_GREATER.value,
            "name": "Montant supérieur à",
            "description": "S'applique si le montant TTC est supérieur à la valeur spécifiée",
            "parameters": ["value"]
        },
        {
            "type": RuleConditionType.AMOUNT_LESS.value,
            "name": "Montant inférieur à",
            "description": "S'applique si le montant TTC est inférieur à la valeur spécifiée",
            "parameters": ["value"]
        },
        {
            "type": RuleConditionType.AMOUNT_BETWEEN.value,
            "name": "Montant entre",
            "description": "S'applique si le montant TTC est compris entre min et max",
            "parameters": ["min_value", "max_value"]
        },
        {
            "type": RuleConditionType.DATE_RANGE.value,
            "name": "Période de date",
            "description": "S'applique si la date de facture est dans la période",
            "parameters": ["start_date", "end_date"]
        },
        {
            "type": RuleConditionType.DESCRIPTION_CONTAINS.value,
            "name": "Description contient",
            "description": "S'applique si la description contient le texte spécifié",
            "parameters": ["value"]
        },
        {
            "type": RuleConditionType.PERIOD_MONTHLY.value,
            "name": "Facture mensuelle récurrente",
            "description": "S'applique si le montant correspond à une facture mensuelle fixe",
            "parameters": ["expected_amount", "tolerance_percent"]
        }
    ]


# =============================================================================
# 6. TEMPLATES SYSCOHADA
# =============================================================================

@router.get("/templates")
async def list_templates(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Liste les templates SYSCOHADA disponibles.
    
    Chaque template contient des fournisseurs pré-configurés
    avec leurs comptes de charge appropriés selon le plan SYSCOHADA.
    
    Templates disponibles:
    - energie: SBEE, SONEB, Gaz
    - telecom: MTN, Moov, Glo
    - carburant: Oryx, Total
    - banque: BOA, Ecobank, SGBBE
    - fournitures: Papeteries, Librairies
    - immobilier: Loyers
    - transport: Transport personnel
    - honoraires: Comptables, Avocats, Notaires
    - assurance: Auto, Multirisque
    - entretien: Maintenance, Nettoyage
    """
    service = get_rules_advanced_service(db, str(current_user.tenant_id))
    return service.get_available_templates()


@router.get("/templates/{template_id}")
async def get_template(
    template_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retourne les détails d'un template spécifique.
    """
    service = get_rules_advanced_service(db, str(current_user.tenant_id))
    template = service.get_template_details(template_id)
    
    if not template:
        raise HTTPException(status_code=404, detail=f"Template '{template_id}' non trouvé")
    
    return template


@router.post("/templates/apply")
async def apply_template(
    request: ApplyTemplateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Applique un template SYSCOHADA.
    
    Crée automatiquement les fournisseurs et règles d'imputation
    selon le template sélectionné.
    
    Args:
        template_id: ID du template (energie, telecom, etc.)
        selected_suppliers: Liste des codes fournisseurs à créer (optionnel, défaut = tous)
        overwrite: Si True, met à jour les fournisseurs existants
    """
    service = get_rules_advanced_service(db, str(current_user.tenant_id))
    result = service.apply_template(
        template_id=request.template_id,
        client_id=current_user.tenant_id,
        selected_suppliers=request.selected_suppliers,
        overwrite=request.overwrite
    )
    
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error"))
    
    return result


@router.get("/templates/suggest")
async def suggest_template(
    supplier_name: str = Query(..., description="Nom du fournisseur"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Suggère un template approprié basé sur le nom du fournisseur.
    
    Utile lors de la création d'un nouveau fournisseur pour
    pré-remplir les informations de compte.
    """
    service = get_rules_advanced_service(db, str(current_user.tenant_id))
    suggestion = service.suggest_template_for_supplier(supplier_name)
    
    if not suggestion:
        return {"found": False, "message": "Aucun template correspondant trouvé"}
    
    return {"found": True, **suggestion}


@router.get("/syscohada-accounts")
async def get_syscohada_accounts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retourne la liste des comptes SYSCOHADA standards.
    
    Utile pour afficher les comptes disponibles lors de la
    création de règles ou l'import de données.
    """
    service = get_rules_advanced_service(db, str(current_user.tenant_id))
    return service.get_all_syscohada_accounts()
