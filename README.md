# 🎉 SEKA Enterprise - ERP/CRM Intelligent pour PME Africaines

![Version](https://img.shields.io/badge/version-1.0.0--alpha-blue)
![License](https://img.shields.io/badge/license-Proprietary-red)
![Status](https://img.shields.io/badge/status-Mission%20Accomplie-success)

**SEKA Enterprise** est une plateforme tout-en-un de gestion d'entreprise conçue spécifiquement pour les PME africaines. Elle combine ERP, CRM, RH et Intelligence Artificielle pour automatiser et optimiser chaque aspect de votre business.

---

## 🚀 Fonctionnalités Principales

### 📊 **Analytics Intelligence**
- **Dashboard Exécutif** : Vue temps réel sur la santé de l'entreprise.
- **KPIs Animés** : Suivi des tendances (CA, Trésorerie, Conversion).
- **Alertes Intelligentes** : Notifications automatiques sur seuils critiques.
- **Insights IA** : Recommandations d'actions basées sur l'analyse des données.

### 💼 **CRM Avancé & Pipeline**
- **Lead Scoring IA** : Notation automatique des prospects (0-100).
- **Pipeline Kanban** : Gestion visuelle des opportunités par glisser-déposer.
- **Prédictions Conversion** : Estimation de la probabilité de closing.
- **Assignation Automatique** : Distribution intelligente des leads.

### 👥 **Ressources Humaines (RH)**
- **Gestion Employés** : Dossiers complets, contrats, hiérarchie.
- **Paie & Bulletins** : Génération de fiches de paie (conforme OHADA).
- **Congés & Absences** : Workflow de demande et validation.
- **Portail Employé** : Accès autonome aux documents.

### 🤖 **Assistant IA (SEKA-Bot)**
- **Chat Conversationnel** : Posez des questions en langage naturel ("Quel est mon CA ce mois ?").
- **Génération Graphiques** : Visualisation de données à la demande.
- **Actions Automatisées** : Exécution de tâches via le chat.
- **Support 24/7** : Aide contextuelle et navigation.

### 💰 **Comptabilité & Finance**
- **SYSCOHADA** : Conformité totale avec les normes comptables OHADA.
- **OCR Intelligent** : Saisie automatique des factures (Mindee).
- **Paiements Intégrés** : Stripe (CB) et KKiaPay (Mobile Money: Orange, MTN, Moov, Wave).

### 💳 **Module Trésorerie & Prévisions** ✨ NOUVEAU
- **Prévisions IA** : Cash flow sur 6 mois avec Prophet (Meta) - 3 scénarios (optimiste, réaliste, pessimiste).
- **Alertes Automatiques** : Solde faible, paiements en retard, risques de trésorerie négative.
- **Cash Runway** : Calcul automatique des jours de trésorerie disponible.
- **Rapprochement Bancaire** : Matching automatique avec scoring de correspondance.
- **Multi-Comptes** : Gestion de plusieurs comptes bancaires multi-devises.
- **Dashboard Temps Réel** : KPIs, graphiques interactifs, échéanciers de paiement.

---

## 🛠️ Stack Technique

### Backend
- **Framework** : FastAPI (Python 3.11)
- **Base de Données** : PostgreSQL 15+
- **ORM** : SQLAlchemy 2.0
- **IA/ML** : Scikit-learn, Prophet, OpenAI/Claude (via API)
- **Tâches Async** : Celery + Redis

### Frontend
- **Framework** : Next.js 14 (React)
- **Langage** : TypeScript
- **Styling** : Tailwind CSS + Shadcn/UI
- **Charts** : Recharts
- **State** : React Query + Zustand

### Infrastructure & Intégrations
- **Hosting** : Railway (Docker)
- **OCR** : Mindee API
- **Paiements** : Stripe, KKiaPay
- **Emails** : Resend
- **Monitoring** : Sentry

---

## 📚 Documentation

- [État d'Implémentation](./IMPLEMENTATION_STATUS.md) : Détail des modules complétés.
- [Architecture Technique](./ARCHITECTURE.md) : Design multi-tenant et sécurité.
- [Module Trésorerie](./.kiro/specs/treasury-management/IMPLEMENTATION_COMPLETE.md) : Documentation complète du module trésorerie.

---

## 📦 Installation & Démarrage

### Prérequis
- Python 3.11+
- Node.js 18+
- PostgreSQL
- Redis

### 1. Backend Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Configurer .env (voir .env.example)
cp ../.env.example .env

# Lancer les migrations et le serveur
./start.sh
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

L'application sera accessible sur :
- Frontend : `http://localhost:3000`
- API Docs : `http://localhost:8000/docs`

---

## 🚀 Déploiement

Le projet est configuré pour un déploiement continu sur **Railway**.
Chaque push sur la branche `master` déclenche un build et un déploiement automatique via le `Dockerfile` optimisé.

---

## 📋 État d'Implémentation

### ✅ **Terminé**
- [x] Page Clients avec interconnexion
- [x] Implémentation des règles fournisseurs
- [x] Page Règles d'imputation (CRUD complet)
- [x] Validations par type de journal (SYSCOHADA)
- [x] Service de clôture d'exercice
- [x] Contrôles de cohérence automatisés

### 🎯 **Fonctionnalités Clés Implémentées**
- **Comptabilité SYSCOHADA** : Conformité totale avec normes OHADA
- **OCR Intelligent** : Saisie automatique des documents
- **Règles d'Imputation** : Automatisation comptable avancée
- **Contrôles de Cohérence** : Validation automatique des écritures
- **Clôture d'Exercice** : Workflow complet avec calcul du résultat

---

## 🌍 Vision

**SEKA** a pour ambition de devenir le système d'exploitation des PME africaines, en démocratisant l'accès aux outils de gestion de classe mondiale et à l'intelligence artificielle.

---

**Made with ❤️ for African SMEs**
