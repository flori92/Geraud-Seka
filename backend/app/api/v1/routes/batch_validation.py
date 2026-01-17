"""
Batch Validation API Routes
Validation automatique en bloc basée sur les règles
"""
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from pydantic import BaseModel
from uuid import UUID

from app.db.session import get_db
from app.core.deps import get_current_user, get_current_tenant
from app.models.user import User
from app.models.tenant import Tenant
from app.models.document import Document
from app.models.accounting_rules import AccountingRule
from app.services.accounting_rules import AccountingRulesEngine

router = APIRouter()


class BatchValidationPreview(BaseModel):
    """Preview of what will be validated"""
    total_documents: int
    eligible_documents: int
    documents_with_rules: int
    documents_without_rules: int
    estimated_time: float
    rules_applied: List[dict]


class BatchValidationResult(BaseModel):
    """Result of batch validation"""
    success: bool
    validated_count: int
    failed_count: int
    skipped_count: int
    details: List[dict]
    processing_time: float


class DocumentValidationDetail(BaseModel):
    """Details of a single document validation"""
    document_id: str
    filename: str
    supplier_name: str
    amount: float
    status: str
    rule_applied: Optional[str]
    reason: Optional[str]


class BatchValidationRequest(BaseModel):
    min_confidence: float = 0.8
    document_ids: Optional[List[UUID]] = None

