"""
API Routes pour les règles comptables automatiques
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from uuid import UUID

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
    file_content = await file.read()
    await file.seek(0)

    upload_result = await storage_service.upload_file(file, tenant_id=str(current_tenant.id))
    file_path = upload_result.get('key') or upload_result.get('path')

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
    
    try:
        ocr_data = await ocr_service.process_invoice(file_path, file_content=file_content, extract_all_pages=True)
    except Exception as e:
        try:
            doc.status = DocumentStatus.REJECTED
            doc.ocr_data = {"error": str(e)}
            db.commit()
        except Exception:
            db.rollback()
        raise HTTPException(status_code=422, detail=f"OCR failed: {str(e)}")
    
    # Classification automatique Achat/Vente
    from app.services.invoice_classifier import InvoiceClassifier
    classifier = InvoiceClassifier(db, str(current_tenant.id))
    invoice_type, classification_confidence, classification_metadata = classifier.classify_invoice(
        ocr_data,
        tenant_name=current_tenant.name if hasattr(current_tenant, 'name') else None
    )
    
    # Mise à jour du type de document
    from app.models.document import DocumentType
    if invoice_type == "PURCHASE":
        doc.type = DocumentType.INVOICE_PURCHASE
    elif invoice_type == "SALE":
        doc.type = DocumentType.INVOICE_SALES
    
    # Stocker les métadonnées de classification
    if not doc.ai_extracted_data:
        doc.ai_extracted_data = {}
    doc.ai_extracted_data["classification"] = classification_metadata
    
    engine = AccountingRulesEngine(db, str(current_tenant.id))
    suggestions = engine.apply_rules(ocr_data)
    
    lines = []
    
    if suggestions.get("suggested_debit_account"):
        lines.append({
            "account_code": suggestions["suggested_debit_account"],
            "label": suggestions.get("suggested_label", ocr_data.get("supplier_name", "")),
            "debit": ocr_data.get("amount_ht", 0.0),
            "credit": 0.0
        })
    
    if ocr_data.get("amount_vat", 0) > 0:
        lines.append({
            "account_code": "445620",  # TVA déductible
            "label": "TVA déductible",
            "debit": ocr_data.get("amount_vat", 0.0),
            "credit": 0.0
        })
    
    if suggestions.get("suggested_credit_account"):
        lines.append({
            "account_code": suggestions["suggested_credit_account"],
            "label": ocr_data.get("supplier_name", "Fournisseur"),
            "debit": 0.0,
            "credit": ocr_data.get("amount_ttc", 0.0)
        })
    
    try:
        from datetime import datetime

        def to_float(value, default=0.0):
            try:
                if value is None:
                    return default
                return float(value)
            except (TypeError, ValueError):
                return default

        doc.reference_number = ocr_data.get("reference_number") or doc.reference_number

        if ocr_data.get("date"):
            try:
                doc.document_date = datetime.fromisoformat(str(ocr_data.get("date"))).date()
            except (TypeError, ValueError):
                pass

        if ocr_data.get("due_date"):
            try:
                doc.due_date = datetime.fromisoformat(str(ocr_data.get("due_date"))).date()
            except (TypeError, ValueError):
                pass

        doc.amount_ht = to_float(ocr_data.get("amount_ht"), None)
        doc.amount_vat = to_float(ocr_data.get("amount_vat"), None)
        doc.amount_ttc = to_float(ocr_data.get("amount_ttc"), None)
        doc.currency = (ocr_data.get("currency") or doc.currency or "XOF")

        doc.ocr_data = ocr_data
        doc.ocr_confidence = float(ocr_data.get("confidence", 0.0) or 0.0)
        doc.status = DocumentStatus.OCR_COMPLETED
        db.commit()
    except Exception:
        db.rollback()

    return {
        "ocr_data": ocr_data,
        "invoice_type": invoice_type,
        "classification_confidence": classification_confidence,
        "classification_metadata": classification_metadata,
        "suggestions": suggestions,
        "proposed_entry": {
            "date": ocr_data.get("date"),
            "reference": ocr_data.get("reference_number"),
            "description": suggestions.get("suggested_label", ""),
            "lines": lines,
            "is_balanced": abs(sum(l["debit"] for l in lines) - sum(l["credit"] for l in lines)) < 0.01,
        },
        "file_info": {
            "filename": file.filename,
            "path": file_path,
            "page_count": ocr_data.get("page_count", 1),
            "is_multi_page": ocr_data.get("is_multi_page", False),
            "key": upload_result.get("key"),
            "url": storage_service.get_file_url(upload_result.get("key")) if upload_result.get("key") else upload_result.get("url"),
            "document_id": str(doc.id),
        },
    }


@router.post("/entries/validate-classification")
async def validate_classification(
    document_id: UUID = Query(...),
    debit_account: str = Query(...),
    credit_account: str = Query(...),
    label: str = Query(""),
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Valide une classification (feedback utilisateur) (MVP)."""

    doc = (
        db.query(Document)
        .filter(
            Document.id == document_id,
            Document.tenant_id == current_tenant.id,
        )
        .first()
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Document introuvable")

    classification = (
        db.query(DocumentClassification)
        .filter(
            DocumentClassification.document_id == document_id,
            DocumentClassification.tenant_id == current_tenant.id,
        )
        .first()
    )

    if not classification:
        classification = DocumentClassification(
            tenant_id=current_tenant.id,
            document_id=document_id,
            source="manual",
        )
        db.add(classification)

    classification.user_corrections = {
        "corrected_debit": debit_account,
        "corrected_credit": credit_account,
        "corrected_label": label,
    }
    classification.suggested_debit_account = debit_account
    classification.suggested_credit_account = credit_account
    classification.suggested_label = label
    classification.validated = True
    classification.validated_by = current_user.id

    db.commit()

    return {"message": "Classification validée", "feedback_recorded": True}
