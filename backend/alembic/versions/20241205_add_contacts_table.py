"""add contacts table

Revision ID: 20241205_add_contacts
Revises: 20241122_add_crm_integration
Create Date: 2024-12-05 00:20:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '20241205_add_contacts'
down_revision = '20241122_add_crm_integration'
branch_labels = None
depends_on = None


def upgrade():
    # Create contacts table
    op.create_table(
        'contacts',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('first_name', sa.String(100), nullable=False),
        sa.Column('last_name', sa.String(100), nullable=False),
        sa.Column('full_name', sa.String(255)),
        sa.Column('email', sa.String(255), nullable=False, index=True),
        sa.Column('phone', sa.String(20)),
        sa.Column('mobile', sa.String(20)),
        sa.Column('job_title', sa.String(100)),
        sa.Column('department', sa.String(100)),
        sa.Column('contact_type', sa.String(50), server_default='other'),
        sa.Column('address', sa.Text),
        sa.Column('city', sa.String(100)),
        sa.Column('postal_code', sa.String(20)),
        sa.Column('country', sa.String(100)),
        sa.Column('preferred_contact_method', sa.String(20)),
        sa.Column('language', sa.String(10), server_default='fr'),
        sa.Column('timezone', sa.String(50)),
        sa.Column('linkedin_url', sa.String(500)),
        sa.Column('twitter_handle', sa.String(100)),
        sa.Column('is_primary', sa.Boolean, server_default='false'),
        sa.Column('is_active', sa.Boolean, server_default='true'),
        sa.Column('do_not_contact', sa.Boolean, server_default='false'),
        sa.Column('email_opt_out', sa.Boolean, server_default='false'),
        sa.Column('last_contact_date', sa.DateTime),
        sa.Column('last_email_sent', sa.DateTime),
        sa.Column('last_email_opened', sa.DateTime),
        sa.Column('email_bounced', sa.Boolean, server_default='false'),
        sa.Column('notes', sa.Text),
        sa.Column('tags', sa.JSON),
        sa.Column('custom_fields', sa.JSON),
        sa.Column('client_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('clients.id')),
        sa.Column('lead_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('leads.id')),
        sa.Column('assigned_to', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id')),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False),
        sa.Column('created_at', sa.DateTime, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime, server_default=sa.text('now()'), onupdate=sa.text('now()'))
    )
    
    # Add contact_id to crm_activities table
    op.add_column('crm_activities', sa.Column('contact_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('contacts.id')))


def downgrade():
    # Remove contact_id from crm_activities
    op.drop_column('crm_activities', 'contact_id')
    
    # Drop contacts table
    op.drop_table('contacts')
