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
    trigger_config = Column(JSONB, nullable=True)
    conditions = Column(JSONB, nullable=True)
    status = Column(String(32), nullable=False, default=AutomationStatus.DRAFT.value)

    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"))
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Execution metrics (kept as simple ints for compatibility)
    execution_count = Column(Integer, nullable=False, default=0)
    success_count = Column(Integer, nullable=False, default=0)
    error_count = Column(Integer, nullable=False, default=0)
    last_executed_at = Column(DateTime(timezone=True), nullable=True)

    # Relations
    actions = relationship("AutomationAction", back_populates="automation", cascade="all, delete-orphan")
    executions = relationship("AutomationExecution", back_populates="automation", cascade="all, delete-orphan")
    creator = relationship("User", primaryjoin="User.id==Automation.created_by", viewonly=True)


class AutomationAction(Base, TimestampMixin):
    __tablename__ = "automation_actions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    automation_id = Column(UUID(as_uuid=True), ForeignKey("automations.id", ondelete="CASCADE"))
    action_type = Column(String(64), nullable=False)
    config = Column(JSONB, nullable=True)
    order = Column(Integer, nullable=False, default=0)

    automation = relationship("Automation", back_populates="actions")


class AutomationExecution(Base, TimestampMixin):
    __tablename__ = "automation_executions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    automation_id = Column(UUID(as_uuid=True), ForeignKey("automations.id", ondelete="CASCADE"))
    status = Column(String(32), nullable=False)
    run_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    result = Column(JSONB, nullable=True)

    automation = relationship("Automation", back_populates="executions")
