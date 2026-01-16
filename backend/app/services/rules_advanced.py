"""
Service avancé pour les règles d'imputation
============================================

Fonctionnalités:
1. Import/Export de règles (CSV/JSON)
2. Apprentissage automatique des corrections
3. Alertes pour règles manquantes
4. Règles conditionnelles avancées
6. Templates de règles prédéfinis SYSCOHADA
"""

import csv
import json
import io
from typing import List, Dict, Any, Optional, Tuple
from uuid import UUID, uuid4
from datetime import datetime, timedelta
from decimal import Decimal
from enum import Enum

from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func

from app.models.supplier import Supplier
from app.models.accounting_rules import AccountingRule
from app.models.accounting_advanced import ChartOfAccounts


# =============================================================================
# ENUMS ET CONSTANTES
# =============================================================================

class RuleConditionType(str, Enum):
    """Types de conditions pour les règles avancées"""
    SUPPLIER_NAME = "supplier_name"
    SUPPLIER_CODE = "supplier_code"
    AMOUNT_GREATER = "amount_greater"
    AMOUNT_LESS = "amount_less"
    AMOUNT_BETWEEN = "amount_between"
    DATE_RANGE = "date_range"
    DESCRIPTION_CONTAINS = "description_contains"
    INVOICE_TYPE = "invoice_type"
    PERIOD_MONTHLY = "period_monthly"
    PERIOD_QUARTERLY = "period_quarterly"


class AlertType(str, Enum):
    """Types d'alertes"""
    SUPPLIER_NO_RULE = "supplier_no_rule"
    INVOICE_NO_MATCH = "invoice_no_match"
    LOW_CONFIDENCE = "low_confidence"
    RULE_UNUSED = "rule_unused"


# Templates SYSCOHADA par secteur
SYSCOHADA_TEMPLATES = {
    "energie": {
        "name": "Énergie (Électricité, Eau, Gaz)",
        "suppliers": [
            {"name": "SBEE", "code": "SBEE", "charge_account": "6061", "keywords": ["SBEE", "Société Béninoise d'Énergie"]},
            {"name": "SONEB", "code": "SONEB", "charge_account": "6062", "keywords": ["SONEB", "Société Nationale des Eaux"]},
            {"name": "Gaz du Bénin", "code": "GAZBJ", "charge_account": "6063", "keywords": ["Gaz", "Butane"]},
        ]
    },
    "telecom": {
        "name": "Télécommunications",
        "suppliers": [
            {"name": "MTN Bénin", "code": "MTN", "charge_account": "6261", "keywords": ["MTN", "Mobile Telephone Network"]},
            {"name": "Moov Africa", "code": "MOOV", "charge_account": "6261", "keywords": ["Moov", "Moov Africa", "Atlantique Telecom"]},
            {"name": "Glo Mobile", "code": "GLO", "charge_account": "6261", "keywords": ["Glo", "Globacom"]},
        ]
    },
    "carburant": {
        "name": "Carburants et Lubrifiants",
        "suppliers": [
            {"name": "Oryx Energies", "code": "ORYX", "charge_account": "6063", "keywords": ["Oryx", "Oryx Energies"]},
            {"name": "Total Energies", "code": "TOTAL", "charge_account": "6063", "keywords": ["Total", "TotalEnergies"]},
            {"name": "Pétro Ivoire", "code": "PETROIV", "charge_account": "6063", "keywords": ["Pétro Ivoire", "Petroivoire"]},
        ]
    },
    "banque": {
        "name": "Services Bancaires",
        "suppliers": [
            {"name": "BOA Bénin", "code": "BOA", "charge_account": "627", "keywords": ["BOA", "Bank of Africa"]},
            {"name": "Ecobank", "code": "ECOBANK", "charge_account": "627", "keywords": ["Ecobank", "ETI"]},
            {"name": "SGBBE", "code": "SGBBE", "charge_account": "627", "keywords": ["Société Générale", "SGBBE"]},
            {"name": "UBA", "code": "UBA", "charge_account": "627", "keywords": ["UBA", "United Bank for Africa"]},
        ]
    },
    "fournitures": {
        "name": "Fournitures de Bureau",
        "suppliers": [
            {"name": "Librairie Notre Dame", "code": "LND", "charge_account": "6064", "keywords": ["Librairie", "Notre Dame"]},
            {"name": "Papeterie Centrale", "code": "PAPCENTR", "charge_account": "6064", "keywords": ["Papeterie", "Centrale"]},
        ]
    },
    "immobilier": {
        "name": "Locations Immobilières",
        "suppliers": [
            {"name": "Propriétaire Local", "code": "LOYER", "charge_account": "6132", "keywords": ["Loyer", "Location"]},
        ]
    },
    "transport": {
        "name": "Transport et Déplacements",
        "suppliers": [
            {"name": "Transport Personnel", "code": "TRANSP", "charge_account": "6241", "keywords": ["Transport", "Déplacement"]},
        ]
    },
    "honoraires": {
        "name": "Honoraires et Prestations",
        "suppliers": [
            {"name": "Cabinet Comptable", "code": "COMPTA", "charge_account": "6226", "keywords": ["Comptable", "Expert-comptable"]},
            {"name": "Avocat Conseil", "code": "AVOCAT", "charge_account": "6226", "keywords": ["Avocat", "Cabinet juridique"]},
            {"name": "Notaire", "code": "NOTAIRE", "charge_account": "6226", "keywords": ["Notaire", "Étude notariale"]},
        ]
    },
    "assurance": {
        "name": "Assurances",
        "suppliers": [
            {"name": "Assurance Auto", "code": "ASSAUTO", "charge_account": "6162", "keywords": ["Assurance auto", "RC Auto"]},
            {"name": "Assurance Multirisque", "code": "ASSMULTI", "charge_account": "6161", "keywords": ["Multirisque", "Assurance locaux"]},
        ]
    },
    "entretien": {
        "name": "Entretien et Réparations",
        "suppliers": [
            {"name": "Maintenance Informatique", "code": "MAINTINFO", "charge_account": "6156", "keywords": ["Maintenance", "Informatique"]},
            {"name": "Entretien Locaux", "code": "ENTRLOC", "charge_account": "6152", "keywords": ["Entretien", "Nettoyage"]},
        ]
    }
}


