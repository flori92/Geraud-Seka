#!/bin/bash
# Script to add missing columns to documents table

set -e

echo "🔧 Adding missing columns to documents table..."

# Database connection
DATABASE_URL="postgresql+psycopg://postgres:MguTEKRaWdtJbjsheadNcOduNENWEVbJ@postgres.railway.internal:5432/railway"

python3 -c "
from sqlalchemy import create_engine, text, inspect
import os

engine = create_engine('$DATABASE_URL')

with engine.connect() as conn:
    inspector = inspect(engine)
    columns = [c['name'] for c in inspector.get_columns('documents')]
    
    # Add exported_at if missing
    if 'exported_at' not in columns:
        print('Adding exported_at column...')
        conn.execute(text('ALTER TABLE documents ADD COLUMN exported_at TIMESTAMP'))
        conn.commit()
        print('✅ exported_at added')
    else:
        print('ℹ️ exported_at already exists')
    
    # Add journal_type if missing
    if 'journal_type' not in columns:
        print('Adding journal_type column...')
        conn.execute(text('ALTER TABLE documents ADD COLUMN journal_type VARCHAR(50)'))
        conn.commit()
        print('✅ journal_type added')
    else:
        print('ℹ️ journal_type already exists')
    
    # Add accounting_entry_id if missing
    if 'accounting_entry_id' not in columns:
        print('Adding accounting_entry_id column...')
        conn.execute(text('ALTER TABLE documents ADD COLUMN accounting_entry_id UUID'))
        conn.commit()
        print('✅ accounting_entry_id added')
        
        # Try to add FK if table exists
        try:
            conn.execute(text('ALTER TABLE documents ADD CONSTRAINT fk_documents_accounting_entry_header FOREIGN KEY (accounting_entry_id) REFERENCES accounting_entries_header(id)'))
            conn.commit()
            print('✅ FK added')
        except Exception as e:
            print(f'⚠️ FK not added: {e}')
    else:
        print('ℹ️ accounting_entry_id already exists')

print('🎉 All missing columns added!')
"

echo "✅ Script completed"