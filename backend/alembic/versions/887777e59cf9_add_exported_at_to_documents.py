"""add exported_at to documents

Revision ID: 887777e59cf9
Revises: 8cfa9dbe9ee5
Create Date: 2026-01-17 21:39:14.122796

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '887777e59cf9'
down_revision = '8cfa9dbe9ee5'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('documents', sa.Column('exported_at', sa.DateTime(), nullable=True))
    op.add_column('documents', sa.Column('journal_type', sa.String(50), nullable=True))
    op.add_column('documents', sa.Column('accounting_entry_id', sa.UUID(), nullable=True))
    
    # Try to add FK if table exists
    try:
        op.create_foreign_key(
            'fk_documents_accounting_entry_header',
            'documents', 'accounting_entries_header',
            ['accounting_entry_id'], ['id']
        )
    except Exception:
        pass


def downgrade() -> None:
    try:
        op.drop_constraint('fk_documents_accounting_entry_header', 'documents', type_='foreignkey')
    except Exception:
        pass
    op.drop_column('documents', 'accounting_entry_id')
    op.drop_column('documents', 'journal_type')
    op.drop_column('documents', 'exported_at')
