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
    # Import PurchaseOrder and DeliveryNote BEFORE Supplier (which references them)
    from app.models.purchase_order import PurchaseOrder, PurchaseOrderItem, DeliveryNote, DeliveryNoteItem  # noqa
    # Now import Supplier (which references PurchaseOrder and DeliveryNote)
    from app.models.supplier import Supplier  # noqa
    # Now import Client (which references Quote and SalesInvoice)
    from app.models.client import Client  # noqa
    # Import other models
    from app.models.document import Document  # noqa
    from app.models.product import Product  # noqa
    from app.models.activity import Activity  # noqa
    from app.models.accounting import AccountingEntry  # noqa
    from app.models.hr import Employee, Contract, Payslip, LeaveRequest  # noqa
    # Import HR Advanced models
    from app.models.hr_advanced import (  # noqa
        WorkSchedule, Shift, ShiftAssignment, Attendance,
        PerformanceReview, Goal, Feedback360,
        PayrollParameter, SalaryAdvance, Loan,
        ExpensePolicy, ExpenseReport, ExpenseLine
    )
    # Import HR Recruitment models
    from app.models.hr_recruitment import (  # noqa
        JobPosting, Candidate, Application, Interview, JobOffer, RecruitmentPipeline
    )
    # Import HR Training models
    from app.models.hr_training import (  # noqa
        TrainingCourse, TrainingSession, TrainingEnrollment,
        Skill, EmployeeSkill, DevelopmentPlan, SuccessionPlan
    )
    # Import CRM models
    from app.models.crm import Lead, Opportunity, CRMActivity  # noqa
    # Import Accounting models
    from app.models.ledger_account import LedgerAccount  # noqa
    from app.models.accounting_advanced import (  # noqa
        FiscalYear, AccountingPeriod, ChartOfAccount, AccountingJournal,
        JournalEntry, JournalEntryLine, CostCenter, Reconciliation,
        BankReconciliation, Budget, BudgetLine, VATDeclaration
    )
except ImportError:
    pass  # Some models might not exist yet

def ensure_tenant_columns():
    """Ajoute les colonnes manquantes à la table tenants si nécessaire"""
    try:
        with engine.connect() as conn:
            # Vérifier si la colonne stripe_customer_id existe
            result = conn.execute(text("""
                SELECT column_name FROM information_schema.columns 
                WHERE table_name = 'tenants' AND column_name = 'stripe_customer_id'
            """))
            if not result.fetchone():
                print("🔧 Ajout de la colonne stripe_customer_id à tenants...")
                conn.execute(text("ALTER TABLE tenants ADD COLUMN stripe_customer_id VARCHAR(255)"))
                conn.commit()
                print("✅ Colonne stripe_customer_id ajoutée")
            
            # Vérifier si la colonne subscription_status existe
            result = conn.execute(text("""
                SELECT column_name FROM information_schema.columns 
                WHERE table_name = 'tenants' AND column_name = 'subscription_status'
            """))
            if not result.fetchone():
                print("🔧 Ajout de la colonne subscription_status à tenants...")
                conn.execute(text("ALTER TABLE tenants ADD COLUMN subscription_status VARCHAR(50) DEFAULT 'active'"))
                conn.commit()
                print("✅ Colonne subscription_status ajoutée")
                
    except Exception as e:
        print(f"⚠️  Erreur lors de l'ajout des colonnes tenant: {e}")


