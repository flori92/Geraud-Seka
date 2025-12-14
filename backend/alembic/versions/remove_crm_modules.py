"""Remove CRM modules (activities, opportunities, leads)

Revision ID: remove_crm_001
Revises: add_accounting_entries
Create Date: 2025-12-14

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'remove_crm_001'
down_revision = 'add_accounting_entries'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Remove all CRM-related tables"""
    # Drop tables that reference crm_activities first (foreign key constraints)
    tables_to_drop = [
        'crm_activities',
        'opportunities',
        'leads',
        'email_campaigns',
        'email_campaign_recipients',
    ]
    
    for table in tables_to_drop:
        try:
            op.drop_table(table)
            print(f"✅ Table {table} supprimée")
        except Exception as e:
            print(f"⚠️  Impossible de supprimer {table}: {e}")


def downgrade() -> None:
    """Downgrade not supported - CRM tables permanently removed"""
    pass
