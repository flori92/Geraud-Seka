#!/usr/bin/env python3
"""
Script pour tester la connexion à la base de données
"""

import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent))

from app.core.config import get_settings
from sqlalchemy import create_engine, text

def test_connection():
    settings = get_settings()
    
    print("🔍 Test de connexion à la base de données")
    print("=" * 50)
    print()
    
    db_url = settings.database_url
    print(f"📡 URL: {db_url[:50]}...")
    print()
    
    try:
        engine = create_engine(db_url)
        
        with engine.connect() as conn:
            # Test simple
            result = conn.execute(text("SELECT 1"))
            print("✅ Connexion réussie!")
            print()
            
            # Vérifier les tables
            result = conn.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
                ORDER BY table_name
            """))
            
            tables = [row[0] for row in result]
            
            if tables:
                print(f"📋 Tables trouvées ({len(tables)}):")
                for table in tables:
                    print(f"   - {table}")
                print()
                
                # Compter les utilisateurs
                if 'users' in tables:
                    result = conn.execute(text("SELECT COUNT(*) FROM users"))
                    count = result.scalar()
                    print(f"👥 Utilisateurs dans la base: {count}")
                    
                    if count > 0:
                        result = conn.execute(text("SELECT email, is_active FROM users LIMIT 5"))
                        print("   Utilisateurs:")
                        for row in result:
                            print(f"   - {row[0]} (active: {row[1]})")
                else:
                    print("⚠️  Table 'users' non trouvée - migrations non exécutées?")
            else:
                print("⚠️  Aucune table trouvée - base de données vide")
                print("   Exécutez: python migrate.py")
            
    except Exception as e:
        print(f"❌ Erreur de connexion: {e}")
        print()
        print("Vérifiez:")
        print("1. PostgreSQL est déployé sur Railway")
        print("2. DATABASE_URL est configurée")
        print("3. Le backend peut accéder à PostgreSQL")

if __name__ == "__main__":
    test_connection()
