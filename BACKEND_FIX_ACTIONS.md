# 🔧 Actions pour Fixer le Backend (Erreur 500)

## ✅ Ce qui est déjà configuré

- Variables d'environnement Railway (DATABASE_URL, etc.)
- Code backend (start.sh, migrate.py)
- CORS configuré
- Frontend déployé

## ❌ Problème actuel

Le backend retourne **500 Internal Server Error** sur `/api/v1/auth/login`

## 🎯 Actions à faire sur Railway Dashboard

### 1. Vérifier PostgreSQL

Allez sur : https://railway.app/project/6544d82c-c677-4678-b2e9-465dfdd4970d

**Vérifiez qu'il y a un service PostgreSQL déployé**

Si NON :
- Cliquez "+ New"
- Database → PostgreSQL
- Attendez le déploiement (2-3 min)

### 2. Vérifier les Logs du Backend

Dans le service backend :
- Onglet "Deployments"
- Cliquez sur le dernier déploiement
- Regardez les logs

**Cherchez :**
- ❌ Erreurs de connexion PostgreSQL
- ❌ Erreurs de migration
- ✅ "Migrations terminées avec succès"

### 3. Redéployer le Backend

Si les logs montrent des erreurs :
- Cliquez "Deploy" dans le service backend
- Attendez 2-3 minutes
- Vérifiez les nouveaux logs

### 4. Créer un Utilisateur Admin

Une fois les migrations OK, connectez-vous au backend :

**Option A : Via Railway CLI (si lié au backend)**
```bash
cd backend
railway run python create_admin_user.py
```

**Option B : Via Railway Dashboard**
- Service backend → "..." → "Shell"
- Exécutez :
```bash
python create_admin_user.py
```

### 5. Tester

```bash
curl -X POST https://api.sekagestion.com/api/v1/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin@seka.app&password=Admin123!"
```

**Résultat attendu :**
- ✅ 401 Unauthorized (si mauvais mot de passe) = DB fonctionne !
- ✅ 200 OK avec token JWT = Tout fonctionne !
- ❌ 500 Internal Server Error = Problème persiste

## 🐛 Si le problème persiste

### Vérifier les logs Railway

Les logs devraient montrer l'erreur exacte. Cherchez :

1. **"could not connect to server"** → PostgreSQL non accessible
   - Solution : Vérifier que PostgreSQL est déployé
   - Vérifier DATABASE_URL

2. **"relation 'users' does not exist"** → Migrations non exécutées
   - Solution : Vérifier start.sh exécute migrate.py
   - Redéployer le backend

3. **"password authentication failed"** → Mauvaise DATABASE_URL
   - Solution : Vérifier DATABASE_URL = ${{Postgres.DATABASE_URL}}

## 📋 Checklist

- [ ] PostgreSQL déployé sur Railway
- [ ] DATABASE_URL configurée sur backend
- [ ] Backend redéployé
- [ ] Logs backend sans erreur
- [ ] Migrations exécutées (tables créées)
- [ ] Utilisateur admin créé
- [ ] Test de connexion réussi

## 🆘 Besoin d'aide ?

Les scripts suivants sont disponibles :
- `backend/test_db_connection.py` - Test connexion DB
- `backend/create_admin_user.py` - Créer admin
- `backend/check_backend.sh` - Test endpoints
