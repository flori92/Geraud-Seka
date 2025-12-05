"""Add segmentation tables

Revision ID: 20241205_segmentation
Revises: 20241205_email_tracking
Create Date: 2024-12-05

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '20241205_segmentation'
down_revision = '20241205_email_tracking'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Table segments
    op.create_table(
        'segments',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('color', sa.String(7), default='#3B82F6'),
        sa.Column('icon', sa.String(50), default='users'),
        sa.Column('segment_type', sa.String(20), nullable=False, default='static'),
        sa.Column('entity_type', sa.String(20), nullable=False, default='lead'),
        sa.Column('rules_logic', sa.String(10), default='AND'),
        sa.Column('is_active', sa.Boolean(), default=True),
        sa.Column('is_system', sa.Boolean(), default=False),
        sa.Column('member_count', sa.Integer(), default=0),
        sa.Column('last_computed_at', sa.DateTime(), nullable=True),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ondelete='SET NULL'),
    )
    
    op.create_index('ix_segments_tenant', 'segments', ['tenant_id'])
    op.create_index('ix_segments_entity_type', 'segments', ['entity_type'])
    op.create_index('ix_segments_type', 'segments', ['segment_type'])
    
    # Table segment_rules
    op.create_table(
        'segment_rules',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('segment_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('field', sa.String(100), nullable=False),
        sa.Column('operator', sa.String(30), nullable=False),
        sa.Column('value', sa.String(500), nullable=True),
        sa.Column('value_type', sa.String(20), default='string'),
        sa.Column('order', sa.Integer(), default=0),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['segment_id'], ['segments.id'], ondelete='CASCADE'),
    )
    
    op.create_index('ix_segment_rules_segment', 'segment_rules', ['segment_id'])
    
    # Table segment_memberships
    op.create_table(
        'segment_memberships',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('segment_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('lead_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('contact_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('client_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('added_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('added_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.Column('last_matched_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['segment_id'], ['segments.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['lead_id'], ['leads.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['contact_id'], ['contacts.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['client_id'], ['clients.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['added_by'], ['users.id'], ondelete='SET NULL'),
    )
    
    op.create_index('ix_segment_memberships_segment', 'segment_memberships', ['segment_id'])
    op.create_index('ix_segment_memberships_lead', 'segment_memberships', ['lead_id'])
    op.create_index('ix_segment_memberships_contact', 'segment_memberships', ['contact_id'])
    op.create_index('ix_segment_memberships_client', 'segment_memberships', ['client_id'])
    
    # Contraintes d'unicité
    op.create_unique_constraint('uq_segment_lead', 'segment_memberships', ['segment_id', 'lead_id'])
    op.create_unique_constraint('uq_segment_contact', 'segment_memberships', ['segment_id', 'contact_id'])
    op.create_unique_constraint('uq_segment_client', 'segment_memberships', ['segment_id', 'client_id'])


def downgrade() -> None:
    op.drop_table('segment_memberships')
    op.drop_table('segment_rules')
    op.drop_table('segments')
