"""add_auxiliary_account_to_clients

Revision ID: 20260117_add_auxiliary_account_to_clients
Revises: 20260117_add_auxiliary_account_to_suppliers
Create Date: 2026-01-17 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '20260117_add_auxiliary_account_to_clients'
down_revision = '20260117_add_auto_validable'
branch_labels = None
depends_on = None


def upgrade():
    """
    Ajoute les colonnes d'interconnexion aux clients (équivalent fournisseurs)
    pour supporter les comptes auxiliaires 411XXX et les règles d'imputation
    """
    
    # Ajouter nouvelles colonnes au modèle Client
    op.add_column('clients', sa.Column('code', sa.String(20), nullable=True))
    op.add_column('clients', sa.Column('nif', sa.String(50), nullable=True))
    op.add_column('clients', sa.Column('rccm', sa.String(50), nullable=True))
    op.add_column('clients', sa.Column('contact_name', sa.String(255), nullable=True))
    op.add_column('clients', sa.Column('email', sa.String(255), nullable=True))
    op.add_column('clients', sa.Column('phone', sa.String(50), nullable=True))
    op.add_column('clients', sa.Column('address', sa.Text, nullable=True))
    op.add_column('clients', sa.Column('country', sa.String(100), nullable=True, server_default='Bénin'))
    
    # Colonnes pour interconnexion Plan Comptable
    op.add_column('clients', sa.Column('auxiliary_account_id', postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column('clients', sa.Column('auxiliary_account_code', sa.String(20), nullable=True))
    op.add_column('clients', sa.Column('collective_account_code', sa.String(10), nullable=True, server_default='411'))
    
    # Colonnes pour règles d'imputation
    op.add_column('clients', sa.Column('default_rule_id', postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column('clients', sa.Column('has_active_rule', sa.Boolean, nullable=True, server_default='false'))
    op.add_column('clients', sa.Column('default_revenue_account', sa.String(20), nullable=True))
    op.add_column('clients', sa.Column('default_vat_account', sa.String(20), nullable=True, server_default='4457'))
    op.add_column('clients', sa.Column('default_tax_rate', sa.Numeric(5, 2), nullable=True, server_default='18.00'))
    op.add_column('clients', sa.Column('default_journal', sa.String(10), nullable=True, server_default='VTE'))
    op.add_column('clients', sa.Column('default_description', sa.String(255), nullable=True))
    
    # Mots-clés OCR et métadonnées
    op.add_column('clients', sa.Column('ocr_keywords', postgresql.JSON(), nullable=True))
    op.add_column('clients', sa.Column('client_metadata', postgresql.JSON(), nullable=True))
    
    # Créer les foreign keys
    op.create_foreign_key(
        'fk_clients_auxiliary_account',
        'clients', 'chart_of_accounts',
        ['auxiliary_account_id'], ['id'],
        ondelete='SET NULL'
    )
    
    op.create_foreign_key(
        'fk_clients_default_rule',
        'clients', 'accounting_rules',
        ['default_rule_id'], ['id'],
        ondelete='SET NULL'
    )
    
    # Créer index pour recherche rapide
    op.create_index('ix_clients_code', 'clients', ['code'])
    op.create_index('ix_clients_auxiliary_account_code', 'clients', ['auxiliary_account_code'])


def downgrade():
    """Supprime les colonnes ajoutées"""
    
    # Supprimer les index
    op.drop_index('ix_clients_auxiliary_account_code', 'clients')
    op.drop_index('ix_clients_code', 'clients')
    
    # Supprimer les foreign keys
    op.drop_constraint('fk_clients_default_rule', 'clients', type_='foreignkey')
    op.drop_constraint('fk_clients_auxiliary_account', 'clients', type_='foreignkey')
    
    # Supprimer les colonnes
    op.drop_column('clients', 'client_metadata')
    op.drop_column('clients', 'ocr_keywords')
    op.drop_column('clients', 'default_description')
    op.drop_column('clients', 'default_journal')
    op.drop_column('clients', 'default_tax_rate')
    op.drop_column('clients', 'default_vat_account')
    op.drop_column('clients', 'default_revenue_account')
    op.drop_column('clients', 'has_active_rule')
    op.drop_column('clients', 'default_rule_id')
    op.drop_column('clients', 'collective_account_code')
    op.drop_column('clients', 'auxiliary_account_code')
    op.drop_column('clients', 'auxiliary_account_id')
    op.drop_column('clients', 'country')
    op.drop_column('clients', 'address')
    op.drop_column('clients', 'phone')
    op.drop_column('clients', 'email')
    op.drop_column('clients', 'contact_name')
    op.drop_column('clients', 'rccm')
    op.drop_column('clients', 'nif')
    op.drop_column('clients', 'code')
