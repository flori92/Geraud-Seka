# 🔴 Désactivation de Sentry sur Railway

Ce guide explique comment désactiver complètement Sentry sur Railway après l'avoir désactivé dans le code source.

## 📋 Méthode 1 : Script automatique (Recommandé)

Exécutez le script fourni :

```bash
./disable_sentry_railway.sh
```

Le script va :
- Vérifier que Railway CLI est installé
- Lister toutes les variables Sentry existantes sur Railway
- Ouvrir l'interface Railway dans votre navigateur
- Vous guider pour supprimer manuellement les variables

⚠️ **Note importante** : Railway CLI ne permet pas de supprimer directement les variables d'environnement. Vous devrez les supprimer manuellement via l'interface web Railway.

## 📋 Méthode 2 : Désactivation manuelle

### Prérequis

1. Installer Railway CLI :
```bash
npm install -g @railway/cli
```

2. Se connecter à Railway :
```bash
railway login
```

### Variables à supprimer sur Railway

#### Frontend

⚠️ **Railway CLI ne permet pas de supprimer directement les variables.** Vous devez utiliser l'interface web :

1. Allez sur https://railway.app
2. Sélectionnez votre projet frontend
3. Allez dans l'onglet "Variables" ou "Environment Variables"
4. Trouvez et supprimez ces variables :
   - `NEXT_PUBLIC_SENTRY_DSN`
   - `NEXT_PUBLIC_SENTRY_ENABLED`
   - `SENTRY_AUTH_TOKEN`
   - `SENTRY_ORG`
   - `SENTRY_PROJECT`
5. Cliquez sur l'icône de suppression (🗑️) à côté de chaque variable
6. Confirmez la suppression

#### Backend

1. Allez sur https://railway.app
2. Sélectionnez votre projet backend
3. Allez dans l'onglet "Variables" ou "Environment Variables"
4. Trouvez et supprimez la variable `SENTRY_DSN`
5. Cliquez sur l'icône de suppression (🗑️)
6. Confirmez la suppression

### Redéploiement

Après avoir supprimé les variables, redéployez les services :

```bash
# Frontend
cd frontend
railway up

# Backend
cd backend
railway up
```

## ✅ Vérification

Pour vérifier que Sentry est bien désactivé :

1. **Vérifiez les logs Railway** : Plus aucune tentative de connexion à Sentry
2. **Vérifiez la console du navigateur** : Plus d'erreurs `ERR_BLOCKED_BY_ADBLOCKER` pour Sentry
3. **Vérifiez le code** : Les fichiers `sentry.*.config.ts` ne s'initialisent plus (condition `NEXT_PUBLIC_SENTRY_ENABLED !== "true"`)

## 🔄 Réactivation (si nécessaire)

Si vous souhaitez réactiver Sentry plus tard :

1. **Dans le code** : Décommentez le code dans `next.config.mjs` et les fichiers de config Sentry
2. **Sur Railway** : Ajoutez les variables d'environnement :
   ```bash
   cd frontend
   railway variables --set "NEXT_PUBLIC_SENTRY_ENABLED=true"
   railway variables --set "NEXT_PUBLIC_SENTRY_DSN=votre-dsn-sentry"
   ```
3. **Redéployez** : `railway up`

## 📝 Notes

- Les variables d'environnement peuvent être supprimées via l'interface Railway ou la CLI
- Après suppression, un redéploiement est nécessaire pour que les changements prennent effet
- Sentry est déjà désactivé dans le code source, donc même si les variables existent encore, Sentry ne s'initialisera pas (sauf si `NEXT_PUBLIC_SENTRY_ENABLED=true`)

