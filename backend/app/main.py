from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.api.v1.router import api_router
from app.core.config import get_settings
from app.middleware.monitoring import MonitoringMiddleware
from app.services.monitoring import monitoring_service


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

    # CORS Middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.backend_cors_origins if settings.environment == "production" else ["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Monitoring Middleware
    app.add_middleware(MonitoringMiddleware)
    
    # Servir les fichiers statiques (uploads locaux)
    if os.path.exists("uploads"):
        app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
    
    # Routes API
    app.include_router(api_router, prefix=settings.api_v1_prefix)
    
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
