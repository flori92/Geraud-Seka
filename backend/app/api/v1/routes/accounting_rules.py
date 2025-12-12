"""
API Routes pour les règles comptables automatiques
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.session import get_db
from app.api.deps import get_current_user, get_current_tenant
from app.models.user import User
from app.models.tenant import Tenant
from app.models.accounting_rules import AccountingRule, DocumentClassification
from app.services.ocr import ocr_service
from app.models.document import Document, DocumentStatus
from app.services.accounting_rules import AccountingRulesEngine, classify_document
from app.services.storage import storage_service

router = APIRouter()


# Schemas
class RuleCondition(BaseModel):
    type: str
    operator: str
    value: str


class RuleAction(BaseModel):
    type: str
    debit_account: Optional[str] = None
    credit_account: Optional[str] = None
    vat_rate: Optional[float] = None
    label_template: Optional[str] = None
    analytic_code: Optional[str] = None


class AccountingRuleCreate(BaseModel):
    name: str
    description: Optional[str] = None
    priority: float = 0
    conditions: List[dict]
    actions: List[dict]
    auto_apply: bool = False
    confidence_threshold: float = 0.8


class AccountingRuleResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    priority: float
    conditions: List[dict]
    actions: List[dict]
    is_active: bool
    auto_apply: bool

    class Config:
        from_attributes = True


# ==================== RÈGLES ====================

@router.get("/rules", response_model=List[AccountingRuleResponse])
async def list_rules(
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Liste toutes les règles comptables"""
    rules = db.query(AccountingRule).filter(
        AccountingRule.tenant_id == current_tenant.id
    ).order_by(AccountingRule.priority.desc()).all()
    
    return rules


