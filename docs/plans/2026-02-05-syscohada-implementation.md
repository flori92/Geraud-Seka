# SYSCOHADA Integration - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Intégrer le référentiel SYSCOHADA complet avec sélecteur de comptes intelligent et auto-suggestion par catégorie fournisseur.

**Architecture:** Table dédiée `syscohada_accounts` (référentiel immuable) + `supplier_categories` (catégories avec compte par défaut) + composants frontend hybrides (combobox + modal arborescence).

**Tech Stack:** FastAPI, SQLAlchemy, Alembic, React/TypeScript, Tailwind CSS

---

## Phase 1: Models & Migration

### Task 1.1: Créer le modèle SyscohadaAccount

**Files:**
- Create: `backend/app/models/syscohada.py`

**Step 1: Créer le fichier modèle**

```python
"""
Modèles pour le référentiel SYSCOHADA (Plan Comptable OHADA)
"""
import uuid
from sqlalchemy import Column, String, Integer, Boolean, Text
from sqlalchemy.dialects.postgresql import UUID
from app.db.base import Base


class SyscohadaAccount(Base):
    """
    Référentiel des comptes SYSCOHADA.
    Table de référence immuable (pas de tenant_id).
    """
    __tablename__ = "syscohada_accounts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    account_number = Column(String(10), unique=True, nullable=False, index=True)
    account_label = Column(String(200), nullable=False)
    account_class = Column(Integer, nullable=False, index=True)
    parent_account = Column(String(10), nullable=True)
    level = Column(Integer, nullable=False, default=2)
    is_detail = Column(Boolean, nullable=False, default=True)
    description = Column(Text, nullable=True)

    def __repr__(self):
        return f"<SyscohadaAccount {self.account_number}: {self.account_label}>"
```

**Step 2: Commit**

```bash
git add backend/app/models/syscohada.py
git commit -m "feat(models): add SyscohadaAccount model for SYSCOHADA reference"
```

---

### Task 1.2: Créer le modèle SupplierCategory

**Files:**
- Modify: `backend/app/models/syscohada.py`

**Step 1: Ajouter SupplierCategory au fichier**

```python
# Ajouter après SyscohadaAccount

class SupplierCategory(Base):
    """
    Catégories de fournisseurs avec compte de charge par défaut.
    Permet l'auto-suggestion lors de la création de fournisseurs.
    """
    __tablename__ = "supplier_categories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = Column(String(20), unique=True, nullable=False, index=True)
    label = Column(String(100), nullable=False)
    default_charge_account = Column(String(10), nullable=False)
    keywords = Column(JSON, nullable=False, default=list)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=True, index=True)

    def __repr__(self):
        return f"<SupplierCategory {self.code}: {self.label}>"
```

**Step 2: Ajouter les imports nécessaires**

```python
# En haut du fichier, ajouter:
from sqlalchemy import Column, String, Integer, Boolean, Text, ForeignKey, JSON
```

**Step 3: Commit**

```bash
git add backend/app/models/syscohada.py
git commit -m "feat(models): add SupplierCategory model"
```

---

### Task 1.3: Créer le modèle AccountKeyword

**Files:**
- Modify: `backend/app/models/syscohada.py`

**Step 1: Ajouter AccountKeyword**

```python
# Ajouter après SupplierCategory

class AccountKeyword(Base):
    """
    Mapping mots-clés → comptes pour suggestion intelligente.
    """
    __tablename__ = "account_keywords"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    keyword = Column(String(100), nullable=False, index=True)
    account_number = Column(String(10), nullable=False)
    priority = Column(Integer, nullable=False, default=0)

    def __repr__(self):
        return f"<AccountKeyword {self.keyword} -> {self.account_number}>"
```

**Step 2: Commit**

```bash
git add backend/app/models/syscohada.py
git commit -m "feat(models): add AccountKeyword model"
```

---

### Task 1.4: Ajouter category_id au modèle Supplier

**Files:**
- Modify: `backend/app/models/supplier.py`

**Step 1: Ajouter la colonne et relation**

```python
# Ajouter l'import
from sqlalchemy.orm import relationship

# Ajouter la colonne après les autres FK
category_id = Column(UUID(as_uuid=True), ForeignKey("supplier_categories.id", ondelete="SET NULL"), nullable=True, index=True)

# Ajouter la relation
category = relationship("SupplierCategory", backref="suppliers")
```

**Step 2: Commit**

```bash
git add backend/app/models/supplier.py
git commit -m "feat(models): add category_id to Supplier model"
```

---

### Task 1.5: Exporter les modèles dans __init__.py

**Files:**
- Modify: `backend/app/models/__init__.py`

**Step 1: Ajouter les exports**

```python
from app.models.syscohada import SyscohadaAccount, SupplierCategory, AccountKeyword
```

**Step 2: Commit**

```bash
git add backend/app/models/__init__.py
git commit -m "chore(models): export SYSCOHADA models"
```

---

### Task 1.6: Créer la migration Alembic

**Files:**
- Create: `backend/alembic/versions/20260205_add_syscohada_reference.py`

