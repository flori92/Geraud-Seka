"""
Tests pour le flux de confrontation des doublons
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from unittest.mock import patch, MagicMock
import json

from app.main import app
from app.core.deps import get_db_session
from app.models.document import Document, DocumentStatus
from app.models.duplicate import DocumentDuplicate, DuplicateDetectionReason, DuplicateResolution
from app.models.user import User
from app.core.config import settings

# Configuration de la base de données de test
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    """Override de la dépendance de base de données pour les tests"""
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db_session] = override_get_db


def override_get_current_user():
    """Mock utilisateur pour les tests"""
    user = User(
        id="test-user-id",
        email="test@example.com",
        tenant_id="test-tenant-id",
        is_active=True
    )
    return user


# Override des dépendances
from app.api.deps import get_current_user
app.dependency_overrides[get_current_user] = override_get_current_user
from app.core.deps import get_current_user as core_get_current_user
app.dependency_overrides[core_get_current_user] = override_get_current_user


@pytest.fixture
def db():
    """Fixture de base de données pour les tests"""
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def client():
    """Fixture client FastAPI pour les tests"""
    return TestClient(app)


@pytest.fixture
def sample_documents(db):
    """Créer des documents de test"""
    # Document existant
    existing_doc = Document(
        id="existing-doc-id",
        tenant_id="test-tenant-id",
        filename="facture_existante.pdf",
        original_filename="facture_existante.pdf",
        supplier_name="SBEE",
        reference_number="SBEE-2024-001",
        amount_ttc=100000.0,
        status=DocumentStatus.VALIDEE,
        file_path="/uploads/facture_existante.pdf"
    )
    
    # Nouveau document (doublon)
    new_doc = Document(
        id="new-doc-id",
        tenant_id="test-tenant-id",
        filename="facture_nouvelle.pdf",
        original_filename="facture_nouvelle.pdf",
        supplier_name="SBEE",
        reference_number="SBEE-2024-001",
        amount_ttc=100000.0,
        status=DocumentStatus.A_TRAITER_DOUBLON,
        file_path="/uploads/facture_nouvelle.pdf"
    )
    
    db.add(existing_doc)
    db.add(new_doc)
    db.commit()
    
    return existing_doc, new_doc


@pytest.fixture
def sample_duplicate(db, sample_documents):
    """Créer un enregistrement de doublon"""
    existing_doc, new_doc = sample_documents
    
    duplicate = DocumentDuplicate(
        id="duplicate-id",
        tenant_id="test-tenant-id",
        new_document_id=new_doc.id,
        existing_document_id=existing_doc.id,
        detection_reason=DuplicateDetectionReason.SAME_INVOICE_NUMBER,
        comparison_data=json.dumps({
            "supplier_name": {"identical": True, "new": "SBEE", "existing": "SBEE"},
            "reference_number": {"identical": True, "new": "SBEE-2024-001", "existing": "SBEE-2024-001"},
            "amount_ttc": {"identical": True, "new": 100000.0, "existing": 100000.0}
        })
    )
    
    db.add(duplicate)
    db.commit()
    
    return duplicate


class TestDuplicateConfrontation:
    """Tests pour l'API de confrontation des doublons"""
    
    def test_get_pending_duplicates_empty(self, client, db):
        """Test récupération des doublons en attente (vide)"""
        response = client.get("/api/v1/duplicates/pending")
        assert response.status_code == 200
        assert response.json() == []
    
    def test_get_pending_duplicates_with_data(self, client, db, sample_duplicate):
        """Test récupération des doublons en attente (avec données)"""
        response = client.get("/api/v1/duplicates/pending")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) == 1
        assert data[0]["id"] == "duplicate-id"
        assert data[0]["detection_reason"] == "same_invoice_number"
        assert data[0]["new_document"]["id"] == "new-doc-id"
    
    def test_get_duplicate_confrontation_success(self, client, db, sample_duplicate):
        """Test récupération des détails de confrontation d'un doublon"""
        response = client.get(f"/api/v1/duplicates/{sample_duplicate.id}/confrontation")
        assert response.status_code == 200
        
        data = response.json()
        assert data["duplicate_id"] == "duplicate-id"
        assert data["detection_reason"] == "same_invoice_number"
        assert data["new_document"]["id"] == "new-doc-id"
        assert data["existing_document"]["id"] == "existing-doc-id"
        assert "comparison" in data
        assert "fields" in data["comparison"]
    
    def test_get_duplicate_confrontation_not_found(self, client, db):
        """Test confrontation d'un doublon inexistant"""
        response = client.get("/api/v1/duplicates/nonexistent/confrontation")
        assert response.status_code == 404
        assert "Doublon non trouvé ou déjà résolu" in response.json()["detail"]
    
    def test_resolve_duplicate_rejected(self, client, db, sample_duplicate):
        """Test résolution d'un doublon (rejet)"""
        response = client.post(
            f"/api/v1/duplicates/{sample_duplicate.id}/resolve",
            json={
                "resolution": "rejected",
                "resolution_reason": None
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["resolution"] == "rejected"
        
        # Vérifier que le document a été rejeté
        db.refresh(sample_duplicate)
        assert sample_duplicate.resolution == DuplicateResolution.REJECTED
        
        # Vérifier le statut du nouveau document
        new_doc = db.query(Document).filter(Document.id == "new-doc-id").first()
        assert new_doc.status == DocumentStatus.REJECTED
    
    def test_resolve_duplicate_kept_both(self, client, db, sample_duplicate):
        """Test résolution d'un doublon (conserver les deux)"""
        response = client.post(
            f"/api/v1/duplicates/{sample_duplicate.id}/resolve",
            json={
                "resolution": "kept_both",
                "resolution_reason": "Facture rectificative"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["resolution"] == "kept_both"
        
        # Vérifier que le document est passé en PRE_TRAITEE
        new_doc = db.query(Document).filter(Document.id == "new-doc-id").first()
        assert new_doc.status == DocumentStatus.PRE_TRAITEE
    
    def test_resolve_duplicate_replaced(self, client, db, sample_duplicate):
        """Test résolution d'un doublon (remplacement)"""
        response = client.post(
            f"/api/v1/duplicates/{sample_duplicate.id}/resolve",
            json={
                "resolution": "replaced",
                "resolution_reason": None
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["resolution"] == "replaced"
        
        # Vérifier que l'ancien document est archivé
        existing_doc = db.query(Document).filter(Document.id == "existing-doc-id").first()
        assert existing_doc.status == DocumentStatus.ARCHIVED
        assert existing_doc.is_archived is True
    
    def test_resolve_duplicate_invalid_resolution(self, client, db, sample_duplicate):
        """Test résolution avec une action invalide"""
        response = client.post(
            f"/api/v1/duplicates/{sample_duplicate.id}/resolve",
            json={
                "resolution": "invalid_action",
                "resolution_reason": None
            }
        )
        
        assert response.status_code == 400
        assert "Resolution must be" in response.json()["detail"]
    
    def test_resolve_duplicate_kept_both_without_reason(self, client, db, sample_duplicate):
        """Test résolution 'kept_both' sans motif obligatoire"""
        response = client.post(
            f"/api/v1/duplicates/{sample_duplicate.id}/resolve",
            json={
                "resolution": "kept_both",
                "resolution_reason": None
            }
        )
        
        assert response.status_code == 400
        assert "Resolution reason is required" in response.json()["detail"]
    
    def test_resolve_duplicate_already_resolved(self, client, db, sample_duplicate):
        """Test résolution d'un doublon déjà résolu"""
        # Marquer le doublon comme résolu
        sample_duplicate.resolution = DuplicateResolution.REJECTED
        sample_duplicate.resolved_by = "test-user-id"
        sample_duplicate.resolved_at = "2024-01-01T00:00:00"
        db.commit()
        
        response = client.get(f"/api/v1/duplicates/{sample_duplicate.id}/confrontation")
        assert response.status_code == 404
        assert "Doublon non trouvé ou déjà résolu" in response.json()["detail"]


class TestDuplicateBlocking:
    """Tests pour le blocage des documents avec doublons"""
    
    def test_validate_document_with_pending_duplicate(self, client, db, sample_duplicate):
        """Test validation d'un document avec doublon en attente (doit bloquer)"""
        response = client.post(
            f"/api/v1/documents/{sample_duplicate.new_document_id}/validate",
            json={
                "reference_number": "SBEE-2024-001",
                "document_type": "INVOICE_PURCHASE"
            }
        )
        
        assert response.status_code == 422
        assert "Impossible de valider un document avec un doublon" in response.json()["detail"]
    
    def test_export_documents_with_pending_duplicate(self, client, db, sample_duplicate):
        """Test export de documents avec doublon en attente (doit bloquer)"""
        response = client.post(
            "/api/v1/documents/export",
            json={
                "document_ids": [sample_duplicate.new_document_id]
            }
        )
        
        assert response.status_code == 422
        assert "Impossible d'exporter des documents avec des doublons" in response.json()["detail"]
    
    def test_validate_document_after_resolution(self, client, db, sample_duplicate):
        """Test validation après résolution du doublon (doit fonctionner)"""
        # Résoudre le doublon d'abord
        client.post(
            f"/api/v1/duplicates/{sample_duplicate.id}/resolve",
            json={
                "resolution": "kept_both",
                "resolution_reason": "Test de résolution"
            }
        )
        
        # Maintenant la validation doit fonctionner
        response = client.post(
            f"/api/v1/documents/{sample_duplicate.new_document_id}/validate",
            json={
                "reference_number": "SBEE-2024-001",
                "document_type": "INVOICE_PURCHASE"
            }
        )
        
        # La validation peut réussir ou échouer pour d'autres raisons,
        # mais ne doit pas échouer à cause du doublon
        assert response.status_code != 422


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
