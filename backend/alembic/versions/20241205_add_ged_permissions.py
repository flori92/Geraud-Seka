"""Add GED permissions tables

Revision ID: 20241205_ged_permissions
Revises: 20241205_segmentation
Create Date: 2024-12-05

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '20241205_ged_permissions'
down_revision = '20241205_segmentation'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Table document_permissions
    op.create_table(
        'document_permissions',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('document_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('folder_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('share_type', sa.String(20), nullable=False, default='user'),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('team_name', sa.String(100), nullable=True),
        sa.Column('external_email', sa.String(255), nullable=True),
        sa.Column('permission_level', sa.String(20), nullable=False, default='view'),
        sa.Column('can_reshare', sa.Boolean(), default=False),
        sa.Column('inherit_to_children', sa.Boolean(), default=True),
        sa.Column('expires_at', sa.DateTime(), nullable=True),
        sa.Column('granted_by', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['document_id'], ['documents.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['folder_id'], ['document_folders.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['granted_by'], ['users.id']),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
    )
    
    op.create_index('ix_doc_permissions_document', 'document_permissions', ['document_id'])
    op.create_index('ix_doc_permissions_folder', 'document_permissions', ['folder_id'])
    op.create_index('ix_doc_permissions_user', 'document_permissions', ['user_id'])
    op.create_index('ix_doc_permissions_tenant', 'document_permissions', ['tenant_id'])
    
    # Table document_share_links
    op.create_table(
        'document_share_links',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('document_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('folder_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('share_token', sa.String(64), nullable=False),
        sa.Column('password_hash', sa.String(255), nullable=True),
        sa.Column('requires_password', sa.Boolean(), default=False),
        sa.Column('permission_level', sa.String(20), nullable=False, default='view'),
        sa.Column('allow_download', sa.Boolean(), default=True),
        sa.Column('max_views', sa.Integer(), nullable=True),
        sa.Column('max_downloads', sa.Integer(), nullable=True),
        sa.Column('current_views', sa.Integer(), default=0),
        sa.Column('current_downloads', sa.Integer(), default=0),
        sa.Column('expires_at', sa.DateTime(), nullable=True),
        sa.Column('is_active', sa.Boolean(), default=True),
        sa.Column('name', sa.String(255), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['document_id'], ['documents.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['folder_id'], ['document_folders.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['created_by'], ['users.id']),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
    )
    
    op.create_index('ix_share_links_token', 'document_share_links', ['share_token'], unique=True)
    op.create_index('ix_share_links_document', 'document_share_links', ['document_id'])
    op.create_index('ix_share_links_folder', 'document_share_links', ['folder_id'])
    op.create_index('ix_share_links_tenant', 'document_share_links', ['tenant_id'])
    
    # Table share_link_access_logs
    op.create_table(
        'share_link_access_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('share_link_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('access_type', sa.String(20), nullable=False),
        sa.Column('ip_address', sa.String(45), nullable=True),
        sa.Column('user_agent', sa.String(500), nullable=True),
        sa.Column('referer', sa.String(500), nullable=True),
        sa.Column('accessed_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['share_link_id'], ['document_share_links.id'], ondelete='CASCADE'),
    )
    
    op.create_index('ix_access_logs_link', 'share_link_access_logs', ['share_link_id'])
    op.create_index('ix_access_logs_accessed', 'share_link_access_logs', ['accessed_at'])


def downgrade() -> None:
    op.drop_table('share_link_access_logs')
    op.drop_table('document_share_links')
    op.drop_table('document_permissions')
