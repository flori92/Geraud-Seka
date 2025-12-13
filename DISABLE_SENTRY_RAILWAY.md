# 🔴 Désactivation de Sentry sur Railway

Ce guide explique comment désactiver complètement Sentry sur Railway après l'avoir désactivé dans le code source.

## 📋 Méthode 1 : Script automatique (Recommandé)

Exécutez le script fourni :

```bash
./disable_sentry_railway.sh
```

Le script va :
- Vérifier que Railway CLI est installé
- Supprimer toutes les variables d'environnement Sentry du frontend
- Supprimer toutes les variables d'environnement Sentry du backend
- Vous guider pour redéployer les services

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

Naviguez vers le projet frontend sur Railway et supprimez ces variables d'environnement :

```bash
cd frontend
railway link  # Si pas déjà lié

# Supprimer les variables Sentry
railway variables --delete "NEXT_PUBLIC_SENTRY_DSN"
railway variables --delete "NEXT_PUBLIC_SENTRY_ENABLED"
railway variables --delete "SENTRY_AUTH_TOKEN"
railway variables --delete "SENTRY_ORG"
railway variables --delete "SENTRY_PROJECT"
```

**Ou via l'interface Railway :**
1. Allez sur https://railway.app
2. Sélectionnez votre projet frontend
3. Allez dans l'onglet "Variables"
4. Supprimez les variables listées ci-dessus

#### Backend

```bash
cd backend
railway link  # Si pas déjà lié

# Supprimer la variable Sentry
railway variables --delete "SENTRY_DSN"
```

**Ou via l'interface Railway :**
1. Allez sur https://railway.app
2. Sélectionnez votre projet backend
3. Allez dans l'onglet "Variables"
4. Supprimez `SENTRY_DSN`

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

