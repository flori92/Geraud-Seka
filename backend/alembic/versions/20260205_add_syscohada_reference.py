"""Add SYSCOHADA reference tables

Tables pour le referentiel SYSCOHADA:
- syscohada_accounts: Plan comptable OHADA complet (classes 1-8)
- supplier_categories: Categories fournisseurs avec compte par defaut
- account_keywords: Mapping mots-cles -> comptes
- suppliers.category_id: Lien fournisseur -> categorie

Revision ID: syscohada_ref_001
Revises: dup_detect_idx_001
Create Date: 2026-02-05
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = 'syscohada_ref_001'
down_revision = 'dup_detect_idx_001'
branch_labels = None
depends_on = None


def upgrade():
    # Table syscohada_accounts - Referentiel SYSCOHADA
    op.create_table('syscohada_accounts',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('account_number', sa.String(10), nullable=False),
        sa.Column('account_label', sa.String(200), nullable=False),
        sa.Column('account_class', sa.Integer(), nullable=False),
        sa.Column('parent_account', sa.String(10), nullable=True),
        sa.Column('level', sa.Integer(), nullable=False, server_default='2'),
        sa.Column('is_detail', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('description', sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('account_number', name='uq_syscohada_accounts_number')
    )
    op.create_index('ix_syscohada_accounts_account_number', 'syscohada_accounts', ['account_number'])
    op.create_index('ix_syscohada_accounts_account_class', 'syscohada_accounts', ['account_class'])

    # Table supplier_categories - Categories fournisseurs
    op.create_table('supplier_categories',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('code', sa.String(20), nullable=False),
        sa.Column('label', sa.String(100), nullable=False),
        sa.Column('default_charge_account', sa.String(10), nullable=False),
        sa.Column('keywords', sa.JSON(), nullable=False, server_default='[]'),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('code', name='uq_supplier_categories_code'),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE')
    )
    op.create_index('ix_supplier_categories_code', 'supplier_categories', ['code'])
    op.create_index('ix_supplier_categories_tenant_id', 'supplier_categories', ['tenant_id'])

    # Table account_keywords - Mapping mots-cles
    op.create_table('account_keywords',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('keyword', sa.String(100), nullable=False),
        sa.Column('account_number', sa.String(10), nullable=False),
        sa.Column('priority', sa.Integer(), nullable=False, server_default='0'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_account_keywords_keyword', 'account_keywords', ['keyword'])

    # Ajouter category_id a suppliers
    op.add_column('suppliers', sa.Column('category_id', postgresql.UUID(as_uuid=True), nullable=True))
    op.create_foreign_key(
        'fk_suppliers_category_id',
        'suppliers', 'supplier_categories',
        ['category_id'], ['id'],
        ondelete='SET NULL'
    )
    op.create_index('ix_suppliers_category_id', 'suppliers', ['category_id'])


def downgrade():
    # Supprimer category_id de suppliers
    op.drop_index('ix_suppliers_category_id', 'suppliers')
    op.drop_constraint('fk_suppliers_category_id', 'suppliers', type_='foreignkey')
    op.drop_column('suppliers', 'category_id')

    # Supprimer les tables
    op.drop_table('account_keywords')
    op.drop_table('supplier_categories')
    op.drop_table('syscohada_accounts')
