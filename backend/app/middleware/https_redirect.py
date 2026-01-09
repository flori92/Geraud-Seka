"""
Middleware pour forcer HTTPS en production
"""

from fastapi import Request
from fastapi.responses import RedirectResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
from app.core.config import settings


class HTTPSRedirectMiddleware(BaseHTTPMiddleware):
    """Middleware pour rediriger HTTP vers HTTPS en production"""
    
    async def dispatch(self, request: Request, call_next) -> Response:
        if settings.environment == "production":
            forwarded_proto = request.headers.get("x-forwarded-proto")
            forwarded_for = request.headers.get("x-forwarded-for")
            
            if forwarded_proto == "http":
                url = str(request.url)
                https_url = url.replace("http://", "https://", 1)
                return RedirectResponse(url=https_url, status_code=301)
            
            host = request.headers.get("host", "")
            if host and not any(domain in host for domain in ["api.sekagestion.com", "localhost"]):
                url = str(request.url)
                corrected_url = url.replace(f"https://{host}", "https://api.sekagestion.com", 1)
                return RedirectResponse(url=corrected_url, status_code=301)
        
        response = await call_next(request)
        
        if settings.environment == "production":
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
            response.headers["X-Content-Type-Options"] = "nosniff"
            # Ne pas écraser X-Frame-Options si déjà défini (pour permettre le framing sur certains endpoints)
            path = request.url.path
            allow_framing = "/api/v1/documents/download/" in path or "/api/v1/documents/view/" in path
            if not allow_framing:
                response.headers["X-Frame-Options"] = "DENY"
            response.headers["X-XSS-Protection"] = "1; mode=block"
            response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        
        return response