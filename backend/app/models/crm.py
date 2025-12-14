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


class Lead(Base, TimestampMixin):
    __tablename__ = "leads"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    full_name = Column(String(255))

    email = Column(String(255), nullable=False)
    phone = Column(String(20))
    mobile = Column(String(20))

    company = Column(String(255))
    job_title = Column(String(100))
    industry = Column(String(100))
    company_size = Column(String(50))
    annual_revenue = Column(String(50))

    address = Column(Text)
    city = Column(String(100))
    country = Column(String(100))

    status = Column(String(20), nullable=False, default="new")
    source = Column(String(50), nullable=False, default="direct")
    score = Column(Integer, default=0)
    quality_grade = Column(String(2))

    email_opens = Column(Integer, default=0)
    email_clicks = Column(Integer, default=0)
    website_visits = Column(Integer, default=0)

    last_activity_date = Column(DateTime)
    budget_range = Column(String(50))
    timeline = Column(String(50))
    pain_points = Column(JSONB)
    last_contact_date = Column(DateTime)
    next_action_date = Column(DateTime)

    notes = Column(Text)
    tags = Column(JSONB)

    converted_at = Column(DateTime)
    converted_to_client_id = Column(UUID(as_uuid=True), ForeignKey("clients.id"))
    conversion_value = Column(Numeric(15, 2))

    assigned_to = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)

    assignee = relationship("User", back_populates="assigned_leads", foreign_keys=[assigned_to])


class Opportunity(Base, TimestampMixin):
    __tablename__ = "opportunities"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    name = Column(String(255), nullable=False)
    description = Column(Text)
    reference = Column(String(100), unique=True)

    amount = Column(Numeric(15, 2), nullable=False)
    currency = Column(String(3), default="XOF")
    probability = Column(Integer, default=50)

    stage = Column(String(50), nullable=False, default="qualification")
    stage_changed_at = Column(DateTime, default=func.now())
    created_date = Column(Date, default=func.current_date())

    expected_close_date = Column(Date)
    actual_close_date = Column(Date)
    last_activity_date = Column(DateTime)

    products_interested = Column(JSONB)
    requirements = Column(Text)
    budget_confirmed = Column(Boolean, default=False)
    decision_maker_identified = Column(Boolean, default=False)
    competitors = Column(JSONB)
    competitive_advantage = Column(Text)
    forecast_category = Column(String(20), default="pipeline")
    next_action = Column(Text)
    loss_reason = Column(String(255))

    lead_id = Column(UUID(as_uuid=True), ForeignKey("leads.id"))
    client_id = Column(UUID(as_uuid=True), ForeignKey("clients.id"))

    assigned_to = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)

    assignee = relationship("User", back_populates="assigned_opportunities", foreign_keys=[assigned_to])
    client = relationship("Client", back_populates="opportunities", foreign_keys=[client_id])
    quotes = relationship("Quote", back_populates="opportunity", foreign_keys="Quote.opportunity_id")


class CRMActivity(Base, TimestampMixin):
    __tablename__ = "crm_activities"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    type = Column(String(50), nullable=False, default="note")
    subject = Column(String(255), nullable=False)
    description = Column(Text)

    due_date = Column(DateTime)
    duration_minutes = Column(Integer)

    is_completed = Column(Boolean, default=False)
    completed_at = Column(DateTime)

    priority = Column(String(20), default="medium")
    outcome = Column(String(50))
    next_action_required = Column(Boolean, default=False)
    next_action_description = Column(Text)

    call_duration = Column(Integer)
    email_opened = Column(Boolean)
    meeting_attended = Column(Boolean)

    lead_id = Column(UUID(as_uuid=True), ForeignKey("leads.id"))
    client_id = Column(UUID(as_uuid=True), ForeignKey("clients.id"))
    opportunity_id = Column(UUID(as_uuid=True), ForeignKey("opportunities.id"))

    assigned_to = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)

    client = relationship("Client", back_populates="crm_activities", foreign_keys=[client_id])
