# Design : Intégration SYSCOHADA complète

**Date** : 2026-02-05
**Statut** : Validé

## Contexte

L'application SEKA Enterprise gère la comptabilité selon les normes OHADA/SYSCOHADA. Le flux actuel permet la détection de fournisseurs et la création de règles d'imputation, mais il manque :
- Un référentiel complet des comptes SYSCOHADA
- Un sélecteur de comptes intelligent pour les utilisateurs
- Une auto-suggestion améliorée basée sur les catégories fournisseurs

## Décisions de design

| Question | Choix | Justification |
|----------|-------|---------------|
| Structure référentiel | Table dédiée `syscohada_accounts` | Séparation référentiel immuable vs comptes entreprise |
| UI sélection compte | Hybride combobox + modal arborescence | 90% recherche rapide, 10% exploration |
| Auto-suggestion | Catégories fournisseur + mapping mots-clés | Simple, maintenable, efficace |
| Périmètre import | Complet (classes 1-8, ~200 comptes) | Coût marginal nul, extensibilité future |

---

## 1. Modèle de données

### 1.1 Table `syscohada_accounts`

Référentiel des comptes SYSCOHADA (universel, non modifiable par tenant).

```python
class SyscohadaAccount(Base):
    __tablename__ = "syscohada_accounts"

    id: UUID                     # PK
    account_number: str          # "6061", "401", "4454" (unique, indexed)
    account_label: str           # "Fournitures non stockables - Eau"
    account_class: int           # 1-8 (indexed)
    parent_account: str | None   # "606" pour "6061"
    level: int                   # 1=classe, 2=compte, 3=sous-compte, 4=divisionnaire
    is_detail: bool              # True si compte utilisable (pas juste groupement)
    description: str | None      # Explication du compte
```

### 1.2 Table `supplier_categories`

Catégories de fournisseurs avec compte de charge par défaut.

```python
class SupplierCategory(Base):
    __tablename__ = "supplier_categories"

    id: UUID                     # PK
    code: str                    # "ENERGIE", "TELECOM", "CARBURANT" (unique)
    label: str                   # "Énergie (électricité, gaz)"
    default_charge_account: str  # "6061"
    keywords: list[str]          # ["électricité", "sbee", "sonelec"]
    tenant_id: UUID | None       # NULL = catégorie système
```

### 1.3 Table `account_keywords`

Mapping mots-clés → comptes pour suggestion intelligente.

```python
class AccountKeyword(Base):
    __tablename__ = "account_keywords"

    id: UUID                     # PK
    keyword: str                 # "téléphone", "internet" (indexed)
    account_number: str          # "6261"
    priority: int                # Pour départager si plusieurs matchs
```

### 1.4 Modification table `suppliers`

```python
# Ajout champ
category_id: UUID | None  # FK vers supplier_categories
```

---

## 2. Services Backend

### 2.1 `SyscohadaService`

```python
class SyscohadaService:
    def get_all_accounts() -> list[SyscohadaAccount]
    def get_accounts_by_class(class_num: int) -> list[SyscohadaAccount]
    def search_accounts(query: str) -> list[SyscohadaAccount]
    def get_account_hierarchy() -> dict
    def get_detail_accounts() -> list[SyscohadaAccount]
```

### 2.2 `AccountSuggestionService`

```python
class AccountSuggestionService:
    def suggest_account(supplier_name: str, context: dict) -> SuggestionResult
        # 1. Fournisseur existant → sa catégorie
        # 2. Sinon → account_keywords
        # 3. Sinon → analyse mots-clés nom
        # 4. Fallback → 601

    def suggest_category(supplier_name: str) -> SupplierCategory | None
```

### 2.3 Endpoints API

| Méthode | Endpoint | Usage |
|---------|----------|-------|
| GET | `/api/v1/syscohada/accounts` | Liste avec filtres (?class=6) |
| GET | `/api/v1/syscohada/accounts/search?q=` | Recherche rapide |
| GET | `/api/v1/syscohada/accounts/hierarchy` | Arborescence pour modal |
| GET | `/api/v1/syscohada/categories` | Liste des catégories |
| POST | `/api/v1/syscohada/categories` | Créer catégorie custom |
| GET | `/api/v1/syscohada/suggest?name=` | Suggestion compte + catégorie |

