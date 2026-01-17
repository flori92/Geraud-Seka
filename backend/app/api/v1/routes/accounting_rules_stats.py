"""
API Routes pour les statistiques des règles comptables
"""
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.session import get_db
from app.core.deps import get_current_user, get_current_tenant
from app.models.user import User
from app.models.tenant import Tenant
from app.models.document import Document
from app.models.accounting_rules import AccountingRule

router = APIRouter()


@router.get("/stats")
async def get_accounting_rules_stats(
    current_user: User = Depends(get_current_user),
    current_tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """
    Statistiques globales sur les règles comptables.
    Retourne le nombre de documents matchés par règle.
    """
    try:
        # Récupérer toutes les règles
        rules = db.query(AccountingRule).filter(
            AccountingRule.tenant_id == current_tenant.id
        ).all()
        
        stats = []
        
        for rule in rules:
            try:
                # Compter les documents qui ont matché cette règle (UUID comparison)
                matched_count = db.query(func.count(Document.id)).filter(
                    Document.tenant_id == current_tenant.id,
                    Document.matched_rule_id == rule.id
                ).scalar() or 0
                
                # Compter les documents validés avec cette règle
                validated_count = db.query(func.count(Document.id)).filter(
                    Document.tenant_id == current_tenant.id,
                    Document.matched_rule_id == rule.id,
                    Document.status == "VALIDATED"
                ).scalar() or 0
                
                # Date du dernier match
                last_match = db.query(func.max(Document.created_at)).filter(
                    Document.tenant_id == current_tenant.id,
                    Document.matched_rule_id == rule.id
                ).scalar()
                
                stats.append({
                    "rule_id": str(rule.id),
                    "rule_name": rule.name,
                    "matched_count": matched_count,
                    "validated_count": validated_count,
                    "last_match": last_match.isoformat() if last_match else None
                })
            except Exception as e:
                # Si une règle pose problème, on continue avec les autres
                print(f"Error processing rule {rule.id}: {e}")
                stats.append({
                    "rule_id": str(rule.id),
                    "rule_name": rule.name,
                    "matched_count": 0,
                    "validated_count": 0,
                    "last_match": None
                })
        
        return stats
    except Exception as e:
        print(f"Error in get_accounting_rules_stats: {e}")
        return []


@router.get("/usage-summary")
async def get_usage_summary(
    current_user: User = Depends(get_current_user),
    current_tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """
    Résumé d'utilisation des règles.
    """
    
    total_rules = db.query(func.count(AccountingRule.id)).filter(
        AccountingRule.tenant_id == current_tenant.id
    ).scalar() or 0
    
    active_rules = db.query(func.count(AccountingRule.id)).filter(
        AccountingRule.tenant_id == current_tenant.id,
        AccountingRule.is_active == True
    ).scalar() or 0
    
    total_auto_validable = db.query(func.count(Document.id)).filter(
        Document.tenant_id == current_tenant.id,
        Document.auto_validable == True
    ).scalar() or 0
    
    total_validated_via_rules = db.query(func.count(Document.id)).filter(
        Document.tenant_id == current_tenant.id,
        Document.matched_rule_id.isnot(None),
        Document.status == "VALIDATED"
    ).scalar() or 0
    
    return {
        "total_rules": total_rules,
        "active_rules": active_rules,
        "inactive_rules": total_rules - active_rules,
        "total_auto_validable_documents": total_auto_validable,
        "total_validated_via_rules": total_validated_via_rules
    }