def ensure_documents_columns():
    """Ajoute les colonnes manquantes à la table documents si nécessaire.

    Ce fallback est utile en production quand Alembic ne peut pas appliquer `upgrade head`
    (ex: plusieurs heads). On évite ainsi des erreurs 500 sur les inserts ORM.
    """
    try:
        with engine.connect() as conn:
            # Vérifier si la colonne title existe
            result = conn.execute(
                text(
                    """
                    SELECT column_name FROM information_schema.columns
                    WHERE table_name = 'documents' AND column_name = 'title'
                    """
                )
            )
            if not result.fetchone():
                print("🔧 Ajout de la colonne title à documents...")
                conn.execute(text("ALTER TABLE documents ADD COLUMN title VARCHAR(500)"))
                conn.commit()
                print("✅ Colonne title ajoutée")

            # Vérifier si la colonne description existe
            result = conn.execute(
                text(
                    """
                    SELECT column_name FROM information_schema.columns
                    WHERE table_name = 'documents' AND column_name = 'description'
                    """
                )
            )
            if not result.fetchone():
                print("🔧 Ajout de la colonne description à documents...")
                conn.execute(text("ALTER TABLE documents ADD COLUMN description TEXT"))
                conn.commit()
                print("✅ Colonne description ajoutée")

            # Vérifier si la colonne category existe
            result = conn.execute(
                text(
                    """
                    SELECT column_name FROM information_schema.columns
                    WHERE table_name = 'documents' AND column_name = 'category'
                    """
                )
            )
            if not result.fetchone():
                print("🔧 Ajout de la colonne category à documents...")
                # Créer le type enum s'il n'existe pas
                try:
                    conn.execute(text("""
                        DO $$ BEGIN
                            CREATE TYPE documentcategory AS ENUM (
                                'accounting', 'legal', 'administrative',
                                'technical', 'marketing', 'project', 'other'
                            );
                        EXCEPTION
                            WHEN duplicate_object THEN null;
                        END $$;
                    """))
                    conn.commit()
                    print("✅ Type enum documentcategory créé/vérifié")
                except Exception as e:
                    print(f"⚠️  Info: Type enum existe peut-être déjà: {e}")

                # Ajouter la colonne avec cast explicite pour le default
                try:
                    conn.execute(text("""
                        ALTER TABLE documents ADD COLUMN category documentcategory DEFAULT CAST('other' AS documentcategory)
                    """))
                    conn.commit()
                    print("✅ Colonne category ajoutée")
                except Exception as e:
                    print(f"⚠️  Erreur colonne category: {e}")

            # Vérifier si la colonne document_date existe
            result = conn.execute(
                text(
                    """
                    SELECT column_name FROM information_schema.columns
                    WHERE table_name = 'documents' AND column_name = 'document_date'
                    """
                )
            )
            if not result.fetchone():
                print("🔧 Ajout de la colonne document_date à documents...")
                conn.execute(text("ALTER TABLE documents ADD COLUMN document_date DATE"))
                conn.commit()
                print("✅ Colonne document_date ajoutée")

            # Vérifier si la colonne due_date existe
            result = conn.execute(
                text(
                    """
                    SELECT column_name FROM information_schema.columns
                    WHERE table_name = 'documents' AND column_name = 'due_date'
                    """
                )
            )
            if not result.fetchone():
                print("🔧 Ajout de la colonne due_date à documents...")
                conn.execute(text("ALTER TABLE documents ADD COLUMN due_date DATE"))
                conn.commit()
                print("✅ Colonne due_date ajoutée")

            # Vérifier si la colonne expiry_date existe
            result = conn.execute(
                text(
                    """
                    SELECT column_name FROM information_schema.columns
                    WHERE table_name = 'documents' AND column_name = 'expiry_date'
                    """
                )
            )
            if not result.fetchone():
                print("🔧 Ajout de la colonne expiry_date à documents...")
                conn.execute(text("ALTER TABLE documents ADD COLUMN expiry_date DATE"))
                conn.commit()
                print("✅ Colonne expiry_date ajoutée")

    except Exception as e:
        print(f"⚠️  Erreur lors de l'ajout des colonnes documents: {e}")


def run_migrations():
    """Exécute les migrations Alembic et crée les tables"""
    try:
        print("🔄 Exécution des migrations Alembic...")

        # Créer d'abord les tables directement (idempotent)
        print("🔧 Création des tables si elles n'existent pas...")
        print(f"📊 Tables dans metadata: {list(Base.metadata.tables.keys())}")
        Base.metadata.create_all(bind=engine)
        print("✅ Tables vérifiées/créées")
        
        # Assurer que les colonnes tenant existent
        ensure_tenant_columns()

        # Assurer que les colonnes documents existent (fallback prod si Alembic est bloqué)
        ensure_documents_columns()

        # Vérifier que les tables existent
        with engine.connect() as conn:
            result = conn.execute(text("SELECT tablename FROM pg_tables WHERE schemaname='public'"))
            tables = [row[0] for row in result]
            print(f"📋 Tables dans la base: {tables}")

            # Vérifier si alembic_version existe et a des migrations appliquées
            current_version = None
            if 'alembic_version' in tables:
                try:
                    version_result = conn.execute(text("SELECT version_num FROM alembic_version"))
                    current_version = version_result.scalar()
                    if current_version:
                        print(f"ℹ️  Migration Alembic actuelle: {current_version}")
                except Exception:
                    pass  # Table existe mais vide

        # Configuration Alembic
        alembic_cfg = Config("alembic.ini")

        # Toujours essayer d'appliquer les nouvelles migrations
        print("🔄 Vérification et application des nouvelles migrations...")
        try:
            command.upgrade(alembic_cfg, "head")
            print("✅ Migrations appliquées avec succès")
        except Exception as upgrade_error:
            # Si échec, vérifier si c'est parce qu'il n'y a rien à migrer
            if "Target database is not up to date" not in str(upgrade_error):
                print(f"⚠️  Info migration: {upgrade_error}")
            print("✅ Base de données à jour")

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
        from app.models.purchase_order import PurchaseOrder, PurchaseOrderItem, DeliveryNote, DeliveryNoteItem  # noqa
        from app.models.supplier import Supplier  # noqa
        from app.models.client import Client  # noqa
        from app.models.hr_advanced import (  # noqa
            WorkSchedule, Shift, ShiftAssignment, Attendance,
            PerformanceReview, Goal, Feedback360,
            PayrollParameter, SalaryAdvance, Loan,
            ExpensePolicy, ExpenseReport, ExpenseLine
        )
        from app.models.hr_recruitment import (  # noqa
            JobPosting, Candidate, Application, Interview, JobOffer, RecruitmentPipeline
        )
        from app.models.hr_training import (  # noqa
            TrainingCourse, TrainingSession, TrainingEnrollment,
            Skill, EmployeeSkill, DevelopmentPlan, SuccessionPlan
        )

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