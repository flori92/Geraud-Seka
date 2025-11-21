# SEKA - ERP/CRM Intelligent pour PME Africaines

![Version](https://img.shields.io/badge/version-1.0.0--alpha-blue)
![License](https://img.shields.io/badge/license-Proprietary-red)

SEKA est une plateforme ERP/CRM complète avec intelligence artificielle intégrée, conçue spécifiquement pour les PME africaines et les cabinets comptables.

## 🚀 Fonctionnalités Principales

### ✅ Actuellement Disponibles
- **💰 Comptabilité** : Gestion pièces, validation OCR, écritures SYSCOHADA
- **📊 Dashboard** : Statistiques temps réel
- **📄 Documents** : Upload, OCR, validation intelligente
- **👥 Clients** : CRM de base
- **💼 Activités** : Suivi recettes/dépenses
- **📦 Stock** : Gestion produits basique
- **⬇️ Exports** : CSV Sage/SAARI

### 🚧 En Développement
- CRM avancé avec lead scoring IA
- Trésorerie prédictive
- RH complet (paie, présence)
- E-commerce intégré
- Business Intelligence

## 🛠️ Stack Technique

### Backend
- **Framework** : FastAPI (Python 3.13)
- **ORM** : SQLAlchemy
- **DB** : PostgreSQL
- **Cache** : Redis
- **Tasks** : Celery
- **Migrations** : Alembic

### Frontend
- **Framework** : Next.js 14 (React)
- **Language** : TypeScript
- **Styling** : Tailwind CSS
- **State** : React Hooks
- **HTTP** : Axios

### IA/ML
- **NLP** : Transformers, spaCy
- **Time Series** : Prophet, LSTM
- **Vision** : Tesseract, OpenCV
- **ML** : scikit-learn, TensorFlow

### Infra
- **Hosting** : Railway
- **Storage** : Cloudflare R2
- **OCR** : Mindee
- **Payments** : Stripe, KKiaPay
- **Email** : Resend
- **Monitoring** : Sentry

## 📦 Installation

### Prérequis
- Python 3.13+
- Node.js 18+
- PostgreSQL 15+
- Redis 7+

### Backend Setup
```bash
cd backend

# Créer environnement virtuel
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# ou venv\Scripts\activate  # Windows

# Installer dépendances
pip install -r requirements.txt

# Copier et configurer .env
cp ../.env.example .env
# Éditer .env avec vos valeurs

# Créer base de données
createdb seka

# Appliquer migrations
alembic upgrade head

# Lancer serveur dev
uvicorn app.main:app --reload
```

### Frontend Setup
```bash
cd frontend

# Installer dépendances
npm install

# Copier et configurer .env
cp .env.example .env.local
# Éditer .env.local

# Lancer serveur dev
npm run dev
```

Application disponible sur :
- Frontend : http://localhost:3000
- Backend API : http://localhost:8000
- API Docs : http://localhost:8000/docs

## 🗄️ Base de Données

### Créer migration
```bash
cd backend
alembic revision --autogenerate -m "Description"
```

### Appliquer migrations
```bash
alembic upgrade head
```

### Revenir en arrière
```bash
alembic downgrade -1
```

## 🧪 Tests

### Backend
```bash
cd backend
pytest
```

### Frontend
```bash
cd frontend
npm test
```

## 📚 Documentation

- [Roadmap ERP Complet](./ROADMAP_ERP_COMPLET.md)
- [Plan d'Action](./PLAN_ACTION.md)
- [Analyse Projet](./ANALYSE_PROJET.md)
- [API Documentation](http://localhost:8000/docs) (en dev)

## 🚀 Déploiement

### Railway (Recommandé)
1. Connecter repo GitHub à Railway
2. Créer service PostgreSQL
3. Créer service Backend (FastAPI)
4. Créer service Frontend (Next.js)
5. Configurer variables d'environnement
6. Déployer

Voir [Guide Déploiement Railway](./docs/deployment-railway.md) (à venir)

## 🤝 Contribution

Ce projet est actuellement en développement actif. Les contributions seront bientôt acceptées.

## 📄 License

Proprietary - Tous droits réservés

## 📧 Contact

Pour toute question : contact@seka.app

---

**Made with ❤️ for African SMEs**
