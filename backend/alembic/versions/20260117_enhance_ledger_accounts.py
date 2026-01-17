"""enhance chart of accounts for auxiliary accounts

Revision ID: 20260117_enhance_ledger
Revises: 20260117_merge_branches
Create Date: 2026-01-17 02:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '20260117_enhance_ledger'
down_revision = '20260117_merge_branches'
branch_labels = None
depends_on = None


def upgrade():
    # Ajouter les colonnes pour gérer la hiérarchie des comptes dans chart_of_accounts
    # Note: parent_id existe déjà dans chart_of_accounts
    
    op.add_column('chart_of_accounts',
        sa.Column('is_auxiliary', sa.Boolean(), nullable=False, server_default='false')
    )
    op.add_column('chart_of_accounts',
        sa.Column('is_collective', sa.Boolean(), nullable=False, server_default='false')
    )
    # collective_parent_code temporairement nullable
    op.add_column('chart_of_accounts',
        sa.Column('collective_parent_code', sa.String(10), nullable=True)
    )
    
    # Liens vers Tiers
    op.add_column('chart_of_accounts',
        sa.Column('linked_supplier_id', postgresql.UUID(as_uuid=True), nullable=True)
    )
    op.add_column('chart_of_accounts',
        sa.Column('linked_client_id', postgresql.UUID(as_uuid=True), nullable=True)
    )
    
    # Créer les FK
    op.create_foreign_key(
        'fk_coa_linked_supplier',
        'chart_of_accounts', 'suppliers',
        ['linked_supplier_id'], ['id'],
        ondelete='SET NULL'
    )
    op.create_foreign_key(
        'fk_coa_linked_client',
        'chart_of_accounts', 'clients',
        ['linked_client_id'], ['id'],
        ondelete='SET NULL'
    )
    
    # Créer index
    op.create_index('ix_coa_linked_supplier', 'chart_of_accounts', ['linked_supplier_id'])
    op.create_index('ix_coa_linked_client', 'chart_of_accounts', ['linked_client_id'])


def downgrade():
    op.drop_index('ix_coa_linked_client', 'chart_of_accounts')
    op.drop_index('ix_coa_linked_supplier', 'chart_of_accounts')
    
    op.drop_constraint('fk_coa_linked_client', 'chart_of_accounts', type_='foreignkey')
    op.drop_constraint('fk_coa_linked_supplier', 'chart_of_accounts', type_='foreignkey')
    
    op.drop_column('chart_of_accounts', 'linked_client_id')
    op.drop_column('chart_of_accounts', 'linked_supplier_id')
    op.drop_column('chart_of_accounts', 'collective_parent_code')
    op.drop_column('chart_of_accounts', 'is_collective')
    op.drop_column('chart_of_accounts', 'is_auxiliary')
