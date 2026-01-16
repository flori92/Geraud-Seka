"""create accounting entries and journals

Revision ID: 20260117_accounting_entries
Revises: 20260117_auxiliary_supplier
Create Date: 2026-01-17 02:20:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '20260117_accounting_entries'
down_revision = '20260117_auxiliary_supplier'
branch_labels = None
depends_on = None


def upgrade():
    # Créer table des journaux
    op.create_table(
        'accounting_journals',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False),
        sa.Column('code', sa.String(10), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('journal_type', sa.String(50), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
    )
    op.create_index('ix_accounting_journals_tenant_id', 'accounting_journals', ['tenant_id'])
    op.create_index('ix_accounting_journals_code', 'accounting_journals', ['tenant_id', 'code'], unique=True)
    
    # Créer table des écritures
    op.create_table(
        'accounting_entries',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False),
        sa.Column('document_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('documents.id', ondelete='CASCADE'), nullable=True),
        sa.Column('accounting_rule_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('accounting_rules.id', ondelete='SET NULL'), nullable=True),
        sa.Column('ledger_account_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('ledger_accounts.id', ondelete='RESTRICT'), nullable=False),
        sa.Column('journal_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('accounting_journals.id', ondelete='RESTRICT'), nullable=False),
        sa.Column('entry_date', sa.Date(), nullable=False),
        sa.Column('entry_number', sa.String(50), nullable=True),
        sa.Column('label', sa.String(500), nullable=False),
        sa.Column('reference', sa.String(255), nullable=True),
        sa.Column('debit', sa.Numeric(15, 2), nullable=False, server_default='0'),
        sa.Column('credit', sa.Numeric(15, 2), nullable=False, server_default='0'),
        sa.Column('currency', sa.String(3), nullable=False, server_default='XOF'),
        sa.Column('is_validated', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('is_exported', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('exported_at', sa.Date(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
    )
    op.create_index('ix_accounting_entries_tenant_id', 'accounting_entries', ['tenant_id'])
    op.create_index('ix_accounting_entries_document_id', 'accounting_entries', ['document_id'])
    op.create_index('ix_accounting_entries_date', 'accounting_entries', ['entry_date'])
    op.create_index('ix_accounting_entries_account', 'accounting_entries', ['ledger_account_id'])


def downgrade():
    op.drop_index('ix_accounting_entries_account', 'accounting_entries')
    op.drop_index('ix_accounting_entries_date', 'accounting_entries')
    op.drop_index('ix_accounting_entries_document_id', 'accounting_entries')
    op.drop_index('ix_accounting_entries_tenant_id', 'accounting_entries')
    op.drop_table('accounting_entries')
    
    op.drop_index('ix_accounting_journals_code', 'accounting_journals')
    op.drop_index('ix_accounting_journals_tenant_id', 'accounting_journals')
    op.drop_table('accounting_journals')
