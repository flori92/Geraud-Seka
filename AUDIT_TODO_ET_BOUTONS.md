# Audit TODO et Boutons Non Implémentés

**Date**: 4 décembre 2025  
**Statut**: Analyse complète

---

## 🔴 CRITIQUE - Endpoints Backend Manquants

### 1. Comptabilité (accounting.py)

#### ❌ TODO Critiques
```python
# Ligne 210: GET /accounting/ledger/
# TODO: Replace with actual database query
# IMPACT: Données en mémoire, perdues au redémarrage
```

```python
# Ligne 224: POST /accounting/ledger/
# TODO: Save to database
# IMPACT: Comptes créés non persistés
```

```python
# Ligne 247: GET /accounting/journal/
# TODO: Implement actual journal entries from database
# IMPACT: Retourne toujours []
```

```python
# Ligne 260: POST /accounting/journal/
# TODO: Save to database and update account balances
# IMPACT: Écritures non persistées, balances non mises à jour
```

**PRIORITÉ**: 🔴 HAUTE - Fonctionnalités critiques

**ACTION REQUISE**:
- [ ] Créer modèle SQLAlchemy `LedgerAccount`
- [ ] Créer modèle SQLAlchemy `JournalEntry`
- [ ] Implémenter CRUD complet en base de données
- [ ] Ajouter logique de mise à jour des balances

---

### 2. Documents (documents.py)

#### ⚠️ TODO Mineurs
```python
# Ligne 39: POST /documents/upload
file_size=0, # TODO: Get real size
# IMPACT: Taille fichier non enregistrée
```

```python
# Ligne 95: GET /documents/
# TODO: Filter by user permissions if needed
# IMPACT: Pas de filtrage par permissions
```

**PRIORITÉ**: 🟡 MOYENNE

**ACTION REQUISE**:
- [ ] Calculer et enregistrer taille réelle du fichier
- [ ] Implémenter filtrage par permissions utilisateur

---

### 3. Chat (chat.py)

#### ⚠️ TODO Fonctionnel
```python
# Ligne 47: POST /chat/
# TODO: Replace with actual AI/LLM integration (OpenAI, etc.)
# IMPACT: Réponses basiques, pas d'IA réelle
```

**PRIORITÉ**: 🟢 BASSE - Fonctionnalité bonus

**ACTION REQUISE**:
- [ ] Intégrer OpenAI API ou autre LLM
- [ ] Implémenter contexte conversationnel
- [ ] Ajouter mémoire de conversation

---

## 🔴 CRITIQUE - Frontend TODO

### 1. Activités (activities.tsx)

```typescript
// Ligne 54
client_id: "00000000-0000-0000-0000-000000000000" // TODO: Get from context
// IMPACT: Client ID hardcodé, pas de vraie association
```

**PRIORITÉ**: 🔴 HAUTE

**ACTION REQUISE**:
- [ ] Créer contexte global pour client sélectionné
- [ ] Ajouter sélecteur de client dans le formulaire
- [ ] Passer le vrai client_id

---

## 📋 Vérification Boutons Manquants

### Boutons à Vérifier

Recherche de boutons potentiellement non fonctionnels...

#### Pages Vérifiées ✅
1. ✅ **Comptabilité**
   - Plan comptable: Nouveau compte (CORRIGÉ)
   - Journal: Nouvelle écriture (CORRIGÉ)

2. ✅ **Clients** - Fonctionnel avec toast
3. ✅ **Activités** - Fonctionnel avec toast (client_id TODO)
4. ✅ **Trésorerie** - Fonctionnel avec toast
5. ✅ **Documents** - Validation fonctionnelle
6. ✅ **Exports** - Fonctionnel avec toast
7. ✅ **Pricing** - Fonctionnel avec toast
8. ✅ **HR** (Employés, Contrats, Congés, Bulletins) - Modaux fonctionnels

#### Pages à Vérifier Manuellement
- [ ] **Ventes** (Devis, Factures, Bons de livraison, Commandes)
- [ ] **CRM** (Leads, Opportunités, Activités CRM)
- [ ] **Stock** (Inventaire, Mouvements)
- [ ] **Fournisseurs**
- [ ] **Produits**

---

## 🎯 Plan d'Action Priorisé

### Phase 1 - URGENT (Cette semaine)
1. **Comptabilité - Persistance DB** 🔴
   - Créer modèles SQLAlchemy
   - Implémenter CRUD complet
   - Migrer données mock vers DB
   - **Estimation**: 4-6 heures

2. **Activités - Client ID** 🔴
   - Créer contexte client
   - Ajouter sélecteur
   - **Estimation**: 2 heures

### Phase 2 - Important (Semaine prochaine)
3. **Documents - Taille fichier** 🟡
   - Calculer taille réelle
   - **Estimation**: 30 minutes

4. **Documents - Permissions** 🟡
   - Implémenter filtrage
   - **Estimation**: 2 heures

5. **Vérification boutons ventes/CRM/stock** 🟡
   - Audit complet
   - **Estimation**: 2 heures

### Phase 3 - Bonus (Plus tard)
6. **Chat - IA réelle** 🟢
   - Intégration OpenAI
   - **Estimation**: 8 heures

---

## 📊 Statistiques

| Catégorie | Total | Critique | Important | Bonus |
|-----------|-------|----------|-----------|-------|
| **Backend TODO** | 7 | 4 | 2 | 1 |
| **Frontend TODO** | 1 | 1 | 0 | 0 |
| **Boutons vérifiés** | 8 | 8 ✅ | - | - |
| **Boutons à vérifier** | 5 | ? | - | - |

---

## 🚨 Risques Actuels

1. **Perte de données comptables** 🔴
   - Les comptes et écritures sont en mémoire
   - Redémarrage = perte totale
   - **Solution**: Implémenter DB immédiatement

2. **Associations incorrectes** 🔴
   - Activités avec client_id hardcodé
   - Données incohérentes
   - **Solution**: Contexte client global

3. **Permissions non gérées** 🟡
   - Tous les users voient tous les documents
   - Risque sécurité
   - **Solution**: Filtrage par tenant/user

---

## ✅ Prochaines Étapes

1. Créer les modèles DB pour comptabilité
2. Implémenter la persistance
3. Corriger le client_id dans activités
4. Vérifier les boutons ventes/CRM/stock
5. Documenter les endpoints manquants
