"""Fix suppliers tenant_id column - CRITICAL PRODUCTION FIX

Revision ID: 20260202_fix_suppliers
Revises: add_duplicate_detection_indexes
Create Date: 2026-02-02

Cette migration ajoute la colonne tenant_id manquante dans la table suppliers.
ERREUR PRODUCTION: column suppliers.tenant_id does not exist
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '20260202_fix_suppliers'
down_revision = 'add_duplicate_detection_indexes'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Ajoute tenant_id et autres colonnes manquantes à suppliers."""

    # Vérifier et ajouter les colonnes manquantes de façon sécurisée
    conn = op.get_bind()
    inspector = sa.inspect(conn)

    # Récupérer les colonnes existantes
    existing_columns = [col['name'] for col in inspector.get_columns('suppliers')]

    # Colonnes à ajouter si manquantes
    columns_to_add = {
        'tenant_id': sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=True),
        'code': sa.Column('code', sa.String(20), nullable=True),
        'rccm': sa.Column('rccm', sa.String(50), nullable=True),
        'auxiliary_account_id': sa.Column('auxiliary_account_id', postgresql.UUID(as_uuid=True), nullable=True),
        'auxiliary_account_code': sa.Column('auxiliary_account_code', sa.String(20), nullable=True),
        'collective_account_code': sa.Column('collective_account_code', sa.String(10), nullable=True),
        'default_rule_id': sa.Column('default_rule_id', postgresql.UUID(as_uuid=True), nullable=True),
        'has_active_rule': sa.Column('has_active_rule', sa.Boolean(), nullable=True, server_default='false'),
        'default_charge_account': sa.Column('default_charge_account', sa.String(20), nullable=True),
        'default_vat_account': sa.Column('default_vat_account', sa.String(20), nullable=True),
        'default_account': sa.Column('default_account', sa.String(20), nullable=True),
        'default_tax_rate': sa.Column('default_tax_rate', sa.Numeric(5, 2), nullable=True),
        'default_journal': sa.Column('default_journal', sa.String(10), nullable=True),
        'default_description': sa.Column('default_description', sa.String(255), nullable=True),
        'ocr_keywords': sa.Column('ocr_keywords', postgresql.JSON(), nullable=True),
        'supplier_metadata': sa.Column('supplier_metadata', postgresql.JSON(), nullable=True),
    }

    for col_name, col_def in columns_to_add.items():
        if col_name not in existing_columns:
            print(f"  Adding column suppliers.{col_name}")
            op.add_column('suppliers', col_def)

    # Créer un index sur tenant_id si la colonne existe maintenant
    try:
        op.create_index('ix_suppliers_tenant_id', 'suppliers', ['tenant_id'], unique=False)
    except Exception:
        pass  # Index peut déjà exister

    # Foreign keys (ignorer les erreurs si déjà existantes)
    fk_definitions = [
        ('fk_suppliers_tenant', 'suppliers', 'tenants', ['tenant_id'], ['id'], 'CASCADE'),
        ('fk_suppliers_auxiliary_account', 'suppliers', 'chart_of_accounts', ['auxiliary_account_id'], ['id'], 'SET NULL'),
        ('fk_suppliers_default_rule', 'suppliers', 'accounting_rules', ['default_rule_id'], ['id'], 'SET NULL'),
    ]

    for fk_name, source_table, target_table, source_cols, target_cols, ondelete in fk_definitions:
        try:
            op.create_foreign_key(
                fk_name, source_table, target_table,
                source_cols, target_cols,
                ondelete=ondelete
            )
        except Exception:
            pass  # FK peut déjà exister

    # Mettre à jour tenant_id avec client.tenant_id pour les suppliers existants
    op.execute("""
        UPDATE suppliers s
        SET tenant_id = c.tenant_id
        FROM clients c
        WHERE s.client_id = c.id
        AND s.tenant_id IS NULL
    """)

    # Mettre à jour les valeurs par défaut
    op.execute("""
        UPDATE suppliers
        SET collective_account_code = '401'
        WHERE collective_account_code IS NULL
    """)

    op.execute("""
        UPDATE suppliers
        SET default_vat_account = '4454'
        WHERE default_vat_account IS NULL
    """)

    op.execute("""
        UPDATE suppliers
        SET default_journal = 'ACH'
        WHERE default_journal IS NULL
    """)

    op.execute("""
        UPDATE suppliers
        SET default_tax_rate = 18.00
        WHERE default_tax_rate IS NULL
    """)


def downgrade() -> None:
    """Remove added columns."""
    try:
        op.drop_constraint('fk_suppliers_tenant', 'suppliers', type_='foreignkey')
    except Exception:
        pass
    try:
        op.drop_constraint('fk_suppliers_auxiliary_account', 'suppliers', type_='foreignkey')
    except Exception:
        pass
    try:
        op.drop_constraint('fk_suppliers_default_rule', 'suppliers', type_='foreignkey')
    except Exception:
        pass
    try:
        op.drop_index('ix_suppliers_tenant_id', 'suppliers')
    except Exception:
        pass
