"""add accounting tables

Revision ID: add_accounting_001
Revises: add_subscription_001
Create Date: 2025-12-04 23:42:00

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_accounting_001'
down_revision = 'add_subscription_001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create ledger_accounts table
    op.create_table(
        'ledger_accounts',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('account_code', sa.String(length=20), nullable=False),
        sa.Column('account_name', sa.String(length=255), nullable=False),
        sa.Column('account_type', sa.Enum('asset', 'liability', 'equity', 'revenue', 'expense', name='accounttype'), nullable=False),
        sa.Column('balance', sa.Numeric(precision=15, scale=2), nullable=False, server_default='0'),
        sa.Column('currency', sa.String(length=3), nullable=False, server_default='XOF'),
        sa.Column('description', sa.String(length=500), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_ledger_accounts_id', 'ledger_accounts', ['id'])
    op.create_index('ix_ledger_accounts_tenant_id', 'ledger_accounts', ['tenant_id'])
    op.create_index('ix_ledger_accounts_account_code', 'ledger_accounts', ['account_code'])
    op.create_index('ix_ledger_accounts_account_type', 'ledger_accounts', ['account_type'])
    
    # Create journal_entries table
    op.create_table(
        'journal_entries',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('debit_account_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('credit_account_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('entry_number', sa.String(length=50), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('description', sa.String(length=500), nullable=False),
        sa.Column('amount', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('reference', sa.String(length=100), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['debit_account_id'], ['ledger_accounts.id']),
        sa.ForeignKeyConstraint(['credit_account_id'], ['ledger_accounts.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('entry_number')
    )
    op.create_index('ix_journal_entries_id', 'journal_entries', ['id'])
    op.create_index('ix_journal_entries_tenant_id', 'journal_entries', ['tenant_id'])
    op.create_index('ix_journal_entries_entry_number', 'journal_entries', ['entry_number'])
    op.create_index('ix_journal_entries_date', 'journal_entries', ['date'])


def downgrade() -> None:
    op.drop_index('ix_journal_entries_date', table_name='journal_entries')
    op.drop_index('ix_journal_entries_entry_number', table_name='journal_entries')
    op.drop_index('ix_journal_entries_tenant_id', table_name='journal_entries')
    op.drop_index('ix_journal_entries_id', table_name='journal_entries')
    op.drop_table('journal_entries')
    
    op.drop_index('ix_ledger_accounts_account_type', table_name='ledger_accounts')
    op.drop_index('ix_ledger_accounts_account_code', table_name='ledger_accounts')
    op.drop_index('ix_ledger_accounts_tenant_id', table_name='ledger_accounts')
    op.drop_index('ix_ledger_accounts_id', table_name='ledger_accounts')
    op.drop_table('ledger_accounts')
    
    op.execute('DROP TYPE accounttype')