@router.post("/preview", response_model=BatchValidationPreview)
async def preview_batch_validation(
    request: BatchValidationRequest,
    current_user: User = Depends(get_current_user),
    current_tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """
    Preview quels documents seront validés automatiquement.
    Retourne les statistiques sans effectuer la validation.
    """
    try:
        min_confidence = request.min_confidence
        document_ids = request.document_ids
        
        query = db.query(Document).filter(
            Document.tenant_id == current_tenant.id,
            Document.status.in_(["pending", "pre_processed", "ocr_completed"]),
            Document.ocr_confidence >= min_confidence
        )
        
        if document_ids:
            query = query.filter(Document.id.in_(document_ids))
            
        pending_docs = query.all()
        
        rules_service = AccountingRulesEngine(db, str(current_tenant.id))
        
        eligible_count = 0
        with_rules = 0
        without_rules = 0
        rules_used = {}
        
        for doc in pending_docs:
            if not doc.supplier_name or not doc.amount_ttc:
                without_rules += 1
                continue
                
            try:
                result = rules_service.apply_rules({
                    "supplier_name": doc.supplier_name,
                    "reference_number": doc.reference_number or "",
                    "amount_ttc": float(doc.amount_ttc or 0),
                    "document_date": doc.document_date.isoformat() if doc.document_date else None,
                    "description": doc.description or "",
                    "raw_text": doc.ocr_data or "" # Useful for some heuristics
                })
                
                if result.get("matched") or result.get("source") in ["interconnection", "heuristic"]:
                    eligible_count += 1
                    with_rules += 1
                    rule_name = result.get("rule_name") or f"Source: {result.get('source', 'Unknown')}"
                    rules_used[rule_name] = rules_used.get(rule_name, 0) + 1
                else:
                    without_rules += 1
            except Exception as e:
                print(f"Error applying rules to doc {doc.id}: {e}")
                without_rules += 1
        
        rules_summary = [
            {"rule_name": name, "document_count": count}
            for name, count in rules_used.items()
        ]
        
        estimated_time = eligible_count * 0.5
        
        return BatchValidationPreview(
            total_documents=len(pending_docs),
            eligible_documents=eligible_count,
            documents_with_rules=with_rules,
            documents_without_rules=without_rules,
            estimated_time=estimated_time,
            rules_applied=rules_summary
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


class BatchValidationExecutionRequest(BaseModel):
    min_confidence: float = 0.8
    dry_run: bool = False
    only_auto_validable: bool = False
    document_ids: Optional[List[UUID]] = None

@router.post("/validate-all", response_model=BatchValidationResult)
async def validate_all_eligible(
    request: BatchValidationExecutionRequest,
    current_user: User = Depends(get_current_user),
    current_tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """
    Valide automatiquement tous les documents éligibles.
    
    Critères d'éligibilité:
    - Status: pending, pre_processed, ou ocr_completed
    - OCR confidence >= min_confidence
    - Règle comptable applicable trouvée (si only_auto_validable=True)
    - Fournisseur et montant présents
    
    only_auto_validable=True: Ne valide QUE les documents marqués auto_validable
    dry_run=True: Simule sans valider réellement
    document_ids: Liste d'IDs spécifiques à valider (filtre optionnel)
    """
    min_confidence = request.min_confidence
    dry_run = request.dry_run
    only_auto_validable = request.only_auto_validable
    document_ids = request.document_ids
    
    start_time = datetime.utcnow()
    
    query = db.query(Document).filter(
        Document.tenant_id == current_tenant.id,
        Document.status.in_(["pending", "pre_processed", "ocr_completed"]),
        Document.ocr_confidence >= min_confidence
    )
    
    if document_ids:
        query = query.filter(Document.id.in_(document_ids))
    
    if only_auto_validable:
        query = query.filter(Document.auto_validable == True)
    
    pending_docs = query.all()
    
    rules_service = AccountingRulesEngine(db, str(current_tenant.id))
    
    validated_count = 0
    failed_count = 0
    skipped_count = 0
    details = []
    
    for doc in pending_docs:
        detail = {
            "document_id": str(doc.id),
            "filename": doc.original_filename or "Unknown",
            "supplier_name": doc.supplier_name or "N/A",
            "amount": float(doc.amount_ttc or 0),
            "status": "skipped",
            "rule_applied": None,
            "reason": None
        }
        
        if not doc.supplier_name or not doc.amount_ttc:
            detail["reason"] = "Données manquantes (fournisseur ou montant)"
            skipped_count += 1
            details.append(detail)
            continue
        
        try:
            result = rules_service.apply_rules({
                "supplier_name": doc.supplier_name,
                "reference_number": doc.reference_number or "",
                "amount_ttc": float(doc.amount_ttc),
                "document_date": doc.document_date.isoformat() if doc.document_date else None,
                "description": doc.description or ""
            })
            
            if not result.get("matched"):
                detail["reason"] = "Aucune règle applicable"
                skipped_count += 1
                details.append(detail)
                continue
            
            if not dry_run:
                doc.status = "validated"
                doc.validated_at = datetime.utcnow()
                doc.validated_by_id = current_user.id
                
                if result.get("account_mapping"):
                    doc.metadata = doc.metadata or {}
                    doc.metadata["auto_validated"] = True
                    doc.metadata["rule_applied"] = result.get("rule_name")
                    doc.metadata["account_mapping"] = result.get("account_mapping")
            
            detail["status"] = "validated" if not dry_run else "eligible"
            detail["rule_applied"] = result.get("rule_name")
            validated_count += 1
            details.append(detail)
            
        except Exception as e:
            detail["status"] = "failed"
            detail["reason"] = str(e)
            failed_count += 1
            details.append(detail)
    
    if not dry_run:
        db.commit()
    
    end_time = datetime.utcnow()
    processing_time = (end_time - start_time).total_seconds()
    
    return BatchValidationResult(
        success=failed_count == 0,
        validated_count=validated_count,
        failed_count=failed_count,
        skipped_count=skipped_count,
        details=details,
        processing_time=processing_time
    )


@router.post("/validate-by-rule/{rule_id}")
async def validate_by_specific_rule(
    rule_id: UUID,
    current_user: User = Depends(get_current_user),
    current_tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """
    Valide tous les documents correspondant à une règle spécifique.
    """
    rule = db.query(AccountingRule).filter(
        AccountingRule.id == rule_id,
        AccountingRule.tenant_id == current_tenant.id
    ).first()
    
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    
    if not rule.is_active:
        raise HTTPException(status_code=400, detail="Rule is not active")
    
    pending_docs = db.query(Document).filter(
        Document.tenant_id == current_tenant.id,
        Document.status.in_(["pending", "pre_processed", "ocr_completed"])
    ).all()
    
    rules_service = AccountingRulesEngine(db, str(current_tenant.id))
    validated_count = 0
    
    for doc in pending_docs:
        if not doc.supplier_name or not doc.amount_ttc:
            continue
        
        result = rules_service.apply_single_rule(rule, {
            "supplier_name": doc.supplier_name,
            "reference_number": doc.reference_number or "",
            "amount_ttc": float(doc.amount_ttc),
            "document_date": doc.document_date.isoformat() if doc.document_date else None
        })
        
        if result.get("matched"):
            doc.status = "validated"
            doc.validated_at = datetime.utcnow()
            doc.validated_by_id = current_user.id
            validated_count += 1
    
    db.commit()
    
    return {
        "success": True,
        "rule_name": rule.name,
        "validated_count": validated_count
    }
