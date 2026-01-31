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
from unittest.mock import MagicMock, patch, PropertyMock
from uuid import uuid4
from datetime import date, datetime
from decimal import Decimal

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.services.duplicate_detection import DuplicateDetectionService
from app.models.duplicate import DuplicateDetectionReason, DuplicateResolution, DocumentDuplicate
from app.models.document import DocumentStatus


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
    doc.status = DocumentStatus.VALIDEE
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
    doc.status = DocumentStatus.A_TRAITER
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
        mock_db.query.return_value.filter.return_value.first.return_value = mock_document

        # Act
        result = service.detect_duplicate(
            supplier_name="SBEE",
            invoice_number="SBEE-2024-0892",
            amount_ttc=118000.0,
            document_date=date(2026, 1, 5)
        )

        # Assert
        assert result is not None
        existing_doc, reason = result
        assert existing_doc == mock_document
        assert reason == DuplicateDetectionReason.SAME_INVOICE_NUMBER

    def test_detect_by_amount_and_date(self, service, mock_db, mock_document):
        """
        Test: Même fournisseur + Même montant + Même date = DOUBLON

        Scénario: Upload sans N° facture mais même fournisseur/montant/date
        """
        # Setup: Match par montant+date (critère 1 n'est pas testé car invoice_number=None)
        mock_db.query.return_value.filter.return_value.first.return_value = mock_document

        # Act
        result = service.detect_duplicate(
            supplier_name="SBEE",
            invoice_number=None,  # Pas de N° facture → skip critère 1
            amount_ttc=118000.0,
            document_date=date(2026, 1, 5)
        )

        # Assert
        assert result is not None
        existing_doc, reason = result
        assert reason == DuplicateDetectionReason.SAME_AMOUNT_DATE

    def test_no_duplicate_different_invoice_number(self, service, mock_db):
        """
        Test: Même fournisseur + N° facture différent = PAS DE DOUBLON

        Scénario: Abonnement mensuel Canal+ (N° différent chaque mois)
        """
        # Setup: Aucun match
        mock_db.query.return_value.filter.return_value.first.return_value = None

        # Act
        result = service.detect_duplicate(
            supplier_name="Canal+",
            invoice_number="CP-2026-002",  # Février
            amount_ttc=25000.0,
            document_date=date(2026, 2, 15)
        )

        # Assert
        assert result is None  # Pas de doublon

    def test_no_duplicate_different_date(self, service, mock_db):
        """
        Test: Même fournisseur + Même montant + Date différente = PAS DE DOUBLON

        Scénario: Abonnement téléphone mensuel
        """
        # Setup: Aucun match
        mock_db.query.return_value.filter.return_value.first.return_value = None

        # Act - Facture janvier
        result = service.detect_duplicate(
            supplier_name="MTN",
            invoice_number="MTN-2026-001",
            amount_ttc=35000.0,
            document_date=date(2026, 1, 15)
        )

        # Assert
        assert result is None  # Pas de doublon car dates différentes

    def test_no_duplicate_different_amount(self, service, mock_db):
        """
        Test: Même fournisseur + Même date + Montant différent = PAS DE DOUBLON

        Scénario: Deux factures SBEE le même jour mais montants différents
        """
        # Setup: Aucun match
        mock_db.query.return_value.filter.return_value.first.return_value = None

        # Act
        result = service.detect_duplicate(
            supplier_name="SBEE",
            invoice_number="SBEE-2024-0893",  # N° différent
            amount_ttc=250000.0,  # Montant différent
            document_date=date(2026, 1, 5)
        )

        # Assert
        assert result is None

    def test_no_duplicate_different_supplier(self, service, mock_db):
        """
        Test: Fournisseur différent = PAS DE DOUBLON (même si même montant/date)
        """
        # Setup: Aucun match
        mock_db.query.return_value.filter.return_value.first.return_value = None

        # Act
        result = service.detect_duplicate(
            supplier_name="SONEB",  # Fournisseur différent
            invoice_number=None,
            amount_ttc=118000.0,  # Même montant qu'une facture SBEE
            document_date=date(2026, 1, 5)
        )

        # Assert
        assert result is None

    def test_detect_with_partial_supplier_match(self, service, mock_db, mock_document):
        """
        Test: Match partiel du nom fournisseur (ilike)
        """
        # Setup
        mock_db.query.return_value.filter.return_value.first.return_value = mock_document

        # Act - Recherche avec nom partiel
        result = service.detect_duplicate(
            supplier_name="sbee",  # Minuscules
            invoice_number="SBEE-2024-0892",
            amount_ttc=118000.0,
            document_date=date(2026, 1, 5)
        )

        # Assert - Doit trouver grâce à ilike
        assert result is not None


