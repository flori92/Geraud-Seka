"""Fix tenant subscription columns - force add if missing

Revision ID: fix_tenant_sub_001
Revises: add_subscription_001
Create Date: 2024-12-05 07:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision = 'fix_tenant_sub_001'
down_revision = 'fix_ledger_is_active'
branch_labels = None
depends_on = None


def column_exists(table_name, column_name):
    """Check if a column exists in a table"""
    bind = op.get_bind()
    inspector = inspect(bind)
    columns = [col['name'] for col in inspector.get_columns(table_name)]
    return column_name in columns


def upgrade():
    """Force add subscription columns if they don't exist"""
    if not column_exists('tenants', 'stripe_customer_id'):
        op.add_column('tenants', sa.Column('stripe_customer_id', sa.String(length=255), nullable=True))
    if not column_exists('tenants', 'subscription_status'):
        op.add_column('tenants', sa.Column('subscription_status', sa.String(length=50), server_default='active', nullable=True))


def downgrade():
    # Don't remove columns on downgrade - they might be needed
    pass
