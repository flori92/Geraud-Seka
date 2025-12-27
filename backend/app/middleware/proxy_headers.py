"""
Proxy Headers Middleware
Handles X-Forwarded-* headers from reverse proxies (Cloudflare, Railway, etc.)
This ensures FastAPI knows the original protocol (HTTPS) when behind a proxy.
"""

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.types import ASGIApp


class ProxyHeadersMiddleware(BaseHTTPMiddleware):
    """
    Middleware to handle proxy headers for applications behind reverse proxies.

    This middleware reads X-Forwarded-* headers and updates the request scope
    so that FastAPI/Starlette correctly identifies the original protocol, host, and client IP.

    This prevents HTTPS→HTTP redirect loops when the app is behind Cloudflare/Railway.
    """

    def __init__(self, app: ASGIApp):
        super().__init__(app)

    async def dispatch(self, request: Request, call_next):
        forwarded_proto = request.headers.get("X-Forwarded-Proto")
        if forwarded_proto:
            request.scope["scheme"] = forwarded_proto

        forwarded_host = request.headers.get("X-Forwarded-Host")
        if forwarded_host:
            pass  # Starlette handles this automatically

        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            client_ip = forwarded_for.split(",")[0].strip()
            if request.client:
                request.scope["client"] = (client_ip, request.client.port)

        response = await call_next(request)

        if response.status_code in (301, 302, 303, 307, 308):
            location = response.headers.get("location")
            if location and forwarded_proto == "https" and location.startswith("http://"):
                fixed_location = location.replace("http://", "https://", 1)
                response.headers["location"] = fixed_location

        return response
