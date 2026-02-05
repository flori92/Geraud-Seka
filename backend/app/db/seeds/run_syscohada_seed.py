"""
Script pour peupler les tables SYSCOHADA

Usage:
    cd backend
    python -m app.db.seeds.run_syscohada_seed

Ce script est idempotent: il ne cree pas de doublons si execute plusieurs fois.
"""
import uuid
import sys
import os

# Ajouter le chemin backend au PYTHONPATH
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', '..'))

from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.syscohada import SyscohadaAccount, SupplierCategory, AccountKeyword
from app.db.seeds.syscohada_data import SYSCOHADA_ACCOUNTS, SUPPLIER_CATEGORIES, ACCOUNT_KEYWORDS


def seed_syscohada_accounts(db: Session) -> int:
    """
    Seed les comptes SYSCOHADA.
    Retourne le nombre de comptes crees.
    """
    existing = db.query(SyscohadaAccount).count()
    if existing > 0:
        print(f"  -> SYSCOHADA accounts already seeded ({existing} records). Skipping.")
        return 0

    count = 0
    for account in SYSCOHADA_ACCOUNTS:
        db.add(SyscohadaAccount(
            id=uuid.uuid4(),
            account_number=account["number"],
            account_label=account["label"],
            account_class=account["class"],
            parent_account=account.get("parent"),
            level=account.get("level", 2),
            is_detail=account.get("is_detail", True),
            description=account.get("description")
        ))
        count += 1

    db.commit()
    print(f"  -> Seeded {count} SYSCOHADA accounts.")
    return count


def seed_supplier_categories(db: Session) -> int:
    """
    Seed les categories fournisseurs.
    Retourne le nombre de categories creees.
    """
    existing = db.query(SupplierCategory).count()
    if existing > 0:
        print(f"  -> Supplier categories already seeded ({existing} records). Skipping.")
        return 0

    count = 0
    for cat in SUPPLIER_CATEGORIES:
        db.add(SupplierCategory(
            id=uuid.uuid4(),
            code=cat["code"],
            label=cat["label"],
            default_charge_account=cat["account"],
            keywords=cat["keywords"],
            tenant_id=None  # Categories systeme
        ))
        count += 1

    db.commit()
    print(f"  -> Seeded {count} supplier categories.")
    return count


def seed_account_keywords(db: Session) -> int:
    """
    Seed les mots-cles de comptes.
    Retourne le nombre de mots-cles crees.
    """
    existing = db.query(AccountKeyword).count()
    if existing > 0:
        print(f"  -> Account keywords already seeded ({existing} records). Skipping.")
        return 0

    count = 0
    for kw in ACCOUNT_KEYWORDS:
        db.add(AccountKeyword(
            id=uuid.uuid4(),
            keyword=kw["keyword"],
            account_number=kw["account"],
            priority=kw.get("priority", 0)
        ))
        count += 1

    db.commit()
    print(f"  -> Seeded {count} account keywords.")
    return count


def run_seed():
    """Execute tous les seeds SYSCOHADA"""
    print("\n" + "=" * 60)
    print("SYSCOHADA SEED - Plan Comptable OHADA")
    print("=" * 60 + "\n")

    db = SessionLocal()
    try:
        print("[1/3] Seeding SYSCOHADA accounts (Plan Comptable)...")
        accounts_count = seed_syscohada_accounts(db)

        print("\n[2/3] Seeding supplier categories...")
        categories_count = seed_supplier_categories(db)

        print("\n[3/3] Seeding account keywords...")
        keywords_count = seed_account_keywords(db)

        print("\n" + "-" * 60)
        print("SEED COMPLETED SUCCESSFULLY!")
        print(f"  - Accounts:   {accounts_count}")
        print(f"  - Categories: {categories_count}")
        print(f"  - Keywords:   {keywords_count}")
        print("-" * 60 + "\n")

    except Exception as e:
        print(f"\n[ERROR] Seed failed: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    run_seed()
