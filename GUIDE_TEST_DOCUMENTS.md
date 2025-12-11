# 📋 GUIDE COMPLET - TEST UPLOAD & EXTRACTION DOCUMENTS SEKA

## 🎯 Objectif
Tester le système complet d'upload de documents, extraction OCR automatique et génération d'écritures comptables dans SEKA.

---

## 🚀 MÉTHODE 1: Test Automatique avec Script Python

### Prérequis
```bash
# Backend démarré
cd backend
python -m app.main

# Dans un autre terminal
pip install requests reportlab  # reportlab optionnel (pour PDF)
```

### Exécution
```bash
cd backend
python test_document_upload.py
```

### Ce que le script teste:
✅ Connexion au backend
✅ Authentification utilisateur
✅ Configuration OCR Mindee
✅ Configuration stockage (R2/local)
✅ Génération d'une facture PDF de test
✅ Upload du document
✅ Extraction OCR automatique
✅ Validation et génération d'écritures comptables
✅ Recherche de documents
✅ Statistiques

### Résultat attendu
```
╔════════════════════════════════════════════════════════════╗
║         SEKA - TEST UPLOAD & EXTRACTION DOCUMENTS          ║
╚════════════════════════════════════════════════════════════╝

============================================================
TEST 1: Connexion au Backend
============================================================

✓ Backend accessible sur http://localhost:8000

============================================================
TEST 2: Authentification
============================================================

ℹ Tentative de connexion avec: admin@seka.com
✓ Connexion réussie!
ℹ User ID: xxx-xxx-xxx
ℹ Tenant ID: xxx-xxx-xxx

...

✓ Document uploadé avec succès!
✓ Données OCR extraites
✓ 3 écritures comptables générées

╔════════════════════════════════════════════════════════════╗
║                  TESTS TERMINÉS ✓                          ║
╚════════════════════════════════════════════════════════════╝
```

---

## 🖥️ MÉTHODE 2: Test Manuel via Interface Web

### Étape 1: Démarrer l'application

**Terminal 1 - Backend:**
```bash
cd backend
python -m app.main
# Backend sur http://localhost:8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# Frontend sur http://localhost:3000
```

### Étape 2: Se connecter
1. Ouvrir http://localhost:3000
2. Se connecter avec:
   - Email: `admin@seka.com`
   - Password: `admin123`
   (ou créer un compte)

### Étape 3: Accéder à la page Documents
1. Dans le menu, cliquer sur **"Documents"** ou **"GED"**
2. Vous verrez l'interface d'upload

### Étape 4: Uploader une facture

**Option A - Avec une vraie facture:**
1. Préparez une facture PDF/JPG/PNG
2. Glissez-déposez dans la zone "Déposer vos fichiers ici"
3. OU cliquez "Choisir un fichier"

**Option B - Créer une facture de test:**
1. Utilisez un éditeur comme Microsoft Word ou Google Docs
2. Créez un document avec:
   ```
   FACTURE

   Numéro: FAC-2024-001
   Date: 11/12/2024

   Fournisseur: Tech Supplies SARL

   Montant HT: 2 500 000 XOF
   TVA (18%): 450 000 XOF
   Montant TTC: 2 950 000 XOF
   ```
3. Exportez en PDF
4. Uploadez dans SEKA

### Étape 5: Vérifier l'extraction OCR
1. Après upload, le document apparaît dans la liste
2. Statut passe de `UPLOADED` → `OCR_PROCESSING` → `OCR_COMPLETED`
3. Les données extraites s'affichent (numéro, date, montant, etc.)

### Étape 6: Valider le document
1. Cliquez sur **"Valider"** ou **"Détails"**
2. Vérifiez les données extraites:
   - Date
   - Fournisseur
   - Montant TTC
   - Montant TVA
3. Modifiez si nécessaire
4. Sélectionnez le compte comptable (ex: 601000 - Achats)
5. Cliquez **"Confirmer"**

