#!/usr/bin/env python3
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent))

try:
    from app.db.session import SessionLocal
    from sqlalchemy import text
    
    db = SessionLocal()
    
    # Compter les utilisateurs
    result = db.execute(text("SELECT COUNT(*) FROM users"))
    count = result.scalar()
    
    print(f"👥 Utilisateurs dans la base: {count}")
    
    if count > 0:
        result = db.execute(text("SELECT id, email, is_active FROM users"))
        print("\nUtilisateurs:")
        for row in result:
            print(f"  - {row[1]} (ID: {row[0]}, Active: {row[2]})")
    else:
        print("\n⚠️  Aucun utilisateur trouvé!")
        print("Exécutez: python quick_create_user.py")
    
    db.close()
    
except Exception as e:
    print(f"❌ Erreur: {e}")
    print("\nLa base de données n'est peut-être pas accessible.")