**Step 1: Créer le fichier migration**

```python
"""Add SYSCOHADA reference tables

Revision ID: 20260205_syscohada
Revises: (previous_revision)
Create Date: 2026-02-05
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '20260205_syscohada'
down_revision = None  # À remplacer par la dernière révision
branch_labels = None
depends_on = None


def upgrade():
    # Table syscohada_accounts
    op.create_table('syscohada_accounts',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('account_number', sa.String(10), nullable=False),
        sa.Column('account_label', sa.String(200), nullable=False),
        sa.Column('account_class', sa.Integer(), nullable=False),
        sa.Column('parent_account', sa.String(10), nullable=True),
        sa.Column('level', sa.Integer(), nullable=False, default=2),
        sa.Column('is_detail', sa.Boolean(), nullable=False, default=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('account_number')
    )
    op.create_index('ix_syscohada_accounts_account_number', 'syscohada_accounts', ['account_number'])
    op.create_index('ix_syscohada_accounts_account_class', 'syscohada_accounts', ['account_class'])

    # Table supplier_categories
    op.create_table('supplier_categories',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('code', sa.String(20), nullable=False),
        sa.Column('label', sa.String(100), nullable=False),
        sa.Column('default_charge_account', sa.String(10), nullable=False),
        sa.Column('keywords', sa.JSON(), nullable=False, default=[]),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('code'),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE')
    )
    op.create_index('ix_supplier_categories_code', 'supplier_categories', ['code'])
    op.create_index('ix_supplier_categories_tenant_id', 'supplier_categories', ['tenant_id'])

    # Table account_keywords
    op.create_table('account_keywords',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('keyword', sa.String(100), nullable=False),
        sa.Column('account_number', sa.String(10), nullable=False),
        sa.Column('priority', sa.Integer(), nullable=False, default=0),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_account_keywords_keyword', 'account_keywords', ['keyword'])

    # Ajouter category_id à suppliers
    op.add_column('suppliers', sa.Column('category_id', postgresql.UUID(as_uuid=True), nullable=True))
    op.create_foreign_key('fk_suppliers_category_id', 'suppliers', 'supplier_categories', ['category_id'], ['id'], ondelete='SET NULL')
    op.create_index('ix_suppliers_category_id', 'suppliers', ['category_id'])


def downgrade():
    op.drop_index('ix_suppliers_category_id', 'suppliers')
    op.drop_constraint('fk_suppliers_category_id', 'suppliers', type_='foreignkey')
    op.drop_column('suppliers', 'category_id')
    op.drop_table('account_keywords')
    op.drop_table('supplier_categories')
    op.drop_table('syscohada_accounts')
```

**Step 2: Trouver la dernière révision**

```bash
ls -la backend/alembic/versions/ | tail -5
```

**Step 3: Mettre à jour down_revision avec la dernière révision trouvée**

**Step 4: Commit**

```bash
git add backend/alembic/versions/20260205_add_syscohada_reference.py
git commit -m "feat(migration): add SYSCOHADA reference tables"
```

---

### Task 1.7: Créer le fichier de seed SYSCOHADA

**Files:**
- Create: `backend/app/db/seeds/syscohada_data.py`

**Step 1: Créer le fichier avec les données**

Le fichier complet est trop long, voir `docs/plans/syscohada_seed_data.md` pour le contenu.

Structure attendue:
```python
SYSCOHADA_ACCOUNTS = [
    # Classe 1 - Ressources durables
    {"number": "10", "label": "Capital", "class": 1, "level": 2, "is_detail": False},
    {"number": "101", "label": "Capital social", "class": 1, "level": 3, "parent": "10", "is_detail": True},
    # ... ~200 comptes
]

SUPPLIER_CATEGORIES = [
    {"code": "ENERGIE", "label": "Énergie", "account": "6061", "keywords": ["électricité", "sbee", "sonelec"]},
    # ... 10 catégories
]

ACCOUNT_KEYWORDS = [
    {"keyword": "électricité", "account": "6061", "priority": 10},
    # ... mots-clés
]
```

**Step 2: Commit**

```bash
git add backend/app/db/seeds/syscohada_data.py
git commit -m "feat(seed): add SYSCOHADA accounts and categories data"
```

---

### Task 1.8: Créer le script de seed

**Files:**
- Create: `backend/app/db/seeds/run_syscohada_seed.py`

**Step 1: Créer le script**

