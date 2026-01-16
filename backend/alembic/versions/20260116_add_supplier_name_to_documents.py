"""Add supplier_name column to documents table

Revision ID: 20260116_supplier_name
Revises: 20260116_add_team_invitations
Create Date: 2026-01-16

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '20260116_supplier_name'
down_revision = '20260116_add_team_invitations'
branch_labels = None
depends_on = None


def upgrade():
    # Add supplier_name column to documents table if it doesn't exist
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [col['name'] for col in inspector.get_columns('documents')]
    
    if 'supplier_name' not in columns:
        op.add_column('documents', sa.Column('supplier_name', sa.String(255), nullable=True))


def downgrade():
    # Remove supplier_name column
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [col['name'] for col in inspector.get_columns('documents')]
    
    if 'supplier_name' in columns:
        op.drop_column('documents', 'supplier_name')
