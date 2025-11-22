# Configuration Production SEKA Frontend

## Variables d'Environnement Requises

```bash
# ⚠️ IMPORTANT: L'URL de base NE DOIT PAS contenir /api/v1
# Car ce préfixe est ajouté automatiquement dans le code

# ✅ CORRECT
NEXT_PUBLIC_API_BASE_URL=https://app.sekagestion.com

# ❌ INCORRECT (cause double /api/v1/api/v1)
NEXT_PUBLIC_API_BASE_URL=https://app.sekagestion.com/api/v1
```

## Déploiement

### Railway / Vercel
Configurer ces variables dans le dashboard de votre plateforme.

### Variables Complètes
```bash
NEXT_PUBLIC_API_BASE_URL=https://app.sekagestion.com
NEXT_PUBLIC_FRONTEND_URL=https://www.sekagestion.com
NEXT_PUBLIC_ENVIRONMENT=production
```

## Vérification
Une fois déployé, vérifiez dans la console que les URLs appelées sont :
- ✅ `https://app.sekagestion.com/api/v1/auth/login`
- ❌ PAS `https://app.sekagestion.com/api/v1/api/v1/auth/login`