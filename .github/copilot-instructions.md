<!-- Copilot instructions for AI coding agents working on this repo -->
# SEKA — Copilot / AI agent instructions

Be concise, make minimal invasive changes, and prefer fixes that follow existing patterns.

- **Big picture**: monorepo with a FastAPI backend (`backend/`), a Next.js frontend (`frontend/`), background workers (`worker/` + Celery), and infra scripts (`infra/`, `docker-compose.yml`). API auth uses JWT Bearer tokens. The backend uses SQLAlchemy + Alembic and expects a Postgres-compatible `DATABASE_URL`.

- **Start / dev commands**:
  - Backend: use the backend environment and run `uvicorn app.main:app --reload --host 0.0.0.0 --port 8000` (see `backend/pyproject.toml`). For containerized runs use `docker-compose up --build backend` (see `docker-compose.yml`).
  - Frontend: `cd frontend && npm run dev` (Next.js). Build with `npm run build` and run `npm run start` for production.
  - Migrations: use `backend/run_migrations.sh` / `alembic` in `backend/` (see `backend/alembic/`).

- **Key files & patterns (quick reference)**
  - `backend/app/main.py`: application factory, middleware ordering matters — `ProxyHeadersMiddleware` MUST be added first, then `CORSMiddleware`, then other middleware. Health & startup DB fixes live here.
  - `backend/app/core/config.py`: central settings (API prefix, CORS origins, environment flags). Use settings rather than hardcoding.
  - `backend/app/api/v1/router.py`: main API router; add new endpoints under `api/v1` prefix.
  - `backend/app/db/` and `backend/alembic/`: DB models, session and migrations.
  - `worker/` and `backend/worker` (if present): Celery tasks and orchestration; Redis is used for broker in production configs.

- **Conventions & gotchas discovered in code**
  - Middleware ordering is intentional: altering order may break proxy/HTTPS detection or CORS.
  - Startup code in `backend/app/main.py` performs automatic DB table creation and hotfixes (e.g., column type migrations). Avoid duplicating that logic in other scripts.
  - Static file serving: uploads are mounted at `/uploads` only if the `uploads` folder exists.
  - Error handler returns CORS headers for 500 responses — preserve that behavior when changing global exception handling.

- **When making changes**
  - Prefer small, focused changes with tests. If you modify DB models, update `backend/alembic/` migrations and run `backend/run_migrations.sh`.
  - Respect environment-driven configuration. Do not hardcode secrets or origins — read from settings.
  - For frontend/back-end interface changes, update both `frontend/` API calls and `backend` schemas (`backend/app/schemas/`) together.

- **Testing & CI**
  - Backend tests live under `backend/tests/` and use pytest. Run `pytest -q` from `backend/`.
  - There are many project scripts in `backend/` for health checks (e.g., `test_db_connection.py`, `test_document_upload.py`). Use them to validate runtime behavior.

- **Integration points & external deps**
  - S3/R2 via `boto3` (check `backend` services using `boto3`), Redis for Celery, Postgres for DB, external auth via JWT.
  - Monitoring and Sentry are integrated (`sentry-sdk` + `monitoring_service`), preserve telemetry calls when refactoring.

- **Examples**
  - Add a new API route: place implementation under `backend/app/api/v1/`, add to `api_router`, follow existing tag conventions in `main.py` OpenAPI tags.
  - If you change CORS origin behavior, update `backend/app/main.py` to keep the `production_origins` list and merge with `settings.backend_cors_origins`.

If anything in these instructions is unclear or you want a narrower scope (e.g., only backend or only frontend guidance), tell me which area to expand and I'll iterate.
