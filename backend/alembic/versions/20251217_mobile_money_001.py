"""Add Mobile Money support for treasury

Revision ID: 20251217_mobile_money_001
Revises: 20251217_merge_heads_001
Create Date: 2025-12-17

"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "20251217_mobile_money_001"
down_revision = "20251217_merge_heads_001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()

    # Add enum value if the Postgres enum type exists
    conn.execute(sa.text(
        """
        DO $$ BEGIN
          IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'bankaccounttype') THEN
            BEGIN
              ALTER TYPE bankaccounttype ADD VALUE IF NOT EXISTS 'mobile_money';
            EXCEPTION WHEN duplicate_object THEN
              NULL;
            END;
          END IF;
        END $$;
        """
    ))

    # Bank accounts metadata
    conn.execute(sa.text(
        "ALTER TABLE bank_accounts ADD COLUMN IF NOT EXISTS metadata JSONB"
    ))

    # Bank transactions reconciliation + metadata
    conn.execute(sa.text(
        "ALTER TABLE bank_transactions ADD COLUMN IF NOT EXISTS metadata JSONB"
    ))
    conn.execute(sa.text(
        "ALTER TABLE bank_transactions ADD COLUMN IF NOT EXISTS is_reconciled BOOLEAN DEFAULT FALSE"
    ))
    conn.execute(sa.text(
        "ALTER TABLE bank_transactions ADD COLUMN IF NOT EXISTS reconciliation_date DATE"
    ))
    conn.execute(sa.text(
        "ALTER TABLE bank_transactions ADD COLUMN IF NOT EXISTS bank_statement_line VARCHAR(255)"
    ))

    # Optional: ensure index exists for reconciliation queries
    conn.execute(sa.text(
        "CREATE INDEX IF NOT EXISTS ix_bank_transactions_is_reconciled ON bank_transactions (is_reconciled)"
    ))


def downgrade() -> None:
    # Downgrade is intentionally a no-op for safety in production.
    pass
