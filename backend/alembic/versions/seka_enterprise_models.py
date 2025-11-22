"""Add SEKA Enterprise models: Analytics, CRM, AI features

Revision ID: seka_enterprise_001
Revises: 
Create Date: 2024-11-22 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = 'seka_enterprise_001'
down_revision = '20241113_01'
branch_labels = None
depends_on = None


def upgrade():
    """Upgrade database with SEKA Enterprise models"""
    
    # Analytics tables
    op.create_table('metrics',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('display_name', sa.String(length=150), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('category', sa.String(length=50), nullable=False),
        sa.Column('value', sa.Float(), nullable=False),
        sa.Column('previous_value', sa.Float(), nullable=True),
        sa.Column('unit', sa.String(length=20), nullable=True),
        sa.Column('calculation_method', sa.String(length=100), nullable=True),
        sa.Column('period', sa.String(length=20), nullable=True),
        sa.Column('timestamp', sa.DateTime(), nullable=False),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('metadata', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.Index('ix_metrics_name', 'name'),
        sa.Index('ix_metrics_category', 'category'),
        sa.Index('ix_metrics_timestamp', 'timestamp'),
        sa.Index('ix_metrics_tenant_id', 'tenant_id')
    )
    
    op.create_table('dashboards',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('slug', sa.String(length=150), nullable=False, unique=True),
        sa.Column('layout', sa.JSON(), nullable=False),
        sa.Column('filters', sa.JSON(), nullable=True),
        sa.Column('refresh_interval', sa.Integer(), default=30),
        sa.Column('is_public', sa.Boolean(), default=False),
        sa.Column('is_default', sa.Boolean(), default=False),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['created_by'], ['users.id']),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE')
    )
    
    op.create_table('alerts',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('severity', sa.String(length=20), nullable=False, default='info'),
        sa.Column('metric_name', sa.String(length=100), nullable=True),
        sa.Column('threshold_value', sa.Float(), nullable=True),
        sa.Column('actual_value', sa.Float(), nullable=True),
        sa.Column('condition', sa.String(length=50), nullable=True),
        sa.Column('is_read', sa.Boolean(), default=False),
        sa.Column('is_resolved', sa.Boolean(), default=False),
        sa.Column('resolved_at', sa.DateTime(), nullable=True),
        sa.Column('resolved_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('suggested_actions', sa.JSON(), nullable=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.ForeignKeyConstraint(['resolved_by'], ['users.id']),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE')
    )
    
    op.create_table('business_insights',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('insight_type', sa.String(length=50), nullable=False),
        sa.Column('confidence_score', sa.Float(), nullable=True),
        sa.Column('priority', sa.String(length=20), default='medium'),
        sa.Column('supporting_data', sa.JSON(), nullable=True),
        sa.Column('recommendations', sa.JSON(), nullable=True),
        sa.Column('is_dismissed', sa.Boolean(), default=False),
        sa.Column('is_acted_upon', sa.Boolean(), default=False),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE')
    )
    
    # CRM tables
    op.create_table('leads',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('first_name', sa.String(length=100), nullable=False),
        sa.Column('last_name', sa.String(length=100), nullable=False),
        sa.Column('full_name', sa.String(length=255), nullable=True),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('phone', sa.String(length=20), nullable=True),
        sa.Column('mobile', sa.String(length=20), nullable=True),
        sa.Column('company', sa.String(length=255), nullable=True),
        sa.Column('job_title', sa.String(length=100), nullable=True),
        sa.Column('industry', sa.String(length=100), nullable=True),
        sa.Column('company_size', sa.String(length=50), nullable=True),
        sa.Column('annual_revenue', sa.String(length=50), nullable=True),
        sa.Column('address', sa.Text(), nullable=True),
        sa.Column('city', sa.String(length=100), nullable=True),
        sa.Column('country', sa.String(length=100), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False, default='new'),
        sa.Column('source', sa.String(length=50), nullable=False, default='direct'),
        sa.Column('score', sa.Integer(), default=0),
        sa.Column('quality_grade', sa.String(length=2), nullable=True),
        sa.Column('email_opens', sa.Integer(), default=0),
        sa.Column('email_clicks', sa.Integer(), default=0),
        sa.Column('website_visits', sa.Integer(), default=0),
        sa.Column('last_activity_date', sa.DateTime(), nullable=True),
        sa.Column('budget_range', sa.String(length=50), nullable=True),
        sa.Column('timeline', sa.String(length=50), nullable=True),
        sa.Column('pain_points', sa.JSON(), nullable=True),
        sa.Column('last_contact_date', sa.DateTime(), nullable=True),
        sa.Column('next_action_date', sa.DateTime(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('tags', sa.JSON(), nullable=True),
        sa.Column('converted_at', sa.DateTime(), nullable=True),
        sa.Column('converted_to_client_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('conversion_value', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('assigned_to', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['assigned_to'], ['users.id']),
        sa.ForeignKeyConstraint(['converted_to_client_id'], ['clients.id']),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.Index('ix_leads_email', 'email'),
        sa.Index('ix_leads_company', 'company'),
        sa.Index('ix_leads_status', 'status'),
        sa.Index('ix_leads_source', 'source'),
        sa.Index('ix_leads_score', 'score'),
        sa.Index('ix_leads_assigned_to', 'assigned_to'),
        sa.Index('ix_leads_next_action_date', 'next_action_date')
    )
    
    op.create_table('opportunities',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('reference', sa.String(length=100), nullable=True, unique=True),
        sa.Column('amount', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('currency', sa.String(length=3), default='XOF'),
        sa.Column('probability', sa.Integer(), default=50),
        sa.Column('stage', sa.String(length=50), nullable=False, default='qualification'),
        sa.Column('stage_changed_at', sa.DateTime(), default=sa.func.now()),
        sa.Column('created_date', sa.Date(), default=sa.func.current_date()),
        sa.Column('expected_close_date', sa.Date(), nullable=True),
        sa.Column('actual_close_date', sa.Date(), nullable=True),
        sa.Column('last_activity_date', sa.DateTime(), nullable=True),
        sa.Column('products_interested', sa.JSON(), nullable=True),
        sa.Column('requirements', sa.Text(), nullable=True),
        sa.Column('budget_confirmed', sa.Boolean(), default=False),
        sa.Column('decision_maker_identified', sa.Boolean(), default=False),
        sa.Column('competitors', sa.JSON(), nullable=True),
        sa.Column('competitive_advantage', sa.Text(), nullable=True),
        sa.Column('forecast_category', sa.String(length=20), default='pipeline'),
        sa.Column('next_action', sa.Text(), nullable=True),
        sa.Column('loss_reason', sa.String(length=255), nullable=True),
        sa.Column('lead_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('client_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('assigned_to', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['lead_id'], ['leads.id']),
        sa.ForeignKeyConstraint(['client_id'], ['clients.id']),
        sa.ForeignKeyConstraint(['assigned_to'], ['users.id']),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.Index('ix_opportunities_stage', 'stage'),
        sa.Index('ix_opportunities_expected_close_date', 'expected_close_date')
    )
    
    op.create_table('crm_activities',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('type', sa.String(length=50), nullable=False, default='note'),
        sa.Column('subject', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('due_date', sa.DateTime(), nullable=True),
        sa.Column('duration_minutes', sa.Integer(), nullable=True),
        sa.Column('is_completed', sa.Boolean(), default=False),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('priority', sa.String(length=20), default='medium'),
        sa.Column('outcome', sa.String(length=50), nullable=True),
        sa.Column('next_action_required', sa.Boolean(), default=False),
        sa.Column('next_action_description', sa.Text(), nullable=True),
        sa.Column('call_duration', sa.Integer(), nullable=True),
        sa.Column('email_opened', sa.Boolean(), nullable=True),
        sa.Column('meeting_attended', sa.Boolean(), nullable=True),
        sa.Column('lead_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('client_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('opportunity_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('assigned_to', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['lead_id'], ['leads.id']),
        sa.ForeignKeyConstraint(['client_id'], ['clients.id']),
        sa.ForeignKeyConstraint(['opportunity_id'], ['opportunities.id']),
        sa.ForeignKeyConstraint(['assigned_to'], ['users.id']),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE')
    )
    
    op.create_table('campaigns',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('type', sa.String(length=50), nullable=False),
        sa.Column('start_date', sa.DateTime(), nullable=False),
        sa.Column('end_date', sa.DateTime(), nullable=True),
        sa.Column('budget', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('message', sa.Text(), nullable=True),
        sa.Column('call_to_action', sa.String(length=255), nullable=True),
        sa.Column('landing_page_url', sa.String(length=500), nullable=True),
        sa.Column('target_audience', sa.JSON(), nullable=True),
        sa.Column('expected_reach', sa.Integer(), nullable=True),
        sa.Column('status', sa.String(length=20), default='draft'),
        sa.Column('total_sent', sa.Integer(), default=0),
        sa.Column('total_opened', sa.Integer(), default=0),
        sa.Column('total_clicked', sa.Integer(), default=0),
        sa.Column('total_converted', sa.Integer(), default=0),
        sa.Column('total_cost', sa.Numeric(precision=15, scale=2), default=0),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['created_by'], ['users.id']),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE')
    )


def downgrade():
    """Downgrade database by dropping SEKA Enterprise tables"""
    op.drop_table('campaigns')
    op.drop_table('crm_activities')
    op.drop_table('opportunities')
    op.drop_table('leads')
    op.drop_table('business_insights')
    op.drop_table('alerts')
    op.drop_table('dashboards')
    op.drop_table('metrics')