# =============================================================================
# TESTS: CRÉATION D'ENREGISTREMENT DE DOUBLON
# =============================================================================

class TestDuplicateRecordCreation:
    """Tests pour la création d'enregistrements de doublon"""

    def test_create_duplicate_record(self, service, mock_db):
        """Test: Création d'un enregistrement de doublon"""
        new_doc_id = str(uuid4())
        existing_doc_id = str(uuid4())

        # Act
        result = service.create_duplicate_record(
            new_document_id=new_doc_id,
            existing_document_id=existing_doc_id,
            detection_reason=DuplicateDetectionReason.SAME_INVOICE_NUMBER,
            comparison_data='{"all_identical": true}'
        )

        # Assert
        mock_db.add.assert_called_once()
        mock_db.flush.assert_called_once()

    def test_create_duplicate_record_amount_date(self, service, mock_db):
        """Test: Création avec raison SAME_AMOUNT_DATE"""
        new_doc_id = str(uuid4())
        existing_doc_id = str(uuid4())

        # Act
        result = service.create_duplicate_record(
            new_document_id=new_doc_id,
            existing_document_id=existing_doc_id,
            detection_reason=DuplicateDetectionReason.SAME_AMOUNT_DATE
        )

        # Assert
        mock_db.add.assert_called_once()


# =============================================================================
# TESTS: RÉSOLUTION DE DOUBLONS
# =============================================================================

class TestDuplicateResolution:
    """Tests pour la résolution de doublons"""

    def test_resolve_reject(self, service, mock_db, mock_document, mock_document_2):
        """Test: Rejeter la nouvelle facture"""
        # Setup
        mock_duplicate = MagicMock(spec=DocumentDuplicate)
        mock_duplicate.id = uuid4()
        mock_duplicate.new_document_id = mock_document_2.id
        mock_duplicate.existing_document_id = mock_document.id

        mock_db.query.return_value.filter.return_value.first.side_effect = [
            mock_duplicate,  # Duplicate record
            mock_document_2   # New document
        ]

        # Act
        result = service.resolve_duplicate(
            duplicate_id=str(mock_duplicate.id),
            resolution="rejected",
            user_id="user123"
        )

        # Assert
        assert result.resolution == DuplicateResolution.REJECTED
        assert mock_document_2.status == DocumentStatus.REJECTED

    def test_resolve_keep_both_with_reason(self, service, mock_db, mock_document, mock_document_2):
        """Test: Conserver les deux avec motif"""
        # Setup
        mock_duplicate = MagicMock(spec=DocumentDuplicate)
        mock_duplicate.id = uuid4()
        mock_duplicate.new_document_id = mock_document_2.id

        mock_db.query.return_value.filter.return_value.first.side_effect = [
            mock_duplicate,
            mock_document_2
        ]

        # Act
        result = service.resolve_duplicate(
            duplicate_id=str(mock_duplicate.id),
            resolution="kept_both",
            user_id="user123",
            resolution_reason="Facture rectificative"
        )

        # Assert
        assert result.resolution == DuplicateResolution.KEPT_BOTH
        assert result.resolution_reason == "Facture rectificative"
        assert mock_document_2.status == DocumentStatus.PRE_TRAITEE

    def test_resolve_replace(self, service, mock_db, mock_document, mock_document_2):
        """Test: Remplacer l'existante par la nouvelle"""
        # Setup
        mock_duplicate = MagicMock(spec=DocumentDuplicate)
        mock_duplicate.id = uuid4()
        mock_duplicate.existing_document_id = mock_document.id

        mock_db.query.return_value.filter.return_value.first.side_effect = [
            mock_duplicate,
            mock_document  # Existing document to archive
        ]

        # Act
        result = service.resolve_duplicate(
            duplicate_id=str(mock_duplicate.id),
            resolution="replaced",
            user_id="user123"
        )

        # Assert
        assert result.resolution == DuplicateResolution.REPLACED
        assert mock_document.is_archived == True
        assert mock_document.status == DocumentStatus.ARCHIVED

    def test_resolve_document_not_found(self, service, mock_db):
        """Test: Document non trouvé"""
        # Setup
        mock_db.query.return_value.filter.return_value.first.return_value = None

        # Act & Assert
        with pytest.raises(ValueError, match="not found"):
            service.resolve_duplicate(
                duplicate_id=str(uuid4()),
                resolution="rejected",
                user_id="user123"
            )


