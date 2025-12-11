# 🚀 DÉMARRAGE RAPIDE - TESTS DOCUMENTS SEKA

## ✅ CONFIGURATION ACTUELLE

Votre système SEKA est **100% configuré** :

- ✅ **Cloudflare R2** : Stockage cloud configuré
- ✅ **Mindee OCR** : Extraction automatique de factures
- ✅ **Redis** : Cache et sessions
- ✅ **PostgreSQL** : Base de données
- ✅ **Stripe** : Paiements en ligne (mode test)
- ✅ **KKiaPay** : Mobile Money Afrique

---

## 🎯 TESTS EN 3 ÉTAPES

### ÉTAPE 1 : Tester la connexion Cloudflare R2

```bash
cd backend
python test_r2_connection.py
```

**Résultat attendu :**
```
╔════════════════════════════════════════════════════════════╗
║         SEKA - TEST CONNEXION CLOUDFLARE R2                ║
╚════════════════════════════════════════════════════════════╝

============================================================
TEST CONNEXION CLOUDFLARE R2
============================================================

ℹ Configuration détectée:
  Account ID: 997b73da399070faf146678bf66b351e
  Access Key: fbfa5a2d73...168e4
  Secret Key: 4ec170702d...
  Bucket: seka
  Public URL: https://997b73da399070faf146678bf66b351e.r2.cloudflarestorage.com

ℹ Connexion à: https://997b73da399070faf146678bf66b351e.r2.cloudflarestorage.com

ℹ Test 1: Liste des buckets...
✓ Buckets trouvés: seka
✓ Bucket 'seka' existe ✓

ℹ Test 2: Upload d'un fichier test...
✓ Fichier 'test-connection.txt' uploadé ✓

ℹ Test 3: Liste des objets dans le bucket...
✓ 1 objet(s) trouvé(s):
  • test-connection.txt (32 bytes)

ℹ Test 4: Téléchargement du fichier test...
✓ Fichier téléchargé et vérifié ✓

ℹ Test 5: Suppression du fichier test...
✓ Fichier supprimé ✓

============================================================
✓ TOUS LES TESTS R2 RÉUSSIS !
============================================================

ℹ Votre configuration R2 est fonctionnelle.
ℹ Les fichiers uploadés via SEKA seront stockés sur Cloudflare R2.

✓ Cloudflare R2 est prêt à l'emploi !
```

---

### ÉTAPE 2 : Démarrer le backend

```bash
# Dans le terminal backend
cd backend
python -m app.main
```

**Résultat attendu :**
```
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://localhost:8000
```

**Vérifier la santé :**
```bash
# Dans un autre terminal
curl http://localhost:8000/health
# Doit retourner: {"status":"healthy"}
```

---

### ÉTAPE 3 : Tester l'upload et l'extraction complète

```bash
# Dans un nouveau terminal (backend toujours actif)
cd backend
pip install requests reportlab  # Si pas installé
python test_document_upload.py
```

**Résultat attendu :**
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
ℹ Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

============================================================
TEST 3: Configuration OCR Mindee
============================================================
✓ Clé API Mindee configurée dans .env
ℹ Clé: md_hKBJGf7...8HBf

============================================================
TEST 4: Configuration Stockage
============================================================
✓ Cloudflare R2 configuré
ℹ Les fichiers seront stockés sur Cloudflare R2

============================================================
TEST 5: Préparation Fichier de Test
============================================================
✓ Facture PDF générée en mémoire

============================================================
TEST 6: Upload de Document
============================================================
ℹ Upload du fichier: test_invoice.pdf
ℹ Type: INVOICE_PURCHASE
✓ Document uploadé avec succès!
ℹ ID Document: xxx-xxx-xxx
ℹ Statut: OCR_COMPLETED
ℹ Taille: 12345 bytes
✓ Données OCR extraites:
{
  "invoice_number": "FAC-2024-001",
  "date": "2024-12-11",
  "total_amount": 2950000.00,
  "tax_amount": 450000.00,
  "supplier_name": "Tech Supplies SARL",
  "currency": "XOF"
}

============================================================
TEST 7: Liste des Documents
============================================================
✓ Documents récupérés: 1
  • test_invoice.pdf - OCR_COMPLETED - 2024-12-11T10:00:00

============================================================
TEST 8: Validation Document et Génération Écritures
============================================================
ℹ Validation du document: xxx-xxx-xxx
ℹ Montant TTC: 2,950,000 XOF
ℹ TVA: 450,000 XOF
✓ Document validé!
✓ 3 écritures comptables générées:
  • Débit 601000: 2,500,000 XOF - Achat ordinateurs portables Dell x5
  • Débit 445200: 450,000 XOF - TVA déductible
  • Crédit 401100: 2,950,000 XOF - Fournisseur Tech Supplies SARL

============================================================
TEST 9: Recherche de Documents
============================================================
ℹ Recherche: 'facture'
✓ Résultats trouvés: 1
  • test_invoice.pdf - INVOICE_PURCHASE

============================================================
TEST 10: Statistiques Documents
============================================================
✓ Statistiques récupérées:
  • Total documents: 1
  • Taille totale: 12 KB
  • Uploads récents (7j): 1
  • En attente validation: 0

  Par statut:
    - VALIDATED: 1

