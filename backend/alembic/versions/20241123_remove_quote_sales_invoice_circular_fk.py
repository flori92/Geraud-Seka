"""Remove circular Quote-SalesInvoice relationship

Revision ID: 20241123_remove_circular_fk
Revises: 20241122_treasury_forecasts
Create Date: 2024-11-23 00:00:00.000000

This migration removes the sales_invoice_id foreign key from the quotes table
to fix the circular relationship issue. The relationship is now unidirectional:
SalesInvoice.quote_id -> Quote (many-to-one)
Quote.sales_invoices <- SalesInvoice (one-to-many inverse)
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '20241123_remove_circular_fk'
down_revision = '20241122_treasury_forecasts'
branch_labels = None
depends_on = None


def upgrade():
    # Drop the foreign key constraint first (if it exists)
    # We use batch_alter_table for better SQLite compatibility if needed
    with op.batch_alter_table('quotes', schema=None) as batch_op:
        # Try to drop the foreign key constraint (may have auto-generated name)
        try:
            batch_op.drop_constraint('quotes_sales_invoice_id_fkey', type_='foreignkey')
        except Exception:
            # Constraint might not exist or have different name, continue anyway
            pass

        # Drop the column
        batch_op.drop_column('sales_invoice_id')


def downgrade():
    # Add the column back if needed (for rollback)
    with op.batch_alter_table('quotes', schema=None) as batch_op:
        batch_op.add_column(
            sa.Column('sales_invoice_id', postgresql.UUID(as_uuid=True), nullable=True)
        )

        # Recreate the foreign key
        batch_op.create_foreign_key(
            'quotes_sales_invoice_id_fkey',
            'sales_invoices',
            ['sales_invoice_id'],
            ['id'],
            ondelete='SET NULL'
        )
