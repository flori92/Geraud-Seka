"""
Tests unitaires pour le service d'interconnexion Tiers - Plan Comptable - Règles
================================================================================

Ces tests vérifient la logique d'interconnexion SEKA Business:
1. Création automatique de comptes auxiliaires
2. Création de règles d'imputation
3. Reconnaissance de fournisseurs par OCR
4. Génération automatique d'écritures comptables
"""

import pytest
from unittest.mock import Mock, MagicMock, patch
from decimal import Decimal
from uuid import uuid4

# Import des modèles et services à tester
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.services.tiers_interconnection import TiersInterconnectionService, get_interconnection_service


# =============================================================================
# FIXTURES
# =============================================================================

@pytest.fixture
def mock_db():
    """Mock de la session SQLAlchemy"""
    db = MagicMock()
    db.query.return_value.filter.return_value.first.return_value = None
    db.query.return_value.filter.return_value.all.return_value = []
    return db


@pytest.fixture
def tenant_id():
    """ID tenant de test"""
    return str(uuid4())


@pytest.fixture
def mock_supplier():
    """Fournisseur mock pour les tests"""
    supplier = MagicMock()
    supplier.id = uuid4()
    supplier.code = "SBEE"
    supplier.name = "SBEE"
    supplier.nif = "123456789"
    supplier.collective_account_code = "401"
    supplier.auxiliary_account_id = None
    supplier.auxiliary_account_code = None
    supplier.default_rule_id = None
    supplier.has_active_rule = False
    supplier.default_charge_account = None
    supplier.default_vat_account = "4454"
    supplier.default_tax_rate = Decimal("18.00")
    supplier.default_journal = "ACH"
    supplier.ocr_keywords = ["SBEE", "Société Béninoise d'Énergie"]
    supplier.tenant_id = str(uuid4())
    
    def generate_auxiliary_code():
        base_code = supplier.collective_account_code or "401"
        supplier_code = (supplier.code or supplier.name[:6]).upper().replace(" ", "")
        return f"{base_code}{supplier_code}"
    
    supplier.generate_auxiliary_code = generate_auxiliary_code
    return supplier


@pytest.fixture
def mock_chart_of_accounts():
    """Compte plan comptable mock"""
    account = MagicMock()
    account.id = uuid4()
    account.account_number = "401SBEE"
    account.name = "Fournisseur SBEE"
    account.account_class = "4"
    account.account_type = "liability"
    account.is_auxiliary = True
    account.is_collective = False
    account.tenant_id = str(uuid4())
    return account


@pytest.fixture
def mock_rule():
    """Règle d'imputation mock"""
    rule = MagicMock()
    rule.id = uuid4()
    rule.name = "Règle SBEE"
    rule.conditions = [{"type": "supplier_name", "operator": "contains", "value": "SBEE"}]
    rule.actions = [
        {"type": "assign_account", "debit_account": "6061", "credit_account": "401SBEE", "vat_account": "4454"},
        {"type": "set_vat_rate", "vat_rate": 18}
    ]
    rule.is_active = True
    rule.auto_apply = True
    rule.confidence_threshold = 0.7
    return rule


@pytest.fixture
def service(mock_db, tenant_id):
    """Instance du service d'interconnexion"""
    return TiersInterconnectionService(mock_db, tenant_id)


# =============================================================================
# TESTS: GÉNÉRATION DE CODE AUXILIAIRE
# =============================================================================

class TestAuxiliaryCodeGeneration:
    """Tests pour la génération de codes de comptes auxiliaires"""
    
    def test_generate_auxiliary_code_from_code(self, mock_supplier):
        """Test: génération du code auxiliaire à partir du code fournisseur"""
        mock_supplier.code = "SBEE"
        mock_supplier.name = "Société Béninoise d'Énergie"
        
        result = mock_supplier.generate_auxiliary_code()
        
        assert result == "401SBEE"
    
    def test_generate_auxiliary_code_from_name(self, mock_supplier):
        """Test: génération du code auxiliaire à partir du nom si pas de code"""
        mock_supplier.code = None
        mock_supplier.name = "MTN Bénin"
        
        result = mock_supplier.generate_auxiliary_code()
        
        assert result == "401MTNBÉN"
    
    def test_generate_auxiliary_code_with_spaces(self, mock_supplier):
        """Test: les espaces sont supprimés du code"""
        mock_supplier.code = "MOOV AFRICA"
        
        result = mock_supplier.generate_auxiliary_code()
        
        assert result == "401MOOVAFRICA"
    
    def test_generate_auxiliary_code_different_collective(self, mock_supplier):
        """Test: utilisation d'un compte collectif différent"""
        mock_supplier.code = "CLIENT01"
        mock_supplier.collective_account_code = "411"  # Clients
        
        result = mock_supplier.generate_auxiliary_code()
        
        assert result == "411CLIENT01"


