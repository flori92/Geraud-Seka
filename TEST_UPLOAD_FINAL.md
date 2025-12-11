# 🧪 TEST FINAL - Upload Documents SEKA

## ✅ **CORRECTIONS APPLIQUÉES**

### Commit 1: `4fc6e62` - Fix endpoint POST /api/v1/documents/
- ✅ `client_id` rendu optionnel
- ✅ Champs modèle corrigés (`uploaded_by`, `document_date`)
- ✅ Ajout champs manquants (`original_filename`, `file_extension`)
- ✅ Stockage OCR complet

### Commit 2: `34da814` - Fix schéma Pydantic
- ✅ `client_id` optionnel dans schéma
- ✅ Alias `date` ↔ `document_date`
- ✅ Tous les champs du modèle ajoutés au schéma
- ✅ `created_at`/`updated_at`: date → datetime

---

## 🚀 **REDÉMARRER LE BACKEND**

**IMPORTANT : Redémarrez le backend pour appliquer les corrections !**

```bash
# Arrêter le backend actuel (Ctrl+C dans le terminal backend)

# Redémarrer
cd backend
python -m app.main
```

**Vérifier le démarrage :**
```
INFO:     Started server process
INFO:     Uvicorn running on http://localhost:8000
```

---

## 🧪 **TEST 1 : Vérifier la santé du backend**

```bash
curl http://localhost:8000/health
```

**Résultat attendu :**
```json
{"status":"healthy"}
```

---

## 🧪 **TEST 2 : Tester GET /api/v1/documents/**

### Avec authentification :

```bash
# 1. Se connecter
TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin@seka.com&password=admin123" \
  | jq -r '.access_token')

echo "Token: $TOKEN"

# 2. Lister les documents
curl -X GET http://localhost:8000/api/v1/documents/ \
  -H "Authorization: Bearer $TOKEN" \
  | jq .
```

**Résultat attendu :**
```json
[]  // Liste vide si aucun document, ou tableau de documents
```

**PAS d'erreur 500 !** ✅

---

## 🧪 **TEST 3 : Upload un document**

### Option A - Avec un fichier test :

```bash
# Créer un fichier test
echo "Test upload SEKA - Facture test" > /tmp/test_facture.txt

# Upload
curl -X POST http://localhost:8000/api/v1/documents/ \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/tmp/test_facture.txt" \
  | jq .
```

### Option B - Avec une vraie facture PDF :

```bash
curl -X POST http://localhost:8000/api/v1/documents/ \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/chemin/vers/facture.pdf" \
  | jq .
```

**Résultat attendu :**
```json
{
  "id": "xxx-xxx-xxx",
  "filename": "test_facture.txt",
  "original_filename": "test_facture.txt",
  "file_path": "uploads/tenant-id/xxx.txt",
  "file_extension": ".txt",
  "content_type": "text/plain",
  "file_size": 35,
  "status": "OCR_COMPLETED" ou "UPLOADED",
  "type": "OTHER",
  "category": "OTHER",
  "created_at": "2024-12-11T...",
  "updated_at": "2024-12-11T...",
  "client_id": null,
  "tenant_id": "xxx-xxx-xxx",
  "uploaded_by": "xxx-xxx-xxx",
  "ocr_data": {...} ou null
}
```

**PAS d'erreur 422 !** ✅

---

## 🧪 **TEST 4 : Vérifier le document uploadé**

```bash
curl -X GET http://localhost:8000/api/v1/documents/ \
  -H "Authorization: Bearer $TOKEN" \
  | jq .
```

**Résultat attendu :**
```json
[
  {
    "id": "xxx",
    "filename": "test_facture.txt",
    "status": "OCR_COMPLETED",
    ...
  }
]
```

---

## 🖥️ **TEST 5 : Interface Web**

### Démarrer le frontend :

```bash
# Terminal 2 (backend toujours actif dans terminal 1)
cd frontend
npm run dev
```

### Test manuel :

1. **Ouvrir** : http://localhost:3000
2. **Se connecter** : admin@seka.com / admin123
3. **Menu** → Documents
4. **Glisser-déposer** une facture PDF ou image
5. **Vérifier** :
   - ✅ Pas d'erreur 500
   - ✅ Pas d'erreur 422
   - ✅ Document apparaît dans la liste
   - ✅ Statut OCR visible

