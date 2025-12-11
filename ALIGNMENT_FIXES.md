# Corrections d'alignement SEKA - Pennylane

## Problèmes identifiés et corrigés

### 1. Incohérences dans la sidebar

#### Avant
- Routes mélangées entre ancien et nouveau système
- Chemins non alignés avec le backend
- Menus trop détaillés pour la phase actuelle

#### Après
**Menu Saisie:**
- Écritures comptables → `/accounting/entries`
- Nouvelle saisie → `/accounting/entries/new`
- Factures fournisseurs → `/achats/factures`
- Factures clients → `/ventes/factures`
- Transactions → `/transactions`
- Rapprochement bancaire → `/accounting/reconciliation`
- Journaux → `/accounting/journals`

**Menu Révision:**
- Balance générale → `/accounting/balance`
- Grand livre → `/accounting/ledger`
- Balance fournisseurs → `/suppliers/balance`
- Balance clients → `/clients/balance`

**Menu Fiscalité:**
- Déclarations TVA → `/tax/vat`
- Liasse fiscale → `/tax/returns`

**Menu États de synthèse:**
- Bilan → `/reports/balance-sheet`
- Compte de résultat → `/reports/income-statement`

**Menu Dossier du client:**
- Documents → `/documents`
- Plan comptable → `/accounting/chart-of-accounts`
- Centre de règles → `/settings/rules`
- Paramètres → `/settings`

### 2. Pages créées pour cohérence

#### `/accounting/chart-of-accounts`
- Liste complète du plan comptable
- Recherche par code ou libellé
- Affichage des soldes
- Export possible

#### `/accounting/journals`
- Onglets par type de journal (ACH, VTE, BQ, CA, OD)
- Liste des écritures par journal
- Export par journal

#### `/accounting/balance`
- Balance générale avec débit/crédit
- Totaux automatiques
- Export Excel/PDF

#### `/accounting/ledger`
- Grand livre chronologique
- Toutes les écritures comptables
- Recherche et filtres

### 3. Routes backend alignées

Toutes les routes frontend correspondent maintenant aux endpoints backend:

```
Frontend                          Backend
/accounting/entries          →    /api/v1/accounting-entries/entries/
/accounting/entries/new      →    POST /api/v1/accounting-entries/entries/
/accounting/chart-of-accounts →   /api/v1/accounting/ledger/
/accounting/journals         →    /api/v1/accounting-entries/entries/?journal_type=
/accounting/balance          →    /api/v1/accounting/ledger/
/accounting/ledger           →    /api/v1/accounting/journal/
```

### 4. Simplifications effectuées

- Suppression des menus non implémentés
- Focus sur les fonctionnalités essentielles
- Navigation claire et intuitive
- Cohérence visuelle avec Pennylane

### 5. Structure de navigation

```
COMPTABILITÉ (Mode Expert-Comptable)
├── Saisie
│   ├── Écritures comptables
│   ├── Nouvelle saisie
│   ├── Factures fournisseurs
│   ├── Factures clients
│   ├── Transactions
│   ├── Rapprochement bancaire
│   └── Journaux
├── Révision
│   ├── Balance générale
│   ├── Grand livre
│   ├── Balance fournisseurs
│   └── Balance clients
├── Fiscalité
│   ├── Déclarations TVA
│   └── Liasse fiscale
├── États de synthèse
│   ├── Bilan
│   └── Compte de résultat
└── Dossier du client
    ├── Documents
    ├── Plan comptable
    ├── Centre de règles
    └── Paramètres

GESTION (Mode Dirigeant)
├── Accueil
├── Transactions
├── Compte Pro
├── Achats
├── Ventes
├── Analytique
├── Rapports comptables
└── Documents partagés
```

### 6. Prochaines étapes

1. Implémenter les pages manquantes:
   - Rapprochement bancaire
   - Déclarations TVA
   - Bilan/Compte de résultat

2. Ajouter les fonctionnalités avancées:
   - Export FEC
   - Import d'écritures
   - Clôture d'exercice

3. Améliorer l'UX:
   - Raccourcis clavier
   - Recherche globale
   - Notifications temps réel

## Conformité Pennylane

SEKA respecte maintenant la structure de Pennylane:
- Navigation à deux modes (Comptabilité/Gestion)
- Menus déroulants organisés
- Terminologie comptable française
- Interface épurée et professionnelle
- Workflow de validation des écritures