# =============================================================================
# TESTS: CRÉATION DE COMPTE AUXILIAIRE
# =============================================================================

class TestCreateAuxiliaryAccount:
    """Tests pour la création automatique de comptes auxiliaires"""
    
    def test_create_auxiliary_account_new(self, service, mock_db, mock_supplier):
        """Test: création d'un nouveau compte auxiliaire"""
        # Pas de compte existant
        mock_db.query.return_value.filter.return_value.first.return_value = None
        
        result = service.create_auxiliary_account(mock_supplier)
        
        # Vérifie que le compte a été ajouté
        mock_db.add.assert_called_once()
        mock_db.flush.assert_called_once()
        
        # Vérifie les attributs du compte créé
        created_account = mock_db.add.call_args[0][0]
        assert created_account.account_number == "401SBEE"
        assert created_account.is_auxiliary == True
        assert created_account.is_collective == False
        assert created_account.linked_supplier_id == mock_supplier.id
    
    def test_create_auxiliary_account_existing(self, service, mock_db, mock_supplier, mock_chart_of_accounts):
        """Test: retourne le compte existant s'il existe déjà"""
        # Compte existe déjà
        mock_db.query.return_value.filter.return_value.first.return_value = mock_chart_of_accounts
        
        result = service.create_auxiliary_account(mock_supplier)
        
        # Ne doit pas créer de nouveau compte
        mock_db.add.assert_not_called()
        assert result == mock_chart_of_accounts
    
    def test_create_auxiliary_account_updates_supplier(self, service, mock_db, mock_supplier):
        """Test: mise à jour du fournisseur avec la référence au compte"""
        mock_db.query.return_value.filter.return_value.first.return_value = None
        
        service.create_auxiliary_account(mock_supplier)
        
        # Le fournisseur doit être mis à jour
        assert mock_supplier.auxiliary_account_code == "401SBEE"


# =============================================================================
# TESTS: CRÉATION DE RÈGLE D'IMPUTATION
# =============================================================================

class TestCreateSupplierRule:
    """Tests pour la création de règles d'imputation"""
    
    def test_create_supplier_rule_basic(self, service, mock_db, mock_supplier, mock_chart_of_accounts):
        """Test: création d'une règle basique"""
        mock_db.query.return_value.filter.return_value.first.side_effect = [
            mock_chart_of_accounts,  # get_or_create_auxiliary_account
            None  # Pas de règle existante
        ]
        mock_supplier.auxiliary_account_id = mock_chart_of_accounts.id
        mock_supplier.auxiliary_account_code = "401SBEE"
        
        result = service.create_supplier_rule(
            supplier=mock_supplier,
            charge_account="6061",
            vat_account="4454",
            vat_rate=18.0,
            journal_code="ACH"
        )
        
        # Vérifie que la règle a été créée
        mock_db.add.assert_called()
        
        # Vérifie les attributs de la règle
        created_rule = mock_db.add.call_args[0][0]
        assert "SBEE" in created_rule.name
        assert created_rule.auto_apply == True
    
    def test_create_supplier_rule_with_ocr_keywords(self, service, mock_db, mock_supplier, mock_chart_of_accounts):
        """Test: création avec mots-clés OCR personnalisés"""
        mock_db.query.return_value.filter.return_value.first.return_value = mock_chart_of_accounts
        mock_supplier.auxiliary_account_code = "401SBEE"
        
        keywords = ["SBEE", "Société Béninoise", "Electricité Bénin"]
        
        service.create_supplier_rule(
            supplier=mock_supplier,
            charge_account="6061",
            ocr_keywords=keywords
        )
        
        # Vérifie que les mots-clés ont été ajoutés
        assert mock_supplier.ocr_keywords == keywords
    
    def test_create_supplier_rule_updates_supplier_flags(self, service, mock_db, mock_supplier, mock_chart_of_accounts):
        """Test: mise à jour des flags du fournisseur"""
        mock_db.query.return_value.filter.return_value.first.return_value = mock_chart_of_accounts
        mock_supplier.auxiliary_account_code = "401SBEE"
        
        service.create_supplier_rule(
            supplier=mock_supplier,
            charge_account="6061"
        )
        
        assert mock_supplier.has_active_rule == True
        assert mock_supplier.default_charge_account == "6061"