```python
"""
Script pour peupler les tables SYSCOHADA
Usage: python -m app.db.seeds.run_syscohada_seed
"""
import uuid
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.syscohada import SyscohadaAccount, SupplierCategory, AccountKeyword
from app.db.seeds.syscohada_data import SYSCOHADA_ACCOUNTS, SUPPLIER_CATEGORIES, ACCOUNT_KEYWORDS


def seed_syscohada_accounts(db: Session):
    """Seed les comptes SYSCOHADA"""
    existing = db.query(SyscohadaAccount).count()
    if existing > 0:
        print(f"SYSCOHADA accounts already seeded ({existing} records). Skipping.")
        return

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

    db.commit()
    print(f"Seeded {len(SYSCOHADA_ACCOUNTS)} SYSCOHADA accounts.")


def seed_supplier_categories(db: Session):
    """Seed les catégories fournisseurs"""
    existing = db.query(SupplierCategory).count()
    if existing > 0:
        print(f"Supplier categories already seeded ({existing} records). Skipping.")
        return

    for cat in SUPPLIER_CATEGORIES:
        db.add(SupplierCategory(
            id=uuid.uuid4(),
            code=cat["code"],
            label=cat["label"],
            default_charge_account=cat["account"],
            keywords=cat["keywords"],
            tenant_id=None  # Catégories système
        ))

    db.commit()
    print(f"Seeded {len(SUPPLIER_CATEGORIES)} supplier categories.")


def seed_account_keywords(db: Session):
    """Seed les mots-clés"""
    existing = db.query(AccountKeyword).count()
    if existing > 0:
        print(f"Account keywords already seeded ({existing} records). Skipping.")
        return

    for kw in ACCOUNT_KEYWORDS:
        db.add(AccountKeyword(
            id=uuid.uuid4(),
            keyword=kw["keyword"],
            account_number=kw["account"],
            priority=kw.get("priority", 0)
        ))

    db.commit()
    print(f"Seeded {len(ACCOUNT_KEYWORDS)} account keywords.")


def run_seed():
    """Exécuter tous les seeds"""
    db = SessionLocal()
    try:
        print("Starting SYSCOHADA seed...")
        seed_syscohada_accounts(db)
        seed_supplier_categories(db)
        seed_account_keywords(db)
        print("SYSCOHADA seed completed successfully!")
    finally:
        db.close()


if __name__ == "__main__":
    run_seed()
```

**Step 2: Commit**

```bash
git add backend/app/db/seeds/run_syscohada_seed.py
git commit -m "feat(seed): add SYSCOHADA seed runner script"
```

---

## Phase 2: Services Backend

### Task 2.1: Créer SyscohadaService

**Files:**
- Create: `backend/app/services/syscohada_service.py`

**Step 1: Créer le service**

```python
"""
Service pour la gestion du référentiel SYSCOHADA
"""
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.models.syscohada import SyscohadaAccount, SupplierCategory


class SyscohadaService:
    """Service pour accéder au référentiel SYSCOHADA"""

    def __init__(self, db: Session):
        self.db = db

    def get_all_accounts(self, class_filter: Optional[int] = None) -> List[SyscohadaAccount]:
        """Retourne tous les comptes, optionnellement filtrés par classe"""
        query = self.db.query(SyscohadaAccount)
        if class_filter:
            query = query.filter(SyscohadaAccount.account_class == class_filter)
        return query.order_by(SyscohadaAccount.account_number).all()

    def get_detail_accounts(self, class_filter: Optional[int] = None) -> List[SyscohadaAccount]:
        """Retourne uniquement les comptes utilisables (is_detail=True)"""
        query = self.db.query(SyscohadaAccount).filter(SyscohadaAccount.is_detail == True)
        if class_filter:
            query = query.filter(SyscohadaAccount.account_class == class_filter)
        return query.order_by(SyscohadaAccount.account_number).all()

    def search_accounts(self, query: str, limit: int = 20) -> List[SyscohadaAccount]:
        """Recherche par numéro ou libellé"""
        search_term = f"%{query}%"
        return self.db.query(SyscohadaAccount).filter(
            or_(
                SyscohadaAccount.account_number.ilike(search_term),
                SyscohadaAccount.account_label.ilike(search_term)
            )
        ).order_by(SyscohadaAccount.account_number).limit(limit).all()

    def get_account_hierarchy(self) -> Dict[int, Dict[str, Any]]:
        """Retourne l'arborescence complète pour navigation"""
        accounts = self.get_all_accounts()
        hierarchy = {}

        for acc in accounts:
            cls = acc.account_class
            if cls not in hierarchy:
                hierarchy[cls] = {
                    "label": self._get_class_label(cls),
                    "accounts": {}
                }

            # Niveau 2 = compte principal
            if acc.level == 2:
                hierarchy[cls]["accounts"][acc.account_number] = {
                    "label": acc.account_label,
                    "children": []
                }
            # Niveau 3+ = sous-compte
            elif acc.parent_account and acc.parent_account in hierarchy[cls]["accounts"]:
                hierarchy[cls]["accounts"][acc.parent_account]["children"].append({
                    "number": acc.account_number,
                    "label": acc.account_label,
                    "is_detail": acc.is_detail
                })

        return hierarchy

    def _get_class_label(self, class_num: int) -> str:
        """Labels des classes SYSCOHADA"""
        labels = {
            1: "Ressources durables",
            2: "Actif immobilisé",
            3: "Stocks",
            4: "Tiers",
            5: "Trésorerie",
            6: "Charges",
            7: "Produits",
            8: "Autres charges/produits"
        }
        return labels.get(class_num, f"Classe {class_num}")

    def get_categories(self, tenant_id: Optional[str] = None) -> List[SupplierCategory]:
        """Retourne les catégories (système + tenant)"""
        query = self.db.query(SupplierCategory)
        if tenant_id:
            query = query.filter(
                or_(
                    SupplierCategory.tenant_id == None,
                    SupplierCategory.tenant_id == tenant_id
                )
            )
        else:
            query = query.filter(SupplierCategory.tenant_id == None)
        return query.order_by(SupplierCategory.label).all()
```

