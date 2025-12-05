"""Add CRM automations tables

Revision ID: 20241205_automations
Revises: 20241205_campaigns
Create Date: 2024-12-05

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '20241205_automations'
down_revision = '20241205_campaigns'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Table automations
    op.create_table(
        'automations',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('trigger_type', sa.String(50), nullable=False),
        sa.Column('trigger_config', postgresql.JSON(), nullable=True),
        sa.Column('conditions', postgresql.JSON(), nullable=True),
        sa.Column('status', sa.String(20), nullable=False, default='draft'),
        sa.Column('execution_count', sa.Integer(), default=0),
        sa.Column('last_executed_at', sa.DateTime(), nullable=True),
        sa.Column('success_count', sa.Integer(), default=0),
        sa.Column('error_count', sa.Integer(), default=0),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ondelete='SET NULL'),
    )
    
    op.create_index('ix_automations_tenant', 'automations', ['tenant_id'])
    op.create_index('ix_automations_status', 'automations', ['status'])
    op.create_index('ix_automations_trigger', 'automations', ['trigger_type'])
    
    # Table automation_actions
    op.create_table(
        'automation_actions',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('automation_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('action_type', sa.String(50), nullable=False),
        sa.Column('config', postgresql.JSON(), nullable=False),
        sa.Column('order', sa.Integer(), default=0, nullable=False),
        sa.Column('next_action_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['automation_id'], ['automations.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['next_action_id'], ['automation_actions.id'], ondelete='SET NULL'),
    )
    
    op.create_index('ix_actions_automation', 'automation_actions', ['automation_id'])
    op.create_index('ix_actions_order', 'automation_actions', ['order'])
    
    # Table automation_executions
    op.create_table(
        'automation_executions',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('automation_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('entity_type', sa.String(20), nullable=True),
        sa.Column('entity_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('status', sa.String(20), default='running'),
        sa.Column('started_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('current_action_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('actions_completed', sa.Integer(), default=0),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('execution_log', postgresql.JSON(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['automation_id'], ['automations.id'], ondelete='CASCADE'),
    )
    
    op.create_index('ix_executions_automation', 'automation_executions', ['automation_id'])
    op.create_index('ix_executions_status', 'automation_executions', ['status'])
    op.create_index('ix_executions_started', 'automation_executions', ['started_at'])


def downgrade() -> None:
    op.drop_table('automation_executions')
    op.drop_table('automation_actions')
    op.drop_table('automations')
