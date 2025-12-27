"""
Modèles pour les notifications, tâches planifiées et intégrations
"""

import uuid
import enum
from datetime import datetime
from sqlalchemy import Column, ForeignKey, String, Text, Boolean, Integer, DateTime, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base import Base, TimestampMixin



class NotificationType(str, enum.Enum):
    """Types de notifications"""
    INFO = "info"
    SUCCESS = "success"
    WARNING = "warning"
    ERROR = "error"
    LEAD = "lead"
    OPPORTUNITY = "opportunity"
    TASK = "task"
    EMAIL = "email"
    SYSTEM = "system"


class NotificationChannel(str, enum.Enum):
    """Canaux de notification"""
    IN_APP = "in_app"
    EMAIL = "email"
    SLACK = "slack"
    WEBHOOK = "webhook"
    SMS = "sms"


class Notification(Base, TimestampMixin):
    """
    Notifications utilisateur
    Pour les alertes en temps réel
    """
    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    title = Column(String(200), nullable=False)
    message = Column(Text)
    type = Column(String(20), default=NotificationType.INFO)
    
    entity_type = Column(String(50))  # lead, opportunity, task, etc.
    entity_id = Column(UUID(as_uuid=True))
    action_url = Column(String(500))  # URL pour l'action
    
    is_read = Column(Boolean, default=False)
    read_at = Column(DateTime)
    
    data = Column(JSON)  # Données supplémentaires
    
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    
    user = relationship("User", backref="notifications")
    tenant = relationship("Tenant")



class ScheduledTaskStatus(str, enum.Enum):
    """Statuts d'une tâche planifiée"""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class ScheduledTaskType(str, enum.Enum):
    """Types de tâches planifiées"""
    SEND_CAMPAIGN = "send_campaign"
    RUN_AUTOMATION = "run_automation"
    GENERATE_REPORT = "generate_report"
    SEND_REMINDER = "send_reminder"
    CLEANUP = "cleanup"
    SYNC = "sync"
    CUSTOM = "custom"


class ScheduledTask(Base, TimestampMixin):
    """
    Tâches planifiées
    Pour l'exécution différée d'actions
    """
    __tablename__ = "scheduled_tasks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    name = Column(String(200), nullable=False)
    description = Column(Text)
    task_type = Column(String(50), nullable=False)
    
    scheduled_at = Column(DateTime, nullable=False, index=True)
    executed_at = Column(DateTime)
    
    is_recurring = Column(Boolean, default=False)
    cron_expression = Column(String(100))  # Ex: "0 9 * * 1" (lundi 9h)
    next_run_at = Column(DateTime)
    
    config = Column(JSON, nullable=False)  # Paramètres de la tâche
    
    status = Column(String(20), default=ScheduledTaskStatus.PENDING, nullable=False)
    retry_count = Column(Integer, default=0)
    max_retries = Column(Integer, default=3)
    error_message = Column(Text)
    result = Column(JSON)
    
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    
    tenant = relationship("Tenant")
    creator = relationship("User")



class IntegrationType(str, enum.Enum):
    """Types d'intégrations"""
    SLACK = "slack"
    WEBHOOK = "webhook"
    ZAPIER = "zapier"
    GOOGLE_SHEETS = "google_sheets"
    MAILCHIMP = "mailchimp"
    HUBSPOT = "hubspot"
    CUSTOM = "custom"


class Integration(Base, TimestampMixin):
    """
    Intégrations externes
    Connexions avec des services tiers
    """
    __tablename__ = "integrations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    name = Column(String(100), nullable=False)
    description = Column(Text)
    type = Column(String(50), nullable=False)
    
    config = Column(JSON, nullable=False)
    
    credentials = Column(JSON)  # Tokens, API keys, etc.
    
    is_active = Column(Boolean, default=True)
    last_sync_at = Column(DateTime)
    last_error = Column(Text)
    
    trigger_events = Column(JSON)  # Liste d'événements qui déclenchent l'intégration
    
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    
    tenant = relationship("Tenant")
    creator = relationship("User")


class IntegrationLog(Base):
    """
    Journal des appels d'intégration
    """
    __tablename__ = "integration_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    integration_id = Column(UUID(as_uuid=True), ForeignKey("integrations.id", ondelete="CASCADE"), nullable=False, index=True)
    
    event_type = Column(String(50))
    entity_type = Column(String(50))
    entity_id = Column(UUID(as_uuid=True))
    
    request_data = Column(JSON)
    
    response_status = Column(Integer)
    response_data = Column(JSON)
    
    success = Column(Boolean, default=False)
    error_message = Column(Text)
    
    executed_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    duration_ms = Column(Integer)  # Durée en millisecondes
    
    integration = relationship("Integration", backref="logs")



class ImportExportStatus(str, enum.Enum):
    """Statuts d'import/export"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class ImportExportJob(Base, TimestampMixin):
    """
    Jobs d'import/export de données
    """
    __tablename__ = "import_export_jobs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    job_type = Column(String(20), nullable=False)  # import ou export
    entity_type = Column(String(50), nullable=False)  # leads, contacts, etc.
    
    file_name = Column(String(255))
    file_path = Column(String(512))
    file_size = Column(Integer)
    
    config = Column(JSON)  # Mapping des colonnes, options, etc.
    
    status = Column(String(20), default=ImportExportStatus.PENDING, nullable=False)
    started_at = Column(DateTime)
    completed_at = Column(DateTime)
    
    total_rows = Column(Integer, default=0)
    processed_rows = Column(Integer, default=0)
    success_rows = Column(Integer, default=0)
    error_rows = Column(Integer, default=0)
    errors = Column(JSON)  # Liste des erreurs par ligne
    
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    
    tenant = relationship("Tenant")
    creator = relationship("User")

    @property
    def progress(self) -> float:
        """Pourcentage de progression"""
        if self.total_rows == 0:
            return 0
        return round((self.processed_rows / self.total_rows) * 100, 2)



class ReportType(str, enum.Enum):
    """Types de rapports"""
    LEADS = "leads"
    SALES = "sales"
    CAMPAIGNS = "campaigns"
    ACTIVITIES = "activities"
    PIPELINE = "pipeline"
    PERFORMANCE = "performance"
    CUSTOM = "custom"


class ReportFormat(str, enum.Enum):
    """Formats de rapports"""
    PDF = "pdf"
    EXCEL = "excel"
    CSV = "csv"


class Report(Base, TimestampMixin):
    """
    Rapports générés
    """
    __tablename__ = "reports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    name = Column(String(200), nullable=False)
    description = Column(Text)
    report_type = Column(String(50), nullable=False)
    
    config = Column(JSON)  # Filtres, période, colonnes, etc.
    
    format = Column(String(10), default=ReportFormat.PDF)
    file_path = Column(String(512))
    file_size = Column(Integer)
    
    status = Column(String(20), default="pending")
    generated_at = Column(DateTime)
    error_message = Column(Text)
    
    is_scheduled = Column(Boolean, default=False)
    schedule_cron = Column(String(100))
    recipients = Column(JSON)  # Liste d'emails pour envoi automatique
    
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    
    tenant = relationship("Tenant")
    creator = relationship("User")