**Step 2: Commit**

```bash
git add backend/app/services/syscohada_service.py
git commit -m "feat(services): add SyscohadaService"
```

---

### Task 2.2: Créer AccountSuggestionService

**Files:**
- Create: `backend/app/services/account_suggestion_service.py`

**Step 1: Créer le service**

```python
"""
Service pour l'auto-suggestion de comptes basée sur le nom fournisseur
"""
from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.syscohada import SupplierCategory, AccountKeyword
from app.models.supplier import Supplier


class AccountSuggestionService:
    """Service de suggestion de comptes et catégories"""

    def __init__(self, db: Session, tenant_id: str):
        self.db = db
        self.tenant_id = tenant_id

    def suggest_for_supplier(self, supplier_name: str) -> Dict[str, Any]:
        """
        Suggère un compte et une catégorie pour un nom de fournisseur.

        Returns:
            Dict avec 'category', 'charge_account', 'confidence', 'source'
        """
        if not supplier_name:
            return self._default_suggestion()

        name_lower = supplier_name.strip().lower()

        # 1. Chercher fournisseur existant avec catégorie
        existing = self._find_existing_supplier(name_lower)
        if existing and existing.category_id:
            category = self.db.query(SupplierCategory).filter(
                SupplierCategory.id == existing.category_id
            ).first()
            if category:
                return {
                    "category": self._serialize_category(category),
                    "charge_account": category.default_charge_account,
                    "confidence": 1.0,
                    "source": "existing_supplier"
                }

        # 2. Chercher catégorie par mots-clés
        category = self._find_category_by_keywords(name_lower)
        if category:
            return {
                "category": self._serialize_category(category),
                "charge_account": category.default_charge_account,
                "confidence": 0.9,
                "source": "category_keywords"
            }

        # 3. Chercher dans account_keywords
        keyword_match = self._find_account_by_keywords(name_lower)
        if keyword_match:
            return {
                "category": None,
                "charge_account": keyword_match,
                "confidence": 0.7,
                "source": "account_keywords"
            }

        # 4. Fallback
        return self._default_suggestion()

    def suggest_category(self, supplier_name: str) -> Optional[SupplierCategory]:
        """Suggère uniquement une catégorie"""
        if not supplier_name:
            return None
        return self._find_category_by_keywords(supplier_name.strip().lower())

    def _find_existing_supplier(self, name_lower: str) -> Optional[Supplier]:
        """Cherche un fournisseur existant par nom"""
        return self.db.query(Supplier).filter(
            Supplier.tenant_id == self.tenant_id,
            func.lower(Supplier.name) == name_lower
        ).first()

    def _find_category_by_keywords(self, name_lower: str) -> Optional[SupplierCategory]:
        """Cherche une catégorie dont les mots-clés matchent"""
        categories = self.db.query(SupplierCategory).filter(
            (SupplierCategory.tenant_id == None) |
            (SupplierCategory.tenant_id == self.tenant_id)
        ).all()

        for cat in categories:
            for keyword in (cat.keywords or []):
                if keyword.lower() in name_lower or name_lower in keyword.lower():
                    return cat
        return None

    def _find_account_by_keywords(self, name_lower: str) -> Optional[str]:
        """Cherche un compte via la table account_keywords"""
        words = name_lower.split()

        for word in words:
            if len(word) < 3:
                continue
            match = self.db.query(AccountKeyword).filter(
                AccountKeyword.keyword.ilike(f"%{word}%")
            ).order_by(AccountKeyword.priority.desc()).first()
            if match:
                return match.account_number

        return None

    def _default_suggestion(self) -> Dict[str, Any]:
        """Suggestion par défaut"""
        return {
            "category": None,
            "charge_account": "601",
            "confidence": 0.3,
            "source": "default"
        }

    def _serialize_category(self, category: SupplierCategory) -> Dict[str, Any]:
        """Sérialise une catégorie"""
        return {
            "id": str(category.id),
            "code": category.code,
            "label": category.label,
            "default_charge_account": category.default_charge_account
        }
```

**Step 2: Commit**

```bash
git add backend/app/services/account_suggestion_service.py
git commit -m "feat(services): add AccountSuggestionService"
```

---

### Task 2.3: Créer les routes API SYSCOHADA

**Files:**
- Create: `backend/app/api/v1/routes/syscohada.py`

**Step 1: Créer le router**