---

## 🐛 **DÉPANNAGE**

### Erreur : "User not found" (401)

```bash
cd backend
python -c "
from app.db.session import SessionLocal
from app.models.user import User
from app.models.tenant import Tenant
from app.core.security import get_password_hash
import uuid

db = SessionLocal()

# Créer tenant
tenant = Tenant(id=uuid.uuid4(), name='SEKA Demo', slug='seka-demo')
db.add(tenant)
db.commit()

# Créer admin
user = User(
    id=uuid.uuid4(),
    email='admin@seka.com',
    hashed_password=get_password_hash('admin123'),
    is_active=True,
    is_superuser=True,
    tenant_id=tenant.id
)
db.add(user)
db.commit()
print('✓ Admin créé!')
"
```

### Erreur : "Table documents does not exist"

```bash
cd backend
alembic upgrade head
```

### Erreur : Backend ne démarre pas

```bash
cd backend
pip install -r requirements.txt
python -m app.main
```

### Erreur : CORS bloque toujours

Si vous testez depuis https://www.sekagestion.com :
- Le backend DOIT être accessible sur https://api.sekagestion.com
- En local, utilisez http://localhost:3000

---

## 📊 **WORKFLOW COMPLET**

```
1. Frontend : Upload fichier
   ↓
2. Backend : POST /api/v1/documents/
   - Pas de client_id requis ✓
   - Upload vers R2/local ✓
   - Création Document en DB ✓
   ↓
3. Backend : OCR Mindee
   - Extraction données ✓
   - Mise à jour document ✓
   - Status → OCR_COMPLETED ✓
   ↓
4. Backend : GET /api/v1/documents/
   - Sérialisation Pydantic ✓
   - Pas d'erreur 500 ✓
   ↓
5. Frontend : Affichage document
   - Liste documents ✓
   - Données OCR visibles ✓
   - Bouton Valider ✓
```

---

## ✅ **CHECKLIST FINALE**

Avant de tester :

- [ ] Backend redémarré après corrections
- [ ] Health check OK (GET /health)
- [ ] Utilisateur admin créé
- [ ] Base de données migrée (alembic upgrade head)
- [ ] Cloudflare R2 configuré OU dossier `uploads/` créé
- [ ] Redis démarré (si utilisé)
- [ ] Frontend démarré (npm run dev)

Tests :

- [ ] GET /api/v1/documents/ → 200 (pas 500)
- [ ] POST /api/v1/documents/ (sans client_id) → 200 (pas 422)
- [ ] Upload fichier via interface web → Success
- [ ] Document visible dans liste
- [ ] Données OCR extraites (si PDF facture)
- [ ] Bouton Valider présent

---

## 🎯 **RÉSULTAT ATTENDU**

Après redémarrage du backend, tous ces tests doivent **passer** :

✅ GET /api/v1/documents/ → 200 OK
✅ POST /api/v1/documents/ → 200 OK
✅ Upload interface web → Success
✅ Liste documents → Affichage correct
✅ OCR → Données extraites

---

## 🚀 **COMMANDES RAPIDES**

### Test complet automatique :

```bash
# Terminal 1 - Backend
cd backend
python -m app.main

# Terminal 2 - Test (attendre 5 sec)
cd backend
python test_document_upload.py
```

### Test interface web :

```bash
# Terminal 1 - Backend
cd backend
python -m app.main

# Terminal 2 - Frontend
cd frontend
npm run dev

# Navigateur
open http://localhost:3000
# Login → Documents → Upload
```

---

## 📞 **SUPPORT**

Si les erreurs persistent après redémarrage :

1. Vérifier les logs backend (dans le terminal où tourne `python -m app.main`)
2. Vérifier les migrations : `alembic current`
3. Vérifier la base de données : `psql $DATABASE_URL -c "SELECT COUNT(*) FROM documents;"`
4. Consulter : `CORRECTIONS_UPLOAD_DOCUMENTS.md`

---

## 🎉 **SUCCÈS !**

Si tous les tests passent :

**Votre système d'upload de documents SEKA est 100% opérationnel !** 🚀

Prochaines étapes :
- Déployer sur production (Railway/Heroku)
- Tester avec vraies factures
- Former les utilisateurs
- Configurer monitoring (Sentry)
