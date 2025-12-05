from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
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
    async def root():
        return {
            "status": "ok",
            "message": "SEKA API is running",
            "version": "1.0.0-alpha",
            "environment": settings.environment,
            "cors_origins": settings.backend_cors_origins
        }

    # Health check endpoint
    @app.get("/health")
    async def health():
        return {"status": "healthy"}

    # Event handlers
    @app.on_event("startup")
    async def startup_event():
        monitoring_service.log_business_event(
            event_type="application_startup",
            description="SEKA Backend démarré avec succès",
            tenant_id="system"
        )
    
    @app.on_event("shutdown") 
    async def shutdown_event():
        monitoring_service.log_business_event(
            event_type="application_shutdown",
            description="SEKA Backend arrêté",
            tenant_id="system"
        )

    return app


app = create_application()
