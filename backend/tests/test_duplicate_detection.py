"""
Tests pour le service de détection de doublons
==============================================

Tests couvrant:
1. Détection par N° facture identique
2. Détection par montant + date identiques
3. Non-détection pour cas légitimes (abonnements)
4. Résolution de doublons (reject/keep_both/replace)
5. Comparaison de documents
6. Historique des doublons
"""

import pytest
from unittest.mock import MagicMock, patch
from uuid import uuid4
from datetime import date, datetime
from decimal import Decimal

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.services.duplicate_detection import DuplicateDetectionService
from app.models.duplicate import DuplicateDetectionReason, DuplicateResolution


# =============================================================================
# FIXTURES
# =============================================================================

@pytest.fixture
def mock_db():
    """Mock de la session SQLAlchemy"""
    db = MagicMock()
    return db


@pytest.fixture
def tenant_id():
    """ID tenant de test"""
    return str(uuid4())


@pytest.fixture
def service(mock_db, tenant_id):
    """Instance du service"""
    return DuplicateDetectionService(mock_db, tenant_id)


@pytest.fixture
def mock_document():
    """Document mock"""
    doc = MagicMock()
    doc.id = uuid4()
    doc.tenant_id = str(uuid4())
    doc.supplier_name = "SBEE"
    doc.supplier_id = uuid4()
    doc.reference_number = "SBEE-2024-0892"
    doc.document_date = date(2026, 1, 5)
    doc.due_date = date(2026, 2, 5)
    doc.amount_ht = Decimal("100000")
    doc.amount_vat = Decimal("18000")
    doc.amount_ttc = Decimal("118000")
    doc.status = MagicMock(value="validated")
    doc.created_at = datetime(2026, 1, 6, 10, 0, 0)
    doc.validated_at = datetime(2026, 1, 7, 14, 30, 0)
    doc.exported_at = None
    doc.file_url = "/files/sbee-2024-0892.pdf"
    doc.filename = "facture_sbee.pdf"
    doc.ai_extracted_data = {}
    return doc


@pytest.fixture
def mock_document_2():
    """Second document mock pour comparaison"""
    doc = MagicMock()
    doc.id = uuid4()
    doc.tenant_id = str(uuid4())
    doc.supplier_name = "SBEE"
    doc.supplier_id = uuid4()
    doc.reference_number = "SBEE-2024-0892"
    doc.document_date = date(2026, 1, 5)
    doc.due_date = date(2026, 2, 5)
    doc.amount_ht = Decimal("100000")
    doc.amount_vat = Decimal("18000")
    doc.amount_ttc = Decimal("118000")
    doc.status = MagicMock(value="pending")
    doc.created_at = datetime(2026, 1, 10, 9, 0, 0)
    doc.validated_at = None
    doc.exported_at = None
    doc.file_url = "/files/sbee-2024-0892-copy.pdf"
    doc.filename = "facture_sbee_copy.pdf"
    doc.ai_extracted_data = {}
    return doc


# =============================================================================
# TESTS: DÉTECTION DE DOUBLONS
# =============================================================================

