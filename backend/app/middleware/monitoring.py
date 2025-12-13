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
        
        # Extraire les informations de la requête
        method = request.method
        path = request.url.path
        ip_address = self._get_client_ip(request)
        user_agent = request.headers.get("user-agent", "")
        
        # Extraire tenant_id et user_id si disponibles
        tenant_id = None
        user_id = None
        
        # Essayer d'extraire du token JWT ou headers
        auth_header = request.headers.get("authorization", "")
        if auth_header.startswith("Bearer "):
            try:
                # Ici on pourrait décoder le JWT pour extraire tenant_id/user_id
                # Pour l'instant on skip pour éviter les dépendances circulaires
                pass
            except Exception:
                pass
        
        # Traitement de la requête
        try:
            response = await call_next(request)
            status_code = response.status_code
            
        except Exception as e:
            # Log l'erreur
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
            
            # Re-lever l'exception
            raise e
        
        # Calculer la durée
        duration_ms = (time.time() - start_time) * 1000

        response.headers["X-Process-Time"] = f"{duration_ms/1000:.6f}"
        
        # Logger la requête
        monitoring_service.log_api_call(
            endpoint=path,
            method=method,
            status_code=status_code,
            duration_ms=duration_ms,
            tenant_id=tenant_id,
            user_id=user_id
        )
        
        # Logger les métriques de performance pour les requêtes lentes
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
        
        # Logger les événements de sécurité pour certaines actions
        self._log_security_events(request, response, ip_address, user_agent)
        
        return response
    
    def _get_client_ip(self, request: Request) -> str:
        """Extrait l'IP réelle du client."""
        # Vérifier les headers de proxy
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("x-real-ip")
        if real_ip:
            return real_ip
        
        # Fallback sur l'IP de connexion
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
        
        # Tentatives de connexion
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
        
        # Erreurs 4xx suspectes
        if status_code == 403:
            monitoring_service.log_security_event(
                event_type="access_forbidden",
                description=f"Accès interdit: {method} {path}",
                ip_address=ip_address,
                user_agent=user_agent,
                severity="warning"
            )
        
        # Erreurs 404 répétées (possible scanning)
        if status_code == 404 and method in ["GET", "POST"]:
            monitoring_service.log_security_event(
                event_type="not_found_access",
                description=f"Tentative d'accès à une ressource inexistante: {path}",
                ip_address=ip_address,
                user_agent=user_agent,
                severity="info"
            )
        
        # Erreurs 5xx (problèmes serveur)
        if 500 <= status_code < 600:
            monitoring_service.log_security_event(
                event_type="server_error",
                description=f"Erreur serveur: {method} {path} - {status_code}",
                ip_address=ip_address,
                user_agent=user_agent,
                severity="error"
            )