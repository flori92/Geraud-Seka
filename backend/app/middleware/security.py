import time
import hashlib
import logging
from typing import Dict, Callable
from collections import defaultdict
from datetime import datetime, timedelta

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger(__name__)


class RateLimiter:
    def __init__(self, requests_per_minute: int = 60, requests_per_hour: int = 1000):
        self.requests_per_minute = requests_per_minute
        self.requests_per_hour = requests_per_hour
        self.minute_requests: Dict[str, list] = defaultdict(list)
        self.hour_requests: Dict[str, list] = defaultdict(list)
    
    def _cleanup_old_requests(self, requests: list, max_age_seconds: int) -> list:
        cutoff = time.time() - max_age_seconds
        return [r for r in requests if r > cutoff]
    
    def is_rate_limited(self, client_id: str) -> tuple[bool, str]:
        now = time.time()
        self.minute_requests[client_id] = self._cleanup_old_requests(
            self.minute_requests[client_id], 60
        )
        if len(self.minute_requests[client_id]) >= self.requests_per_minute:
            return True, "Too many requests per minute"
        self.hour_requests[client_id] = self._cleanup_old_requests(
            self.hour_requests[client_id], 3600
        )
        if len(self.hour_requests[client_id]) >= self.requests_per_hour:
            return True, "Too many requests per hour"
        self.minute_requests[client_id].append(now)
        self.hour_requests[client_id].append(now)
        
        return False, ""


class SecurityMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, environment: str = "production"):
        super().__init__(app)
        self.environment = environment
        self.rate_limiter = RateLimiter(requests_per_minute=100, requests_per_hour=2000)
        self.rate_limit_exemptions = {
            "/health",
            "/health/live",
            "/health/ready",
            "/api/v1/auth/login",
        }
        self.sensitive_endpoints = {
            "/api/v1/auth/",
            "/api/v1/billing/",
            "/api/v1/settings/",
        }
    
    def _get_client_identifier(self, request: Request) -> str:
        forwarded_for = request.headers.get("x-forwarded-for", "")
        real_ip = request.headers.get("x-real-ip", "")
        client_ip = forwarded_for.split(",")[0].strip() if forwarded_for else real_ip or request.client.host
        user_agent = request.headers.get("user-agent", "unknown")[:100]
        raw = f"{client_ip}:{user_agent}"
        return hashlib.sha256(raw.encode()).hexdigest()[:16]
    
    def _add_security_headers(self, response: Response, request: Request) -> None:
        # Permettre le framing pour les endpoints de téléchargement de documents
        path = request.url.path
        allow_framing = (
            "/api/v1/documents/download/" in path or
            "/api/v1/documents/view/" in path
        )
        
        if allow_framing:
            response.headers["X-Frame-Options"] = "SAMEORIGIN"
            response.headers["Content-Security-Policy"] = "default-src 'self'; frame-ancestors 'self'"
        else:
            response.headers["X-Frame-Options"] = "DENY"
            response.headers["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none'"
        
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
        response.headers["X-Powered-By"] = ""
        response.headers["Server"] = "SEKA"
        if "Cache-Control" not in response.headers:
            response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, private"
            response.headers["Pragma"] = "no-cache"
    
    def _is_suspicious_request(self, request: Request) -> tuple[bool, str]:
        path = request.url.path.lower()
        query = str(request.url.query).lower()
        sql_patterns = ["'--", "' or ", "1=1", "drop table", "union select", ";--"]
        for pattern in sql_patterns:
            if pattern in path or pattern in query:
                return True, "Suspicious SQL pattern detected"
        if ".." in path or "%2e%2e" in path.lower():
            return True, "Path traversal attempt"
        attack_paths = ["/wp-admin", "/phpmyadmin", "/.env", "/.git", "/actuator", "/swagger"]
        for attack_path in attack_paths:
            if path.startswith(attack_path):
                return True, "Blocked path"
        return False, ""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start_time = time.time()
        client_id = self._get_client_identifier(request)
        path = request.url.path
        
        if path in {"/health", "/health/live", "/health/ready", "/"}:
            response = await call_next(request)
            self._add_security_headers(response, request)
            return response
        
        is_suspicious, reason = self._is_suspicious_request(request)
        if is_suspicious:
            logger.warning(f"🚨 Blocked suspicious request from {client_id}: {reason} - {path}")
            response = Response(
                content='{"error": "Forbidden"}',
                status_code=403,
                media_type="application/json"
            )
            self._add_security_headers(response, request)
            return response
        
        if path not in self.rate_limit_exemptions:
            is_limited, limit_reason = self.rate_limiter.is_rate_limited(client_id)
            if is_limited:
                logger.warning(f"⚠️ Rate limited client {client_id}: {limit_reason}")
                response = Response(
                    content='{"error": "Too many requests. Please slow down."}',
                    status_code=429,
                    media_type="application/json"
                )
                response.headers["Retry-After"] = "60"
                self._add_security_headers(response, request)
                return response
        
        try:
            response = await call_next(request)
        except Exception as e:
            logger.error(f"Request error for {client_id} on {path}: {type(e).__name__}")
            response = Response(
                content='{"error": "An error occurred processing your request"}',
                status_code=500,
                media_type="application/json"
            )
        
        self._add_security_headers(response, request)
        duration = time.time() - start_time
        if duration > 5.0:
            logger.warning(f"⏱️ Slow request: {path} took {duration:.2f}s")
        
        return response


class RequestValidationMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        if request.method in {"POST", "PUT", "PATCH"}:
            content_type = request.headers.get("content-type", "")
            if content_type and not any(ct in content_type for ct in ["application/json", "multipart/form-data", "application/x-www-form-urlencoded"]):
                return Response(
                    content='{"error": "Unsupported Content-Type"}',
                    status_code=415,
                    media_type="application/json"
                )
        
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > 10 * 1024 * 1024:
            return Response(
                content='{"error": "Request too large"}',
                status_code=413,
                media_type="application/json"
            )
        
        return await call_next(request)
