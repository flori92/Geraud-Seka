"""Add advanced accounting tables

Revision ID: 20241205_accounting
Revises: 20241205_notifications
Create Date: 2024-12-05

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '20241205_accounting'
down_revision = '20241205_notifications'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Exercices fiscaux
    op.create_table(
        'fiscal_years',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('code', sa.String(10), nullable=False),
        sa.Column('start_date', sa.Date(), nullable=False),
        sa.Column('end_date', sa.Date(), nullable=False),
        sa.Column('status', sa.String(20), default='open'),
        sa.Column('is_current', sa.Boolean(), default=False),
        sa.Column('closed_at', sa.DateTime(), nullable=True),
        sa.Column('closed_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('total_revenue', sa.Numeric(18, 2), default=0),
        sa.Column('total_expense', sa.Numeric(18, 2), default=0),
        sa.Column('net_result', sa.Numeric(18, 2), default=0),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['closed_by'], ['users.id'], ondelete='SET NULL'),
    )

    # Périodes comptables
    op.create_table(
        'accounting_periods',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('fiscal_year_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(50), nullable=False),
        sa.Column('period_number', sa.Integer(), nullable=False),
        sa.Column('start_date', sa.Date(), nullable=False),
        sa.Column('end_date', sa.Date(), nullable=False),
        sa.Column('is_closed', sa.Boolean(), default=False),
        sa.Column('closed_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['fiscal_year_id'], ['fiscal_years.id'], ondelete='CASCADE'),
    )

    # Plan comptable
    op.create_table(
        'chart_of_accounts',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('account_number', sa.String(20), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('account_class', sa.String(1), nullable=False),
        sa.Column('account_type', sa.String(20), nullable=False),
        sa.Column('parent_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('level', sa.Integer(), default=1),
        sa.Column('is_group', sa.Boolean(), default=False),
        sa.Column('is_detail', sa.Boolean(), default=True),
        sa.Column('is_active', sa.Boolean(), default=True),
        sa.Column('is_reconcilable', sa.Boolean(), default=False),
        sa.Column('is_bank_account', sa.Boolean(), default=False),
        sa.Column('is_cash_account', sa.Boolean(), default=False),
        sa.Column('opening_debit', sa.Numeric(18, 2), default=0),
        sa.Column('opening_credit', sa.Numeric(18, 2), default=0),
        sa.Column('current_debit', sa.Numeric(18, 2), default=0),
        sa.Column('current_credit', sa.Numeric(18, 2), default=0),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('tags', postgresql.JSON(), nullable=True),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['parent_id'], ['chart_of_accounts.id'], ondelete='SET NULL'),
    )
    op.create_index('ix_coa_tenant_number', 'chart_of_accounts', ['tenant_id', 'account_number'], unique=True)

    # Journaux comptables
    op.create_table(
        'accounting_journals',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('code', sa.String(10), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('journal_type', sa.String(10), nullable=False),
        sa.Column('is_active', sa.Boolean(), default=True),
        sa.Column('default_debit_account_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('default_credit_account_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('sequence_prefix', sa.String(10), nullable=True),
        sa.Column('next_sequence', sa.Integer(), default=1),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
    )
    op.create_index('ix_journal_tenant_code', 'accounting_journals', ['tenant_id', 'code'], unique=True)

    # Centres de coûts
    op.create_table(
        'cost_centers',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('code', sa.String(20), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('parent_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('is_active', sa.Boolean(), default=True),
        sa.Column('annual_budget', sa.Numeric(18, 2), default=0),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['parent_id'], ['cost_centers.id'], ondelete='SET NULL'),
    )

    # Lettrages
    op.create_table(
        'reconciliations',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('code', sa.String(20), nullable=False),
        sa.Column('account_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('total_debit', sa.Numeric(18, 2), default=0),
        sa.Column('total_credit', sa.Numeric(18, 2), default=0),
        sa.Column('balance', sa.Numeric(18, 2), default=0),
        sa.Column('status', sa.String(20), default='pending'),
        sa.Column('reconciled_at', sa.DateTime(), nullable=True),
        sa.Column('reconciled_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['account_id'], ['chart_of_accounts.id'], ondelete='CASCADE'),
    )

    # Écritures comptables
    op.create_table(
        'journal_entries',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('entry_number', sa.String(50), nullable=False),
        sa.Column('reference', sa.String(100), nullable=True),
        sa.Column('journal_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('fiscal_year_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('period_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('entry_date', sa.Date(), nullable=False),
        sa.Column('accounting_date', sa.Date(), nullable=False),
        sa.Column('label', sa.String(255), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('total_debit', sa.Numeric(18, 2), default=0),
        sa.Column('total_credit', sa.Numeric(18, 2), default=0),
        sa.Column('status', sa.String(20), default='draft'),
        sa.Column('validated_at', sa.DateTime(), nullable=True),
        sa.Column('validated_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('posted_at', sa.DateTime(), nullable=True),
        sa.Column('source_type', sa.String(50), nullable=True),
        sa.Column('source_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['journal_id'], ['accounting_journals.id']),
        sa.ForeignKeyConstraint(['fiscal_year_id'], ['fiscal_years.id']),
        sa.ForeignKeyConstraint(['period_id'], ['accounting_periods.id']),
    )
    op.create_index('ix_entry_tenant_number', 'journal_entries', ['tenant_id', 'entry_number'], unique=True)
    op.create_index('ix_entry_date', 'journal_entries', ['entry_date'])

    # Lignes d'écritures
    op.create_table(
        'journal_entry_lines',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('entry_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('account_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('debit', sa.Numeric(18, 2), default=0),
        sa.Column('credit', sa.Numeric(18, 2), default=0),
        sa.Column('label', sa.String(255), nullable=True),
        sa.Column('cost_center_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('project_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('partner_type', sa.String(20), nullable=True),
        sa.Column('partner_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('due_date', sa.Date(), nullable=True),
        sa.Column('reconciliation_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('reconciliation_code', sa.String(20), nullable=True),
        sa.Column('is_reconciled', sa.Boolean(), default=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['entry_id'], ['journal_entries.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['account_id'], ['chart_of_accounts.id']),
        sa.ForeignKeyConstraint(['cost_center_id'], ['cost_centers.id']),
        sa.ForeignKeyConstraint(['reconciliation_id'], ['reconciliations.id']),
    )

    # Budgets
    op.create_table(
        'budgets',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('fiscal_year_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('budget_type', sa.String(20), default='expense'),
        sa.Column('is_active', sa.Boolean(), default=True),
        sa.Column('is_approved', sa.Boolean(), default=False),
        sa.Column('approved_at', sa.DateTime(), nullable=True),
        sa.Column('approved_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('total_budget', sa.Numeric(18, 2), default=0),
        sa.Column('total_actual', sa.Numeric(18, 2), default=0),
        sa.Column('variance', sa.Numeric(18, 2), default=0),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['fiscal_year_id'], ['fiscal_years.id']),
    )

    # Lignes de budget
    op.create_table(
        'budget_lines',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('budget_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('account_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('period_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('cost_center_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('budget_amount', sa.Numeric(18, 2), default=0),
        sa.Column('actual_amount', sa.Numeric(18, 2), default=0),
        sa.Column('variance', sa.Numeric(18, 2), default=0),
        sa.Column('variance_percent', sa.Numeric(5, 2), default=0),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['budget_id'], ['budgets.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['account_id'], ['chart_of_accounts.id']),
        sa.ForeignKeyConstraint(['period_id'], ['accounting_periods.id']),
        sa.ForeignKeyConstraint(['cost_center_id'], ['cost_centers.id']),
    )

    # Rapprochements bancaires
    op.create_table(
        'bank_reconciliations',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('bank_account_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('statement_date', sa.Date(), nullable=False),
        sa.Column('period_start', sa.Date(), nullable=False),
        sa.Column('period_end', sa.Date(), nullable=False),
        sa.Column('statement_opening_balance', sa.Numeric(18, 2), nullable=False),
        sa.Column('statement_closing_balance', sa.Numeric(18, 2), nullable=False),
        sa.Column('book_opening_balance', sa.Numeric(18, 2), nullable=False),
        sa.Column('book_closing_balance', sa.Numeric(18, 2), nullable=False),
        sa.Column('unreconciled_deposits', sa.Numeric(18, 2), default=0),
        sa.Column('unreconciled_withdrawals', sa.Numeric(18, 2), default=0),
        sa.Column('difference', sa.Numeric(18, 2), default=0),
        sa.Column('is_reconciled', sa.Boolean(), default=False),
        sa.Column('reconciled_at', sa.DateTime(), nullable=True),
        sa.Column('reconciled_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['bank_account_id'], ['bank_accounts.id']),
    )

    # Lignes de rapprochement bancaire
    op.create_table(
        'bank_reconciliation_items',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('reconciliation_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('transaction_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('entry_line_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('amount', sa.Numeric(18, 2), nullable=False),
        sa.Column('is_matched', sa.Boolean(), default=False),
        sa.Column('matched_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['reconciliation_id'], ['bank_reconciliations.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['transaction_id'], ['bank_transactions.id']),
        sa.ForeignKeyConstraint(['entry_line_id'], ['journal_entry_lines.id']),
    )

    # Déclarations TVA
    op.create_table(
        'vat_declarations',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('period_start', sa.Date(), nullable=False),
        sa.Column('period_end', sa.Date(), nullable=False),
        sa.Column('declaration_type', sa.String(20), default='monthly'),
        sa.Column('vat_collected', sa.Numeric(18, 2), default=0),
        sa.Column('vat_deductible', sa.Numeric(18, 2), default=0),
        sa.Column('vat_due', sa.Numeric(18, 2), default=0),
        sa.Column('vat_credit', sa.Numeric(18, 2), default=0),
        sa.Column('sales_amount', sa.Numeric(18, 2), default=0),
        sa.Column('purchases_amount', sa.Numeric(18, 2), default=0),
        sa.Column('status', sa.String(20), default='draft'),
        sa.Column('submitted_at', sa.DateTime(), nullable=True),
        sa.Column('paid_at', sa.DateTime(), nullable=True),
        sa.Column('payment_reference', sa.String(100), nullable=True),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
    )


def downgrade() -> None:
    op.drop_table('vat_declarations')
    op.drop_table('bank_reconciliation_items')
    op.drop_table('bank_reconciliations')
    op.drop_table('budget_lines')
    op.drop_table('budgets')
    op.drop_table('journal_entry_lines')
    op.drop_table('journal_entries')
    op.drop_table('reconciliations')
    op.drop_table('cost_centers')
    op.drop_table('accounting_journals')
    op.drop_table('chart_of_accounts')
    op.drop_table('accounting_periods')
    op.drop_table('fiscal_years')
