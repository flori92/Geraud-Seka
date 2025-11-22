"""Add CRM integration fields and tables

Revision ID: 20241122_add_crm_integration
Revises: 20241122_add_treasury_forecasts_alerts
Create Date: 2024-11-22 21:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID
import uuid


# revision identifiers, used by Alembic.
revision = '20241122_add_crm_integration'
down_revision = '20241122_add_treasury_forecasts_alerts'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add CRM tables and fields"""
    
    # Create leads table
    op.create_table('leads',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('first_name', sa.String(100), nullable=False),
        sa.Column('last_name', sa.String(100), nullable=False),
        sa.Column('full_name', sa.String(255)),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('phone', sa.String(20)),
        sa.Column('mobile', sa.String(20)),
        sa.Column('company', sa.String(255)),
        sa.Column('job_title', sa.String(100)),
        sa.Column('industry', sa.String(100)),
        sa.Column('company_size', sa.String(50)),
        sa.Column('annual_revenue', sa.String(50)),
        sa.Column('address', sa.Text),
        sa.Column('city', sa.String(100)),
        sa.Column('country', sa.String(100)),
        sa.Column('status', sa.String(20), nullable=False, default='new'),
        sa.Column('source', sa.String(50), nullable=False, default='direct'),
        sa.Column('score', sa.Integer, default=0),
        sa.Column('quality_grade', sa.String(2)),
        sa.Column('email_opens', sa.Integer, default=0),
        sa.Column('email_clicks', sa.Integer, default=0),
        sa.Column('website_visits', sa.Integer, default=0),
        sa.Column('last_activity_date', sa.DateTime),
        sa.Column('budget_range', sa.String(50)),
        sa.Column('timeline', sa.String(50)),
        sa.Column('pain_points', sa.JSON),
        sa.Column('last_contact_date', sa.DateTime),
        sa.Column('next_action_date', sa.DateTime),
        sa.Column('notes', sa.Text),
        sa.Column('tags', sa.JSON),
        sa.Column('converted_at', sa.DateTime),
        sa.Column('converted_to_client_id', UUID(as_uuid=True)),
        sa.Column('conversion_value', sa.Numeric(15, 2)),
        sa.Column('assigned_to', UUID(as_uuid=True)),
        sa.Column('tenant_id', UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['converted_to_client_id'], ['clients.id']),
        sa.ForeignKeyConstraint(['assigned_to'], ['users.id']),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
    )
    
    # Create indexes for leads
    op.create_index('ix_leads_email', 'leads', ['email'])
    op.create_index('ix_leads_company', 'leads', ['company'])
    op.create_index('ix_leads_status', 'leads', ['status'])
    op.create_index('ix_leads_source', 'leads', ['source'])
    op.create_index('ix_leads_score', 'leads', ['score'])
    op.create_index('ix_leads_assigned_to', 'leads', ['assigned_to'])
    op.create_index('ix_leads_next_action_date', 'leads', ['next_action_date'])
    
    # Create opportunities table
    op.create_table('opportunities',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text),
        sa.Column('reference', sa.String(100), unique=True),
        sa.Column('amount', sa.Numeric(15, 2), nullable=False),
        sa.Column('currency', sa.String(3), default='XOF'),
        sa.Column('probability', sa.Integer, default=50),
        sa.Column('stage', sa.String(50), nullable=False, default='qualification'),
        sa.Column('stage_changed_at', sa.DateTime, default=sa.func.now()),
        sa.Column('created_date', sa.Date, default=sa.func.current_date()),
        sa.Column('expected_close_date', sa.Date),
        sa.Column('actual_close_date', sa.Date),
        sa.Column('last_activity_date', sa.DateTime),
        sa.Column('products_interested', sa.JSON),
        sa.Column('requirements', sa.Text),
        sa.Column('budget_confirmed', sa.Boolean, default=False),
        sa.Column('decision_maker_identified', sa.Boolean, default=False),
        sa.Column('competitors', sa.JSON),
        sa.Column('competitive_advantage', sa.Text),
        sa.Column('forecast_category', sa.String(20), default='pipeline'),
        sa.Column('next_action', sa.Text),
        sa.Column('loss_reason', sa.String(255)),
        sa.Column('lead_id', UUID(as_uuid=True)),
        sa.Column('client_id', UUID(as_uuid=True)),
        sa.Column('assigned_to', UUID(as_uuid=True), nullable=False),
        sa.Column('tenant_id', UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['lead_id'], ['leads.id']),
        sa.ForeignKeyConstraint(['client_id'], ['clients.id']),
        sa.ForeignKeyConstraint(['assigned_to'], ['users.id']),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
    )
    
    # Create indexes for opportunities
    op.create_index('ix_opportunities_stage', 'opportunities', ['stage'])
    op.create_index('ix_opportunities_expected_close_date', 'opportunities', ['expected_close_date'])
    
    # Create CRM activities table
    op.create_table('crm_activities',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('type', sa.String(50), nullable=False, default='note'),
        sa.Column('subject', sa.String(255), nullable=False),
        sa.Column('description', sa.Text),
        sa.Column('due_date', sa.DateTime),
        sa.Column('duration_minutes', sa.Integer),
        sa.Column('is_completed', sa.Boolean, default=False),
        sa.Column('completed_at', sa.DateTime),
        sa.Column('priority', sa.String(20), default='medium'),
        sa.Column('outcome', sa.String(50)),
        sa.Column('next_action_required', sa.Boolean, default=False),
        sa.Column('next_action_description', sa.Text),
        sa.Column('call_duration', sa.Integer),
        sa.Column('email_opened', sa.Boolean),
        sa.Column('meeting_attended', sa.Boolean),
        sa.Column('lead_id', UUID(as_uuid=True)),
        sa.Column('client_id', UUID(as_uuid=True)),
        sa.Column('opportunity_id', UUID(as_uuid=True)),
        sa.Column('assigned_to', UUID(as_uuid=True), nullable=False),
        sa.Column('tenant_id', UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['lead_id'], ['leads.id']),
        sa.ForeignKeyConstraint(['client_id'], ['clients.id']),
        sa.ForeignKeyConstraint(['opportunity_id'], ['opportunities.id']),
        sa.ForeignKeyConstraint(['assigned_to'], ['users.id']),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
    )
    
    # Create campaigns table  
    op.create_table('campaigns',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text),
        sa.Column('type', sa.String(50), nullable=False),
        sa.Column('start_date', sa.DateTime, nullable=False),
        sa.Column('end_date', sa.DateTime),
        sa.Column('budget', sa.Numeric(15, 2)),
        sa.Column('message', sa.Text),
        sa.Column('call_to_action', sa.String(255)),
        sa.Column('landing_page_url', sa.String(500)),
        sa.Column('target_audience', sa.JSON),
        sa.Column('expected_reach', sa.Integer),
        sa.Column('status', sa.String(20), default='draft'),
        sa.Column('total_sent', sa.Integer, default=0),
        sa.Column('total_opened', sa.Integer, default=0),
        sa.Column('total_clicked', sa.Integer, default=0),
        sa.Column('total_converted', sa.Integer, default=0),
        sa.Column('total_cost', sa.Numeric(15, 2), default=0),
        sa.Column('created_by', UUID(as_uuid=True), nullable=False),
        sa.Column('tenant_id', UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['created_by'], ['users.id']),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
    )
    
    # Create lead scoring table
    op.create_table('lead_scoring',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('description', sa.Text),
        sa.Column('scoring_rules', sa.JSON, nullable=False),
        sa.Column('is_active', sa.Boolean, default=True),
        sa.Column('tenant_id', UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
    )
    
    # Add opportunity_id to quotes table
    op.add_column('quotes', sa.Column('opportunity_id', UUID(as_uuid=True)))
    op.create_foreign_key('fk_quotes_opportunity_id', 'quotes', 'opportunities', ['opportunity_id'], ['id'], ondelete='SET NULL')


def downgrade() -> None:
    """Remove CRM tables and fields"""
    
    # Remove opportunity_id from quotes
    op.drop_constraint('fk_quotes_opportunity_id', 'quotes', type_='foreignkey')
    op.drop_column('quotes', 'opportunity_id')
    
    # Drop CRM tables
    op.drop_table('lead_scoring')
    op.drop_table('campaigns')
    op.drop_table('crm_activities')
    op.drop_table('opportunities')
    op.drop_table('leads')