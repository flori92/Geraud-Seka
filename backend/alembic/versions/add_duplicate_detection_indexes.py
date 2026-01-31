"""add duplicate detection indexes

Optimizes queries for duplicate invoice detection:
- Criterion 1: Same supplier + Same invoice number
- Criterion 2: Same supplier + Same amount + Same date

Revision ID: dup_detect_idx_001
Revises: 887777e59cf9
Create Date: 2026-01-30

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'dup_detect_idx_001'
down_revision = '887777e59cf9'
branch_labels = None
depends_on = None


def index_exists(index_name, table_name):
    """Check if an index exists"""
    from sqlalchemy import inspect
    bind = op.get_bind()
    inspector = inspect(bind)
    try:
        indexes = inspector.get_indexes(table_name)
        return any(idx['name'] == index_name for idx in indexes)
    except Exception:
        return False


def upgrade():
    """
    Add indexes for duplicate detection performance.

    These indexes optimize the two detection criteria:
    1. Same supplier + Same invoice number (reference_number)
    2. Same supplier + Same amount (amount_ttc) + Same date (document_date)
    """

    # Index for Criterion 1: Supplier + Invoice Number
    # Used by: detect_duplicate() when checking same invoice number
    if not index_exists('idx_documents_duplicate_invoice', 'documents'):
        op.create_index(
            'idx_documents_duplicate_invoice',
            'documents',
            ['tenant_id', 'supplier_name', 'reference_number'],
            postgresql_where=sa.text("status != 'REJECTED'")
        )

    # Index for Criterion 2: Supplier + Amount + Date
    # Used by: detect_duplicate() when checking same amount and date
    if not index_exists('idx_documents_duplicate_amount_date', 'documents'):
        op.create_index(
            'idx_documents_duplicate_amount_date',
            'documents',
            ['tenant_id', 'supplier_name', 'amount_ttc', 'document_date'],
            postgresql_where=sa.text("status != 'REJECTED'")
        )

    # Index on document_duplicates for pending duplicates lookup
    if not index_exists('idx_duplicates_pending', 'document_duplicates'):
        op.create_index(
            'idx_duplicates_pending',
            'document_duplicates',
            ['tenant_id', 'resolution'],
            postgresql_where=sa.text("resolution IS NULL")
        )

    # Index on document_duplicates for history lookup
    if not index_exists('idx_duplicates_history', 'document_duplicates'):
        op.create_index(
            'idx_duplicates_history',
            'document_duplicates',
            ['tenant_id', 'resolved_at'],
            postgresql_where=sa.text("resolution IS NOT NULL")
        )


def downgrade():
    """Remove duplicate detection indexes"""
    op.drop_index('idx_documents_duplicate_invoice', table_name='documents')
    op.drop_index('idx_documents_duplicate_amount_date', table_name='documents')
    op.drop_index('idx_duplicates_pending', table_name='document_duplicates')
    op.drop_index('idx_duplicates_history', table_name='document_duplicates')
