"""
Modèles CRM Avancés pour SEKA Enterprise
Pipeline de vente intelligent avec IA
"""

import uuid
import enum
from datetime import datetime, date
from typing import Optional
from sqlalchemy import Column, String, Float, Integer, DateTime, Boolean, ForeignKey, Text, JSON, Date, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base import Base, TimestampMixin


class LeadSource(str, enum.Enum):
    """Sources de génération des leads"""
    WEBSITE = "website"
    REFERRAL = "referral"
    SOCIAL_MEDIA = "social_media"
    EMAIL_MARKETING = "email_marketing"
    COLD_CALLING = "cold_calling"
    TRADE_SHOW = "trade_show"
    ADVERTISING = "advertising"
    PARTNER = "partner"
    DIRECT = "direct"


class LeadStatus(str, enum.Enum):
    """États du lead dans le funnel"""
    NEW = "new"
    CONTACTED = "contacted"
    QUALIFIED = "qualified"
    PROPOSAL_SENT = "proposal_sent"
    NEGOTIATION = "negotiation"
    CONVERTED = "converted"
    LOST = "lost"
    UNQUALIFIED = "unqualified"


class OpportunityStage(str, enum.Enum):
    """Étapes du pipeline de vente"""
    QUALIFICATION = "qualification"
    NEEDS_ANALYSIS = "needs_analysis"
    PROPOSAL = "proposal"
    NEGOTIATION = "negotiation"
    CLOSING = "closing"
    WON = "won"
    LOST = "lost"


class ActivityType(str, enum.Enum):
    """Types d'activités CRM"""
    CALL = "call"
    EMAIL = "email"
    MEETING = "meeting"
    TASK = "task"
    NOTE = "note"
    DEMO = "demo"
    PROPOSAL = "proposal"
    FOLLOW_UP = "follow_up"


