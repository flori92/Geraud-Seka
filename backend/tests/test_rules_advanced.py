"""
Tests pour le service de règles avancées
========================================

Tests couvrant:
1. Import/Export de règles
2. Apprentissage automatique
3. Alertes
4. Règles conditionnelles
5. Templates SYSCOHADA
"""

import pytest
import json
from unittest.mock import MagicMock, patch
from uuid import uuid4
from decimal import Decimal
from datetime import datetime

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.services.rules_advanced import (
    RulesAdvancedService, 
    get_rules_advanced_service,
    SYSCOHADA_TEMPLATES,
    RuleConditionType
)


# =============================================================================
# FIXTURES
# =============================================================================

@pytest.fixture
def mock_db():
    """Mock de la session SQLAlchemy"""
    db = MagicMock()
    db.query.return_value.filter.return_value.all.return_value = []
    db.query.return_value.filter.return_value.first.return_value = None
    return db


@pytest.fixture
def tenant_id():
    """ID tenant de test"""
    return str(uuid4())


@pytest.fixture
def service(mock_db, tenant_id):
    """Instance du service"""
    return RulesAdvancedService(mock_db, tenant_id)


@pytest.fixture
def mock_supplier_with_rule():
    """Fournisseur avec règle active"""
    supplier = MagicMock()
    supplier.id = uuid4()
    supplier.name = "SBEE"
    supplier.code = "SBEE"
    supplier.default_charge_account = "6061"
    supplier.default_vat_account = "4454"
    supplier.default_tax_rate = Decimal("18.00")
    supplier.default_journal = "ACH"
    supplier.auxiliary_account_code = "401SBEE"
    supplier.has_active_rule = True
    supplier.ocr_keywords = ["SBEE", "Société Béninoise"]
    supplier.tenant_id = str(uuid4())
    supplier.metadata = {}
    return supplier


@pytest.fixture
def mock_supplier_without_rule():
    """Fournisseur sans règle"""
    supplier = MagicMock()
    supplier.id = uuid4()
    supplier.name = "Nouveau Fournisseur"
    supplier.code = "NEWFOUR"
    supplier.has_active_rule = False
    supplier.default_charge_account = None
    supplier.tenant_id = str(uuid4())
    supplier.metadata = None
    return supplier


# =============================================================================
# TESTS: EXPORT
# =============================================================================

class TestExport:
    """Tests pour l'export de règles"""
    
    def test_export_json_empty(self, service, mock_db):
        """Test export JSON sans règles"""
        mock_db.query.return_value.filter.return_value.all.return_value = []
        
        result = service.export_rules_to_json()
        data = json.loads(result)
        
        assert data["rules_count"] == 0
        assert data["rules"] == []
        assert "export_date" in data
    
    def test_export_json_with_rules(self, service, mock_db, mock_supplier_with_rule):
        """Test export JSON avec règles"""
        mock_db.query.return_value.filter.return_value.all.return_value = [mock_supplier_with_rule]
        
        result = service.export_rules_to_json()
        data = json.loads(result)
        
        assert data["rules_count"] == 1
        assert len(data["rules"]) == 1
        assert data["rules"][0]["supplier_name"] == "SBEE"
        assert data["rules"][0]["charge_account"] == "6061"
    
    def test_export_csv_format(self, service, mock_db, mock_supplier_with_rule):
        """Test export CSV format correct"""
        mock_db.query.return_value.filter.return_value.all.return_value = [mock_supplier_with_rule]
        
        result = service.export_rules_to_csv()
        lines = result.strip().split('\n')
        
        # Header
        assert "supplier_name" in lines[0]
        assert "charge_account" in lines[0]
        
        # Data
        assert "SBEE" in lines[1]
        assert "6061" in lines[1]


# =============================================================================
# TESTS: IMPORT
# =============================================================================

class TestImport:
    """Tests pour l'import de règles"""
    
    def test_import_json_invalid(self, service):
        """Test import JSON invalide"""
        result = service.import_rules_from_json("invalid json {")
        
        assert result["success"] == False
        assert "JSON invalide" in result["error"]
    
    def test_import_json_empty_rules(self, service):
        """Test import JSON avec règles vides"""
        json_data = json.dumps({"rules": []})
        
        result = service.import_rules_from_json(json_data)
        
        assert result["success"] == True
        assert result["imported"] == 0
    
    def test_import_json_missing_name(self, service):
        """Test import JSON avec nom manquant"""
        json_data = json.dumps({
            "rules": [{"charge_account": "6061"}]
        })
        
        result = service.import_rules_from_json(json_data)
        
        assert result["skipped"] == 1
        assert "sans nom" in result["errors"][0]


