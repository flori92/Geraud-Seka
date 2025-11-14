# Configuration Railway – SEKA

Ce document décrit la configuration recommandée pour déployer l’architecture SEKA sur Railway.

## 1. Services Railway à créer

| Service | Type | Description | Variables clés |
|---------|------|-------------|----------------|
| `seka-frontend` | Web Service (Node.js) | Application Next.js (SSR) | `NEXT_PUBLIC_API_BASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET` |
| `seka-backend` | Web Service (Python) | API FastAPI | `DATABASE_URL`, `REDIS_URL`, `SECRET_KEY`, `R2_*`, `MINDEE_API_KEY`, `STRIPE_API_KEY`, `KKIAPAY_PRIVATE_KEY`, `RESEND_API_KEY`, `SENTRY_DSN` |
| `seka-worker` | Background Service (Python) | Worker Celery | `DATABASE_URL`, `REDIS_URL`, `R2_*`, `MINDEE_API_KEY` |
| `seka-db` | PostgreSQL | Base de données principale | Paramétrage via Railway |
| `seka-redis` | Redis | Cache + broker Celery | Aucun par défaut |

> Les services `seka-backend` et `seka-worker` partagent la même base de code (backend FastAPI). Prévoyez des builds séparés avec la commande adéquate.

## 2. Variables d’environnement

Les variables sont partagées entre les environnements `production`, `staging`, `development`.

### Backend / Worker

- `DATABASE_URL` : fournie par Railway (format `postgresql+psycopg://`)
- `REDIS_URL` : URI Redis Railway (ex. `redis://default:<PASSWORD>@<HOST>:<PORT>/0`)
- `SECRET_KEY` : clé secrète JWT (32+ caractères)
- `ACCESS_TOKEN_EXPIRE_MINUTES`, `REFRESH_TOKEN_EXPIRE_MINUTES`, `TOKEN_ALGORITHM`
- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_BASE_URL`
- `MINDEE_API_KEY`
- `STRIPE_API_KEY`
- `KKIAPAY_PRIVATE_KEY`
- `RESEND_API_KEY`
- `SENTRY_DSN`
- `BACKEND_CORS_ORIGINS` : JSON Array des origines autorisées (ex. `["https://app.seka.africa"]`)

### Frontend

- `NEXT_PUBLIC_API_BASE_URL` : URL publique de l’API Railway (via Custom Domain ou Railway URL)
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `RESEND_API_KEY` (si envoi direct depuis le frontend via Edge functions)

## 3. Commandes de déploiement

### Frontend

```bash
npm install
npm run build
npm run start
```

Ajouter dans Railway > Settings > Start Command : `npm run start`.

### Backend

```bash
pip install -r requirements.txt  # ou `pip install .`
alembic upgrade head
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Configurer Railway pour exécuter `uvicorn app.main:app --host 0.0.0.0 --port 8000` après installation des dépendances.

### Worker Celery

```bash
pip install -r requirements.txt
celery -A app.worker.celery_app.celery_app worker --loglevel=info
```

## 4. Intégration Cloudflare R2

1. Créer un bucket R2 (ex. `seka-documents-prod`).
2. Générer un token d’accès (Access Key / Secret) avec les permissions `Object Read`, `Object Write`, `Object List`.
3. Renseigner les variables backend `R2_*`.
4. Définir `R2_PUBLIC_BASE_URL` pour construire les URL de téléchargement (ex. `https://pub-<hash>.r2.dev`).
5. Configurer une règle de lifecycle (archives >5 ans vers classe `Smart Tier`).

## 5. Domaines & SSL

- Configurer les custom domains via Railway (app.seka.africa, api.seka.africa).
- Pointer les DNS vers Railway ou Cloudflare (recommandé `proxy` Cloudflare pour WAF + SSL).
- S’assurer que `NEXTAUTH_URL` et `NEXT_PUBLIC_API_BASE_URL` pointent vers les domaines HTTPS définitifs.

## 6. Monitoring

- Activer Sentry sur backend & frontend (variables `SENTRY_DSN`).
- Configurer des alertes Railway (CPU, mémoire, erreurs).
- Stocker les logs critiques dans Cloudflare R2 ou un service externe (Datadog, Grafana Tempo).

## 7. Sauvegardes & maintenance

- Activer les backups PostgreSQL automatiques (Railway > Data > Backups).
- Exporter régulièrement les dumps vers R2.
- Mettre en place des scripts d’auto-migration (Railway deploy hook → `alembic upgrade head`).

## 8. To-do complémentaires

- Ajouter un fichier `infra/secrets.example.env` listant les secrets attendus.
- Documenter la procédure de rotation des clés (Stripe, Kkiapay, R2).
- Créer des environnements `staging` et `production` séparés sur Railway.
