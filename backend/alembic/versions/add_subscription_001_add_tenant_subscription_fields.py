"""add tenant subscription fields

Revision ID: add_subscription_001
Revises: seka_enterprise_001
Create Date: 2024-11-22 13:14:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_subscription_001'
down_revision = 'seka_enterprise_001'
branch_labels = None
depends_on = None


def upgrade():
    # Add subscription fields to tenants table
    op.add_column('tenants', sa.Column('stripe_customer_id', sa.String(length=255), nullable=True))
    op.add_column('tenants', sa.Column('subscription_status', sa.String(length=50), server_default='active', nullable=True))


def downgrade():
    op.drop_column('tenants', 'subscription_status')
    op.drop_column('tenants', 'stripe_customer_id')