---

## 3. Composants Frontend

### 3.1 `AccountSelector`

Combobox avec recherche + bouton parcourir.

```typescript
interface AccountSelectorProps {
  value: string | null
  onChange: (account: string) => void
  filterClass?: number[]         // [6] pour charges uniquement
  placeholder?: string
  showBrowseButton?: boolean
}
```

Comportement :
- Recherche instantanée (debounce 300ms)
- Dropdown groupé par classe : "6061 - Électricité"
- Comptes récemment utilisés en premier
- Bouton "Parcourir" ouvre modal

### 3.2 `AccountBrowserModal`

Navigation 3 colonnes style Finder :

```
| Classe       | Compte principal  | Sous-compte         |
|--------------|-------------------|---------------------|
| 6. Charges ▶ | 60. Achats      ▶ | 601 Marchandises    |
|              | 61. Transports  ▶ | 6061 Électricité  ✓ |
```

### 3.3 `CategorySelector`

Sélecteur de catégorie fournisseur avec auto-suggestion.

```typescript
interface CategorySelectorProps {
  value: string | null
  onChange: (category: SupplierCategory) => void
  suggestedCategory?: SupplierCategory  // Pré-suggestion basée sur nom
}
```

---

## 4. Données de seed

### 4.1 Comptes SYSCOHADA (~200 comptes)

Classes 1-8 complètes selon le plan comptable OHADA :
- Classe 1 : Ressources durables
- Classe 2 : Actif immobilisé
- Classe 3 : Stocks
- Classe 4 : Tiers
- Classe 5 : Trésorerie
- Classe 6 : Charges
- Classe 7 : Produits
- Classe 8 : Autres charges/produits

### 4.2 Catégories fournisseurs initiales

| Code | Label | Compte | Mots-clés |
|------|-------|--------|-----------|
| ENERGIE | Énergie | 6061 | électricité, sbee, sonelec, gaz |
| EAU | Eau | 6062 | eau, soneb, onea, sodeci |
| TELECOM | Télécommunications | 6261 | mtn, moov, orange, téléphone |
| CARBURANT | Carburant | 6063 | total, oryx, shell, essence |
| FOURNITURES | Fournitures bureau | 6064 | papeterie, bureau, fournitures |
| TRANSPORT | Transport | 6241 | transport, livraison, coursier |
| ENTRETIEN | Entretien/Réparations | 6241 | entretien, réparation, maintenance |
| HONORAIRES | Honoraires | 6324 | avocat, notaire, expert, consultant |
| ASSURANCE | Assurances | 6251 | assurance, sanlam, nsia |
| LOYER | Loyers | 6221 | loyer, bail, location |

---

## 5. Flux d'intégration

```
1. Upload facture → OCR extrait "SBEE"
       ↓
2. SupplierDetectionService.find_supplier("SBEE")
   → Non trouvé → needs_supplier_creation
       ↓
3. AccountSuggestionService.suggest_category("SBEE")
   → Match "sbee" → Catégorie ENERGIE → Compte 6061
       ↓
4. SupplierQuickCreateModal pré-rempli:
   - Nom: SBEE
   - Catégorie: ENERGIE (suggérée)
   - Compte charge: 6061 (AccountSelector)
   - Compte auxiliaire: 401SBEE (auto)
       ↓
5. Validation → Création fournisseur + règle
       ↓
6. Factures futures SBEE → Auto-imputées
```

---

## 6. Plan d'implémentation

| Phase | Contenu | Fichiers |
|-------|---------|----------|
| **1** | Models + Migration + Seed | `syscohada.py`, `supplier_category.py`, migration, seed |
| **2** | Services backend + API | `syscohada_service.py`, `account_suggestion_service.py`, routes |
| **3** | Composants frontend | `AccountSelector.tsx`, `AccountBrowserModal.tsx`, `CategorySelector.tsx` |
| **4** | Intégration flux existant | `SupplierQuickCreateModal.tsx`, `supplier_detection.py` |

---

## 7. Tests requis

- [ ] Unit tests services (suggestion, recherche)
- [ ] API tests endpoints SYSCOHADA
- [ ] Component tests (AccountSelector, AccountBrowserModal)
- [ ] E2E test flux complet création fournisseur avec sélection compte
