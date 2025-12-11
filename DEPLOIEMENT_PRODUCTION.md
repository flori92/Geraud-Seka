# 🚀 DÉPLOIEMENT PRODUCTION - Backend SEKA sur Railway

## 🎯 **PROBLÈME IDENTIFIÉ**

Votre backend de production sur `https://api.sekagestion.com` :
- ✅ Est déployé et accessible (répond sur /health)
- ✅ CORS configuré correctement
- ❌ **N'a PAS les dernières corrections** (commits `4fc6e62`, `34da814`)

**Solution** : Redéployer le backend sur Railway avec les derniers commits.

---

## 📋 **COMMITS À DÉPLOYER**

| Commit | Description | Critique |
|--------|-------------|----------|
| `4fc6e62` | fix: client_id optionnel + champs corrigés | 🔴 REQUIS |
| `34da814` | fix: Schéma Pydantic corrigé | 🔴 REQUIS |
| `e9b087e` | docs: Guide tests | ℹ️ Documentation |

Sans ces commits, l'upload génère :
- ❌ Erreur 422 (client_id manquant)
- ❌ Erreur 500 (schéma incompatible)

---

## 🚀 **MÉTHODE 1 : Redéploiement via Railway CLI** (Recommandé)

### Étape 1 : Vérifier le projet Railway

```bash
railway status
```

**Résultat attendu :**
```
Project: seka-backend (ou similaire)
Environment: production
Service: backend
Status: Active
```

### Étape 2 : Lier le projet (si nécessaire)

```bash
# Si pas encore lié
railway link

# Sélectionner votre projet SEKA
```

### Étape 3 : Déployer

```bash
# Déployer depuis la branche master actuelle
railway up

# OU spécifier le service backend
railway up --service backend
```

**Durée** : ~2-5 minutes

### Étape 4 : Vérifier le déploiement

```bash
# Voir les logs
railway logs

# Vérifier le statut
railway status
```

### Étape 5 : Tester

```bash
# Health check
curl https://api.sekagestion.com/health

# Test endpoint corrigé
curl https://api.sekagestion.com/api/v1/documents/ \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🔄 **MÉTHODE 2 : Déploiement automatique via GitHub**

Si Railway est configuré pour déployer automatiquement depuis GitHub :

### Vérifier la configuration :

1. Aller sur **Railway Dashboard** : https://railway.app/
2. Sélectionner votre projet **SEKA**
3. Onglet **Settings**
4. Vérifier **Deployment Trigger** :
   - ✅ Déploiement auto depuis `master` branch
   - ✅ GitHub repository connecté

### Si déploiement auto activé :

Les commits sont **déjà pushés** sur GitHub (`git push` effectué), donc Railway devrait :
- ✅ Détecter les nouveaux commits
- ✅ Déclencher un build automatiquement
- ✅ Déployer la nouvelle version

**Vérifier** :
- Dashboard Railway → **Deployments**
- Dernier déploiement doit être récent (< 10 min)
- Commit hash doit correspondre : `e9b087e`

### Si pas de déploiement auto :

**Activer le déploiement automatique :**

1. Railway Dashboard → Votre projet
2. Settings → **GitHub**
3. Cocher **"Deploy on push to branch: master"**
4. Sauvegarder

**Puis déclencher manuellement :**

```bash
# Via Railway CLI
railway up

# OU via Dashboard
# Cliquer "Deploy" → Sélectionner dernier commit
```

---

## 🛠️ **MÉTHODE 3 : Déploiement manuel via Railway Dashboard**

### Étape 1 : Connexion

1. Aller sur https://railway.app/
2. Se connecter
3. Sélectionner projet **SEKA**

### Étape 2 : Redéployer

1. Service **Backend** (ou API)
2. Onglet **Deployments**
3. Cliquer **"New Deployment"**
4. Sélectionner :
   - Source: GitHub
   - Branch: `master`
   - Commit: `e9b087e` (dernier commit)
5. Cliquer **"Deploy"**

### Étape 3 : Surveiller

1. Voir les logs en temps réel
2. Attendre "Deployment successful" (2-5 min)
3. Vérifier le service est "Running"

---

## ✅ **VÉRIFICATION POST-DÉPLOIEMENT**

### Test 1 : Health Check

```bash
curl https://api.sekagestion.com/health
```

**Attendu :**
```json
{"status":"healthy"}
```

### Test 2 : Version des corrections

```bash
# Se connecter
TOKEN=$(curl -s -X POST https://api.sekagestion.com/api/v1/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin@sekagestion.com&password=VotreMotDePasse" \
  | jq -r '.access_token')

# GET documents (ne doit plus faire 500)
curl https://api.sekagestion.com/api/v1/documents/ \
  -H "Authorization: Bearer $TOKEN"
```

**Attendu :** `[]` ou liste de documents (PAS d'erreur 500)

### Test 3 : Upload sans client_id

```bash
echo "Test production" > /tmp/test.txt