class Priority(str, enum.Enum):
    """Niveaux de priorité"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class Lead(Base, TimestampMixin):
    """Prospects/Leads avec scoring IA"""
    __tablename__ = "leads"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Informations personnelles
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    full_name = Column(String(255))  # Auto-généré
    email = Column(String(255), nullable=False, index=True)
    phone = Column(String(20))
    mobile = Column(String(20))
    
    # Informations professionnelles
    company = Column(String(255), index=True)
    job_title = Column(String(100))
    industry = Column(String(100))
    company_size = Column(String(50))  # 1-10, 11-50, 51-200, 200+
    annual_revenue = Column(String(50))  # Range de CA
    
    # Adresse
    address = Column(Text)
    city = Column(String(100))
    country = Column(String(100))
    
    # Qualification et scoring
    status = Column(String(20), nullable=False, default=LeadStatus.NEW, index=True)
    source = Column(String(50), nullable=False, default=LeadSource.DIRECT, index=True)
    score = Column(Integer, default=0, index=True)  # Score IA 0-100
    quality_grade = Column(String(2))  # A, B, C, D based on score
    
    # Tracking comportemental
    email_opens = Column(Integer, default=0)
    email_clicks = Column(Integer, default=0)
    website_visits = Column(Integer, default=0)
    last_activity_date = Column(DateTime)
    
    # Qualification
    budget_range = Column(String(50))
    timeline = Column(String(50))  # immediate, 1-3months, 3-6months, 6+months
    pain_points = Column(JSON)  # Array de pain points identifiés
    
    # Suivi commercial
    last_contact_date = Column(DateTime)
    next_action_date = Column(DateTime, index=True)
    notes = Column(Text)
    tags = Column(JSON)  # Tags flexibles
    
    # Conversion
    converted_at = Column(DateTime)
    converted_to_client_id = Column(UUID(as_uuid=True), ForeignKey("clients.id"))
    conversion_value = Column(Numeric(15, 2))
    
    # Relations
    assigned_to = Column(UUID(as_uuid=True), ForeignKey("users.id"), index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    
    # Relations inverses
    assignee = relationship("User", back_populates="assigned_leads")
    tenant = relationship("Tenant")
    converted_client = relationship("Client", foreign_keys=[converted_to_client_id])
    activities = relationship("CRMActivity", back_populates="lead", cascade="all, delete-orphan")
    opportunities = relationship("Opportunity", back_populates="lead")
    contacts = relationship("Contact", back_populates="lead", cascade="all, delete-orphan")

    @property
    def full_display_name(self) -> str:
        """Nom complet formaté pour affichage"""
        return f"{self.first_name} {self.last_name}"
    
    @property
    def days_since_last_contact(self) -> Optional[int]:
        """Nombre de jours depuis le dernier contact"""
        if self.last_contact_date:
            return (datetime.utcnow() - self.last_contact_date).days
        return None

    @property
    def is_hot_lead(self) -> bool:
        """Détermine si c'est un lead chaud basé sur le score et l'activité"""
        return self.score >= 70 and (self.last_activity_date and 
               (datetime.utcnow() - self.last_activity_date).days <= 7)


class Opportunity(Base, TimestampMixin):
    """Opportunités commerciales dans le pipeline"""
    __tablename__ = "opportunities"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Identification
    name = Column(String(255), nullable=False)
    description = Column(Text)
    reference = Column(String(100), unique=True)  # Référence unique
    
    # Valeur commerciale
    amount = Column(Numeric(15, 2), nullable=False)
    currency = Column(String(3), default="XOF")  # Franc CFA par défaut
    probability = Column(Integer, default=50)  # % de chance de closing
    
    # Pipeline
    stage = Column(String(50), nullable=False, default=OpportunityStage.QUALIFICATION, index=True)
    stage_changed_at = Column(DateTime, default=datetime.utcnow)
    
    # Dates importantes
    created_date = Column(Date, default=date.today)
    expected_close_date = Column(Date, index=True)
    actual_close_date = Column(Date)
    last_activity_date = Column(DateTime)
    
    # Détails business
    products_interested = Column(JSON)  # Liste des produits/services d'intérêt
    requirements = Column(Text)
    budget_confirmed = Column(Boolean, default=False)
    decision_maker_identified = Column(Boolean, default=False)
    
    # Compétition
    competitors = Column(JSON)  # Liste des concurrents identifiés
    competitive_advantage = Column(Text)
    
    # Suivi
    forecast_category = Column(String(20), default="pipeline")  # commit, best_case, pipeline, omitted
    next_action = Column(Text)
    loss_reason = Column(String(255))  # Si perdu
    
    # Relations
    lead_id = Column(UUID(as_uuid=True), ForeignKey("leads.id"))
    client_id = Column(UUID(as_uuid=True), ForeignKey("clients.id"))  # Si client existant
    assigned_to = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    
    # Relations
    lead = relationship("Lead", back_populates="opportunities")
    client = relationship("Client", back_populates="opportunities")
    assignee = relationship("User", back_populates="assigned_opportunities")
    tenant = relationship("Tenant")
    activities = relationship("CRMActivity", back_populates="opportunity")
    quotes = relationship("Quote", back_populates="opportunity")

    @property
    def weighted_amount(self) -> float:
        """Montant pondéré par la probabilité"""
        return float(self.amount) * (self.probability / 100)

    @property
    def days_in_stage(self) -> int:
        """Nombre de jours dans l'étape actuelle"""
        return (datetime.utcnow() - self.stage_changed_at).days

    @property
    def is_stale(self) -> bool:
        """Détermine si l'opportunité stagne"""
        return self.days_in_stage > 30  # Plus de 30 jours dans la même étape


