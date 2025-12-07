"""Add HR Advanced Module - Phase 1A

Revision ID: add_hr_advanced_001
Revises: add_quotes_opportunity
Create Date: 2024-12-07 16:00:00.000000

Ajoute:
- Pointage & Temps de travail (Attendance, WorkSchedule, Shift, ShiftAssignment)
- Performance (PerformanceReview, Goal, Feedback360)
- Paie OHADA (PayrollParameter, SalaryAdvance, Loan)
- Notes de frais (ExpensePolicy, ExpenseReport, ExpenseLine)
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy import inspect

# revision identifiers, used by Alembic.
revision = 'add_hr_advanced_001'
down_revision = 'add_quotes_opportunity'
branch_labels = None
depends_on = None


def table_exists(table_name):
    """Check if a table exists"""
    bind = op.get_bind()
    inspector = inspect(bind)
    return table_name in inspector.get_table_names()


def upgrade():
    """Add HR Advanced tables"""

    # ========== POINTAGE & TEMPS DE TRAVAIL ==========

    if not table_exists('work_schedules'):
        op.create_table(
            'work_schedules',
            sa.Column('id', sa.String(), primary_key=True),
            sa.Column('tenant_id', sa.String(), nullable=False, index=True),
            sa.Column('name', sa.String(100), nullable=False),
            sa.Column('description', sa.Text()),

            # Lundi
            sa.Column('monday_start', sa.Time()),
            sa.Column('monday_end', sa.Time()),
            sa.Column('monday_hours', sa.Numeric(4, 2)),
            sa.Column('monday_working', sa.Boolean(), default=True),

            # Mardi
            sa.Column('tuesday_start', sa.Time()),
            sa.Column('tuesday_end', sa.Time()),
            sa.Column('tuesday_hours', sa.Numeric(4, 2)),
            sa.Column('tuesday_working', sa.Boolean(), default=True),

            # Mercredi
            sa.Column('wednesday_start', sa.Time()),
            sa.Column('wednesday_end', sa.Time()),
            sa.Column('wednesday_hours', sa.Numeric(4, 2)),
            sa.Column('wednesday_working', sa.Boolean(), default=True),

            # Jeudi
            sa.Column('thursday_start', sa.Time()),
            sa.Column('thursday_end', sa.Time()),
            sa.Column('thursday_hours', sa.Numeric(4, 2)),
            sa.Column('thursday_working', sa.Boolean(), default=True),

            # Vendredi
            sa.Column('friday_start', sa.Time()),
            sa.Column('friday_end', sa.Time()),
            sa.Column('friday_hours', sa.Numeric(4, 2)),
            sa.Column('friday_working', sa.Boolean(), default=True),

            # Samedi
            sa.Column('saturday_start', sa.Time()),
            sa.Column('saturday_end', sa.Time()),
            sa.Column('saturday_hours', sa.Numeric(4, 2)),
            sa.Column('saturday_working', sa.Boolean(), default=False),

            # Dimanche
            sa.Column('sunday_start', sa.Time()),
            sa.Column('sunday_end', sa.Time()),
            sa.Column('sunday_hours', sa.Numeric(4, 2)),
            sa.Column('sunday_working', sa.Boolean(), default=False),

            # Paramètres
            sa.Column('weekly_hours', sa.Numeric(5, 2), nullable=False),
            sa.Column('flexible', sa.Boolean(), default=False),
            sa.Column('tolerance_minutes', sa.Integer(), default=15),
            sa.Column('break_duration', sa.Integer(), default=60),
            sa.Column('break_paid', sa.Boolean(), default=True),

            sa.Column('is_default', sa.Boolean(), default=False),
            sa.Column('is_active', sa.Boolean(), default=True),

            sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()')),
            sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()')),
        )
        op.create_index('ix_work_schedules_tenant_id', 'work_schedules', ['tenant_id'])

    if not table_exists('shifts'):
        op.create_table(
            'shifts',
            sa.Column('id', sa.String(), primary_key=True),
            sa.Column('tenant_id', sa.String(), nullable=False, index=True),
            sa.Column('name', sa.String(100), nullable=False),
            sa.Column('description', sa.Text()),
            sa.Column('start_time', sa.Time(), nullable=False),
            sa.Column('end_time', sa.Time(), nullable=False),
            sa.Column('color', sa.String(7), default='#3B82F6'),
            sa.Column('rotation_type', sa.String(), default='fixed'),
            sa.Column('rotation_pattern', sa.JSON()),
            sa.Column('is_active', sa.Boolean(), default=True),
            sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()')),
            sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()')),
        )

    if not table_exists('shift_assignments'):
        op.create_table(
            'shift_assignments',
            sa.Column('id', sa.String(), primary_key=True),
            sa.Column('tenant_id', sa.String(), nullable=False, index=True),
            sa.Column('employee_id', sa.String(), sa.ForeignKey('employees.id'), nullable=False),
            sa.Column('shift_id', sa.String(), sa.ForeignKey('shifts.id'), nullable=False),
            sa.Column('start_date', sa.Date(), nullable=False),
            sa.Column('end_date', sa.Date()),
            sa.Column('days_of_week', postgresql.ARRAY(sa.Integer())),
            sa.Column('is_active', sa.Boolean(), default=True),
            sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()')),
        )
        op.create_index('ix_shift_assignments_employee', 'shift_assignments', ['employee_id'])

    if not table_exists('attendances'):
        op.create_table(
            'attendances',
            sa.Column('id', sa.String(), primary_key=True),
            sa.Column('tenant_id', sa.String(), nullable=False, index=True),
            sa.Column('employee_id', sa.String(), sa.ForeignKey('employees.id'), nullable=False, index=True),

            # Check-in
            sa.Column('check_in', sa.DateTime(), nullable=False, index=True),
            sa.Column('check_in_location', sa.String(200)),
            sa.Column('check_in_method', sa.String(), default='web'),
            sa.Column('check_in_ip', sa.String(45)),
            sa.Column('check_in_latitude', sa.Numeric(10, 7)),
            sa.Column('check_in_longitude', sa.Numeric(10, 7)),

            # Check-out
            sa.Column('check_out', sa.DateTime()),
            sa.Column('check_out_location', sa.String(200)),
            sa.Column('check_out_method', sa.String()),
            sa.Column('check_out_ip', sa.String(45)),
            sa.Column('check_out_latitude', sa.Numeric(10, 7)),
            sa.Column('check_out_longitude', sa.Numeric(10, 7)),

            # Calculs
            sa.Column('worked_hours', sa.Numeric(5, 2)),
            sa.Column('overtime_hours', sa.Numeric(5, 2)),
            sa.Column('night_hours', sa.Numeric(5, 2)),
            sa.Column('weekend_hours', sa.Numeric(5, 2)),
            sa.Column('break_duration', sa.Integer(), default=0),

            # Statut
            sa.Column('status', sa.String(), default='present'),
            sa.Column('attendance_type', sa.String(), default='office'),

            # Validation
            sa.Column('is_validated', sa.Boolean(), default=False),
            sa.Column('validated_by', sa.String(), sa.ForeignKey('users.id')),
            sa.Column('validated_at', sa.DateTime()),

            # Notes
            sa.Column('notes', sa.Text()),
            sa.Column('employee_notes', sa.Text()),
            sa.Column('manager_notes', sa.Text()),

            sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()')),
            sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()')),
        )
        op.create_index('ix_attendances_date', 'attendances', ['check_in'])
        op.create_index('ix_attendances_employee_date', 'attendances', ['employee_id', 'check_in'])

    # ========== PERFORMANCE ==========

    if not table_exists('performance_reviews'):
        op.create_table(
            'performance_reviews',
            sa.Column('id', sa.String(), primary_key=True),
            sa.Column('tenant_id', sa.String(), nullable=False, index=True),
            sa.Column('employee_id', sa.String(), sa.ForeignKey('employees.id'), nullable=False, index=True),
            sa.Column('reviewer_id', sa.String(), sa.ForeignKey('users.id'), nullable=False),

            # Période
            sa.Column('review_period', sa.String(), default='annual'),
            sa.Column('period_start', sa.Date(), nullable=False),
            sa.Column('period_end', sa.Date(), nullable=False),
            sa.Column('review_date', sa.Date()),

            # Scores
            sa.Column('technical_skills_score', sa.Numeric(3, 1)),
            sa.Column('soft_skills_score', sa.Numeric(3, 1)),
            sa.Column('productivity_score', sa.Numeric(3, 1)),
            sa.Column('initiative_score', sa.Numeric(3, 1)),
            sa.Column('teamwork_score', sa.Numeric(3, 1)),
            sa.Column('punctuality_score', sa.Numeric(3, 1)),
            sa.Column('leadership_score', sa.Numeric(3, 1)),
            sa.Column('communication_score', sa.Numeric(3, 1)),

            sa.Column('overall_score', sa.Numeric(3, 1)),
            sa.Column('overall_rating', sa.String(), default='satisfactory'),

            # Commentaires
            sa.Column('strengths', sa.Text()),
            sa.Column('areas_for_improvement', sa.Text()),
            sa.Column('achievements', sa.Text()),
            sa.Column('goals_met', sa.Text()),
            sa.Column('goals_not_met', sa.Text()),

            # Objectifs futurs
            sa.Column('next_period_goals', sa.JSON()),
            sa.Column('development_plan', sa.Text()),

            # Recommandations
            sa.Column('promotion_recommended', sa.Boolean(), default=False),
            sa.Column('promotion_details', sa.Text()),
            sa.Column('salary_increase_recommended', sa.Boolean(), default=False),
            sa.Column('recommended_increase_percentage', sa.Numeric(5, 2)),
            sa.Column('training_recommended', sa.Text()),

            # Processus
            sa.Column('status', sa.String(), default='draft'),
            sa.Column('employee_comments', sa.Text()),
            sa.Column('employee_acknowledged_at', sa.DateTime()),
            sa.Column('employee_signature', sa.Text()),

            # Signatures
            sa.Column('reviewer_signature', sa.Text()),
            sa.Column('hr_signature', sa.Text()),
            sa.Column('signed_at', sa.DateTime()),

            sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()')),
            sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()')),
        )
        op.create_index('ix_performance_reviews_employee', 'performance_reviews', ['employee_id'])
        op.create_index('ix_performance_reviews_period', 'performance_reviews', ['period_start', 'period_end'])

    if not table_exists('goals'):
        op.create_table(
            'goals',
            sa.Column('id', sa.String(), primary_key=True),
            sa.Column('tenant_id', sa.String(), nullable=False, index=True),
            sa.Column('employee_id', sa.String(), sa.ForeignKey('employees.id'), nullable=False, index=True),
            sa.Column('manager_id', sa.String(), sa.ForeignKey('users.id'), nullable=False),

            sa.Column('title', sa.String(200), nullable=False),
            sa.Column('description', sa.Text()),
            sa.Column('category', sa.String(), default='other'),

            # Mesure
            sa.Column('metric_type', sa.String(), default='number'),
            sa.Column('target_value', sa.Numeric(15, 2)),
            sa.Column('current_value', sa.Numeric(15, 2), default=0),
            sa.Column('unit', sa.String(50)),

            # Période
            sa.Column('start_date', sa.Date(), nullable=False),
            sa.Column('due_date', sa.Date(), nullable=False),

            # Suivi
            sa.Column('progress_percentage', sa.Numeric(5, 2), default=0),
            sa.Column('status', sa.String(), default='not_started'),
            sa.Column('priority', sa.String(), default='medium'),

            # Résultat
            sa.Column('achieved', sa.Boolean(), default=False),
            sa.Column('achievement_percentage', sa.Numeric(5, 2)),
            sa.Column('completion_date', sa.Date()),
            sa.Column('final_notes', sa.Text()),

            # Hiérarchie
            sa.Column('parent_goal_id', sa.String(), sa.ForeignKey('goals.id')),
            sa.Column('weight', sa.Numeric(5, 2), default=100),

            sa.Column('milestones', sa.JSON()),

            sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()')),
            sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()')),
        )
        op.create_index('ix_goals_employee', 'goals', ['employee_id'])
        op.create_index('ix_goals_status', 'goals', ['status'])
        op.create_index('ix_goals_due_date', 'goals', ['due_date'])

    if not table_exists('feedbacks_360'):
        op.create_table(
            'feedbacks_360',
            sa.Column('id', sa.String(), primary_key=True),
            sa.Column('tenant_id', sa.String(), nullable=False, index=True),
            sa.Column('employee_id', sa.String(), sa.ForeignKey('employees.id'), nullable=False, index=True),
            sa.Column('reviewer_id', sa.String(), sa.ForeignKey('users.id'), nullable=False),
            sa.Column('reviewer_relationship', sa.String(), default='peer'),

            sa.Column('campaign_id', sa.String(), index=True),
            sa.Column('campaign_name', sa.String(200)),
            sa.Column('is_anonymous', sa.Boolean(), default=True),

            sa.Column('responses', sa.JSON()),

            # Scores
            sa.Column('leadership_score', sa.Numeric(3, 1)),
            sa.Column('communication_score', sa.Numeric(3, 1)),
            sa.Column('collaboration_score', sa.Numeric(3, 1)),
            sa.Column('problem_solving_score', sa.Numeric(3, 1)),
            sa.Column('adaptability_score', sa.Numeric(3, 1)),
            sa.Column('overall_score', sa.Numeric(3, 1)),
            sa.Column('overall_feedback', sa.Text()),

            sa.Column('status', sa.String(), default='pending'),
            sa.Column('submitted_at', sa.DateTime()),

            sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()')),
        )
        op.create_index('ix_feedback360_campaign', 'feedbacks_360', ['campaign_id'])

    # ========== PAIE OHADA ==========

    if not table_exists('payroll_parameters'):
        op.create_table(
            'payroll_parameters',
            sa.Column('id', sa.String(), primary_key=True),
            sa.Column('tenant_id', sa.String(), nullable=False, index=True),
            sa.Column('country_code', sa.String(2), nullable=False, index=True),

            # Plafonds CNSS
            sa.Column('cnss_ceiling_monthly', sa.Numeric(15, 2)),
            sa.Column('cnss_floor_monthly', sa.Numeric(15, 2)),

            # Taux de cotisations
            sa.Column('cnss_employee_rate', sa.Numeric(5, 2), default=3.2),
            sa.Column('cnss_employer_rate', sa.Numeric(5, 2), default=14.4),
            sa.Column('pension_employee_rate', sa.Numeric(5, 2), default=1.6),
            sa.Column('pension_employer_rate', sa.Numeric(5, 2), default=3.6),
            sa.Column('fne_employer_rate', sa.Numeric(5, 2), default=0.8),
            sa.Column('accident_work_rate', sa.Numeric(5, 2), default=1.6),

            # Barème IUTS/IRPP
            sa.Column('tax_brackets', sa.JSON()),

            # Abattements fiscaux
            sa.Column('tax_deduction_percentage', sa.Numeric(5, 2), default=20),
            sa.Column('tax_deduction_max', sa.Numeric(15, 2)),
            sa.Column('family_deduction_per_child', sa.Numeric(10, 2)),
            sa.Column('max_children_deduction', sa.Integer(), default=4),

            # SMIG
            sa.Column('minimum_wage', sa.Numeric(10, 2), nullable=False),

            # Heures supplémentaires
            sa.Column('overtime_rate_regular', sa.Numeric(5, 2), default=115),
            sa.Column('overtime_rate_night', sa.Numeric(5, 2), default=135),
            sa.Column('overtime_rate_sunday', sa.Numeric(5, 2), default=150),
            sa.Column('overtime_rate_holiday', sa.Numeric(5, 2), default=200),

            sa.Column('public_holidays', sa.JSON()),

            sa.Column('effective_date', sa.Date(), nullable=False),
            sa.Column('is_active', sa.Boolean(), default=True),

            sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()')),
            sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()')),
        )
        op.create_index('ix_payroll_params_country', 'payroll_parameters', ['country_code', 'effective_date'])

    if not table_exists('salary_advances'):
        op.create_table(
            'salary_advances',
            sa.Column('id', sa.String(), primary_key=True),
            sa.Column('tenant_id', sa.String(), nullable=False, index=True),
            sa.Column('employee_id', sa.String(), sa.ForeignKey('employees.id'), nullable=False, index=True),

            sa.Column('request_date', sa.Date(), nullable=False),
            sa.Column('amount_requested', sa.Numeric(15, 2), nullable=False),
            sa.Column('amount_approved', sa.Numeric(15, 2)),
            sa.Column('reason', sa.Text()),

            # Approbation
            sa.Column('status', sa.String(), default='pending'),
            sa.Column('approved_by', sa.String(), sa.ForeignKey('users.id')),
            sa.Column('approval_date', sa.DateTime()),
            sa.Column('rejection_reason', sa.Text()),

            # Paiement
            sa.Column('payment_date', sa.Date()),
            sa.Column('payment_method', sa.String(), default='bank_transfer'),
            sa.Column('payment_reference', sa.String(100)),

            # Remboursement
            sa.Column('repayment_installments', sa.Integer(), default=1),
            sa.Column('monthly_deduction', sa.Numeric(15, 2)),
            sa.Column('total_repaid', sa.Numeric(15, 2), default=0),
            sa.Column('remaining_balance', sa.Numeric(15, 2)),

            sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()')),
            sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()')),
        )
        op.create_index('ix_salary_advances_employee', 'salary_advances', ['employee_id'])
        op.create_index('ix_salary_advances_status', 'salary_advances', ['status'])

    if not table_exists('employee_loans'):
        op.create_table(
            'employee_loans',
            sa.Column('id', sa.String(), primary_key=True),
            sa.Column('tenant_id', sa.String(), nullable=False, index=True),
            sa.Column('employee_id', sa.String(), sa.ForeignKey('employees.id'), nullable=False, index=True),

            sa.Column('loan_number', sa.String(50), unique=True),

            # Montant
            sa.Column('principal_amount', sa.Numeric(15, 2), nullable=False),
            sa.Column('interest_rate', sa.Numeric(5, 2), default=0),
            sa.Column('total_amount', sa.Numeric(15, 2)),

            # Durée
            sa.Column('duration_months', sa.Integer(), nullable=False),
            sa.Column('monthly_installment', sa.Numeric(15, 2), nullable=False),

            # Dates
            sa.Column('grant_date', sa.Date(), nullable=False),
            sa.Column('first_repayment_date', sa.Date(), nullable=False),

            # Statut
            sa.Column('status', sa.String(), default='active'),
            sa.Column('total_repaid', sa.Numeric(15, 2), default=0),
            sa.Column('remaining_balance', sa.Numeric(15, 2)),
            sa.Column('last_payment_date', sa.Date()),

            # Garanties
            sa.Column('guarantor_id', sa.String(), sa.ForeignKey('employees.id')),
            sa.Column('collateral', sa.Text()),

            # Approbation
            sa.Column('approved_by', sa.String(), sa.ForeignKey('users.id')),
            sa.Column('approval_date', sa.DateTime()),
            sa.Column('notes', sa.Text()),

            sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()')),
            sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()')),
        )
        op.create_index('ix_employee_loans_employee', 'employee_loans', ['employee_id'])
        op.create_index('ix_employee_loans_status', 'employee_loans', ['status'])

    # ========== NOTES DE FRAIS ==========

    if not table_exists('expense_policies'):
        op.create_table(
            'expense_policies',
            sa.Column('id', sa.String(), primary_key=True),
            sa.Column('tenant_id', sa.String(), nullable=False, index=True),

            sa.Column('name', sa.String(100), nullable=False),
            sa.Column('description', sa.Text()),

            # Limites journalières
            sa.Column('meal_daily_limit', sa.Numeric(10, 2)),
            sa.Column('accommodation_daily_limit', sa.Numeric(10, 2)),
            sa.Column('transport_daily_limit', sa.Numeric(10, 2)),

            # Kilométrage
            sa.Column('mileage_rate_car', sa.Numeric(10, 2)),
            sa.Column('mileage_rate_motorcycle', sa.Numeric(10, 2)),
            sa.Column('mileage_rate_bicycle', sa.Numeric(10, 2)),

            # Règles
            sa.Column('receipt_required_above', sa.Numeric(10, 2)),
            sa.Column('requires_advance_approval', sa.Boolean(), default=False),
            sa.Column('approval_required_above', sa.Numeric(15, 2)),
            sa.Column('submission_deadline_days', sa.Integer(), default=30),

            # Applicabilité
            sa.Column('applies_to_departments', postgresql.ARRAY(sa.String())),
            sa.Column('applies_to_job_titles', postgresql.ARRAY(sa.String())),
            sa.Column('applies_to_all', sa.Boolean(), default=True),

            sa.Column('effective_date', sa.Date(), nullable=False),
            sa.Column('is_active', sa.Boolean(), default=True),

            sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()')),
            sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()')),
        )

    if not table_exists('expense_reports'):
        op.create_table(
            'expense_reports',
            sa.Column('id', sa.String(), primary_key=True),
            sa.Column('tenant_id', sa.String(), nullable=False, index=True),
            sa.Column('employee_id', sa.String(), sa.ForeignKey('employees.id'), nullable=False, index=True),

            sa.Column('report_number', sa.String(50), unique=True, nullable=False),
            sa.Column('title', sa.String(200), nullable=False),

            # Période
            sa.Column('period_start', sa.Date(), nullable=False),
            sa.Column('period_end', sa.Date(), nullable=False),

            # Montants
            sa.Column('total_amount', sa.Numeric(15, 2), default=0),
            sa.Column('currency', sa.String(3), default='XOF'),
            sa.Column('total_amount_xof', sa.Numeric(15, 2), default=0),

            # Catégories
            sa.Column('mileage_total', sa.Numeric(10, 2), default=0),
            sa.Column('meal_total', sa.Numeric(15, 2), default=0),
            sa.Column('accommodation_total', sa.Numeric(15, 2), default=0),
            sa.Column('transport_total', sa.Numeric(15, 2), default=0),
            sa.Column('other_total', sa.Numeric(15, 2), default=0),

            # TVA
            sa.Column('vat_total', sa.Numeric(15, 2), default=0),
            sa.Column('vat_recoverable', sa.Numeric(15, 2), default=0),

            # Workflow
            sa.Column('status', sa.String(), default='draft'),
            sa.Column('submitted_date', sa.DateTime()),

            sa.Column('manager_approved_by', sa.String(), sa.ForeignKey('users.id')),
            sa.Column('manager_approval_date', sa.DateTime()),
            sa.Column('manager_comments', sa.Text()),

            sa.Column('finance_approved_by', sa.String(), sa.ForeignKey('users.id')),
            sa.Column('finance_approval_date', sa.DateTime()),
            sa.Column('finance_comments', sa.Text()),

            sa.Column('rejection_reason', sa.Text()),
            sa.Column('rejected_by', sa.String(), sa.ForeignKey('users.id')),
            sa.Column('rejected_at', sa.DateTime()),

            # Paiement
            sa.Column('payment_method', sa.String(), default='bank_transfer'),
            sa.Column('paid_date', sa.Date()),
            sa.Column('payment_reference', sa.String(100)),
            sa.Column('accounting_entry_id', sa.String()),

            sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()')),
            sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()')),
        )
        op.create_index('ix_expense_reports_employee', 'expense_reports', ['employee_id'])
        op.create_index('ix_expense_reports_status', 'expense_reports', ['status'])
        op.create_index('ix_expense_reports_period', 'expense_reports', ['period_start', 'period_end'])

    if not table_exists('expense_lines'):
        op.create_table(
            'expense_lines',
            sa.Column('id', sa.String(), primary_key=True),
            sa.Column('tenant_id', sa.String(), nullable=False, index=True),
            sa.Column('expense_report_id', sa.String(), sa.ForeignKey('expense_reports.id', ondelete='CASCADE'), nullable=False),

            # Date & description
            sa.Column('expense_date', sa.Date(), nullable=False),
            sa.Column('description', sa.String(500), nullable=False),

            # Catégorie
            sa.Column('category', sa.String(), default='other'),
            sa.Column('subcategory', sa.String(100)),

            # Montant
            sa.Column('amount', sa.Numeric(15, 2), nullable=False),
            sa.Column('currency', sa.String(3), default='XOF'),
            sa.Column('amount_xof', sa.Numeric(15, 2)),
            sa.Column('exchange_rate', sa.Numeric(15, 6), default=1.0),

            # TVA
            sa.Column('vat_amount', sa.Numeric(15, 2), default=0),
            sa.Column('vat_rate', sa.Numeric(5, 2)),
            sa.Column('vat_recoverable', sa.Boolean(), default=False),

            # Kilométrage
            sa.Column('distance_km', sa.Numeric(10, 2)),
            sa.Column('vehicle_type', sa.String(), default='car'),
            sa.Column('rate_per_km', sa.Numeric(10, 2)),
            sa.Column('start_location', sa.String(200)),
            sa.Column('end_location', sa.String(200)),

            # Lieu
            sa.Column('city', sa.String(100)),
            sa.Column('country', sa.String(100)),

            # Projet/Client
            sa.Column('project_id', sa.String()),
            sa.Column('client_id', sa.String(), sa.ForeignKey('clients.id')),
            sa.Column('billable_to_client', sa.Boolean(), default=False),

            # Justificatif
            sa.Column('receipt_url', sa.String(500)),
            sa.Column('receipt_required', sa.Boolean(), default=True),
            sa.Column('receipt_missing_reason', sa.Text()),

            # Participants
            sa.Column('attendees', sa.JSON()),

            # Validation
            sa.Column('is_approved', sa.Boolean()),
            sa.Column('rejection_reason', sa.Text()),
            sa.Column('notes', sa.Text()),

            sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()')),
            sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()')),
        )
        op.create_index('ix_expense_lines_report', 'expense_lines', ['expense_report_id'])
        op.create_index('ix_expense_lines_date', 'expense_lines', ['expense_date'])


def downgrade():
    """Remove HR Advanced tables"""

    # Notes de frais
    op.drop_table('expense_lines')
    op.drop_table('expense_reports')
    op.drop_table('expense_policies')

    # Paie OHADA
    op.drop_table('employee_loans')
    op.drop_table('salary_advances')
    op.drop_table('payroll_parameters')

    # Performance
    op.drop_table('feedbacks_360')
    op.drop_table('goals')
    op.drop_table('performance_reviews')

    # Pointage
    op.drop_table('attendances')
    op.drop_table('shift_assignments')
    op.drop_table('shifts')
    op.drop_table('work_schedules')
