# 🔍 Configuration Sentry pour SEKA

## 📋 Prérequis

Sentry CLI est déjà installé. Vous avez besoin de :
- Un compte Sentry (https://sentry.io)
- Un projet Sentry pour votre application
- Un Auth Token Sentry

## 🔑 Étape 1 : Créer un Auth Token Sentry

1. Allez sur **https://sentry.io/settings/account/api/auth-tokens/**
2. Cliquez sur **"Create New Token"**
3. Nom : `SEKA CLI Token`
4. Scopes nécessaires :
   - `project:read`
   - `project:write`
   - `project:releases`
   - `org:read`
5. Cliquez sur **"Create Token"**
6. **Copiez le token** (vous ne pourrez plus le voir après !)

## 🛠️ Étape 2 : Configurer Sentry CLI

### Option A : Via fichier de configuration (Recommandé)

Créez un fichier `.sentryclirc` à la racine du projet :

```bash
cat > .sentryclirc << 'EOF'
[auth]
token=VOTRE_TOKEN_ICI

[defaults]
org=votre-org-sentry
project=seka-frontend
EOF
```

### Option B : Via variables d'environnement

```bash
export SENTRY_AUTH_TOKEN='votre_token_ici'
export SENTRY_ORG='votre-org-sentry'
export SENTRY_PROJECT='seka-frontend'
```

## 📊 Étape 3 : Vérifier la configuration

```bash
# Tester la connexion
sentry-cli info

# Lister les projets
sentry-cli projects list
```

## 🚀 Étape 4 : Configurer les Source Maps (Frontend)

Les source maps permettent à Sentry de montrer le code source original dans les stack traces.

### 4.1 Vérifier la configuration Next.js

Le fichier `next.config.mjs` devrait déjà avoir :

```javascript
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig = {
  // ... votre config
};

export default withSentryConfig(nextConfig, {
  silent: true,
  org: "votre-org",
  project: "seka-frontend",
  authToken: process.env.SENTRY_AUTH_TOKEN,
});
```

### 4.2 Ajouter les variables d'environnement sur Railway

Pour le frontend Railway :

```bash
cd frontend
railway variables --set "SENTRY_AUTH_TOKEN=votre_token_ici"
railway variables --set "SENTRY_ORG=votre-org"
railway variables --set "SENTRY_PROJECT=seka-frontend"
```

## 🐍 Étape 5 : Configurer Sentry pour le Backend (Python)

Le backend utilise déjà Sentry. Vérifiez que la variable d'environnement est définie :

```bash
cd backend
railway link  # Si pas déjà lié
railway variables --set "SENTRY_DSN=https://votre-dsn@sentry.io/votre-project-id"
```

## 📦 Étape 6 : Upload des Source Maps (après chaque déploiement)

### Automatique (via Railway)

Les source maps sont uploadées automatiquement lors du build si les variables sont configurées.

### Manuel (pour tester)

```bash
cd frontend
npm run build
sentry-cli sourcemaps upload --release=VERSION .next
```

## 🧪 Étape 7 : Tester Sentry

### Frontend

Ajoutez un bouton de test dans votre app :

```javascript
<button onClick={() => {
  throw new Error("Test Sentry Error");
}}>
  Test Sentry
</button>
```

### Backend

```python
# Dans n'importe quel endpoint
from sentry_sdk import capture_exception

try:
    1 / 0
except Exception as e:
    capture_exception(e)
```

## 🔒 Sécurité

⚠️ **Important** :
- Ne commitez JAMAIS votre token Sentry dans Git
- Ajoutez `.sentryclirc` au `.gitignore`
- Utilisez des variables d'environnement en production

## 📚 Commandes Utiles

```bash
# Voir les infos du compte
sentry-cli info

# Lister les organisations
sentry-cli organizations list

# Lister les projets
sentry-cli projects list

# Créer une release
sentry-cli releases new VERSION

# Finaliser une release
sentry-cli releases finalize VERSION

# Lister les releases
sentry-cli releases list

# Upload source maps
sentry-cli sourcemaps upload --release=VERSION DOSSIER
```

## 🎯 Configuration Recommandée pour Production

### Frontend (.env.production)

```bash
NEXT_PUBLIC_SENTRY_DSN=https://votre-dsn@sentry.io/votre-project-id
SENTRY_AUTH_TOKEN=votre_token_ici
SENTRY_ORG=votre-org
SENTRY_PROJECT=seka-frontend
```

### Backend (.env)

```bash
SENTRY_DSN=https://votre-dsn@sentry.io/votre-backend-project-id
ENVIRONMENT=production
```

## 🐛 Dépannage

### Erreur : "Authentication credentials were not provided"
- Vérifiez que le token est correct
- Vérifiez que le token a les bons scopes

### Source maps non uploadées
- Vérifiez que `SENTRY_AUTH_TOKEN` est défini lors du build
- Vérifiez les logs de build Railway
- Testez manuellement : `sentry-cli sourcemaps upload`

### Erreurs non capturées
- Vérifiez que `SENTRY_DSN` est défini
- Vérifiez que Sentry est initialisé dans votre code
- Regardez les logs de l'application

## 📖 Ressources

- [Documentation Sentry CLI](https://docs.sentry.io/product/cli/)
- [Sentry Next.js](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Sentry Python](https://docs.sentry.io/platforms/python/)
