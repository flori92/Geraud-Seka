# 🔧 Fix Erreur 500 - Backend Database

## 🔍 Diagnostic

L'erreur 500 sur `/api/v1/auth/login` est causée par un problème de connexion à la base de données PostgreSQL.

**Symptômes :**
- ✅ `/` et `/health` fonctionnent
- ❌ `/api/v1/auth/login` retourne 500 Internal Server Error

## 🎯 Solution

### Étape 1 : Vérifier PostgreSQL sur Railway

1. Allez sur **Railway Dashboard** : https://railway.app
2. Sélectionnez le projet **Seka**
3. Vérifiez qu'il y a un service **PostgreSQL** déployé
4. Si non, ajoutez-le :
   - Cliquez sur **"+ New"**
   - Sélectionnez **"Database"** → **"PostgreSQL"**
   - Attendez le déploiement

### Étape 2 : Configurer DATABASE_URL sur le Backend

1. Dans Railway, cliquez sur le service **Backend** (seka-backend)
2. Allez dans l'onglet **Variables**
3. Ajoutez ou vérifiez la variable :
   ```
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   ```
   ⚠️ Utilisez la référence `${{Postgres.DATABASE_URL}}` pour lier automatiquement

### Étape 3 : Exécuter les migrations

Le backend doit exécuter les migrations Alembic au démarrage. Vérifiez que `start.sh` contient :

```bash
#!/bin/bash
python migrate.py
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

### Étape 4 : Créer un utilisateur admin

Une fois la base de données configurée, créez un utilisateur de test :

#### Option A : Via Railway CLI

```bash
# Se connecter au service backend
railway run python -c "
from app.db.session import SessionLocal
from app.crud.user import user_crud
from app.schemas.user import UserCreate

db = SessionLocal()
user = user_crud.create(
    db,
    UserCreate(
        email='admin@seka.app',
        password='Admin123!',
        full_name='Admin SEKA',
        role='admin'
    )
)
print(f'User created: {user.email}')
db.close()
"
```

#### Option B : Via script SQL

Connectez-vous à PostgreSQL Railway et exécutez :

```sql
-- Vérifier si la table users existe
SELECT * FROM users LIMIT 1;

-- Si vide, vous devez d'abord exécuter les migrations
```

### Étape 5 : Redéployer le Backend

```bash
cd backend
railway up --detach
```

### Étape 6 : Tester

```bash
# Test avec credentials
curl -X POST https://api.sekagestion.com/api/v1/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin@seka.app&password=Admin123!"
```

Vous devriez recevoir un token JWT au lieu d'une erreur 500.

## 🐛 Dépannage

### Erreur : "could not connect to server"

La variable `DATABASE_URL` n'est pas configurée ou PostgreSQL n'est pas déployé.

**Solution :**
1. Vérifiez que PostgreSQL est déployé sur Railway
2. Vérifiez la variable `DATABASE_URL` dans le backend
3. Redéployez le backend

### Erreur : "relation 'users' does not exist"

Les migrations n'ont pas été exécutées.

**Solution :**
1. Vérifiez que `start.sh` exécute `python migrate.py`
2. Vérifiez les logs Railway pour voir si les migrations s'exécutent
3. Exécutez manuellement : `railway run python migrate.py`

### Erreur : "Incorrect credentials"

C'est normal ! Cela signifie que la base de données fonctionne mais l'utilisateur n'existe pas.

**Solution :**
Créez un utilisateur avec l'Option A ou B ci-dessus.

## 📋 Checklist

- [ ] PostgreSQL déployé sur Railway
- [ ] `DATABASE_URL` configurée sur le backend
- [ ] Migrations exécutées (tables créées)
- [ ] Au moins un utilisateur créé
- [ ] Backend redéployé
- [ ] Test de connexion réussi

## 🔗 Ressources

- [Railway PostgreSQL](https://docs.railway.app/databases/postgresql)
- [Alembic Migrations](https://alembic.sqlalchemy.org/)
- [FastAPI OAuth2](https://fastapi.tiangolo.com/tutorial/security/oauth2-jwt/)
