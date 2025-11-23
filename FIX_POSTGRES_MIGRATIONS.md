# 🔧 Fix PostgreSQL - Migrations en Boucle

## 🔍 Problème

Les logs PostgreSQL montrent que les migrations tentent de créer la table `tenants` en boucle :
```
ERROR: relation "tenants" already exists
```

**Cause** : Alembic ne sait pas que les migrations ont déjà été exécutées.

## 🎯 Solution Rapide

### Sur Railway Dashboard

1. Allez sur : https://railway.app/project/6544d82c-c677-4678-b2e9-465dfdd4970d

2. Cliquez sur le service **Postgres**

3. Onglet **"Query"**

4. Exécutez ce SQL :

```sql
-- Vérifier l'état actuel
SELECT * FROM alembic_version;

-- Marquer toutes les migrations comme exécutées
DELETE FROM alembic_version;
INSERT INTO alembic_version (version_num) 
VALUES ('20241122_add_crm_integration');

-- Vérifier
SELECT * FROM alembic_version;
```

5. **Redémarrez le backend** :
   - Service Backend → "..." → "Restart"

## 🧪 Vérification

Après le redémarrage, les logs ne devraient plus montrer d'erreurs de création de tables.

Testez l'API :
```bash
curl https://api.sekagestion.com/health
```

## 🆘 Si le problème persiste

### Option : Reset complet de la base

⚠️ **ATTENTION : Cela supprimera toutes les données !**

```sql
-- Supprimer toutes les tables
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- Redémarrer le backend pour recréer les tables
```

Puis redémarrez le backend pour qu'il recrée tout.

## 📋 Checklist

- [ ] SQL exécuté dans Postgres Query
- [ ] `alembic_version` contient la bonne version
- [ ] Backend redémarré
- [ ] Logs backend sans erreur "relation already exists"
- [ ] API `/health` répond 200 OK
- [ ] Créer un utilisateur admin
- [ ] Tester la connexion

## 🔗 Prochaine étape

Une fois les migrations fixées, créez un utilisateur :
```bash
# Via Railway Shell (Backend)
python quick_create_user.py
```

Ou via SQL (voir `CREATE_USER_RAILWAY.md`)