# =============================================================================
# TESTS: APPRENTISSAGE
# =============================================================================

class TestLearning:
    """Tests pour l'apprentissage automatique"""
    
    def test_record_correction_unknown_supplier(self, service, mock_db):
        """Test correction pour fournisseur inconnu"""
        mock_db.query.return_value.filter.return_value.first.return_value = None
        
        result = service.record_correction(
            supplier_name="Inconnu",
            original_account="601",
            corrected_account="6061",
            user_id="user123"
        )
        
        assert result["recorded"] == True
        assert result["supplier_found"] == False
        assert result["recommendation"]["type"] == "create_supplier"
    
    def test_record_correction_builds_history(self, service, mock_db, mock_supplier_with_rule):
        """Test que les corrections sont mémorisées"""
        mock_supplier_with_rule.metadata = {"learning_corrections": []}
        mock_db.query.return_value.filter.return_value.first.return_value = mock_supplier_with_rule
        
        # Première correction
        service.record_correction(
            supplier_name="SBEE",
            original_account="601",
            corrected_account="6061",
            user_id="user123"
        )
        
        assert len(mock_supplier_with_rule.metadata["learning_corrections"]) == 1
    
    def test_learning_suggestion_after_multiple_corrections(self, service, mock_db, mock_supplier_with_rule):
        """Test suggestion après plusieurs corrections"""
        # Simuler 5 corrections vers le même compte
        mock_supplier_with_rule.metadata = {
            "learning_corrections": [
                {"corrected": "6062", "original": "6061"} for _ in range(5)
            ]
        }
        mock_supplier_with_rule.default_charge_account = "6061"
        mock_db.query.return_value.filter.return_value.first.return_value = mock_supplier_with_rule
        
        result = service.record_correction(
            supplier_name="SBEE",
            original_account="6061",
            corrected_account="6062",
            user_id="user123"
        )
        
        # Devrait suggérer une mise à jour
        assert result["recommendation"] is not None
        assert result["recommendation"]["type"] == "update_rule"
        assert result["recommendation"]["suggested_charge_account"] == "6062"


# =============================================================================
# TESTS: ALERTES
# =============================================================================

class TestAlerts:
    """Tests pour les alertes"""
    
    def test_alerts_suppliers_without_rules(self, service, mock_db, mock_supplier_without_rule):
        """Test alerte pour fournisseurs sans règle"""
        mock_db.query.return_value.filter.return_value.all.return_value = [mock_supplier_without_rule]
        
        alerts = service.get_alerts()
        
        assert len(alerts) > 0
        assert alerts[0]["type"] == "supplier_no_rule"
        assert mock_supplier_without_rule.name in alerts[0]["title"]
    
    def test_alert_summary(self, service, mock_db, mock_supplier_without_rule):
        """Test résumé des alertes"""
        mock_db.query.return_value.filter.return_value.all.return_value = [mock_supplier_without_rule]
        
        summary = service.get_alert_summary()
        
        assert "total" in summary
        assert "by_type" in summary
        assert "by_severity" in summary


# =============================================================================
# TESTS: RÈGLES CONDITIONNELLES
# =============================================================================

class TestConditionalRules:
    """Tests pour les règles conditionnelles"""
    
    def test_create_conditional_rule(self, service, mock_db, mock_supplier_with_rule):
        """Test création règle conditionnelle"""
        mock_db.query.return_value.filter.return_value.first.return_value = mock_supplier_with_rule
        
        conditions = [
            {"type": "amount_greater", "value": 1000000}
        ]
        actions = [
            {"type": "assign_account", "debit_account": "6062"}
        ]
        
        result = service.create_conditional_rule(
            supplier_id=str(mock_supplier_with_rule.id),
            conditions=conditions,
            actions=actions,
            name="Test Rule"
        )
        
        assert result["success"] == True
        assert result["conditions_count"] == 1
    
    def test_evaluate_amount_greater_condition(self, service, mock_db, mock_supplier_with_rule):
        """Test évaluation condition montant supérieur"""
        # Créer une règle mock avec condition
        mock_rule = MagicMock()
        mock_rule.id = uuid4()
        mock_rule.is_active = True
        mock_rule.priority = 10
        mock_rule.conditions = [
            {"type": "amount_greater", "value": 500000}
        ]
        mock_rule.actions = [{"type": "assign_account", "debit_account": "6062"}]
        
        mock_supplier_with_rule.metadata = {"conditional_rules": [str(mock_rule.id)]}
        
        mock_db.query.return_value.filter.return_value.first.return_value = mock_supplier_with_rule
        mock_db.query.return_value.filter.return_value.order_by.return_value.all.return_value = [mock_rule]
        
        invoice_data = {"amount_ttc": 1000000}
        
        result = service.evaluate_conditional_rules(
            str(mock_supplier_with_rule.id),
            invoice_data
        )
        
        assert result["matched"] == True
    
    def test_evaluate_amount_between_condition(self, service, mock_db, mock_supplier_with_rule):
        """Test évaluation condition montant entre"""
        mock_rule = MagicMock()
        mock_rule.id = uuid4()
        mock_rule.is_active = True
        mock_rule.priority = 10
        mock_rule.conditions = [
            {"type": "amount_between", "min_value": 100000, "max_value": 500000}
        ]
        mock_rule.actions = [{"type": "assign_account", "debit_account": "6063"}]
        
        mock_supplier_with_rule.metadata = {"conditional_rules": [str(mock_rule.id)]}
        
        mock_db.query.return_value.filter.return_value.first.return_value = mock_supplier_with_rule
        mock_db.query.return_value.filter.return_value.order_by.return_value.all.return_value = [mock_rule]
        
        # Montant dans la plage
        result = service.evaluate_conditional_rules(
            str(mock_supplier_with_rule.id),
            {"amount_ttc": 300000}
        )
        
        assert result["matched"] == True


