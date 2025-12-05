from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
import asyncio
from datetime import datetime

from app.db.session import get_db
from app.services.monitoring import monitoring_service
from app.services.storage import storage_service
from app.services.ocr import ocr_service
from app.core.config import get_settings

router = APIRouter()

@router.get("/health", summary="Vérification de santé complète du backend")
async def get_health(db: Session = Depends(get_db)):
    """
    Endpoint de santé complet vérifiant tous les services critiques.
    Utilisé par Railway pour vérifier que l'application fonctionne.
    """
    settings = get_settings()
    health_status = {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "environment": settings.environment,
        "version": "1.0.0-alpha",
        "services": {}
    }
    
    # Test Base de données
    try:
        db.execute(text("SELECT 1"))
        health_status["services"]["database"] = {
            "status": "healthy",
            "type": "postgresql"
        }
    except Exception as e:
        health_status["services"]["database"] = {
            "status": "unhealthy", 
            "error": str(e)
        }
        health_status["status"] = "degraded"
    
    # Test Service de monitoring
    try:
        monitor_health = monitoring_service.health_check()
        health_status["services"]["monitoring"] = {
            "status": "healthy",
            "details": monitor_health
        }
    except Exception as e:
        health_status["services"]["monitoring"] = {
            "status": "unhealthy",
            "error": str(e)
        }
    
    # Test Service de stockage
    try:
        health_status["services"]["storage"] = {
            "status": "healthy",
            "r2_enabled": storage_service.use_r2,
            "local_fallback": True
        }
    except Exception as e:
        health_status["services"]["storage"] = {
            "status": "unhealthy",
            "error": str(e)
        }
    
    # Test Services externes (non bloquants)
    health_status["services"]["external"] = {
        "mindee_configured": bool(settings.mindee_api_key),
        "stripe_configured": bool(settings.stripe_secret_key),
        "kkiapay_configured": bool(settings.kkiapay_private_key),
        "resend_configured": bool(settings.resend_api_key),
        "r2_configured": bool(settings.r2_access_key_id and settings.r2_secret_access_key)
    }
    
    # Déterminer le statut global
    if health_status["status"] != "degraded":
        unhealthy_services = [
            name for name, service in health_status["services"].items() 
            if isinstance(service, dict) and service.get("status") == "unhealthy"
        ]
        if unhealthy_services:
            health_status["status"] = "degraded"
    
    return health_status

@router.get("/health/ready", summary="Vérification rapide de disponibilité")
def get_readiness():
    """Endpoint simple pour vérification rapide."""
    return {"status": "ready", "timestamp": datetime.utcnow().isoformat()}

@router.get("/health/live", summary="Vérification de vivacité")
def get_liveness():
    """Endpoint pour vérifier que l'application répond."""
    return {"status": "alive", "timestamp": datetime.utcnow().isoformat()}


@router.get("/health/tables", summary="Diagnostic des tables de base de données")
def get_tables_diagnostic(db: Session = Depends(get_db)):
    """Endpoint pour vérifier les tables existantes dans la base de données."""
    from sqlalchemy import inspect
    
    try:
        inspector = inspect(db.bind)
        tables = inspector.get_table_names()
        
        # Tables critiques à vérifier
        critical_tables = [
            'users', 'tenants', 'clients', 'quotes', 'quote_items',
            'products', 'suppliers', 'bank_accounts', 'treasury_alerts',
            'sales_invoices', 'sales_invoice_items'
        ]
        
        table_status = {}
        for table in critical_tables:
            table_status[table] = "✅ exists" if table in tables else "❌ missing"
        
        return {
            "status": "ok",
            "total_tables": len(tables),
            "critical_tables": table_status,
            "all_tables": sorted(tables)
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e)
        }