### Étape 7: Vérifier les écritures générées
1. Allez dans **"Comptabilité"** → **"Journal"**
2. Vous devriez voir 3 lignes:
   ```
   Débit  601000 (Achats)            2 500 000 XOF
   Débit  445200 (TVA déductible)      450 000 XOF
   Crédit 401100 (Fournisseurs)      2 950 000 XOF
   ```

---

## 🔧 MÉTHODE 3: Test via API avec cURL

### 1. Se connecter
```bash
# Login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin@seka.com&password=admin123"

# Sauvegarder le token
export TOKEN="votre_access_token"
```

### 2. Uploader un document
```bash
curl -X POST http://localhost:8000/api/v1/ged/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/chemin/vers/facture.pdf" \
  -F "title=Facture Test" \
  -F "category=ACCOUNTING" \
  -F "type=INVOICE_PURCHASE"

# Sauvegarder l'ID du document
export DOC_ID="document_id_retourné"
```

### 3. Vérifier le statut OCR
```bash
curl -X GET http://localhost:8000/api/v1/ged/$DOC_ID \
  -H "Authorization: Bearer $TOKEN"
```

### 4. Valider le document
```bash
curl -X POST http://localhost:8000/api/v1/documents/$DOC_ID/validate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2024-12-11",
    "supplier_name": "Tech Supplies SARL",
    "total_amount": 2950000.00,
    "tax_amount": 450000.00,
    "description": "Achat ordinateurs",
    "account_number": "601000",
    "journal_code": "ACH"
  }'
```

### 5. Lister les documents
```bash
curl -X GET http://localhost:8000/api/v1/ged/ \
  -H "Authorization: Bearer $TOKEN"
```

### 6. Rechercher
```bash
curl -X POST http://localhost:8000/api/v1/ged/search \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "search_query": "facture",
    "filters": {
      "category": "ACCOUNTING",
      "type": "INVOICE_PURCHASE"
    }
  }'
```

### 7. Statistiques
```bash
curl -X GET http://localhost:8000/api/v1/ged/stats/overview \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🔍 MÉTHODE 4: Test via Postman

### Collection Postman à importer:

```json
{
  "info": {
    "name": "SEKA Documents API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "1. Login",
      "request": {
        "method": "POST",
        "header": [],
        "body": {
          "mode": "urlencoded",
          "urlencoded": [
            {"key": "username", "value": "admin@seka.com"},
            {"key": "password", "value": "admin123"}
          ]
        },
        "url": {
          "raw": "{{base_url}}/api/v1/auth/login",
          "host": ["{{base_url}}"],
          "path": ["api", "v1", "auth", "login"]
        }
      }
    },
    {
      "name": "2. Upload Document",
      "request": {
        "method": "POST",
        "header": [
          {"key": "Authorization", "value": "Bearer {{token}}"}
        ],
        "body": {
          "mode": "formdata",
          "formdata": [
            {"key": "file", "type": "file", "src": "/path/to/invoice.pdf"},
            {"key": "title", "value": "Facture Test"},
            {"key": "category", "value": "ACCOUNTING"},
            {"key": "type", "value": "INVOICE_PURCHASE"}
          ]
        },
        "url": {
          "raw": "{{base_url}}/api/v1/ged/upload",
          "host": ["{{base_url}}"],
          "path": ["api", "v1", "ged", "upload"]
        }
      }
    },
    {
      "name": "3. Get Documents",
      "request": {
        "method": "GET",
        "header": [
          {"key": "Authorization", "value": "Bearer {{token}}"}
        ],
        "url": {
          "raw": "{{base_url}}/api/v1/ged/",
          "host": ["{{base_url}}"],
          "path": ["api", "v1", "ged", ""]
        }
      }
    },
    {
      "name": "4. Validate Document",
      "request": {
        "method": "POST",
        "header": [
          {"key": "Authorization", "value": "Bearer {{token}}"},
          {"key": "Content-Type", "value": "application/json"}
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"date\": \"2024-12-11\",\n  \"supplier_name\": \"Tech Supplies SARL\",\n  \"total_amount\": 2950000.00,\n  \"tax_amount\": 450000.00,\n  \"description\": \"Achat ordinateurs\",\n  \"account_number\": \"601000\",\n  \"journal_code\": \"ACH\"\n}"
        },
        "url": {
          "raw": "{{base_url}}/api/v1/documents/{{document_id}}/validate",
          "host": ["{{base_url}}"],
          "path": ["api", "v1", "documents", "{{document_id}}", "validate"]
        }
      }
    }
  ],
  "variable": [
    {"key": "base_url", "value": "http://localhost:8000"},
    {"key": "token", "value": ""},
    {"key": "document_id", "value": ""}
  ]
}
```

**Utilisation:**
1. Ouvrir Postman
2. Import → Coller le JSON ci-dessus
3. Exécuter "1. Login" → Copier le token
4. Définir la variable `token` dans Postman
5. Exécuter les autres requêtes

---

## 🐛 DÉBOGAGE

### Problème: Backend ne démarre pas
```bash
# Vérifier les logs
cd backend
python -m app.main

