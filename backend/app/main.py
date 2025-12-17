from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
import os
import logging

from app.api.v1.router import api_router
from app.core.config import get_settings
from app.middleware.monitoring import MonitoringMiddleware
from app.middleware.proxy_headers import ProxyHeadersMiddleware
from app.services.monitoring import monitoring_service

logger = logging.getLogger(__name__)


def create_application() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title="SEKA API",
        description="""
        ## 🚀 SEKA - ERP/CRM Intelligent pour PME Africaines
        
        API REST complète pour la gestion de la comptabilité, trésorerie, CRM, RH et plus.
        
        ### Fonctionnalités Principales
        * **Comptabilité** : Gestion pièces, validation OCR, écritures SYSCOHADA
        * **CRM** : Gestion clients, leads, opportunités
        * **Trésorerie** : Prévisions, rapprochement bancaire
        * **Stock** : Gestion produits et inventaire
        * **RH** : Employés, paie, présence (à venir)
        * **IA** : Lead scoring, prédictions, détection anomalies
        
        ### Authentification
        Utilisez un Bearer token JWT dans le header Authorization.
        """,
        version="1.0.0-alpha",
        terms_of_service="https://seka.app/terms",
        contact={
            "name": "SEKA Support",
            "email": "support@seka.app",
        },
        license_info={
            "name": "Proprietary",
        },
        openapi_tags=[
            {"name": "auth", "description": "Authentification et gestion utilisateurs"},
            {"name": "documents", "description": "Gestion des pièces comptables"},
            {"name": "clients", "description": "Gestion CRM clients"},
            {"name": "activities", "description": "Suivi recettes et dépenses"},
            {"name": "products", "description": "Gestion stock et produits"},
            {"name": "exports", "description": "Export données comptables"},
            {"name": "dashboard", "description": "Statistiques et KPI"},
            {"name": "health", "description": "Health checks"},
        ],
        debug=settings.debug
    )

    # Proxy Headers Middleware - MUST BE FIRST
    # Handles X-Forwarded-* headers from Cloudflare/Railway proxy
    # This ensures FastAPI recognizes HTTPS from X-Forwarded-Proto header
    app.add_middleware(ProxyHeadersMiddleware)

    # CORS Middleware - IMPORTANT: Must be added BEFORE other middleware
    # Always include production origins to ensure CORS works
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
    
    # Merge with settings origins (avoid duplicates)
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

    # Monitoring Middleware
    app.add_middleware(MonitoringMiddleware)
    
    # Servir les fichiers statiques (uploads locaux)
    if os.path.exists("uploads"):
        app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
    
    # Routes API
    app.include_router(api_router, prefix=settings.api_v1_prefix)

    # Root endpoint for health check and CORS verification
    @app.get("/")
    async def root(request: Request):
        return {
            "status": "ok",
            "message": "SEKA API is running",
            "version": "1.0.0-alpha",
            "environment": settings.environment,
            "cors_origins": settings.backend_cors_origins,
            "headers": dict(request.headers)
        }

    @app.head("/")
    async def root_head():
        return Response(status_code=200)

    # Health check endpoint
    @app.get("/health")
    async def health():
        return {"status": "healthy"}

    @app.head("/health")
    async def health_head():
        return Response(status_code=200)

    # /api/v1 endpoint for load balancers / monitoring (avoid 404/405 on prefix root)
    @app.get(settings.api_v1_prefix)
    async def api_v1_root():
        return {"status": "ok"}

    @app.head(settings.api_v1_prefix)
    async def api_v1_root_head():
        return Response(status_code=200)

    # Event handlers
    @app.on_event("startup")
    async def startup_event():
        # Create missing database tables on startup
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

            # Treasury compatibility (bank_accounts / bank_transactions)
            existing_tables = set(inspector.get_table_names())
            from sqlalchemy import text

            if "bank_accounts" in existing_tables:
                bank_account_cols = {col["name"]: col for col in inspector.get_columns("bank_accounts")}
                if "metadata" not in bank_account_cols:
                    logger.info("🔧 Adding missing bank_accounts.metadata column...")
                    with engine.begin() as conn:
                        conn.execute(text("ALTER TABLE bank_accounts ADD COLUMN IF NOT EXISTS metadata JSONB"))
                    logger.info("✅ Added bank_accounts.metadata")

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

            # Postgres enum value for BankAccountType (only if enum type exists)
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
            
            # Fix ledger_accounts.is_active type mismatch (VARCHAR -> BOOLEAN)
            if 'ledger_accounts' in existing_tables:
                columns = {col['name']: col for col in inspector.get_columns('ledger_accounts')}
                if 'is_active' in columns:
                    col_type = str(columns['is_active']['type']).upper()
                    if 'VARCHAR' in col_type or 'CHAR' in col_type or 'TEXT' in col_type:
                        logger.info(f"🔧 Fixing ledger_accounts.is_active type mismatch (current: {col_type})...")
                        from sqlalchemy import text
                        with engine.begin() as conn:
                            # Convert 'true'/'1' string values to boolean
                            conn.execute(text("""
                                ALTER TABLE ledger_accounts 
                                ALTER COLUMN is_active TYPE BOOLEAN 
                                USING CASE 
                                    WHEN is_active::text IN ('true', 'True', 'TRUE', '1', 't') THEN true 
                                    ELSE false 
                                END
                            """))
                        logger.info("✅ Fixed ledger_accounts.is_active type to BOOLEAN")

            # Hotfix: ensure documents.file_extension exists (some DBs are behind GED migrations)
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

        except Exception as e:
            logger.error(f"❌ Error during startup database check: {e}")
        
        monitoring_service.log_business_event(
            event_type="application_startup",
            description="SEKA Backend démarré avec succès",
            tenant_id="system"
        )
    
    # Global Exception Handler for 500 errors
    import traceback
    
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        logger.error(f"Global error on {request.url.path}: {str(exc)}")
        logger.error(f"Request method: {request.method}")
        logger.error(f"Request headers: {dict(request.headers)}")
        traceback.print_exc()
        
        # Return CORS headers even for errors
        response = JSONResponse(
            status_code=500,
            content={
                "detail": f"Internal Server Error: {str(exc)}",
                "path": request.url.path,
                "error_type": type(exc).__name__
            },
        )
        
        # Add CORS headers manually for error responses
        origin = request.headers.get("origin")
        if origin in cors_origins:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
            response.headers["Access-Control-Allow-Headers"] = "Accept, Accept-Language, Content-Language, Content-Type, Authorization, X-Requested-With, X-CSRF-Token, Access-Control-Allow-Origin, Cache-Control, Pragma, Origin, User-Agent, Referer"
        
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
