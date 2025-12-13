"""force add contact_name column to suppliers

Revision ID: 20251213_force_add_supplier_contact_name
Revises: 20241213_force_add_original_filename
Create Date: 2025-12-13

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "20251213_add_supplier_contact"
down_revision = "fix_ledger_is_active"
branch_labels = None
depends_on = None


def upgrade():
    op.execute(
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1
                FROM information_schema.columns
                WHERE table_name = 'suppliers'
                AND column_name = 'contact_name'
            ) THEN
                ALTER TABLE suppliers ADD COLUMN contact_name VARCHAR(255);
            END IF;
        END $$;
        """
    )


def downgrade():
    op.execute(
        """
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1
                FROM information_schema.columns
                WHERE table_name = 'suppliers'
                AND column_name = 'contact_name'
            ) THEN
                ALTER TABLE suppliers DROP COLUMN contact_name;
            END IF;
        END $$;
        """
    )
