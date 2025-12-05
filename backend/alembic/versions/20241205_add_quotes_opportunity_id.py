"""Add opportunity_id column to quotes table

Revision ID: add_quotes_opportunity
Revises: fix_tenant_sub_001
Create Date: 2024-12-05 21:15:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID


# revision identifiers, used by Alembic.
revision = 'add_quotes_opportunity'
down_revision = 'fix_tenant_sub_001'
branch_labels = None
depends_on = None


def upgrade():
    """Add opportunity_id column to quotes table if it doesn't exist"""
    # Check if quotes table exists and if column doesn't exist
    from sqlalchemy import inspect
    bind = op.get_bind()
    inspector = inspect(bind)

    if 'quotes' not in inspector.get_table_names():
        return  # Table doesn't exist yet

    columns = [col['name'] for col in inspector.get_columns('quotes')]

    if 'opportunity_id' not in columns:
        # Add opportunity_id column
        op.add_column('quotes', sa.Column('opportunity_id', UUID(as_uuid=True), nullable=True))

        # Add foreign key constraint if opportunities table exists
        if 'opportunities' in inspector.get_table_names():
            op.create_foreign_key(
                'fk_quotes_opportunity_id',
                'quotes', 'opportunities',
                ['opportunity_id'], ['id'],
                ondelete='SET NULL'
            )

        # Add index for performance
        op.create_index('ix_quotes_opportunity_id', 'quotes', ['opportunity_id'])


def downgrade():
    """Remove opportunity_id column from quotes table"""
    op.drop_index('ix_quotes_opportunity_id', 'quotes')
    op.drop_constraint('fk_quotes_opportunity_id', 'quotes', type_='foreignkey')
    op.drop_column('quotes', 'opportunity_id')