# =============================================================================
# TESTS: COMPARAISON DE DOCUMENTS
# =============================================================================

class TestDocumentComparison:
    """Tests pour la comparaison de documents"""

    def test_compare_identical_documents(self, service, mock_document, mock_document_2):
        """Test: Comparaison de documents identiques"""
        # Setup - Même valeurs
        mock_document_2.supplier_name = mock_document.supplier_name
        mock_document_2.reference_number = mock_document.reference_number
        mock_document_2.document_date = mock_document.document_date
        mock_document_2.amount_ht = mock_document.amount_ht
        mock_document_2.amount_vat = mock_document.amount_vat
        mock_document_2.amount_ttc = mock_document.amount_ttc

        # Act
        result = service.compare_documents(mock_document, mock_document_2)

        # Assert
        assert result["all_identical"] == True
        assert len(result["fields"]) > 0

    def test_compare_different_documents(self, service, mock_document, mock_document_2):
        """Test: Comparaison de documents avec différences"""
        # Setup - Montants différents
        mock_document_2.amount_ttc = Decimal("150000")

        # Act
        result = service.compare_documents(mock_document, mock_document_2)

        # Assert
        assert result["all_identical"] == False

    def test_compare_missing_values(self, service, mock_document, mock_document_2):
        """Test: Comparaison avec valeurs manquantes"""
        # Setup
        mock_document.reference_number = None
        mock_document_2.reference_number = "TEST-001"

        # Act
        result = service.compare_documents(mock_document, mock_document_2)

        # Assert
        assert result["all_identical"] == False


# =============================================================================
# TESTS: HISTORIQUE ET STATISTIQUES
# =============================================================================

