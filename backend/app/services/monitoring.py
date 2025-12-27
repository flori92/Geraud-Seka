"""Service de monitoring et logging pour SEKA."""

import logging
import sys
from typing import Dict, Any, Optional
from datetime import datetime
import traceback

try:
    import sentry_sdk
    from sentry_sdk.integrations.fastapi import FastApiIntegration
    from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
    SENTRY_AVAILABLE = True
except ImportError:
    SENTRY_AVAILABLE = False

from app.core.config import get_settings

settings = get_settings()

class MonitoringService:
    """Service de monitoring avec Sentry et logs structurés."""
    
    def __init__(self):
        self.setup_logging()
        self.logger = logging.getLogger("seka")
        self.setup_sentry()
    
    def setup_logging(self):
        """Configure le logging structuré."""
        log_format = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
        
        log_level = logging.DEBUG if settings.debug else logging.INFO
        
        logging.basicConfig(
            level=log_level,
            format=log_format,
            handlers=[
                logging.StreamHandler(sys.stdout),
                logging.FileHandler("seka.log") if not settings.debug else logging.NullHandler()
            ]
        )
        
        logging.getLogger("uvicorn").setLevel(logging.WARNING)
        logging.getLogger("httpx").setLevel(logging.WARNING)
        logging.getLogger("httpcore").setLevel(logging.WARNING)
    
    def setup_sentry(self):
        """Configure Sentry pour le monitoring des erreurs."""
        if not SENTRY_AVAILABLE or not settings.sentry_dsn:
            self.logger.info("⚠️  Sentry non configuré - monitoring local uniquement")
            return
        
        try:
            sentry_sdk.init(
                dsn=settings.sentry_dsn,
                integrations=[
                    FastApiIntegration(),
                    SqlalchemyIntegration(),
                ],
                traces_sample_rate=0.1 if settings.environment == "production" else 1.0,
                environment=settings.environment,
                release=f"seka@1.0.0-alpha",
                before_send=self._filter_sentry_events
            )
            self.logger.info("✅ Sentry configuré avec succès")
            
        except Exception as e:
            self.logger.error(f"❌ Erreur configuration Sentry: {e}")
    
    def _filter_sentry_events(self, event, hint):
        """Filtre les événements Sentry pour éviter le spam."""
        if 'request' in event and '/health' in str(event.get('request', {}).get('url', '')):
            return None
        
        if 'exception' in event:
            for exception in event['exception']['values']:
                exc_type = exception.get('type', '')
                if exc_type in ['HTTPException', 'ValidationError']:
                    return None
        
        return event
    
    def log_api_call(
        self,
        endpoint: str,
        method: str,
        status_code: int,
        duration_ms: float,
        tenant_id: Optional[str] = None,
        user_id: Optional[str] = None
    ):
        """Log un appel API."""
        extra = {
            "endpoint": endpoint,
            "method": method,
            "status_code": status_code,
            "duration_ms": duration_ms,
            "tenant_id": tenant_id,
            "user_id": user_id,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        if status_code >= 400:
            self.logger.warning(f"API {method} {endpoint} - {status_code} ({duration_ms:.2f}ms)", extra=extra)
        else:
            self.logger.info(f"API {method} {endpoint} - {status_code} ({duration_ms:.2f}ms)", extra=extra)
    
    def log_business_event(
        self,
        event_type: str,
        description: str,
        tenant_id: str,
        user_id: Optional[str] = None,
        metadata: Optional[Dict] = None
    ):
        """Log un événement métier important."""
        extra = {
            "event_type": event_type,
            "tenant_id": tenant_id,
            "user_id": user_id,
            "metadata": metadata or {},
            "timestamp": datetime.utcnow().isoformat()
        }
        
        self.logger.info(f"BUSINESS_EVENT: {event_type} - {description}", extra=extra)
        
        if SENTRY_AVAILABLE:
            sentry_sdk.add_breadcrumb(
                message=f"{event_type}: {description}",
                category="business",
                level="info",
                data=extra
            )
    
    def log_error(
        self,
        error: Exception,
        context: str,
        tenant_id: Optional[str] = None,
        user_id: Optional[str] = None,
        extra_data: Optional[Dict] = None
    ):
        """Log une erreur avec contexte."""
        error_data = {
            "context": context,
            "error_type": type(error).__name__,
            "error_message": str(error),
            "tenant_id": tenant_id,
            "user_id": user_id,
            "extra_data": extra_data or {},
            "traceback": traceback.format_exc(),
            "timestamp": datetime.utcnow().isoformat()
        }
        
        self.logger.error(f"ERROR in {context}: {error}", extra=error_data, exc_info=True)
        
        if SENTRY_AVAILABLE:
            with sentry_sdk.configure_scope() as scope:
                if tenant_id:
                    scope.set_tag("tenant_id", tenant_id)
                if user_id:
                    scope.set_tag("user_id", user_id)
                scope.set_context("error_context", error_data)
                
                sentry_sdk.capture_exception(error)
    
    def log_performance_metric(
        self,
        metric_name: str,
        value: float,
        unit: str = "ms",
        tags: Optional[Dict[str, str]] = None
    ):
        """Log une métrique de performance."""
        metric_data = {
            "metric_name": metric_name,
            "value": value,
            "unit": unit,
            "tags": tags or {},
            "timestamp": datetime.utcnow().isoformat()
        }
        
        self.logger.info(f"METRIC: {metric_name} = {value}{unit}", extra=metric_data)
    
    def log_security_event(
        self,
        event_type: str,
        description: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        severity: str = "info"
    ):
        """Log un événement de sécurité."""
        security_data = {
            "event_type": event_type,
            "description": description,
            "ip_address": ip_address,
            "user_agent": user_agent,
            "severity": severity,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        log_level = getattr(logging, severity.upper(), logging.INFO)
        self.logger.log(log_level, f"SECURITY: {event_type} - {description}", extra=security_data)
        
        if severity in ["warning", "error", "critical"] and SENTRY_AVAILABLE:
            sentry_sdk.capture_message(
                f"Security Event: {event_type} - {description}",
                level=severity
            )

    def health_check(self) -> Dict[str, Any]:
        """Vérification de santé du service de monitoring."""
        return {
            "status": "healthy",
            "sentry_configured": SENTRY_AVAILABLE and bool(settings.sentry_dsn),
            "logging_level": logging.getLevelName(self.logger.level),
            "environment": settings.environment
        }

monitoring_service = MonitoringService()