curl -X POST https://api.sekagestion.com/api/v1/documents/ \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/tmp/test.txt"
```

**Attendu :** Document JSON (PAS d'erreur 422)

### Test 4 : Interface Web

1. Ouvrir https://www.sekagestion.com/documents
2. Rafraîchir (F5)
3. Uploader un fichier
4. **Résultat attendu :**
   - ✅ Pas d'erreur CORS
   - ✅ Pas d'erreur 422
   - ✅ Pas d'erreur 500
   - ✅ Upload réussi
   - ✅ Document dans la liste

---

## 🔧 **CONFIGURATION RAILWAY (si nécessaire)**

### Variables d'environnement

Vérifier que toutes les variables sont configurées sur Railway :

```bash
# Via CLI
railway variables

# Variables critiques :
DATABASE_URL=postgresql://...
R2_ACCOUNT_ID=997b73da399070faf146678bf66b351e
R2_ACCESS_KEY_ID=fbfa5a2d736fd21906301182eaa168e4
R2_SECRET_ACCESS_KEY=4ec170702df3ee83b20133eb0010ca046b2f1f86c309da35eaa8bca1e5eae63f
R2_BUCKET_NAME=seka
MINDEE_API_KEY=md_hKBJGf7kLVlsZZD9j5w5eF652CIm8HBf
BACKEND_CORS_ORIGINS=["https://sekagestion.com","https://www.sekagestion.com",...]
```

### Ajouter/Modifier une variable :

```bash
# Via CLI
railway variables set KEY=VALUE

# Exemple
railway variables set R2_ACCOUNT_ID=997b73da399070faf146678bf66b351e
```

**OU via Dashboard** :
1. Projet SEKA → Service Backend
2. **Variables**
3. Ajouter/Modifier
4. **Redéployer** après changements

---

## 🐛 **DÉPANNAGE**

### Erreur : "railway not found"

```bash
# Installer Railway CLI
npm i -g @railway/cli

# OU
brew install railway
```

### Erreur : "Not linked to a project"

```bash
railway link
# Sélectionner votre projet SEKA
```

### Erreur : Build failed

Vérifier les logs :
```bash
railway logs --deployment
```

Problèmes courants :
- Dépendances manquantes → vérifier `requirements.txt`
- Migrations DB → exécuter `alembic upgrade head`
- Variables manquantes → vérifier variables d'environnement

### Déploiement bloqué

```bash
# Annuler et relancer
railway down
railway up
```

### Database migration needed

```bash
# Se connecter au service
railway run bash

# Puis
alembic upgrade head
exit

# OU via CLI directement
railway run alembic upgrade head
```

---

## 📊 **WORKFLOW DE DÉPLOIEMENT**

### Développement local → Production

```
1. Développement local
   ├─ Modifications code
   ├─ Tests locaux (localhost:8000)
   └─ Commit Git
       ↓
2. Push GitHub
   ├─ git add .
   ├─ git commit -m "..."
   └─ git push origin master
       ↓
3. Déploiement Railway
   ├─ Auto (si configuré)
   ├─ OU railway up
   └─ OU Dashboard → Deploy
       ↓
4. Vérification Production
   ├─ Health check
   ├─ Tests API
   └─ Tests interface web
       ↓
5. ✅ Production mise à jour !
```

---

## 🚀 **COMMANDES RAPIDES**

### Déploiement complet :

```bash
# 1. Vérifier derniers commits
git log --oneline -3

# 2. Vérifier statut Railway
railway status

# 3. Déployer
railway up

# 4. Voir logs
railway logs -f

# 5. Tester
curl https://api.sekagestion.com/health
```

### Rollback si problème :

```bash
# Via Dashboard
Railway → Deployments → Cliquer sur ancien déploiement → Rollback

# OU redéployer commit précédent
railway up --commit <hash>
```

---

## 📝 **CHECKLIST DÉPLOIEMENT**

Avant de déployer :
- [ ] Tous les commits pushés sur GitHub
- [ ] Tests locaux passent
- [ ] Migrations DB créées si nécessaire
- [ ] Variables d'environnement configurées
- [ ] Railway CLI installé (si déploiement CLI)

Après déploiement :
- [ ] Health check OK
- [ ] Logs sans erreur
- [ ] GET /api/v1/documents/ → 200
- [ ] POST /api/v1/documents/ → 200
- [ ] Interface web fonctionne
- [ ] Upload documents fonctionne

---

## 🎯 **ACTION IMMÉDIATE**

**Pour déployer les corrections maintenant :**

```bash
# Méthode la plus simple
railway up

# Attendre 2-5 minutes
# Puis tester sur https://www.sekagestion.com/documents
```

---

## 📞 **SUPPORT RAILWAY**

- Documentation : https://docs.railway.app/
- Dashboard : https://railway.app/dashboard
- Status : https://railway.statuspage.io/
- Discord : https://discord.gg/railway

---

## ✨ **APRÈS DÉPLOIEMENT RÉUSSI**

Votre système de production devrait avoir :

✅ Backend à jour avec toutes les corrections
✅ Upload documents fonctionnel
✅ client_id optionnel
✅ Schémas Pydantic corrects
✅ Extraction OCR Mindee
✅ Stockage Cloudflare R2
✅ CORS configuré correctement

**L'upload de documents fonctionnera sur https://www.sekagestion.com !** 🎉