class TestDuplicateDetection:
    """Tests pour la détection de doublons"""
    
    def test_detect_by_invoice_number(self, service, mock_db, mock_document):
        """
        Test: Même fournisseur + Même N° facture = DOUBLON
        
        Scénario: Upload d'une facture SBEE-2024-0892 alors qu'elle existe déjà
        """
        # Setup: Le document existe déjà
        mock_db.query.return_value.filter.return_value.filter.return_value.first.return_value = mock_document
        
        # Act
        result = service.detect_duplicate(
            supplier_name="SBEE",
            invoice_number="SBEE-2024-0892",
            amount_ttc=118000,
            invoice_date=date(2026, 1, 5)
        )
        
        # Assert
        assert result is not None
        assert result["is_duplicate"] == True
        assert result["reason"] == DuplicateReason.SAME_INVOICE_NUMBER.value
        assert "Même fournisseur + Même N° facture" in result["reason_text"]
        assert result["existing_document"]["reference_number"] == "SBEE-2024-0892"
    
    def test_detect_by_amount_and_date(self, service, mock_db, mock_document):
        """
        Test: Même fournisseur + Même montant + Même date = DOUBLON
        
        Scénario: Upload sans N° facture mais même fournisseur/montant/date
        """
        # Setup: Pas de match par N° facture, mais match par montant+date
        mock_db.query.return_value.filter.return_value.filter.return_value.first.side_effect = [
            None,  # Pas de match par N° facture
            mock_document  # Match par montant + date
        ]
        
        # Act
        result = service.detect_duplicate(
            supplier_name="SBEE",
            invoice_number=None,  # Pas de N° facture
            amount_ttc=118000,
            invoice_date=date(2026, 1, 5)
        )
        
        # Assert
        assert result is not None
        assert result["is_duplicate"] == True
        assert result["reason"] == DuplicateReason.SAME_AMOUNT_DATE.value
    
    def test_no_duplicate_different_invoice_number(self, service, mock_db):
        """
        Test: Même fournisseur + N° facture différent = PAS DE DOUBLON
        
        Scénario: Abonnement mensuel Canal+ (N° différent chaque mois)
        """
        # Setup: Aucun match
        mock_db.query.return_value.filter.return_value.filter.return_value.first.return_value = None
        
        # Act
        result = service.detect_duplicate(
            supplier_name="Canal+",
            invoice_number="CP-2026-002",  # Février
            amount_ttc=25000,
            invoice_date=date(2026, 2, 15)
        )
        
        # Assert
        assert result is None  # Pas de doublon
    
    def test_no_duplicate_different_date(self, service, mock_db):
        """
        Test: Même fournisseur + Même montant + Date différente = PAS DE DOUBLON
        
        Scénario: Abonnement téléphone mensuel
        """
        # Setup: Aucun match
        mock_db.query.return_value.filter.return_value.filter.return_value.first.return_value = None
        
        # Act - Facture janvier
        result1 = service.detect_duplicate(
            supplier_name="MTN",
            invoice_number="MTN-2026-001",
            amount_ttc=35000,
            invoice_date=date(2026, 1, 15)
        )
        
        # Assert
        assert result1 is None  # Pas de doublon car dates différentes
    
    def test_no_duplicate_different_amount(self, service, mock_db):
        """
        Test: Même fournisseur + Même date + Montant différent = PAS DE DOUBLON
        
        Scénario: Deux factures SBEE le même jour mais montants différents
        """
        # Setup: Aucun match
        mock_db.query.return_value.filter.return_value.filter.return_value.first.return_value = None
        
        # Act
        result = service.detect_duplicate(
            supplier_name="SBEE",
            invoice_number="SBEE-2024-0893",  # N° différent
            amount_ttc=250000,  # Montant différent
            invoice_date=date(2026, 1, 5)
        )
        
        # Assert
        assert result is None
    
    def test_no_duplicate_different_supplier(self, service, mock_db):
        """
        Test: Fournisseur différent = PAS DE DOUBLON (même si même montant/date)
        """
        # Setup: Aucun match
        mock_db.query.return_value.filter.return_value.filter.return_value.first.return_value = None
        
        # Act
        result = service.detect_duplicate(
            supplier_name="SONEB",  # Fournisseur différent
            invoice_number=None,
            amount_ttc=118000,  # Même montant qu'une facture SBEE
            invoice_date=date(2026, 1, 5)
        )
        
        # Assert
        assert result is None
    
    def test_exclude_document_id(self, service, mock_db, mock_document):
        """
        Test: Exclure un document de la recherche (pour édition)
        """
        # Setup
        mock_db.query.return_value.filter.return_value.filter.return_value.filter.return_value.first.return_value = None
        
        # Act
        result = service.detect_duplicate(
            supplier_name="SBEE",
            invoice_number="SBEE-2024-0892",
            exclude_document_id=str(mock_document.id)  # Exclure ce document
        )
        
        # Assert - Ne devrait pas se trouver lui-même
        assert result is None


# =============================================================================
# TESTS: RÉSOLUTION DE DOUBLONS
# =============================================================================

