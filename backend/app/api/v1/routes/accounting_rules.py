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


# ============================================================================
# SUPPLIER RULES - Simplified for client requirements
# ============================================================================

class SupplierRuleCreate(BaseModel):
    """Règle fournisseur simplifiée pour auto-imputation"""
    supplier_name: str
    supplier_code: Optional[str] = None
    charge_account: str  # Ex: 6061 - Électricité
    vat_account: str = "4454"  # Par défaut TVA déductible
    supplier_account: str  # Ex: 401SBEE
    vat_rate: float = 18  # Taux par défaut Bénin
    journal_code: str = "ACH"
    is_active: bool = True


class SupplierRuleResponse(BaseModel):
    """Réponse pour les règles fournisseurs"""
    id: str
    supplier_name: str
    supplier_code: Optional[str] = None
    charge_account: str
    charge_account_label: Optional[str] = None
    vat_account: str
    vat_account_label: Optional[str] = None
    supplier_account: str
    supplier_account_label: Optional[str] = None
    vat_rate: float
    journal_code: str
    is_active: bool = True
    name: Optional[str] = None
    description: Optional[str] = None
    priority: float = 0
    conditions: List[dict] = []
    actions: List[dict] = []
    auto_apply: bool = False
    confidence_threshold: float = 0.8


class AccountingRuleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[float] = None
    is_active: Optional[bool] = None
    conditions: Optional[List[dict]] = None
    actions: Optional[List[dict]] = None
    auto_apply: Optional[bool] = None
    confidence_threshold: Optional[float] = None