class CRMActivity(Base, TimestampMixin):
    """Activités CRM (interactions avec prospects/clients)"""
    __tablename__ = "crm_activities"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Type et contenu
    type = Column(String(50), nullable=False, default=ActivityType.NOTE)
    subject = Column(String(255), nullable=False)
    description = Column(Text)
    
    # Planification
    due_date = Column(DateTime)
    duration_minutes = Column(Integer)  # Durée prévue en minutes
    
    # État
    is_completed = Column(Boolean, default=False)
    completed_at = Column(DateTime)
    priority = Column(String(20), default=Priority.MEDIUM)
    
    # Résultat
    outcome = Column(String(50))  # successful, no_answer, rescheduled, etc.
    next_action_required = Column(Boolean, default=False)
    next_action_description = Column(Text)
    
    # Métriques
    call_duration = Column(Integer)  # Pour les appels
    email_opened = Column(Boolean)  # Pour les emails
    meeting_attended = Column(Boolean)  # Pour les meetings
    
    # Relations
    lead_id = Column(UUID(as_uuid=True), ForeignKey("leads.id"))
    client_id = Column(UUID(as_uuid=True), ForeignKey("clients.id"))
    opportunity_id = Column(UUID(as_uuid=True), ForeignKey("opportunities.id"))
    contact_id = Column(UUID(as_uuid=True), ForeignKey("contacts.id"))
    assigned_to = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    
    # Relations
    lead = relationship("Lead", back_populates="activities")
    client = relationship("Client", back_populates="crm_activities")
    opportunity = relationship("Opportunity", back_populates="activities")
    contact = relationship("Contact", back_populates="activities")
    assignee = relationship("User")
    tenant = relationship("Tenant")


class CampaignType(str, enum.Enum):
    """Types de campagnes marketing"""
    EMAIL = "email"
    SMS = "sms"
    SOCIAL = "social"
    WEBINAR = "webinar"
    EVENT = "event"
    CONTENT = "content"


class Campaign(Base, TimestampMixin):
    """Campagnes marketing pour génération de leads"""
    __tablename__ = "campaigns"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Identification
    name = Column(String(255), nullable=False)
    description = Column(Text)
    type = Column(String(50), nullable=False)
    
    # Planification
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime)
    budget = Column(Numeric(15, 2))
    
    # Contenu
    message = Column(Text)
    call_to_action = Column(String(255))
    landing_page_url = Column(String(500))
    
    # Ciblage
    target_audience = Column(JSON)  # Critères de ciblage
    expected_reach = Column(Integer)
    
    # État
    status = Column(String(20), default="draft")  # draft, active, paused, completed
    
    # Métriques
    total_sent = Column(Integer, default=0)
    total_opened = Column(Integer, default=0)
    total_clicked = Column(Integer, default=0)
    total_converted = Column(Integer, default=0)
    total_cost = Column(Numeric(15, 2), default=0)
    
    # Relations
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    
    creator = relationship("User")
    tenant = relationship("Tenant")

    @property
    def open_rate(self) -> float:
        """Taux d'ouverture"""
        if self.total_sent > 0:
            return (self.total_opened / self.total_sent) * 100
        return 0

    @property
    def click_rate(self) -> float:
        """Taux de clic"""
        if self.total_sent > 0:
            return (self.total_clicked / self.total_sent) * 100
        return 0

    @property
    def conversion_rate(self) -> float:
        """Taux de conversion"""
        if self.total_sent > 0:
            return (self.total_converted / self.total_sent) * 100
        return 0

    @property
    def roi(self) -> Optional[float]:
        """Retour sur investissement"""
        if self.total_cost > 0:
            # Calculer le ROI basé sur la valeur des leads convertis
            # À implémenter avec les données de conversion
            pass
        return None


