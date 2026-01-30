# SEKA BUSINESS - Build & Test Commands

## Quick Reference

| Action | Command |
|--------|---------|
| Backend tests | `cd backend && pytest -v` |
| Frontend tests | `cd frontend && npm run test:e2e` |
| Backend start | `cd backend && uvicorn app.main:app --reload` |
| Frontend start | `cd frontend && npm run dev` |
| Full stack | `docker-compose up` |

---

## Backend (FastAPI + Python)

### Environment Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Linux/Mac
# .venv\Scripts\activate   # Windows
pip install -r requirements.txt
```

### Database

```bash
# PostgreSQL connection (from .env)
# DATABASE_URL=postgresql://user:pass@localhost:5432/seka

# Run migrations
cd backend
alembic upgrade head

# Create new migration
alembic revision --autogenerate -m "description"

# Rollback
alembic downgrade -1
```

### Run Backend

```bash
cd backend

# Development (with hot reload)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Production
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Backend Tests

```bash
cd backend

# Run all tests
pytest -v

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/test_documents.py -v

# Run specific test
pytest tests/test_documents.py::test_upload_invoice -v

# Run tests matching pattern
pytest -k "doublon" -v

# Run tests with print output
pytest -v -s

# Generate coverage report
pytest --cov=app --cov-report=term-missing
```

### Backend Linting

```bash
cd backend

# Type checking (if mypy installed)
mypy app/

# Format code
black app/ tests/

# Sort imports
isort app/ tests/
```

---

## Frontend (Next.js + TypeScript)

### Environment Setup

```bash
cd frontend
npm install
```

### Run Frontend

```bash
cd frontend

# Development
npm run dev

# Build production
npm run build

# Start production
npm run start
```

### Frontend Tests (Playwright E2E)

```bash
cd frontend

# Run all E2E tests
npm run test:e2e

# Run specific test files
npm run test:e2e:saisie
npm run test:e2e:journaux
npm run test:e2e:revision
npm run test:e2e:fiscalite
npm run test:e2e:cloture

# Run with UI mode (debugging)
npx playwright test --ui

# Run headed (see browser)
npx playwright test --headed

# Run specific test file
npx playwright test e2e/doublons.spec.ts

# Generate test report
npx playwright show-report
```

### Frontend Linting

```bash
cd frontend

# ESLint
npm run lint

# TypeScript type check
npx tsc --noEmit
```

---

## Docker

### Development

```bash
# Start all services
docker-compose up

# Start in background
docker-compose up -d

# Rebuild containers
docker-compose up --build

# Stop all
docker-compose down

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Individual Services

```bash
# Build backend image
docker build -t seka-backend ./backend

# Build frontend image
docker build -t seka-frontend ./frontend

# Run backend container
docker run -p 8000:8000 --env-file ./backend/.env seka-backend

# Run frontend container
docker run -p 3000:3000 seka-frontend
```

---

## Database Operations

### PostgreSQL Direct

```bash
# Connect to local DB
psql -h localhost -U postgres -d seka

# Connect to Railway DB
psql $DATABASE_URL

# Backup
pg_dump $DATABASE_URL > backup.sql

# Restore
psql $DATABASE_URL < backup.sql
```

### SQLAlchemy Shell

```bash
cd backend
python -c "
from app.db.base import SessionLocal
from app.models import *
db = SessionLocal()
# Example queries
factures = db.query(Facture).all()
print(f'Total factures: {len(factures)}')
"
```

---

## Security Checks

### Backend Security

```bash
cd backend

# Check for vulnerabilities in dependencies
pip-audit

# OWASP dependency check (if installed)
safety check

# Bandit security linter
bandit -r app/
```

### Frontend Security

```bash
cd frontend

# Check npm vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix
```

---

## Deployment (Railway)

### Deploy Commands

```bash
# Login to Railway
railway login

# Deploy backend
cd backend && railway up

# Deploy frontend
cd frontend && railway up

# View logs
railway logs
```

### Environment Variables

Required for production:
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - Secret for JWT tokens
- `NEXTAUTH_SECRET` - NextAuth secret
- `NEXTAUTH_URL` - Frontend URL
- `CLOUDFLARE_R2_*` - R2 storage credentials
- `GOOGLE_GENERATIVE_AI_API_KEY` - Gemini API key
- `SENTRY_DSN` - Sentry error tracking

---

## Useful Scripts

### Create Admin User

```bash
cd backend
python create_admin_user.py
```

### Recreate Demo Data

```bash
cd backend
python recreate_demo_data.py
```

### Database Audit

```bash
cd backend
./audit_database.sh
```

---

## Testing Strategy

### Unit Tests (Backend)

Location: `backend/tests/`

```
tests/
├── test_auth.py          # Authentication tests
├── test_documents.py     # Document/facture tests
├── test_doublons.py      # Duplicate detection tests
├── test_ecritures.py     # Accounting entries tests
├── test_export.py        # Export functionality tests
├── test_plan_comptable.py # Chart of accounts tests
├── test_regles.py        # Imputation rules tests
└── test_tiers.py         # Suppliers/clients tests
```

### E2E Tests (Frontend)

Location: `frontend/e2e/`

```
e2e/
├── saisie.spec.ts       # Invoice entry tests
├── journaux.spec.ts     # Journal tests
├── revision.spec.ts     # Revision tests
├── fiscalite.spec.ts    # Tax tests
├── cloture.spec.ts      # Closing tests
└── doublons.spec.ts     # Duplicate confrontation tests
```

### Test Before Commit Checklist

1. `cd backend && pytest -v` - All backend tests pass
2. `cd frontend && npm run lint` - No lint errors
3. `cd frontend && npx tsc --noEmit` - No TypeScript errors
4. `cd frontend && npm run test:e2e` - All E2E tests pass (if applicable)

---

## Troubleshooting

### Backend Issues

```bash
# Reset database
cd backend
alembic downgrade base
alembic upgrade head

# Clear Python cache
find . -type d -name __pycache__ -exec rm -rf {} +
find . -type f -name "*.pyc" -delete

# Reinstall dependencies
pip install -r requirements.txt --force-reinstall
```

### Frontend Issues

```bash
# Clear Next.js cache
cd frontend
rm -rf .next
npm run dev

# Reinstall node modules
rm -rf node_modules package-lock.json
npm install
```

### Docker Issues

```bash
# Remove all containers and volumes
docker-compose down -v

# Prune unused images
docker system prune -a

# Rebuild from scratch
docker-compose build --no-cache
```
