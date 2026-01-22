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

-- Add exported_at column
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'exported_at') THEN
        ALTER TABLE documents ADD COLUMN exported_at TIMESTAMP;
        RAISE NOTICE 'Added column: exported_at';
    ELSE
        RAISE NOTICE 'exported_at column already exists';
    END IF;
END $$;

-- Add journal_type column
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'journal_type') THEN
        ALTER TABLE documents ADD COLUMN journal_type VARCHAR(50);
        RAISE NOTICE 'Added column: journal_type';
    ELSE
        RAISE NOTICE 'journal_type column already exists';
    END IF;
END $$;

-- Add accounting_entry_id column
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'accounting_entry_id') THEN
        ALTER TABLE documents ADD COLUMN accounting_entry_id UUID;
        RAISE NOTICE 'Added column: accounting_entry_id';
        
        -- Try to add FK if table exists
        BEGIN
            ALTER TABLE documents ADD CONSTRAINT fk_documents_accounting_entry_header 
                FOREIGN KEY (accounting_entry_id) REFERENCES accounting_entries_header(id);
            RAISE NOTICE 'Added FK constraint';
        EXCEPTION
            WHEN undefined_table THEN
                RAISE NOTICE 'accounting_entries_header table does not exist, skipping FK';
            WHEN others THEN
                RAISE NOTICE 'Could not add FK: %', SQLERRM;
        END;
    ELSE
        RAISE NOTICE 'accounting_entry_id column already exists';
    END IF;
END $$;

RAISE NOTICE 'Migration completed successfully';