# =============================================================================
# TESTS: TEMPLATES SYSCOHADA
# =============================================================================

class TestTemplates:
    """Tests pour les templates SYSCOHADA"""
    
    def test_get_available_templates(self, service):
        """Test liste des templates disponibles"""
        templates = service.get_available_templates()
        
        assert len(templates) > 0
        assert any(t["id"] == "energie" for t in templates)
        assert any(t["id"] == "telecom" for t in templates)
    
    def test_get_template_details(self, service):
        """Test détails d'un template"""
        template = service.get_template_details("energie")
        
        assert template is not None
        assert template["id"] == "energie"
        assert len(template["suppliers"]) > 0
        assert any(s["code"] == "SBEE" for s in template["suppliers"])
    
    def test_get_template_not_found(self, service):
        """Test template inexistant"""
        template = service.get_template_details("inexistant")
        
        assert template is None
    
    def test_suggest_template_for_supplier(self, service):
        """Test suggestion de template basée sur le nom"""
        # Test avec SBEE -> devrait suggérer energie
        suggestion = service.suggest_template_for_supplier("SBEE Cotonou")
        
        assert suggestion is not None
        assert suggestion["template_id"] == "energie"
        assert suggestion["suggested_charge_account"] == "6061"
    
    def test_suggest_template_telecom(self, service):
        """Test suggestion pour télécom"""
        suggestion = service.suggest_template_for_supplier("MTN Bénin Services")
        
        assert suggestion is not None
        assert suggestion["template_id"] == "telecom"
        assert suggestion["suggested_charge_account"] == "6261"
    
    def test_suggest_template_no_match(self, service):
        """Test pas de suggestion"""
        suggestion = service.suggest_template_for_supplier("Fournisseur Inconnu XYZ")
        
        assert suggestion is None
    
    def test_syscohada_accounts_list(self, service):
        """Test liste des comptes SYSCOHADA"""
        accounts = service.get_all_syscohada_accounts()
        
        assert len(accounts) > 0
        
        # Vérifier quelques comptes standards
        codes = [a["code"] for a in accounts]
        assert "6061" in codes  # Électricité
        assert "6261" in codes  # Télécoms
        assert "401" in codes   # Fournisseurs
        assert "4454" in codes  # TVA récupérable
    
    def test_templates_have_valid_accounts(self, service):
        """Test que tous les templates utilisent des comptes valides"""
        accounts = service.get_all_syscohada_accounts()
        valid_codes = [a["code"] for a in accounts]
        
        for template_id, template in SYSCOHADA_TEMPLATES.items():
            for supplier in template["suppliers"]:
                assert supplier["charge_account"] in valid_codes, \
                    f"Template {template_id}, supplier {supplier['name']}: compte {supplier['charge_account']} invalide"


# =============================================================================
# TESTS: FACTORY FUNCTION
# =============================================================================

class TestFactory:
    """Tests pour la factory function"""
    
    def test_get_service_instance(self, mock_db, tenant_id):
        """Test création instance"""
        service = get_rules_advanced_service(mock_db, tenant_id)
        
        assert isinstance(service, RulesAdvancedService)
        assert service.tenant_id == tenant_id


# =============================================================================
# RUN TESTS
# =============================================================================

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
