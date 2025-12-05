"""Force add tenant subscription columns if missing

Revision ID: force_tenant_sub_002
Revises: add_subscription_001
Create Date: 2024-11-22 19:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision = 'force_tenant_sub_002'
down_revision = 'add_subscription_001'
branch_labels = None
depends_on = None


def column_exists(table_name, column_name):
    """Check if a column exists in a table"""
    try:
        bind = op.get_bind()
        inspector = inspect(bind)
        columns = [col['name'] for col in inspector.get_columns(table_name)]
        return column_name in columns
    except Exception:
        return False


def upgrade():
    """Force add subscription columns if they don't exist - retry of add_subscription_001"""
    try:
        if not column_exists('tenants', 'stripe_customer_id'):
            op.add_column('tenants', sa.Column('stripe_customer_id', sa.String(length=255), nullable=True))
    except Exception as e:
        print(f"Note: stripe_customer_id might already exist: {e}")

    try:
        if not column_exists('tenants', 'subscription_status'):
            op.add_column('tenants', sa.Column('subscription_status', sa.String(length=50), server_default='active', nullable=True))
    except Exception as e:
        print(f"Note: subscription_status might already exist: {e}")


def downgrade():
    # Don't remove columns on downgrade - they might be needed by other parts of the system
    pass
