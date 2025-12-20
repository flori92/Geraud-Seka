"""fix supplier contact_name column

Revision ID: 20251220_fix_supplier_contact
Revises: add_subscription_001
Create Date: 2025-12-20

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "20251220_fix_supplier_contact"
down_revision = "add_subscription_001"
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
