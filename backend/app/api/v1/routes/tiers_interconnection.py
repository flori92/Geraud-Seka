"""
API Routes pour l'interconnexion Tiers - Plan Comptable - Règles
================================================================

Endpoints dédiés à la logique d'interconnexion SEKA Business:
1. Génération automatique d'écritures à partir de factures
2. Recherche de fournisseur par texte OCR
3. Création de règles en masse
4. Statistiques d'utilisation des règles
5. Suggestions intelligentes de comptes
"""

from typing import List, Optional, Dict, Any
from uuid import UUID
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from pydantic import BaseModel

from app.db.session import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.supplier import Supplier
from app.models.accounting_advanced import ChartOfAccounts
from app.models.accounting_rules import AccountingRule
from app.services.tiers_interconnection import get_interconnection_service


router = APIRouter()


# =============================================================================
# SCHEMAS
# =============================================================================

class OcrSearchRequest(BaseModel):
    """Requête de recherche de fournisseur par OCR"""
    ocr_text: str
    supplier_name_hint: Optional[str] = None


class OcrSearchResponse(BaseModel):
    """Réponse de recherche OCR"""
    found: bool
    supplier: Optional[Dict[str, Any]] = None
    confidence: float
    has_rule: bool = False
    suggested_entries: Optional[List[Dict[str, Any]]] = None


class GenerateEntriesRequest(BaseModel):
    """Requête de génération d'écritures"""
    supplier_name: str
    raw_text: Optional[str] = None
    amount_ht: Optional[float] = None
    amount_vat: Optional[float] = None
    amount_ttc: float
    date: Optional[str] = None
    reference_number: Optional[str] = None


class GenerateEntriesResponse(BaseModel):
    """Réponse de génération d'écritures"""
    supplier_found: bool
    supplier: Optional[Dict[str, Any]] = None
    rule_found: bool
    rule: Optional[Dict[str, Any]] = None
    entries: List[Dict[str, Any]]
    status: str
    confidence: float


class BulkRuleCreateRequest(BaseModel):
    """Création de règles en masse"""
    supplier_ids: List[str]
    charge_account: str
    vat_account: str = "4454"
    vat_rate: float = 18.0
    journal_code: str = "ACH"


class BulkRuleCreateResponse(BaseModel):
    """Réponse création en masse"""
    created_count: int
    failed_count: int
    results: List[Dict[str, Any]]


class AccountSuggestion(BaseModel):
    """Suggestion de compte"""
    account_code: str
    account_name: str
    confidence: float
    reason: str


class InterconnectionStats(BaseModel):
    """Statistiques d'interconnexion"""
    total_suppliers: int
    suppliers_with_rules: int
    suppliers_without_rules: int
    total_rules: int
    active_rules: int
    total_auxiliary_accounts: int
    most_used_charge_accounts: List[Dict[str, Any]]


# =============================================================================
# ENDPOINTS
# =============================================================================

