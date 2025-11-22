"""
Modèles Analytics pour SEKA Enterprise
Intelligence business et métriques temps réel
"""

import uuid
import enum
from datetime import datetime
from typing import Optional
from sqlalchemy import Column, String, Float, Integer, DateTime, Boolean, ForeignKey, Text, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base import Base, TimestampMixin


class MetricCategory(str, enum.Enum):
    """Catégories de métriques business"""
    SALES = "sales"
    FINANCE = "finance"
    CUSTOMER = "customer"
    INVENTORY = "inventory"
    HR = "hr"
    OPERATIONS = "operations"


class AlertSeverity(str, enum.Enum):
    """Niveaux de sévérité des alertes"""
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


class Metric(Base, TimestampMixin):
    """Métriques business temps réel avec historique"""
    __tablename__ = "metrics"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Identification métrique
    name = Column(String(100), nullable=False, index=True)
    display_name = Column(String(150))
    description = Column(Text)
    category = Column(String(50), nullable=False, index=True)
    
    # Valeur et unité
    value = Column(Float, nullable=False)
    previous_value = Column(Float)  # Valeur précédente pour calcul variation
    unit = Column(String(20))  # €, %, count, etc.
    
    # Métadonnées
    calculation_method = Column(String(100))  # sum, avg, count, custom
    period = Column(String(20))  # daily, weekly, monthly, yearly
    timestamp = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)
    
    # Relations tenant
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    tenant = relationship("Tenant")

    # Métadonnées supplémentaires JSON
    metadata = Column(JSON)  # Stockage flexible pour données spécifiques

    @property
    def change_percentage(self) -> Optional[float]:
        """Calcule le pourcentage de variation"""
        if self.previous_value and self.previous_value != 0:
            return ((self.value - self.previous_value) / self.previous_value) * 100
        return None

    @property
    def trend(self) -> str:
        """Détermine la tendance (up, down, stable)"""
        if self.previous_value is None:
            return "neutral"
        
        if self.value > self.previous_value:
            return "up"
        elif self.value < self.previous_value:
            return "down"
        else:
            return "stable"


class Dashboard(Base, TimestampMixin):
    """Dashboards personnalisés utilisateurs"""
    __tablename__ = "dashboards"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Identification
    name = Column(String(100), nullable=False)
    description = Column(Text)
    slug = Column(String(150), unique=True, nullable=False)
    
    # Configuration dashboard
    layout = Column(JSON, nullable=False)  # Configuration widgets et layout
    filters = Column(JSON)  # Filtres par défaut
    refresh_interval = Column(Integer, default=30)  # Secondes
    
    # Partage et permissions
    is_public = Column(Boolean, default=False)
    is_default = Column(Boolean, default=False)
    
    # Relations
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    
    creator = relationship("User")
    tenant = relationship("Tenant")


class Alert(Base, TimestampMixin):
    """Système d'alertes intelligentes"""
    __tablename__ = "alerts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Contenu alerte
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    severity = Column(String(20), nullable=False, default=AlertSeverity.INFO)
    
    # Trigger et conditions
    metric_name = Column(String(100))  # Métrique qui a déclenché l'alerte
    threshold_value = Column(Float)
    actual_value = Column(Float)
    condition = Column(String(50))  # greater_than, less_than, equals, etc.
    
    # État
    is_read = Column(Boolean, default=False)
    is_resolved = Column(Boolean, default=False)
    resolved_at = Column(DateTime)
    resolved_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    
    # Actions suggérées
    suggested_actions = Column(JSON)  # Liste d'actions recommandées
    
    # Relations
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    
    user = relationship("User")
    tenant = relationship("Tenant")
    resolver = relationship("User", foreign_keys=[resolved_by])


class BusinessInsight(Base, TimestampMixin):
    """Insights business générés par IA"""
    __tablename__ = "business_insights"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Contenu insight
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    insight_type = Column(String(50), nullable=False)  # trend, anomaly, opportunity, risk
    
    # Confiance et priorité
    confidence_score = Column(Float)  # 0-1 confiance de l'IA
    priority = Column(String(20), default="medium")  # low, medium, high
    
    # Données supportant l'insight
    supporting_data = Column(JSON)
    
    # Actions recommandées
    recommendations = Column(JSON)  # Liste d'actions suggérées
    
    # État
    is_dismissed = Column(Boolean, default=False)
    is_acted_upon = Column(Boolean, default=False)
    
    # Relations
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    tenant = relationship("Tenant")


class KPITarget(Base, TimestampMixin):
    """Objectifs et targets pour KPIs"""
    __tablename__ = "kpi_targets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Identification
    metric_name = Column(String(100), nullable=False)
    period = Column(String(20), nullable=False)  # monthly, quarterly, yearly
    
    # Objectifs
    target_value = Column(Float, nullable=False)
    minimum_acceptable = Column(Float)
    stretch_goal = Column(Float)
    
    # Période
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    
    # État
    is_active = Column(Boolean, default=True)
    
    # Relations
    set_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    
    setter = relationship("User")
    tenant = relationship("Tenant")

    @property
    def current_progress(self) -> Optional[float]:
        """Calcule le progrès actuel vers l'objectif"""
        # À implémenter avec la métrique actuelle
        pass


class ReportSchedule(Base, TimestampMixin):
    """Rapports automatisés et programmés"""
    __tablename__ = "report_schedules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Configuration rapport
    name = Column(String(100), nullable=False)
    report_type = Column(String(50), nullable=False)  # executive, sales, finance, hr
    
    # Planification
    frequency = Column(String(20), nullable=False)  # daily, weekly, monthly
    schedule_time = Column(String(10))  # HH:MM format
    timezone = Column(String(50), default="UTC")
    
    # Configuration contenu
    metrics_included = Column(JSON)  # Liste des métriques à inclure
    filters = Column(JSON)  # Filtres appliqués
    format = Column(String(20), default="pdf")  # pdf, excel, email
    
    # Destinataires
    recipients = Column(JSON)  # Liste emails destinataires
    
    # État
    is_active = Column(Boolean, default=True)
    last_sent = Column(DateTime)
    next_send = Column(DateTime)
    
    # Relations
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    
    creator = relationship("User")
    tenant = relationship("Tenant")