```python
"""
Routes API pour le référentiel SYSCOHADA
"""
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.session import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.services.syscohada_service import SyscohadaService
from app.services.account_suggestion_service import AccountSuggestionService

router = APIRouter()


# ============================================================================
# SCHEMAS
# ============================================================================

class SyscohadaAccountResponse(BaseModel):
    id: UUID
    account_number: str
    account_label: str
    account_class: int
    parent_account: Optional[str] = None
    level: int
    is_detail: bool
    description: Optional[str] = None

    class Config:
        from_attributes = True


class SupplierCategoryResponse(BaseModel):
    id: UUID
    code: str
    label: str
    default_charge_account: str
    keywords: List[str]

    class Config:
        from_attributes = True


class SuggestionResponse(BaseModel):
    category: Optional[dict] = None
    charge_account: str
    confidence: float
    source: str


# ============================================================================
# ENDPOINTS
# ============================================================================

@router.get("/accounts", response_model=List[SyscohadaAccountResponse])
async def list_accounts(
    account_class: Optional[int] = Query(None, ge=1, le=8),
    detail_only: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Liste les comptes SYSCOHADA avec filtres optionnels"""
    service = SyscohadaService(db)
    if detail_only:
        return service.get_detail_accounts(account_class)
    return service.get_all_accounts(account_class)


@router.get("/accounts/search")
async def search_accounts(
    q: str = Query(..., min_length=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Recherche de comptes par numéro ou libellé"""
    service = SyscohadaService(db)
    accounts = service.search_accounts(q, limit)
    return [
        {
            "account_number": a.account_number,
            "account_label": a.account_label,
            "account_class": a.account_class,
            "is_detail": a.is_detail
        }
        for a in accounts
    ]


@router.get("/accounts/hierarchy")
async def get_hierarchy(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retourne l'arborescence complète pour navigation"""
    service = SyscohadaService(db)
    return service.get_account_hierarchy()


@router.get("/categories", response_model=List[SupplierCategoryResponse])
async def list_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Liste les catégories de fournisseurs"""
    service = SyscohadaService(db)
    return service.get_categories(str(current_user.tenant_id))


@router.get("/suggest", response_model=SuggestionResponse)
async def suggest_account(
    name: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Suggère un compte et une catégorie pour un nom de fournisseur"""
    service = AccountSuggestionService(db, str(current_user.tenant_id))
    return service.suggest_for_supplier(name)
```

**Step 2: Enregistrer le router dans main.py ou api router**

```python
# Dans backend/app/api/v1/api.py ou équivalent
from app.api.v1.routes import syscohada
api_router.include_router(syscohada.router, prefix="/syscohada", tags=["syscohada"])
```

**Step 3: Commit**

```bash
git add backend/app/api/v1/routes/syscohada.py
git commit -m "feat(api): add SYSCOHADA API routes"
```

---

## Phase 3: Composants Frontend

### Task 3.1: Créer le hook useAccounts

**Files:**
- Create: `frontend/src/hooks/useAccounts.ts`

**Step 1: Créer le hook**

