"""
Modèles CRM - Compatibilité minimale

Ce fichier fournit des définitions minimales pour certains symboles
utilisés par des routes / migrations historiques (p.ex. `Automation`).
Ces implémentations sont intentionnellement légères : elles existent
uniquement pour rétablir les imports et permettre le démarrage de
l'application et des migrations. Ne pas utiliser ces modèles pour
nouveau code métier sans les remplacer par une implémentation complète.
"""

import uuid
from enum import Enum
from datetime import datetime

from sqlalchemy import (
    Column,
    String,
    Integer,
    ForeignKey,
    DateTime,
    Date,
    Boolean,
    Text,
    Numeric,
    func,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

from app.db.base import Base, TimestampMixin


# ========== Enums (petites valeurs) ==========
class AutomationTriggerType(Enum):
    MANUAL = "manual"
    SCHEDULE = "schedule"
    EVENT = "event"


class AutomationActionType(Enum):
    WEBHOOK = "webhook"
    EMAIL = "email"
    CREATE_LEAD = "create_lead"


class AutomationStatus(Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    PAUSED = "paused"
    DISABLED = "disabled"


# ========== Minimal ORM models ==========
class Automation(Base, TimestampMixin):
    __tablename__ = "automations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    description = Column(String(1024), nullable=True)
    trigger_type = Column(String(64), nullable=False, default=AutomationTriggerType.MANUAL.value)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    """
    Modèles CRM - DEPRECATED ET SUPPRIMÉS

    Les modules CRM suivants ont été supprimés en date du 2025-12-14:
    - Lead
    - Opportunity
    - CRMActivity
    - EmailCampaign
    - EmailCampaignRecipient

    Code remnant only for migration compatibility.
    À ne pas utiliser en nouveau code.
    """

    # This file is kept for import compatibility only during migrations
    # All CRM models have been permanently removed from SEKA
    creator = relationship("User", primaryjoin="User.id==Automation.created_by", viewonly=True)
