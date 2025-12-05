"""Add treasury forecasts and alerts tables

Revision ID: 20241122_treasury_forecasts
Revises: 20241122_sales_001
Create Date: 2024-11-22 15:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy import inspect

# revision identifiers, used by Alembic.
revision = '20241122_treasury_forecasts'
down_revision = '20241122_sales_001'
branch_labels = None
depends_on = None


def table_exists(table_name):
    """Check if a table exists"""
    bind = op.get_bind()
    inspector = inspect(bind)
    return table_name in inspector.get_table_names()


def upgrade():
    # ========== BANK ACCOUNTS (required for bank_statement_imports FK) ==========
    if not table_exists('bank_accounts'):
        op.create_table('bank_accounts',
            sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column('name', sa.String(length=255), nullable=False),
            sa.Column('account_number', sa.String(length=50), nullable=True),
            sa.Column('bank_name', sa.String(length=255), nullable=True),
            sa.Column('bank_code', sa.String(length=20), nullable=True),
            sa.Column('iban', sa.String(length=50), nullable=True),
            sa.Column('swift_bic', sa.String(length=20), nullable=True),
            sa.Column('account_type', sa.String(length=50), nullable=False, server_default='checking'),
            sa.Column('currency', sa.String(length=3), nullable=False, server_default='XOF'),
            sa.Column('initial_balance', sa.Numeric(precision=15, scale=2), nullable=False, server_default='0'),
            sa.Column('balance', sa.Numeric(precision=15, scale=2), nullable=False, server_default='0'),
            sa.Column('overdraft_limit', sa.Numeric(precision=15, scale=2), nullable=True),
            sa.Column('is_default', sa.Boolean(), nullable=False, server_default='false'),
            sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
            sa.Column('notes', sa.Text(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
            sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
            sa.PrimaryKeyConstraint('id'),
            sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
            sa.Index('ix_bank_accounts_tenant_id', 'tenant_id'),
            sa.Index('ix_bank_accounts_account_number', 'account_number')
        )

    # ========== BANK TRANSACTIONS ==========
    if not table_exists('bank_transactions'):
        op.create_table('bank_transactions',
            sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column('bank_account_id', postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column('transaction_date', sa.Date(), nullable=False),
            sa.Column('value_date', sa.Date(), nullable=True),
            sa.Column('description', sa.Text(), nullable=False),
            sa.Column('reference', sa.String(length=100), nullable=True),
            sa.Column('amount', sa.Numeric(precision=15, scale=2), nullable=False),
            sa.Column('balance_after', sa.Numeric(precision=15, scale=2), nullable=True),
            sa.Column('transaction_type', sa.String(length=50), nullable=False),
            sa.Column('category', sa.String(length=100), nullable=True),
            sa.Column('status', sa.String(length=20), nullable=False, server_default='pending'),
            sa.Column('reconciled', sa.Boolean(), nullable=False, server_default='false'),
            sa.Column('notes', sa.Text(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
            sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
            sa.PrimaryKeyConstraint('id'),
            sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['bank_account_id'], ['bank_accounts.id'], ondelete='CASCADE'),
            sa.Index('ix_bank_transactions_tenant_id', 'tenant_id'),
            sa.Index('ix_bank_transactions_bank_account_id', 'bank_account_id'),
            sa.Index('ix_bank_transactions_transaction_date', 'transaction_date')
        )

    # ========== PAYMENT SCHEDULES ==========
    if not table_exists('payment_schedules'):
        op.create_table('payment_schedules',
            sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column('name', sa.String(length=255), nullable=False),
            sa.Column('description', sa.Text(), nullable=True),
            sa.Column('schedule_type', sa.String(length=50), nullable=False),
            sa.Column('amount', sa.Numeric(precision=15, scale=2), nullable=False),
            sa.Column('remaining_amount', sa.Numeric(precision=15, scale=2), nullable=False),
            sa.Column('currency', sa.String(length=3), nullable=False, server_default='XOF'),
            sa.Column('due_date', sa.Date(), nullable=False),
            sa.Column('status', sa.String(length=20), nullable=False, server_default='pending'),
            sa.Column('recurrence', sa.String(length=20), nullable=True),
            sa.Column('related_entity_type', sa.String(length=50), nullable=True),
            sa.Column('related_entity_id', postgresql.UUID(as_uuid=True), nullable=True),
            sa.Column('notes', sa.Text(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
            sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
            sa.PrimaryKeyConstraint('id'),
            sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
            sa.Index('ix_payment_schedules_tenant_id', 'tenant_id'),
            sa.Index('ix_payment_schedules_due_date', 'due_date'),
            sa.Index('ix_payment_schedules_status', 'status')
        )

    # Create cash_flow_forecasts table
    if not table_exists('cash_flow_forecasts'):
        op.create_table(
        'cash_flow_forecasts',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('forecast_date', sa.Date(), nullable=False),
        sa.Column('predicted_balance', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('predicted_income', sa.Numeric(precision=15, scale=2), nullable=False, server_default='0'),
        sa.Column('predicted_expenses', sa.Numeric(precision=15, scale=2), nullable=False, server_default='0'),
        sa.Column('confidence_lower', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('confidence_upper', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('scenario', sa.String(length=20), nullable=False, server_default='realistic'),
        sa.Column('model_type', sa.String(length=20), nullable=False),
        sa.Column('model_accuracy', sa.Numeric(precision=5, scale=4), nullable=True),
        sa.Column('created_at', sa.Date(), nullable=False, server_default=sa.text('CURRENT_DATE')),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
        )
    
        # Create indexes for cash_flow_forecasts
        op.create_index('idx_forecasts_tenant_id', 'cash_flow_forecasts', ['tenant_id'])
        op.create_index('idx_forecasts_forecast_date', 'cash_flow_forecasts', ['forecast_date'])
        op.create_index('idx_forecasts_scenario', 'cash_flow_forecasts', ['scenario'])
        op.create_index('idx_forecasts_created_at', 'cash_flow_forecasts', ['created_at'])
        op.create_index('idx_forecasts_tenant_date', 'cash_flow_forecasts', ['tenant_id', 'forecast_date'])
        op.create_index('idx_forecasts_tenant_scenario', 'cash_flow_forecasts', ['tenant_id', 'scenario', 'created_at'])

    # Create treasury_alerts table
    if not table_exists('treasury_alerts'):
        op.create_table(
            'treasury_alerts',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('alert_type', sa.String(length=50), nullable=False),
        sa.Column('severity', sa.String(length=20), nullable=False, server_default='info'),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('related_entity_type', sa.String(length=50), nullable=True),
        sa.Column('related_entity_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('is_read', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('is_resolved', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.Date(), nullable=False, server_default=sa.text('CURRENT_DATE')),
        sa.Column('resolved_at', sa.Date(), nullable=True),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
        )
    
        # Create indexes for treasury_alerts
        op.create_index('idx_alerts_tenant_id', 'treasury_alerts', ['tenant_id'])
        op.create_index('idx_alerts_alert_type', 'treasury_alerts', ['alert_type'])
        op.create_index('idx_alerts_severity', 'treasury_alerts', ['severity'])
        op.create_index('idx_alerts_is_read', 'treasury_alerts', ['is_read'])
        op.create_index('idx_alerts_is_resolved', 'treasury_alerts', ['is_resolved'])
        op.create_index('idx_alerts_created_at', 'treasury_alerts', ['created_at'])
        op.create_index('idx_alerts_tenant_resolved', 'treasury_alerts', ['tenant_id', 'is_resolved', 'created_at'])

    # Create bank_statement_imports table
    if not table_exists('bank_statement_imports'):
        op.create_table(
            'bank_statement_imports',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('bank_account_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('file_name', sa.String(length=255), nullable=False),
        sa.Column('file_url', sa.String(length=512), nullable=True),
        sa.Column('import_date', sa.Date(), nullable=False, server_default=sa.text('CURRENT_DATE')),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='pending'),
        sa.Column('total_lines', sa.Numeric(precision=10, scale=0), nullable=False, server_default='0'),
        sa.Column('matched_lines', sa.Numeric(precision=10, scale=0), nullable=False, server_default='0'),
        sa.Column('unmatched_lines', sa.Numeric(precision=10, scale=0), nullable=False, server_default='0'),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.Date(), nullable=False, server_default=sa.text('CURRENT_DATE')),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['bank_account_id'], ['bank_accounts.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
        )
    
        # Create indexes for bank_statement_imports
        op.create_index('idx_imports_tenant_id', 'bank_statement_imports', ['tenant_id'])
        op.create_index('idx_imports_bank_account_id', 'bank_statement_imports', ['bank_account_id'])
        op.create_index('idx_imports_status', 'bank_statement_imports', ['status'])
        op.create_index('idx_imports_created_at', 'bank_statement_imports', ['created_at'])


def downgrade():
    # Drop indexes and tables in reverse order
    op.drop_index('idx_imports_created_at', table_name='bank_statement_imports')
    op.drop_index('idx_imports_status', table_name='bank_statement_imports')
    op.drop_index('idx_imports_bank_account_id', table_name='bank_statement_imports')
    op.drop_index('idx_imports_tenant_id', table_name='bank_statement_imports')
    op.drop_table('bank_statement_imports')

    op.drop_index('idx_alerts_tenant_resolved', table_name='treasury_alerts')
    op.drop_index('idx_alerts_created_at', table_name='treasury_alerts')
    op.drop_index('idx_alerts_is_resolved', table_name='treasury_alerts')
    op.drop_index('idx_alerts_is_read', table_name='treasury_alerts')
    op.drop_index('idx_alerts_severity', table_name='treasury_alerts')
    op.drop_index('idx_alerts_alert_type', table_name='treasury_alerts')
    op.drop_index('idx_alerts_tenant_id', table_name='treasury_alerts')
    op.drop_table('treasury_alerts')

    op.drop_index('idx_forecasts_tenant_scenario', table_name='cash_flow_forecasts')
    op.drop_index('idx_forecasts_tenant_date', table_name='cash_flow_forecasts')
    op.drop_index('idx_forecasts_created_at', table_name='cash_flow_forecasts')
    op.drop_index('idx_forecasts_scenario', table_name='cash_flow_forecasts')
    op.drop_index('idx_forecasts_forecast_date', table_name='cash_flow_forecasts')
    op.drop_index('idx_forecasts_tenant_id', table_name='cash_flow_forecasts')
    op.drop_table('cash_flow_forecasts')
