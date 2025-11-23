# 🔧 Fix CORS Issue - Cloudflare Configuration

## 🚨 Problème Identifié

Cloudflare bloque les requêtes API avec un **403 Forbidden** avant qu'elles n'atteignent le backend Railway.
Cela empêche les en-têtes CORS d'être envoyés, causant l'erreur :
```
Access to XMLHttpRequest at 'https://api.sekagestion.com/api/v1/auth/login' 
from origin 'https://www.sekagestion.com' has been blocked by CORS policy
```

## ✅ Solution : Configuration Cloudflare

### Étape 1 : Paramètres de Sécurité Généraux

1. Connectez-vous à **Cloudflare Dashboard** : https://dash.cloudflare.com
2. Sélectionnez le domaine **sekagestion.com**
3. Allez dans **Security > Settings**
4. Modifiez :
   - **Security Level** : `Medium` ou `Low`
   - **Browser Integrity Check** : **OFF** ❌
   - **Challenge Passage** : `30 minutes` minimum

### Étape 2 : Créer une Configuration Rule pour l'API

1. Allez dans **Rules > Configuration Rules**
2. Cliquez sur **Create rule**
3. Configurez :
   - **Rule name** : `API CORS Allow`
   - **When incoming requests match** :
     ```
     Field: Hostname
     Operator: equals
     Value: api.sekagestion.com
     ```
   - **Then the settings are** :
     - **Browser Integrity Check** : `Off`
     - **Security Level** : `Essentially Off`
4. Cliquez sur **Deploy**

### Étape 3 : Créer une WAF Custom Rule

1. Allez dans **Security > WAF**
2. Onglet **Custom rules**
3. Cliquez sur **Create rule**
4. Configurez :
   - **Rule name** : `Allow API Requests`
   - **When incoming requests match** :
     ```
     Field: Hostname
     Operator: equals
     Value: api.sekagestion.com
     ```
   - **Then** : 
     - Action : **Skip**
     - Skip : **All remaining custom rules**
5. Cliquez sur **Deploy**

### Étape 4 : Vérifier SSL/TLS

1. Allez dans **SSL/TLS > Overview**
2. Assurez-vous que le mode est **Full** ou **Full (strict)**
   - ⚠️ Ne PAS utiliser "Flexible"

### Étape 5 : Désactiver les protections supplémentaires (optionnel)

Si le problème persiste :

1. Allez dans **Security > Bots**
2. Désactivez **Bot Fight Mode** pour `api.sekagestion.com`

## 🧪 Test après configuration

Attendez 1-2 minutes après avoir appliqué les changements, puis testez :

```bash
cd backend
./test_api_access.sh
```

Vous devriez voir :
- ✅ HTTP/2 200 (au lieu de 403)
- ✅ Headers `Access-Control-Allow-Origin`
- ✅ Headers `Access-Control-Allow-Methods`

## 🔍 Alternative : Bypass Cloudflare temporairement

Si vous voulez tester immédiatement sans attendre la configuration Cloudflare :

1. Dans Railway, allez dans votre service **Backend**
2. Allez dans **Settings > Networking**
3. Notez l'URL Railway (ex: `seka-backend-production.up.railway.app`)
4. Dans le frontend, modifiez temporairement `NEXT_PUBLIC_API_BASE_URL` pour pointer vers l'URL Railway directe
5. Redéployez le frontend

⚠️ **Ceci est temporaire** - configurez Cloudflare correctement pour la production.

## 📚 Ressources

- [Cloudflare CORS Documentation](https://developers.cloudflare.com/fundamentals/get-started/reference/cors/)
- [Cloudflare Configuration Rules](https://developers.cloudflare.com/rules/configuration-rules/)
- [Cloudflare WAF Custom Rules](https://developers.cloudflare.com/waf/custom-rules/)
