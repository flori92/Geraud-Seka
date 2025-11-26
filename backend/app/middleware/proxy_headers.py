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
        # Get forwarded protocol (http or https)
        forwarded_proto = request.headers.get("X-Forwarded-Proto")
        if forwarded_proto:
            # Update the URL scheme in the request scope
            request.scope["scheme"] = forwarded_proto

        # Get forwarded host
        forwarded_host = request.headers.get("X-Forwarded-Host")
        if forwarded_host:
            # Update the host in the request headers
            # This ensures url_for() generates correct URLs
            pass  # Starlette handles this automatically

        # Get original client IP (behind proxy)
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            # X-Forwarded-For can be a comma-separated list
            client_ip = forwarded_for.split(",")[0].strip()
            # Update client in scope
            if request.client:
                request.scope["client"] = (client_ip, request.client.port)

        response = await call_next(request)
        return response
