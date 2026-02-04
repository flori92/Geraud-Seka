"""
Custom Exceptions for SEKA Backend

Ce module définit les exceptions personnalisées pour:
- Validation des données
- Authentification/Autorisation
- Ressources non trouvées
- Erreurs métier
- Erreurs de service externe

Usage:
    from app.core.exceptions import NotFoundError, ValidationError

    raise NotFoundError("Client", client_id)
    raise ValidationError("Invalid email format")
"""

from typing import Optional, Any, Dict
from fastapi import HTTPException, status


class SekaException(Exception):
    """
    Exception de base pour SEKA.

    Attributs:
        message: Message d'erreur
        code: Code d'erreur (pour le frontend)
        details: Détails additionnels
    """

    default_message = "Une erreur est survenue"
    error_code = "SEKA_ERROR"
    http_status = status.HTTP_500_INTERNAL_SERVER_ERROR

    def __init__(
        self,
        message: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
    ):
        self.message = message or self.default_message
        self.details = details or {}
        super().__init__(self.message)

    def to_http_exception(self) -> HTTPException:
        """Convertit en HTTPException pour FastAPI."""
        return HTTPException(
            status_code=self.http_status,
            detail={
                "message": self.message,
                "code": self.error_code,
                "details": self.details,
            },
        )


# ============================================
# Validation Errors
# ============================================


class ValidationError(SekaException):
    """Erreur de validation des données."""

    default_message = "Données invalides"
    error_code = "VALIDATION_ERROR"
    http_status = status.HTTP_422_UNPROCESSABLE_ENTITY

    def __init__(
        self,
        message: Optional[str] = None,
        field: Optional[str] = None,
        value: Optional[Any] = None,
    ):
        details = {}
        if field:
            details["field"] = field
        if value is not None:
            details["value"] = str(value)

        super().__init__(message, details)


class MissingFieldError(ValidationError):
    """Champ requis manquant."""

    error_code = "MISSING_FIELD"

    def __init__(self, field: str):
        super().__init__(
            message=f"Le champ '{field}' est requis",
            field=field,
        )


class InvalidFormatError(ValidationError):
    """Format de données invalide."""

    error_code = "INVALID_FORMAT"

    def __init__(self, field: str, expected_format: str, value: Any = None):
        super().__init__(
            message=f"Format invalide pour '{field}'. Attendu: {expected_format}",
            field=field,
            value=value,
        )


# ============================================
# Resource Errors
# ============================================


class NotFoundError(SekaException):
    """Ressource non trouvée."""

    default_message = "Ressource non trouvée"
    error_code = "NOT_FOUND"
    http_status = status.HTTP_404_NOT_FOUND

    def __init__(
        self,
        resource_type: str,
        resource_id: Optional[Any] = None,
    ):
        message = f"{resource_type} non trouvé"
        if resource_id:
            message = f"{resource_type} avec l'ID {resource_id} non trouvé"

        super().__init__(
            message=message,
            details={"resource_type": resource_type, "resource_id": str(resource_id)},
        )


class DuplicateError(SekaException):
    """Ressource déjà existante."""

    default_message = "Cette ressource existe déjà"
    error_code = "DUPLICATE"
    http_status = status.HTTP_409_CONFLICT

    def __init__(
        self,
        resource_type: str,
        field: Optional[str] = None,
        value: Optional[Any] = None,
    ):
        message = f"{resource_type} existe déjà"
        if field and value:
            message = f"{resource_type} avec {field}='{value}' existe déjà"

        super().__init__(
            message=message,
            details={
                "resource_type": resource_type,
                "field": field,
                "value": str(value) if value else None,
            },
        )


# ============================================
# Authentication/Authorization Errors
# ============================================


class AuthenticationError(SekaException):
    """Erreur d'authentification."""

    default_message = "Authentification requise"
    error_code = "AUTHENTICATION_REQUIRED"
    http_status = status.HTTP_401_UNAUTHORIZED