class TestHistoryAndStats:
    """Tests pour l'historique et les statistiques"""

    def test_get_duplicate_history(self, service, mock_db, tenant_id):
        """Test: Récupération de l'historique"""
        # Setup
        mock_duplicate = MagicMock(spec=DocumentDuplicate)
        mock_duplicate.id = uuid4()
        mock_duplicate.resolution = DuplicateResolution.REJECTED
        mock_duplicate.resolved_at = datetime(2026, 1, 15, 10, 0, 0)

        mock_db.query.return_value.filter.return_value.order_by.return_value.offset.return_value.limit.return_value.all.return_value = [mock_duplicate]

        # Act
        history = service.get_duplicate_history()

        # Assert
        assert len(history) == 1
        assert history[0].resolution == DuplicateResolution.REJECTED

    def test_get_pending_duplicates(self, service, mock_db):
        """Test: Récupération des doublons en attente"""
        # Setup
        mock_duplicate = MagicMock(spec=DocumentDuplicate)
        mock_duplicate.id = uuid4()
        mock_duplicate.resolution = None  # Non résolu

        mock_db.query.return_value.filter.return_value.order_by.return_value.all.return_value = [mock_duplicate]

        # Act
        pending = service.get_pending_duplicates()

        # Assert
        assert len(pending) == 1
        assert pending[0].resolution is None

    def test_get_duplicate_history_pagination(self, service, mock_db):
        """Test: Pagination de l'historique"""
        # Setup
        mock_db.query.return_value.filter.return_value.order_by.return_value.offset.return_value.limit.return_value.all.return_value = []

        # Act
        history = service.get_duplicate_history(limit=10, offset=20)

        # Assert - Vérifie que les paramètres sont passés
        mock_db.query.return_value.filter.return_value.order_by.return_value.offset.assert_called_with(20)
        mock_db.query.return_value.filter.return_value.order_by.return_value.offset.return_value.limit.assert_called_with(10)


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
        mock_db.query.return_value.filter.return_value.first.return_value = None

        # Janvier
        result_jan = service.detect_duplicate(
            supplier_name="Canal+",
            invoice_number="CP-2026-001",
            amount_ttc=25000.0,
            document_date=date(2026, 1, 15)
        )
        assert result_jan is None

        # Février
        result_feb = service.detect_duplicate(
            supplier_name="Canal+",
            invoice_number="CP-2026-002",
            amount_ttc=25000.0,
            document_date=date(2026, 2, 15)
        )
        assert result_feb is None

        # Mars
        result_mar = service.detect_duplicate(
            supplier_name="Canal+",
            invoice_number="CP-2026-003",
            amount_ttc=25000.0,
            document_date=date(2026, 3, 15)
        )
        assert result_mar is None

    def test_scenario_vraie_facture_doublon(self, service, mock_db, mock_document):
        """
        Scénario: Vraie facture uploadée deux fois

        La même facture SBEE-2024-0892 est uploadée deux fois
        → Doit être détectée comme doublon
        """
        mock_db.query.return_value.filter.return_value.first.return_value = mock_document

        result = service.detect_duplicate(
            supplier_name="SBEE",
            invoice_number="SBEE-2024-0892",
            amount_ttc=118000.0,
            document_date=date(2026, 1, 5)
        )

        assert result is not None
        existing_doc, reason = result
        assert reason == DuplicateDetectionReason.SAME_INVOICE_NUMBER

    def test_scenario_facture_meme_jour_sans_numero(self, service, mock_db, mock_document):
        """
        Scénario: Deux uploads le même jour, même montant, pas de N° facture

        → Doit être détecté comme doublon par critère 2
        """
        # Quand invoice_number=None, seul le critère 2 est testé
        mock_db.query.return_value.filter.return_value.first.return_value = mock_document

        result = service.detect_duplicate(
            supplier_name="SBEE",
            invoice_number=None,  # Pas de N° → skip critère 1
            amount_ttc=118000.0,
            document_date=date(2026, 1, 5)
        )

        assert result is not None
        existing_doc, reason = result
        assert reason == DuplicateDetectionReason.SAME_AMOUNT_DATE

    def test_scenario_facture_rectificative(self, service, mock_db, mock_document, mock_document_2):
        """
        Scénario: Facture rectificative

        Fournisseur envoie une nouvelle version de la facture.
        L'utilisateur choisit "Remplacer".
        """
        mock_duplicate = MagicMock(spec=DocumentDuplicate)
        mock_duplicate.id = uuid4()
        mock_duplicate.existing_document_id = mock_document.id

        mock_db.query.return_value.filter.return_value.first.side_effect = [
            mock_duplicate,
            mock_document
        ]

        result = service.resolve_duplicate(
            duplicate_id=str(mock_duplicate.id),
            resolution="replaced",
            user_id="comptable"
        )

        assert result.resolution == DuplicateResolution.REPLACED
        assert mock_document.is_archived == True


# =============================================================================
# TESTS: EDGE CASES
# =============================================================================

class TestEdgeCases:
    """Tests pour les cas limites"""

    def test_detect_with_none_supplier(self, service, mock_db):
        """Test: Supplier name est None"""
        result = service.detect_duplicate(
            supplier_name=None,
            invoice_number="TEST-001",
            amount_ttc=100.0,
            document_date=date(2026, 1, 1)
        )
        # Ne devrait pas lever d'exception
        assert result is None

    def test_detect_with_empty_invoice_number(self, service, mock_db):
        """Test: Invoice number est une chaîne vide"""
        mock_db.query.return_value.filter.return_value.first.return_value = None

        result = service.detect_duplicate(
            supplier_name="SBEE",
            invoice_number="",
            amount_ttc=100.0,
            document_date=date(2026, 1, 1)
        )
        assert result is None

    def test_detect_with_zero_amount(self, service, mock_db):
        """Test: Montant à zéro"""
        mock_db.query.return_value.filter.return_value.first.return_value = None

        result = service.detect_duplicate(
            supplier_name="SBEE",
            invoice_number=None,
            amount_ttc=0.0,
            document_date=date(2026, 1, 1)
        )
        # Ne devrait pas lever d'exception
        assert result is None

    def test_detect_with_negative_amount(self, service, mock_db):
        """Test: Montant négatif (avoir)"""
        mock_db.query.return_value.filter.return_value.first.return_value = None

        result = service.detect_duplicate(
            supplier_name="SBEE",
            invoice_number="AVOIR-001",
            amount_ttc=-50000.0,
            document_date=date(2026, 1, 1)
        )
        assert result is None


# =============================================================================
# RUN TESTS
# =============================================================================

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
