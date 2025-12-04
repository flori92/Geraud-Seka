# Guide de Résolution CORS

## Problème

```
Access to XMLHttpRequest at 'https://api.sekagestion.com/api/v1/...' 
from origin 'https://www.sekagestion.com' has been blocked by CORS policy: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## Diagnostic

### 1. Vérifier que le backend est déployé
```bash
curl -I https://api.sekagestion.com/api/v1/health
```

**Attendu** : Status 200 OK

### 2. Vérifier les headers CORS
```bash
curl -H "Origin: https://www.sekagestion.com" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Authorization" \
     -X OPTIONS \
     -v https://api.sekagestion.com/api/v1/products/
```

**Attendu** :
```
Access-Control-Allow-Origin: https://www.sekagestion.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Authorization, Content-Type
```

## Solutions

### Solution 1 : Vérifier les variables d'environnement (Railway)

Sur Railway, vérifier que ces variables sont définies :

```env
BACKEND_CORS_ORIGINS=["https://www.sekagestion.com","https://sekagestion.com","https://app.sekagestion.com","http://localhost:3000"]
```

**Étapes** :
1. Aller sur Railway Dashboard
2. Sélectionner le service backend
3. Onglet "Variables"
4. Vérifier/Ajouter `BACKEND_CORS_ORIGINS`
5. Redéployer

### Solution 2 : Vérifier le code backend

Le code dans `backend/app/main.py` est correct :

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.backend_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Et dans `backend/app/core/config.py` :

```python
backend_cors_origins: List[str] = [
    "http://localhost:3000",
    "https://www.sekagestion.com",
    "https://sekagestion.com",
    "https://app.sekagestion.com",
    "https://api.sekagestion.com",
]
```

### Solution 3 : Proxy de développement (temporaire)

Si le problème persiste en développement local :

**frontend/next.config.js** :
```javascript
module.exports = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://api.sekagestion.com/api/:path*',
      },
    ]
  },
}
```

Puis dans le code frontend, utiliser `/api/v1/...` au lieu de `https://api.sekagestion.com/api/v1/...`

### Solution 4 : Nginx/Reverse Proxy

Si vous utilisez Nginx devant le backend :

```nginx
location /api/ {
    proxy_pass http://backend:8000/api/;
    
    # CORS headers
    add_header 'Access-Control-Allow-Origin' 'https://www.sekagestion.com' always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
    add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type' always;
    add_header 'Access-Control-Allow-Credentials' 'true' always;
    
    # Preflight
    if ($request_method = 'OPTIONS') {
        return 204;
    }
}
```

## Vérification Post-Déploiement

### Test 1 : Health Check
```bash
curl https://api.sekagestion.com/api/v1/health
```

### Test 2 : CORS Preflight
```bash
curl -H "Origin: https://www.sekagestion.com" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Authorization,Content-Type" \
     -X OPTIONS \
     https://api.sekagestion.com/api/v1/auth/login
```

### Test 3 : Requête réelle
```bash
curl -H "Origin: https://www.sekagestion.com" \
     -H "Content-Type: application/json" \
     -X POST \
     -d '{"username":"test","password":"test"}' \
     https://api.sekagestion.com/api/v1/auth/login
```

## Erreurs Courantes

### 1. "No 'Access-Control-Allow-Origin' header"
**Cause** : Backend pas déployé ou CORS mal configuré
**Solution** : Vérifier déploiement et variables d'environnement

### 2. "The 'Access-Control-Allow-Origin' header contains multiple values"
**Cause** : Headers CORS dupliqués (Nginx + FastAPI)
**Solution** : Désactiver CORS dans FastAPI OU Nginx, pas les deux

### 3. "Credentials flag is 'true', but 'Access-Control-Allow-Credentials' header is ''"
**Cause** : `allow_credentials=True` dans FastAPI mais pas dans Nginx
**Solution** : Synchroniser la configuration

## Checklist de Déploiement

- [ ] Backend déployé et accessible
- [ ] Variable `BACKEND_CORS_ORIGINS` définie
- [ ] Backend redémarré après changement config
- [ ] Frontend redéployé
- [ ] Cache navigateur vidé
- [ ] Test avec `curl` réussi
- [ ] Test dans navigateur réussi

## Logs Utiles

### Backend (Railway)
```bash
railway logs --service backend
```

Rechercher :
- `CORS origins:` pour voir les origines configurées
- `OPTIONS /api/v1/...` pour voir les requêtes preflight
- Erreurs 403 ou 401

### Frontend (Vercel/Netlify)
Vérifier dans la console du navigateur :
- Network tab → Filtrer par "Fetch/XHR"
- Regarder les headers de réponse
- Vérifier le status code

## Support

Si le problème persiste :

1. **Vérifier le déploiement** : Le backend est-il bien déployé ?
2. **Logs Railway** : Y a-t-il des erreurs ?
3. **Test curl** : Les requêtes curl fonctionnent-elles ?
4. **Variables d'env** : Sont-elles bien définies ?

## Notes

- Les erreurs `ERR_BLOCKED_BY_ADBLOCKER` (Sentry) sont normales et sans impact
- Les extensions Chrome peuvent générer des erreurs non liées au code
- CORS est un problème de **déploiement**, pas de **code**
