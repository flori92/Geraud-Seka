"""enhance ledger accounts for auxiliary accounts

Revision ID: 20260117_enhance_ledger
Revises: 20260117_add_auto_validable
Create Date: 2026-01-17 02:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '20260117_enhance_ledger'
down_revision = '20260117_add_auto_validable'
branch_labels = None
depends_on = None


def upgrade():
    # Ajouter les colonnes pour gérer la hiérarchie des comptes
    op.add_column('ledger_accounts',
        sa.Column('parent_account_id', postgresql.UUID(as_uuid=True), nullable=True)
    )
    op.add_column('ledger_accounts',
        sa.Column('is_auxiliary', sa.Boolean(), nullable=False, server_default='false')
    )
    op.add_column('ledger_accounts',
        sa.Column('is_collective', sa.Boolean(), nullable=False, server_default='false')
    )
    op.add_column('ledger_accounts',
        sa.Column('account_type', sa.String(50), nullable=True)  # asset, liability, expense, revenue, equity
    )
    
    # Créer l'index et la FK pour parent_account_id
    op.create_foreign_key(
        'fk_ledger_accounts_parent',
        'ledger_accounts', 'ledger_accounts',
        ['parent_account_id'], ['id'],
        ondelete='SET NULL'
    )
    op.create_index('ix_ledger_accounts_parent_id', 'ledger_accounts', ['parent_account_id'])


def downgrade():
    op.drop_index('ix_ledger_accounts_parent_id', 'ledger_accounts')
    op.drop_constraint('fk_ledger_accounts_parent', 'ledger_accounts', type_='foreignkey')
    op.drop_column('ledger_accounts', 'account_type')
    op.drop_column('ledger_accounts', 'is_collective')
    op.drop_column('ledger_accounts', 'is_auxiliary')
    op.drop_column('ledger_accounts', 'parent_account_id')