# =============================================================================
# MODÈLE POUR L'APPRENTISSAGE
# =============================================================================

class LearningEntry:
    """Entrée d'apprentissage pour mémoriser les corrections"""
    def __init__(
        self,
        supplier_name: str,
        original_suggestion: str,
        corrected_account: str,
        corrected_by: str,
        timestamp: datetime = None
    ):
        self.id = str(uuid4())
        self.supplier_name = supplier_name
        self.original_suggestion = original_suggestion
        self.corrected_account = corrected_account
        self.corrected_by = corrected_by
        self.timestamp = timestamp or datetime.utcnow()
        self.applied_count = 0


# =============================================================================
# SERVICE PRINCIPAL
# =============================================================================

class RulesAdvancedService:
    """
    Service avancé pour la gestion des règles d'imputation
    """
    
    def __init__(self, db: Session, tenant_id: str):
        self.db = db
        self.tenant_id = tenant_id
        
    # =========================================================================
    # 1. IMPORT/EXPORT DE RÈGLES
    # =========================================================================
    
    def export_rules_to_json(self) -> str:
        """
        Exporte toutes les règles en format JSON.
        
        Returns:
            JSON string avec toutes les règles
        """
        suppliers = self.db.query(Supplier).filter(
            and_(
                Supplier.tenant_id == self.tenant_id,
                Supplier.has_active_rule == True
            )
        ).all()
        
        rules_data = []
        for s in suppliers:
            rules_data.append({
                "supplier_name": s.name,
                "supplier_code": s.code,
                "charge_account": s.default_charge_account,
                "vat_account": s.default_vat_account,
                "supplier_account": s.auxiliary_account_code,
                "vat_rate": float(s.default_tax_rate) if s.default_tax_rate else 18.0,
                "journal_code": s.default_journal,
                "ocr_keywords": s.ocr_keywords or [],
                "is_active": s.has_active_rule
            })
        
        export_data = {
            "export_date": datetime.utcnow().isoformat(),
            "version": "1.0",
            "rules_count": len(rules_data),
            "rules": rules_data
        }
        
        return json.dumps(export_data, indent=2, ensure_ascii=False)
    
    def export_rules_to_csv(self) -> str:
        """
        Exporte toutes les règles en format CSV.
        
        Returns:
            CSV string avec toutes les règles
        """
        suppliers = self.db.query(Supplier).filter(
            and_(
                Supplier.tenant_id == self.tenant_id,
                Supplier.has_active_rule == True
            )
        ).all()
        
        output = io.StringIO()
        writer = csv.writer(output, delimiter=';')
        
        # Header
        writer.writerow([
            "supplier_name", "supplier_code", "charge_account", 
            "vat_account", "supplier_account", "vat_rate", 
            "journal_code", "ocr_keywords"
        ])
        
        # Data
        for s in suppliers:
            writer.writerow([
                s.name,
                s.code or "",
                s.default_charge_account or "",
                s.default_vat_account or "4454",
                s.auxiliary_account_code or "",
                float(s.default_tax_rate) if s.default_tax_rate else 18.0,
                s.default_journal or "ACH",
                ",".join(s.ocr_keywords) if s.ocr_keywords else ""
            ])
        
        return output.getvalue()
    
    def import_rules_from_json(
        self, 
        json_data: str,
        overwrite: bool = False,
        client_id: UUID = None
    ) -> Dict[str, Any]:
        """
        Importe des règles depuis un fichier JSON.
        
        Args:
            json_data: JSON string avec les règles
            overwrite: Si True, écrase les règles existantes
            client_id: ID du client pour les nouveaux fournisseurs
            
        Returns:
            Dict avec le résultat de l'import
        """
        from app.services.tiers_interconnection import get_interconnection_service
        
        try:
            data = json.loads(json_data)
        except json.JSONDecodeError as e:
            return {"success": False, "error": f"JSON invalide: {e}"}
        
        rules = data.get("rules", [])
        results = {
            "success": True,
            "imported": 0,
            "updated": 0,
            "skipped": 0,
            "errors": []
        }
        
        service = get_interconnection_service(self.db, self.tenant_id)
        
        for rule in rules:
            try:
                supplier_name = rule.get("supplier_name")
                if not supplier_name:
                    results["errors"].append("Règle sans nom de fournisseur")
                    results["skipped"] += 1
                    continue
                
                # Chercher si le fournisseur existe
                existing = self.db.query(Supplier).filter(
                    and_(
                        Supplier.tenant_id == self.tenant_id,
                        Supplier.name == supplier_name
                    )
                ).first()
                
                if existing:
                    if overwrite:
                        # Mettre à jour
                        existing.code = rule.get("supplier_code") or existing.code
                        existing.default_charge_account = rule.get("charge_account")
                        existing.default_vat_account = rule.get("vat_account", "4454")
                        existing.default_tax_rate = Decimal(str(rule.get("vat_rate", 18)))
                        existing.default_journal = rule.get("journal_code", "ACH")
                        existing.ocr_keywords = rule.get("ocr_keywords", [])
                        existing.has_active_rule = True
                        results["updated"] += 1
                    else:
                        results["skipped"] += 1
                else:
                    # Créer nouveau fournisseur avec règle
                    service.create_supplier_with_interconnection(
                        name=supplier_name,
                        code=rule.get("supplier_code"),
                        create_auxiliary_account=True,
                        create_rule=True,
                        charge_account=rule.get("charge_account"),
                        vat_account=rule.get("vat_account", "4454"),
                        vat_rate=rule.get("vat_rate", 18.0),
                        journal_code=rule.get("journal_code", "ACH"),
                        ocr_keywords=rule.get("ocr_keywords", [supplier_name]),
                        client_id=client_id
                    )
                    results["imported"] += 1
                    
            except Exception as e:
                results["errors"].append(f"{supplier_name}: {str(e)}")
        
        self.db.commit()
        return results
    
    def import_rules_from_csv(
        self, 
        csv_data: str,
        overwrite: bool = False,
        client_id: UUID = None
    ) -> Dict[str, Any]:
        """
        Importe des règles depuis un fichier CSV.
        """
        # Convertir CSV en JSON et utiliser l'import JSON
        reader = csv.DictReader(io.StringIO(csv_data), delimiter=';')
        
        rules = []
        for row in reader:
            rules.append({
                "supplier_name": row.get("supplier_name"),
                "supplier_code": row.get("supplier_code"),
                "charge_account": row.get("charge_account"),
                "vat_account": row.get("vat_account", "4454"),
                "supplier_account": row.get("supplier_account"),
                "vat_rate": float(row.get("vat_rate", 18)),
                "journal_code": row.get("journal_code", "ACH"),
                "ocr_keywords": row.get("ocr_keywords", "").split(",") if row.get("ocr_keywords") else []
            })
        
        json_data = json.dumps({"rules": rules})
        return self.import_rules_from_json(json_data, overwrite, client_id)

    # =========================================================================
    # 2. APPRENTISSAGE AUTOMATIQUE DES CORRECTIONS
    # =========================================================================
    
    def record_correction(
        self,
        supplier_name: str,
        original_account: str,
        corrected_account: str,
        user_id: str,
        invoice_id: str = None
    ) -> Dict[str, Any]:
        """
        Enregistre une correction manuelle pour apprentissage.
        
        Quand un utilisateur corrige une suggestion:
        1. On enregistre la correction
        2. On met à jour les statistiques
        3. Si assez de corrections similaires, on suggère de créer/modifier une règle
        
        Args:
            supplier_name: Nom du fournisseur
            original_account: Compte suggéré initialement
            corrected_account: Compte choisi par l'utilisateur
            user_id: ID de l'utilisateur
            invoice_id: ID de la facture concernée
            
        Returns:
            Dict avec les recommandations
        """
        # Chercher ou créer l'entrée d'apprentissage dans les métadonnées du fournisseur
        supplier = self.db.query(Supplier).filter(
            and_(
                Supplier.tenant_id == self.tenant_id,
                Supplier.name.ilike(f"%{supplier_name}%")
            )
        ).first()
        
        result = {
            "recorded": True,
            "supplier_found": supplier is not None,
            "recommendation": None,
            "confidence_improvement": 0.0
        }
        
        if not supplier:
            # Fournisseur inconnu - suggérer de le créer
            result["recommendation"] = {
                "type": "create_supplier",
                "message": f"Le fournisseur '{supplier_name}' n'existe pas. Voulez-vous le créer avec le compte {corrected_account}?",
                "suggested_charge_account": corrected_account
            }
            return result
        
        # Compter les corrections similaires (stockées en JSON dans une table ou cache)
        # Pour simplifier, on utilise les métadonnées du fournisseur
        corrections_key = f"corrections_{corrected_account}"
        
        # Mettre à jour le compteur de corrections
        if not hasattr(supplier, 'metadata') or supplier.metadata is None:
            supplier.metadata = {}
        
        # Simuler le stockage des corrections
        corrections = supplier.metadata.get("learning_corrections", [])
        corrections.append({
            "original": original_account,
            "corrected": corrected_account,
            "user_id": user_id,
            "timestamp": datetime.utcnow().isoformat(),
            "invoice_id": invoice_id
        })
        
        # Garder les 50 dernières corrections
        corrections = corrections[-50:]
        supplier.metadata["learning_corrections"] = corrections
        
        # Analyser les corrections pour faire des recommandations
        correction_counts = {}
        for c in corrections:
            key = c["corrected"]
            correction_counts[key] = correction_counts.get(key, 0) + 1
        
        # Si plus de 3 corrections vers le même compte, suggérer une mise à jour
        most_common = max(correction_counts.items(), key=lambda x: x[1]) if correction_counts else (None, 0)
        
        if most_common[1] >= 3:
            if supplier.default_charge_account != most_common[0]:
                result["recommendation"] = {
                    "type": "update_rule",
                    "message": f"Vous avez corrigé {most_common[1]} fois vers le compte {most_common[0]}. Voulez-vous mettre à jour la règle?",
                    "suggested_charge_account": most_common[0],
                    "current_charge_account": supplier.default_charge_account,
                    "correction_count": most_common[1]
                }
                result["confidence_improvement"] = min(0.15, most_common[1] * 0.03)
        
        return result
    
    def apply_learning(self, supplier_id: str, new_charge_account: str) -> Dict[str, Any]:
        """
        Applique l'apprentissage en mettant à jour la règle du fournisseur.
        
        Args:
            supplier_id: ID du fournisseur
            new_charge_account: Nouveau compte de charge à appliquer
            
        Returns:
            Dict avec le résultat
        """
        supplier = self.db.query(Supplier).filter(
            and_(
                Supplier.id == supplier_id,
                Supplier.tenant_id == self.tenant_id
            )
        ).first()
        
        if not supplier:
            return {"success": False, "error": "Fournisseur non trouvé"}
        
        old_account = supplier.default_charge_account
        supplier.default_charge_account = new_charge_account
        supplier.has_active_rule = True
        
        # Réinitialiser les corrections après application
        if hasattr(supplier, 'metadata') and supplier.metadata:
            supplier.metadata["learning_corrections"] = []
            supplier.metadata["last_learning_applied"] = datetime.utcnow().isoformat()
        
        self.db.commit()
        
        return {
            "success": True,
            "supplier_name": supplier.name,
            "old_account": old_account,
            "new_account": new_charge_account
        }
    
    def get_learning_suggestions(self) -> List[Dict[str, Any]]:
        """
        Retourne la liste des suggestions d'apprentissage basées sur les corrections.
        
        Returns:
            Liste des fournisseurs avec suggestions de mise à jour
        """
        suppliers = self.db.query(Supplier).filter(
            Supplier.tenant_id == self.tenant_id
        ).all()
        
        suggestions = []
        
        for supplier in suppliers:
            if not hasattr(supplier, 'metadata') or not supplier.metadata:
                continue
                
            corrections = supplier.metadata.get("learning_corrections", [])
            if len(corrections) < 3:
                continue
            
            # Analyser les corrections
            correction_counts = {}
            for c in corrections:
                key = c["corrected"]
                correction_counts[key] = correction_counts.get(key, 0) + 1
            
            if not correction_counts:
                continue
                
            most_common = max(correction_counts.items(), key=lambda x: x[1])
            
            if most_common[1] >= 3 and most_common[0] != supplier.default_charge_account:
                suggestions.append({
                    "supplier_id": str(supplier.id),
                    "supplier_name": supplier.name,
                    "current_account": supplier.default_charge_account,
                    "suggested_account": most_common[0],
                    "correction_count": most_common[1],
                    "confidence": min(0.95, 0.6 + most_common[1] * 0.05)
                })
        
        return sorted(suggestions, key=lambda x: x["correction_count"], reverse=True)

    # =========================================================================
    # 3. ALERTES ET NOTIFICATIONS
    # =========================================================================
    
    def get_alerts(self) -> List[Dict[str, Any]]:
        """
        Génère les alertes concernant les règles d'imputation.
        
        Types d'alertes:
        - Fournisseurs récurrents sans règle
        - Factures non matchées
        - Règles inutilisées
        
        Returns:
            Liste des alertes triées par priorité
        """
        alerts = []
        
        # 1. Fournisseurs sans règle
        suppliers_no_rule = self.db.query(Supplier).filter(
            and_(
                Supplier.tenant_id == self.tenant_id,
                Supplier.has_active_rule == False
            )
        ).all()
        
        for supplier in suppliers_no_rule:
            # Compter les factures en attente (simulé - à adapter selon votre modèle Document)
            alerts.append({
                "id": str(uuid4()),
                "type": AlertType.SUPPLIER_NO_RULE.value,
                "severity": "warning",
                "title": f"Fournisseur sans règle: {supplier.name}",
                "message": f"Le fournisseur '{supplier.name}' n'a pas de règle d'imputation. Les factures doivent être traitées manuellement.",
                "supplier_id": str(supplier.id),
                "supplier_name": supplier.name,
                "action": {
                    "type": "create_rule",
                    "label": "Créer une règle",
                    "url": f"/regles/fournisseurs?create={supplier.id}"
                },
                "created_at": datetime.utcnow().isoformat()
            })
        
        # 2. Règles avec faible confiance (basé sur l'apprentissage)
        for supplier in self.db.query(Supplier).filter(
            and_(
                Supplier.tenant_id == self.tenant_id,
                Supplier.has_active_rule == True
            )
        ).all():
            if hasattr(supplier, 'metadata') and supplier.metadata:
                corrections = supplier.metadata.get("learning_corrections", [])
                if len(corrections) >= 5:
                    alerts.append({
                        "id": str(uuid4()),
                        "type": AlertType.LOW_CONFIDENCE.value,
                        "severity": "info",
                        "title": f"Règle à réviser: {supplier.name}",
                        "message": f"La règle de '{supplier.name}' a été corrigée {len(corrections)} fois. Envisagez de la mettre à jour.",
                        "supplier_id": str(supplier.id),
                        "supplier_name": supplier.name,
                        "correction_count": len(corrections),
                        "action": {
                            "type": "review_rule",
                            "label": "Réviser la règle",
                            "url": f"/regles/fournisseurs?edit={supplier.id}"
                        },
                        "created_at": datetime.utcnow().isoformat()
                    })
        
        # Trier par sévérité
        severity_order = {"error": 0, "warning": 1, "info": 2}
        alerts.sort(key=lambda x: severity_order.get(x["severity"], 3))
        
        return alerts
    
    def get_alert_summary(self) -> Dict[str, Any]:
        """
        Retourne un résumé des alertes pour le dashboard.
        """
        alerts = self.get_alerts()
        
        return {
            "total": len(alerts),
            "by_type": {
                "supplier_no_rule": len([a for a in alerts if a["type"] == AlertType.SUPPLIER_NO_RULE.value]),
                "invoice_no_match": len([a for a in alerts if a["type"] == AlertType.INVOICE_NO_MATCH.value]),
                "low_confidence": len([a for a in alerts if a["type"] == AlertType.LOW_CONFIDENCE.value]),
            },
            "by_severity": {
                "error": len([a for a in alerts if a["severity"] == "error"]),
                "warning": len([a for a in alerts if a["severity"] == "warning"]),
                "info": len([a for a in alerts if a["severity"] == "info"]),
            }
        }

    # =========================================================================
    # 4. RÈGLES CONDITIONNELLES AVANCÉES
    # =========================================================================
    
    def create_conditional_rule(
        self,
        supplier_id: str,
        conditions: List[Dict[str, Any]],
        actions: List[Dict[str, Any]],
        name: str = None,
        priority: int = 10
    ) -> Dict[str, Any]:
        """
        Crée une règle conditionnelle avancée.
        
        Types de conditions supportées:
        - amount_greater: Montant > X
        - amount_less: Montant < X
        - amount_between: X < Montant < Y
        - date_range: Date dans une période
        - description_contains: Description contient un mot
        - period_monthly: Facture mensuelle récurrente
        
        Exemples:
        - Si montant > 1 000 000 FCFA → compte 6XXX différent
        - Si date entre 01/01 et 31/03 → compte TVA différent
        
        Args:
            supplier_id: ID du fournisseur
            conditions: Liste des conditions
            actions: Actions à exécuter si conditions remplies
            name: Nom de la règle
            priority: Priorité (plus bas = plus prioritaire)
            
        Returns:
            Dict avec la règle créée
        """
        supplier = self.db.query(Supplier).filter(
            and_(
                Supplier.id == supplier_id,
                Supplier.tenant_id == self.tenant_id
            )
        ).first()
        
        if not supplier:
            return {"success": False, "error": "Fournisseur non trouvé"}
        
        # Valider les conditions
        validated_conditions = []
        for cond in conditions:
            cond_type = cond.get("type")
            
            if cond_type == RuleConditionType.AMOUNT_GREATER.value:
                validated_conditions.append({
                    "type": cond_type,
                    "operator": ">",
                    "value": float(cond.get("value", 0))
                })
            elif cond_type == RuleConditionType.AMOUNT_LESS.value:
                validated_conditions.append({
                    "type": cond_type,
                    "operator": "<",
                    "value": float(cond.get("value", 0))
                })
            elif cond_type == RuleConditionType.AMOUNT_BETWEEN.value:
                validated_conditions.append({
                    "type": cond_type,
                    "operator": "between",
                    "min_value": float(cond.get("min_value", 0)),
                    "max_value": float(cond.get("max_value", 0))
                })
            elif cond_type == RuleConditionType.DATE_RANGE.value:
                validated_conditions.append({
                    "type": cond_type,
                    "operator": "between",
                    "start_date": cond.get("start_date"),
                    "end_date": cond.get("end_date")
                })
            elif cond_type == RuleConditionType.DESCRIPTION_CONTAINS.value:
                validated_conditions.append({
                    "type": cond_type,
                    "operator": "contains",
                    "value": cond.get("value", "")
                })
            elif cond_type == RuleConditionType.PERIOD_MONTHLY.value:
                validated_conditions.append({
                    "type": cond_type,
                    "operator": "monthly",
                    "expected_amount": float(cond.get("expected_amount", 0)),
                    "tolerance_percent": float(cond.get("tolerance_percent", 5))
                })
        
        # Créer la règle
        rule = AccountingRule(
            tenant_id=self.tenant_id,
            name=name or f"Règle conditionnelle - {supplier.name}",
            description=f"Règle avancée pour {supplier.name} avec {len(validated_conditions)} condition(s)",
            priority=priority,
            conditions=validated_conditions,
            actions=actions,
            auto_apply=True,
            confidence_threshold=0.8,
            is_active=True
        )
        
        self.db.add(rule)
        self.db.flush()
        
        # Associer au fournisseur (règle secondaire)
        if not hasattr(supplier, 'metadata') or supplier.metadata is None:
            supplier.metadata = {}
        
        conditional_rules = supplier.metadata.get("conditional_rules", [])
        conditional_rules.append(str(rule.id))
        supplier.metadata["conditional_rules"] = conditional_rules
        
        self.db.commit()
        
        return {
            "success": True,
            "rule_id": str(rule.id),
            "rule_name": rule.name,
            "conditions_count": len(validated_conditions)
        }
    
    def evaluate_conditional_rules(
        self,
        supplier_id: str,
        invoice_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Évalue les règles conditionnelles pour une facture.
        
        Args:
            supplier_id: ID du fournisseur
            invoice_data: Données de la facture (montant, date, description)
            
        Returns:
            Dict avec la règle applicable et les actions
        """
        supplier = self.db.query(Supplier).filter(
            and_(
                Supplier.id == supplier_id,
                Supplier.tenant_id == self.tenant_id
            )
        ).first()
        
        if not supplier:
            return {"matched": False, "error": "Fournisseur non trouvé"}
        
        # Récupérer les règles conditionnelles
        if not hasattr(supplier, 'metadata') or not supplier.metadata:
            return {"matched": False, "reason": "Pas de règles conditionnelles"}
        
        conditional_rule_ids = supplier.metadata.get("conditional_rules", [])
        
        if not conditional_rule_ids:
            return {"matched": False, "reason": "Pas de règles conditionnelles"}
        
        # Évaluer chaque règle par ordre de priorité
        rules = self.db.query(AccountingRule).filter(
            AccountingRule.id.in_(conditional_rule_ids)
        ).order_by(AccountingRule.priority).all()
        
        amount = invoice_data.get("amount_ttc", 0)
        invoice_date = invoice_data.get("date")
        description = invoice_data.get("description", "").lower()
        
        for rule in rules:
            if not rule.is_active:
                continue
                
            all_conditions_met = True
            
            for condition in rule.conditions:
                cond_type = condition.get("type")
                
                if cond_type == RuleConditionType.AMOUNT_GREATER.value:
                    if amount <= condition.get("value", 0):
                        all_conditions_met = False
                        break
                        
                elif cond_type == RuleConditionType.AMOUNT_LESS.value:
                    if amount >= condition.get("value", 0):
                        all_conditions_met = False
                        break
                        
                elif cond_type == RuleConditionType.AMOUNT_BETWEEN.value:
                    min_val = condition.get("min_value", 0)
                    max_val = condition.get("max_value", float('inf'))
                    if not (min_val <= amount <= max_val):
                        all_conditions_met = False
                        break
                        
                elif cond_type == RuleConditionType.DESCRIPTION_CONTAINS.value:
                    search_val = condition.get("value", "").lower()
                    if search_val not in description:
                        all_conditions_met = False
                        break
                        
                elif cond_type == RuleConditionType.PERIOD_MONTHLY.value:
                    expected = condition.get("expected_amount", 0)
                    tolerance = condition.get("tolerance_percent", 5) / 100
                    if not (expected * (1 - tolerance) <= amount <= expected * (1 + tolerance)):
                        all_conditions_met = False
                        break
            
            if all_conditions_met:
                return {
                    "matched": True,
                    "rule_id": str(rule.id),
                    "rule_name": rule.name,
                    "actions": rule.actions,
                    "priority": rule.priority
                }
        
        return {"matched": False, "reason": "Aucune condition remplie"}
    
    def get_conditional_rules(self, supplier_id: str = None) -> List[Dict[str, Any]]:
        """
        Liste les règles conditionnelles.
        
        Args:
            supplier_id: Filtrer par fournisseur (optionnel)
            
        Returns:
            Liste des règles conditionnelles
        """
        query = self.db.query(AccountingRule).filter(
            AccountingRule.tenant_id == self.tenant_id
        )
        
        rules = query.all()
        
        result = []
        for rule in rules:
            # Vérifier si c'est une règle conditionnelle (a des conditions avancées)
            has_advanced_conditions = any(
                c.get("type") in [
                    RuleConditionType.AMOUNT_GREATER.value,
                    RuleConditionType.AMOUNT_LESS.value,
                    RuleConditionType.AMOUNT_BETWEEN.value,
                    RuleConditionType.DATE_RANGE.value,
                    RuleConditionType.PERIOD_MONTHLY.value
                ]
                for c in (rule.conditions or [])
            )
            
            if has_advanced_conditions:
                result.append({
                    "id": str(rule.id),
                    "name": rule.name,
                    "description": rule.description,
                    "priority": rule.priority,
                    "conditions": rule.conditions,
                    "actions": rule.actions,
                    "is_active": rule.is_active
                })
        
        return result

    # =========================================================================
    # 6. TEMPLATES DE RÈGLES PRÉDÉFINIS SYSCOHADA
    # =========================================================================
    
    def get_available_templates(self) -> List[Dict[str, Any]]:
        """
        Retourne la liste des templates SYSCOHADA disponibles.
        
        Returns:
            Liste des templates avec leur description
        """
        templates = []
        
        for key, template in SYSCOHADA_TEMPLATES.items():
            templates.append({
                "id": key,
                "name": template["name"],
                "supplier_count": len(template["suppliers"]),
                "suppliers": [
                    {
                        "name": s["name"],
                        "code": s["code"],
                        "charge_account": s["charge_account"]
                    }
                    for s in template["suppliers"]
                ]
            })
        
        return templates
    
    def get_template_details(self, template_id: str) -> Optional[Dict[str, Any]]:
        """
        Retourne les détails d'un template spécifique.
        
        Args:
            template_id: ID du template (energie, telecom, etc.)
            
        Returns:
            Dict avec les détails du template
        """
        template = SYSCOHADA_TEMPLATES.get(template_id)
        
        if not template:
            return None
        
        return {
            "id": template_id,
            "name": template["name"],
            "suppliers": template["suppliers"],
            "accounts_used": list(set(s["charge_account"] for s in template["suppliers"]))
        }
    
    def apply_template(
        self,
        template_id: str,
        client_id: UUID,
        selected_suppliers: List[str] = None,
        overwrite: bool = False
    ) -> Dict[str, Any]:
        """
        Applique un template SYSCOHADA pour créer des fournisseurs et règles.
        
        Args:
            template_id: ID du template à appliquer
            client_id: ID du client
            selected_suppliers: Liste des codes fournisseurs à créer (None = tous)
            overwrite: Si True, met à jour les fournisseurs existants
            
        Returns:
            Dict avec le résultat de l'application
        """
        from app.services.tiers_interconnection import get_interconnection_service
        
        template = SYSCOHADA_TEMPLATES.get(template_id)
        
        if not template:
            return {"success": False, "error": f"Template '{template_id}' non trouvé"}
        
        service = get_interconnection_service(self.db, self.tenant_id)
        
        results = {
            "success": True,
            "template_name": template["name"],
            "created": 0,
            "updated": 0,
            "skipped": 0,
            "details": []
        }
        
        suppliers_to_process = template["suppliers"]
        
        # Filtrer si sélection spécifique
        if selected_suppliers:
            suppliers_to_process = [
                s for s in suppliers_to_process 
                if s["code"] in selected_suppliers
            ]
        
        for supplier_data in suppliers_to_process:
            try:
                # Vérifier si le fournisseur existe
                existing = self.db.query(Supplier).filter(
                    and_(
                        Supplier.tenant_id == self.tenant_id,
                        or_(
                            Supplier.code == supplier_data["code"],
                            Supplier.name == supplier_data["name"]
                        )
                    )
                ).first()
                
                if existing:
                    if overwrite:
                        # Mettre à jour
                        existing.code = supplier_data["code"]
                        existing.default_charge_account = supplier_data["charge_account"]
                        existing.default_vat_account = "4454"
                        existing.default_tax_rate = Decimal("18.00")
                        existing.default_journal = "ACH"
                        existing.ocr_keywords = supplier_data.get("keywords", [supplier_data["name"]])
                        existing.has_active_rule = True
                        
                        # Créer compte auxiliaire si nécessaire
                        if not existing.auxiliary_account_code:
                            service.create_auxiliary_account(existing)
                        
                        results["updated"] += 1
                        results["details"].append({
                            "name": supplier_data["name"],
                            "status": "updated",
                            "account": supplier_data["charge_account"]
                        })
                    else:
                        results["skipped"] += 1
                        results["details"].append({
                            "name": supplier_data["name"],
                            "status": "skipped",
                            "reason": "exists"
                        })
                else:
                    # Créer nouveau fournisseur avec règle
                    service.create_supplier_with_interconnection(
                        name=supplier_data["name"],
                        code=supplier_data["code"],
                        create_auxiliary_account=True,
                        create_rule=True,
                        charge_account=supplier_data["charge_account"],
                        vat_account="4454",
                        vat_rate=18.0,
                        journal_code="ACH",
                        ocr_keywords=supplier_data.get("keywords", [supplier_data["name"]]),
                        client_id=client_id
                    )
                    
                    results["created"] += 1
                    results["details"].append({
                        "name": supplier_data["name"],
                        "status": "created",
                        "account": supplier_data["charge_account"],
                        "auxiliary": f"401{supplier_data['code']}"
                    })
                    
            except Exception as e:
                results["details"].append({
                    "name": supplier_data["name"],
                    "status": "error",
                    "error": str(e)
                })
        
        self.db.commit()
        
        return results
    
    def get_all_syscohada_accounts(self) -> List[Dict[str, Any]]:
        """
        Retourne la liste des comptes SYSCOHADA standards utilisés dans les templates.
        
        Returns:
            Liste des comptes avec leur description
        """
        accounts = {
            # Classe 6 - Charges
            "601": {"name": "Achats de marchandises", "class": "6", "type": "expense"},
            "602": {"name": "Achats de matières premières", "class": "6", "type": "expense"},
            "604": {"name": "Achats stockés", "class": "6", "type": "expense"},
            "605": {"name": "Autres achats", "class": "6", "type": "expense"},
            "6061": {"name": "Électricité", "class": "6", "type": "expense"},
            "6062": {"name": "Eau", "class": "6", "type": "expense"},
            "6063": {"name": "Autres énergies (gaz, carburant)", "class": "6", "type": "expense"},
            "6064": {"name": "Fournitures de bureau", "class": "6", "type": "expense"},
            "6065": {"name": "Fournitures informatiques", "class": "6", "type": "expense"},
            "6132": {"name": "Locations immobilières", "class": "6", "type": "expense"},
            "6135": {"name": "Locations mobilières", "class": "6", "type": "expense"},
            "6152": {"name": "Entretien et réparations immobilières", "class": "6", "type": "expense"},
            "6156": {"name": "Maintenance informatique", "class": "6", "type": "expense"},
            "6161": {"name": "Assurance multirisque", "class": "6", "type": "expense"},
            "6162": {"name": "Assurance transport", "class": "6", "type": "expense"},
            "6225": {"name": "Rémunérations d'intermédiaires", "class": "6", "type": "expense"},
            "6226": {"name": "Honoraires", "class": "6", "type": "expense"},
            "6241": {"name": "Transport du personnel", "class": "6", "type": "expense"},
            "6242": {"name": "Transport sur achats", "class": "6", "type": "expense"},
            "6261": {"name": "Télécommunications", "class": "6", "type": "expense"},
            "6262": {"name": "Internet", "class": "6", "type": "expense"},
            "6271": {"name": "Annonces et insertions", "class": "6", "type": "expense"},
            "6275": {"name": "Frais de réception", "class": "6", "type": "expense"},
            "627": {"name": "Services bancaires", "class": "6", "type": "expense"},
            "631": {"name": "Impôts et taxes", "class": "6", "type": "expense"},
            
            # Classe 4 - Tiers
            "401": {"name": "Fournisseurs", "class": "4", "type": "liability", "is_collective": True},
            "411": {"name": "Clients", "class": "4", "type": "asset", "is_collective": True},
            "4454": {"name": "TVA récupérable sur achats", "class": "4", "type": "asset"},
            "4452": {"name": "TVA récupérable sur immobilisations", "class": "4", "type": "asset"},
            "4457": {"name": "TVA collectée", "class": "4", "type": "liability"},
        }
        
        return [
            {"code": code, **data}
            for code, data in sorted(accounts.items())
        ]
    
    def suggest_template_for_supplier(self, supplier_name: str) -> Optional[Dict[str, Any]]:
        """
        Suggère un template approprié basé sur le nom du fournisseur.
        
        Args:
            supplier_name: Nom du fournisseur
            
        Returns:
            Template suggéré ou None
        """
        name_lower = supplier_name.lower()
        
        # Chercher dans tous les templates
        for template_id, template in SYSCOHADA_TEMPLATES.items():
            for supplier in template["suppliers"]:
                # Vérifier les mots-clés
                keywords = supplier.get("keywords", [supplier["name"]])
                for keyword in keywords:
                    if keyword.lower() in name_lower or name_lower in keyword.lower():
                        return {
                            "template_id": template_id,
                            "template_name": template["name"],
                            "matched_supplier": supplier["name"],
                            "suggested_charge_account": supplier["charge_account"],
                            "suggested_code": supplier["code"],
                            "keywords": keywords
                        }
        
        return None


# =============================================================================
# FACTORY FUNCTION
# =============================================================================

def get_rules_advanced_service(db: Session, tenant_id: str) -> RulesAdvancedService:
    """Factory function pour créer une instance du service."""
    return RulesAdvancedService(db, tenant_id)
