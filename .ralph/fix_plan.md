# SEKA BUSINESS - Plan de Développement

## PRIORITÉ CRITIQUE : Gestion des Doublons

### Phase 1 : Backend - Détection des Doublons
- [ ] Créer le modèle `DuplicateHistory` pour tracer les décisions d'audit
- [ ] Implémenter le service `duplicate_detection_service.py` avec l'algorithme de détection
- [ ] Ajouter l'endpoint `POST /api/v1/invoices/check-duplicate`
- [ ] Créer les tests unitaires pour la détection (critère 1: même fournisseur + même N° facture)
- [ ] Créer les tests unitaires pour la détection (critère 2: même fournisseur + même montant + même date)
- [ ] Intégrer la détection dans le flux d'upload de factures

### Phase 2 : Backend - API Confrontation
- [ ] Créer l'endpoint `GET /api/v1/duplicates/{invoice_id}` pour récupérer les détails du doublon
- [ ] Créer l'endpoint `POST /api/v1/duplicates/{invoice_id}/resolve` avec les 3 options (reject/keep/replace)
- [ ] Créer l'endpoint `GET /api/v1/duplicates/history` pour l'historique d'audit
- [ ] Ajouter la validation du motif obligatoire si "conserver les deux"
- [ ] Implémenter l'archivage automatique si "remplacer l'existante"
- [ ] Créer les tests pour chaque action de résolution

### Phase 3 : Frontend - Interface de Confrontation
- [ ] Créer le composant `DuplicateConfrontationModal.tsx`
- [ ] Implémenter la vue côte à côte des PDFs (react-pdf ou pdf.js)
- [ ] Créer le tableau comparatif des champs extraits
- [ ] Afficher la raison du blocage clairement
- [ ] Implémenter les 3 boutons d'action avec confirmation
- [ ] Ajouter le champ motif obligatoire pour "conserver les deux"
- [ ] Créer les tests E2E Playwright pour la confrontation

### Phase 4 : Liste des Factures avec Indicateur Doublon
- [ ] Ajouter la colonne statut doublon dans la liste des factures
- [ ] Créer l'icône/badge "DOUBLON" avec style distinctif (rouge)
- [ ] Ajouter le filtre "Afficher uniquement les doublons"
- [ ] Implémenter le bouton "Traiter les doublons (X)"
- [ ] Créer les tests E2E pour la liste avec doublons

### Phase 5 : Historique des Doublons (Audit)
- [ ] Créer la page `DuplicateHistoryPage.tsx`
- [ ] Afficher le tableau avec : date, facture, montant, doublon de, action, utilisateur
- [ ] Implémenter le clic pour voir la confrontation originale
- [ ] Ajouter l'export CSV/Excel de l'historique
- [ ] Créer les tests pour l'historique

---

## PRIORITÉ HAUTE : Logique d'Interconnexion

### Phase 6 : Plan Comptable
- [ ] Vérifier/Créer le modèle `Account` avec type (général/auxiliaire) et collectif (O/N)
- [ ] Implémenter la création automatique de compte auxiliaire à partir du collectif
- [ ] Créer l'endpoint `POST /api/v1/accounts/auxiliary` avec suggestion de numéro
- [ ] Ajouter la hiérarchie parent/enfant dans l'affichage
- [ ] Créer l'interface de gestion du plan comptable
- [ ] Implémenter la recherche/filtre par classe, type, collectif
- [ ] Créer les tests unitaires et E2E

### Phase 7 : Tiers (Fournisseurs/Clients)
- [ ] Vérifier/Créer le lien Tiers → Compte auxiliaire
- [ ] Implémenter la création automatique du compte auxiliaire lors de la création d'un fournisseur
- [ ] Ajouter l'indicateur "Règle active" dans la liste des fournisseurs
- [ ] Créer le bouton "Créer/Modifier la règle" depuis la fiche fournisseur
- [ ] Implémenter la gestion des mots-clés OCR pour la reconnaissance
- [ ] Créer les tests unitaires et E2E

### Phase 8 : Règles d'Imputation
- [ ] Vérifier/Créer le modèle `ImputationRule` avec les champs requis
- [ ] Implémenter le formulaire de création de règle avec aperçu en temps réel
- [ ] Calculer et afficher l'aperçu des écritures pour un montant exemple
- [ ] Vérifier l'équilibre débit/crédit avant enregistrement
- [ ] Afficher les fournisseurs sans règle avec alerte
- [ ] Créer les tests unitaires et E2E

### Phase 9 : Génération Automatique des Écritures
- [ ] Implémenter la recherche de règle par fournisseur lors de l'upload
- [ ] Générer automatiquement les écritures si règle trouvée
- [ ] Afficher le statut "Pré-traitée" vs "À traiter" selon la règle
- [ ] Permettre la modification manuelle des écritures générées
- [ ] Créer l'interface d'imputation manuelle pour les fournisseurs sans règle
- [ ] Proposer la création de fournisseur + règle si récurrent
- [ ] Créer les tests unitaires et E2E

---

## PRIORITÉ MOYENNE : Améliorations

### Phase 10 : Sécurité
- [ ] Audit des endpoints existants (permissions, validation)
- [ ] Implémenter le rate limiting sur les endpoints sensibles
- [ ] Ajouter le logging des actions d'audit (doublons, écritures)
- [ ] Vérifier la sanitization des entrées utilisateur
- [ ] Tester les injections SQL et XSS

### Phase 11 : Tests et Couverture
- [ ] Augmenter la couverture backend à 80%
- [ ] Créer les tests E2E pour tous les flux critiques
- [ ] Documenter les scénarios de test

### Phase 12 : Performance
- [ ] Optimiser les requêtes de détection de doublons (index)
- [ ] Mettre en cache les règles d'imputation fréquentes
- [ ] Optimiser le chargement des PDFs dans la confrontation

---

## Completed
- [x] Project enabled for Ralph
- [x] Configuration PROMPT.md personnalisée
- [x] Configuration AGENT.md avec commandes build/test

---

## Notes Techniques

### Modèles à créer/modifier

```python
# DuplicateHistory - Historique des décisions
class DuplicateHistory(Base):
    id: int
    new_invoice_id: int  # Facture uploadée
    existing_invoice_id: int  # Facture existante
    reason: str  # "same_number" ou "same_amount_date"
    action: str  # "rejected", "kept_both", "replaced"
    justification: str  # Motif si kept_both
    user_id: int
    created_at: datetime
```

### Endpoints à créer

```
POST /api/v1/invoices/check-duplicate
GET  /api/v1/duplicates/{invoice_id}
POST /api/v1/duplicates/{invoice_id}/resolve
GET  /api/v1/duplicates/history
POST /api/v1/accounts/auxiliary
GET  /api/v1/suppliers/without-rules
POST /api/v1/imputation-rules
GET  /api/v1/imputation-rules/preview
```

### Composants Frontend à créer

```
components/
├── duplicates/
│   ├── DuplicateConfrontationModal.tsx
│   ├── DuplicateComparisonTable.tsx
│   ├── DuplicatePdfViewer.tsx
│   └── DuplicateHistoryTable.tsx
├── accounts/
│   ├── AccountTree.tsx
│   └── AuxiliaryAccountForm.tsx
└── rules/
    ├── ImputationRuleForm.tsx
    └── ImputationPreview.tsx
```
