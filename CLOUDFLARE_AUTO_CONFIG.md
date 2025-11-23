# 🚀 Configuration Automatique de Cloudflare

Ce guide vous explique comment utiliser le script automatique pour résoudre le problème CORS.

## 📋 Prérequis

Vous avez besoin d'un **token API Cloudflare** avec les permissions suivantes :
- Zone.Zone Settings (Edit)
- Zone.Configuration Rules (Edit)
- Zone.WAF (Edit)

## 🔑 Étape 1 : Créer un Token API Cloudflare

1. Allez sur **https://dash.cloudflare.com/profile/api-tokens**
2. Cliquez sur **"Create Token"**
3. Deux options :

### Option A : Utiliser un template (Recommandé)
- Sélectionnez le template **"Edit zone DNS"**
- Modifiez les permissions pour ajouter :
  - Zone.Zone Settings → Edit
  - Zone.Configuration Rules → Edit
  - Zone.WAF → Edit
- Dans "Zone Resources", sélectionnez :
  - Include → Specific zone → **sekagestion.com**
- Cliquez sur **"Continue to summary"**
- Cliquez sur **"Create Token"**
- **Copiez le token** (vous ne pourrez plus le voir après !)

### Option B : Créer un token personnalisé
- Cliquez sur **"Create Custom Token"**
- Nom : `SEKA CORS Fix`
- Permissions :
  ```
  Zone | Zone Settings | Edit
  Zone | Configuration Rules | Edit
  Zone | WAF | Edit
  ```
- Zone Resources :
  ```
  Include | Specific zone | sekagestion.com
  ```
- Cliquez sur **"Continue to summary"** puis **"Create Token"**
- **Copiez le token**

## 🛠️ Étape 2 : Exécuter le Script

### 2.1 Installer les dépendances Python

```bash
pip install requests
```

### 2.2 Définir le token API

```bash
export CLOUDFLARE_API_TOKEN='votre_token_ici'
```

⚠️ **Remplacez** `votre_token_ici` par le token que vous avez copié à l'étape 1.

### 2.3 Exécuter le script

```bash
python3 configure_cloudflare.py
```

## 📊 Ce que fait le script

Le script va automatiquement :

1. ✅ Trouver votre zone Cloudflare `sekagestion.com`
2. ✅ Régler le niveau de sécurité sur "Medium"
3. ✅ Désactiver "Browser Integrity Check"
4. ✅ Créer une règle WAF pour autoriser les requêtes vers `api.sekagestion.com`
5. ✅ Créer une Configuration Rule pour désactiver les protections sur l'API

## 🧪 Étape 3 : Tester

Après avoir exécuté le script, attendez **1-2 minutes** puis testez :

```bash
cd backend
./test_api_access.sh
```

Vous devriez voir :
- ✅ **HTTP/2 200** (au lieu de 403)
- ✅ Headers `Access-Control-Allow-Origin`

Ensuite, essayez de vous connecter sur **https://www.sekagestion.com/login**

## 🔒 Sécurité du Token

⚠️ **Important** : Ne commitez JAMAIS votre token API dans Git !

Pour plus de sécurité :

1. Après avoir exécuté le script, vous pouvez supprimer le token de votre environnement :
   ```bash
   unset CLOUDFLARE_API_TOKEN
   ```

2. Vous pouvez aussi révoquer le token sur Cloudflare après utilisation :
   - Allez sur https://dash.cloudflare.com/profile/api-tokens
   - Trouvez votre token
   - Cliquez sur "Revoke"

## ❌ Dépannage

### Erreur : "Zone 'sekagestion.com' non trouvée"
- Vérifiez que vous avez bien accès à ce domaine sur Cloudflare
- Vérifiez que le token a les bonnes permissions

### Erreur : "Impossible de créer la règle WAF"
- Vérifiez que votre plan Cloudflare permet les règles WAF personnalisées
- Si vous êtes sur le plan Free, certaines fonctionnalités peuvent être limitées
- Dans ce cas, configurez manuellement via le dashboard (voir CLOUDFLARE_FIX.md)

### Le problème persiste après configuration
1. Attendez 2-3 minutes pour la propagation
2. Videz le cache de votre navigateur (Cmd+Shift+R sur Mac)
3. Vérifiez les logs Railway pour voir si le backend reçoit les requêtes
4. Testez avec l'URL Railway directe (voir backend/get_railway_url.sh)

## 📚 Ressources

- [Documentation API Cloudflare](https://developers.cloudflare.com/api/)
- [Guide CORS Cloudflare](https://developers.cloudflare.com/fundamentals/get-started/reference/cors/)
- [WAF Custom Rules](https://developers.cloudflare.com/waf/custom-rules/)