@router.post("/rules", response_model=AccountingRuleResponse)
async def create_rule(
    rule_data: AccountingRuleCreate,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Crée une nouvelle règle comptable"""
    rule = AccountingRule(
        tenant_id=current_tenant.id,
        name=rule_data.name,
        description=rule_data.description,
        priority=rule_data.priority,
        conditions=rule_data.conditions,
        actions=rule_data.actions,
        auto_apply=rule_data.auto_apply,
        confidence_threshold=rule_data.confidence_threshold,
        is_active=True
    )
    
    db.add(rule)
    db.commit()
    db.refresh(rule)
    
    return rule


@router.put("/rules/{rule_id}", response_model=AccountingRuleResponse)
async def update_rule(
    rule_id: str,
    rule_data: AccountingRuleCreate,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Met à jour une règle"""
    rule = db.query(AccountingRule).filter(
        AccountingRule.id == rule_id,
        AccountingRule.tenant_id == current_tenant.id
    ).first()
    
    if not rule:
        raise HTTPException(status_code=404, detail="Règle non trouvée")
    
    rule.name = rule_data.name
    rule.description = rule_data.description
    rule.priority = rule_data.priority
    rule.conditions = rule_data.conditions
    rule.actions = rule_data.actions
    rule.auto_apply = rule_data.auto_apply
    rule.confidence_threshold = rule_data.confidence_threshold
    
    db.commit()
    db.refresh(rule)
    
    return rule


@router.delete("/rules/{rule_id}")
async def delete_rule(
    rule_id: str,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Supprime une règle"""
    rule = db.query(AccountingRule).filter(
        AccountingRule.id == rule_id,
        AccountingRule.tenant_id == current_tenant.id
    ).first()
    
    if not rule:
        raise HTTPException(status_code=404, detail="Règle non trouvée")
    
    db.delete(rule)
    db.commit()
    
    return {"message": "Règle supprimée"}


# ==================== SAISIE AVEC OCR ====================

@router.post("/entries/from-document")
async def create_entry_from_document(
    file: UploadFile = File(...),
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload un document (facture PDF/image), extrait les données par OCR,
    applique les règles comptables et suggère une écriture
    """
    # 1. Upload le fichier
    upload_result = await storage_service.upload_file(file, tenant_id=str(current_tenant.id))
    file_path = upload_result.get('key') or upload_result.get('path')

    # 1bis. Créer un enregistrement Document pour lier l'OCR et la classification
    doc = Document(
        filename=upload_result.get('key') or upload_result.get('path') or file.filename,
        original_filename=file.filename,
        file_path=upload_result.get('key') or upload_result.get('path') or file.filename,
        content_type=file.content_type,
        file_size=upload_result.get('size'),
        file_extension=(file.filename.split('.')[-1].lower() if '.' in file.filename else None),
        status=DocumentStatus.OCR_PROCESSING,
        tenant_id=current_tenant.id,
        uploaded_by=current_user.id,
        category=None,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    
    # 2. Traiter avec OCR (support multi-pages)
    ocr_data = await ocr_service.process_invoice(file_path, extract_all_pages=True)
    
    # 3. Appliquer les règles comptables
    engine = AccountingRulesEngine(db, str(current_tenant.id))
    suggestions = engine.apply_rules(ocr_data)
    
    # 4. Préparer les lignes d'écriture suggérées
    lines = []
    
    # Ligne débit (charge ou actif)
    if suggestions.get("suggested_debit_account"):
        lines.append({
            "account_code": suggestions["suggested_debit_account"],
            "label": suggestions.get("suggested_label", ocr_data.get("supplier_name", "")),
            "debit": ocr_data.get("amount_ht", 0.0),
            "credit": 0.0
        })
    
    # Ligne TVA (si applicable)
    if ocr_data.get("amount_vat", 0) > 0:
        lines.append({
            "account_code": "445620",  # TVA déductible
            "label": "TVA déductible",
            "debit": ocr_data.get("amount_vat", 0.0),
            "credit": 0.0
        })
    
    # Ligne crédit (fournisseur)
    if suggestions.get("suggested_credit_account"):
        lines.append({
            "account_code": suggestions["suggested_credit_account"],
            "label": ocr_data.get("supplier_name", "Fournisseur"),
            "debit": 0.0,
            "credit": ocr_data.get("amount_ttc", 0.0)
        })
    
    # 3bis. Enregistrer le score de confiance et données OCR sur le Document
    try:
        doc.ocr_data = ocr_data
        doc.ocr_confidence = float(ocr_data.get("confidence", 0.0))
        doc.status = DocumentStatus.OCR_COMPLETED
        db.commit()
    except Exception:
        db.rollback()

    return {
        "ocr_data": ocr_data,
        "suggestions": suggestions,
        "proposed_entry": {
            "date": ocr_data.get("date"),
            "reference": ocr_data.get("reference_number"),
            "description": suggestions.get("suggested_label", ""),
            "lines": lines,
            "is_balanced": abs(sum(l["debit"] for l in lines) - sum(l["credit"] for l in lines)) < 0.01
        },
        "file_info": {
            "filename": file.filename,
            "path": file_path,
            "page_count": ocr_data.get("page_count", 1),
            "is_multi_page": ocr_data.get("is_multi_page", False),
            "key": upload_result.get("key"),
            "url": storage_service.get_file_url(upload_result.get("key")) if upload_result.get("key") else upload_result.get("url"),
            "document_id": str(doc.id)
        }
    }


@router.post("/entries/validate-classification")
async def validate_classification(
    document_id: str,
    debit_account: str,
    credit_account: str,
    label: str,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Valide une classification et enregistre le feedback utilisateur
    Améliore les suggestions futures
    """
    classification = db.query(DocumentClassification).filter(
        DocumentClassification.document_id == document_id,
        DocumentClassification.tenant_id == current_tenant.id
    ).first()
    
    if not classification:
        raise HTTPException(status_code=404, detail="Classification non trouvée")
    
    # Enregistrer les corrections utilisateur
    classification.validated = True
    classification.validated_by = current_user.id
    classification.user_corrections = {
        "original_debit": classification.suggested_debit_account,
        "original_credit": classification.suggested_credit_account,
        "corrected_debit": debit_account,
        "corrected_credit": credit_account,
        "corrected_label": label
    }
    
    db.commit()
    
    return {"message": "Classification validée", "feedback_recorded": True}
