"""refactor documents for GED (Gestion Électronique de Documents)

Revision ID: 20241205_refactor_documents_ged
Revises: 20241205_add_contacts
Create Date: 2024-12-05 00:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '20241205_refactor_documents_ged'
down_revision = '20241205_add_contacts'
branch_labels = None
depends_on = None


def upgrade():
    # Create document_folders table
    op.create_table(
        'document_folders',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text),
        sa.Column('color', sa.String(7)),
        sa.Column('icon', sa.String(50)),
        sa.Column('parent_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('document_folders.id', ondelete='CASCADE')),
        sa.Column('path', sa.String(1000)),
        sa.Column('is_public', sa.Boolean, server_default='false'),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id')),
        sa.Column('created_at', sa.DateTime, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime, server_default=sa.text('now()'), onupdate=sa.text('now()'))
    )
    
    # Add new columns to documents table
    op.add_column('documents', sa.Column('original_filename', sa.String(255)))
    op.add_column('documents', sa.Column('file_extension', sa.String(10)))
    op.add_column('documents', sa.Column('title', sa.String(500)))
    op.add_column('documents', sa.Column('description', sa.Text))
    op.add_column('documents', sa.Column('category', sa.String(50)))
    op.add_column('documents', sa.Column('tags', sa.JSON))
    op.add_column('documents', sa.Column('custom_fields', sa.JSON))
    op.add_column('documents', sa.Column('document_date', sa.Date))
    op.add_column('documents', sa.Column('expiry_date', sa.Date))
    op.add_column('documents', sa.Column('version', sa.Integer, server_default='1'))
    op.add_column('documents', sa.Column('parent_document_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('documents.id', ondelete='SET NULL')))
    op.add_column('documents', sa.Column('is_latest_version', sa.Boolean, server_default='true'))
    op.add_column('documents', sa.Column('ocr_confidence', sa.Float))
    op.add_column('documents', sa.Column('ai_extracted_data', sa.JSON))
    op.add_column('documents', sa.Column('is_confidential', sa.Boolean, server_default='false'))
    op.add_column('documents', sa.Column('is_archived', sa.Boolean, server_default='false'))
    op.add_column('documents', sa.Column('is_locked', sa.Boolean, server_default='false'))
    op.add_column('documents', sa.Column('requires_validation', sa.Boolean, server_default='false'))
    op.add_column('documents', sa.Column('validated_by', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id')))
    op.add_column('documents', sa.Column('validated_at', sa.Date))
    op.add_column('documents', sa.Column('folder_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('document_folders.id', ondelete='SET NULL')))
    op.add_column('documents', sa.Column('lead_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('leads.id', ondelete='SET NULL')))
    op.add_column('documents', sa.Column('opportunity_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('opportunities.id', ondelete='SET NULL')))
    op.add_column('documents', sa.Column('uploaded_by', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id')))
    
    # Modify existing columns
    op.alter_column('documents', 'file_size', type_=sa.Integer)
    op.alter_column('documents', 'ocr_data', type_=sa.JSON)
    op.alter_column('documents', 'client_id', nullable=True)
    
    # Rename column
    op.alter_column('documents', 'date', new_column_name='document_date_old')


def downgrade():
    # Remove new columns from documents
    op.drop_column('documents', 'original_filename')
    op.drop_column('documents', 'file_extension')
    op.drop_column('documents', 'title')
    op.drop_column('documents', 'description')
    op.drop_column('documents', 'category')
    op.drop_column('documents', 'tags')
    op.drop_column('documents', 'custom_fields')
    op.drop_column('documents', 'document_date')
    op.drop_column('documents', 'expiry_date')
    op.drop_column('documents', 'version')
    op.drop_column('documents', 'parent_document_id')
    op.drop_column('documents', 'is_latest_version')
    op.drop_column('documents', 'ocr_confidence')
    op.drop_column('documents', 'ai_extracted_data')
    op.drop_column('documents', 'is_confidential')
    op.drop_column('documents', 'is_archived')
    op.drop_column('documents', 'is_locked')
    op.drop_column('documents', 'requires_validation')
    op.drop_column('documents', 'validated_by')
    op.drop_column('documents', 'validated_at')
    op.drop_column('documents', 'folder_id')
    op.drop_column('documents', 'lead_id')
    op.drop_column('documents', 'opportunity_id')
    op.drop_column('documents', 'uploaded_by')
    
    # Restore original columns
    op.alter_column('documents', 'file_size', type_=sa.Float)
    op.alter_column('documents', 'ocr_data', type_=sa.String)
    op.alter_column('documents', 'client_id', nullable=False)
    op.alter_column('documents', 'document_date_old', new_column_name='date')
    
    # Drop document_folders table
    op.drop_table('document_folders')
