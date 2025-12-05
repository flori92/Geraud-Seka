"""Add Sales Module tables (quotes, invoices, purchase orders, delivery notes)

Revision ID: 20241122_sales_001
Revises: seka_enterprise_001
Create Date: 2024-11-22 18:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = '20241122_sales_001'
down_revision = 'add_subscription_001'
branch_labels = None
depends_on = None


def upgrade():
    """Upgrade database with Sales Module tables"""

    # ========== QUOTES (Devis) ==========
    op.create_table('quotes',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('quote_number', sa.String(length=50), nullable=False),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('client_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.String(length=1000), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('quote_date', sa.Date(), nullable=False),
        sa.Column('valid_until', sa.Date(), nullable=True),
        sa.Column('subtotal_ht', sa.Numeric(precision=15, scale=2), nullable=False, default=0),
        sa.Column('discount_percentage', sa.Numeric(precision=5, scale=2), nullable=False, default=0),
        sa.Column('discount_amount', sa.Numeric(precision=15, scale=2), nullable=False, default=0),
        sa.Column('total_ht', sa.Numeric(precision=15, scale=2), nullable=False, default=0),
        sa.Column('total_vat', sa.Numeric(precision=15, scale=2), nullable=False, default=0),
        sa.Column('total_ttc', sa.Numeric(precision=15, scale=2), nullable=False, default=0),
        sa.Column('currency', sa.String(length=3), nullable=False, default='XOF'),
        sa.Column('payment_terms', sa.String(length=255), nullable=True),
        sa.Column('delivery_terms', sa.String(length=255), nullable=True),
        sa.Column('notes', sa.String(length=1000), nullable=True),
        sa.Column('pdf_url', sa.String(length=512), nullable=True),
        sa.Column('metadata', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.Date(), nullable=False),
        sa.Column('updated_at', sa.Date(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['client_id'], ['clients.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
        sa.UniqueConstraint('quote_number'),
        sa.Index('ix_quotes_id', 'id'),
        sa.Index('ix_quotes_quote_number', 'quote_number'),
        sa.Index('ix_quotes_tenant_id', 'tenant_id'),
        sa.Index('ix_quotes_client_id', 'client_id'),
        sa.Index('ix_quotes_status', 'status'),
        sa.Index('ix_quotes_quote_date', 'quote_date')
    )

    op.create_table('quote_items',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('quote_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('product_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('description', sa.String(length=500), nullable=False),
        sa.Column('quantity', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('unit_price', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('discount_percentage', sa.Numeric(precision=5, scale=2), nullable=False, default=0),
        sa.Column('vat_rate', sa.Numeric(precision=5, scale=2), nullable=False, default=18.00),
        sa.Column('subtotal', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('discount_amount', sa.Numeric(precision=15, scale=2), nullable=False, default=0),
        sa.Column('total_ht', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('total_vat', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('total_ttc', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('position', sa.Integer(), nullable=False, default=0),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['quote_id'], ['quotes.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='SET NULL'),
        sa.Index('ix_quote_items_id', 'id'),
        sa.Index('ix_quote_items_quote_id', 'quote_id')
    )

    # ========== SALES INVOICES (Factures de Vente) ==========
    op.create_table('sales_invoices',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('invoice_number', sa.String(length=50), nullable=False),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('client_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('quote_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.String(length=1000), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('payment_status', sa.String(length=20), nullable=False),
        sa.Column('invoice_date', sa.Date(), nullable=False),
        sa.Column('due_date', sa.Date(), nullable=True),
        sa.Column('subtotal_ht', sa.Numeric(precision=15, scale=2), nullable=False, default=0),
        sa.Column('discount_percentage', sa.Numeric(precision=5, scale=2), nullable=False, default=0),
        sa.Column('discount_amount', sa.Numeric(precision=15, scale=2), nullable=False, default=0),
        sa.Column('total_ht', sa.Numeric(precision=15, scale=2), nullable=False, default=0),
        sa.Column('total_vat', sa.Numeric(precision=15, scale=2), nullable=False, default=0),
        sa.Column('total_ttc', sa.Numeric(precision=15, scale=2), nullable=False, default=0),
        sa.Column('amount_paid', sa.Numeric(precision=15, scale=2), nullable=False, default=0),
        sa.Column('amount_due', sa.Numeric(precision=15, scale=2), nullable=False, default=0),
        sa.Column('currency', sa.String(length=3), nullable=False, default='XOF'),
        sa.Column('payment_terms', sa.String(length=255), nullable=True),
        sa.Column('notes', sa.String(length=1000), nullable=True),
        sa.Column('pdf_url', sa.String(length=512), nullable=True),
        sa.Column('metadata', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.Date(), nullable=False),
        sa.Column('updated_at', sa.Date(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['client_id'], ['clients.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['quote_id'], ['quotes.id'], ondelete='SET NULL'),
        sa.UniqueConstraint('invoice_number'),
        sa.Index('ix_sales_invoices_id', 'id'),
        sa.Index('ix_sales_invoices_invoice_number', 'invoice_number'),
        sa.Index('ix_sales_invoices_tenant_id', 'tenant_id'),
        sa.Index('ix_sales_invoices_client_id', 'client_id'),
        sa.Index('ix_sales_invoices_status', 'status'),
        sa.Index('ix_sales_invoices_payment_status', 'payment_status'),
        sa.Index('ix_sales_invoices_invoice_date', 'invoice_date'),
        sa.Index('ix_sales_invoices_due_date', 'due_date')
    )

    op.create_table('sales_invoice_items',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('sales_invoice_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('product_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('description', sa.String(length=500), nullable=False),
        sa.Column('quantity', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('unit_price', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('discount_percentage', sa.Numeric(precision=5, scale=2), nullable=False, default=0),
        sa.Column('vat_rate', sa.Numeric(precision=5, scale=2), nullable=False, default=18.00),
        sa.Column('subtotal', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('discount_amount', sa.Numeric(precision=15, scale=2), nullable=False, default=0),
        sa.Column('total_ht', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('total_vat', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('total_ttc', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('position', sa.Integer(), nullable=False, default=0),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['sales_invoice_id'], ['sales_invoices.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='SET NULL'),
        sa.Index('ix_sales_invoice_items_id', 'id'),
        sa.Index('ix_sales_invoice_items_invoice_id', 'sales_invoice_id')
    )

    op.create_table('payments',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('sales_invoice_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('amount', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('payment_date', sa.Date(), nullable=False),
        sa.Column('payment_method', sa.String(length=50), nullable=False),
        sa.Column('reference', sa.String(length=100), nullable=True),
        sa.Column('notes', sa.String(length=500), nullable=True),
        sa.Column('created_at', sa.Date(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['sales_invoice_id'], ['sales_invoices.id'], ondelete='CASCADE'),
        sa.Index('ix_payments_id', 'id'),
        sa.Index('ix_payments_invoice_id', 'sales_invoice_id'),
        sa.Index('ix_payments_payment_date', 'payment_date')
    )

    # ========== PURCHASE ORDERS (Bons de Commande Achat) ==========
    op.create_table('purchase_orders',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('po_number', sa.String(length=50), nullable=False),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('supplier_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.String(length=1000), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('order_date', sa.Date(), nullable=False),
        sa.Column('expected_delivery_date', sa.Date(), nullable=True),
        sa.Column('actual_delivery_date', sa.Date(), nullable=True),
        sa.Column('subtotal_ht', sa.Numeric(precision=15, scale=2), nullable=False, default=0),
        sa.Column('discount_percentage', sa.Numeric(precision=5, scale=2), nullable=False, default=0),
        sa.Column('discount_amount', sa.Numeric(precision=15, scale=2), nullable=False, default=0),
        sa.Column('total_ht', sa.Numeric(precision=15, scale=2), nullable=False, default=0),
        sa.Column('total_vat', sa.Numeric(precision=15, scale=2), nullable=False, default=0),
        sa.Column('total_ttc', sa.Numeric(precision=15, scale=2), nullable=False, default=0),
        sa.Column('currency', sa.String(length=3), nullable=False, default='XOF'),
        sa.Column('payment_terms', sa.String(length=255), nullable=True),
        sa.Column('delivery_address', sa.String(length=500), nullable=True),
        sa.Column('internal_notes', sa.String(length=1000), nullable=True),
        sa.Column('supplier_notes', sa.String(length=1000), nullable=True),
        sa.Column('pdf_url', sa.String(length=512), nullable=True),
        sa.Column('metadata', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.Date(), nullable=False),
        sa.Column('updated_at', sa.Date(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['supplier_id'], ['suppliers.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
        sa.UniqueConstraint('po_number'),
        sa.Index('ix_purchase_orders_id', 'id'),
        sa.Index('ix_purchase_orders_po_number', 'po_number'),
        sa.Index('ix_purchase_orders_tenant_id', 'tenant_id'),
        sa.Index('ix_purchase_orders_supplier_id', 'supplier_id'),
        sa.Index('ix_purchase_orders_status', 'status'),
        sa.Index('ix_purchase_orders_order_date', 'order_date')
    )

    op.create_table('purchase_order_items',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('purchase_order_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('product_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('description', sa.String(length=500), nullable=False),
        sa.Column('quantity_ordered', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('quantity_received', sa.Numeric(precision=10, scale=2), nullable=False, default=0),
        sa.Column('unit_price', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('discount_percentage', sa.Numeric(precision=5, scale=2), nullable=False, default=0),
        sa.Column('vat_rate', sa.Numeric(precision=5, scale=2), nullable=False, default=18.00),
        sa.Column('subtotal', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('discount_amount', sa.Numeric(precision=15, scale=2), nullable=False, default=0),
        sa.Column('total_ht', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('total_vat', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('total_ttc', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('position', sa.Integer(), nullable=False, default=0),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['purchase_order_id'], ['purchase_orders.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='SET NULL'),
        sa.Index('ix_purchase_order_items_id', 'id'),
        sa.Index('ix_purchase_order_items_po_id', 'purchase_order_id')
    )

    # ========== DELIVERY NOTES (Bons de Livraison) ==========
    op.create_table('delivery_notes',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('delivery_number', sa.String(length=50), nullable=False),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('purchase_order_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('supplier_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('delivery_date', sa.Date(), nullable=False),
        sa.Column('carrier', sa.String(length=100), nullable=True),
        sa.Column('tracking_number', sa.String(length=100), nullable=True),
        sa.Column('delivery_address', sa.String(length=500), nullable=True),
        sa.Column('received_by', sa.String(length=100), nullable=True),
        sa.Column('signature_url', sa.String(length=512), nullable=True),
        sa.Column('notes', sa.String(length=1000), nullable=True),
        sa.Column('pdf_url', sa.String(length=512), nullable=True),
        sa.Column('metadata', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.Date(), nullable=False),
        sa.Column('updated_at', sa.Date(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['purchase_order_id'], ['purchase_orders.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['supplier_id'], ['suppliers.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
        sa.UniqueConstraint('delivery_number'),
        sa.Index('ix_delivery_notes_id', 'id'),
        sa.Index('ix_delivery_notes_delivery_number', 'delivery_number'),
        sa.Index('ix_delivery_notes_tenant_id', 'tenant_id'),
        sa.Index('ix_delivery_notes_po_id', 'purchase_order_id'),
        sa.Index('ix_delivery_notes_supplier_id', 'supplier_id'),
        sa.Index('ix_delivery_notes_status', 'status'),
        sa.Index('ix_delivery_notes_delivery_date', 'delivery_date')
    )

    op.create_table('delivery_note_items',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('delivery_note_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('purchase_order_item_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('product_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('description', sa.String(length=500), nullable=False),
        sa.Column('quantity_delivered', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('quantity_accepted', sa.Numeric(precision=10, scale=2), nullable=False, default=0),
        sa.Column('quantity_rejected', sa.Numeric(precision=10, scale=2), nullable=False, default=0),
        sa.Column('rejection_reason', sa.String(length=500), nullable=True),
        sa.Column('position', sa.Integer(), nullable=False, default=0),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['delivery_note_id'], ['delivery_notes.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['purchase_order_item_id'], ['purchase_order_items.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='SET NULL'),
        sa.Index('ix_delivery_note_items_id', 'id'),
        sa.Index('ix_delivery_note_items_dn_id', 'delivery_note_id')
    )


def downgrade():
    """Downgrade database by removing Sales Module tables"""
    op.drop_table('delivery_note_items')
    op.drop_table('delivery_notes')
    op.drop_table('purchase_order_items')
    op.drop_table('purchase_orders')
    op.drop_table('payments')
    op.drop_table('sales_invoice_items')
    op.drop_table('sales_invoices')
    op.drop_table('quote_items')
    op.drop_table('quotes')
