"""add performance indexes

Revision ID: perf_indexes_001
Revises: 
Create Date: 2025-12-04

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'perf_indexes_001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Index on documents table for faster queries
    op.create_index('idx_documents_tenant_status', 'documents', ['tenant_id', 'status'])
    op.create_index('idx_documents_created_at', 'documents', ['created_at'])
    op.create_index('idx_documents_updated_at', 'documents', ['updated_at'])
    
    # Index on clients table
    op.create_index('idx_clients_tenant', 'clients', ['tenant_id'])
    op.create_index('idx_clients_updated_at', 'clients', ['updated_at'])
    
    # Index on leads table
    op.create_index('idx_leads_tenant_status', 'leads', ['tenant_id', 'status'])
    op.create_index('idx_leads_created_at', 'leads', ['created_at'])
    
    # Index on opportunities table
    op.create_index('idx_opportunities_tenant_stage', 'opportunities', ['tenant_id', 'stage'])
    op.create_index('idx_opportunities_created_at', 'opportunities', ['created_at'])
    
    # Index on crm_activities table
    op.create_index('idx_crm_activities_tenant', 'crm_activities', ['tenant_id'])
    op.create_index('idx_crm_activities_date', 'crm_activities', ['activity_date'])
    
    # Index on suppliers table
    op.create_index('idx_suppliers_tenant', 'suppliers', ['client_id'])
    
    # Index on invoices table (if exists)
    try:
        op.create_index('idx_invoices_tenant_status', 'invoices', ['tenant_id', 'status'])
        op.create_index('idx_invoices_date', 'invoices', ['invoice_date'])
    except:
        pass


def downgrade():
    # Drop indexes
    op.drop_index('idx_documents_tenant_status', table_name='documents')
    op.drop_index('idx_documents_created_at', table_name='documents')
    op.drop_index('idx_documents_updated_at', table_name='documents')
    
    op.drop_index('idx_clients_tenant', table_name='clients')
    op.drop_index('idx_clients_updated_at', table_name='clients')
    
    op.drop_index('idx_leads_tenant_status', table_name='leads')
    op.drop_index('idx_leads_created_at', table_name='leads')
    
    op.drop_index('idx_opportunities_tenant_stage', table_name='opportunities')
    op.drop_index('idx_opportunities_created_at', table_name='opportunities')
    
    op.drop_index('idx_crm_activities_tenant', table_name='crm_activities')
    op.drop_index('idx_crm_activities_date', table_name='crm_activities')
    
    op.drop_index('idx_suppliers_tenant', table_name='suppliers')
    
    try:
        op.drop_index('idx_invoices_tenant_status', table_name='invoices')
        op.drop_index('idx_invoices_date', table_name='invoices')
    except:
        pass
