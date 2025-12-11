"""Add accounting rules and document classifications

Revision ID: 20241211_accounting_rules
Revises: 
Create Date: 2024-12-11

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '20241211_accounting_rules'
down_revision = None  # Update this with your latest migration
branch_labels = None
depends_on = None


def upgrade():
    # Create accounting_rules table
    op.create_table(
        'accounting_rules',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('tenants.id'), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text),
        sa.Column('priority', sa.Float, default=0),
        sa.Column('is_active', sa.Boolean, default=True),
        sa.Column('conditions', postgresql.JSON, nullable=False),
        sa.Column('actions', postgresql.JSON, nullable=False),
        sa.Column('auto_apply', sa.Boolean, default=False),
        sa.Column('confidence_threshold', sa.Float, default=0.8),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.text('now()')),
    )
    
    # Create indexes
    op.create_index('ix_accounting_rules_tenant_id', 'accounting_rules', ['tenant_id'])
    op.create_index('ix_accounting_rules_priority', 'accounting_rules', ['priority'])
    op.create_index('ix_accounting_rules_is_active', 'accounting_rules', ['is_active'])
    
    # Create document_classifications table
    op.create_table(
        'document_classifications',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('tenants.id'), nullable=False),
        sa.Column('document_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('documents.id'), nullable=False),
        sa.Column('suggested_debit_account', sa.String(20)),
        sa.Column('suggested_credit_account', sa.String(20)),
        sa.Column('suggested_label', sa.String(500)),
        sa.Column('suggested_vat_rate', sa.Float),
        sa.Column('suggested_analytic_code', sa.String(50)),
        sa.Column('confidence_score', sa.Float),
        sa.Column('rule_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('accounting_rules.id')),
        sa.Column('source', sa.String(50)),
        sa.Column('validated', sa.Boolean, default=False),
        sa.Column('validated_by', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id')),
        sa.Column('user_corrections', postgresql.JSON),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.text('now()')),
    )
    
    # Create indexes
    op.create_index('ix_document_classifications_tenant_id', 'document_classifications', ['tenant_id'])
    op.create_index('ix_document_classifications_document_id', 'document_classifications', ['document_id'])
    op.create_index('ix_document_classifications_validated', 'document_classifications', ['validated'])


def downgrade():
    op.drop_table('document_classifications')
    op.drop_table('accounting_rules')
