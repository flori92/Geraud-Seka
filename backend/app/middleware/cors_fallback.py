"""
CORS Fallback Middleware
Ensures CORS headers are always present, even if the main CORSMiddleware
doesn't add them (e.g., due to errors or Cloudflare interference).
"""

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from typing import List


class CORSFallbackMiddleware(BaseHTTPMiddleware):
    """
    Fallback middleware that ensures CORS headers are always present.
    This is a safety net in case the main CORSMiddleware fails to add headers
    (e.g., during error responses or when Cloudflare strips them).
    """

    def __init__(self, app, allowed_origins: List[str]):
        super().__init__(app)
        self.allowed_origins = set(allowed_origins)

    async def dispatch(self, request: Request, call_next):
        origin = request.headers.get("origin", "")
        
        response = await call_next(request)
        
        # Only add CORS headers if they're not already present
        if "Access-Control-Allow-Origin" not in response.headers:
            if origin in self.allowed_origins:
                response.headers["Access-Control-Allow-Origin"] = origin
                response.headers["Access-Control-Allow-Credentials"] = "true"
                response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
                response.headers["Access-Control-Allow-Headers"] = "Accept, Accept-Language, Content-Language, Content-Type, Authorization, X-Requested-With, X-CSRF-Token, Cache-Control, Pragma, Origin, User-Agent, Referer"
        
        return response
