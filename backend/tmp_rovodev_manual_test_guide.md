# 📘 GUIDE DE TEST MANUEL - CLIENTS AVEC INTERCONNEXION

## 🎯 Objectif
Tester les nouvelles fonctionnalités d'interconnexion pour les clients (comptes auxiliaires 411XXX et règles d'imputation).

---

## ⚙️ Prérequis

1. **Backend actif**
   ```bash
   cd backend
   uvicorn app.main:app --reload
   ```

2. **Migration appliquée**
   ```bash
   cd backend
   alembic upgrade head
   ```

3. **Token d'authentification**
   - Login via interface ou API
   - Noter le token pour les requêtes

---

## 🧪 TEST 1: Créer un client avec compte auxiliaire

### Via l'interface (Frontend)

1. Aller sur `/tiers/clients`
2. Cliquer sur **[+ Nouveau client]**
3. Remplir le formulaire:
   - **Code**: `CLI01`
   - **Nom**: `Entreprise ABC`
   - **Contact**: `Marie Dupont`
   - **Email**: `contact@entreprise-abc.com`

4. **Section "Compte auxiliaire":**
   - ✅ Cocher **"Créer automatiquement un compte auxiliaire (411XXX)"**
   - Observer l'aperçu: `Compte généré: 411CLI01`

5. Cliquer **[Enregistrer]**

### ✅ Résultat attendu:
- ✅ Message de succès
- ✅ Client apparaît dans la liste avec:
  - Compte auxiliaire: `411CLI01`
  - Règle active: ✗ Non

### Via API (curl)

```bash
curl -X POST http://localhost:8000/api/v1/clients \
  -H "Authorization: Bearer VOTRE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Entreprise ABC",
    "code": "CLI01",
    "slug": "entreprise-abc",
    "contact_name": "Marie Dupont",
    "email": "contact@entreprise-abc.com",
    "phone": "+229 12 34 56 78",
    "create_auxiliary_account": true,
    "create_rule": false
  }'
```

### ✅ Réponse attendue:
```json
{
  "id": "uuid...",
  "name": "Entreprise ABC",
  "code": "CLI01",
  "auxiliary_account_code": "411CLI01",
  "has_active_rule": false,
  "auxiliary_account_created": true,
  "rule_created": false,
  "message": "Client créé avec succès"
}
```

### ✅ Vérification:
1. Aller sur `/tiers/plan-comptable`
2. Chercher `411CLI01`
3. Doit apparaître:
   ```
   411    Clients                    [Collectif]
     └─ 411CLI01  Client Entreprise ABC  [Auxiliaire]
   ```

---

## 🧪 TEST 2: Créer un client avec règle d'imputation

### Via l'interface (Frontend)

1. Aller sur `/tiers/clients`
2. Cliquer **[+ Nouveau client]**
3. Remplir:
   - **Code**: `CLI02`
   - **Nom**: `Société XYZ`
   - **Contact**: `Jean Martin`
   - **Email**: `contact@societe-xyz.com`

4. **Section "Compte auxiliaire":**
   - ✅ Cocher **"Créer automatiquement..."**

5. **Section "Règle d'imputation":**
   - ✅ Cocher **"Créer une règle d'imputation pour les factures de vente"**
   - **Compte de produit**: Sélectionner `701 - Ventes de marchandises`
   - **Compte TVA**: `4457` (pré-rempli)
   - **Taux TVA**: `18` (pré-rempli)

6. Cliquer **[Enregistrer]**

### ✅ Résultat attendu:
- ✅ Message de succès
- ✅ Client avec:
  - Compte auxiliaire: `411CLI02`
  - Règle active: ✓ Oui (badge vert)

### Via API (curl)

```bash
curl -X POST http://localhost:8000/api/v1/clients \
  -H "Authorization: Bearer VOTRE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Société XYZ",
    "code": "CLI02",
    "slug": "societe-xyz",
    "contact_name": "Jean Martin",
    "email": "contact@societe-xyz.com",
    "phone": "+229 98 76 54 32",
    "create_auxiliary_account": true,
    "create_rule": true,
    "revenue_account": "701",
    "vat_account": "4457",
    "vat_rate": 18.0,
    "journal_code": "VTE",
    "ocr_keywords": "XYZ,Société XYZ SA"
  }'
```

### ✅ Réponse attendue:
```json
{
  "id": "uuid...",
  "name": "Société XYZ",
  "code": "CLI02",
  "auxiliary_account_code": "411CLI02",
  "has_active_rule": true,
  "auxiliary_account_created": true,
  "rule_created": true,
  "message": "Client créé avec succès"
}
```

---

## 🧪 TEST 3: Vérifier le plan comptable

### Via l'interface

1. Aller sur `/tiers/plan-comptable`
2. Utiliser le filtre **"Type"** → Sélectionner **"Comptes auxiliaires"**
3. Doit afficher:
   ```
   411CLI01  └─ Client Entreprise ABC  [Auxiliaire]  411
   411CLI02  └─ Client Société XYZ     [Auxiliaire]  411
   ```

