# 🚢 SEKA - Guide Déploiement Railway

**Objectif** : Déployer SEKA en production sur Railway  
**Temps estimé** : 30-45 minutes  
**Prérequis** : Code sur GitHub ✅

---

## 📋 Vue d'Ensemble

Nous allons déployer 3 services sur Railway :

1. **PostgreSQL Database** - Base de données
2. **Backend** - API FastAPI (Python)
3. **Frontend** - Application Next.js

---

## 🚀 ÉTAPE 1 : Créer un Compte Railway

### 1.1 S'inscrire
1. Aller sur https://railway.app
2. Cliquer "Start a New Project"
3. Se connecter avec GitHub (recommandé)
4. Autoriser Railway à accéder à vos repos

### 1.2 Créer un Projet
1. Cliquer "New Project"
2. Nom du projet : **SEKA Production**
3. Créer le projet

---

## 🗄️ ÉTAPE 2 : Déployer PostgreSQL

### 2.1 Ajouter Database
1. Dans votre projet → "+ New"
2. Sélectionner "Database"
3. Choisir "PostgreSQL"
4. Railway crée automatiquement la DB

### 2.2 Noter les Credentials
1. Cliquer sur le service PostgreSQL
2. Onglet "Variables"
3. Noter ces variables (on les utilisera pour le backend) :
   - `DATABASE_URL` (complet avec postgresql://...)
   - `POSTGRES_USER`
   - `POSTGRES_PASSWORD`
   - `POSTGRES_DB`

---

## 🔧 ÉTAPE 3 : Déployer le Backend (FastAPI)

### 3.1 Connecter GitHub
1. Dans le projet → "+ New"
2. Sélectionner "GitHub Repo"
3. Rechercher et sélectionner : `duareg/appsmith-seka`
4. Railway détecte automatiquement le code

### 3.2 Configurer le Service
1. Nom du service : **SEKA Backend**
2. Root Directory : `/backend`
3. Railway détecte Python/FastAPI automatiquement

### 3.3 Ajouter Variables d'Environnement

Aller dans Settings → Variables, ajouter :

```bash
# Core
PROJECT_NAME=SEKA Backend
ENVIRONMENT=production
DEBUG=false

# Security
SECRET_KEY=ZX3Cw2jm3eSYl0Fspzkj_sS3CgGJnobB8CYZi7V_O93FJVFF3X70h-OXR_iqrYoh4VRbPjA7-WRxsxp1UBOASA
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_MINUTES=10080
TOKEN_ALGORITHM=HS256

# Database (copier depuis service PostgreSQL)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Redis (optionnel pour l'instant)
REDIS_URL=

# CORS
BACKEND_CORS_ORIGINS=["https://sekagestion.com","https://www.sekagestion.com","https://app.sekagestion.com"]

# Domain
DOMAIN=sekagestion.com
FRONTEND_URL=https://app.sekagestion.com

# Cloudflare R2 (à configurer plus tard)
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=seka-documents-prod
R2_PUBLIC_BASE_URL=

# Mindee OCR
MINDEE_API_KEY=md_YOUR_MINDEE_API_KEY_HERE

# Sentry (optionnel)
SENTRY_DSN=

# Stripe
STRIPE_API_KEY=pk_test_YOUR_STRIPE_PUBLIC_KEY_HERE
STRIPE_SECRET_KEY=sk_test_YOUR_STRIPE_SECRET_KEY_HERE
STRIPE_WEBHOOK_SECRET=

# KKiaPay
KKIAPAY_PUBLIC_KEY=YOUR_KKIAPAY_PUBLIC_KEY_HERE
KKIAPAY_PRIVATE_KEY=YOUR_KKIAPAY_PRIVATE_KEY_HERE
KKIAPAY_SECRET=YOUR_KKIAPAY_SECRET_HERE

# Resend
RESEND_API_KEY=re_YOUR_RESEND_API_KEY_HERE
RESEND_FROM_EMAIL=noreply@sekagestion.com
RESEND_FROM_NAME=SEKA
```

### 3.4 Build Settings
Railway détecte automatiquement, mais vérifier :

**Build Command** :
```bash
pip install -r requirements.txt
```

**Start Command** :
```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

### 3.5 Appliquer Migrations
1. Une fois déployé, aller dans Settings → Deploy
2. Ajouter dans "Deploy Command" :
```bash
alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

### 3.6 Générer Domain
1. Settings → Networking
2. Generate Domain
3. Noter l'URL : `https://seka-backend-production.up.railway.app`

---

## 🎨 ÉTAPE 4 : Déployer le Frontend (Next.js)

### 4.1 Ajouter Nouveau Service
1. Dans le projet → "+ New"
2. Sélectionner "GitHub Repo"
3. Même repo : `duareg/appsmith-seka`

### 4.2 Configurer le Service
1. Nom du service : **SEKA Frontend**
2. Root Directory : `/frontend`
3. Railway détecte Next.js automatiquement

### 4.3 Ajouter Variables d'Environnement

Settings → Variables :

```bash
# API Backend (URL du service backend Railway)
NEXT_PUBLIC_API_URL=https://seka-backend-production.up.railway.app

# Environment
NODE_ENV=production
```

### 4.4 Build Settings
Railway détecte automatiquement :

**Build Command** :
```bash
npm install && npm run build
```

**Start Command** :
```bash
npm start
```

### 4.5 Générer Domain
1. Settings → Networking
2. Generate Domain
3. Noter l'URL : `https://seka-frontend-production.up.railway.app`

---

## 🌐 ÉTAPE 5 : Configurer le Domaine Custom

### 5.1 Configuration DNS (chez votre registrar)

Ajouter ces enregistrements DNS pour **sekagestion.com** :

```
Type    Nom                 Valeur
----    ----                ------
CNAME   app                 seka-frontend-production.up.railway.app
CNAME   api                 seka-backend-production.up.railway.app
A       @                   [IP de Railway ou CNAME www]
CNAME   www                 seka-frontend-production.up.railway.app
```

### 5.2 Configuration Railway

**Pour le Frontend** :
1. Service Frontend → Settings → Networking
2. Custom Domain : `app.sekagestion.com`
3. Railway génère certificat SSL automatiquement

**Pour le Backend** :
1. Service Backend → Settings → Networking
2. Custom Domain : `api.sekagestion.com`
3. SSL automatique

### 5.3 Mettre à Jour les Variables

**Backend** :
- `FRONTEND_URL=https://app.sekagestion.com`
- `BACKEND_CORS_ORIGINS=["https://app.sekagestion.com","https://www.sekagestion.com"]`

**Frontend** :
- `NEXT_PUBLIC_API_URL=https://api.sekagestion.com`

**Redéployer** les deux services pour appliquer les changements.

---

## ✅ ÉTAPE 6 : Vérification

### 6.1 Tester le Backend
```bash
curl https://api.sekagestion.com/api/v1/health/
# Devrait retourner : {"status":"ok"}
```

### 6.2 Tester la Documentation API
Aller sur : `https://api.sekagestion.com/docs`  
Swagger UI devrait s'afficher

### 6.3 Tester le Frontend
Aller sur : `https://app.sekagestion.com`  
La landing page devrait s'afficher

### 6.4 Tester l'Authentification
1. Aller sur `/register`
2. Créer un compte
3. Se connecter
4. Accéder au dashboard

---

## 🔍 ÉTAPE 7 : Monitoring & Logs

### 7.1 Voir les Logs
1. Cliquer sur un service
2. Onglet "Deployments"
3. Cliquer sur le dernier déploiement
4. Voir les logs en temps réel

### 7.2 Vérifier la Santé
- CPU Usage
- Memory Usage
- Network I/O
- Deployments history

### 7.3 Configurer Alerts (Optionnel)
Settings → Notifications → Ajouter email/Slack

---

## 🐛 DÉPANNAGE

### Problème : Backend ne démarre pas
**Solution** :
1. Vérifier logs : `pip install` a réussi ?
2. Vérifier `DATABASE_URL` est bien configuré
3. Vérifier migrations : `alembic upgrade head`

### Problème : Frontend erreur 500
**Solution** :
1. Vérifier `NEXT_PUBLIC_API_URL` pointe vers backend
2. Vérifier CORS dans backend
3. Logs frontend pour détails

### Problème : Database connection failed
**Solution** :
1. Service PostgreSQL est running ?
2. `DATABASE_URL` correct dans backend ?
3. Vérifier format : `postgresql+psycopg://...`

### Problème : Domain SSL pending
**Solution** :
1. Attendre 5-10 minutes
2. Vérifier DNS propagation : https://dnschecker.org
3. Forcer regenerate certificate

---

## 💰 COÛTS RAILWAY

### Plan Gratuit (Trial)
- $5 de crédit gratuit
- Pas de carte bancaire nécessaire
- Parfait pour tester

### Plan Developer ($5/mois)
- $5 de crédit inclus
- + usage au-delà
- Estimé pour SEKA : **~$10-15/mois**

### Optimisations Coûts
1. Utiliser Starter plan pour début
2. Scale up selon usage
3. Optimiser taille containers

---

## 🎯 CHECKLIST FINALE

**Avant le lancement** :
- [ ] PostgreSQL running
- [ ] Backend déployé + migrations
- [ ] Frontend déployé
- [ ] Variables d'environnement configurées
- [ ] Domaines custom configurés
- [ ] SSL activé
- [ ] Tests auth fonctionnent
- [ ] Tests upload documents
- [ ] Logs sans erreur
- [ ] Monitoring configuré

---

## 📞 SUPPORT

**Railway** :
- Documentation : https://docs.railway.app
- Discord : https://discord.gg/railway
- Status : https://status.railway.app

**SEKA** :
- GitHub Issues : https://github.com/duareg/appsmith-seka/issues

---

## 🚀 PROCHAINES ÉTAPES

Après déploiement :

1. **Configurer Cloudflare R2** pour stockage documents
2. **Activer Sentry** pour monitoring erreurs
3. **Webhooks** Stripe et KKiaPay
4. **CI/CD** : Déploiement automatique sur push GitHub
5. **Backups** : Configuration automated backups DB
6. **Scaling** : Selon trafic

---

**Bon déploiement ! 🎊**

*Temps total estimé : 30-45 minutes*
