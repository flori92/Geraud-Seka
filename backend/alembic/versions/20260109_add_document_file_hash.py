"""Add file_hash column to documents table

Revision ID: 20260109_file_hash
Revises: 
Create Date: 2026-01-09

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '20260109_file_hash'
down_revision = '887777e59cf9'
branch_labels = None
depends_on = None


def upgrade():
    # Ajouter la colonne file_hash si elle n'existe pas
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [c['name'] for c in inspector.get_columns('documents')]
    
    if 'file_hash' not in columns:
        op.add_column('documents', sa.Column('file_hash', sa.String(64), nullable=True))
        op.create_index('ix_documents_file_hash', 'documents', ['file_hash'])
        print("✅ Colonne file_hash ajoutée à documents")
    else:
        print("ℹ️  Colonne file_hash existe déjà")


def downgrade():
    op.drop_index('ix_documents_file_hash', table_name='documents')
    op.drop_column('documents', 'file_hash')
