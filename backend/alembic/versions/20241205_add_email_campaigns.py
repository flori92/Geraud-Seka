"""Add email campaigns tables

Revision ID: 20241205_campaigns
Revises: 20241205_ged_permissions
Create Date: 2024-12-05

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '20241205_campaigns'
down_revision = '20241205_ged_permissions'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Table email_templates
    op.create_table(
        'email_templates',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('category', sa.String(50), nullable=True),
        sa.Column('subject', sa.String(500), nullable=False),
        sa.Column('html_content', sa.Text(), nullable=False),
        sa.Column('text_content', sa.Text(), nullable=True),
        sa.Column('available_variables', postgresql.JSON(), nullable=True),
        sa.Column('preview_text', sa.String(200), nullable=True),
        sa.Column('thumbnail_url', sa.String(500), nullable=True),
        sa.Column('is_active', sa.Boolean(), default=True),
        sa.Column('is_system', sa.Boolean(), default=False),
        sa.Column('usage_count', sa.Integer(), default=0),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ondelete='SET NULL'),
    )
    
    op.create_index('ix_email_templates_tenant', 'email_templates', ['tenant_id'])
    op.create_index('ix_email_templates_category', 'email_templates', ['category'])
    
    # Table email_campaigns
    op.create_table(
        'email_campaigns',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('subject', sa.String(500), nullable=True),
        sa.Column('html_content', sa.Text(), nullable=True),
        sa.Column('text_content', sa.Text(), nullable=True),
        sa.Column('from_name', sa.String(100), nullable=True),
        sa.Column('from_email', sa.String(255), nullable=True),
        sa.Column('reply_to', sa.String(255), nullable=True),
        sa.Column('template_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('segment_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('target_entity_type', sa.String(20), default='lead'),
        sa.Column('additional_filters', postgresql.JSON(), nullable=True),
        sa.Column('status', sa.String(20), nullable=False, default='draft'),
        sa.Column('scheduled_at', sa.DateTime(), nullable=True),
        sa.Column('started_at', sa.DateTime(), nullable=True),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('total_recipients', sa.Integer(), default=0),
        sa.Column('sent_count', sa.Integer(), default=0),
        sa.Column('delivered_count', sa.Integer(), default=0),
        sa.Column('opened_count', sa.Integer(), default=0),
        sa.Column('clicked_count', sa.Integer(), default=0),
        sa.Column('bounced_count', sa.Integer(), default=0),
        sa.Column('unsubscribed_count', sa.Integer(), default=0),
        sa.Column('is_ab_test', sa.Boolean(), default=False),
        sa.Column('ab_variant', sa.String(1), nullable=True),
        sa.Column('ab_parent_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('ab_winner_criteria', sa.String(20), nullable=True),
        sa.Column('ab_test_percentage', sa.Integer(), default=20),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['template_id'], ['email_templates.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['segment_id'], ['segments.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['ab_parent_id'], ['email_campaigns.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ondelete='SET NULL'),
    )
    
    op.create_index('ix_campaigns_tenant', 'email_campaigns', ['tenant_id'])
    op.create_index('ix_campaigns_status', 'email_campaigns', ['status'])
    op.create_index('ix_campaigns_scheduled', 'email_campaigns', ['scheduled_at'])
    
    # Table campaign_recipients
    op.create_table(
        'campaign_recipients',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('campaign_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('lead_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('contact_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('client_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('status', sa.String(20), default='pending'),
        sa.Column('sent_at', sa.DateTime(), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('tracking_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('opened', sa.Boolean(), default=False),
        sa.Column('opened_at', sa.DateTime(), nullable=True),
        sa.Column('clicked', sa.Boolean(), default=False),
        sa.Column('clicked_at', sa.DateTime(), nullable=True),
        sa.Column('unsubscribed', sa.Boolean(), default=False),
        sa.Column('unsubscribed_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['campaign_id'], ['email_campaigns.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['lead_id'], ['leads.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['contact_id'], ['contacts.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['client_id'], ['clients.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['tracking_id'], ['email_tracking.id'], ondelete='SET NULL'),
    )
    
    op.create_index('ix_recipients_campaign', 'campaign_recipients', ['campaign_id'])
    op.create_index('ix_recipients_lead', 'campaign_recipients', ['lead_id'])
    op.create_index('ix_recipients_contact', 'campaign_recipients', ['contact_id'])
    op.create_index('ix_recipients_client', 'campaign_recipients', ['client_id'])
    op.create_index('ix_recipients_status', 'campaign_recipients', ['status'])
    
    # Contrainte d'unicité
    op.create_unique_constraint('uq_campaign_recipient_email', 'campaign_recipients', ['campaign_id', 'email'])


def downgrade() -> None:
    op.drop_table('campaign_recipients')
    op.drop_table('email_campaigns')
    op.drop_table('email_templates')