class LeadScoring(Base, TimestampMixin):
    """Configuration du scoring automatique des leads"""
    __tablename__ = "lead_scoring"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Configuration
    name = Column(String(100), nullable=False)
    description = Column(Text)
    
    # Critères de scoring (JSON flexible)
    scoring_rules = Column(JSON, nullable=False)
    
    # Exemple de scoring_rules:
    # {
    #   "company_size": {"1-10": 10, "11-50": 20, "51-200": 30, "200+": 40},
    #   "industry": {"technology": 30, "finance": 25, "healthcare": 20},
    #   "email_engagement": {"opens": 5, "clicks": 10},
    #   "website_behavior": {"pricing_page": 25, "demo_request": 50}
    # }
    
    # État
    is_active = Column(Boolean, default=True)
    
    # Relations
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    tenant = relationship("Tenant")


class ContactType(str, enum.Enum):
    """Types de contacts"""
    DECISION_MAKER = "decision_maker"  # Décideur
    INFLUENCER = "influencer"  # Influenceur
    TECHNICAL = "technical"  # Contact technique
    FINANCIAL = "financial"  # Contact financier
    USER = "user"  # Utilisateur final
    OTHER = "other"  # Autre


class Contact(Base, TimestampMixin):
    """
    Contacts CRM - Personnes physiques liées aux clients/leads
    Un contact représente une personne spécifique dans une organisation
    """
    __tablename__ = "contacts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Informations personnelles
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    full_name = Column(String(255))  # Auto-généré
    email = Column(String(255), nullable=False, index=True)
    phone = Column(String(20))
    mobile = Column(String(20))
    
    # Informations professionnelles
    job_title = Column(String(100))
    department = Column(String(100))  # Département dans l'entreprise
    contact_type = Column(String(50), default=ContactType.OTHER)  # Type de contact
    
    # Adresse
    address = Column(Text)
    city = Column(String(100))
    postal_code = Column(String(20))
    country = Column(String(100))
    
    # Préférences de communication
    preferred_contact_method = Column(String(20))  # email, phone, mobile
    language = Column(String(10), default="fr")  # Langue préférée
    timezone = Column(String(50))
    
    # Informations sociales
    linkedin_url = Column(String(500))
    twitter_handle = Column(String(100))
    
    # Statut et engagement
    is_primary = Column(Boolean, default=False)  # Contact principal du client/lead
    is_active = Column(Boolean, default=True)
    do_not_contact = Column(Boolean, default=False)  # Ne pas contacter
    email_opt_out = Column(Boolean, default=False)  # Désinscrit des emails
    
    # Tracking
    last_contact_date = Column(DateTime)
    last_email_sent = Column(DateTime)
    last_email_opened = Column(DateTime)
    email_bounced = Column(Boolean, default=False)
    
    # Notes et tags
    notes = Column(Text)
    tags = Column(JSON)  # Tags flexibles
    custom_fields = Column(JSON)  # Champs personnalisés
    
    # Relations
    client_id = Column(UUID(as_uuid=True), ForeignKey("clients.id"))
    lead_id = Column(UUID(as_uuid=True), ForeignKey("leads.id"))
    assigned_to = Column(UUID(as_uuid=True), ForeignKey("users.id"))  # Commercial assigné
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    
    # Relations inverses
    client = relationship("Client", back_populates="contacts")
    lead = relationship("Lead", back_populates="contacts")
    assignee = relationship("User")
    tenant = relationship("Tenant")
    activities = relationship("CRMActivity", back_populates="contact", cascade="all, delete-orphan")

    @property
    def full_display_name(self) -> str:
        """Nom complet formaté pour affichage"""
        return f"{self.first_name} {self.last_name}"
    
    @property
    def display_with_title(self) -> str:
        """Nom avec titre professionnel"""
        if self.job_title:
            return f"{self.full_display_name} - {self.job_title}"
        return self.full_display_name
    
    @property
    def days_since_last_contact(self) -> Optional[int]:
        """Nombre de jours depuis le dernier contact"""
        if self.last_contact_date:
            return (datetime.utcnow() - self.last_contact_date).days
        return None
    
    @property
    def is_engaged(self) -> bool:
        """Détermine si le contact est engagé (a ouvert un email récemment)"""
        if self.last_email_opened:
            days_since_open = (datetime.utcnow() - self.last_email_opened).days
            return days_since_open <= 30
        return False


