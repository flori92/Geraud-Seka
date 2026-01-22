#!/usr/bin/env python3
"""
Script pour créer un utilisateur admin dans la base de données
"""

import sys
from pathlib import Path

# Ajouter le chemin pour les imports
sys.path.append(str(Path(__file__).parent))

from app.db.session import SessionLocal
from app.crud.user import create as user_create, get_by_email
from app.schemas.user import UserCreate
from sqlalchemy.exc import IntegrityError

def create_admin():
    print("🔧 Création de l'utilisateur admin...")
    
    db = SessionLocal()
    
    try:
        # Vérifier si l'utilisateur existe déjà
        existing_user = get_by_email(db, email="admin@seka.app")
        
        if existing_user:
            print("✅ L'utilisateur admin@seka.app existe déjà")
            print(f"   ID: {existing_user.id}")
            print(f"   Email: {existing_user.email}")
            print(f"   Active: {existing_user.is_active}")
            return
        
        # Créer l'utilisateur
        user = user_create(
            db,
            obj_in=UserCreate(
                email="admin@seka.app",
                password="Admin123!",
                full_name="Admin SEKA",
                role="admin"
            )
        )
        
        print("✅ Utilisateur créé avec succès!")
        print(f"   Email: {user.email}")
        print(f"   Password: Admin123!")
        print(f"   ID: {user.id}")
        
    except IntegrityError as e:
        print(f"❌ Erreur: L'utilisateur existe déjà ou erreur de contrainte")
        print(f"   Détails: {e}")
    except Exception as e:
        print(f"❌ Erreur lors de la création: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_admin()
