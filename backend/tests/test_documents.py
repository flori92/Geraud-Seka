import os
import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.compiler import compiles

os.environ.setdefault("BACKEND_CORS_ORIGINS", "[\"http://localhost:3000\"]")


@compiles(JSONB, "sqlite")
def compile_jsonb_to_text(element, compiler, **kw):
    return "TEXT"

from app.main import app
from app.db.base import Base
from app.models.document import Document, DocumentStatus, DocumentType
from app.core import deps as core_deps
from app.api import deps as api_deps

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture
def db_session():
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture
def current_user():
    return type("User", (), {"id": uuid.uuid4(), "tenant_id": uuid.uuid4()})()


@pytest.fixture
def client(db_session, current_user):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    def override_get_current_user():
        return current_user

    for module in (core_deps, api_deps):
        app.dependency_overrides[module.get_db_session] = override_get_db
        app.dependency_overrides[module.get_current_user] = override_get_current_user

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


def create_document(session, tenant_id, uploader_id, **overrides):
    document = Document(
        filename=overrides.get("filename", "test.pdf"),
        original_filename=overrides.get("original_filename", "test.pdf"),
        file_path=overrides.get("file_path", "s3://bucket/test.pdf"),
        status=overrides.get("status", DocumentStatus.A_TRAITER),
        type=overrides.get("type", DocumentType.INVOICE_PURCHASE),
        tenant_id=tenant_id,
        uploaded_by=uploader_id,
    )
    session.add(document)
    session.commit()
    session.refresh(document)
    return document


def test_read_documents_invalid_status_returns_400(client):
    response = client.get("/api/v1/documents/?status=INVALID")
    assert response.status_code == 400
    assert "Statut invalide" in response.json()["detail"]


def test_read_documents_invalid_type_returns_400(client):
    response = client.get("/api/v1/documents/?document_type=UNKNOWN_TYPE")
    assert response.status_code == 400
    assert "Type de document invalide" in response.json()["detail"]


def test_read_documents_returns_filtered_results(client, db_session, current_user):
    create_document(db_session, current_user.tenant_id, current_user.id, status=DocumentStatus.A_TRAITER)
    create_document(
        db_session,
        current_user.tenant_id,
        current_user.id,
        status=DocumentStatus.VALIDEE,
        type=DocumentType.INVOICE_SALES,
    )

    response = client.get("/api/v1/documents/?status=A_TRAITER&document_type=INVOICE_PURCHASE")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["status"] == "A_TRAITER"
    assert data[0]["type"] == "INVOICE_PURCHASE"