# =============================================================================
# TESTS: RECONNAISSANCE DE FOURNISSEUR PAR OCR
# =============================================================================

class TestFindSupplierByOcrText:
    """Tests pour la reconnaissance de fournisseurs par texte OCR"""
    
    def test_find_supplier_exact_name_match(self, service, mock_db, mock_supplier):
        """Test: correspondance exacte du nom"""
        mock_db.query.return_value.filter.return_value.all.return_value = [mock_supplier]
        mock_supplier.name = "SBEE"
        mock_supplier.code = "SBEE"
        mock_supplier.ocr_keywords = None
        
        ocr_text = "Facture SBEE du 15/01/2026 - Montant: 150000 FCFA"
        
        supplier, confidence = service.find_supplier_by_ocr_text(ocr_text)
        
        assert supplier == mock_supplier
        assert confidence >= 0.8
    
    def test_find_supplier_by_code(self, service, mock_db, mock_supplier):
        """Test: correspondance par code fournisseur"""
        mock_db.query.return_value.filter.return_value.all.return_value = [mock_supplier]
        mock_supplier.name = "Société Béninoise d'Énergie Électrique"
        mock_supplier.code = "SBEE"
        mock_supplier.ocr_keywords = None
        
        ocr_text = "SBEE - Facture électricité"
        
        supplier, confidence = service.find_supplier_by_ocr_text(ocr_text)
        
        assert supplier == mock_supplier
        assert confidence >= 0.85
    
    def test_find_supplier_by_ocr_keywords(self, service, mock_db, mock_supplier):
        """Test: correspondance par mots-clés OCR"""
        mock_db.query.return_value.filter.return_value.all.return_value = [mock_supplier]
        mock_supplier.name = "SBEE"
        mock_supplier.code = "SBEE"
        mock_supplier.ocr_keywords = ["Société Béninoise d'Énergie", "SBEE SA"]
        
        ocr_text = "Société Béninoise d'Énergie - Consommation électrique"
        
        supplier, confidence = service.find_supplier_by_ocr_text(ocr_text)
        
        assert supplier == mock_supplier
        assert confidence >= 0.75
    
    def test_find_supplier_no_match(self, service, mock_db):
        """Test: aucune correspondance trouvée"""
        mock_db.query.return_value.filter.return_value.all.return_value = []
        
        ocr_text = "Facture inconnue de fournisseur XYZ"
        
        supplier, confidence = service.find_supplier_by_ocr_text(ocr_text)
        
        assert supplier is None
        assert confidence == 0.0
    
    def test_find_supplier_best_match_among_multiple(self, service, mock_db):
        """Test: sélection du meilleur match parmi plusieurs fournisseurs"""
        supplier1 = MagicMock()
        supplier1.name = "MTN"
        supplier1.code = "MTN"
        supplier1.ocr_keywords = None
        
        supplier2 = MagicMock()
        supplier2.name = "MTN Bénin"
        supplier2.code = "MTNBENIN"
        supplier2.ocr_keywords = ["MTN Bénin Mobile", "MTN Bénin SA"]
        
        mock_db.query.return_value.filter.return_value.all.return_value = [supplier1, supplier2]
        
        ocr_text = "Facture MTN Bénin Mobile - Abonnement mensuel"
        
        supplier, confidence = service.find_supplier_by_ocr_text(ocr_text)
        
        # Doit trouver MTN Bénin avec meilleur score (grâce aux mots-clés)
        assert supplier == supplier2