### Vérifier la hiérarchie:
1. Sans filtre, voir:
   ```
   411       Clients                    [Collectif]   Oui
     └─ 411CLI01  Client Entreprise ABC  [Auxiliaire]  411
     └─ 411CLI02  Client Société XYZ     [Auxiliaire]  411
   ```

### Via API

```bash
curl -X GET http://localhost:8000/api/v1/ledger-accounts \
  -H "Authorization: Bearer VOTRE_TOKEN"
```

Chercher dans la réponse:
```json
{
  "account_code": "411CLI01",
  "account_name": "Client Entreprise ABC",
  "is_auxiliary": true,
  "parent_account_code": "411"
}
```

---

## 🧪 TEST 4: Traitement automatique d'une facture de vente

### Créer une facture pour "Société XYZ"

1. Aller sur `/ventes/factures` (ou module de facturation)
2. Créer une nouvelle facture:
   - **Client**: Société XYZ
   - **Montant HT**: 100 000 FCFA
   - **TVA**: 18 000 FCFA
   - **TTC**: 118 000 FCFA

### ✅ Résultat attendu:

Le système doit **automatiquement** générer ces écritures:

```
┌──────┬────────────────────────────────┬───────────┬───────────┐
│ Jrnl │ Compte                         │   Débit   │  Crédit   │
├──────┼────────────────────────────────┼───────────┼───────────┤
│ VTE  │ 411CLI02 - Client Société XYZ  │   118 000 │         0 │
│ VTE  │ 701 - Ventes de marchandises   │         0 │   100 000 │
│ VTE  │ 4457 - TVA collectée           │         0 │    18 000 │
└──────┴────────────────────────────────┴───────────┴───────────┘
```

**Points clés:**
- ✅ Compte **411CLI02** utilisé (pas 411 général)
- ✅ Règle appliquée automatiquement
- ✅ Statut facture: "Pré-traitée" (prête à valider)

---

## 🧪 TEST 5: Export avec codes auxiliaires

### Exporter les écritures

1. Aller sur `/exports`
2. Sélectionner la période contenant la facture
3. Choisir format **Perfecto** ou **Sage**
4. Exporter

### ✅ Vérifier le fichier exporté:

```csv
Date;Journal;Compte;Libelle;Debit;Credit;Ref
17/01/2026;VTE;411CLI02;Client Société XYZ;118000;0;FV-2026-001
17/01/2026;VTE;701;Ventes marchandises;0;100000;FV-2026-001
17/01/2026;VTE;4457;TVA collectée;0;18000;FV-2026-001
```

**Point clé:**
- ✅ Ligne 1 contient **411CLI02** (pas 411)

---

## 📊 CHECKLIST COMPLÈTE

### Backend:
- [ ] Migration appliquée (`alembic upgrade head`)
- [ ] Serveur actif (`uvicorn app.main:app`)
- [ ] Token obtenu

### Création client avec compte auxiliaire:
- [ ] Client créé via interface
- [ ] Compte auxiliaire `411XXX` généré automatiquement
- [ ] Compte visible dans le plan comptable

### Création client avec règle:
- [ ] Client créé avec règle d'imputation
- [ ] Règle active affichée (badge vert ✓)
- [ ] Compte produit configuré (701, 706, etc.)

### Plan comptable:
- [ ] Hiérarchie visuelle correcte (indentation `└─`)
- [ ] Badges de type (Collectif, Auxiliaire)
- [ ] Filtre par type fonctionne

### Traitement factures:
- [ ] Facture de vente créée pour client avec règle
- [ ] Écritures générées automatiquement
- [ ] Compte auxiliaire 411XXX utilisé

### Export:
- [ ] Export contient les codes auxiliaires
- [ ] Format correct (411CLI02, pas 411)

---

## 🐛 Dépannage

### Erreur "Compte 411 introuvable"
**Solution:** Créer le compte collectif 411 dans le plan comptable:
```sql
INSERT INTO chart_of_accounts (tenant_id, account_number, name, is_collective)
VALUES ('tenant-uuid', '411', 'Clients', true);
```

### Règle non appliquée
**Vérifier:**
1. `client.has_active_rule = true`
2. `client.default_rule_id` non null
3. Règle active dans `/regles/fournisseurs`

### Compte auxiliaire non créé
**Vérifier:**
1. Option `create_auxiliary_account` cochée
2. Migration appliquée
3. Logs backend pour erreurs

---

## 📞 Support

En cas de problème:
1. Vérifier les logs backend: `tail -f backend/logs/app.log`
2. Vérifier la console navigateur (F12)
3. Tester avec le script automatique: `./backend/tmp_rovodev_test_client_api.sh`

---

**Temps estimé pour tous les tests:** ~15 minutes

✅ **Tous les tests passent = Implémentation 100% fonctionnelle**
