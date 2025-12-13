"""force add original_filename column

Revision ID: 20241213_force_add_original_filename
Revises: 20241211_fix_hr_uuid_types
Create Date: 2024-12-13 10:30:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '20241213_force_add_original_filename'
down_revision = '20241211_fix_hr_uuid'
branch_labels = None
depends_on = None


def upgrade():
    # Add original_filename column if it doesn't exist
    # Use raw SQL to handle IF NOT EXISTS gracefully
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1
                FROM information_schema.columns
                WHERE table_name = 'documents'
                AND column_name = 'original_filename'
            ) THEN
                ALTER TABLE documents ADD COLUMN original_filename VARCHAR(255);
            END IF;
        END $$;
    """)


def downgrade():
    # Only drop if it exists
    op.execute("""
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1
                FROM information_schema.columns
                WHERE table_name = 'documents'
                AND column_name = 'original_filename'
            ) THEN
                ALTER TABLE documents DROP COLUMN original_filename;
            END IF;
        END $$;
    """)
