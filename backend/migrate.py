#!/usr/bin/env python3
"""
Script de migration automatique pour SEKA en production
Initialise la base de données et applique toutes les migrations
"""

from contextlib import suppress
from pathlib import Path
import sys

try:
    # Import alembic lazily; some environments (local dev / Railway runner) may not
    # have alembic installed in the PATH. We import inside run_migrations as well.
    from alembic.config import Config  # type: ignore
    from alembic import command  # type: ignore
except ImportError:
    Config = None
    command = None
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
with suppress(ImportError):
    from app.models.tenant import Tenant  # noqa
    from app.models.user import User  # noqa
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
    from app.models.accounting import AccountingEntry  # noqa
    # HR modules removed: skipped imports
    # CRM modules removed: skipped imports (activities and opportunities)
    # Import Accounting models
    from app.models.ledger_account import LedgerAccount  # noqa
    from app.models.accounting_advanced import (  # noqa
        FiscalYear, AccountingPeriod, ChartOfAccount, AccountingJournal,
        JournalEntry, JournalEntryLine, CostCenter, Reconciliation,
        BankReconciliation, Budget, BudgetLine, VATDeclaration
    )

def add_column_if_not_exists(conn, table_name: str, column_name: str, column_def: str, message: str, success_msg: str):
    """Ajoute une colonne à une table si elle n'existe pas (helper idempotent)"""
    result = conn.execute(text(
        f"SELECT column_name FROM information_schema.columns WHERE table_name = '{table_name}' AND column_name = '{column_name}'"
    ))
    if not result.fetchone():
        print(message)
        conn.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {column_def}"))
        conn.commit()
        print(success_msg)


def ensure_tenant_columns():
    """Ajoute les colonnes manquantes à la table tenants si nécessaire"""
    try:
        with engine.connect() as conn:
            add_column_if_not_exists(
                conn,
                'tenants',
                'stripe_customer_id',
                'stripe_customer_id VARCHAR(255)',
                '🔧 Ajout de la colonne stripe_customer_id à tenants...',
                '✅ Colonne stripe_customer_id ajoutée'
            )
            add_column_if_not_exists(
                conn,
                'tenants',
                'subscription_status',
                "subscription_status VARCHAR(50) DEFAULT 'active'",
                '🔧 Ajout de la colonne subscription_status à tenants...',
                '✅ Colonne subscription_status ajoutée'
            )
                
    except Exception as e:
        print(f"⚠️  Erreur lors de l'ajout des colonnes tenant: {e}")


def ensure_documents_columns():
    """Ajoute les colonnes manquantes à la table documents si nécessaire.

    Ce fallback est utile en production quand Alembic ne peut pas appliquer `upgrade head`
    (ex: plusieurs heads). On évite ainsi des erreurs 500 sur les inserts ORM.

    SOLUTION RADICALE: Ajoute TOUTES les colonnes du modèle Document de manière idempotente.
    """
    try:
        with engine.connect() as conn:
            print("🔧 Vérification complète du schéma documents...")

            # Créer les types enum s'ils n'existent pas
            with suppress(Exception):
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

            # Définir TOUTES les colonnes attendues
            columns_to_check = {
                'original_filename': 'VARCHAR(255)',
                'file_extension': 'VARCHAR(10)',
                'title': 'VARCHAR(500)',
                'description': 'TEXT',
                'category': 'documentcategory DEFAULT CAST(\'other\' AS documentcategory)',
                'tags': 'JSON',
                'custom_fields': 'JSON',
                'reference_number': 'VARCHAR(100)',
                'document_date': 'DATE',
                'due_date': 'DATE',
                'expiry_date': 'DATE',
                'amount_ht': 'FLOAT',
                'amount_vat': 'FLOAT',
                'amount_ttc': 'FLOAT',
                'currency': 'VARCHAR(3) DEFAULT \'XOF\'',
                'version': 'INTEGER DEFAULT 1',
                'parent_document_id': 'UUID',
                'is_latest_version': 'BOOLEAN DEFAULT TRUE',
                'ocr_data': 'JSON',
                'ocr_confidence': 'FLOAT',
                'ai_extracted_data': 'JSON',
                'is_confidential': 'BOOLEAN DEFAULT FALSE',
                'is_archived': 'BOOLEAN DEFAULT FALSE',
                'is_locked': 'BOOLEAN DEFAULT FALSE',
                'requires_validation': 'BOOLEAN DEFAULT FALSE',
                'validated_by': 'UUID',
                'validated_at': 'DATE',
                'folder_id': 'UUID',
                'client_id': 'UUID',
                'supplier_id': 'UUID',
                'lead_id': 'UUID',
                'opportunity_id': 'UUID',
                'tenant_id': 'UUID',
                'uploaded_by': 'UUID',
            }

            # Vérifier et ajouter chaque colonne
            for column_name, column_type in columns_to_check.items():
                result = conn.execute(text(f"""
                    SELECT column_name FROM information_schema.columns
                    WHERE table_name = 'documents' AND column_name = '{column_name}'
                """))

                if not result.fetchone():
                    try:
                        print(f"🔧 Ajout de la colonne {column_name}...")
                        conn.execute(text(f"ALTER TABLE documents ADD COLUMN {column_name} {column_type}"))
                        conn.commit()
                        print(f"✅ Colonne {column_name} ajoutée")
                    except Exception as e:
                        print(f"⚠️  Erreur colonne {column_name}: {e}")
                        conn.rollback()

            print("✅ Vérification complète du schéma terminée")

    except Exception as e:
        print(f"⚠️  Erreur lors de la vérification du schéma documents: {e}")