class TestDuplicateResolution:
    """Tests pour la résolution de doublons"""
    
    def test_resolve_reject(self, service, mock_db, mock_document, mock_document_2):
        """Test: Rejeter la nouvelle facture"""
        # Setup
        mock_db.query.return_value.filter.return_value.first.side_effect = [
            mock_document_2,  # Nouveau document
            mock_document     # Document existant
        ]
        
        # Act
        result = service.resolve_duplicate(
            new_document_id=str(mock_document_2.id),
            existing_document_id=str(mock_document.id),
            action=DuplicateAction.REJECT,
            resolved_by="user123"
        )
        
        # Assert
        assert result["success"] == True
        assert result["action"] == "reject"
        assert "rejetée" in result["message"].lower()
    
    def test_resolve_keep_both_with_reason(self, service, mock_db, mock_document, mock_document_2):
        """Test: Conserver les deux avec motif"""
        # Setup
        mock_db.query.return_value.filter.return_value.first.side_effect = [
            mock_document_2,
            mock_document
        ]
        
        # Act
        result = service.resolve_duplicate(
            new_document_id=str(mock_document_2.id),
            existing_document_id=str(mock_document.id),
            action=DuplicateAction.KEEP_BOTH,
            reason="Facture rectificative",
            resolved_by="user123"
        )
        
        # Assert
        assert result["success"] == True
        assert result["action"] == "keep_both"
        assert "conservées" in result["message"].lower()
    
    def test_resolve_keep_both_without_reason_fails(self, service, mock_db, mock_document, mock_document_2):
        """Test: Conserver les deux SANS motif = ERREUR"""
        # Setup
        mock_db.query.return_value.filter.return_value.first.side_effect = [
            mock_document_2,
            mock_document
        ]
        
        # Act
        result = service.resolve_duplicate(
            new_document_id=str(mock_document_2.id),
            existing_document_id=str(mock_document.id),
            action=DuplicateAction.KEEP_BOTH,
            reason="",  # Motif vide
            resolved_by="user123"
        )
        
        # Assert
        assert result["success"] == False
        assert "obligatoire" in result["error"].lower()
    
    def test_resolve_replace(self, service, mock_db, mock_document, mock_document_2):
        """Test: Remplacer l'existante par la nouvelle"""
        # Setup
        mock_db.query.return_value.filter.return_value.first.side_effect = [
            mock_document_2,
            mock_document
        ]
        
        # Act
        result = service.resolve_duplicate(
            new_document_id=str(mock_document_2.id),
            existing_document_id=str(mock_document.id),
            action=DuplicateAction.REPLACE,
            resolved_by="user123"
        )
        
        # Assert
        assert result["success"] == True
        assert result["action"] == "replace"
        assert "archivée" in result["message"].lower()
    
    def test_resolve_document_not_found(self, service, mock_db):
        """Test: Document non trouvé"""
        # Setup
        mock_db.query.return_value.filter.return_value.first.return_value = None
        
        # Act
        result = service.resolve_duplicate(
            new_document_id=str(uuid4()),
            existing_document_id=str(uuid4()),
            action=DuplicateAction.REJECT
        )
        
        # Assert
        assert result["success"] == False
        assert "non trouvé" in result["error"].lower()


# =============================================================================
# TESTS: COMPARAISON DE DOCUMENTS
# =============================================================================

class TestDocumentComparison:
    """Tests pour la comparaison de documents"""
    
    def test_compare_identical_documents(self, service, mock_db, mock_document, mock_document_2):
        """Test: Comparaison de documents identiques"""
        # Setup - Même valeurs
        mock_document_2.supplier_name = mock_document.supplier_name
        mock_document_2.reference_number = mock_document.reference_number
        mock_document_2.document_date = mock_document.document_date
        mock_document_2.amount_ht = mock_document.amount_ht
        mock_document_2.amount_vat = mock_document.amount_vat
        mock_document_2.amount_ttc = mock_document.amount_ttc
        
        mock_db.query.return_value.filter.return_value.first.side_effect = [
            mock_document,
            mock_document_2
        ]
        
        # Act
        result = service.compare_documents(
            str(mock_document.id),
            str(mock_document_2.id)
        )
        
        # Assert
        assert result["all_identical"] == True
        assert "DOUBLON" in result["conclusion"]
        assert result["identical_fields"] == result["total_fields"]
    
    def test_compare_different_documents(self, service, mock_db, mock_document, mock_document_2):
        """Test: Comparaison de documents avec différences"""
        # Setup - Montants différents
        mock_document_2.amount_ttc = Decimal("150000")  # Différent
        
        mock_db.query.return_value.filter.return_value.first.side_effect = [
            mock_document,
            mock_document_2
        ]
        
        # Act
        result = service.compare_documents(
            str(mock_document.id),
            str(mock_document_2.id)
        )
        
        # Assert
        assert result["all_identical"] == False
        assert "DIFFÉRENCES" in result["conclusion"]
        assert result["identical_fields"] < result["total_fields"]
    
    def test_compare_document_not_found(self, service, mock_db):
        """Test: Document non trouvé"""
        mock_db.query.return_value.filter.return_value.first.return_value = None
        
        result = service.compare_documents(str(uuid4()), str(uuid4()))
        
        assert "error" in result


# =============================================================================
# TESTS: HISTORIQUE ET STATISTIQUES
# =============================================================================

