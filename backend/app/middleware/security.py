"""Security Middleware - Protection headers, rate limiting, request validation"""

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
    """Simple in-memory rate limiter."""
    
    def __init__(self, requests_per_minute: int = 60, requests_per_hour: int = 1000):
        self.requests_per_minute = requests_per_minute
        self.requests_per_hour = requests_per_hour
        self.minute_requests: Dict[str, list] = defaultdict(list)
        self.hour_requests: Dict[str, list] = defaultdict(list)
    
    def _cleanup_old_requests(self, requests: list, max_age_seconds: int) -> list:
        """Remove requests older than max_age_seconds."""
        cutoff = time.time() - max_age_seconds
        return [r for r in requests if r > cutoff]
    
    def is_rate_limited(self, client_id: str) -> tuple[bool, str]:
        """Check if client is rate limited. Returns (is_limited, reason)."""
        now = time.time()
        
        # Cleanup and check minute limit
        self.minute_requests[client_id] = self._cleanup_old_requests(
            self.minute_requests[client_id], 60
        )
        if len(self.minute_requests[client_id]) >= self.requests_per_minute:
            return True, "Too many requests per minute"
        
        # Cleanup and check hour limit
        self.hour_requests[client_id] = self._cleanup_old_requests(
            self.hour_requests[client_id], 3600
        )
        if len(self.hour_requests[client_id]) >= self.requests_per_hour:
            return True, "Too many requests per hour"
        
        # Record this request
        self.minute_requests[client_id].append(now)
        self.hour_requests[client_id].append(now)
        
        return False, ""


class SecurityMiddleware(BaseHTTPMiddleware):
    """
    Middleware de sécurité pour SEKA.
    
    - Ajoute les headers de sécurité (CSP, X-Frame-Options, etc.)
    - Rate limiting par IP/token
    - Validation des requêtes
    - Masquage des informations sensibles
    """
    
    def __init__(self, app, environment: str = "production"):
        super().__init__(app)
        self.environment = environment
        self.rate_limiter = RateLimiter(
            requests_per_minute=100,  # 100 req/min par client
            requests_per_hour=2000    # 2000 req/h par client
        )
        # Endpoints exemptés du rate limiting strict
        self.rate_limit_exemptions = {
            "/health",
            "/health/live",
            "/health/ready",
            "/api/v1/auth/login",
        }
        # Endpoints sensibles nécessitant une protection accrue
        self.sensitive_endpoints = {
            "/api/v1/auth/",
            "/api/v1/billing/",
            "/api/v1/settings/",
        }
    
    def _get_client_identifier(self, request: Request) -> str:
        """Generate a unique client identifier from IP + User-Agent."""
        # Get real IP behind proxy
        forwarded_for = request.headers.get("x-forwarded-for", "")
        real_ip = request.headers.get("x-real-ip", "")
        client_ip = forwarded_for.split(",")[0].strip() if forwarded_for else real_ip or request.client.host
        
        # Combine with user agent for uniqueness
        user_agent = request.headers.get("user-agent", "unknown")[:100]
        
        # Hash to anonymize
        raw = f"{client_ip}:{user_agent}"
        return hashlib.sha256(raw.encode()).hexdigest()[:16]
    
    def _add_security_headers(self, response: Response) -> None:
        """Add security headers to response."""
        # Prevent clickjacking
        response.headers["X-Frame-Options"] = "DENY"
        
        # XSS Protection
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        
        # Referrer Policy
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        
        # Permissions Policy (restrict browser features)
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        
        # Content Security Policy (API - relaxed for JSON responses)
        response.headers["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none'"
        
        # Strict Transport Security (HTTPS only)
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
        
        # Hide server information
        response.headers["X-Powered-By"] = ""
        response.headers["Server"] = "SEKA"
        
        # Cache control for API responses
        if "Cache-Control" not in response.headers:
            response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, private"
            response.headers["Pragma"] = "no-cache"
    
    def _is_suspicious_request(self, request: Request) -> tuple[bool, str]:
        """Detect potentially malicious requests."""
        path = request.url.path.lower()
        query = str(request.url.query).lower()
        
        # SQL injection patterns
        sql_patterns = ["'--", "' or ", "1=1", "drop table", "union select", ";--"]
        for pattern in sql_patterns:
            if pattern in path or pattern in query:
                return True, "Suspicious SQL pattern detected"
        
        # Path traversal
        if ".." in path or "%2e%2e" in path.lower():
            return True, "Path traversal attempt"
        
        # Common attack paths
        attack_paths = ["/wp-admin", "/phpmyadmin", "/.env", "/.git", "/actuator", "/swagger"]
        for attack_path in attack_paths:
            if path.startswith(attack_path):
                return True, "Blocked path"
        
        return False, ""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start_time = time.time()
        client_id = self._get_client_identifier(request)
        path = request.url.path
        
        # Skip security checks for health endpoints
        if path in {"/health", "/health/live", "/health/ready", "/"}:
            response = await call_next(request)
            self._add_security_headers(response)
            return response
        
        # Check for suspicious requests
        is_suspicious, reason = self._is_suspicious_request(request)
        if is_suspicious:
            logger.warning(f"🚨 Blocked suspicious request from {client_id}: {reason} - {path}")
            response = Response(
                content='{"error": "Forbidden"}',
                status_code=403,
                media_type="application/json"
            )
            self._add_security_headers(response)
            return response
        
        # Rate limiting (skip exempted endpoints)
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
                self._add_security_headers(response)
                return response
        
        # Process request
        try:
            response = await call_next(request)
        except Exception as e:
            # Log error but don't expose details
            logger.error(f"Request error for {client_id} on {path}: {type(e).__name__}")
            response = Response(
                content='{"error": "An error occurred processing your request"}',
                status_code=500,
                media_type="application/json"
            )
        
        # Add security headers
        self._add_security_headers(response)
        
        # Log slow requests
        duration = time.time() - start_time
        if duration > 5.0:
            logger.warning(f"⏱️ Slow request: {path} took {duration:.2f}s")
        
        return response


class RequestValidationMiddleware(BaseHTTPMiddleware):
    """Validate incoming requests for common issues."""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Check Content-Type for POST/PUT/PATCH
        if request.method in {"POST", "PUT", "PATCH"}:
            content_type = request.headers.get("content-type", "")
            # Allow multipart for file uploads, JSON for API calls
            if content_type and not any(ct in content_type for ct in ["application/json", "multipart/form-data", "application/x-www-form-urlencoded"]):
                return Response(
                    content='{"error": "Unsupported Content-Type"}',
                    status_code=415,
                    media_type="application/json"
                )
        
        # Check request size (10MB max)
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > 10 * 1024 * 1024:
            return Response(
                content='{"error": "Request too large"}',
                status_code=413,
                media_type="application/json"
            )
        
        return await call_next(request)
