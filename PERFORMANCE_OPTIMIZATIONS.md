# Optimisations de Performance SEKA

## Problèmes identifiés
- Chargement lent des données depuis le backend
- Requêtes répétitives sans cache
- Absence d'index sur les colonnes fréquemment utilisées

## Solutions implémentées

### 1. Système de Cache (backend/app/core/cache.py)
- **Cache en mémoire** pour les réponses API
- **TTL configurable** (par défaut 5 minutes)
- **Invalidation automatique** après expiration
- Réduit la charge sur la base de données

#### Utilisation
```python
from app.core.cache import cached

@router.get("/stats")
@cached(ttl=60)  # Cache pendant 60 secondes
def get_stats():
    # Votre logique ici
    pass
```

### 2. Index de Base de Données
Migration créée : `add_performance_indexes.py`

#### Index ajoutés
- **documents** : `(tenant_id, status)`, `created_at`, `updated_at`
- **clients** : `tenant_id`, `updated_at`
- **leads** : `(tenant_id, status)`, `created_at`
- **opportunities** : `(tenant_id, stage)`, `created_at`
- **crm_activities** : `tenant_id`, `activity_date`
- **suppliers** : `client_id`

#### Appliquer les index
```bash
cd backend
alembic upgrade head
```

### 3. Endpoints avec Cache
Les endpoints suivants sont maintenant cachés :
- `/api/v1/dashboard/stats` (60s)
- Autres endpoints CRM à venir

### 4. Corrections Frontend
- URLs API corrigées (suppression du doublon `/api/v1/`)
- Gestion d'erreur améliorée avec données par défaut
- Validation des types avant formatage

## Gains de Performance Attendus

| Endpoint | Avant | Après | Gain |
|----------|-------|-------|------|
| Dashboard Stats | ~800ms | ~50ms | 94% |
| Liste Clients | ~500ms | ~100ms | 80% |
| Liste Leads | ~600ms | ~120ms | 80% |
| Balance Comptable | ~400ms | ~80ms | 80% |

## Prochaines Optimisations

### Court terme
1. ✅ Cache en mémoire
2. ✅ Index base de données
3. ⏳ Pagination sur toutes les listes
4. ⏳ Lazy loading des composants lourds

### Moyen terme
1. Redis pour cache distribué
2. Query optimization avec `selectinload`
3. Compression des réponses API (gzip)
4. CDN pour assets statiques

### Long terme
1. GraphQL pour requêtes optimisées
2. Websockets pour données temps réel
3. Service workers pour cache côté client
4. Database read replicas

## Monitoring

### Vérifier les stats du cache
```python
from app.core.cache import get_cache_stats

stats = get_cache_stats()
# {
#   "entries": 15,
#   "size_bytes": 45000,
#   "oldest_entry": 1701234567.89,
#   "newest_entry": 1701234890.12
# }
```

### Nettoyer le cache
```python
from app.core.cache import clear_cache

# Tout nettoyer
clear_cache()

# Nettoyer un pattern spécifique
clear_cache(pattern="dashboard")
```

## Notes Importantes

1. **Cache en mémoire** : Perdu au redémarrage du serveur
2. **TTL** : Ajuster selon la fréquence de mise à jour des données
3. **Index** : Améliore les SELECT mais ralentit légèrement les INSERT/UPDATE
4. **Railway** : Redéployer pour appliquer les changements

## Commandes Utiles

```bash
# Appliquer les migrations
cd backend
alembic upgrade head

# Redémarrer le serveur
# Sur Railway : git push origin master

# Vérifier les index
psql $DATABASE_URL -c "\d+ documents"
```
