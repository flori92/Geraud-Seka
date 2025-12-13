"""force add documents category column

Revision ID: 20251213_force_add_documents_category
Revises: 20251213_force_add_documents_title
Create Date: 2025-12-13 18:10:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '20251213_force_add_documents_category'
down_revision = '20251213_force_add_documents_title'
branch_labels = None
depends_on = None


def upgrade():
    """Add category column to documents table if it doesn't exist"""
    # Check if the column exists and add it if not
    connection = op.get_bind()
    inspector = sa.inspect(connection)
    columns = [col['name'] for col in inspector.get_columns('documents')]

    if 'category' not in columns:
        # Create the enum type first
        category_enum = postgresql.ENUM(
            'accounting', 'legal', 'administrative', 'technical', 'marketing', 'project', 'other',
            name='documentcategory',
            create_type=False
        )

        # Try to create the enum type if it doesn't exist
        try:
            category_enum.create(connection, checkfirst=True)
        except Exception:
            pass

        # Add the column
        op.add_column(
            'documents',
            sa.Column(
                'category',
                category_enum,
                nullable=True,
                server_default='other'
            )
        )
        print("✅ Column 'category' added to documents table")
    else:
        print("ℹ️  Column 'category' already exists in documents table")


def downgrade():
    """Remove category column from documents table"""
    op.drop_column('documents', 'category')
