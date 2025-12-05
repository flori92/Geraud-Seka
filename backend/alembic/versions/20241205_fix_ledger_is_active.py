"""Fix ledger_accounts is_active column type from VARCHAR to BOOLEAN

Revision ID: fix_ledger_is_active
Revises: add_ledger_accounts_001
Create Date: 2024-12-05 19:15:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'fix_ledger_is_active'
down_revision = 'add_ledger_accounts_001'
branch_labels = None
depends_on = None


def column_type_is_varchar(table_name, column_name):
    """Check if a column is VARCHAR type"""
    from sqlalchemy import inspect
    bind = op.get_bind()
    inspector = inspect(bind)
    columns = inspector.get_columns(table_name)
    for col in columns:
        if col['name'] == column_name:
            return 'VARCHAR' in str(col['type']).upper() or 'CHARACTER' in str(col['type']).upper()
    return False


def upgrade():
    """Convert is_active from VARCHAR to BOOLEAN if needed"""
    # Check if ledger_accounts table exists and is_active is VARCHAR
    from sqlalchemy import inspect
    bind = op.get_bind()
    inspector = inspect(bind)
    
    if 'ledger_accounts' not in inspector.get_table_names():
        return  # Table doesn't exist yet
    
    if column_type_is_varchar('ledger_accounts', 'is_active'):
        # Convert VARCHAR to BOOLEAN
        # First, add a temporary column
        op.add_column('ledger_accounts', sa.Column('is_active_new', sa.Boolean(), nullable=True))
        
        # Copy data with conversion
        op.execute("""
            UPDATE ledger_accounts 
            SET is_active_new = CASE 
                WHEN is_active IN ('true', 'True', 'TRUE', '1', 't') THEN true 
                ELSE false 
            END
        """)
        
        # Drop old column and rename new one
        op.drop_column('ledger_accounts', 'is_active')
        op.alter_column('ledger_accounts', 'is_active_new', new_column_name='is_active', nullable=False, server_default='true')


def downgrade():
    """Convert back to VARCHAR (not recommended)"""
    pass
