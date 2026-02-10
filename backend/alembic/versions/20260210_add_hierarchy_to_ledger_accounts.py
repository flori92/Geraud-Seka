"""Add hierarchy columns to ledger_accounts

Add parent_account_id, is_auxiliary, is_collective columns
to the ledger_accounts table for chart of accounts hierarchy.

Revision ID: 20260210_hierarchy_ledger
Revises: syscohada_ref_001
Create Date: 2026-02-10
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = '20260210_hierarchy_ledger'
down_revision = 'syscohada_ref_001'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('ledger_accounts',
        sa.Column('parent_account_id', UUID(as_uuid=True), nullable=True)
    )
    op.add_column('ledger_accounts',
        sa.Column('is_auxiliary', sa.Boolean(), nullable=False, server_default='false')
    )
    op.add_column('ledger_accounts',
        sa.Column('is_collective', sa.Boolean(), nullable=False, server_default='false')
    )

    op.create_foreign_key(
        'fk_ledger_accounts_parent',
        'ledger_accounts', 'ledger_accounts',
        ['parent_account_id'], ['id'],
        ondelete='SET NULL'
    )
    op.create_index('ix_ledger_accounts_parent_account_id', 'ledger_accounts', ['parent_account_id'])


def downgrade():
    op.drop_index('ix_ledger_accounts_parent_account_id', 'ledger_accounts')
    op.drop_constraint('fk_ledger_accounts_parent', 'ledger_accounts', type_='foreignkey')
    op.drop_column('ledger_accounts', 'is_collective')
    op.drop_column('ledger_accounts', 'is_auxiliary')
    op.drop_column('ledger_accounts', 'parent_account_id')