╔════════════════════════════════════════════════════════════╗
║                  TESTS TERMINÉS ✓                          ║
╚════════════════════════════════════════════════════════════╝
```

---

## 🌐 TEST VIA L'INTERFACE WEB

### Démarrer le frontend

```bash
# Terminal 3 (backend toujours actif)
cd frontend
npm run dev
```

### Tester manuellement

1. **Ouvrir** http://localhost:3000
2. **Se connecter** : admin@seka.com / admin123
3. **Menu** → Documents (ou GED)
4. **Glisser-déposer** une facture PDF
5. **Attendre** l'extraction OCR (quelques secondes)
6. **Vérifier** les données extraites dans la liste
7. **Cliquer** "Valider"
8. **Vérifier** les écritures dans "Comptabilité" → "Journal"

---

## 📊 WORKFLOW COMPLET TESTÉ

```mermaid
1. Upload facture PDF → Cloudflare R2 ✓
2. Déclenchement OCR Mindee → Extraction automatique ✓
3. Affichage données extraites (numéro, date, montants) ✓
4. Validation utilisateur → Modification si besoin ✓
5. Génération 3 écritures comptables automatiques ✓
6. Liaison document ↔ écritures ✓
7. Recherche et statistiques ✓
```

---

## 🎯 ENDPOINTS API TESTÉS

| Endpoint | Méthode | Fonction |
|----------|---------|----------|
| `/api/v1/auth/login` | POST | Authentification |
| `/api/v1/ged/upload` | POST | Upload document |
| `/api/v1/ged/` | GET | Liste documents |
| `/api/v1/ged/{id}` | GET | Détails document |
| `/api/v1/documents/{id}/validate` | POST | Validation + écritures |
| `/api/v1/ged/search` | POST | Recherche avancée |
| `/api/v1/ged/stats/overview` | GET | Statistiques |

---

## 🔍 VÉRIFICATIONS IMPORTANTES

### 1. Vérifier le fichier sur R2
Connectez-vous à votre dashboard Cloudflare :
- https://dash.cloudflare.com/
- R2 → Bucket "seka"
- Vous devriez voir les fichiers uploadés

### 2. Vérifier en base de données
```bash
psql postgresql://postgres:postgres@localhost:5432/seka

-- Voir les documents
SELECT id, filename, status, file_size, created_at
FROM documents
ORDER BY created_at DESC
LIMIT 5;

-- Voir les écritures liées
SELECT ae.*, d.filename
FROM accounting_entries ae
JOIN documents d ON ae.document_id = d.id
ORDER BY ae.created_at DESC
LIMIT 10;
```

### 3. Vérifier les logs backend
Le backend affiche :
```
INFO: Upload file: test_invoice.pdf (12345 bytes)
INFO: R2 upload successful: tenant-id/unique-filename.pdf
INFO: OCR extraction started for document xxx
INFO: OCR extraction completed with confidence: 0.95
INFO: Document validated, generating accounting entries
INFO: Created 3 accounting entries for document xxx
```

---

## 🐛 DÉPANNAGE

### Erreur : "MINDEE_API_KEY not found"
- ✅ Déjà configuré : `md_hKBJGf7kLVlsZZD9j5w5eF652CIm8HBf`
- Le système passera en mode mock si la clé est invalide

### Erreur : "R2 connection failed"
```bash
# Tester R2 séparément
python test_r2_connection.py

# Vérifier les credentials
cat .env | grep R2_
```

### Erreur : "User not found"
```bash
# Créer un admin
cd backend
python -c "
from app.db.session import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash
import uuid

db = SessionLocal()
tenant_id = uuid.uuid4()
user = User(
    id=uuid.uuid4(),
    email='admin@seka.com',
    hashed_password=get_password_hash('admin123'),
    is_active=True,
    is_superuser=True,
    tenant_id=tenant_id
)
db.add(user)
db.commit()
print('✓ Admin créé!')
"
```

### Erreur : "Database connection failed"
```bash
# Vérifier PostgreSQL
psql postgresql://postgres:postgres@localhost:5432/seka -c "SELECT version();"

# Appliquer les migrations
cd backend
alembic upgrade head
```

### Erreur : "Redis connection failed"
```bash
# Démarrer Redis (macOS)
brew services start redis

# Ou Docker
docker run -d -p 6379:6379 redis:alpine

# Tester
redis-cli ping
# Doit retourner: PONG
```

---

## 📈 PROCHAINES ÉTAPES

Une fois tous les tests réussis :

1. **Production** : Déployer sur Railway/Heroku
2. **Personnalisation** : Adapter les types de documents
3. **Formation** : Former les utilisateurs finaux
4. **Monitoring** : Configurer Sentry pour les erreurs
5. **Backup** : Planifier sauvegardes R2 et DB

---

## 🎉 FÉLICITATIONS !

Si tous les tests passent, votre système SEKA est **100% opérationnel** pour :

✅ Uploader des factures (PDF, JPG, PNG)
✅ Extraction OCR automatique (Mindee)
✅ Stockage cloud sécurisé (Cloudflare R2)
✅ Génération écritures comptables automatiques
✅ Recherche et statistiques
✅ Permissions et partage de documents
✅ Multi-tenant avec isolation complète

**Votre solution de comptabilité SaaS est prête pour la production !** 🚀

---

## 📞 SUPPORT

En cas de problème :
1. Consultez les logs backend
2. Vérifiez `.env` (tous les services configurés)
3. Relancez les tests individuellement
4. Consultez la documentation Cloudflare R2 / Mindee

## 📚 DOCUMENTATION

- **Guide complet** : `GUIDE_TEST_DOCUMENTS.md`
- **API Docs** : http://localhost:8000/docs (backend actif)
- **Cloudflare R2** : https://developers.cloudflare.com/r2/
- **Mindee OCR** : https://developers.mindee.com/