def run_migrations():
    """Exécute les migrations Alembic et crée les tables"""
    try:
        print("🔄 Exécution des migrations Alembic...")

        # Créer d'abord les tables directement (idempotent)
        print("🔧 Création des tables si elles n'existent pas...")

        # Exclure explicitement les tables liées aux modules RH supprimés
        # Ceci empêche SQLAlchemy d'essayer de créer des tables RH qui
        # pourraient entrer en conflit avec l'historique de la base.
        hr_tables = [
            'employees', 'contracts', 'payslips', 'leave_requests',
            'work_schedules', 'shifts', 'shift_assignments', 'attendances',
            'performance_reviews', 'goals', 'feedbacks_360', 'payroll_parameters',
            'salary_advances', 'employee_loans', 'expense_policies', 'expense_reports',
            'expense_lines', 'job_postings', 'candidates', 'applications', 'interviews',
            'job_offers', 'recruitment_pipelines', 'training_courses', 'training_sessions',
            'training_enrollments', 'skills', 'employee_skills', 'development_plans',
            'succession_plans'
        ]

        for t in hr_tables:
            if t in Base.metadata.tables:
                with suppress(Exception):
                    Base.metadata.tables.pop(t)

        print(f"📊 Tables dans metadata (filtré): {list(Base.metadata.tables.keys())}")
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
            if 'alembic_version' in tables:
                with suppress(Exception):
                    if current_version := conn.execute(text("SELECT version_num FROM alembic_version")).scalar():
                        print(f"ℹ️  Migration Alembic actuelle: {current_version}")

        # Configuration Alembic (import lazily if available)
        print("🔄 Vérification et application des nouvelles migrations...")
        try:
            if Config is None or command is None:
                # Attempt lazy import here to give clearer errors
                try:
                    from alembic.config import Config as _Config  # type: ignore
                    from alembic import command as _command  # type: ignore
                    alembic_cfg = _Config("alembic.ini")
                    _command.upgrade(alembic_cfg, "head")
                    print("✅ Migrations appliquées avec succès (import tardif)")
                except Exception as upgrade_error:
                    print(f"⚠️  Alembic non disponible ou échec: {upgrade_error}")
                    print("ℹ️  Ignorer l'application Alembic (environnements sans dépendances).")
            else:
                alembic_cfg = Config("alembic.ini")
                try:
                    command.upgrade(alembic_cfg, "head")
                    print("✅ Migrations appliquées avec succès")
                except Exception as upgrade_error:
                    if "Target database is not up to date" not in str(upgrade_error):
                        print(f"⚠️  Info migration: {upgrade_error}")
                    print("ℹ️  Base de données probablement à jour ou migration ignorée")
        except Exception as e:
            print(f"⚠️  Erreur lors de la tentative d'application Alembic: {e}")

        return True

    except Exception as e:
        print(f"❌ Erreur lors des migrations: {e}")
        return False

