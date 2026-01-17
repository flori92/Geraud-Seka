"""Add tiers interconnection columns for Plan Comptable, Fournisseurs, Règles

Revision ID: 20260116_add_tiers_interconnection
Revises: 20260109_file_hash
Create Date: 2026-01-16

Cette migration ajoute les colonnes nécessaires pour l'interconnexion SEKA Business:
- Supplier: code, auxiliary_account_id, default_rule_id, has_active_rule, etc.
- ChartOfAccounts: is_auxiliary, is_collective, linked_supplier_id, etc.
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '20260116_tiers'
down_revision = '20260109_file_hash'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # =========================================================================
    # SUPPLIERS TABLE - Ajout des colonnes d'interconnexion
    # =========================================================================
    
    # Colonnes de base
    op.add_column('suppliers', sa.Column('code', sa.String(20), nullable=True, index=True))
    op.add_column('suppliers', sa.Column('rccm', sa.String(50), nullable=True))
    
    # Interconnexion Plan Comptable
    op.add_column('suppliers', sa.Column('auxiliary_account_id', postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column('suppliers', sa.Column('auxiliary_account_code', sa.String(20), nullable=True))
    op.add_column('suppliers', sa.Column('collective_account_code', sa.String(10), nullable=True, default='401'))
    
    # Interconnexion Règles
    op.add_column('suppliers', sa.Column('default_rule_id', postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column('suppliers', sa.Column('has_active_rule', sa.Boolean(), nullable=True, default=False))
    
    # Comptes par défaut
    op.add_column('suppliers', sa.Column('default_charge_account', sa.String(20), nullable=True))
    op.add_column('suppliers', sa.Column('default_vat_account', sa.String(20), nullable=True, default='4454'))
    
    # OCR Keywords
    op.add_column('suppliers', sa.Column('ocr_keywords', postgresql.JSON(), nullable=True))
    
    # Metadata pour apprentissage
    op.add_column('suppliers', sa.Column('metadata', postgresql.JSON(), nullable=True))
    
    # Tenant ID (si pas déjà présent)
    op.add_column('suppliers', sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=True))
    
    # Foreign keys pour suppliers
    try:
        op.create_foreign_key(
            'fk_suppliers_auxiliary_account',
            'suppliers', 'chart_of_accounts',
            ['auxiliary_account_id'], ['id'],
            ondelete='SET NULL'
        )
    except Exception:
        pass
    
    try:
        op.create_foreign_key(
            'fk_suppliers_default_rule',
            'suppliers', 'accounting_rules',
            ['default_rule_id'], ['id'],
            ondelete='SET NULL'
        )
    except Exception:
        pass
    
    try:
        op.create_foreign_key(
            'fk_suppliers_tenant',
            'suppliers', 'tenants',
            ['tenant_id'], ['id'],
            ondelete='CASCADE'
        )
    except Exception:
        pass
    
    # =========================================================================
    # CHART_OF_ACCOUNTS TABLE - Ajout des colonnes auxiliaires
    # =========================================================================
    
    # Types de comptes spéciaux
    op.add_column('chart_of_accounts', sa.Column('is_auxiliary', sa.Boolean(), nullable=True, default=False))
    op.add_column('chart_of_accounts', sa.Column('is_collective', sa.Boolean(), nullable=True, default=False))
    
    # Liens vers les tiers
    op.add_column('chart_of_accounts', sa.Column('linked_supplier_id', postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column('chart_of_accounts', sa.Column('linked_client_id', postgresql.UUID(as_uuid=True), nullable=True))
    
    # Code du compte collectif parent
    op.add_column('chart_of_accounts', sa.Column('collective_parent_code', sa.String(10), nullable=True))
    
    # Foreign keys pour chart_of_accounts
    try:
        op.create_foreign_key(
            'fk_coa_linked_supplier',
            'chart_of_accounts', 'suppliers',
            ['linked_supplier_id'], ['id'],
            ondelete='SET NULL'
        )
    except Exception:
        pass
    
    try:
        op.create_foreign_key(
            'fk_coa_linked_client',
            'chart_of_accounts', 'clients',
            ['linked_client_id'], ['id'],
            ondelete='SET NULL'
        )
    except Exception:
        pass
    
    # =========================================================================
    # Marquer les comptes collectifs existants (401, 411)
    # =========================================================================
    op.execute("""
        UPDATE chart_of_accounts 
        SET is_collective = TRUE 
        WHERE account_number IN ('401', '411')
    """)


def downgrade() -> None:
    # Chart of accounts
    op.drop_constraint('fk_coa_linked_client', 'chart_of_accounts', type_='foreignkey')
    op.drop_constraint('fk_coa_linked_supplier', 'chart_of_accounts', type_='foreignkey')
    op.drop_column('chart_of_accounts', 'collective_parent_code')
    op.drop_column('chart_of_accounts', 'linked_client_id')
    op.drop_column('chart_of_accounts', 'linked_supplier_id')
    op.drop_column('chart_of_accounts', 'is_collective')
    op.drop_column('chart_of_accounts', 'is_auxiliary')
    
    # Suppliers
    op.drop_constraint('fk_suppliers_tenant', 'suppliers', type_='foreignkey')
    op.drop_constraint('fk_suppliers_default_rule', 'suppliers', type_='foreignkey')
    op.drop_constraint('fk_suppliers_auxiliary_account', 'suppliers', type_='foreignkey')
    op.drop_column('suppliers', 'tenant_id')
    op.drop_column('suppliers', 'ocr_keywords')
    op.drop_column('suppliers', 'default_vat_account')
    op.drop_column('suppliers', 'default_charge_account')
    op.drop_column('suppliers', 'has_active_rule')
    op.drop_column('suppliers', 'default_rule_id')
    op.drop_column('suppliers', 'collective_account_code')
    op.drop_column('suppliers', 'auxiliary_account_code')
    op.drop_column('suppliers', 'auxiliary_account_id')
    op.drop_column('suppliers', 'rccm')
    op.drop_column('suppliers', 'code')
