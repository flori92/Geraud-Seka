"""Add email tracking tables

Revision ID: 20241205_email_tracking
Revises: 20241205_refactor_documents_ged
Create Date: 2024-12-05

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '20241205_email_tracking'
down_revision = '20241205_refactor_documents_ged'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Table email_tracking
    op.create_table(
        'email_tracking',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('tracking_token', sa.String(64), nullable=False),
        sa.Column('resend_message_id', sa.String(255), nullable=True),
        sa.Column('subject', sa.String(500), nullable=True),
        sa.Column('recipient_email', sa.String(255), nullable=False),
        sa.Column('lead_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('contact_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('open_count', sa.Integer(), default=0),
        sa.Column('click_count', sa.Integer(), default=0),
        sa.Column('first_opened_at', sa.DateTime(), nullable=True),
        sa.Column('last_opened_at', sa.DateTime(), nullable=True),
        sa.Column('first_clicked_at', sa.DateTime(), nullable=True),
        sa.Column('last_clicked_at', sa.DateTime(), nullable=True),
        sa.Column('is_bounced', sa.Boolean(), default=False),
        sa.Column('bounced_at', sa.DateTime(), nullable=True),
        sa.Column('bounce_reason', sa.String(500), nullable=True),
        sa.Column('campaign_id', sa.String(100), nullable=True),
        sa.Column('template_name', sa.String(100), nullable=True),
        sa.Column('metadata', postgresql.JSON(), nullable=True),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('sent_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['lead_id'], ['leads.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['contact_id'], ['contacts.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['sent_by'], ['users.id'], ondelete='SET NULL'),
    )
    
    # Index sur tracking_token (unique)
    op.create_index('ix_email_tracking_token', 'email_tracking', ['tracking_token'], unique=True)
    op.create_index('ix_email_tracking_recipient', 'email_tracking', ['recipient_email'])
    op.create_index('ix_email_tracking_lead', 'email_tracking', ['lead_id'])
    op.create_index('ix_email_tracking_contact', 'email_tracking', ['contact_id'])
    op.create_index('ix_email_tracking_tenant', 'email_tracking', ['tenant_id'])
    
    # Table email_events
    op.create_table(
        'email_events',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('tracking_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('event_type', sa.String(20), nullable=False),
        sa.Column('clicked_url', sa.String(2000), nullable=True),
        sa.Column('user_agent', sa.String(500), nullable=True),
        sa.Column('ip_address', sa.String(45), nullable=True),
        sa.Column('device_type', sa.String(20), nullable=True),
        sa.Column('browser', sa.String(50), nullable=True),
        sa.Column('os', sa.String(50), nullable=True),
        sa.Column('country', sa.String(100), nullable=True),
        sa.Column('city', sa.String(100), nullable=True),
        sa.Column('occurred_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['tracking_id'], ['email_tracking.id'], ondelete='CASCADE'),
    )
    
    op.create_index('ix_email_events_tracking', 'email_events', ['tracking_id'])
    op.create_index('ix_email_events_type', 'email_events', ['event_type'])
    op.create_index('ix_email_events_occurred', 'email_events', ['occurred_at'])
    
    # Table email_links
    op.create_table(
        'email_links',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('link_token', sa.String(64), nullable=False),
        sa.Column('tracking_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('original_url', sa.String(2000), nullable=False),
        sa.Column('click_count', sa.Integer(), default=0),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['tracking_id'], ['email_tracking.id'], ondelete='CASCADE'),
    )
    
    op.create_index('ix_email_links_token', 'email_links', ['link_token'], unique=True)
    op.create_index('ix_email_links_tracking', 'email_links', ['tracking_id'])


def downgrade() -> None:
    op.drop_table('email_links')
    op.drop_table('email_events')
    op.drop_table('email_tracking')