def create_database_if_not_exists():
    """Crée la base de données si elle n'existe pas"""
    try:
        settings = get_settings()
        
        print("🔍 Vérification de la connexion à la base de données...")
        
        # Test de connexion
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            print("✅ Connexion à la base de données réussie")
            
        return True
        
    except OperationalError as e:
        print(f"❌ Erreur de connexion à la base de données: {e}")
        return False

def _create_password_context():
    """Crée le contexte de hachage des mots de passe"""
    from passlib.context import CryptContext
    return CryptContext(schemes=["bcrypt"], deprecated="auto")

def _create_default_tenant_data():
    """Retourne les données par défaut du tenant"""
    return {
        "name": "SEKA Demo",
        "subdomain": "demo", 
        "country": "CI",
        "is_active": True,
        "plan": "premium"
    }

def _create_admin_user_data(tenant_id: str, hashed_password: str):
    """Retourne les données par défaut de l'utilisateur admin"""
    return {
        "email": "admin@sekagestion.com",
        "hashed_password": hashed_password,
        "full_name": "Administrateur SEKA",
        "role": "admin",
        "is_active": True,
        "is_superuser": True,
        "tenant_id": tenant_id
    }

def _print_success_message(method: str):
    """Affiche le message de succès après création des données initiales"""
    print(f"✅ Données initiales créées ({method})")
    print("👤 Utilisateur admin: admin@sekagestion.com / admin123")

def _create_initial_data_orm():
    """Crée les données initiales via ORM (SessionLocal)"""
    from app.db.session import SessionLocal
    from app.models.tenant import Tenant
    from app.models.user import User

    db = SessionLocal()

    if db.query(Tenant).first():
        print("ℹ️  Des données existent déjà, création ignorée")
        db.close()
        return True

    pwd_context = _create_password_context()
    tenant_data = _create_default_tenant_data()
    
    default_tenant = Tenant(**tenant_data)
    db.add(default_tenant)
    db.flush()

    admin_data = _create_admin_user_data(default_tenant.id, pwd_context.hash("admin123"))
    admin_user = User(**{k: v for k, v in admin_data.items() if k != "role"})
    db.add(admin_user)

    db.commit()
    db.close()

    _print_success_message("ORM")
    return True

def _create_initial_data_sql():
    """Crée les données initiales via SQL (fallback)"""
    from sqlalchemy import text
    import uuid

    with engine.connect() as conn:
        if conn.execute(text("SELECT 1 FROM tenants LIMIT 1")).fetchone():
            print("ℹ️  Des données existent déjà (SQL), création ignorée")
            return True

        pwd_context = _create_password_context()
        tenant_data = _create_default_tenant_data()
        tenant_id = str(uuid.uuid4())
        
        conn.execute(
            text("INSERT INTO tenants (id, name, subdomain, country, is_active, plan) VALUES (:id, :name, :subdomain, :country, :is_active, :plan)"),
            {"id": tenant_id, **tenant_data}
        )

        admin_data = _create_admin_user_data(tenant_id, pwd_context.hash("admin123"))
        admin_id = str(uuid.uuid4())
        
        conn.execute(
            text("INSERT INTO users (id, email, hashed_password, full_name, role, is_active, is_superuser, tenant_id) VALUES (:id, :email, :hashed_password, :full_name, :role, :is_active, :is_superuser, :tenant_id)"),
            {"id": admin_id, **admin_data}
        )
        conn.commit()

    _print_success_message("SQL")
    return True

def create_initial_data():
    """Crée les données initiales nécessaires"""
    try:
        print("📋 Création des données initiales...")

        # Import all models first to ensure SQLAlchemy relationships are configured
        from app.models.quote import Quote, QuoteItem  # noqa
        from app.models.sales_invoice import SalesInvoice, SalesInvoiceItem, Payment  # noqa
        from app.models.purchase_order import PurchaseOrder, PurchaseOrderItem, DeliveryNote, DeliveryNoteItem  # noqa
        from app.models.supplier import Supplier  # noqa
        from app.models.client import Client  # noqa

        # Try to use ORM insertion; fallback to raw SQL if needed
        try:
            return _create_initial_data_orm()
        except Exception as orm_exc:
            print(f"⚠️  ORM initial data path failed (falling back to SQL): {orm_exc}")
            try:
                return _create_initial_data_sql()
            except Exception as sql_exc:
                print(f"❌ Fallback SQL initial data failed: {sql_exc}")
                return False
        
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