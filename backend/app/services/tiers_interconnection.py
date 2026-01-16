"""
Service d'interconnexion Tiers - Plan Comptable - Règles
=========================================================

Ce service implémente la logique d'interconnexion SEKA Business:

1. PLAN COMPTABLE
   - Comptes généraux (SYSCOHADA standard): 401, 411, 6061, etc.
   - Comptes auxiliaires (spécifiques): 401SBEE, 401MTN, 411CLI01
   - Comptes collectifs (agrégateurs): 401 Fournisseurs, 411 Clients

2. TIERS (Fournisseurs/Clients)
   - Chaque tiers est lié à un compte auxiliaire
   - Le compte auxiliaire est créé automatiquement
   - Une règle d'imputation peut être associée

3. RÈGLES D'IMPUTATION
   - Définissent comment comptabiliser automatiquement les factures
   - Lient: Tiers + Compte charge + Compte TVA + Journal

4. FLUX AUTOMATIQUE
   - Upload facture → OCR → Reconnaissance fournisseur → Règle → Écritures
"""

from typing import Optional, Dict, Any, List, Tuple
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import and_
from decimal import Decimal

from app.models.supplier import Supplier
from app.models.accounting_advanced import ChartOfAccounts
from app.models.accounting_rules import AccountingRule
from app.models.document import Document, DocumentStatus


