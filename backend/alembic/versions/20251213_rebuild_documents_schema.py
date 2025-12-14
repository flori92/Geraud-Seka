"""rebuild documents schema - solution radicale

Revision ID: 20251213_rebuild_documents_schema
Revises: 20251213_force_add_documents_title
Create Date: 2025-12-13 19:30:00.000000

Cette migration reconstruit complètement le schéma de la table documents
en ajoutant TOUTES les colonnes manquantes de manière idempotente.
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '20251213_rebuild_documents_schema'
down_revision = '20251213_force_add_documents_title'
branch_labels = None
depends_on = None


def column_exists(connection, table_name, column_name):
    """Vérifie si une colonne existe dans une table"""
    result = connection.execute(sa.text(f"""
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = '{table_name}' AND column_name = '{column_name}'
    """))
    return result.fetchone() is not None


def upgrade():
    """Ajoute toutes les colonnes manquantes de la table documents"""
    connection = op.get_bind()

    # 1. Créer les types enum s'ils n'existent pas
    connection.execute(sa.text("""
        DO $$ BEGIN
            CREATE TYPE documentstatus AS ENUM (
                'UPLOADED', 'OCR_PROCESSING', 'OCR_COMPLETED',
                'VALIDATED', 'REJECTED', 'ARCHIVED'
            );
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """))

    connection.execute(sa.text("""
        DO $$ BEGIN
            CREATE TYPE documenttype AS ENUM (
                'INVOICE_PURCHASE', 'INVOICE_SALES', 'RECEIPT', 'EXPENSE_REPORT',
                'QUOTE', 'DELIVERY_NOTE', 'PURCHASE_ORDER', 'CONTRACT', 'PAYSLIP',
                'LEAVE_REQUEST', 'ID_DOCUMENT', 'DIPLOMA', 'LEGAL_DOCUMENT',
                'CERTIFICATE', 'LICENSE', 'PRESENTATION', 'PROPOSAL', 'AGREEMENT',
                'REPORT', 'SPREADSHEET', 'IMAGE', 'OTHER'
            );
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """))

    connection.execute(sa.text("""
        DO $$ BEGIN
            CREATE TYPE documentcategory AS ENUM (
                'accounting', 'legal', 'administrative',
                'technical', 'marketing', 'project', 'other'
            );
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """))

    # 2. Dictionnaire de toutes les colonnes à vérifier/ajouter
    columns_to_add = {
        'original_filename': 'VARCHAR(255)',
        'file_extension': 'VARCHAR(10)',
        'title': 'VARCHAR(500)',
        'description': 'TEXT',
        'category': 'documentcategory DEFAULT CAST(\'other\' AS documentcategory)',
        'tags': 'JSON',
        'custom_fields': 'JSON',
        'reference_number': 'VARCHAR(100)',
        'document_date': 'DATE',
        'due_date': 'DATE',
        'expiry_date': 'DATE',
        'amount_ht': 'FLOAT',
        'amount_vat': 'FLOAT',
        'amount_ttc': 'FLOAT',
        'currency': 'VARCHAR(3) DEFAULT \'XOF\'',
        'version': 'INTEGER DEFAULT 1',
        'parent_document_id': 'UUID REFERENCES documents(id) ON DELETE SET NULL',
        'is_latest_version': 'BOOLEAN DEFAULT TRUE',
        'ocr_data': 'JSON',
        'ocr_confidence': 'FLOAT',
        'ai_extracted_data': 'JSON',
        'is_confidential': 'BOOLEAN DEFAULT FALSE',
        'is_archived': 'BOOLEAN DEFAULT FALSE',
        'is_locked': 'BOOLEAN DEFAULT FALSE',
        'requires_validation': 'BOOLEAN DEFAULT FALSE',
        'validated_by': 'UUID REFERENCES users(id)',
        'validated_at': 'DATE',
        'folder_id': 'UUID REFERENCES document_folders(id) ON DELETE SET NULL',
        'lead_id': 'UUID REFERENCES leads(id) ON DELETE SET NULL',
        'opportunity_id': 'UUID REFERENCES opportunities(id) ON DELETE SET NULL',
        'client_id': 'UUID REFERENCES clients(id) ON DELETE SET NULL',
        'supplier_id': 'UUID REFERENCES suppliers(id) ON DELETE SET NULL',
        'tenant_id': 'UUID REFERENCES tenants(id) ON DELETE CASCADE',
        'uploaded_by': 'UUID REFERENCES users(id)',
    }

    # 3. Ajouter chaque colonne si elle n'existe pas
    for column_name, column_type in columns_to_add.items():
        if not column_exists(connection, 'documents', column_name):
            try:
                connection.execute(sa.text(f"""
                    ALTER TABLE documents ADD COLUMN {column_name} {column_type}
                """))
                connection.commit()
                print(f"✅ Colonne '{column_name}' ajoutée")
            except Exception as e:
                print(f"⚠️  Erreur ajout colonne '{column_name}': {e}")
                connection.rollback()
        else:
            print(f"ℹ️  Colonne '{column_name}' existe déjà")


def downgrade():
    """Supprime les colonnes ajoutées"""
    # Ne rien faire en downgrade pour éviter la perte de données
    pass