# Erreur database?
alembic upgrade head

# Erreur dépendances?
pip install -r requirements.txt
```

### Problème: Erreur 401 (Non autorisé)
```bash
# Créer un utilisateur admin
cd backend
python scripts/create_admin.py

# Ou via psql
psql $DATABASE_URL
INSERT INTO users (email, hashed_password, is_active, is_superuser)
VALUES ('admin@seka.com', '$2b$12$...', true, true);
```

### Problème: OCR ne fonctionne pas
1. Vérifier `.env`:
   ```
   MINDEE_API_KEY=md_xxx
   ```
2. Le système utilisera le mode mock si la clé est absente
3. Vérifier les logs backend pour erreurs Mindee

### Problème: Upload échoue
1. Vérifier le dossier `backend/uploads/` existe et est accessible
2. Vérifier les permissions du dossier
3. Si R2 configuré, vérifier les credentials

### Problème: Écritures non générées
1. Vérifier que le document est validé (statut = VALIDATED)
2. Vérifier les logs backend
3. Vérifier que le compte comptable existe (601000, 445200, 401100)

---

## ✅ CHECKLIST DE TEST

### Tests Backend
- [ ] Backend démarre sans erreur
- [ ] Health check répond (GET /health)
- [ ] Login fonctionne (POST /api/v1/auth/login)
- [ ] Token est généré

### Tests Upload
- [ ] Upload PDF fonctionne
- [ ] Upload JPG/PNG fonctionne
- [ ] Fichier sauvegardé (local ou R2)
- [ ] Document créé en base de données
- [ ] Métadonnées correctes (filename, size, type)

### Tests OCR
- [ ] OCR déclenché automatiquement
- [ ] Statut passe à OCR_PROCESSING
- [ ] Données extraites (même en mode mock)
- [ ] Statut passe à OCR_COMPLETED
- [ ] ocr_data contient les champs (invoice_number, date, amounts)

### Tests Validation
- [ ] Endpoint /validate accessible
- [ ] Données peuvent être modifiées
- [ ] 3 écritures comptables générées
- [ ] Écritures équilibrées (débit = crédit)
- [ ] Document lié aux écritures (document_id)
- [ ] Statut document passe à VALIDATED

### Tests Interface
- [ ] Page Documents accessible
- [ ] Zone drag & drop visible
- [ ] Upload via drag & drop fonctionne
- [ ] Upload via bouton fonctionne
- [ ] Liste des documents affichée
- [ ] Statuts affichés correctement
- [ ] Boutons Valider/Détails présents
- [ ] Modal de validation fonctionne

### Tests Permissions
- [ ] Création de dossiers
- [ ] Attribution de permissions
- [ ] Partage par lien public
- [ ] Partage avec mot de passe
- [ ] Expiration des liens

### Tests Recherche
- [ ] Recherche par nom
- [ ] Filtre par type
- [ ] Filtre par catégorie
- [ ] Filtre par date
- [ ] Filtre par fournisseur

---

## 📊 RÉSULTATS ATTENDUS

### Upload réussi
```json
{
  "id": "xxx-xxx-xxx",
  "filename": "test_invoice.pdf",
  "status": "OCR_COMPLETED",
  "file_size": 12345,
  "content_type": "application/pdf",
  "ocr_data": {
    "invoice_number": "FAC-2024-001",
    "date": "2024-12-11",
    "total_amount": 2950000.00,
    "tax_amount": 450000.00,
    "supplier_name": "Tech Supplies SARL"
  },
  "created_at": "2024-12-11T10:00:00"
}
```

### Validation réussie
```json
{
  "message": "Document validé et écritures générées",
  "document": {
    "id": "xxx-xxx-xxx",
    "status": "VALIDATED"
  },
  "accounting_entries": [
    {
      "account_number": "601000",
      "debit_amount": 2500000.00,
      "credit_amount": 0,
      "label": "Achat ordinateurs"
    },
    {
      "account_number": "445200",
      "debit_amount": 450000.00,
      "credit_amount": 0,
      "label": "TVA déductible"
    },
    {
      "account_number": "401100",
      "debit_amount": 0,
      "credit_amount": 2950000.00,
      "label": "Fournisseur Tech Supplies SARL"
    }
  ]
}
```

---

## 🎯 SCÉNARIOS DE TEST AVANCÉS

### Scénario 1: Facture avec TVA
1. Upload facture avec montant TTC = 2 950 000 XOF, TVA = 450 000 XOF
2. Vérifier extraction OCR
3. Valider
4. Vérifier 3 écritures (Achat HT, TVA, Fournisseur TTC)

### Scénario 2: Facture sans TVA
1. Upload facture avec montant TTC = 1 000 000 XOF, TVA = 0
2. Vérifier extraction OCR
3. Valider
4. Vérifier 2 écritures (Achat, Fournisseur)

### Scénario 3: Note de frais
1. Upload reçu restaurant (type = RECEIPT, category = HR)
2. Vérifier extraction
3. Associer à un employé
4. Workflow d'approbation

### Scénario 4: Organisation par dossiers
1. Créer dossier "Factures Achats 2024"
2. Créer sous-dossier "Décembre"
3. Uploader 3 factures dans le sous-dossier
4. Vérifier hiérarchie

### Scénario 5: Partage sécurisé
1. Upload document confidentiel
2. Créer lien de partage avec mot de passe
3. Définir expiration dans 7 jours
4. Tester accès avec/sans mot de passe
5. Vérifier audit log

### Scénario 6: Recherche avancée
1. Uploader 10 documents différents types
2. Rechercher par mot-clé "ordinateur"
3. Filtrer par date (décembre 2024)
4. Filtrer par fournisseur
5. Vérifier pertinence résultats

---

## 📞 SUPPORT

### En cas de problème:
1. Vérifier les logs backend
2. Vérifier la configuration `.env`
3. Consulter la documentation API: http://localhost:8000/docs
4. Vérifier les issues GitHub du projet

### Logs utiles:
```bash
# Logs backend
cd backend
python -m app.main  # Logs en temps réel

# Logs base de données
psql $DATABASE_URL -c "SELECT * FROM documents ORDER BY created_at DESC LIMIT 5;"

# Logs stockage
ls -lah backend/uploads/
```

---

## 🎉 FÉLICITATIONS!

Si tous les tests passent, votre système d'upload et d'extraction de documents SEKA est **100% fonctionnel** ! 🚀

Vous pouvez maintenant:
- Uploader des factures réelles
- Laisser l'OCR extraire les données automatiquement
- Valider et générer les écritures comptables
- Organiser vos documents par dossiers
- Partager de manière sécurisée
- Rechercher et analyser vos documents

**Prochaines étapes:**
- Configurer Cloudflare R2 pour le stockage cloud
- Activer Mindee OCR avec une vraie clé API
- Former les utilisateurs sur le workflow
- Personnaliser les catégories et types de documents
- Configurer les workflows d'approbation
