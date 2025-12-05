#!/usr/bin/env python3
"""
Script to create missing database tables.
Run this on the production server after deployment.
"""
import os
import sys

# Add the parent directory to the path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import engine
from app.db.base import Base
from sqlalchemy import inspect

def create_missing_tables():
    """Create all missing tables in the database."""
    print("🔄 Checking for missing tables...")
    
    # Import all models to register them
    from app.models import user, tenant, client
    from app.models import treasury, quote, sales_invoice, product
    from app.models import accounting_advanced, ledger_account
    from app.models import crm, documents
    
    try:
        # Get existing tables
        inspector = inspect(engine)
        existing_tables = set(inspector.get_table_names())
        
        # Get all model tables
        model_tables = set(Base.metadata.tables.keys())
        
        # Find missing tables
        missing = model_tables - existing_tables
        
        print(f"📊 Tables existantes: {len(existing_tables)}")
        print(f"📋 Tables dans les modèles: {len(model_tables)}")
        print(f"❌ Tables manquantes: {len(missing)}")
        
        if missing:
            print("\nTables manquantes:")
            for t in sorted(missing):
                print(f"   - {t}")
            
            print("\n🔧 Création des tables manquantes...")
            Base.metadata.create_all(
                bind=engine, 
                tables=[Base.metadata.tables[t] for t in missing]
            )
            print("✅ Tables créées avec succès!")
        else:
            print("\n✅ Toutes les tables existent déjà.")
        
        return True
        
    except Exception as e:
        print(f"❌ Erreur: {e}")
        return False


if __name__ == "__main__":
    success = create_missing_tables()
    sys.exit(0 if success else 1)