class InvalidCredentialsError(AuthenticationError):
    """Identifiants invalides."""

    default_message = "Email ou mot de passe incorrect"
    error_code = "INVALID_CREDENTIALS"


class TokenExpiredError(AuthenticationError):
    """Token expiré."""

    default_message = "Session expirée, veuillez vous reconnecter"
    error_code = "TOKEN_EXPIRED"


class PermissionDeniedError(SekaException):
    """Accès refusé."""

    default_message = "Vous n'avez pas les permissions nécessaires"
    error_code = "PERMISSION_DENIED"
    http_status = status.HTTP_403_FORBIDDEN

    def __init__(
        self,
        action: Optional[str] = None,
        resource: Optional[str] = None,
    ):
        message = self.default_message
        if action and resource:
            message = f"Vous n'avez pas la permission de {action} {resource}"
        elif action:
            message = f"Vous n'avez pas la permission de {action}"

        super().__init__(
            message=message,
            details={"action": action, "resource": resource},
        )


# ============================================
# Business Logic Errors
# ============================================


class BusinessError(SekaException):
    """Erreur de logique métier."""

    default_message = "Opération non autorisée"
    error_code = "BUSINESS_ERROR"
    http_status = status.HTTP_400_BAD_REQUEST


class InsufficientBalanceError(BusinessError):
    """Solde insuffisant."""

    error_code = "INSUFFICIENT_BALANCE"

    def __init__(self, required: float, available: float):
        super().__init__(
            message=f"Solde insuffisant. Requis: {required}, Disponible: {available}",
            details={"required": required, "available": available},
        )


class InvalidStateError(BusinessError):
    """État invalide pour l'opération."""

    error_code = "INVALID_STATE"

    def __init__(
        self,
        resource_type: str,
        current_state: str,
        required_state: str,
    ):
        super().__init__(
            message=f"{resource_type} doit être en état '{required_state}' (actuellement: '{current_state}')",
            details={
                "resource_type": resource_type,
                "current_state": current_state,
                "required_state": required_state,
            },
        )


class DocumentAlreadyExportedError(BusinessError):
    """Document déjà exporté."""

    error_code = "DOCUMENT_ALREADY_EXPORTED"

    def __init__(self, document_id: str):
        super().__init__(
            message="Ce document a déjà été exporté vers la comptabilité",
            details={"document_id": document_id},
        )


# ============================================
# External Service Errors
# ============================================


class ExternalServiceError(SekaException):
    """Erreur de service externe."""

    default_message = "Erreur de service externe"
    error_code = "EXTERNAL_SERVICE_ERROR"
    http_status = status.HTTP_502_BAD_GATEWAY

    def __init__(
        self,
        service_name: str,
        original_error: Optional[str] = None,
    ):
        message = f"Erreur du service {service_name}"
        if original_error:
            message = f"{message}: {original_error}"

        super().__init__(
            message=message,
            details={"service": service_name, "original_error": original_error},
        )


class OCRServiceError(ExternalServiceError):
    """Erreur du service OCR."""

    error_code = "OCR_SERVICE_ERROR"

    def __init__(self, original_error: Optional[str] = None):
        super().__init__("OCR", original_error)


class PaymentServiceError(ExternalServiceError):
    """Erreur du service de paiement."""

    error_code = "PAYMENT_SERVICE_ERROR"

    def __init__(self, provider: str, original_error: Optional[str] = None):
        super().__init__(f"Paiement ({provider})", original_error)


# ============================================
# Rate Limiting
# ============================================


class RateLimitError(SekaException):
    """Limite de requêtes atteinte."""

    default_message = "Trop de requêtes. Veuillez réessayer plus tard."
    error_code = "RATE_LIMIT_EXCEEDED"
    http_status = status.HTTP_429_TOO_MANY_REQUESTS

    def __init__(self, retry_after: Optional[int] = None):
        details = {}
        if retry_after:
            details["retry_after_seconds"] = retry_after

        super().__init__(details=details)