# =============================================================================
# TESTS: GÉNÉRATION D'ÉCRITURES COMPTABLES
# =============================================================================

class TestGenerateEntriesFromInvoice:
    """Tests pour la génération automatique d'écritures"""
    
    def test_generate_entries_with_rule(self, service, mock_db, mock_supplier, mock_rule):
        """Test: génération d'écritures avec règle active"""
        mock_supplier.has_active_rule = True
        mock_supplier.default_rule_id = mock_rule.id
        mock_supplier.auxiliary_account_code = "401SBEE"
        mock_supplier.default_charge_account = "6061"
        mock_supplier.default_vat_account = "4454"
        mock_supplier.default_tax_rate = Decimal("18.00")
        mock_supplier.default_journal = "ACH"
        
        # Mock pour find_supplier_by_ocr_text
        mock_db.query.return_value.filter.return_value.all.return_value = [mock_supplier]
        mock_db.query.return_value.filter.return_value.first.return_value = mock_rule
        
        ocr_data = {
            "supplier_name": "SBEE",
            "raw_text": "Facture SBEE électricité",
            "amount_ht": 100000,
            "amount_vat": 18000,
            "amount_ttc": 118000,
            "date": "2026-01-15",
            "reference_number": "SBEE-2026-001"
        }
        
        document = MagicMock()
        
        result = service.generate_entries_from_invoice(document, ocr_data)
        
        assert result["supplier_found"] == True
        assert result["rule_found"] == True
        assert len(result["entries"]) == 3
        
        # Vérifier les montants
        entries = result["entries"]
        total_debit = sum(e["debit"] for e in entries)
        total_credit = sum(e["credit"] for e in entries)
        assert total_debit == total_credit  # Équilibré
    
    def test_generate_entries_structure(self, service, mock_db, mock_supplier, mock_rule):
        """Test: structure correcte des écritures générées"""
        mock_supplier.has_active_rule = True
        mock_supplier.default_rule_id = mock_rule.id
        mock_supplier.auxiliary_account_code = "401SBEE"
        mock_supplier.default_charge_account = "6061"
        mock_supplier.default_vat_account = "4454"
        mock_supplier.default_tax_rate = Decimal("18.00")
        mock_supplier.default_journal = "ACH"
        
        mock_db.query.return_value.filter.return_value.all.return_value = [mock_supplier]
        mock_db.query.return_value.filter.return_value.first.return_value = mock_rule
        
        ocr_data = {
            "supplier_name": "SBEE",
            "raw_text": "Facture SBEE",
            "amount_ht": 100000,
            "amount_vat": 18000,
            "amount_ttc": 118000,
            "date": "2026-01-15",
            "reference_number": "FAC-001"
        }
        
        result = service.generate_entries_from_invoice(MagicMock(), ocr_data)
        
        entries = result["entries"]
        
        # Ligne 1: Débit compte de charge
        assert entries[0]["account_code"] == "6061"
        assert entries[0]["debit"] == 100000
        assert entries[0]["credit"] == 0
        
        # Ligne 2: Débit TVA
        assert entries[1]["account_code"] == "4454"
        assert entries[1]["debit"] == 18000
        assert entries[1]["credit"] == 0
        
        # Ligne 3: Crédit fournisseur
        assert entries[2]["account_code"] == "401SBEE"
        assert entries[2]["debit"] == 0
        assert entries[2]["credit"] == 118000
    
    def test_generate_entries_without_rule(self, service, mock_db, mock_supplier):
        """Test: fournisseur trouvé mais sans règle"""
        mock_supplier.has_active_rule = False
        mock_supplier.default_rule_id = None
        
        mock_db.query.return_value.filter.return_value.all.return_value = [mock_supplier]
        
        ocr_data = {
            "supplier_name": "SBEE",
            "raw_text": "Facture SBEE",
            "amount_ttc": 118000
        }
        
        result = service.generate_entries_from_invoice(MagicMock(), ocr_data)
        
        assert result["supplier_found"] == True
        assert result["rule_found"] == False
        assert result["status"] == "manual_required"
    
    def test_generate_entries_unknown_supplier(self, service, mock_db):
        """Test: fournisseur inconnu"""
        mock_db.query.return_value.filter.return_value.all.return_value = []
        
        ocr_data = {
            "supplier_name": "Fournisseur Inconnu",
            "raw_text": "Facture mystérieuse",
            "amount_ttc": 50000
        }
        
        result = service.generate_entries_from_invoice(MagicMock(), ocr_data)
        
        assert result["supplier_found"] == False
        assert result["rule_found"] == False
        assert result["status"] == "manual_required"
    
    def test_generate_entries_calculate_vat_from_ttc(self, service, mock_db, mock_supplier, mock_rule):
        """Test: calcul automatique HT/TVA si seulement TTC fourni"""
        mock_supplier.has_active_rule = True
        mock_supplier.default_rule_id = mock_rule.id
        mock_supplier.auxiliary_account_code = "401SBEE"
        mock_supplier.default_charge_account = "6061"
        mock_supplier.default_vat_account = "4454"
        mock_supplier.default_tax_rate = Decimal("18.00")
        mock_supplier.default_journal = "ACH"
        
        mock_db.query.return_value.filter.return_value.all.return_value = [mock_supplier]
        mock_db.query.return_value.filter.return_value.first.return_value = mock_rule
        
        # Seulement TTC fourni
        ocr_data = {
            "supplier_name": "SBEE",
            "raw_text": "Facture SBEE",
            "amount_ht": 0,
            "amount_vat": 0,
            "amount_ttc": 118000,
            "date": "2026-01-15"
        }
        
        result = service.generate_entries_from_invoice(MagicMock(), ocr_data)
        
        entries = result["entries"]
        
        # Vérifie que HT a été calculé: 118000 / 1.18 = 100000
        assert entries[0]["debit"] == pytest.approx(100000, rel=0.01)
        # Vérifie que TVA a été calculée: 118000 - 100000 = 18000
        assert entries[1]["debit"] == pytest.approx(18000, rel=0.01)


