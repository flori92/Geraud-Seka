-- Migration: Add missing columns to documents table
-- Created: 2024-12-11
-- Purpose: Fix production database schema mismatch

-- Add original_filename if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'documents' AND column_name = 'original_filename'
    ) THEN
        ALTER TABLE documents ADD COLUMN original_filename VARCHAR(255) NOT NULL DEFAULT '';
        RAISE NOTICE 'Added column: original_filename';
    END IF;
END $$;

-- Update original_filename from filename for existing rows
UPDATE documents
SET original_filename = filename
WHERE original_filename = '' OR original_filename IS NULL;

-- Remove default constraint after update
ALTER TABLE documents ALTER COLUMN original_filename DROP DEFAULT;

RAISE NOTICE 'Migration completed successfully';
