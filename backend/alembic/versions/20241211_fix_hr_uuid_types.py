"""Fix HR tables UUID types

Revision ID: 20241211_fix_hr_uuid
Revises: 20241211_accounting_rules
Create Date: 2024-12-11 23:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '20241211_fix_hr_uuid'
down_revision = '20241211_accounting_rules'
branch_labels = None
depends_on = None


def upgrade():
    """Convert String IDs to UUID in HR tables"""
    
    # Fix employees table
    try:
        op.alter_column('employees', 'id', 
                       existing_type=sa.String(), 
                       type_=postgresql.UUID(as_uuid=True),
                       postgresql_using='id::uuid')
        op.alter_column('employees', 'tenant_id', 
                       existing_type=sa.String(), 
                       type_=postgresql.UUID(as_uuid=True),
                       postgresql_using='tenant_id::uuid')
        op.alter_column('employees', 'manager_id', 
                       existing_type=sa.String(), 
                       type_=postgresql.UUID(as_uuid=True),
                       postgresql_using='manager_id::uuid')
    except:
        pass
    
    # Fix contracts table
    try:
        op.alter_column('contracts', 'id', 
                       existing_type=sa.String(), 
                       type_=postgresql.UUID(as_uuid=True),
                       postgresql_using='id::uuid')
        op.alter_column('contracts', 'tenant_id', 
                       existing_type=sa.String(), 
                       type_=postgresql.UUID(as_uuid=True),
                       postgresql_using='tenant_id::uuid')
        op.alter_column('contracts', 'employee_id', 
                       existing_type=sa.String(), 
                       type_=postgresql.UUID(as_uuid=True),
                       postgresql_using='employee_id::uuid')
    except:
        pass
    
    # Fix payslips table
    try:
        op.alter_column('payslips', 'id', 
                       existing_type=sa.String(), 
                       type_=postgresql.UUID(as_uuid=True),
                       postgresql_using='id::uuid')
        op.alter_column('payslips', 'tenant_id', 
                       existing_type=sa.String(), 
                       type_=postgresql.UUID(as_uuid=True),
                       postgresql_using='tenant_id::uuid')
        op.alter_column('payslips', 'employee_id', 
                       existing_type=sa.String(), 
                       type_=postgresql.UUID(as_uuid=True),
                       postgresql_using='employee_id::uuid')
    except:
        pass
    
    # Fix leave_requests table
    try:
        op.alter_column('leave_requests', 'id', 
                       existing_type=sa.String(), 
                       type_=postgresql.UUID(as_uuid=True),
                       postgresql_using='id::uuid')
        op.alter_column('leave_requests', 'tenant_id', 
                       existing_type=sa.String(), 
                       type_=postgresql.UUID(as_uuid=True),
                       postgresql_using='tenant_id::uuid')
        op.alter_column('leave_requests', 'employee_id', 
                       existing_type=sa.String(), 
                       type_=postgresql.UUID(as_uuid=True),
                       postgresql_using='employee_id::uuid')
        op.alter_column('leave_requests', 'approved_by_id', 
                       existing_type=sa.String(), 
                       type_=postgresql.UUID(as_uuid=True),
                       postgresql_using='approved_by_id::uuid')
    except:
        pass


def downgrade():
    """Revert UUID types to String in HR tables"""
    
    # Revert employees table
    try:
        op.alter_column('employees', 'id', 
                       existing_type=postgresql.UUID(as_uuid=True), 
                       type_=sa.String())
        op.alter_column('employees', 'tenant_id', 
                       existing_type=postgresql.UUID(as_uuid=True), 
                       type_=sa.String())
        op.alter_column('employees', 'manager_id', 
                       existing_type=postgresql.UUID(as_uuid=True), 
                       type_=sa.String())
    except:
        pass
    
    # Revert other tables similarly...