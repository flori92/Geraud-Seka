"""Middleware de monitoring pour les requêtes API."""

import time
from typing import Callable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from app.services.monitoring import monitoring_service


class MonitoringMiddleware(BaseHTTPMiddleware):
    """Middleware pour logger automatiquement toutes les requêtes API."""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Traite les requêtes et log les métriques."""
        start_time = time.time()
        
        method = request.method
        path = request.url.path
        ip_address = self._get_client_ip(request)
        user_agent = request.headers.get("user-agent", "")
        
        tenant_id = None
        user_id = None
        
        auth_header = request.headers.get("authorization", "")
        if auth_header.startswith("Bearer "):
            try:
                pass
            except Exception:
                pass
        
        try:
            response = await call_next(request)
            status_code = response.status_code
            
        except Exception as e:
            monitoring_service.log_error(
                error=e,
                context=f"{method} {path}",
                tenant_id=tenant_id,
                user_id=user_id,
                extra_data={
                    "ip_address": ip_address,
                    "user_agent": user_agent
                }
            )
            
            raise e
        
        duration_ms = (time.time() - start_time) * 1000

        response.headers["X-Process-Time"] = f"{duration_ms/1000:.6f}"
        
        monitoring_service.log_api_call(
            endpoint=path,
            method=method,
            status_code=status_code,
            duration_ms=duration_ms,
            tenant_id=tenant_id,
            user_id=user_id
        )
        
        if duration_ms > 1000:  # Plus de 1 seconde
            monitoring_service.log_performance_metric(
                metric_name="slow_request",
                value=duration_ms,
                unit="ms",
                tags={
                    "endpoint": path,
                    "method": method,
                    "status_code": str(status_code)
                }
            )
        
        self._log_security_events(request, response, ip_address, user_agent)
        
        return response
    
    def _get_client_ip(self, request: Request) -> str:
        """Extrait l'IP réelle du client."""
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("x-real-ip")
        if real_ip:
            return real_ip
        
        return request.client.host if request.client else "unknown"
    
    def _log_security_events(
        self, 
        request: Request, 
        response: Response, 
        ip_address: str, 
        user_agent: str
    ):
        """Log les événements de sécurité importants."""
        path = request.url.path
        method = request.method
        status_code = response.status_code
        
        if path in ["/api/v1/auth/login", "/api/v1/auth/register"]:
            if status_code == 401:
                monitoring_service.log_security_event(
                    event_type="failed_login",
                    description=f"Échec de connexion depuis {ip_address}",
                    ip_address=ip_address,
                    user_agent=user_agent,
                    severity="warning"
                )
            elif status_code == 200:
                monitoring_service.log_security_event(
                    event_type="successful_login",
                    description=f"Connexion réussie depuis {ip_address}",
                    ip_address=ip_address,
                    user_agent=user_agent,
                    severity="info"
                )
        
        if status_code == 403:
            monitoring_service.log_security_event(
                event_type="access_forbidden",
                description=f"Accès interdit: {method} {path}",
                ip_address=ip_address,
                user_agent=user_agent,
                severity="warning"
            )
        
        if status_code == 404 and method in ["GET", "POST"]:
            monitoring_service.log_security_event(
                event_type="not_found_access",
                description=f"Tentative d'accès à une ressource inexistante: {path}",
                ip_address=ip_address,
                user_agent=user_agent,
                severity="info"
            )
        
        if 500 <= status_code < 600:
            monitoring_service.log_security_event(
                event_type="server_error",
                description=f"Erreur serveur: {method} {path} - {status_code}",
                ip_address=ip_address,
                user_agent=user_agent,
                severity="error"
            )