# SEKA BUSINESS - Plan de Développement

## ÉTAT ACTUEL : Audit Complet Effectué

**Résultat de l'audit Ralph du 30/01/2026** : La majorité des fonctionnalités critiques sont **DÉJÀ IMPLÉMENTÉES**.

---

## PRIORITÉ CRITIQUE : Gestion des Doublons ✅ COMPLET

### Phase 1 : Backend - Détection des Doublons ✅
- [x] Modèle `DocumentDuplicate` créé (`backend/app/models/duplicate.py`)
- [x] Service `DuplicateDetectionService` implémenté (`backend/app/services/duplicate_detection.py`)
- [x] Algorithme de détection avec 2 critères (même N° facture OU même montant+date)
- [x] Intégration dans le flux d'upload

### Phase 2 : Backend - API Confrontation ✅
- [x] Endpoint `GET /api/v1/duplicates/pending` pour doublons en attente
- [x] Endpoint `POST /api/v1/duplicates/{id}/resolve` avec 3 options (reject/keep/replace)
- [x] Endpoint `GET /api/v1/duplicates/history` pour l'historique d'audit
- [x] Validation du motif obligatoire si "kept_both"
- [x] Archivage automatique si "replaced"

### Phase 3 : Frontend - Interface de Confrontation ✅
- [x] Composant `DuplicateConfrontationModal.tsx` créé
- [x] Vue côte à côte des documents (placeholder PDF)
- [x] Tableau comparatif des champs extraits
- [x] Affichage de la raison du blocage
- [x] 3 boutons d'action avec confirmation
- [x] Champ motif obligatoire pour "conserver les deux"

### Phase 4 : Liste des Factures avec Indicateur Doublon ✅
- [x] Badge "🛑 DOUBLON" affiché dans la liste (`en-attente.tsx`)
- [x] Style distinctif rouge pour les doublons
- [x] Statut `A_TRAITER_DOUBLON` dans le modèle Document

### Phase 5 : Page Gestion des Doublons ✅
- [x] Page `/documents/doublons.tsx` avec onglets "En attente" et "Historique"
- [x] Hook `useDuplicateConfrontation.ts` pour la logique
- [x] Composants d'alerte (`DuplicateAlert.tsx`, `DuplicateAlertBanner.tsx`)

---

## PRIORITÉ HAUTE : Logique d'Interconnexion ✅ COMPLET

### Phase 6 : Plan Comptable ✅
- [x] Modèle `ChartOfAccounts` avec `is_auxiliary`, `is_collective` (`accounting_advanced.py`)
- [x] Hiérarchie parent/enfant avec `parent_id` et `level`
- [x] Liens vers tiers (`linked_supplier_id`, `linked_client_id`)
- [x] Page frontend `/tiers/plan-comptable.tsx`

### Phase 7 : Tiers (Fournisseurs/Clients) ✅
- [x] Modèle `Supplier` avec lien compte auxiliaire (`auxiliary_account_id`)
- [x] Champs `default_rule_id`, `has_active_rule` pour les règles
- [x] Mots-clés OCR (`ocr_keywords`)
- [x] Méthode `generate_auxiliary_code()`
- [x] Page frontend `/tiers/fournisseurs.tsx`
- [x] Modèle `Client` avec même logique

### Phase 8 : Règles d'Imputation ✅
- [x] Modèle `AccountingRule` avec conditions JSON et actions JSON
- [x] Modèle `DocumentClassification` pour historique ML
- [x] Auto-apply et confidence_threshold
- [x] Page frontend `/regles/fournisseurs.tsx`
- [x] Pages templates, conditionnelles, alertes

### Phase 9 : Génération Automatique des Écritures ✅
- [x] Champs `matched_rule_id`, `auto_validable` sur Document
- [x] Statut `PRE_TRAITEE` vs `A_TRAITER` selon règle
- [x] Validation batch avec `/batch-validation/validate-all`

---

## PRIORITÉ MOYENNE : Améliorations

### Phase 10 : Sécurité ✅ PARTIELLEMENT
- [x] Audit complet des endpoints doublons (UUID validation, Pydantic Literal)
- [x] Masquage des détails d'erreurs en production
- [x] Request body au lieu de query params (évite log exposure)
- [ ] Rate limiting sur endpoints sensibles (upload, auth)
- [ ] Logging des actions d'audit critiques
- [ ] Tests d'injection SQL et XSS

### Phase 11 : Tests et Couverture ✅ COMPLET
- [x] Tests pytest pour `duplicate_detection.py` (27 tests, 96% coverage)
- [x] Tests E2E Playwright pour flux doublons (`frontend/e2e/doublons.spec.ts`)
- [ ] Augmenter couverture backend globale à 80%

### Phase 12 : Performance ✅ PARTIELLEMENT
- [x] Index `idx_documents_duplicate_invoice` (tenant_id, supplier_name, reference_number)
- [x] Index `idx_documents_duplicate_amount_date` (tenant_id, supplier_name, amount_ttc, document_date)
- [x] Index `idx_duplicates_pending` et `idx_duplicates_history`
- [ ] Cache Redis pour règles d'imputation fréquentes
- [ ] Optimiser requêtes N+1 dans les listes

### Phase 13 : Améliorations UX ✅ COMPLET
- [x] Export CSV de l'historique des doublons (`GET /api/v1/duplicates/history/export`)
- [x] Visualiseur PDF intégré dans modal confrontation (`DocumentPdfViewer`)
- [ ] Notifications temps réel quand doublon détecté (optionnel)

---

## Completed ✅
- [x] Project enabled for Ralph
- [x] Configuration PROMPT.md personnalisée
- [x] Configuration AGENT.md avec commandes build/test
- [x] Gestion complète des doublons (Backend + Frontend)
- [x] Logique d'interconnexion Plan Comptable ↔ Tiers ↔ Règles

---

## Prochaines Actions Recommandées

1. **Tests** : Créer les tests unitaires pour `duplicate_detection.py`
2. **Sécurité** : Audit des endpoints avec focus sur validation des entrées
3. **UX** : Intégrer un vrai visualiseur PDF (react-pdf ou pdf.js)
4. **Performance** : Ajouter les index manquants sur les tables

---

## Notes Techniques

### Fichiers Clés Backend
```
backend/app/
├── models/
│   ├── duplicate.py          # DocumentDuplicate, DuplicateResolution
│   ├── document.py           # Document avec statuts doublons
│   ├── supplier.py           # Supplier avec interconnexion
│   ├── accounting_advanced.py # ChartOfAccounts avec auxiliaires
│   └── accounting_rules.py   # AccountingRule, DocumentClassification
├── services/
│   └── duplicate_detection.py # DuplicateDetectionService
└── api/v1/routes/
    └── duplicates.py         # Endpoints doublons
```

### Fichiers Clés Frontend
```
frontend/src/
├── components/
│   ├── duplicates/
│   │   └── DuplicateConfrontationModal.tsx
│   └── DuplicateAlert.tsx
├── hooks/
│   └── useDuplicateConfrontation.ts
└── pages/
    ├── documents/
    │   ├── doublons.tsx      # Page principale doublons
    │   ├── en-attente.tsx    # Liste avec badge doublon
    │   └── confrontation.tsx # Page dédiée confrontation
    ├── tiers/
    │   ├── fournisseurs.tsx
    │   └── plan-comptable.tsx
    └── regles/
        └── fournisseurs.tsx
```
