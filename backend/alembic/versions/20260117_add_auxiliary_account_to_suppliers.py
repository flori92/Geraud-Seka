"""add auxiliary account to suppliers

Revision ID: 20260117_auxiliary_supplier
Revises: 20260117_enhance_ledger
Create Date: 2026-01-17 02:10:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '20260117_auxiliary_supplier'
down_revision = '20260117_enhance_ledger'
branch_labels = None
depends_on = None


def upgrade():
    # Ajouter le lien vers le compte auxiliaire
    op.add_column('suppliers',
        sa.Column('auxiliary_account_id', postgresql.UUID(as_uuid=True), nullable=True)
    )
    op.add_column('suppliers',
        sa.Column('default_vat_account_id', postgresql.UUID(as_uuid=True), nullable=True)
    )
    
    # Créer les FK
    op.create_foreign_key(
        'fk_suppliers_auxiliary_account',
        'suppliers', 'ledger_accounts',
        ['auxiliary_account_id'], ['id'],
        ondelete='SET NULL'
    )
    op.create_foreign_key(
        'fk_suppliers_vat_account',
        'suppliers', 'ledger_accounts',
        ['default_vat_account_id'], ['id'],
        ondelete='SET NULL'
    )
    
    op.create_index('ix_suppliers_auxiliary_account', 'suppliers', ['auxiliary_account_id'])


def downgrade():
    op.drop_index('ix_suppliers_auxiliary_account', 'suppliers')
    op.drop_constraint('fk_suppliers_vat_account', 'suppliers', type_='foreignkey')
    op.drop_constraint('fk_suppliers_auxiliary_account', 'suppliers', type_='foreignkey')
    op.drop_column('suppliers', 'default_vat_account_id')
    op.drop_column('suppliers', 'auxiliary_account_id')
