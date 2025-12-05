"""Add ledger_accounts table

Revision ID: add_ledger_accounts_001
Revises: fix_tenant_sub_001
Create Date: 2024-12-05 13:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID


# revision identifiers, used by Alembic.
revision = 'add_ledger_accounts_001'
down_revision = '20241205_accounting'
branch_labels = None
depends_on = None


def upgrade():
    # Create accounttype enum if it doesn't exist
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE accounttype AS ENUM ('asset', 'liability', 'equity', 'revenue', 'expense');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)
    
    # Create ledger_accounts table
    op.create_table(
        'ledger_accounts',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, index=True),
        sa.Column('tenant_id', UUID(as_uuid=True), sa.ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('account_code', sa.String(20), nullable=False, index=True),
        sa.Column('account_name', sa.String(255), nullable=False),
        sa.Column('account_type', sa.Enum('asset', 'liability', 'equity', 'revenue', 'expense', name='accounttype'), nullable=False, index=True),
        sa.Column('balance', sa.Numeric(15, 2), default=0, nullable=False),
        sa.Column('currency', sa.String(3), default='XOF', nullable=False),
        sa.Column('description', sa.String(500), nullable=True),
        sa.Column('is_active', sa.Boolean, default=True, nullable=False),
    )


def downgrade():
    op.drop_table('ledger_accounts')
    op.execute("DROP TYPE IF EXISTS accounttype")
