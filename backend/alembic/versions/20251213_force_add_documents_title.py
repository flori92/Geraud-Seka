from alembic import op

revision = "20251213_force_add_documents_title"
down_revision = "20241213_force_add_original_filename"
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
                WHERE table_name = 'documents'
                AND column_name = 'title'
            ) THEN
                ALTER TABLE documents ADD COLUMN title VARCHAR(500);
            END IF;

            IF NOT EXISTS (
                SELECT 1
                FROM information_schema.columns
                WHERE table_name = 'documents'
                AND column_name = 'description'
            ) THEN
                ALTER TABLE documents ADD COLUMN description TEXT;
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
                WHERE table_name = 'documents'
                AND column_name = 'title'
            ) THEN
                ALTER TABLE documents DROP COLUMN title;
            END IF;

            IF EXISTS (
                SELECT 1
                FROM information_schema.columns
                WHERE table_name = 'documents'
                AND column_name = 'description'
            ) THEN
                ALTER TABLE documents DROP COLUMN description;
            END IF;
        END $$;
        """
    )
