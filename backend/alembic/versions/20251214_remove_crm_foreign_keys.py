"""Remove CRM foreign keys from quotes and documents tables

Revision ID: remove_crm_fks_001
Revises: add_quotes_opportunity
Create Date: 2025-12-14 14:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID


# revision identifiers, used by Alembic.
revision = 'remove_crm_fks_001'
down_revision = 'add_quotes_opportunity'
branch_labels = None
depends_on = None


def upgrade():
    """Remove CRM-related foreign keys since CRM module is disabled"""
    from sqlalchemy import inspect
    bind = op.get_bind()
    inspector = inspect(bind)

    # 1. Drop opportunity_id foreign key and column from quotes table
    if 'quotes' in inspector.get_table_names():
        columns = [col['name'] for col in inspector.get_columns('quotes')]

        if 'opportunity_id' in columns:
            # Drop index first
            try:
                op.drop_index('ix_quotes_opportunity_id', 'quotes')
            except Exception:
                pass  # Index might not exist

            # Drop foreign key constraint
            try:
                op.drop_constraint('fk_quotes_opportunity_id', 'quotes', type_='foreignkey')
            except Exception:
                pass  # Constraint might not exist

            # Drop column
            op.drop_column('quotes', 'opportunity_id')

    # 2. Drop CRM foreign keys from documents table
    if 'documents' in inspector.get_table_names():
        columns = [col['name'] for col in inspector.get_columns('documents')]

        # Drop lead_id
        if 'lead_id' in columns:
            try:
                op.drop_constraint('documents_lead_id_fkey', 'documents', type_='foreignkey')
            except Exception:
                pass
            op.drop_column('documents', 'lead_id')

        # Drop opportunity_id
        if 'opportunity_id' in columns:
            try:
                op.drop_constraint('documents_opportunity_id_fkey', 'documents', type_='foreignkey')
            except Exception:
                pass
            op.drop_column('documents', 'opportunity_id')


def downgrade():
    """Re-add CRM foreign keys (only if CRM module is re-enabled)"""
    from sqlalchemy import inspect
    bind = op.get_bind()
    inspector = inspect(bind)

    # Re-add opportunity_id to quotes
    if 'quotes' in inspector.get_table_names():
        op.add_column('quotes', sa.Column('opportunity_id', UUID(as_uuid=True), nullable=True))

        if 'opportunities' in inspector.get_table_names():
            op.create_foreign_key(
                'fk_quotes_opportunity_id',
                'quotes', 'opportunities',
                ['opportunity_id'], ['id'],
                ondelete='SET NULL'
            )

        op.create_index('ix_quotes_opportunity_id', 'quotes', ['opportunity_id'])

    # Re-add CRM fields to documents
    if 'documents' in inspector.get_table_names():
        op.add_column('documents', sa.Column('lead_id', UUID(as_uuid=True), nullable=True))
        op.add_column('documents', sa.Column('opportunity_id', UUID(as_uuid=True), nullable=True))

        if 'leads' in inspector.get_table_names():
            op.create_foreign_key(
                'documents_lead_id_fkey',
                'documents', 'leads',
                ['lead_id'], ['id'],
                ondelete='SET NULL'
            )

        if 'opportunities' in inspector.get_table_names():
            op.create_foreign_key(
                'documents_opportunity_id_fkey',
                'documents', 'opportunities',
                ['opportunity_id'], ['id'],
                ondelete='SET NULL'
            )