class EmailEventType(str, enum.Enum):
    """Types d'événements email"""
    SENT = "sent"
    DELIVERED = "delivered"
    OPENED = "opened"
    CLICKED = "clicked"
    BOUNCED = "bounced"
    COMPLAINED = "complained"
    UNSUBSCRIBED = "unsubscribed"


class EmailTracking(Base, TimestampMixin):
    """
    Table de tracking des emails envoyés
    Permet de générer des URLs de tracking uniques pour chaque email
    """
    __tablename__ = "email_tracking"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Token unique pour le tracking (utilisé dans les URLs)
    tracking_token = Column(String(64), unique=True, nullable=False, index=True)
    
    # Informations sur l'email
    resend_message_id = Column(String(255))  # ID retourné par Resend
    subject = Column(String(500))
    recipient_email = Column(String(255), nullable=False, index=True)
    
    # Entité liée (lead OU contact)
    lead_id = Column(UUID(as_uuid=True), ForeignKey("leads.id"), index=True)
    contact_id = Column(UUID(as_uuid=True), ForeignKey("contacts.id"), index=True)
    
    # Métriques
    open_count = Column(Integer, default=0)
    click_count = Column(Integer, default=0)
    first_opened_at = Column(DateTime)
    last_opened_at = Column(DateTime)
    first_clicked_at = Column(DateTime)
    last_clicked_at = Column(DateTime)
    
    # Statut
    is_bounced = Column(Boolean, default=False)
    bounced_at = Column(DateTime)
    bounce_reason = Column(String(500))
    
    # Métadonnées
    campaign_id = Column(String(100))  # Pour grouper par campagne
    template_name = Column(String(100))  # Nom du template utilisé
    metadata = Column(JSON)  # Données additionnelles
    
    # Relations
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    sent_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    
    # Relations inverses
    lead = relationship("Lead", backref="email_trackings")
    contact = relationship("Contact", backref="email_trackings")
    tenant = relationship("Tenant")
    sender = relationship("User")
    events = relationship("EmailEvent", back_populates="tracking", cascade="all, delete-orphan")


class EmailEvent(Base):
    """
    Historique détaillé des événements email
    Chaque ouverture/clic est enregistré individuellement
    """
    __tablename__ = "email_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Lien vers le tracking parent
    tracking_id = Column(UUID(as_uuid=True), ForeignKey("email_tracking.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Type d'événement
    event_type = Column(String(20), nullable=False, index=True)  # opened, clicked, bounced, etc.
    
    # Pour les clics: URL cliquée
    clicked_url = Column(String(2000))
    
    # Informations techniques
    user_agent = Column(String(500))
    ip_address = Column(String(45))  # IPv6 compatible
    device_type = Column(String(20))  # desktop, mobile, tablet
    browser = Column(String(50))
    os = Column(String(50))
    country = Column(String(100))
    city = Column(String(100))
    
    # Timestamp
    occurred_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    # Relation
    tracking = relationship("EmailTracking", back_populates="events")


class EmailLink(Base):
    """
    Table des liens trackés dans les emails
    Chaque lien dans un email a son propre token de tracking
    """
    __tablename__ = "email_links"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Token unique pour ce lien
    link_token = Column(String(64), unique=True, nullable=False, index=True)
    
    # Lien vers le tracking parent
    tracking_id = Column(UUID(as_uuid=True), ForeignKey("email_tracking.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # URL originale et de destination
    original_url = Column(String(2000), nullable=False)
    
    # Compteur de clics
    click_count = Column(Integer, default=0)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relation
    tracking = relationship("EmailTracking", backref="links")


# Extensions CRM supprimées - les relations sont maintenant directement 
# intégrées dans les modèles User, Client et Quote correspondants