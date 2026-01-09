from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
import os
import logging

from app.api.v1.router import api_router
from app.core.config import get_settings
from app.middleware.monitoring import MonitoringMiddleware
from app.middleware.proxy_headers import ProxyHeadersMiddleware
from app.middleware.security import SecurityMiddleware, RequestValidationMiddleware
from app.services.monitoring import monitoring_service

logger = logging.getLogger(__name__)


def create_application() -> FastAPI:
    settings = get_settings()

    is_production = settings.environment == "production"
    
    app = FastAPI(
        title="SEKA API",
        description="API SEKA - ERP/CRM pour PME Africaines" if is_production else """
        
        API REST complète pour la gestion de la comptabilité, trésorerie, CRM, RH et plus.
        
        * **Comptabilité** : Gestion pièces, validation OCR, écritures SYSCOHADA
        * **CRM** : Gestion clients, leads, opportunités
        * **Trésorerie** : Prévisions, rapprochement bancaire
        * **Stock** : Gestion produits et inventaire
        * **RH** : Employés, paie, présence (à venir)
        * **IA** : Lead scoring, prédictions, détection anomalies
        
        Utilisez un Bearer token JWT dans le header Authorization.
        """,
        version="1.0.0",
        docs_url=None if is_production else "/docs",
        redoc_url=None if is_production else "/redoc",
        openapi_url=None if is_production else "/openapi.json",
        terms_of_service="https://seka.app/terms",
        contact={
            "name": "SEKA Support",
            "email": "support@seka.app",
        },
        license_info={
            "name": "Proprietary",
        },
        openapi_tags=[] if is_production else [
            {"name": "auth", "description": "Authentification et gestion utilisateurs"},
            {"name": "documents", "description": "Gestion des pièces comptables"},
            {"name": "clients", "description": "Gestion CRM clients"},
            {"name": "activities", "description": "Suivi recettes et dépenses"},
            {"name": "products", "description": "Gestion stock et produits"},
            {"name": "exports", "description": "Export données comptables"},
            {"name": "dashboard", "description": "Statistiques et KPI"},
            {"name": "health", "description": "Health checks"},
        ],
        debug=False  # Toujours False en production
    )

    app.add_middleware(ProxyHeadersMiddleware)

    production_origins = [
        "https://sekagestion.com",
        "https://www.sekagestion.com",
        "https://app.sekagestion.com",
        "https://api.sekagestion.com",
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
    ]
    
    cors_origins = list(set(settings.backend_cors_origins + production_origins))
    logger.info(f"🌐 CORS Configuration - Environment: {settings.environment}")
    logger.info(f"🌐 CORS Allowed Origins: {cors_origins}")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        allow_headers=[
            "Accept",
            "Accept-Language", 
            "Content-Language",
            "Content-Type",
            "Authorization",
            "X-Requested-With",
            "X-CSRF-Token",
            "Access-Control-Allow-Origin",
            "Cache-Control",
            "Pragma",
            "Origin",
            "User-Agent",
            "Referer",
        ],
        expose_headers=["*"],
    )

    app.add_middleware(SecurityMiddleware, environment=settings.environment)
    app.add_middleware(RequestValidationMiddleware)
    
    app.add_middleware(MonitoringMiddleware)
    
    if os.path.exists("uploads"):
        app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
    
    app.include_router(api_router, prefix=settings.api_v1_prefix)

    @app.middleware("http")
    async def host_redirect_middleware(request: Request, call_next):
        host = (request.headers.get("x-forwarded-host") or request.headers.get("host") or "").split(":")[0]
        path = request.url.path or "/"

        if host == "sekagestion.com":
            if path.startswith(settings.api_v1_prefix):
                return RedirectResponse(url=f"https://api.sekagestion.com{path}", status_code=308)
            if path == "/" or path.startswith("/docs") or path.startswith("/redoc"):
                return RedirectResponse(url="https://www.sekagestion.com", status_code=308)

        return await call_next(request)

    @app.get("/")
    async def root(request: Request):
        if is_production:
            return {"status": "ok", "version": "1.0.0"}
        return {
            "status": "ok",
            "message": "SEKA API is running",
            "version": "1.0.0",
            "environment": settings.environment,
        }

    @app.head("/")
    async def root_head():
        return Response(status_code=200)

    @app.get("/health")
    async def health():
        return {"status": "healthy"}

    @app.head("/health")
    async def health_head():
        return Response(status_code=200)

    @app.get(settings.api_v1_prefix)
    async def api_v1_root():
        return {"status": "ok"}

    @app.head(settings.api_v1_prefix)
    async def api_v1_root_head():
        return Response(status_code=200)

    @app.get(f"{settings.api_v1_prefix}/")
    async def api_v1_root_slash():
        return {"status": "ok"}

    @app.head(f"{settings.api_v1_prefix}/")
    async def api_v1_root_slash_head():
        return Response(status_code=200)

    @app.on_event("startup")
    async def startup_event():
        try:
            import app.models
            from app.db.session import engine
            from app.db.base import Base
            from sqlalchemy import inspect
            
            inspector = inspect(engine)
            existing_tables = set(inspector.get_table_names())
            model_tables = set(Base.metadata.tables.keys())
            missing = model_tables - existing_tables
            
            if missing:
                logger.info(f"🔧 Creating {len(missing)} missing database tables...")
                Base.metadata.create_all(
                    bind=engine, 
                    tables=[Base.metadata.tables[t] for t in missing]
                )
                logger.info(f"✅ Created tables: {', '.join(sorted(missing))}")
            else:
                logger.info("✅ All database tables exist")

            existing_tables = set(inspector.get_table_names())
            from sqlalchemy import text

            if "bank_accounts" in existing_tables:
                bank_account_cols = {col["name"]: col for col in inspector.get_columns("bank_accounts")}
                if "metadata" not in bank_account_cols:
                    logger.info("🔧 Adding missing bank_accounts.metadata column...")
                    with engine.begin() as conn:
                        conn.execute(text("ALTER TABLE bank_accounts ADD COLUMN IF NOT EXISTS metadata JSONB"))
                    logger.info("✅ Added bank_accounts.metadata")
                
                if "bank_code" not in bank_account_cols:
                    logger.info("🔧 Adding missing bank_accounts.bank_code column...")
                    with engine.begin() as conn:
                        conn.execute(text("ALTER TABLE bank_accounts ADD COLUMN IF NOT EXISTS bank_code VARCHAR(5)"))
                        conn.execute(text("ALTER TABLE bank_accounts ADD COLUMN IF NOT EXISTS branch_code VARCHAR(5)"))
                        conn.execute(text("ALTER TABLE bank_accounts ADD COLUMN IF NOT EXISTS rib_key VARCHAR(2)"))
                    logger.info("✅ Added bank_accounts.bank_code, branch_code, rib_key")

            if "bank_transactions" in existing_tables:
                bank_tx_cols = {col["name"]: col for col in inspector.get_columns("bank_transactions")}

                if "is_reconciled" not in bank_tx_cols:
                    logger.info("🔧 Adding missing bank_transactions.is_reconciled column...")
                    with engine.begin() as conn:
                        conn.execute(text("ALTER TABLE bank_transactions ADD COLUMN IF NOT EXISTS is_reconciled BOOLEAN DEFAULT FALSE"))
                        if "reconciled" in bank_tx_cols:
                            conn.execute(text("UPDATE bank_transactions SET is_reconciled = COALESCE(reconciled, false)"))
                    logger.info("✅ Added bank_transactions.is_reconciled")

                if "reconciliation_date" not in bank_tx_cols:
                    logger.info("🔧 Adding missing bank_transactions.reconciliation_date column...")
                    with engine.begin() as conn:
                        conn.execute(text("ALTER TABLE bank_transactions ADD COLUMN IF NOT EXISTS reconciliation_date DATE"))
                    logger.info("✅ Added bank_transactions.reconciliation_date")

                if "bank_statement_line" not in bank_tx_cols:
                    logger.info("🔧 Adding missing bank_transactions.bank_statement_line column...")
                    with engine.begin() as conn:
                        conn.execute(text("ALTER TABLE bank_transactions ADD COLUMN IF NOT EXISTS bank_statement_line VARCHAR(255)"))
                    logger.info("✅ Added bank_transactions.bank_statement_line")

            try:
                with engine.begin() as conn:
                    conn.execute(text(
                        """
                        DO $$ BEGIN
                          IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'bankaccounttype') THEN
                            BEGIN
                              ALTER TYPE bankaccounttype ADD VALUE IF NOT EXISTS 'mobile_money';
                            EXCEPTION WHEN duplicate_object THEN
                              NULL;
                            END;
                          END IF;
                        END $$;
                        """
                    ))
            except Exception as e:
                logger.info(f"ℹ️  Enum bankaccounttype not updated: {e}")
            
            if 'ledger_accounts' in existing_tables:
                columns = {col['name']: col for col in inspector.get_columns('ledger_accounts')}
                if 'is_active' in columns:
                    col_type = str(columns['is_active']['type']).upper()
                    if 'VARCHAR' in col_type or 'CHAR' in col_type or 'TEXT' in col_type:
                        logger.info(f"🔧 Fixing ledger_accounts.is_active type mismatch (current: {col_type})...")
                        from sqlalchemy import text
                        with engine.begin() as conn:
                            conn.execute(text("""
                                ALTER TABLE ledger_accounts 
                                ALTER COLUMN is_active TYPE BOOLEAN 
                                USING CASE 
                                    WHEN is_active::text IN ('true', 'True', 'TRUE', '1', 't') THEN true 
                                    ELSE false 
                                END
                            """))
                        logger.info("✅ Fixed ledger_accounts.is_active type to BOOLEAN")

            if 'documents' in existing_tables:
                doc_columns = {col['name']: col for col in inspector.get_columns('documents')}
                if 'file_extension' not in doc_columns:
                    logger.info("🔧 Adding missing documents.file_extension column...")
                    from sqlalchemy import text
                    with engine.begin() as conn:
                        conn.execute(text("""
                            ALTER TABLE documents
                            ADD COLUMN IF NOT EXISTS file_extension VARCHAR(10)
                        """))
                    logger.info("✅ Added documents.file_extension")

            if 'accounting_entries' in existing_tables:
                ae_columns = {col['name']: col for col in inspector.get_columns('accounting_entries')}
                if 'entry_type' not in ae_columns:
                    logger.info("🔧 Adding missing accounting_entries.entry_type column...")
                    from sqlalchemy import text
                    with engine.begin() as conn:
                        conn.execute(text("""
                            ALTER TABLE accounting_entries
                            ADD COLUMN IF NOT EXISTS entry_type VARCHAR(10)
                        """))
                    logger.info("✅ Added accounting_entries.entry_type")

        except Exception as e:
            logger.error(f"❌ Error during startup database check: {e}")
        
        monitoring_service.log_business_event(
            event_type="application_startup",
            description="SEKA Backend démarré avec succès",
            tenant_id="system"
        )
    
    import traceback
    import uuid
    
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        error_id = str(uuid.uuid4())[:8].upper()
        
        logger.error(f"[{error_id}] Error on {request.method} {request.url.path}")
        logger.error(f"[{error_id}] Exception: {type(exc).__name__}: {str(exc)}")
        if not is_production:
            traceback.print_exc()
        
        if is_production:
            content = {
                "error": "Une erreur est survenue",
                "error_id": error_id,
                "message": "Veuillez réessayer. Si le problème persiste, contactez le support avec ce code.",
            }
        else:
            content = {
                "error": "Internal Server Error",
                "error_id": error_id,
                "detail": str(exc),
                "type": type(exc).__name__,
                "path": request.url.path,
            }
        
        response = JSONResponse(status_code=500, content=content)
        
        origin = request.headers.get("origin")
        if origin in cors_origins:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
            response.headers["Access-Control-Allow-Headers"] = "Accept, Accept-Language, Content-Language, Content-Type, Authorization, X-Requested-With, X-CSRF-Token, Access-Control-Allow-Origin, Cache-Control, Pragma, Origin, User-Agent, Referer"
        
        return response
    
    from fastapi.exceptions import RequestValidationError
    from starlette.exceptions import HTTPException as StarletteHTTPException
    
    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException):
        if is_production and exc.status_code == 404:
            content = {"error": "Ressource non trouvée"}
        elif is_production and exc.status_code == 401:
            content = {"error": "Authentification requise"}
        elif is_production and exc.status_code == 403:
            content = {"error": "Accès refusé"}
        else:
            content = {"error": exc.detail if hasattr(exc, 'detail') else str(exc)}
        
        response = JSONResponse(status_code=exc.status_code, content=content)
        
        origin = request.headers.get("origin")
        if origin in cors_origins:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
        
        return response
    
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        if is_production:
            content = {"error": "Données invalides", "message": "Vérifiez les informations saisies"}
        else:
            content = {"error": "Validation Error", "details": exc.errors()}
        
        response = JSONResponse(status_code=422, content=content)
        
        origin = request.headers.get("origin")
        if origin in cors_origins:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
        
        return response
    
    @app.on_event("shutdown") 
    async def shutdown_event():
        monitoring_service.log_business_event(
            event_type="application_shutdown",
            description="SEKA Backend arrêté",
            tenant_id="system"
        )

    return app


app = create_application()
