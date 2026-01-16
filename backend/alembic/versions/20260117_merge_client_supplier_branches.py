"""merge client and supplier branches

Revision ID: 20260117_merge_branches
Revises: 20260117_add_auxiliary_account_to_clients, 20260117_accounting_entries
Create Date: 2026-01-17 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '20260117_merge_branches'
down_revision = ('20260117_add_auxiliary_account_to_clients', '20260117_accounting_entries')
branch_labels = None
depends_on = None


def upgrade():
    """Merge migration - no changes needed"""
    pass


def downgrade():
    """Merge migration - no changes needed"""
    pass
