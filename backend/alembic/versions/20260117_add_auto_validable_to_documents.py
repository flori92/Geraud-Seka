"""add auto_validable to documents

Revision ID: 20260117_add_auto_validable
Revises: 20260116_add_team_invitations
Create Date: 2026-01-17 01:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '20260117_add_auto_validable'
down_revision = '20260116_add_team_invitations'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('documents', 
        sa.Column('auto_validable', sa.Boolean(), nullable=True, server_default='false')
    )
    op.add_column('documents', 
        sa.Column('matched_rule_id', sa.String(255), nullable=True)
    )
    op.add_column('documents', 
        sa.Column('matched_rule_name', sa.String(255), nullable=True)
    )


def downgrade():
    op.drop_column('documents', 'matched_rule_name')
    op.drop_column('documents', 'matched_rule_id')
    op.drop_column('documents', 'auto_validable')
