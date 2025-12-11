# Implémentation Comptabilité Avancée - SEKA

## Vue d'ensemble

Implémentation complète d'un système comptable inspiré de Pennylane avec écritures comptables, validation, lettrage et rapprochement bancaire.

## Fonctionnalités implémentées

### 1. Écritures comptables

#### Backend
- **Modèles** (`app/models/accounting_entries.py`)
  - `AccountingEntryHeader`: En-tête d'écriture avec statut (brouillon, validé, comptabilisé)
  - `AccountingEntryLine`: Lignes d'écriture avec débit/crédit
  - `BankReconciliation`: Rapprochement bancaire
  - `AccountingRevision`: Historique des révisions

- **Schémas** (`app/schemas/accounting_entries.py`)
  - Validation automatique de l'équilibre débit/crédit
  - Validation des montants positifs
  - Minimum 2 lignes par écriture

- **API Routes** (`app/api/v1/routes/accounting_entries.py`)
  - `POST /accounting-entries/entries/` - Créer une écriture
  - `GET /accounting-entries/entries/` - Liste avec filtres (statut, journal, dates)
  - `GET /accounting-entries/entries/{id}` - Détail d'une écriture
  - `PUT /accounting-entries/entries/{id}` - Modifier (brouillon uniquement)
  - `POST /accounting-entries/entries/{id}/validate` - Valider une écriture
  - `POST /accounting-entries/entries/{id}/post` - Comptabiliser une écriture
  - `DELETE /accounting-entries/entries/{id}` - Supprimer (non comptabilisée)
  - `POST /accounting-entries/lettrage/` - Lettrage de lignes
  - `POST /accounting-entries/reconciliation/` - Rapprochement bancaire
  - `GET /accounting-entries/revisions/{id}` - Historique des révisions

#### Frontend
- **Liste des écritures** (`frontend/src/pages/accounting/entries/index.tsx`)
  - Filtres par statut et type de journal
  - Recherche par numéro, description, référence
  - Actions contextuelles selon le statut
  - Affichage des totaux débit/crédit

- **Création d'écriture** (`frontend/src/pages/accounting/entries/new.tsx`)
  - Sélection du journal (ACH, VTE, BQ, CA, OD)
  - Ajout/suppression de lignes dynamique
  - Validation en temps réel de l'équilibre
  - Sélection des comptes depuis le plan comptable

### 2. Workflow de validation

```
BROUILLON → VALIDÉ → COMPTABILISÉ
   ↓           ↓
SUPPRIMÉ   SUPPRIMÉ
```

- **Brouillon**: Modification et suppression possibles
- **Validé**: Prêt pour comptabilisation, suppression possible
- **Comptabilisé**: Immuable, impact sur les balances des comptes

### 3. Types de journaux

- **ACH**: Achats
- **VTE**: Ventes
- **BQ**: Banque
- **CA**: Caisse
- **OD**: Opérations diverses

### 4. Lettrage

Permet de rapprocher des lignes d'écriture (ex: facture et paiement):
- Vérification de l'équilibre des lignes lettrées
- Attribution d'une référence de lettrage commune
- Marquage des lignes comme rapprochées

### 5. Rapprochement bancaire

- Comparaison solde bancaire vs solde comptable
- Suivi des différences
- Statut de rapprochement
- Notes et commentaires

### 6. Historique et révisions

Traçabilité complète:
- Qui a validé/comptabilisé
- Quand
- Commentaires associés
- Anciennes/nouvelles valeurs

## Structure de la base de données

### Tables créées

```sql
accounting_entries_header
├── id (UUID)
├── tenant_id (UUID)
├── entry_number (String, unique)
├── journal_type (Enum)
├── date (Date)
├── reference (String)
├── description (Text)
├── status (Enum)
├── document_id (UUID, nullable)
├── validated_by (UUID, nullable)
├── validated_at (Date, nullable)
├── posted_by (UUID, nullable)
└── posted_at (Date, nullable)

accounting_entry_lines
├── id (UUID)
├── tenant_id (UUID)
├── entry_id (UUID)
├── account_id (UUID)
├── label (String)
├── debit (Numeric)
├── credit (Numeric)
├── analytic_code (String, nullable)
├── partner_id (UUID, nullable)
├── partner_type (String, nullable)
├── reconciled (Boolean)
└── reconciliation_ref (String, nullable)

bank_reconciliations
├── id (UUID)
├── tenant_id (UUID)
├── bank_account_id (UUID)
├── period_start (Date)
├── period_end (Date)
├── statement_balance (Numeric)
├── book_balance (Numeric)
├── difference (Numeric)
├── status (String)
├── reconciled_by (UUID, nullable)
├── reconciled_at (Date, nullable)
└── notes (Text, nullable)

accounting_revisions
├── id (UUID)
├── tenant_id (UUID)
├── entry_id (UUID)
├── revision_type (String)
├── old_value (Text, nullable)
├── new_value (Text, nullable)
├── comment (Text, nullable)
└── revised_by (UUID)
```

## Migration

Fichier de migration créé: `backend/alembic/versions/add_accounting_entries.py`

Pour appliquer:
```bash
cd backend
alembic upgrade head
```

## Utilisation

### Créer une écriture

```python
# Exemple d'écriture d'achat
{
  "journal_type": "ACH",
  "date": "2024-01-15",
  "reference": "FACT-2024-001",
  "description": "Achat fournitures bureau",
  "lines": [
    {
      "account_id": "uuid-compte-605000",
      "label": "Fournitures de bureau",
      "debit": 100000,
      "credit": 0
    },
    {
      "account_id": "uuid-compte-445660",
      "label": "TVA déductible 18%",
      "debit": 18000,
      "credit": 0
    },
    {
      "account_id": "uuid-compte-401000",
      "label": "Fournisseur XYZ",
      "debit": 0,
      "credit": 118000
    }
  ]
}
```

### Valider une écriture

```bash
POST /api/v1/accounting-entries/entries/{id}/validate
{
  "entry_id": "uuid",
  "comment": "Validation après vérification"
}
```

### Lettrer des lignes

```bash
POST /api/v1/accounting-entries/lettrage/
{
  "line_ids": ["uuid1", "uuid2"],
  "reconciliation_ref": "LETTR-2024-001"
}
```

## Améliorations futures

1. Export FEC (Fichier des Écritures Comptables)
2. Import d'écritures depuis Excel/CSV
3. Modèles d'écritures récurrentes
4. Analytique multi-axes
5. Clôture d'exercice
6. Génération automatique d'écritures (factures, paies)
7. Rapports comptables avancés
8. Intégration avec expert-comptable

## Conformité SYSCOHADA

Le système respecte les normes SYSCOHADA:
- Plan comptable conforme
- Journaux obligatoires
- Principe de la partie double
- Traçabilité complète
- Numérotation séquentielle

## Sécurité

- Multi-tenant strict (tenant_id sur toutes les tables)
- Validation des permissions utilisateur
- Immuabilité des écritures comptabilisées
- Audit trail complet
- Validation des données en entrée
