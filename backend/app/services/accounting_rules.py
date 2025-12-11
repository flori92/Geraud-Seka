"""
Service de règles comptables automatiques
Applique des règles pour suggérer l'imputation comptable
"""
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_
import re

from app.models.accounting_rules import (
    AccountingRule, DocumentClassification,
    RuleConditionType, RuleOperator, RuleActionType
)


class AccountingRulesEngine:
    """Moteur de règles comptables pour l'imputation automatique"""

    def __init__(self, db: Session, tenant_id: str):
        self.db = db
        self.tenant_id = tenant_id

    def apply_rules(self, document_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Applique les règles comptables sur un document OCR
        
        Args:
            document_data: Données extraites par OCR
            
        Returns:
            Dict avec suggestions d'imputation
        """
        # Récupérer les règles actives, triées par priorité
        rules = self.db.query(AccountingRule).filter(
            and_(
                AccountingRule.tenant_id == self.tenant_id,
                AccountingRule.is_active == True
            )
        ).order_by(AccountingRule.priority.desc()).all()

        best_match = None
        best_confidence = 0.0

        for rule in rules:
            confidence = self._evaluate_rule(rule, document_data)
            if confidence > best_confidence and confidence >= rule.confidence_threshold:
                best_confidence = confidence
                best_match = rule

        if best_match:
            return self._apply_actions(best_match, document_data, best_confidence)

        # Aucune règle ne correspond, suggestions par défaut
        return self._default_suggestions(document_data)

    def _evaluate_rule(self, rule: AccountingRule, data: Dict[str, Any]) -> float:
        """
        Évalue si une règle correspond aux données du document
        
        Returns:
            Score de confiance entre 0.0 et 1.0
        """
        conditions = rule.conditions
        if not conditions:
            return 0.0

        matched_conditions = 0
        total_conditions = len(conditions)

        for condition in conditions:
            condition_type = condition.get("type")
            operator = condition.get("operator")
            value = condition.get("value")

            if self._check_condition(condition_type, operator, value, data):
                matched_conditions += 1

        return matched_conditions / total_conditions if total_conditions > 0 else 0.0

    def _check_condition(
        self, 
        condition_type: str, 
        operator: str, 
        expected_value: Any, 
        data: Dict[str, Any]
    ) -> bool:
        """Vérifie une condition individuelle"""
        
        # Extraire la valeur réelle du document
        actual_value = None
        
        if condition_type == RuleConditionType.SUPPLIER_NAME:
            actual_value = data.get("supplier_name", "").lower()
        elif condition_type == RuleConditionType.CUSTOMER_NAME:
            actual_value = data.get("customer_name", "").lower()
        elif condition_type == RuleConditionType.REFERENCE_PATTERN:
            actual_value = data.get("reference_number", "")
        elif condition_type == RuleConditionType.DESCRIPTION_CONTAINS:
            actual_value = data.get("raw_text", "").lower()
        elif condition_type == RuleConditionType.AMOUNT_RANGE:
            actual_value = data.get("amount_ttc", 0.0)
        elif condition_type == RuleConditionType.DOCUMENT_TYPE:
            actual_value = data.get("document_type", "invoice")

        if actual_value is None:
            return False

        expected_value = str(expected_value).lower() if isinstance(expected_value, str) else expected_value

        # Appliquer l'opérateur
        if operator == RuleOperator.EQUALS:
            return actual_value == expected_value
        elif operator == RuleOperator.CONTAINS:
            return expected_value in str(actual_value)
        elif operator == RuleOperator.STARTS_WITH:
            return str(actual_value).startswith(str(expected_value))
        elif operator == RuleOperator.ENDS_WITH:
            return str(actual_value).endswith(str(expected_value))
        elif operator == RuleOperator.GREATER_THAN:
            return float(actual_value) > float(expected_value)
        elif operator == RuleOperator.LESS_THAN:
            return float(actual_value) < float(expected_value)
        elif operator == RuleOperator.BETWEEN:
            min_val, max_val = expected_value.split(",")
            return float(min_val) <= float(actual_value) <= float(max_val)
        elif operator == RuleOperator.MATCHES_REGEX:
            return bool(re.match(expected_value, str(actual_value)))

        return False

    def _apply_actions(
        self, 
        rule: AccountingRule, 
        data: Dict[str, Any], 
        confidence: float
    ) -> Dict[str, Any]:
        """Applique les actions d'une règle"""
        
        result = {
            "rule_id": str(rule.id),
            "rule_name": rule.name,
            "confidence": confidence,
            "auto_apply": rule.auto_apply and confidence >= rule.confidence_threshold,
            "suggested_debit_account": None,
            "suggested_credit_account": None,
            "suggested_label": None,
            "suggested_vat_rate": None,
            "suggested_analytic_code": None
        }

        for action in rule.actions:
            action_type = action.get("type")
            
            if action_type == RuleActionType.ASSIGN_ACCOUNT:
                result["suggested_debit_account"] = action.get("debit_account")
                result["suggested_credit_account"] = action.get("credit_account")
            elif action_type == RuleActionType.SET_VAT_RATE:
                result["suggested_vat_rate"] = action.get("vat_rate")
            elif action_type == RuleActionType.SUGGEST_LABEL:
                result["suggested_label"] = action.get("label_template", "").format(**data)
            elif action_type == RuleActionType.ASSIGN_ANALYTIC_CODE:
                result["suggested_analytic_code"] = action.get("analytic_code")
            elif action_type == RuleActionType.AUTO_VALIDATE:
                result["auto_validate"] = True

        return result

    def _default_suggestions(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Suggestions par défaut basées sur le type de document"""
        
        # Heuristique simple basée sur le nom du fournisseur
        supplier = data.get("supplier_name", "").lower()
        
        # Électricité / Eau / Gaz
        if any(keyword in supplier for keyword in ["edf", "energie", "water", "gaz", "sonede", "steg"]):
            return {
                "confidence": 0.5,
                "auto_apply": False,
                "suggested_debit_account": "606100",  # Fournitures énergétiques
                "suggested_credit_account": "401000",  # Fournisseurs
                "suggested_label": f"Facture {supplier}",
                "source": "heuristic"
            }
        
        # Télécom
        if any(keyword in supplier for keyword in ["orange", "mtn", "moov", "telecom"]):
            return {
                "confidence": 0.5,
                "auto_apply": False,
                "suggested_debit_account": "626000",  # Frais postaux et télécommunications
                "suggested_credit_account": "401000",
                "suggested_label": f"Facture {supplier}",
                "source": "heuristic"
            }

        # Par défaut : achat générique
        return {
            "confidence": 0.3,
            "auto_apply": False,
            "suggested_debit_account": "607000",  # Achats de marchandises
            "suggested_credit_account": "401000",  # Fournisseurs
            "suggested_label": f"Achat - {supplier}",
            "source": "default"
        }


def classify_document(
    db: Session,
    tenant_id: str,
    document_id: str,
    ocr_data: Dict[str, Any]
) -> DocumentClassification:
    """
    Classifie un document et enregistre les suggestions
    
    Args:
        db: Session de base de données
        tenant_id: ID du tenant
        document_id: ID du document
        ocr_data: Données OCR extraites
        
    Returns:
        Objet DocumentClassification créé
    """
    engine = AccountingRulesEngine(db, tenant_id)
    suggestions = engine.apply_rules(ocr_data)

    classification = DocumentClassification(
        tenant_id=tenant_id,
        document_id=document_id,
        suggested_debit_account=suggestions.get("suggested_debit_account"),
        suggested_credit_account=suggestions.get("suggested_credit_account"),
        suggested_label=suggestions.get("suggested_label"),
        suggested_vat_rate=suggestions.get("suggested_vat_rate"),
        suggested_analytic_code=suggestions.get("suggested_analytic_code"),
        confidence_score=suggestions.get("confidence", 0.0),
        rule_id=suggestions.get("rule_id"),
        source=suggestions.get("source", "rule")
    )

    db.add(classification)
    db.commit()
    db.refresh(classification)

    return classification
