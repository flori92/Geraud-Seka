"""
Service de logging d'audit pour les actions critiques.

Enregistre les actions sensibles pour traçabilité et conformité.
"""
import logging
import json
from datetime import datetime, timezone
from typing import Optional, Any
from enum import Enum

logger = logging.getLogger("seka.audit")


class AuditAction(str, Enum):
    """Types d'actions auditables"""
    # Doublons
    DUPLICATE_DETECTED = "duplicate_detected"
    DUPLICATE_RESOLVED = "duplicate_resolved"
    DUPLICATE_REJECTED = "duplicate_rejected"
    DUPLICATE_KEPT_BOTH = "duplicate_kept_both"
    DUPLICATE_REPLACED = "duplicate_replaced"

    # Documents
    DOCUMENT_UPLOADED = "document_uploaded"
    DOCUMENT_VALIDATED = "document_validated"
    DOCUMENT_DELETED = "document_deleted"

    # Comptabilite
    ENTRY_CREATED = "entry_created"
    ENTRY_VALIDATED = "entry_validated"
    ENTRY_REVERSED = "entry_reversed"

    # Utilisateurs
    USER_LOGIN = "user_login"
    USER_LOGIN_FAILED = "user_login_failed"
    USER_PERMISSION_CHANGED = "user_permission_changed"

    # Export
    EXPORT_GENERATED = "export_generated"


def audit_log(
    action: AuditAction,
    user_id: Optional[str] = None,
    tenant_id: Optional[str] = None,
    resource_type: Optional[str] = None,
    resource_id: Optional[str] = None,
    details: Optional[dict[str, Any]] = None,
    ip_address: Optional[str] = None,
    success: bool = True,
) -> None:
    """
    Enregistre une action d'audit.

    Args:
        action: Type d'action effectuee
        user_id: ID de l'utilisateur effectuant l'action
        tenant_id: ID du tenant concerne
        resource_type: Type de ressource (document, duplicate, entry, etc.)
        resource_id: ID de la ressource concernee
        details: Details supplementaires (dict JSON-serializable)
        ip_address: Adresse IP du client
        success: True si l'action a reussi, False sinon
    """
    audit_entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "action": action.value,
        "user_id": user_id,
        "tenant_id": tenant_id,
        "resource_type": resource_type,
        "resource_id": resource_id,
        "success": success,
        "ip_address": ip_address,
    }

    if details:
        audit_entry["details"] = details

    # Log en format JSON pour faciliter l'analyse
    log_message = json.dumps(audit_entry, ensure_ascii=False, default=str)

    if success:
        logger.info(f"AUDIT: {log_message}")
    else:
        logger.warning(f"AUDIT_FAILED: {log_message}")


def audit_duplicate_resolution(
    duplicate_id: str,
    resolution: str,
    user_id: str,
    tenant_id: str,
    new_document_id: str,
    existing_document_id: str,
    resolution_reason: Optional[str] = None,
    ip_address: Optional[str] = None,
) -> None:
    """
    Log specifique pour la resolution d'un doublon.
    """
    action_map = {
        "rejected": AuditAction.DUPLICATE_REJECTED,
        "kept_both": AuditAction.DUPLICATE_KEPT_BOTH,
        "replaced": AuditAction.DUPLICATE_REPLACED,
    }

    action = action_map.get(resolution, AuditAction.DUPLICATE_RESOLVED)

    audit_log(
        action=action,
        user_id=user_id,
        tenant_id=tenant_id,
        resource_type="duplicate",
        resource_id=duplicate_id,
        details={
            "resolution": resolution,
            "resolution_reason": resolution_reason,
            "new_document_id": new_document_id,
            "existing_document_id": existing_document_id,
        },
        ip_address=ip_address,
        success=True,
    )


def audit_duplicate_detected(
    duplicate_id: str,
    tenant_id: str,
    detection_reason: str,
    new_document_id: str,
    existing_document_id: str,
    supplier_name: Optional[str] = None,
) -> None:
    """
    Log specifique pour la detection d'un doublon.
    """
    audit_log(
        action=AuditAction.DUPLICATE_DETECTED,
        tenant_id=tenant_id,
        resource_type="duplicate",
        resource_id=duplicate_id,
        details={
            "detection_reason": detection_reason,
            "new_document_id": new_document_id,
            "existing_document_id": existing_document_id,
            "supplier_name": supplier_name,
        },
        success=True,
    )
