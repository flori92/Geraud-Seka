"""
Configuration centralisée du logging pour SEKA Backend.

Usage:
    from app.core.logging import get_logger
    logger = get_logger(__name__)

    logger.info("Message info")
    logger.warning("Message warning")
    logger.error("Message error")
    logger.exception("Exception avec traceback")  # Dans un bloc except
"""

import logging
import sys
from typing import Optional
from functools import lru_cache

from app.core.config import get_settings


class SekaFormatter(logging.Formatter):
    """Formatter personnalisé avec couleurs pour le développement."""

    COLORS = {
        'DEBUG': '\033[36m',     # Cyan
        'INFO': '\033[32m',      # Green
        'WARNING': '\033[33m',   # Yellow
        'ERROR': '\033[31m',     # Red
        'CRITICAL': '\033[35m',  # Magenta
    }
    RESET = '\033[0m'

    def __init__(self, use_colors: bool = True):
        super().__init__()
        self.use_colors = use_colors

    def format(self, record: logging.LogRecord) -> str:
        # Format de base
        timestamp = self.formatTime(record, "%Y-%m-%d %H:%M:%S")
        level = record.levelname
        name = record.name
        message = record.getMessage()

        # Ajouter le contexte (tenant_id, user_id si disponible)
        context = ""
        if hasattr(record, 'tenant_id') and record.tenant_id:
            context += f" tenant={record.tenant_id}"
        if hasattr(record, 'user_id') and record.user_id:
            context += f" user={record.user_id}"
        if hasattr(record, 'request_id') and record.request_id:
            context += f" req={record.request_id}"

        # Format final
        if self.use_colors and sys.stderr.isatty():
            color = self.COLORS.get(level, '')
            formatted = f"{timestamp} {color}{level:8}{self.RESET} [{name}]{context} {message}"
        else:
            formatted = f"{timestamp} {level:8} [{name}]{context} {message}"

        # Ajouter l'exception si présente
        if record.exc_info:
            formatted += "\n" + self.formatException(record.exc_info)

        return formatted


class ContextAdapter(logging.LoggerAdapter):
    """Adapter pour ajouter du contexte aux logs (tenant_id, user_id, etc.)."""

    def process(self, msg, kwargs):
        extra = kwargs.get('extra', {})
        extra.update(self.extra)
        kwargs['extra'] = extra
        return msg, kwargs


def setup_logging() -> None:
    """Configure le logging pour l'application."""
    settings = get_settings()

    # Niveau de log basé sur l'environnement
    if settings.environment in ("production", "prod"):
        log_level = logging.INFO
        use_colors = False
    elif settings.environment == "staging":
        log_level = logging.INFO
        use_colors = False
    else:
        log_level = logging.DEBUG if settings.debug else logging.INFO
        use_colors = True

    # Configurer le handler console
    console_handler = logging.StreamHandler(sys.stderr)
    console_handler.setFormatter(SekaFormatter(use_colors=use_colors))
    console_handler.setLevel(log_level)

    # Configurer le logger racine
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)
    root_logger.handlers.clear()
    root_logger.addHandler(console_handler)

    # Réduire le bruit des librairies tierces
    logging.getLogger("uvicorn").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)

    # Logger principal de l'app
    app_logger = logging.getLogger("app")
    app_logger.setLevel(log_level)

    app_logger.info(
        f"Logging configured: level={logging.getLevelName(log_level)}, "
        f"env={settings.environment}"
    )


@lru_cache(maxsize=128)
def get_logger(name: str) -> logging.Logger:
    """
    Récupère un logger configuré pour un module donné.

    Args:
        name: Nom du module (généralement __name__)

    Returns:
        Logger configuré

    Example:
        logger = get_logger(__name__)
        logger.info("Message")
    """
    return logging.getLogger(name)


def get_context_logger(
    name: str,
    tenant_id: Optional[str] = None,
    user_id: Optional[str] = None,
    request_id: Optional[str] = None,
) -> ContextAdapter:
    """
    Récupère un logger avec contexte (tenant, user, request).

    Args:
        name: Nom du module
        tenant_id: ID du tenant
        user_id: ID de l'utilisateur
        request_id: ID de la requête

    Returns:
        Logger avec contexte

    Example:
        logger = get_context_logger(__name__, tenant_id="123", user_id="456")
        logger.info("Action effectuée")  # Inclura automatiquement tenant et user
    """
    base_logger = get_logger(name)
    extra = {}
    if tenant_id:
        extra['tenant_id'] = tenant_id
    if user_id:
        extra['user_id'] = user_id
    if request_id:
        extra['request_id'] = request_id

    return ContextAdapter(base_logger, extra)
