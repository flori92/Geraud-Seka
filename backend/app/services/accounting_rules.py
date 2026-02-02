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

        # Détecter si c'est une règle de vente (customer_name dans les conditions)
        is_sales_rule = any(
            cond.get("type") == "customer_name" or
            cond.get("value") == "INVOICE_SALES"
            for cond in rule.conditions
        )

        # Défauts selon le type de règle
        if is_sales_rule:
            default_vat_account = "4457"  # TVA collectée
            default_journal = "VTE"       # Journal ventes
        else:
            default_vat_account = "4454"  # TVA déductible
            default_journal = "ACH"       # Journal achats

        result = {
            "matched": True,  # Flag indiquant qu'une règle a été trouvée
            "rule_id": str(rule.id),
            "rule_name": rule.name,
            "confidence": confidence,
            "auto_apply": rule.auto_apply and confidence >= rule.confidence_threshold,
            "suggested_debit_account": None,
            "suggested_credit_account": None,
            "suggested_vat_account": default_vat_account,
            "suggested_label": None,
            "suggested_vat_rate": 18,  # Par défaut 18%
            "suggested_analytic_code": None,
            "journal_code": default_journal,
            "is_sales": is_sales_rule,
            "source": "rule"
        }

        for action in rule.actions:
            action_type = action.get("type")

            if action_type == RuleActionType.ASSIGN_ACCOUNT:
                result["suggested_debit_account"] = action.get("debit_account")
                result["suggested_credit_account"] = action.get("credit_account")
                # Récupérer le compte TVA s'il est spécifié
                if action.get("vat_account"):
                    result["suggested_vat_account"] = action.get("vat_account")
            elif action_type == RuleActionType.SET_VAT_RATE:
                result["suggested_vat_rate"] = action.get("vat_rate")
                # Déterminer le compte TVA selon le taux
                vat_rate = action.get("vat_rate", 18)
                if vat_rate == 18:
                    result["suggested_vat_account"] = action.get("vat_account", "4454")
                elif vat_rate == 0:
                    result["suggested_vat_account"] = None
            elif action_type == RuleActionType.SUGGEST_LABEL:
                try:
                    result["suggested_label"] = action.get("label_template", "").format(**data)
                except (KeyError, ValueError):
                    result["suggested_label"] = action.get("label_template", "")
            elif action_type == RuleActionType.ASSIGN_ANALYTIC_CODE:
                result["suggested_analytic_code"] = action.get("analytic_code")
            elif action_type == RuleActionType.AUTO_VALIDATE:
                result["auto_validate"] = True

        return result

    def _default_suggestions(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Suggestions par défaut basées sur le type de document.

        Utilise le système d'interconnexion pour trouver le fournisseur/client
        et sa règle d'imputation associée.
        """
        document_type = data.get("document_type", "").upper()
        supplier_name = data.get("supplier_name", "").lower()
        customer_name = data.get("customer_name", "").lower()
        raw_text = data.get("raw_text", "")

        # ============================================================
        # FACTURES DE VENTES (INVOICE_SALES)
        # ============================================================
        if document_type == "INVOICE_SALES" or (customer_name and not supplier_name):
            # C'est une facture de vente - retourner les suggestions appropriées
            return self._default_sales_suggestions(data, customer_name)

        # Essayer de trouver le fournisseur via l'interconnexion
        try:
            from app.services.tiers_interconnection import TiersInterconnectionService
            service = TiersInterconnectionService(self.db, self.tenant_id)

            supplier, confidence = service.find_supplier_by_ocr_text(
                raw_text or supplier_name,
                supplier_name
            )

            if supplier and supplier.has_active_rule:
                # Utiliser la règle du fournisseur
                auxiliary_code = supplier.auxiliary_account_code or f"401{supplier.code or supplier.name[:4].upper()}"
                return {
                    "matched": True,  # Fournisseur avec règle = match
                    "rule_id": str(supplier.default_rule_id) if supplier.default_rule_id else None,
                    "rule_name": f"Règle {supplier.name}",
                    "confidence": confidence,
                    "auto_apply": confidence >= 0.7,
                    "suggested_debit_account": supplier.default_charge_account or "601000",
                    "suggested_credit_account": auxiliary_code,
                    "suggested_vat_account": supplier.default_vat_account or "4454",
                    "suggested_vat_rate": float(supplier.default_tax_rate or 18),
                    "suggested_label": f"Facture {supplier.name}",
                    "journal_code": supplier.default_journal or "ACH",
                    "supplier_id": str(supplier.id),
                    "supplier_name": supplier.name,
                    "source": "interconnection"
                }
            elif supplier:
                # Fournisseur trouvé mais sans règle
                auxiliary_code = supplier.auxiliary_account_code or "401000"
                return {
                    "matched": False,  # Fournisseur sans règle = pas de match
                    "confidence": confidence * 0.8,
                    "auto_apply": False,
                    "suggested_debit_account": supplier.default_charge_account or "601000",
                    "suggested_credit_account": auxiliary_code,
                    "suggested_vat_account": supplier.default_vat_account or "4454",
                    "suggested_label": f"Facture {supplier.name}",
                    "journal_code": "ACH",
                    "supplier_id": str(supplier.id),
                    "supplier_name": supplier.name,
                    "source": "supplier_found_no_rule",
                    "message": f"Fournisseur '{supplier.name}' trouvé mais sans règle d'imputation"
                }
        except Exception as e:
            print(f"Interconnection lookup failed: {e}")
        
        # Fallback: heuristiques basées sur le nom
        # Électricité / Énergie
        if any(keyword in supplier_name for keyword in ["sbee", "edf", "energie", "électricité", "sonelec"]):
            return {
                "matched": False,
                "confidence": 0.5,
                "auto_apply": False,
                "suggested_debit_account": "6061",  # Électricité
                "suggested_credit_account": "401",  # Fournisseurs
                "suggested_vat_account": "4454",
                "suggested_label": f"Facture électricité - {supplier_name}",
                "journal_code": "ACH",
                "source": "heuristic"
            }

        # Eau
        if any(keyword in supplier_name for keyword in ["soneb", "water", "eau"]):
            return {
                "matched": False,
                "confidence": 0.5,
                "auto_apply": False,
                "suggested_debit_account": "6062",  # Eau
                "suggested_credit_account": "401",
                "suggested_vat_account": "4454",
                "suggested_label": f"Facture eau - {supplier_name}",
                "journal_code": "ACH",
                "source": "heuristic"
            }

        # Télécommunications
        if any(keyword in supplier_name for keyword in ["mtn", "moov", "orange", "telecom", "glo"]):
            return {
                "matched": False,
                "confidence": 0.5,
                "auto_apply": False,
                "suggested_debit_account": "6261",  # Télécommunications
                "suggested_credit_account": "401",
                "suggested_vat_account": "4454",
                "suggested_label": f"Facture télécom - {supplier_name}",
                "journal_code": "ACH",
                "source": "heuristic"
            }

        # Carburant
        if any(keyword in supplier_name for keyword in ["oryx", "total", "shell", "carburant", "essence"]):
            return {
                "matched": False,
                "confidence": 0.5,
                "auto_apply": False,
                "suggested_debit_account": "6063",  # Carburants
                "suggested_credit_account": "401",
                "suggested_vat_account": "4454",
                "suggested_label": f"Facture carburant - {supplier_name}",
                "journal_code": "ACH",
                "source": "heuristic"
            }

        # Par défaut pour les achats
        return {
            "matched": False,
            "confidence": 0.3,
            "auto_apply": False,
            "suggested_debit_account": "601",  # Achats de marchandises
            "suggested_credit_account": "401",  # Fournisseurs
            "suggested_vat_account": "4454",
            "suggested_label": f"Achat - {supplier_name}",
            "journal_code": "ACH",
            "is_sales": False,
            "source": "default"
        }

    def _default_sales_suggestions(self, data: Dict[str, Any], customer_name: str) -> Dict[str, Any]:
        """
        Suggestions par défaut pour les factures de ventes.

        Pour les ventes:
        - Débit: 411XXX (Client)
        - Crédit: 70X (Produits/Services)
        - TVA: 4457 (TVA collectée)
        - Journal: VTE
        """
        # Essayer de trouver le client via l'interconnexion
        try:
            from app.services.tiers_interconnection import TiersInterconnectionService
            service = TiersInterconnectionService(self.db, self.tenant_id)

            # Chercher le client
            client, confidence = service.find_client_by_ocr_text(
                data.get("raw_text", "") or customer_name,
                customer_name
            )

            if client and hasattr(client, 'has_active_rule') and client.has_active_rule:
                # Utiliser la règle du client
                auxiliary_code = client.auxiliary_account_code or f"411{client.code or client.name[:4].upper()}"
                return {
                    "matched": True,  # Client avec règle = match
                    "rule_id": str(client.default_rule_id) if hasattr(client, 'default_rule_id') and client.default_rule_id else None,
                    "rule_name": f"Règle Vente {client.name}",
                    "confidence": confidence,
                    "auto_apply": confidence >= 0.7,
                    "suggested_debit_account": auxiliary_code,  # 411XXX - Client
                    "suggested_credit_account": getattr(client, 'default_revenue_account', None) or "7011",  # 70X - Produits
                    "suggested_vat_account": getattr(client, 'default_vat_account', None) or "4457",  # TVA collectée
                    "suggested_vat_rate": float(getattr(client, 'default_tax_rate', None) or 18),
                    "suggested_label": f"Vente {client.name}",
                    "journal_code": getattr(client, 'default_journal', None) or "VTE",
                    "client_id": str(client.id),
                    "client_name": client.name,
                    "is_sales": True,
                    "source": "interconnection"
                }
            elif client:
                # Client trouvé mais sans règle
                auxiliary_code = getattr(client, 'auxiliary_account_code', None) or f"411{customer_name[:4].upper()}"
                return {
                    "matched": False,  # Client sans règle = pas de match
                    "confidence": confidence * 0.8,
                    "auto_apply": False,
                    "suggested_debit_account": auxiliary_code,  # 411XXX
                    "suggested_credit_account": "7011",  # Ventes de marchandises
                    "suggested_vat_account": "4457",  # TVA collectée
                    "suggested_label": f"Vente {client.name}",
                    "journal_code": "VTE",
                    "client_id": str(client.id),
                    "client_name": client.name,
                    "is_sales": True,
                    "source": "client_found_no_rule",
                    "message": f"Client '{client.name}' trouvé mais sans règle d'imputation"
                }
        except Exception as e:
            print(f"Client interconnection lookup failed: {e}")

        # Fallback: suggestions génériques pour ventes
        client_code = f"411{customer_name[:4].upper()}" if customer_name else "411000"
        return {
            "matched": False,
            "confidence": 0.3,
            "auto_apply": False,
            "suggested_debit_account": client_code,  # Compte client
            "suggested_credit_account": "7011",  # Ventes de marchandises
            "suggested_vat_account": "4457",  # TVA collectée
            "suggested_label": f"Vente - {customer_name}" if customer_name else "Vente",
            "journal_code": "VTE",
            "is_sales": True,
            "source": "default_sales"
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
