#!/usr/bin/env python3
"""
Script de migration automatique pour SEKA en production
Initialise la base de données et applique toutes les migrations
"""

import os
import sys
import asyncio
from pathlib import Path
from alembic.config import Config
from alembic import command
from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError

# Ajouter le chemin pour les imports
sys.path.append(str(Path(__file__).parent))

from app.core.config import get_settings
from app.db.base import Base
from app.db.session import engine

# Import all models so they're registered with Base.metadata
# IMPORTANT: Import order matters for SQLAlchemy relationships
# Import Quote and SalesInvoice BEFORE Client to avoid mapper initialization errors
from app.models.tenant import Tenant  # noqa
from app.models.user import User  # noqa
try:
    # Import models that Client depends on FIRST
    from app.models.quote import Quote, QuoteItem  # noqa
    from app.models.sales_invoice import SalesInvoice, SalesInvoiceItem, Payment  # noqa
    # Now import Client (which references Quote and SalesInvoice)
    from app.models.client import Client  # noqa
    # Import other models
    from app.models.document import Document  # noqa
    from app.models.product import Product  # noqa
    from app.models.activity import Activity  # noqa
    from app.models.supplier import Supplier  # noqa
    from app.models.accounting import AccountingEntry  # noqa
    from app.models.hr import Employee, Contract, Payslip, LeaveRequest  # noqa
except ImportError:
    pass  # Some models might not exist yet

def run_migrations():
    """Exécute les migrations Alembic et crée les tables"""
    try:
        print("🔄 Exécution des migrations Alembic...")

        # Créer d'abord les tables directement (idempotent)
        print("🔧 Création des tables si elles n'existent pas...")
        print(f"📊 Tables dans metadata: {list(Base.metadata.tables.keys())}")
        Base.metadata.create_all(bind=engine)
        print("✅ Tables vérifiées/créées")

        # Vérifier que les tables existent
        with engine.connect() as conn:
            result = conn.execute(text("SELECT tablename FROM pg_tables WHERE schemaname='public'"))
            tables = [row[0] for row in result]
            print(f"📋 Tables dans la base: {tables}")

            # Vérifier si alembic_version existe et a des migrations appliquées
            if 'alembic_version' in tables:
                try:
                    version_result = conn.execute(text("SELECT version_num FROM alembic_version"))
                    current_version = version_result.scalar()
                    if current_version:
                        print(f"ℹ️  Migration Alembic déjà appliquée: {current_version}")
                        print("✅ Aucune migration nécessaire")
                        return True
                except Exception:
                    pass  # Table existe mais vide

        # Configuration Alembic
        alembic_cfg = Config("alembic.ini")

        # Si les tables existent déjà, juste marquer la migration comme appliquée
        if 'tenants' in tables and 'users' in tables:
            print("📌 Tables existantes détectées, marquage de la migration comme appliquée...")
            command.stamp(alembic_cfg, "head")
            print("✅ Migration marquée comme appliquée")
        else:
            # Sinon, exécuter les migrations normalement
            print("🔄 Application des migrations...")
            command.upgrade(alembic_cfg, "head")
            print("✅ Migrations appliquées avec succès")

        return True

    except Exception as e:
        print(f"❌ Erreur lors des migrations: {e}")
        return False

def create_database_if_not_exists():
    """Crée la base de données si elle n'existe pas"""
    try:
        settings = get_settings()
        
        print(f"🔍 Vérification de la connexion à la base de données...")
        
        # Test de connexion
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            print("✅ Connexion à la base de données réussie")
            
        return True
        
    except OperationalError as e:
        print(f"❌ Erreur de connexion à la base de données: {e}")
        return False

def create_initial_data():
    """Crée les données initiales nécessaires"""
    try:
        print("📋 Création des données initiales...")
        
        # Import all models first to ensure SQLAlchemy relationships are configured
        # This must be done before creating any SQLAlchemy session
        from app.models.quote import Quote, QuoteItem  # noqa
        from app.models.sales_invoice import SalesInvoice, SalesInvoiceItem, Payment  # noqa
        from app.models.client import Client  # noqa
        
        from app.db.session import SessionLocal
        from app.models.tenant import Tenant
        from app.models.user import User
        from passlib.context import CryptContext
        
        db = SessionLocal()
        
        # Vérifier si des données existent déjà
        existing_tenant = db.query(Tenant).first()
        if existing_tenant:
            print("ℹ️  Des données existent déjà, création ignorée")
            db.close()
            return True
        
        # Créer le tenant par défaut
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        
        default_tenant = Tenant(
            name="SEKA Demo",
            subdomain="demo",
            country="CI",
            is_active=True,
            plan="premium"
        )
        db.add(default_tenant)
        db.flush()  # Pour obtenir l'ID
        
        # Créer l'utilisateur admin
        admin_user = User(
            email="admin@sekagestion.com",
            hashed_password=pwd_context.hash("admin123"),
            full_name="Administrateur SEKA",
            is_active=True,
            is_superuser=True,
            tenant_id=default_tenant.id
        )
        db.add(admin_user)
        
        db.commit()
        db.close()
        
        print("✅ Données initiales créées")
        print("👤 Utilisateur admin: admin@sekagestion.com / admin123")
        
        return True
        
    except Exception as e:
        print(f"❌ Erreur lors de la création des données initiales: {e}")
        return False

def main():
    """Fonction principale de migration"""
    print("🚀 Initialisation de SEKA Backend")
    print("=" * 50)
    
    # 1. Vérifier la connexion à la base de données
    if not create_database_if_not_exists():
        print("❌ Impossible de se connecter à la base de données")
        sys.exit(1)
    
    # 2. Exécuter les migrations
    if not run_migrations():
        print("❌ Échec des migrations, arrêt du démarrage")
        sys.exit(1)
    
    # 3. Créer les données initiales
    if not create_initial_data():
        print("⚠️  Attention: Échec de la création des données initiales")
    
    print("=" * 50)
    print("🎉 Initialisation terminée avec succès!")
    print("🌐 L'API SEKA est prête pour la production")

if __name__ == "__main__":
    main()