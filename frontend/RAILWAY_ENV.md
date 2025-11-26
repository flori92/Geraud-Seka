# Configuration Railway pour le Frontend SEKA

## Variables d'environnement requises

Pour éviter les erreurs Mixed Content (HTTP/HTTPS), Railway doit avoir cette variable d'environnement configurée:

```
NEXT_PUBLIC_API_BASE_URL=https://api.sekagestion.com
```

## Comment configurer sur Railway:

1. Aller dans le projet Railway
2. Cliquer sur le service `frontend`
3. Aller dans l'onglet `Variables`
4. Ajouter la variable:
   - **Nom**: `NEXT_PUBLIC_API_BASE_URL`
   - **Valeur**: `https://api.sekagestion.com`
5. Redéployer le service

## Pourquoi c'est important ?

Next.js "inline" les variables `NEXT_PUBLIC_*` lors du build. Sans cette variable, le code pourrait utiliser HTTP au lieu de HTTPS, causant des erreurs Mixed Content bloquées par le navigateur.

## Fallback

Si la variable n'est pas définie, le code utilise automatiquement `https://api.sekagestion.com` comme fallback pour éviter les erreurs HTTP.

## Vérification

Après déploiement, vérifiez dans la console du navigateur:
```
[API] Using API Base URL: https://api.sekagestion.com
```

Si vous voyez `http://` au lieu de `https://`, la variable n'est pas correctement configurée.