```typescript
import { useState, useCallback } from "react";
import { API_BASE_URL } from "@/lib/api";

export interface SyscohadaAccount {
  account_number: string;
  account_label: string;
  account_class: number;
  is_detail: boolean;
}

export interface SupplierCategory {
  id: string;
  code: string;
  label: string;
  default_charge_account: string;
  keywords: string[];
}

export interface AccountSuggestion {
  category: SupplierCategory | null;
  charge_account: string;
  confidence: number;
  source: string;
}

export function useAccounts() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getToken = () => localStorage.getItem("seka_access_token");

  const searchAccounts = useCallback(async (query: string): Promise<SyscohadaAccount[]> => {
    if (!query || query.length < 1) return [];

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/syscohada/accounts/search?q=${encodeURIComponent(query)}`,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );

      if (!response.ok) throw new Error("Search failed");
      return await response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getHierarchy = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/syscohada/accounts/hierarchy`,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      if (!response.ok) throw new Error("Failed to load hierarchy");
      return await response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
      return {};
    } finally {
      setLoading(false);
    }
  }, []);

  const getCategories = useCallback(async (): Promise<SupplierCategory[]> => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/syscohada/categories`,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      if (!response.ok) throw new Error("Failed to load categories");
      return await response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
      return [];
    }
  }, []);

  const suggestAccount = useCallback(async (name: string): Promise<AccountSuggestion | null> => {
    if (!name) return null;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/syscohada/suggest?name=${encodeURIComponent(name)}`,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      if (!response.ok) throw new Error("Suggestion failed");
      return await response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
      return null;
    }
  }, []);

  return {
    loading,
    error,
    searchAccounts,
    getHierarchy,
    getCategories,
    suggestAccount
  };
}
```

**Step 2: Commit**

```bash
git add frontend/src/hooks/useAccounts.ts
git commit -m "feat(hooks): add useAccounts hook for SYSCOHADA API"
```

---

### Task 3.2: Créer AccountSelector

**Files:**
- Create: `frontend/src/components/accounting/AccountSelector.tsx`

**Step 1: Créer le composant**

```typescript
import { useState, useEffect, useRef } from "react";
import { Search, ChevronDown, FolderTree } from "lucide-react";
import { useAccounts, SyscohadaAccount } from "@/hooks/useAccounts";
import AccountBrowserModal from "./AccountBrowserModal";

interface AccountSelectorProps {
  value: string | null;
  onChange: (account: string) => void;
  filterClass?: number[];
  placeholder?: string;
  showBrowseButton?: boolean;
  disabled?: boolean;
}

export default function AccountSelector({
  value,
  onChange,
  filterClass,
  placeholder = "Rechercher un compte...",
  showBrowseButton = true,
  disabled = false
}: AccountSelectorProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SyscohadaAccount[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [showBrowser, setShowBrowser] = useState(false);
  const { searchAccounts, loading } = useAccounts();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Recherche avec debounce
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.length >= 1) {
      debounceRef.current = setTimeout(async () => {
        const accounts = await searchAccounts(query);
        const filtered = filterClass
          ? accounts.filter(a => filterClass.includes(a.account_class))
          : accounts;
        setResults(filtered);
        setIsOpen(true);
      }, 300);
    } else {
      setResults([]);
      setIsOpen(false);
    }

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, searchAccounts, filterClass]);

  // Fermer dropdown si clic extérieur
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (account: SyscohadaAccount) => {
    onChange(account.account_number);
    setQuery("");
    setIsOpen(false);
  };

  const handleBrowserSelect = (accountNumber: string) => {
    onChange(accountNumber);
    setShowBrowser(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={query || value || ""}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query && setIsOpen(true)}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent font-mono disabled:bg-gray-100"
          />
          {value && !query && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
              ✓
            </span>
          )}
          <ChevronDown className="absolute right-8 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>

        {showBrowseButton && (
          <button
            type="button"
            onClick={() => setShowBrowser(true)}
            disabled={disabled}
            className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            title="Parcourir le plan comptable"
          >
            <FolderTree className="h-4 w-4 text-gray-600" />
          </button>
        )}
      </div>

      {/* Dropdown résultats */}
      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {results.map((account) => (
            <button
              key={account.account_number}
              type="button"
              onClick={() => handleSelect(account)}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100 last:border-0"
            >
              <span className="font-mono text-sm font-semibold text-[#1e3a5f]">
                {account.account_number}
              </span>
              <span className="text-sm text-gray-700 truncate">
                {account.account_label}
              </span>
              <span className="ml-auto text-xs text-gray-400">
                Cl.{account.account_class}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Modal navigation */}
      {showBrowser && (
        <AccountBrowserModal
          isOpen={showBrowser}
          onClose={() => setShowBrowser(false)}
          onSelect={handleBrowserSelect}
          filterClass={filterClass}
        />
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add frontend/src/components/accounting/AccountSelector.tsx
git commit -m "feat(components): add AccountSelector with search"
```

---

### Task 3.3: Créer AccountBrowserModal

**Files:**
- Create: `frontend/src/components/accounting/AccountBrowserModal.tsx`

**Step 1: Créer le composant**

```typescript
import { useState, useEffect } from "react";
import { X, ChevronRight, Check } from "lucide-react";
import { useAccounts } from "@/hooks/useAccounts";

interface AccountBrowserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (accountNumber: string) => void;
  filterClass?: number[];
}

interface HierarchyAccount {
  label: string;
  children: Array<{
    number: string;
    label: string;
    is_detail: boolean;
  }>;
}

interface HierarchyClass {
  label: string;
  accounts: Record<string, HierarchyAccount>;
}

export default function AccountBrowserModal({
  isOpen,
  onClose,
  onSelect,
  filterClass
}: AccountBrowserModalProps) {
  const [hierarchy, setHierarchy] = useState<Record<number, HierarchyClass>>({});
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const { getHierarchy, loading } = useAccounts();

  useEffect(() => {
    if (isOpen) {
      getHierarchy().then(setHierarchy);
    }
  }, [isOpen, getHierarchy]);

  const handleSelectAccount = (number: string, isDetail: boolean) => {
    if (isDetail) {
      onSelect(number);
    }
  };

  if (!isOpen) return null;

  const classes = Object.entries(hierarchy)
    .filter(([cls]) => !filterClass || filterClass.includes(Number(cls)))
    .sort(([a], [b]) => Number(a) - Number(b));

  const accounts = selectedClass !== null && hierarchy[selectedClass]
    ? Object.entries(hierarchy[selectedClass].accounts)
    : [];

  const subAccounts = selectedAccount && selectedClass !== null
    ? hierarchy[selectedClass]?.accounts[selectedAccount]?.children || []
    : [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[70vh] flex flex-col">
        {/* Header */}
        <div className="bg-[#1e3a5f] p-4 text-white rounded-t-2xl flex justify-between items-center">
          <h2 className="text-lg font-bold">Plan Comptable SYSCOHADA</h2>
          <button onClick={onClose} className="text-white/70 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 3-column browser */}
        <div className="flex-1 flex overflow-hidden">
          {/* Column 1: Classes */}
          <div className="w-1/3 border-r overflow-y-auto">
            <div className="p-2 bg-gray-50 border-b text-xs font-semibold text-gray-500 uppercase">
              Classes
            </div>
            {loading ? (
              <div className="p-4 text-center text-gray-400">Chargement...</div>
            ) : (
              classes.map(([cls, data]) => (
                <button
                  key={cls}
                  onClick={() => {
                    setSelectedClass(Number(cls));
                    setSelectedAccount(null);
                  }}
                  className={`w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50 border-b ${
                    selectedClass === Number(cls) ? "bg-blue-50 text-[#1e3a5f]" : ""
                  }`}
                >
                  <span>
                    <span className="font-semibold">{cls}.</span> {data.label}
                  </span>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </button>
              ))
            )}
          </div>

          {/* Column 2: Comptes principaux */}
          <div className="w-1/3 border-r overflow-y-auto">
            <div className="p-2 bg-gray-50 border-b text-xs font-semibold text-gray-500 uppercase">
              Comptes
            </div>
            {accounts.length === 0 ? (
              <div className="p-4 text-center text-gray-400 text-sm">
                Sélectionnez une classe
              </div>
            ) : (
              accounts.map(([num, data]) => (
                <button
                  key={num}
                  onClick={() => setSelectedAccount(num)}
                  className={`w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50 border-b ${
                    selectedAccount === num ? "bg-blue-50 text-[#1e3a5f]" : ""
                  }`}
                >
                  <span>
                    <span className="font-mono font-semibold">{num}</span>
                    <span className="ml-2 text-sm">{data.label}</span>
                  </span>
                  {data.children.length > 0 && (
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              ))
            )}
          </div>

          {/* Column 3: Sous-comptes */}
          <div className="w-1/3 overflow-y-auto">
            <div className="p-2 bg-gray-50 border-b text-xs font-semibold text-gray-500 uppercase">
              Sous-comptes
            </div>
            {subAccounts.length === 0 ? (
              <div className="p-4 text-center text-gray-400 text-sm">
                Sélectionnez un compte
              </div>
            ) : (
              subAccounts.map((sub) => (
                <button
                  key={sub.number}
                  onClick={() => handleSelectAccount(sub.number, sub.is_detail)}
                  disabled={!sub.is_detail}
                  className={`w-full px-4 py-3 text-left flex items-center justify-between border-b ${
                    sub.is_detail
                      ? "hover:bg-green-50 cursor-pointer"
                      : "opacity-50 cursor-not-allowed"
                  }`}
                >
                  <span>
                    <span className="font-mono font-semibold">{sub.number}</span>
                    <span className="ml-2 text-sm">{sub.label}</span>
                  </span>
                  {sub.is_detail && (
                    <Check className="h-4 w-4 text-green-500" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 rounded-b-2xl flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add frontend/src/components/accounting/AccountBrowserModal.tsx
git commit -m "feat(components): add AccountBrowserModal for hierarchy navigation"
```

---

### Task 3.4: Créer CategorySelector

**Files:**
- Create: `frontend/src/components/accounting/CategorySelector.tsx`

**Step 1: Créer le composant**

```typescript
import { useState, useEffect } from "react";
import { Tag, Sparkles } from "lucide-react";
import { useAccounts, SupplierCategory } from "@/hooks/useAccounts";

interface CategorySelectorProps {
  value: string | null;
  onChange: (category: SupplierCategory | null) => void;
  suggestedCategory?: SupplierCategory | null;
  disabled?: boolean;
}

export default function CategorySelector({
  value,
  onChange,
  suggestedCategory,
  disabled = false
}: CategorySelectorProps) {
  const [categories, setCategories] = useState<SupplierCategory[]>([]);
  const { getCategories } = useAccounts();

  useEffect(() => {
    getCategories().then(setCategories);
  }, [getCategories]);

  const selectedCategory = categories.find(c => c.id === value);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Catégorie fournisseur
      </label>

      {suggestedCategory && !value && (
        <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-lg text-sm">
          <Sparkles className="h-4 w-4 text-amber-500" />
          <span className="text-amber-700">
            Suggestion: <strong>{suggestedCategory.label}</strong>
          </span>
          <button
            type="button"
            onClick={() => onChange(suggestedCategory)}
            className="ml-auto px-2 py-1 bg-amber-500 text-white rounded text-xs hover:bg-amber-600"
          >
            Appliquer
          </button>
        </div>
      )}

      <div className="relative">
        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <select
          value={value || ""}
          onChange={(e) => {
            const cat = categories.find(c => c.id === e.target.value);
            onChange(cat || null);
          }}
          disabled={disabled}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent appearance-none bg-white disabled:bg-gray-100"
        >
          <option value="">-- Aucune catégorie --</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.label} ({cat.default_charge_account})
            </option>
          ))}
        </select>
      </div>

      {selectedCategory && (
        <p className="text-xs text-gray-500">
          Compte de charge par défaut: <strong>{selectedCategory.default_charge_account}</strong>
        </p>
      )}
    </div>
  );
}
```

**Step 2: Créer index.ts pour exports**

```typescript
// frontend/src/components/accounting/index.ts
export { default as AccountSelector } from "./AccountSelector";
export { default as AccountBrowserModal } from "./AccountBrowserModal";
export { default as CategorySelector } from "./CategorySelector";
```

**Step 3: Commit**

```bash
git add frontend/src/components/accounting/
git commit -m "feat(components): add CategorySelector and exports"
```

---

## Phase 4: Intégration

### Task 4.1: Modifier SupplierQuickCreateModal

**Files:**
- Modify: `frontend/src/components/suppliers/SupplierQuickCreateModal.tsx`

**Step 1: Importer les nouveaux composants**

```typescript
// Ajouter en haut
import { AccountSelector, CategorySelector } from "@/components/accounting";
import { useAccounts, SupplierCategory, AccountSuggestion } from "@/hooks/useAccounts";
```

**Step 2: Ajouter l'auto-suggestion**

```typescript
// Dans le composant, ajouter:
const { suggestAccount } = useAccounts();
const [suggestion, setSuggestion] = useState<AccountSuggestion | null>(null);
const [selectedCategory, setSelectedCategory] = useState<SupplierCategory | null>(null);

// Dans useEffect quand le nom change:
useEffect(() => {
  if (formData.name && formData.name.length >= 3) {
    suggestAccount(formData.name).then((sugg) => {
      if (sugg) {
        setSuggestion(sugg);
        if (sugg.charge_account && !formData.charge_account) {
          setFormData(prev => ({ ...prev, charge_account: sugg.charge_account }));
        }
      }
    });
  }
}, [formData.name, suggestAccount]);
```

**Step 3: Remplacer les inputs par les composants**

```typescript
// Remplacer l'input charge_account par:
<AccountSelector
  value={formData.charge_account}
  onChange={(account) => setFormData(prev => ({ ...prev, charge_account: account }))}
  filterClass={[6]}
  placeholder="Rechercher compte de charge..."
  showBrowseButton={true}
/>

// Ajouter CategorySelector:
<CategorySelector
  value={selectedCategory?.id || null}
  onChange={(cat) => {
    setSelectedCategory(cat);
    if (cat) {
      setFormData(prev => ({ ...prev, charge_account: cat.default_charge_account }));
    }
  }}
  suggestedCategory={suggestion?.category}
/>
```

**Step 4: Commit**

```bash
git add frontend/src/components/suppliers/SupplierQuickCreateModal.tsx
git commit -m "feat(suppliers): integrate AccountSelector and CategorySelector"
```

---

### Task 4.2: Enrichir SupplierDetectionService avec suggestion

**Files:**
- Modify: `backend/app/services/supplier_detection.py`

**Step 1: Importer AccountSuggestionService**

```python
from app.services.account_suggestion_service import AccountSuggestionService
```

**Step 2: Enrichir get_supplier_suggestion**

```python
def get_supplier_suggestion(self, supplier_name: str) -> Dict[str, Any]:
    """Retourne suggestion fournisseur avec compte suggéré"""
    supplier, confidence = self.find_supplier_by_name(supplier_name)

    if supplier and confidence > 0.7:
        return {
            "type": "found",
            "supplier": {...},
            "confidence": confidence
        }

    # Enrichir avec suggestion de compte
    account_service = AccountSuggestionService(self.db, self.tenant_id)
    account_suggestion = account_service.suggest_for_supplier(supplier_name)

    return {
        "type": "not_found",
        "message": f"Fournisseur '{supplier_name}' non trouvé",
        "suggested_name": supplier_name,
        "suggested_code": self._generate_supplier_code(supplier_name),
        "suggested_auxiliary_account": f"401{self._generate_supplier_code(supplier_name)}",
        "suggested_ocr_keywords": self._extract_keywords(supplier_name),
        "default_charge_account": account_suggestion["charge_account"],
        "suggested_category": account_suggestion["category"],
        "suggestion_confidence": account_suggestion["confidence"],
        "suggestion_source": account_suggestion["source"],
        "default_vat_account": "4454",
        "default_tax_rate": 18.0
    }
```

**Step 3: Commit**

```bash
git add backend/app/services/supplier_detection.py
git commit -m "feat(detection): enrich supplier suggestion with account suggestion"
```

---

### Task 4.3: Exécuter migration et seed

**Step 1: Exécuter la migration**

```bash
cd backend && alembic upgrade head
```

**Step 2: Exécuter le seed**

```bash
cd backend && python -m app.db.seeds.run_syscohada_seed
```

**Step 3: Vérifier**

```bash
# Vérifier les comptes
psql -c "SELECT COUNT(*) FROM syscohada_accounts;"
# Attendu: ~200

# Vérifier les catégories
psql -c "SELECT * FROM supplier_categories;"
```

---

## Tests à écrire

### Backend
- [ ] `tests/services/test_syscohada_service.py`
- [ ] `tests/services/test_account_suggestion_service.py`
- [ ] `tests/api/test_syscohada_routes.py`

### Frontend
- [ ] `tests/components/AccountSelector.test.tsx`
- [ ] `tests/components/AccountBrowserModal.test.tsx`

### E2E
- [ ] Test création fournisseur avec sélection compte SYSCOHADA
