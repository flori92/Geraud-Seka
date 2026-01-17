"""add team invitations table

Revision ID: 20260116_add_team_invitations
Revises: 20260116_add_tiers_interconnection
Create Date: 2026-01-16 19:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '20260116_add_team_invitations'
down_revision = '20260116_tiers'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'team_invitations',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('email', sa.String(255), nullable=False, index=True),
        sa.Column('role', sa.String(50), nullable=False, server_default='viewer'),
        sa.Column('token', sa.String(255), unique=True, nullable=False, index=True),
        sa.Column('invited_by_id', postgresql.UUID(as_uuid=True), 
                  sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), 
                  sa.ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.Column('accepted_at', sa.DateTime(), nullable=True),
        sa.Column('is_accepted', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('is_cancelled', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
    )
    
    op.create_index('ix_team_invitations_email', 'team_invitations', ['email'])
    op.create_index('ix_team_invitations_token', 'team_invitations', ['token'])
    op.create_index('ix_team_invitations_tenant_id', 'team_invitations', ['tenant_id'])


def downgrade():
    op.drop_index('ix_team_invitations_tenant_id', 'team_invitations')
    op.drop_index('ix_team_invitations_token', 'team_invitations')
    op.drop_index('ix_team_invitations_email', 'team_invitations')
    op.drop_table('team_invitations')