@router.get("/supplier-rules", response_model=List[SupplierRuleResponse])
async def list_supplier_rules(
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Liste toutes les règles fournisseurs (format simplifié client)"""
    # On récupère les règles génériques qui correspondent aux fournisseurs
    rules = db.query(AccountingRule).filter(
        AccountingRule.tenant_id == current_tenant.id,
        AccountingRule.is_active == True
    ).all()
    
    # Transformation en format simplifié
    supplier_rules = []
    for rule in rules:
        # Parser les conditions pour extraire supplier_name
        supplier_name = None
        for condition in rule.conditions:
            if condition.get('type') == 'supplier_name':
                supplier_name = condition.get('value')
                break
        
        if not supplier_name:
            continue
            
        # Parser les actions pour extraire les comptes
        charge_account = vat_account = supplier_account = None
        vat_rate = 18
        journal_code = "ACH"
        
        for action in rule.actions:
            if action.get('type') == 'assign_account':
                charge_account = action.get('debit_account')
                supplier_account = action.get('credit_account')
                vat_account = action.get('vat_account', '4454')
            elif action.get('type') == 'set_vat_rate':
                vat_rate = action.get('vat_rate', 18)
        
        supplier_rules.append(SupplierRuleResponse(
            id=str(rule.id),
            supplier_name=supplier_name,
            supplier_code=None,
            charge_account=charge_account or '6061',
            charge_account_label=None,
            vat_account=vat_account or '4454',
            vat_account_label=None,
            supplier_account=supplier_account or f'401{supplier_name[:4].upper()}',
            supplier_account_label=None,
            vat_rate=vat_rate,
            journal_code=journal_code,
            is_active=rule.is_active,
            name=rule.name,
            description=rule.description,
            priority=rule.priority,
            conditions=rule.conditions or [],
            actions=rule.actions or [],
            auto_apply=rule.auto_apply,
            confidence_threshold=rule.confidence_threshold
        ))
    
    return supplier_rules


@router.post("/supplier-rules", response_model=SupplierRuleResponse)
async def create_supplier_rule(
    rule_data: SupplierRuleCreate,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Crée une règle fournisseur simplifiée"""
    # Convertir en format règle générique
    conditions = [
        {
            "type": "supplier_name",
            "operator": "equals",
            "value": rule_data.supplier_name
        }
    ]
    
    actions = [
        {
            "type": "assign_account",
            "debit_account": rule_data.charge_account,
            "credit_account": rule_data.supplier_account,
            "vat_account": rule_data.vat_account
        },
        {
            "type": "set_vat_rate",
            "vat_rate": rule_data.vat_rate
        }
    ]
    
    rule = AccountingRule(
        tenant_id=current_tenant.id,
        name=f"Règle {rule_data.supplier_name}",
        description=f"Auto-imputation pour {rule_data.supplier_name}",
        priority=10,
        conditions=conditions,
        actions=actions,
        auto_apply=True,
        confidence_threshold=0.8,
        is_active=rule_data.is_active
    )
    
    db.add(rule)
    db.commit()
    db.refresh(rule)
    
    return SupplierRuleResponse(
        id=str(rule.id),
        supplier_name=rule_data.supplier_name,
        supplier_code=rule_data.supplier_code,
        charge_account=rule_data.charge_account,
        charge_account_label=None,
        vat_account=rule_data.vat_account,
        vat_account_label=None,
        supplier_account=rule_data.supplier_account,
        supplier_account_label=None,
        vat_rate=rule_data.vat_rate,
        journal_code=rule_data.journal_code,
        is_active=rule_data.is_active,
        name=rule.name,
        description=rule.description,
        priority=rule.priority,
        conditions=rule.conditions or [],
        actions=rule.actions or [],
        auto_apply=rule.auto_apply,
        confidence_threshold=rule.confidence_threshold
    )


@router.put("/supplier-rules/{rule_id}", response_model=SupplierRuleResponse)
async def update_supplier_rule(
    rule_id: UUID,
    rule_data: SupplierRuleCreate,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Modifie une règle fournisseur"""
    rule = db.query(AccountingRule).filter(
        AccountingRule.id == rule_id,
        AccountingRule.tenant_id == current_tenant.id
    ).first()
    
    if not rule:
        raise HTTPException(status_code=404, detail="Règle non trouvée")
    
    # Mettre à jour
    rule.name = f"Règle {rule_data.supplier_name}"
    rule.description = f"Auto-imputation pour {rule_data.supplier_name}"
    rule.conditions = [
        {
            "type": "supplier_name",
            "operator": "equals",
            "value": rule_data.supplier_name
        }
    ]
    rule.actions = [
        {
            "type": "assign_account",
            "debit_account": rule_data.charge_account,
            "credit_account": rule_data.supplier_account,
            "vat_account": rule_data.vat_account
        },
        {
            "type": "set_vat_rate",
            "vat_rate": rule_data.vat_rate
        }
    ]
    rule.is_active = rule_data.is_active
    
    db.commit()
    db.refresh(rule)
    
    return SupplierRuleResponse(
        id=str(rule.id),
        supplier_name=rule_data.supplier_name,
        supplier_code=rule_data.supplier_code,
        charge_account=rule_data.charge_account,
        charge_account_label=None,
        vat_account=rule_data.vat_account,
        vat_account_label=None,
        supplier_account=rule_data.supplier_account,
        supplier_account_label=None,
        vat_rate=rule_data.vat_rate,
        journal_code=rule_data.journal_code,
        is_active=rule_data.is_active,
        name=rule.name,
        description=rule.description,
        priority=rule.priority,
        conditions=rule.conditions or [],
        actions=rule.actions or [],
        auto_apply=rule.auto_apply,
        confidence_threshold=rule.confidence_threshold
    )


@router.delete("/supplier-rules/{rule_id}")
async def delete_supplier_rule(
    rule_id: UUID,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Supprime une règle fournisseur"""
    rule = db.query(AccountingRule).filter(
        AccountingRule.id == rule_id,
        AccountingRule.tenant_id == current_tenant.id
    ).first()
    
    if not rule:
        raise HTTPException(status_code=404, detail="Règle non trouvée")
    
    db.delete(rule)
    db.commit()
    
    return {"message": "Règle supprimée avec succès"}


# ============================================================================
# CLIENT RULES - For sales invoices (factures de ventes)
# ============================================================================

class ClientRuleCreate(BaseModel):
    """Règle client simplifiée pour auto-imputation des ventes"""
    client_name: str
    client_code: Optional[str] = None
    revenue_account: str  # Ex: 7011 - Ventes de marchandises
    vat_account: str = "4457"  # Par défaut TVA collectée
    client_account: str  # Ex: 411CLIENT
    vat_rate: float = 18  # Taux par défaut Bénin
    journal_code: str = "VTE"  # Journal des ventes
    is_active: bool = True


class ClientRuleResponse(BaseModel):
    """Réponse pour les règles clients"""
    id: str
    client_name: str
    client_code: Optional[str] = None
    revenue_account: str
    revenue_account_label: Optional[str] = None
    vat_account: str
    vat_account_label: Optional[str] = None
    client_account: str
    client_account_label: Optional[str] = None
    vat_rate: float
    journal_code: str
    is_active: bool
    name: str
    description: Optional[str] = None
    priority: float = 0
    conditions: List[dict]
    actions: List[dict]
    auto_apply: bool = False
    confidence_threshold: float = 0.8


@router.get("/client-rules", response_model=List[ClientRuleResponse])
async def list_client_rules(
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Liste toutes les règles clients (format simplifié pour ventes)"""
    # On récupère les règles qui correspondent aux clients (ventes)
    rules = db.query(AccountingRule).filter(
        AccountingRule.tenant_id == current_tenant.id,
        AccountingRule.is_active == True
    ).all()

    # Transformation en format simplifié - filtrer celles qui ont customer_name
    client_rules = []
    for rule in rules:
        # Parser les conditions pour extraire customer_name
        client_name = None
        for condition in rule.conditions:
            if condition.get('type') == 'customer_name':
                client_name = condition.get('value')
                break

        if not client_name:
            continue

        # Parser les actions pour extraire les comptes
        revenue_account = vat_account = client_account = None
        vat_rate = 18
        journal_code = "VTE"

        for action in rule.actions:
            if action.get('type') == 'assign_account':
                revenue_account = action.get('credit_account')  # Pour ventes: crédit = produit
                client_account = action.get('debit_account')    # Pour ventes: débit = client
                vat_account = action.get('vat_account', '4457')
            elif action.get('type') == 'set_vat_rate':
                vat_rate = action.get('vat_rate', 18)

        client_rules.append(ClientRuleResponse(
            id=str(rule.id),
            client_name=client_name,
            client_code=None,
            revenue_account=revenue_account or '7011',
            revenue_account_label=None,
            vat_account=vat_account or '4457',
            vat_account_label=None,
            client_account=client_account or f'411{client_name[:4].upper()}',
            client_account_label=None,
            vat_rate=vat_rate,
            journal_code=journal_code,
            is_active=rule.is_active,
            name=rule.name,
            description=rule.description,
            priority=rule.priority,
            conditions=rule.conditions,
            actions=rule.actions,
            auto_apply=rule.auto_apply,
            confidence_threshold=rule.confidence_threshold
        ))

    return client_rules


@router.post("/client-rules", response_model=ClientRuleResponse)
async def create_client_rule(
    rule_data: ClientRuleCreate,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Crée une règle client simplifiée pour les ventes"""
    # Convertir en format règle générique
    # Pour les ventes: Débit 411 (client), Crédit 70X (produit)
    conditions = [
        {
            "type": "customer_name",
            "operator": "contains",
            "value": rule_data.client_name
        },
        {
            "type": "document_type",
            "operator": "equals",
            "value": "INVOICE_SALES"
        }
    ]

    actions = [
        {
            "type": "assign_account",
            "debit_account": rule_data.client_account,   # 411XXX - Client
            "credit_account": rule_data.revenue_account,  # 70X - Produit
            "vat_account": rule_data.vat_account          # 4457 - TVA collectée
        },
        {
            "type": "set_vat_rate",
            "vat_rate": rule_data.vat_rate
        },
        {
            "type": "suggest_label",
            "label_template": f"Facture vente - {rule_data.client_name}"
        }
    ]

    rule = AccountingRule(
        tenant_id=current_tenant.id,
        name=f"Règle Vente {rule_data.client_name}",
        description=f"Auto-imputation ventes pour {rule_data.client_name}",
        priority=10,
        conditions=conditions,
        actions=actions,
        auto_apply=True,
        confidence_threshold=0.8,
        is_active=rule_data.is_active
    )

    db.add(rule)
    db.commit()
    db.refresh(rule)

    return ClientRuleResponse(
        id=str(rule.id),
        client_name=rule_data.client_name,
        client_code=rule_data.client_code,
        revenue_account=rule_data.revenue_account,
        revenue_account_label=None,
        vat_account=rule_data.vat_account,
        vat_account_label=None,
        client_account=rule_data.client_account,
        client_account_label=None,
        vat_rate=rule_data.vat_rate,
        journal_code=rule_data.journal_code,
        is_active=rule_data.is_active,
        name=rule.name,
        description=rule.description,
        priority=rule.priority,
        conditions=rule.conditions,
        actions=rule.actions,
        auto_apply=rule.auto_apply,
        confidence_threshold=rule.confidence_threshold
    )


@router.put("/client-rules/{rule_id}", response_model=ClientRuleResponse)
async def update_client_rule(
    rule_id: UUID,
    rule_data: ClientRuleCreate,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Modifie une règle client"""
    rule = db.query(AccountingRule).filter(
        AccountingRule.id == rule_id,
        AccountingRule.tenant_id == current_tenant.id
    ).first()

    if not rule:
        raise HTTPException(status_code=404, detail="Règle non trouvée")

    # Mettre à jour
    rule.name = f"Règle Vente {rule_data.client_name}"
    rule.description = f"Auto-imputation ventes pour {rule_data.client_name}"
    rule.conditions = [
        {
            "type": "customer_name",
            "operator": "contains",
            "value": rule_data.client_name
        },
        {
            "type": "document_type",
            "operator": "equals",
            "value": "INVOICE_SALES"
        }
    ]
    rule.actions = [
        {
            "type": "assign_account",
            "debit_account": rule_data.client_account,
            "credit_account": rule_data.revenue_account,
            "vat_account": rule_data.vat_account
        },
        {
            "type": "set_vat_rate",
            "vat_rate": rule_data.vat_rate
        },
        {
            "type": "suggest_label",
            "label_template": f"Facture vente - {rule_data.client_name}"
        }
    ]
    rule.is_active = rule_data.is_active

    db.commit()
    db.refresh(rule)

    return ClientRuleResponse(
        id=str(rule.id),
        client_name=rule_data.client_name,
        client_code=rule_data.client_code,
        revenue_account=rule_data.revenue_account,
        revenue_account_label=None,
        vat_account=rule_data.vat_account,
        vat_account_label=None,
        client_account=rule_data.client_account,
        client_account_label=None,
        vat_rate=rule_data.vat_rate,
        journal_code=rule_data.journal_code,
        is_active=rule_data.is_active,
        name=rule.name,
        description=rule.description,
        priority=rule.priority,
        conditions=rule.conditions,
        actions=rule.actions,
        auto_apply=rule.auto_apply,
        confidence_threshold=rule.confidence_threshold
    )


@router.delete("/client-rules/{rule_id}")
async def delete_client_rule(
    rule_id: UUID,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Supprime une règle client"""
    rule = db.query(AccountingRule).filter(
        AccountingRule.id == rule_id,
        AccountingRule.tenant_id == current_tenant.id
    ).first()

    if not rule:
        raise HTTPException(status_code=404, detail="Règle non trouvée")

    db.delete(rule)
    db.commit()

    return {"message": "Règle client supprimée avec succès"}


# ============================================================================
# GENERIC RULES - Existing functionality
# ============================================================================

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
    description: Optional[str] = None
    priority: float = 0.0
    conditions: List[dict] = []
    actions: List[dict] = []
    is_active: bool = True
    auto_apply: bool = False
    confidence_threshold: float = 0.8

    class Config:
        from_attributes = True
        extra = "ignore"



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
    
    result = []
    for rule in rules:
        try:
            result.append(AccountingRuleResponse.model_validate(rule))
        except Exception as e:
            print(f"⚠️ Error validating rule {rule.id}: {e}")
            continue
    
    return result


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


@router.get("/", response_model=List[AccountingRuleResponse])
async def list_accounting_rules(
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Liste toutes les règles comptables d'imputation"""
    rules = db.query(AccountingRule).filter(
        AccountingRule.tenant_id == current_tenant.id
    ).order_by(AccountingRule.priority.desc()).all()
    
    result = []
    for rule in rules:
        # Résumé des conditions
        conditions_summary = []
        for cond in rule.conditions:
            if cond.get('type') == 'supplier_name':
                conditions_summary.append(f"Fournisseur: {cond.get('value')}")
            elif cond.get('type') == 'document_type':
                conditions_summary.append(f"Type doc: {cond.get('value')}")
            elif cond.get('type') == 'amount_range':
                conditions_summary.append(f"Montant: {cond.get('min', 0)} - {cond.get('max', '∞')}")
        
        # Résumé des actions
        actions_summary = []
        for action in rule.actions:
            if action.get('type') == 'assign_account':
                actions_summary.append(f"Comptes: {action.get('debit_account')} / {action.get('credit_account')}")
            elif action.get('type') == 'set_vat_rate':
                actions_summary.append(f"TVA: {action.get('vat_rate')}%")
        
        result.append({
            "id": str(rule.id),
            "name": rule.name,
            "description": rule.description,
            "priority": rule.priority,
            "is_active": rule.is_active,
            "conditions_summary": "; ".join(conditions_summary) if conditions_summary else "Aucune",
            "actions_summary": "; ".join(actions_summary) if actions_summary else "Aucune",
            "conditions": rule.conditions,
            "actions": rule.actions,
            "auto_apply": rule.auto_apply,
            "confidence_threshold": rule.confidence_threshold
        })
    
    return result


@router.post("/", response_model=AccountingRuleResponse)
async def create_accounting_rule(
    rule_data: AccountingRuleCreate,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Crée une nouvelle règle comptable d'imputation"""
    rule = AccountingRule(
        tenant_id=current_tenant.id,
        name=rule_data.name,
        description=rule_data.description,
        priority=rule_data.priority,
        is_active=rule_data.is_active,
        conditions=rule_data.conditions,
        actions=rule_data.actions,
        auto_apply=rule_data.auto_apply,
        confidence_threshold=rule_data.confidence_threshold
    )
    
    db.add(rule)
    db.commit()
    db.refresh(rule)
    
    return AccountingRuleResponse(
        id=str(rule.id),
        name=rule.name,
        description=rule.description,
        priority=rule.priority,
        is_active=rule.is_active,
        conditions=rule.conditions,
        actions=rule.actions,
        auto_apply=rule.auto_apply,
        confidence_threshold=rule.confidence_threshold
    )


@router.put("/{rule_id}", response_model=AccountingRuleResponse)
async def update_accounting_rule(
    rule_id: UUID,
    rule_data: AccountingRuleUpdate,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Met à jour une règle comptable d'imputation"""
    rule = db.query(AccountingRule).filter(
        AccountingRule.id == rule_id,
        AccountingRule.tenant_id == current_tenant.id
    ).first()
    
    if not rule:
        raise HTTPException(status_code=404, detail="Règle non trouvée")
    
    # Mise à jour des champs fournis
    for field, value in rule_data.dict(exclude_unset=True).items():
        setattr(rule, field, value)
    
    db.commit()
    db.refresh(rule)
    
    return AccountingRuleResponse(
        id=str(rule.id),
        name=rule.name,
        description=rule.description,
        priority=rule.priority,
        is_active=rule.is_active,
        conditions=rule.conditions,
        actions=rule.actions,
        auto_apply=rule.auto_apply,
        confidence_threshold=rule.confidence_threshold
    )


@router.delete("/{rule_id}")
async def delete_accounting_rule(
    rule_id: UUID,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Supprime une règle comptable d'imputation"""
    rule = db.query(AccountingRule).filter(
        AccountingRule.id == rule_id,
        AccountingRule.tenant_id == current_tenant.id
    ).first()
    
    if not rule:
        raise HTTPException(status_code=404, detail="Règle non trouvée")
    
    db.delete(rule)
    db.commit()
    
    return {"message": "Règle supprimée"}
