"""add accounting entries tables

Revision ID: add_accounting_entries
Revises: 
Create Date: 2024-01-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = 'add_accounting_entries'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'accounting_entries_header',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False),
        sa.Column('entry_number', sa.String(50), unique=True, nullable=False),
        sa.Column('journal_type', sa.Enum('ACH', 'VTE', 'BQ', 'CA', 'OD', name='journaltype'), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('reference', sa.String(100), nullable=True),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('status', sa.Enum('draft', 'validated', 'posted', 'cancelled', name='entrystatus'), nullable=False),
        sa.Column('document_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('documents.id', ondelete='SET NULL'), nullable=True),
        sa.Column('validated_by', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('validated_at', sa.Date(), nullable=True),
        sa.Column('posted_by', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('posted_at', sa.Date(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
    )

    op.create_table(
        'accounting_entry_lines',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False),
        sa.Column('entry_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('accounting_entries_header.id', ondelete='CASCADE'), nullable=False),
        sa.Column('account_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('ledger_accounts.id'), nullable=False),
        sa.Column('label', sa.String(255), nullable=False),
        sa.Column('debit', sa.Numeric(15, 2), default=0),
        sa.Column('credit', sa.Numeric(15, 2), default=0),
        sa.Column('analytic_code', sa.String(50), nullable=True),
        sa.Column('partner_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('partner_type', sa.String(20), nullable=True),
        sa.Column('reconciled', sa.Boolean(), default=False),
        sa.Column('reconciliation_ref', sa.String(100), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
    )

    op.create_table(
        'bank_reconciliations',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False),
        sa.Column('bank_account_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('bank_accounts.id'), nullable=False),
        sa.Column('period_start', sa.Date(), nullable=False),
        sa.Column('period_end', sa.Date(), nullable=False),
        sa.Column('statement_balance', sa.Numeric(15, 2), nullable=False),
        sa.Column('book_balance', sa.Numeric(15, 2), nullable=False),
        sa.Column('difference', sa.Numeric(15, 2), nullable=False),
        sa.Column('status', sa.String(20), default='in_progress'),
        sa.Column('reconciled_by', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('reconciled_at', sa.Date(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
    )

    op.create_table(
        'accounting_revisions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False),
        sa.Column('entry_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('accounting_entries_header.id'), nullable=False),
        sa.Column('revision_type', sa.String(50), nullable=False),
        sa.Column('old_value', sa.Text(), nullable=True),
        sa.Column('new_value', sa.Text(), nullable=True),
        sa.Column('comment', sa.Text(), nullable=True),
        sa.Column('revised_by', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
    )

    op.create_index('idx_entry_header_tenant', 'accounting_entries_header', ['tenant_id'])
    op.create_index('idx_entry_header_date', 'accounting_entries_header', ['date'])
    op.create_index('idx_entry_header_status', 'accounting_entries_header', ['status'])
    op.create_index('idx_entry_lines_entry', 'accounting_entry_lines', ['entry_id'])
    op.create_index('idx_entry_lines_account', 'accounting_entry_lines', ['account_id'])
    op.create_index('idx_reconciliation_account', 'bank_reconciliations', ['bank_account_id'])


def downgrade():
    op.drop_index('idx_reconciliation_account')
    op.drop_index('idx_entry_lines_account')
    op.drop_index('idx_entry_lines_entry')
    op.drop_index('idx_entry_header_status')
    op.drop_index('idx_entry_header_date')
    op.drop_index('idx_entry_header_tenant')
    
    op.drop_table('accounting_revisions')
    op.drop_table('bank_reconciliations')
    op.drop_table('accounting_entry_lines')
    op.drop_table('accounting_entries_header')
    
    op.execute('DROP TYPE IF EXISTS entrystatus')
    op.execute('DROP TYPE IF EXISTS journaltype')