class TiersInterconnectionService:
    """
    Service central pour gérer l'interconnexion entre:
    - Plan Comptable (ChartOfAccounts)
    - Tiers (Supplier/Client)
    - Règles d'imputation (AccountingRule)
    - Documents/Factures (Document)
    """
    
    def __init__(self, db: Session, tenant_id: str):
        self.db = db
        self.tenant_id = tenant_id
    
    # =========================================================================
    # GESTION DES COMPTES AUXILIAIRES
    # =========================================================================
    
    def create_auxiliary_account(
        self,
        supplier: Supplier,
        collective_account_code: str = "401"
    ) -> ChartOfAccounts:
        """
        Crée automatiquement un compte auxiliaire pour un fournisseur.
        
        Exemple: Pour le fournisseur SBEE, crée le compte 401SBEE
        
        Args:
            supplier: Le fournisseur pour lequel créer le compte
            collective_account_code: Le compte collectif parent (défaut: 401)
            
        Returns:
            Le compte auxiliaire créé
        """
        # Générer le code du compte auxiliaire
        auxiliary_code = supplier.generate_auxiliary_code()
        
        # Vérifier si le compte existe déjà
        existing = self.db.query(ChartOfAccounts).filter(
            and_(
                ChartOfAccounts.tenant_id == self.tenant_id,
                ChartOfAccounts.account_number == auxiliary_code
            )
        ).first()
        
        if existing:
            return existing
        
        # Trouver le compte collectif parent
        parent_account = self.db.query(ChartOfAccounts).filter(
            and_(
                ChartOfAccounts.tenant_id == self.tenant_id,
                ChartOfAccounts.account_number == collective_account_code
            )
        ).first()
        
        # Créer le compte auxiliaire
        auxiliary_account = ChartOfAccounts(
            tenant_id=self.tenant_id,
            account_number=auxiliary_code,
            name=f"Fournisseur {supplier.name}",
            description=f"Compte auxiliaire pour {supplier.name}",
            account_class="4",  # Classe 4 - Tiers
            account_type="liability",  # Passif (fournisseur = dette)
            parent_id=parent_account.id if parent_account else None,
            level=3,  # Niveau détail
            is_group=False,
            is_detail=True,
            is_auxiliary=True,
            is_collective=False,
            linked_supplier_id=supplier.id,
            collective_parent_code=collective_account_code,
            is_active=True,
            is_reconcilable=True,  # Lettrable
        )
        
        self.db.add(auxiliary_account)
        self.db.flush()
        
        # Mettre à jour le fournisseur avec la référence au compte
        supplier.auxiliary_account_id = auxiliary_account.id
        supplier.auxiliary_account_code = auxiliary_code
        
        return auxiliary_account
    
    def get_or_create_auxiliary_account(
        self,
        supplier: Supplier
    ) -> ChartOfAccounts:
        """
        Récupère ou crée le compte auxiliaire d'un fournisseur.
        """
        if supplier.auxiliary_account_id:
            account = self.db.query(ChartOfAccounts).filter(
                ChartOfAccounts.id == supplier.auxiliary_account_id
            ).first()
            if account:
                return account
        
        return self.create_auxiliary_account(supplier)
    
    # =========================================================================
    # GESTION DES RÈGLES D'IMPUTATION
    # =========================================================================
    
    def create_supplier_rule(
        self,
        supplier: Supplier,
        charge_account: str,
        vat_account: str = "4454",
        vat_rate: float = 18.0,
        journal_code: str = "ACH",
        ocr_keywords: List[str] = None
    ) -> AccountingRule:
        """
        Crée une règle d'imputation pour un fournisseur.
        
        La règle définit:
        - Le compte de charge (débit): ex. 6061 pour électricité
        - Le compte TVA (débit): ex. 4454 TVA déductible
        - Le compte fournisseur (crédit): ex. 401SBEE
        
        Args:
            supplier: Le fournisseur
            charge_account: Le compte de charge (6061, 6261, etc.)
            vat_account: Le compte TVA (défaut: 4454)
            vat_rate: Le taux de TVA (défaut: 18%)
            journal_code: Le code journal (défaut: ACH)
            ocr_keywords: Mots-clés pour reconnaissance OCR
            
        Returns:
            La règle créée
        """
        # S'assurer que le compte auxiliaire existe
        auxiliary_account = self.get_or_create_auxiliary_account(supplier)
        
        # Construire les conditions
        keywords = ocr_keywords or [supplier.name]
        if supplier.code:
            keywords.append(supplier.code)
        
        conditions = [
            {
                "type": "supplier_name",
                "operator": "contains",
                "value": supplier.name
            }
        ]
        
        # Ajouter les mots-clés OCR comme conditions alternatives
        if len(keywords) > 1:
            for keyword in keywords[1:]:
                conditions.append({
                    "type": "description_contains",
                    "operator": "contains",
                    "value": keyword
                })
        
        # Construire les actions
        actions = [
            {
                "type": "assign_account",
                "debit_account": charge_account,
                "credit_account": auxiliary_account.account_number,
                "vat_account": vat_account
            },
            {
                "type": "set_vat_rate",
                "vat_rate": vat_rate
            },
            {
                "type": "suggest_label",
                "label_template": f"Facture {{supplier_name}} - {{reference_number}}"
            }
        ]
        
        # Créer la règle
        rule = AccountingRule(
            tenant_id=self.tenant_id,
            name=f"Règle {supplier.name}",
            description=f"Auto-imputation pour les factures de {supplier.name}",
            priority=10,
            conditions=conditions,
            actions=actions,
            auto_apply=True,
            confidence_threshold=0.7,
            is_active=True
        )
        
        self.db.add(rule)
        self.db.flush()
        
        # Mettre à jour le fournisseur
        supplier.default_rule_id = rule.id
        supplier.has_active_rule = True
        supplier.default_charge_account = charge_account
        supplier.default_vat_account = vat_account
        supplier.default_tax_rate = Decimal(str(vat_rate))
        supplier.default_journal = journal_code
        supplier.ocr_keywords = keywords
        
        return rule
    
    def update_supplier_rule(
        self,
        supplier: Supplier,
        charge_account: str = None,
        vat_account: str = None,
        vat_rate: float = None,
        journal_code: str = None,
        ocr_keywords: List[str] = None
    ) -> Optional[AccountingRule]:
        """
        Met à jour la règle d'imputation d'un fournisseur.
        """
        if not supplier.default_rule_id:
            # Pas de règle existante, en créer une nouvelle
            return self.create_supplier_rule(
                supplier=supplier,
                charge_account=charge_account or supplier.default_charge_account or "601",
                vat_account=vat_account or supplier.default_vat_account or "4454",
                vat_rate=vat_rate or float(supplier.default_tax_rate or 18),
                journal_code=journal_code or supplier.default_journal or "ACH",
                ocr_keywords=ocr_keywords
            )
        
        rule = self.db.query(AccountingRule).filter(
            AccountingRule.id == supplier.default_rule_id
        ).first()
        
        if not rule:
            return None
        
        # Mettre à jour les actions
        if charge_account or vat_account:
            auxiliary_code = supplier.auxiliary_account_code or supplier.generate_auxiliary_code()
            for action in rule.actions:
                if action.get("type") == "assign_account":
                    if charge_account:
                        action["debit_account"] = charge_account
                    if vat_account:
                        action["vat_account"] = vat_account
                    action["credit_account"] = auxiliary_code
                elif action.get("type") == "set_vat_rate" and vat_rate:
                    action["vat_rate"] = vat_rate
        
        # Mettre à jour les mots-clés OCR
        if ocr_keywords:
            supplier.ocr_keywords = ocr_keywords
            # Mettre à jour les conditions
            rule.conditions = [
                {
                    "type": "supplier_name",
                    "operator": "contains",
                    "value": supplier.name
                }
            ]
            for keyword in ocr_keywords:
                if keyword != supplier.name:
                    rule.conditions.append({
                        "type": "description_contains",
                        "operator": "contains",
                        "value": keyword
                    })
        
        # Mettre à jour le fournisseur
        if charge_account:
            supplier.default_charge_account = charge_account
        if vat_account:
            supplier.default_vat_account = vat_account
        if vat_rate:
            supplier.default_tax_rate = Decimal(str(vat_rate))
        if journal_code:
            supplier.default_journal = journal_code
        
        return rule
    
    # =========================================================================
    # RECONNAISSANCE DE FOURNISSEUR (OCR)
    # =========================================================================
    
    def find_supplier_by_ocr_text(
        self,
        ocr_text: str,
        supplier_name_hint: str = None
    ) -> Tuple[Optional[Supplier], float]:
        """
        Trouve un fournisseur à partir du texte OCR.
        
        Args:
            ocr_text: Texte extrait par OCR
            supplier_name_hint: Nom du fournisseur suggéré par l'OCR
            
        Returns:
            Tuple (Supplier, confidence_score) ou (None, 0)
        """
        ocr_text_lower = ocr_text.lower()
        supplier_name_lower = (supplier_name_hint or "").lower()
        
        # Récupérer tous les fournisseurs avec leurs mots-clés
        suppliers = self.db.query(Supplier).filter(
            Supplier.tenant_id == self.tenant_id
        ).all()
        
        best_match = None
        best_score = 0.0
        
        for supplier in suppliers:
            score = 0.0
            
            # Vérifier le nom du fournisseur
            if supplier.name.lower() in ocr_text_lower:
                score = 0.8
            elif supplier_name_lower and supplier.name.lower() in supplier_name_lower:
                score = 0.9
            
            # Vérifier le code fournisseur
            if supplier.code and supplier.code.lower() in ocr_text_lower:
                score = max(score, 0.85)
            
            # Vérifier les mots-clés OCR
            if supplier.ocr_keywords:
                for keyword in supplier.ocr_keywords:
                    if keyword.lower() in ocr_text_lower:
                        score = max(score, 0.75)
                        break
            
            if score > best_score:
                best_score = score
                best_match = supplier
        
        return best_match, best_score
    
    # =========================================================================
    # GÉNÉRATION D'ÉCRITURES COMPTABLES
    # =========================================================================
    
    def generate_entries_from_invoice(
        self,
        document: Document,
        ocr_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Génère les écritures comptables à partir d'une facture.
        
        Flux:
        1. Identifier le fournisseur (OCR ou association manuelle)
        2. Trouver la règle d'imputation
        3. Générer les lignes d'écriture
        
        Args:
            document: Le document (facture)
            ocr_data: Données extraites par OCR
            
        Returns:
            Dict avec les écritures proposées et métadonnées
        """
        result = {
            "supplier_found": False,
            "supplier": None,
            "rule_found": False,
            "rule": None,
            "entries": [],
            "status": "manual_required",
            "confidence": 0.0
        }
        
        # 1. Trouver le fournisseur
        supplier_name = ocr_data.get("supplier_name", "")
        raw_text = ocr_data.get("raw_text", "")
        
        supplier, confidence = self.find_supplier_by_ocr_text(
            raw_text,
            supplier_name
        )
        
        if supplier:
            result["supplier_found"] = True
            result["supplier"] = {
                "id": str(supplier.id),
                "name": supplier.name,
                "code": supplier.code,
                "auxiliary_account": supplier.auxiliary_account_code
            }
            result["confidence"] = confidence
            
            # 2. Trouver la règle d'imputation
            if supplier.has_active_rule and supplier.default_rule_id:
                rule = self.db.query(AccountingRule).filter(
                    AccountingRule.id == supplier.default_rule_id
                ).first()
                
                if rule and rule.is_active:
                    result["rule_found"] = True
                    result["rule"] = {
                        "id": str(rule.id),
                        "name": rule.name
                    }
                    
                    # 3. Générer les écritures
                    entries = self._generate_entry_lines(
                        supplier=supplier,
                        rule=rule,
                        ocr_data=ocr_data
                    )
                    
                    result["entries"] = entries
                    result["status"] = "pre_processed" if confidence >= 0.7 else "needs_validation"
        
        return result
    
    def _generate_entry_lines(
        self,
        supplier: Supplier,
        rule: AccountingRule,
        ocr_data: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Génère les lignes d'écriture à partir d'une règle.
        
        Structure standard:
        - Ligne 1: Débit compte de charge (HT)
        - Ligne 2: Débit compte TVA (TVA)
        - Ligne 3: Crédit compte fournisseur (TTC)
        """
        amount_ht = float(ocr_data.get("amount_ht", 0) or 0)
        amount_vat = float(ocr_data.get("amount_vat", 0) or 0)
        amount_ttc = float(ocr_data.get("amount_ttc", 0) or 0)
        
        # Si on n'a que le TTC, calculer HT et TVA
        if amount_ttc > 0 and amount_ht == 0:
            vat_rate = float(supplier.default_tax_rate or 18)
            amount_ht = amount_ttc / (1 + vat_rate / 100)
            amount_vat = amount_ttc - amount_ht
        
        # Récupérer les comptes depuis la règle
        charge_account = None
        vat_account = None
        supplier_account = supplier.auxiliary_account_code
        
        for action in rule.actions:
            if action.get("type") == "assign_account":
                charge_account = action.get("debit_account")
                vat_account = action.get("vat_account", "4454")
                if not supplier_account:
                    supplier_account = action.get("credit_account")
        
        # Construire le libellé
        label = f"Facture {supplier.name}"
        if ocr_data.get("reference_number"):
            label += f" - {ocr_data['reference_number']}"
        
        entries = []
        
        # Ligne débit charge
        if charge_account and amount_ht > 0:
            entries.append({
                "journal": supplier.default_journal or "ACH",
                "date": ocr_data.get("date"),
                "account_code": charge_account,
                "label": label,
                "debit": round(amount_ht, 2),
                "credit": 0,
                "reference": ocr_data.get("reference_number")
            })
        
        # Ligne débit TVA
        if vat_account and amount_vat > 0:
            entries.append({
                "journal": supplier.default_journal or "ACH",
                "date": ocr_data.get("date"),
                "account_code": vat_account,
                "label": f"TVA déductible - {supplier.name}",
                "debit": round(amount_vat, 2),
                "credit": 0,
                "reference": ocr_data.get("reference_number")
            })
        
        # Ligne crédit fournisseur
        if supplier_account and amount_ttc > 0:
            entries.append({
                "journal": supplier.default_journal or "ACH",
                "date": ocr_data.get("date"),
                "account_code": supplier_account,
                "label": f"Fournisseur {supplier.name}",
                "debit": 0,
                "credit": round(amount_ttc, 2),
                "reference": ocr_data.get("reference_number")
            })
        
        return entries
    
    # =========================================================================
    # CRÉATION COMPLÈTE DE FOURNISSEUR AVEC INTERCONNEXION
    # =========================================================================
    
    def create_supplier_with_interconnection(
        self,
        name: str,
        code: str = None,
        nif: str = None,
        rccm: str = None,
        contact_name: str = None,
        email: str = None,
        phone: str = None,
        address: str = None,
        create_auxiliary_account: bool = True,
        create_rule: bool = False,
        charge_account: str = None,
        vat_account: str = "4454",
        vat_rate: float = 18.0,
        journal_code: str = "ACH",
        ocr_keywords: List[str] = None,
        client_id: UUID = None
    ) -> Dict[str, Any]:
        """
        Crée un fournisseur avec toute l'interconnexion.
        
        Ce qui se passe:
        1. Création du fournisseur dans la table Supplier
        2. (Optionnel) Création du compte auxiliaire 401XXX
        3. (Optionnel) Création de la règle d'imputation
        
        Args:
            name: Nom du fournisseur
            code: Code court (ex: SBEE)
            create_auxiliary_account: Créer le compte auxiliaire
            create_rule: Créer une règle d'imputation
            charge_account: Compte de charge si règle
            
        Returns:
            Dict avec fournisseur, compte auxiliaire et règle
        """
        # Générer le code si non fourni
        if not code:
            code = name[:6].upper().replace(" ", "")
        
        # 1. Créer le fournisseur
        supplier = Supplier(
            tenant_id=self.tenant_id,
            client_id=client_id,
            code=code,
            name=name,
            nif=nif,
            rccm=rccm,
            contact_name=contact_name,
            email=email,
            phone=phone,
            address=address,
            collective_account_code="401",
            default_vat_account=vat_account,
            default_tax_rate=Decimal(str(vat_rate)),
            default_journal=journal_code,
            ocr_keywords=ocr_keywords or [name, code]
        )
        
        self.db.add(supplier)
        self.db.flush()
        
        result = {
            "supplier": supplier,
            "auxiliary_account": None,
            "rule": None
        }
        
        # 2. Créer le compte auxiliaire
        if create_auxiliary_account:
            auxiliary_account = self.create_auxiliary_account(supplier)
            result["auxiliary_account"] = auxiliary_account
        
        # 3. Créer la règle d'imputation
        if create_rule and charge_account:
            rule = self.create_supplier_rule(
                supplier=supplier,
                charge_account=charge_account,
                vat_account=vat_account,
                vat_rate=vat_rate,
                journal_code=journal_code,
                ocr_keywords=ocr_keywords
            )
            result["rule"] = rule
        
        return result


# Fonction utilitaire pour obtenir une instance du service
def get_interconnection_service(db: Session, tenant_id: str) -> TiersInterconnectionService:
    """Factory function pour créer une instance du service."""
    return TiersInterconnectionService(db, tenant_id)