@router.post("/search-supplier-ocr", response_model=OcrSearchResponse)
async def search_supplier_by_ocr(
    request: OcrSearchRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Recherche un fournisseur à partir du texte OCR d'une facture.
    
    Utilise les mots-clés OCR configurés pour chaque fournisseur
    pour trouver la meilleure correspondance.
    
    Returns:
        - found: True si un fournisseur a été trouvé
        - supplier: Informations du fournisseur
        - confidence: Score de confiance (0-1)
        - has_rule: True si le fournisseur a une règle d'imputation
        - suggested_entries: Écritures suggérées si règle active
    """
    service = get_interconnection_service(db, str(current_user.tenant_id))
    
    supplier, confidence = service.find_supplier_by_ocr_text(
        request.ocr_text,
        request.supplier_name_hint
    )
    
    if not supplier:
        return OcrSearchResponse(found=False, confidence=0.0)
    
    supplier_data = {
        "id": str(supplier.id),
        "name": supplier.name,
        "code": supplier.code,
        "auxiliary_account_code": supplier.auxiliary_account_code,
        "has_active_rule": supplier.has_active_rule
    }
    
    # Si le fournisseur a une règle, suggérer les écritures
    suggested_entries = None
    if supplier.has_active_rule and supplier.default_charge_account:
        suggested_entries = [
            {
                "type": "debit",
                "account": supplier.default_charge_account,
                "description": "Compte de charge"
            },
            {
                "type": "debit",
                "account": supplier.default_vat_account or "4454",
                "description": "TVA déductible"
            },
            {
                "type": "credit",
                "account": supplier.auxiliary_account_code or "401",
                "description": "Compte fournisseur"
            }
        ]
    
    return OcrSearchResponse(
        found=True,
        supplier=supplier_data,
        confidence=confidence,
        has_rule=supplier.has_active_rule or False,
        suggested_entries=suggested_entries
    )


@router.post("/generate-entries", response_model=GenerateEntriesResponse)
async def generate_entries_from_invoice(
    request: GenerateEntriesRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Génère automatiquement les écritures comptables pour une facture.
    
    Flux:
    1. Identifie le fournisseur par nom ou texte OCR
    2. Recherche la règle d'imputation associée
    3. Génère les lignes d'écriture (Débit charge + Débit TVA + Crédit 401XXX)
    
    Args:
        request: Données de la facture (montants, date, référence)
        
    Returns:
        - entries: Liste des écritures générées
        - status: "pre_processed" (auto) ou "manual_required" (manuel)
    """
    service = get_interconnection_service(db, str(current_user.tenant_id))
    
    ocr_data = {
        "supplier_name": request.supplier_name,
        "raw_text": request.raw_text or request.supplier_name,
        "amount_ht": request.amount_ht,
        "amount_vat": request.amount_vat,
        "amount_ttc": request.amount_ttc,
        "date": request.date,
        "reference_number": request.reference_number
    }
    
    # Mock document (on n'a pas besoin du vrai document pour la génération)
    class MockDocument:
        pass
    
    result = service.generate_entries_from_invoice(MockDocument(), ocr_data)
    
    return GenerateEntriesResponse(**result)


@router.post("/bulk-create-rules", response_model=BulkRuleCreateResponse)
async def bulk_create_rules(
    request: BulkRuleCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Crée des règles d'imputation en masse pour plusieurs fournisseurs.
    
    Utile pour configurer rapidement tous les fournisseurs
    avec le même compte de charge (ex: tous les fournisseurs télécom → 6261).
    """
    service = get_interconnection_service(db, str(current_user.tenant_id))
    
    results = []
    created_count = 0
    failed_count = 0
    
    for supplier_id in request.supplier_ids:
        try:
            # Récupérer le fournisseur
            supplier = db.query(Supplier).filter(
                and_(
                    Supplier.id == supplier_id,
                    Supplier.tenant_id == current_user.tenant_id
                )
            ).first()
            
            if not supplier:
                results.append({
                    "supplier_id": supplier_id,
                    "success": False,
                    "error": "Fournisseur non trouvé"
                })
                failed_count += 1
                continue
            
            # Créer la règle
            rule = service.create_supplier_rule(
                supplier=supplier,
                charge_account=request.charge_account,
                vat_account=request.vat_account,
                vat_rate=request.vat_rate,
                journal_code=request.journal_code
            )
            
            results.append({
                "supplier_id": supplier_id,
                "supplier_name": supplier.name,
                "success": True,
                "rule_id": str(rule.id)
            })
            created_count += 1
            
        except Exception as e:
            results.append({
                "supplier_id": supplier_id,
                "success": False,
                "error": str(e)
            })
            failed_count += 1
    
    db.commit()
    
    return BulkRuleCreateResponse(
        created_count=created_count,
        failed_count=failed_count,
        results=results
    )


@router.get("/suggest-charge-account", response_model=List[AccountSuggestion])
async def suggest_charge_account(
    supplier_name: str = Query(..., description="Nom du fournisseur"),
    ocr_text: Optional[str] = Query(None, description="Texte OCR de la facture"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Suggère des comptes de charge basés sur le nom du fournisseur.
    
    Utilise des heuristiques basées sur des mots-clés courants:
    - SBEE, électricité → 6061
    - SONEB, eau → 6062
    - MTN, Moov, télécom → 6261
    - Carburant, essence → 6063
    - etc.
    """
    suggestions = []
    search_text = (supplier_name + " " + (ocr_text or "")).lower()
    
    # Heuristiques de suggestion
    heuristics = [
        {
            "keywords": ["sbee", "électricité", "electricity", "energie électrique", "sonelec"],
            "account": "6061",
            "name": "Électricité",
            "reason": "Fournisseur d'énergie électrique détecté"
        },
        {
            "keywords": ["soneb", "eau", "water", "hydraulique"],
            "account": "6062",
            "name": "Eau",
            "reason": "Fournisseur d'eau détecté"
        },
        {
            "keywords": ["mtn", "moov", "orange", "glo", "telecom", "télécom", "mobile", "airtel"],
            "account": "6261",
            "name": "Télécommunications",
            "reason": "Opérateur télécom détecté"
        },
        {
            "keywords": ["oryx", "total", "shell", "carburant", "essence", "gasoil", "station"],
            "account": "6063",
            "name": "Carburants",
            "reason": "Fournisseur de carburant détecté"
        },
        {
            "keywords": ["loyer", "bail", "immobilier", "location"],
            "account": "6132",
            "name": "Locations immobilières",
            "reason": "Location immobilière détectée"
        },
        {
            "keywords": ["avocat", "notaire", "expert", "comptable", "consultant", "honoraire"],
            "account": "6226",
            "name": "Honoraires",
            "reason": "Prestation de service professionnel détectée"
        },
        {
            "keywords": ["banque", "bank", "frais bancaire"],
            "account": "627",
            "name": "Services bancaires",
            "reason": "Service bancaire détecté"
        },
        {
            "keywords": ["fourniture", "bureau", "papeterie", "stylo", "papier"],
            "account": "6064",
            "name": "Fournitures de bureau",
            "reason": "Fournitures de bureau détectées"
        },
        {
            "keywords": ["informatique", "ordinateur", "logiciel", "software", "computer"],
            "account": "6065",
            "name": "Fournitures informatiques",
            "reason": "Matériel/service informatique détecté"
        },
        {
            "keywords": ["publicité", "pub", "annonce", "marketing", "affichage"],
            "account": "6271",
            "name": "Annonces et insertions",
            "reason": "Service publicitaire détecté"
        }
    ]
    
    for heuristic in heuristics:
        matches = sum(1 for kw in heuristic["keywords"] if kw in search_text)
        if matches > 0:
            confidence = min(0.9, 0.5 + (matches * 0.15))
            suggestions.append(AccountSuggestion(
                account_code=heuristic["account"],
                account_name=heuristic["name"],
                confidence=confidence,
                reason=heuristic["reason"]
            ))
    
    # Si aucune suggestion trouvée, proposer un compte par défaut
    if not suggestions:
        suggestions.append(AccountSuggestion(
            account_code="605",
            account_name="Autres achats",
            confidence=0.3,
            reason="Aucune correspondance trouvée - compte générique suggéré"
        ))
    
    # Trier par confiance décroissante
    suggestions.sort(key=lambda x: x.confidence, reverse=True)
    
    return suggestions[:5]  # Top 5


@router.get("/stats", response_model=InterconnectionStats)
async def get_interconnection_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retourne les statistiques d'interconnexion du tenant.
    
    Utile pour le dashboard et le monitoring de la configuration.
    """
    tenant_id = current_user.tenant_id
    
    # Compter les fournisseurs
    total_suppliers = db.query(func.count(Supplier.id)).filter(
        Supplier.tenant_id == tenant_id
    ).scalar() or 0
    
    suppliers_with_rules = db.query(func.count(Supplier.id)).filter(
        and_(
            Supplier.tenant_id == tenant_id,
            Supplier.has_active_rule == True
        )
    ).scalar() or 0
    
    # Compter les règles
    total_rules = db.query(func.count(AccountingRule.id)).filter(
        AccountingRule.tenant_id == tenant_id
    ).scalar() or 0
    
    active_rules = db.query(func.count(AccountingRule.id)).filter(
        and_(
            AccountingRule.tenant_id == tenant_id,
            AccountingRule.is_active == True
        )
    ).scalar() or 0
    
    # Compter les comptes auxiliaires
    total_auxiliary = db.query(func.count(ChartOfAccounts.id)).filter(
        and_(
            ChartOfAccounts.tenant_id == tenant_id,
            ChartOfAccounts.is_auxiliary == True
        )
    ).scalar() or 0
    
    # Top comptes de charge utilisés
    top_charge_accounts = db.query(
        Supplier.default_charge_account,
        func.count(Supplier.id).label('count')
    ).filter(
        and_(
            Supplier.tenant_id == tenant_id,
            Supplier.default_charge_account.isnot(None)
        )
    ).group_by(Supplier.default_charge_account).order_by(
        func.count(Supplier.id).desc()
    ).limit(5).all()
    
    most_used = [
        {"account": acc, "count": count}
        for acc, count in top_charge_accounts
    ]
    
    return InterconnectionStats(
        total_suppliers=total_suppliers,
        suppliers_with_rules=suppliers_with_rules,
        suppliers_without_rules=total_suppliers - suppliers_with_rules,
        total_rules=total_rules,
        active_rules=active_rules,
        total_auxiliary_accounts=total_auxiliary,
        most_used_charge_accounts=most_used
    )


@router.get("/suppliers-without-rules", response_model=List[Dict[str, Any]])
async def get_suppliers_without_rules(
    limit: int = Query(20, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Liste les fournisseurs sans règle d'imputation.
    
    Utile pour identifier les fournisseurs à configurer.
    """
    suppliers = db.query(Supplier).filter(
        and_(
            Supplier.tenant_id == current_user.tenant_id,
            Supplier.has_active_rule == False
        )
    ).limit(limit).all()
    
    return [
        {
            "id": str(s.id),
            "name": s.name,
            "code": s.code,
            "auxiliary_account_code": s.auxiliary_account_code,
            "invoice_count": 0  # TODO: compter les factures en attente
        }
        for s in suppliers
    ]


@router.post("/create-auxiliary-account/{supplier_id}")
async def create_auxiliary_account(
    supplier_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Crée manuellement un compte auxiliaire pour un fournisseur.
    
    Utile si le compte n'a pas été créé automatiquement.
    """
    supplier = db.query(Supplier).filter(
        and_(
            Supplier.id == supplier_id,
            Supplier.tenant_id == current_user.tenant_id
        )
    ).first()
    
    if not supplier:
        raise HTTPException(status_code=404, detail="Fournisseur non trouvé")
    
    if supplier.auxiliary_account_id:
        raise HTTPException(status_code=400, detail="Le compte auxiliaire existe déjà")
    
    service = get_interconnection_service(db, str(current_user.tenant_id))
    account = service.create_auxiliary_account(supplier)
    
    db.commit()
    
    return {
        "success": True,
        "account_id": str(account.id),
        "account_number": account.account_number,
        "account_name": account.name
    }