class TestHistoryAndStats:
    """Tests pour l'historique et les statistiques"""
    
    def test_get_duplicate_history(self, service, mock_db, mock_document):
        """Test: Récupération de l'historique"""
        # Setup
        mock_document.status = MagicMock()
        mock_document.status.value = "rejected"
        mock_document.ai_extracted_data = {
            "duplicate_resolution": {
                "action": "reject",
                "existing_document_id": str(uuid4()),
                "resolved_by": "user123",
                "resolved_at": "2026-01-15T10:00:00"
            }
        }
        mock_document.updated_at = datetime(2026, 1, 15, 10, 0, 0)
        
        mock_db.query.return_value.filter.return_value.order_by.return_value.limit.return_value.offset.return_value.all.return_value = [mock_document]
        
        # Act
        history = service.get_duplicate_history()
        
        # Assert
        assert len(history) == 1
        assert history[0]["action"] == "reject"
    
    def test_get_all_duplicates_groups(self, service, mock_db, mock_document, mock_document_2):
        """Test: Groupes de doublons"""
        # Setup - Deux documents avec même N° facture
        mock_document_2.reference_number = mock_document.reference_number
        mock_document_2.supplier_name = mock_document.supplier_name
        
        mock_db.query.return_value.filter.return_value.all.return_value = [
            mock_document,
            mock_document_2
        ]
        
        # Act
        groups = service.get_all_duplicates()
        
        # Assert
        assert len(groups) == 1
        assert groups[0]["count"] == 2
        assert groups[0]["reference_number"] == mock_document.reference_number


# =============================================================================
# TESTS: CAS RÉELS - SCÉNARIOS MÉTIER
# =============================================================================

class TestRealWorldScenarios:
    """Tests de scénarios métier réels"""
    
    def test_scenario_abonnement_mensuel_canal_plus(self, service, mock_db):
        """
        Scénario: Factures Canal+ mensuelles
        
        - Janvier: CP-2026-001, 25000 FCFA, 15/01/2026
        - Février: CP-2026-002, 25000 FCFA, 15/02/2026
        - Mars: CP-2026-003, 25000 FCFA, 15/03/2026
        
        Aucun ne doit être détecté comme doublon car N° différents
        """
        mock_db.query.return_value.filter.return_value.filter.return_value.first.return_value = None
        
        # Janvier
        result_jan = service.detect_duplicate(
            supplier_name="Canal+",
            invoice_number="CP-2026-001",
            amount_ttc=25000,
            invoice_date=date(2026, 1, 15)
        )
        assert result_jan is None
        
        # Février
        result_feb = service.detect_duplicate(
            supplier_name="Canal+",
            invoice_number="CP-2026-002",
            amount_ttc=25000,
            invoice_date=date(2026, 2, 15)
        )
        assert result_feb is None
    
    def test_scenario_vraie_facture_doublon(self, service, mock_db, mock_document):
        """
        Scénario: Vraie facture uploadée deux fois
        
        La même facture SBEE-2024-0892 est uploadée deux fois
        → Doit être détectée comme doublon
        """
        mock_db.query.return_value.filter.return_value.filter.return_value.first.return_value = mock_document
        
        result = service.detect_duplicate(
            supplier_name="SBEE",
            invoice_number="SBEE-2024-0892",
            amount_ttc=118000,
            invoice_date=date(2026, 1, 5)
        )
        
        assert result is not None
        assert result["is_duplicate"] == True
        assert result["reason"] == "same_invoice_number"
    
    def test_scenario_facture_rectificative(self, service, mock_db, mock_document, mock_document_2):
        """
        Scénario: Facture rectificative
        
        Fournisseur envoie une nouvelle version de la facture.
        L'utilisateur choisit "Remplacer".
        """
        mock_db.query.return_value.filter.return_value.first.side_effect = [
            mock_document_2,
            mock_document
        ]
        
        result = service.resolve_duplicate(
            new_document_id=str(mock_document_2.id),
            existing_document_id=str(mock_document.id),
            action=DuplicateAction.REPLACE,
            resolved_by="comptable"
        )
        
        assert result["success"] == True
        assert result["action"] == "replace"


# =============================================================================
# TESTS: FACTORY
# =============================================================================

class TestFactory:
    """Tests pour la factory function"""
    
    def test_get_service_instance(self, mock_db, tenant_id):
        """Test création d'instance via factory"""
        service = get_duplicate_detection_service(mock_db, tenant_id)
        
        assert isinstance(service, DuplicateDetectionService)
        assert service.tenant_id == tenant_id
        assert service.db == mock_db


# =============================================================================
# RUN TESTS
# =============================================================================

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
