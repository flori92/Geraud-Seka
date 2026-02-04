"""
Service de détection et suggestion de fournisseurs
Gère la reconnaissance des fournisseurs après OCR et suggère la création
"""
from typing import Dict, Any, List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
import re

from app.models.supplier import Supplier
from app.models.accounting_rules import AccountingRule, RuleConditionType, RuleOperator


class SupplierDetectionService:
    """Service de détection et matching des fournisseurs"""

    def __init__(self, db: Session, tenant_id: str):
        self.db = db
        self.tenant_id = tenant_id

    def find_supplier_by_name(self, supplier_name: str) -> Tuple[Optional[Supplier], float]:
        """
        Recherche un fournisseur par son nom avec différentes stratégies de matching.
        
        Returns:
            Tuple (Supplier ou None, score de confiance 0-1)
        """
        if not supplier_name:
            return None, 0.0

        supplier_name_clean = supplier_name.strip().lower()
        
        # 1. Correspondance exacte (100% confiance)
        exact_match = self.db.query(Supplier).filter(
            and_(
                Supplier.tenant_id == self.tenant_id,
                func.lower(Supplier.name) == supplier_name_clean
            )
        ).first()
        
        if exact_match:
            return exact_match, 1.0
        
        # 2. Correspondance par code (95% confiance)
        code_match = self.db.query(Supplier).filter(
            and_(
                Supplier.tenant_id == self.tenant_id,
                func.lower(Supplier.code) == supplier_name_clean
            )
        ).first()
        
        if code_match:
            return code_match, 0.95
        
        # 3. Correspondance par mots-clés OCR (90% confiance)
        # Chercher dans les keywords JSON
        keyword_matches = self.db.query(Supplier).filter(
            and_(
                Supplier.tenant_id == self.tenant_id,
                Supplier.ocr_keywords.isnot(None)
            )
        ).all()
        
        for supplier in keyword_matches:
            if supplier.ocr_keywords:
                for keyword in supplier.ocr_keywords:
                    if keyword.lower() in supplier_name_clean or supplier_name_clean in keyword.lower():
                        return supplier, 0.90
        
        # 4. Correspondance partielle (ILIKE) - 80% confiance
        partial_match = self.db.query(Supplier).filter(
            and_(
                Supplier.tenant_id == self.tenant_id,
                or_(
                    Supplier.name.ilike(f"%{supplier_name_clean}%"),
                    Supplier.name.ilike(f"{supplier_name_clean}%"),
                )
            )
        ).first()
        
        if partial_match:
            # Calculer un score basé sur la similarité
            similarity = len(supplier_name_clean) / max(len(partial_match.name), len(supplier_name_clean))
            return partial_match, min(0.80, similarity)
        
        # 5. Recherche par mots individuels (60% confiance minimum)
        words = [w for w in supplier_name_clean.split() if len(w) > 3]
        if words:
            for word in words:
                word_match = self.db.query(Supplier).filter(
                    and_(
                        Supplier.tenant_id == self.tenant_id,
                        or_(
                            Supplier.name.ilike(f"%{word}%"),
                            Supplier.code.ilike(f"%{word}%")
                        )
                    )
                ).first()
                
                if word_match:
                    return word_match, 0.60
        
        # Aucun fournisseur trouvé
        return None, 0.0

    def get_supplier_suggestion(self, ocr_supplier_name: str) -> Dict[str, Any]:
        """
        Analyse le nom du fournisseur extrait par OCR et retourne une suggestion.
        
        Returns:
            Dict avec:
            - found: bool - fournisseur trouvé ou non
            - supplier: dict ou None - infos du fournisseur si trouvé
            - confidence: float - score de confiance
            - suggestion: dict - suggestion de création si non trouvé
        """
        supplier, confidence = self.find_supplier_by_name(ocr_supplier_name)
        
        if supplier and confidence >= 0.60:
            return {
                "found": True,
                "supplier": {
                    "id": str(supplier.id),
                    "name": supplier.name,
                    "code": supplier.code,
                    "auxiliary_account_code": supplier.auxiliary_account_code,
                    "default_charge_account": supplier.default_charge_account,
                    "default_vat_account": supplier.default_vat_account,
                    "default_tax_rate": float(supplier.default_tax_rate) if supplier.default_tax_rate else 18.0,
                    "has_active_rule": supplier.has_active_rule
                },
                "confidence": confidence,
                "suggestion": None
            }
        
        # Fournisseur non trouvé - préparer suggestion de création
        suggested_code = self._generate_supplier_code(ocr_supplier_name)
        
        return {
            "found": False,
            "supplier": None,
            "confidence": 0.0,
            "suggestion": {
                "type": "create_supplier",
                "message": f"Le fournisseur '{ocr_supplier_name}' n'existe pas encore. Créez-le pour automatiser les prochaines factures.",
                "suggested_name": ocr_supplier_name,
                "suggested_code": suggested_code,
                "suggested_auxiliary_account": f"401{suggested_code}",
                "suggested_ocr_keywords": self._extract_keywords(ocr_supplier_name),
                "default_charge_account": None,  # À définir par l'utilisateur
                "default_vat_account": "4454",
                "default_tax_rate": 18.0
            }
        }

    def _generate_supplier_code(self, name: str) -> str:
        """Génère un code fournisseur à partir du nom"""
        # Nettoyer et prendre les premières lettres significatives
        words = re.sub(r'[^a-zA-Z\s]', '', name).upper().split()
        
        if len(words) == 1:
            # Un seul mot : prendre les 4-6 premières lettres
            code = words[0][:6]
        elif len(words) == 2:
            # Deux mots : prendre 3 lettres de chaque
            code = words[0][:3] + words[1][:3]
        else:
            # Plus de 2 mots : prendre les initiales + premières lettres du premier mot
            code = ''.join(w[0] for w in words[:3]) + words[0][1:3]
        
        return code.upper()[:8]

    def _extract_keywords(self, name: str) -> List[str]:
        """Extrait des mots-clés pour la reconnaissance OCR future"""
        keywords = []
        
        # Nom complet
        keywords.append(name)
        
        # Mots significatifs (> 3 caractères)
        words = name.split()
        for word in words:
            clean_word = re.sub(r'[^a-zA-Z0-9]', '', word)
            if len(clean_word) > 3:
                keywords.append(clean_word)
        
        # Acronyme si plusieurs mots
        if len(words) > 1:
            acronym = ''.join(w[0].upper() for w in words if w)
            if len(acronym) >= 2:
                keywords.append(acronym)
        
        return list(set(keywords))

    def create_supplier_with_rule(
        self,
        name: str,
        code: Optional[str] = None,
        charge_account: Optional[str] = None,
        vat_account: str = "4454",
        tax_rate: float = 18.0,
        supplier_account: Optional[str] = None,
        ocr_keywords: Optional[List[str]] = None,
        rule_condition_type: str = "contains",  # equals, contains, starts_with, ends_with
        create_rule: bool = True
    ) -> Dict[str, Any]:
        """
        Crée un fournisseur avec optionnellement une règle d'imputation.
        
        Args:
            name: Nom du fournisseur
            code: Code court (généré si non fourni)
            charge_account: Compte de charge (ex: 6061)
            vat_account: Compte TVA (défaut: 4454)
            tax_rate: Taux TVA (défaut: 18%)
            supplier_account: Compte fournisseur auxiliaire (généré si non fourni)
            ocr_keywords: Mots-clés pour reconnaissance OCR
            rule_condition_type: Type de condition pour la règle
            create_rule: Créer une règle d'imputation automatique
            
        Returns:
            Dict avec le fournisseur créé et la règle si applicable
        """
        from uuid import uuid4
        
        # Générer le code si non fourni
        if not code:
            code = self._generate_supplier_code(name)
        
        # Générer le compte auxiliaire si non fourni
        if not supplier_account:
            supplier_account = f"401{code}"
        
        # Générer les keywords si non fournis
        if not ocr_keywords:
            ocr_keywords = self._extract_keywords(name)
        
        # Créer le fournisseur
        supplier = Supplier(
            id=uuid4(),
            tenant_id=self.tenant_id,
            name=name,
            code=code,
            auxiliary_account_code=supplier_account,
            collective_account_code="401",
            default_charge_account=charge_account,
            default_vat_account=vat_account,
            default_tax_rate=tax_rate,
            default_journal="ACH",
            ocr_keywords=ocr_keywords,
            has_active_rule=create_rule and charge_account is not None
        )
        
        self.db.add(supplier)
        self.db.flush()
        
        result = {
            "supplier": {
                "id": str(supplier.id),
                "name": supplier.name,
                "code": supplier.code,
                "auxiliary_account_code": supplier.auxiliary_account_code,
                "default_charge_account": supplier.default_charge_account,
                "default_vat_account": supplier.default_vat_account,
                "default_tax_rate": float(supplier.default_tax_rate) if supplier.default_tax_rate else 18.0,
                "ocr_keywords": supplier.ocr_keywords
            },
            "rule": None
        }
        
        # Créer la règle d'imputation si demandé et si compte de charge fourni
        if create_rule and charge_account:
            rule = self._create_supplier_rule(
                supplier=supplier,
                condition_type=rule_condition_type,
                charge_account=charge_account,
                vat_account=vat_account,
                supplier_account=supplier_account
            )
            
            supplier.default_rule_id = rule.id
            supplier.has_active_rule = True
            
            result["rule"] = {
                "id": str(rule.id),
                "name": rule.name,
                "condition_type": rule_condition_type,
                "charge_account": charge_account,
                "vat_account": vat_account,
                "supplier_account": supplier_account
            }
        
        self.db.commit()
        
        return result

    def _create_supplier_rule(
        self,
        supplier: Supplier,
        condition_type: str,
        charge_account: str,
        vat_account: str,
        supplier_account: str
    ) -> AccountingRule:
        """Crée une règle d'imputation pour un fournisseur"""
        from uuid import uuid4
        
        # Mapper le type de condition
        operator_map = {
            "equals": RuleOperator.EQUALS,
            "contains": RuleOperator.CONTAINS,
            "starts_with": RuleOperator.STARTS_WITH,
            "ends_with": RuleOperator.ENDS_WITH,
            "regex": RuleOperator.MATCHES_REGEX
        }
        
        operator = operator_map.get(condition_type, RuleOperator.CONTAINS)
        
        # Valeur de condition : utiliser les keywords ou le nom
        condition_value = supplier.name.lower()
        if supplier.ocr_keywords and len(supplier.ocr_keywords) > 0:
            # Utiliser le premier keyword significatif
            condition_value = supplier.ocr_keywords[0].lower()
        
        # Créer la règle
        rule = AccountingRule(
            id=uuid4(),
            tenant_id=self.tenant_id,
            name=f"Règle auto - {supplier.name}",
            description=f"Règle d'imputation automatique pour {supplier.name}",
            priority=50,  # Priorité moyenne
            is_active=True,
            auto_apply=True,
            confidence_threshold=0.7,
            conditions=[
                {
                    "type": RuleConditionType.SUPPLIER_NAME.value,
                    "operator": operator.value,
                    "value": condition_value
                }
            ],
            actions=[
                {
                    "type": "assign_account",
                    "debit_account": charge_account,
                    "credit_account": supplier_account,
                    "vat_account": vat_account
                },
                {
                    "type": "set_vat_rate",
                    "vat_rate": float(supplier.default_tax_rate) if supplier.default_tax_rate else 18.0,
                    "vat_account": vat_account
                }
            ]
        )
        
        self.db.add(rule)
        self.db.flush()
        
        return rule

    def get_rule_condition_types(self) -> List[Dict[str, str]]:
        """Retourne les types de conditions disponibles pour les règles"""
        return [
            {"value": "equals", "label": "Est égal à", "description": "Le nom du fournisseur doit correspondre exactement"},
            {"value": "contains", "label": "Contient", "description": "Le nom du fournisseur doit contenir ce texte"},
            {"value": "starts_with", "label": "Commence par", "description": "Le nom du fournisseur doit commencer par ce texte"},
            {"value": "ends_with", "label": "Finit par", "description": "Le nom du fournisseur doit finir par ce texte"},
            {"value": "regex", "label": "Expression régulière", "description": "Le nom doit correspondre à l'expression régulière"}
        ]