# =============================================================================
# TESTS: CRÉATION COMPLÈTE AVEC INTERCONNEXION
# =============================================================================

class TestCreateSupplierWithInterconnection:
    """Tests pour la création complète d'un fournisseur avec interconnexion"""
    
    def test_create_supplier_with_auxiliary_account(self, service, mock_db, tenant_id):
        """Test: création fournisseur avec compte auxiliaire"""
        mock_db.query.return_value.filter.return_value.first.return_value = None
        
        result = service.create_supplier_with_interconnection(
            name="SBEE",
            code="SBEE",
            nif="123456789",
            create_auxiliary_account=True,
            create_rule=False,
            client_id=uuid4()
        )
        
        assert result["supplier"] is not None
        assert result["auxiliary_account"] is not None
        assert result["rule"] is None
        
        # Vérifie que le fournisseur a été créé avec les bons attributs
        supplier = result["supplier"]
        assert supplier.name == "SBEE"
        assert supplier.code == "SBEE"
    
    def test_create_supplier_with_rule(self, service, mock_db, tenant_id):
        """Test: création fournisseur avec règle d'imputation"""
        mock_db.query.return_value.filter.return_value.first.return_value = None
        
        result = service.create_supplier_with_interconnection(
            name="SBEE",
            code="SBEE",
            create_auxiliary_account=True,
            create_rule=True,
            charge_account="6061",
            vat_account="4454",
            vat_rate=18.0,
            journal_code="ACH",
            ocr_keywords=["SBEE", "Société Béninoise"],
            client_id=uuid4()
        )
        
        assert result["supplier"] is not None
        assert result["auxiliary_account"] is not None
        assert result["rule"] is not None
    
    def test_create_supplier_minimal(self, service, mock_db, tenant_id):
        """Test: création minimale sans interconnexion"""
        result = service.create_supplier_with_interconnection(
            name="Fournisseur Test",
            create_auxiliary_account=False,
            create_rule=False,
            client_id=uuid4()
        )
        
        assert result["supplier"] is not None
        assert result["auxiliary_account"] is None
        assert result["rule"] is None


