# 🔧 Fix Frontend - Configuration API URL

## Problème

Le frontend appelle `https://seka-backend.up.railway.app` au lieu de `https://app.sekagestion.com`.

## Solution

### Option 1 : Via Railway Dashboard (Recommandé)

1. Allez sur **Railway Dashboard** : https://railway.app
2. Sélectionnez votre projet **SEKA**
3. Cliquez sur le service **Frontend**
4. Allez dans l'onglet **Variables**
5. Ajoutez ou modifiez la variable :
   ```
   NEXT_PUBLIC_API_BASE_URL=https://app.sekagestion.com
   ```
6. Cliquez sur **Deploy** pour redéployer

### Option 2 : Via Railway CLI

```bash
# Installer Railway CLI si nécessaire
npm install -g @railway/cli

# Se connecter
railway login

# Lier le projet
railway link

# Définir la variable
railway variables set NEXT_PUBLIC_API_BASE_URL=https://app.sekagestion.com

# Redéployer
railway up
```

## Vérification

Après le redéploiement (2-3 minutes) :

1. Videz le cache du navigateur (Cmd+Shift+R)
2. Allez sur https://www.sekagestion.com/login
3. Ouvrez la console (F12)
4. Essayez de vous connecter
5. Vérifiez que l'URL appelée est bien `https://app.sekagestion.com/api/v1/auth/login`

## Note Importante

L'URL `https://app.sekagestion.com` pointe vers Railway via Cloudflare, ce qui permet :
- ✅ CORS configuré correctement
- ✅ Protection Cloudflare
- ✅ SSL/TLS
- ✅ Cache et CDN
