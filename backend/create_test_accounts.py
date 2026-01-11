#!/usr/bin/env python3
"""
Script pour créer les comptes de test SEKA Business V1
Crée des utilisateurs pour chaque profil : Admin, Comptable, Collaborateur
Pour les modes Entreprise et Cabinet
"""

import sys
import uuid
from pathlib import Path

# Ajouter le chemin pour les imports
sys.path.append(str(Path(__file__).parent))

from sqlalchemy import text
from sqlalchemy.exc import IntegrityError

from app.db.session import SessionLocal
from app.models.tenant import Tenant
from app.models.user import User
from app.core.security import get_password_hash


def create_test_accounts():
    """Crée tous les comptes de test pour SEKA V1"""
    
    print("🚀 Création des comptes de test SEKA Business V1")
    print("=" * 60)
    
    db = SessionLocal()
    created_accounts = []
    
    try:
        # 1. Vérifier/Créer les tenants (Entreprise et Cabinet)
        print("\n📦 Vérification des tenants...")
        
        # Tenant Entreprise
        enterprise_tenant = db.query(Tenant).filter(Tenant.subdomain == "entreprise-demo").first()
        if not enterprise_tenant:
            enterprise_tenant = Tenant(
                id=uuid.uuid4(),
                name="Entreprise ABC SARL",
                subdomain="entreprise-demo",
                country="BJ",  # Bénin
                is_active=True,
                plan="premium"
            )
            db.add(enterprise_tenant)
            db.flush()
            print("  ✅ Tenant 'Entreprise ABC SARL' créé")
        else:
            print("  ℹ️  Tenant 'Entreprise ABC SARL' existe déjà")
        
        # Tenant Cabinet
        cabinet_tenant = db.query(Tenant).filter(Tenant.subdomain == "cabinet-demo").first()
        if not cabinet_tenant:
            cabinet_tenant = Tenant(
                id=uuid.uuid4(),
                name="Cabinet KOUTON & Associés",
                subdomain="cabinet-demo",
                country="BJ",
                is_active=True,
                plan="cabinet"
            )
            db.add(cabinet_tenant)
            db.flush()
            print("  ✅ Tenant 'Cabinet KOUTON & Associés' créé")
        else:
            print("  ℹ️  Tenant 'Cabinet KOUTON & Associés' existe déjà")
        
        # 2. Définir les comptes de test
        test_accounts = [
            # === MODE ENTREPRISE ===
            {
                "email": "admin@entreprise-demo.seka.app",
                "password": "Admin123!",
                "full_name": "Jean ADMIN",
                "role": "admin",
                "is_superuser": True,
                "tenant": enterprise_tenant,
                "description": "Admin Entreprise"
            },
            {
                "email": "comptable@entreprise-demo.seka.app",
                "password": "Compta123!",
                "full_name": "Marie COMPTABLE",
                "role": "accountant",
                "is_superuser": False,
                "tenant": enterprise_tenant,
                "description": "Comptable Entreprise"
            },
            {
                "email": "collaborateur@entreprise-demo.seka.app",
                "password": "Collab123!",
                "full_name": "Pierre COLLABORATEUR",
                "role": "collaborator",
                "is_superuser": False,
                "tenant": enterprise_tenant,
                "description": "Collaborateur Entreprise"
            },
            
            # === MODE CABINET ===
            {
                "email": "admin@cabinet-demo.seka.app",
                "password": "CabAdmin123!",
                "full_name": "Maître KOUTON",
                "role": "admin",
                "is_superuser": True,
                "tenant": cabinet_tenant,
                "description": "Admin Cabinet (Expert-Comptable)"
            },
            {
                "email": "comptable@cabinet-demo.seka.app",
                "password": "CabCompta123!",
                "full_name": "Sophie EXPERTISE",
                "role": "accountant",
                "is_superuser": False,
                "tenant": cabinet_tenant,
                "description": "Comptable Cabinet"
            },
            {
                "email": "assistant@cabinet-demo.seka.app",
                "password": "CabAssist123!",
                "full_name": "Alain ASSISTANT",
                "role": "collaborator",
                "is_superuser": False,
                "tenant": cabinet_tenant,
                "description": "Assistant Cabinet"
            },
        ]
        
        # 3. Créer les utilisateurs
        print("\n👥 Création des comptes utilisateurs...")
        
        for account in test_accounts:
            existing = db.query(User).filter(User.email == account["email"]).first()
            
            if existing:
                print(f"  ℹ️  {account['description']}: {account['email']} existe déjà")
                created_accounts.append({
                    "email": account["email"],
                    "password": account["password"],
                    "role": account["role"],
                    "description": account["description"],
                    "tenant": account["tenant"].name,
                    "status": "existant"
                })
            else:
                user = User(
                    id=uuid.uuid4(),
                    email=account["email"],
                    hashed_password=get_password_hash(account["password"]),
                    full_name=account["full_name"],
                    role=account["role"],
                    is_active=True,
                    is_superuser=account["is_superuser"],
                    tenant_id=account["tenant"].id
                )
                db.add(user)
                print(f"  ✅ {account['description']}: {account['email']} créé")
                created_accounts.append({
                    "email": account["email"],
                    "password": account["password"],
                    "role": account["role"],
                    "description": account["description"],
                    "tenant": account["tenant"].name,
                    "status": "créé"
                })
        
        db.commit()
        
        # 4. Afficher le récapitulatif
        print("\n" + "=" * 60)
        print("📋 RÉCAPITULATIF DES COMPTES DE TEST")
        print("=" * 60)
        
        print("\n🏢 MODE ENTREPRISE (Entreprise ABC SARL)")
        print("-" * 50)
        for acc in created_accounts:
            if "entreprise" in acc["email"]:
                print(f"  {acc['description']}")
                print(f"    📧 Email: {acc['email']}")
                print(f"    🔑 Mot de passe: {acc['password']}")
                print(f"    👤 Rôle: {acc['role']}")
                print()
        
        print("\n🏛️ MODE CABINET (Cabinet KOUTON & Associés)")
        print("-" * 50)
        for acc in created_accounts:
            if "cabinet" in acc["email"]:
                print(f"  {acc['description']}")
                print(f"    📧 Email: {acc['email']}")
                print(f"    🔑 Mot de passe: {acc['password']}")
                print(f"    👤 Rôle: {acc['role']}")
                print()
        
        print("=" * 60)
        print("✅ Tous les comptes de test sont prêts!")
        print("🌐 URL de connexion: https://votre-domaine.com/login")
        print("=" * 60)
        
        return created_accounts
        
    except IntegrityError as e:
        db.rollback()
        print(f"❌ Erreur de contrainte: {e}")
        return []
    except Exception as e:
        db.rollback()
        print(f"❌ Erreur: {e}")
        import traceback
        traceback.print_exc()
        return []
    finally:
        db.close()


if __name__ == "__main__":
    create_test_accounts()