# =============================================================================
# TESTS: FACTORY FUNCTION
# =============================================================================

class TestGetInterconnectionService:
    """Tests pour la factory function"""
    
    def test_get_service_instance(self, mock_db, tenant_id):
        """Test: création d'une instance du service"""
        service = get_interconnection_service(mock_db, tenant_id)
        
        assert isinstance(service, TiersInterconnectionService)
        assert service.db == mock_db
        assert service.tenant_id == tenant_id


# =============================================================================
# TESTS D'INTÉGRATION (SCÉNARIOS COMPLETS)
# =============================================================================

class TestIntegrationScenarios:
    """Tests de scénarios complets d'utilisation"""
    
    def test_scenario_new_supplier_with_full_setup(self, service, mock_db, tenant_id):
        """
        Scénario: Création d'un nouveau fournisseur SBEE complet
        
        1. Créer le fournisseur SBEE
        2. Créer automatiquement le compte 401SBEE
        3. Créer la règle d'imputation
        4. Simuler la réception d'une facture
        5. Vérifier la génération automatique des écritures
        """
        mock_db.query.return_value.filter.return_value.first.return_value = None
        
        # 1-3. Création complète
        result = service.create_supplier_with_interconnection(
            name="SBEE",
            code="SBEE",
            nif="BJ123456789",
            create_auxiliary_account=True,
            create_rule=True,
            charge_account="6061",
            vat_account="4454",
            vat_rate=18.0,
            journal_code="ACH",
            ocr_keywords=["SBEE", "Société Béninoise d'Énergie Électrique"],
            client_id=uuid4()
        )
        
        supplier = result["supplier"]
        
        assert supplier.name == "SBEE"
        assert supplier.has_active_rule == True
        
        # Simuler la configuration après création
        supplier.auxiliary_account_code = "401SBEE"
        supplier.default_charge_account = "6061"
        supplier.default_vat_account = "4454"
        supplier.default_tax_rate = Decimal("18.00")
        supplier.default_journal = "ACH"
        
        # Mock pour la recherche de fournisseur
        mock_db.query.return_value.filter.return_value.all.return_value = [supplier]
        mock_rule = MagicMock()
        mock_rule.id = supplier.default_rule_id
        mock_rule.is_active = True
        mock_rule.actions = [
            {"type": "assign_account", "debit_account": "6061", "credit_account": "401SBEE", "vat_account": "4454"},
            {"type": "set_vat_rate", "vat_rate": 18}
        ]
        mock_db.query.return_value.filter.return_value.first.return_value = mock_rule
        
        # 4. Simuler réception facture
        ocr_data = {
            "supplier_name": "SBEE",
            "raw_text": "SBEE Facture d'électricité Janvier 2026",
            "amount_ht": 84746,
            "amount_vat": 15254,
            "amount_ttc": 100000,
            "date": "2026-01-15",
            "reference_number": "SBEE-2026-00123"
        }
        
        # 5. Génération des écritures
        entries_result = service.generate_entries_from_invoice(MagicMock(), ocr_data)
        
        assert entries_result["supplier_found"] == True
        assert entries_result["rule_found"] == True
        assert entries_result["status"] in ["pre_processed", "needs_validation"]
        
        entries = entries_result["entries"]
        assert len(entries) == 3
        
        # Vérifier équilibre
        total_debit = sum(e["debit"] for e in entries)
        total_credit = sum(e["credit"] for e in entries)
        assert abs(total_debit - total_credit) < 0.01
    
    def test_scenario_unknown_supplier_manual_process(self, service, mock_db):
        """
        Scénario: Facture d'un fournisseur inconnu
        
        Doit retourner un statut "manual_required"
        """
        mock_db.query.return_value.filter.return_value.all.return_value = []
        
        ocr_data = {
            "supplier_name": "Imprimerie Express",
            "raw_text": "Imprimerie Express - Facture impression",
            "amount_ttc": 50000
        }
        
        result = service.generate_entries_from_invoice(MagicMock(), ocr_data)
        
        assert result["supplier_found"] == False
        assert result["status"] == "manual_required"


# =============================================================================
# RUN TESTS
# =============================================================================

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
