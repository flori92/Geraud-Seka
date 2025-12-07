"""
Modèles RH - Recrutement & ATS (Applicant Tracking System)
Gestion complète du processus de recrutement pour SEKA ERP
"""
from datetime import date, datetime
from enum import Enum
from typing import Optional
from sqlalchemy import Column, String, Integer, Float, Boolean, ForeignKey, Date, DateTime, JSON, Text, Numeric, ARRAY
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import Base
import uuid


# ============================================================================
# ENUMS
# ============================================================================

class JobStatus(str, Enum):
    """Statut d'une offre d'emploi"""
    DRAFT = "draft"
    PUBLISHED = "published"
    PAUSED = "paused"
    CLOSED = "closed"
    FILLED = "filled"


class JobType(str, Enum):
    """Type de poste"""
    FULL_TIME = "full_time"
    PART_TIME = "part_time"
    CONTRACT = "contract"
    TEMPORARY = "temporary"
    INTERNSHIP = "internship"
    FREELANCE = "freelance"


class ExperienceLevel(str, Enum):
    """Niveau d'expérience requis"""
    ENTRY = "entry"          # 0-2 ans
    JUNIOR = "junior"        # 2-5 ans
    INTERMEDIATE = "intermediate"  # 5-8 ans
    SENIOR = "senior"        # 8-12 ans
    EXPERT = "expert"        # 12+ ans
    EXECUTIVE = "executive"  # Direction


class ApplicationStatus(str, Enum):
    """Statut d'une candidature"""
    NEW = "new"
    SCREENING = "screening"
    PHONE_SCREEN = "phone_screen"
    ASSESSMENT = "assessment"
    INTERVIEW_1 = "interview_1"
    INTERVIEW_2 = "interview_2"
    INTERVIEW_FINAL = "interview_final"
    OFFER = "offer"
    HIRED = "hired"
    REJECTED = "rejected"
    WITHDRAWN = "withdrawn"


class ApplicationSource(str, Enum):
    """Source de la candidature"""
    WEBSITE = "website"
    LINKEDIN = "linkedin"
    INDEED = "indeed"
    REFERRAL = "referral"
    AGENCY = "agency"
    CAMPUS = "campus"
    JOB_FAIR = "job_fair"
    DIRECT = "direct"
    OTHER = "other"


class InterviewType(str, Enum):
    """Type d'entretien"""
    PHONE = "phone"
    VIDEO = "video"
    IN_PERSON = "in_person"
    TECHNICAL = "technical"
    PANEL = "panel"
    BEHAVIORAL = "behavioral"


class InterviewResult(str, Enum):
    """Résultat de l'entretien"""
    EXCELLENT = "excellent"
    GOOD = "good"
    AVERAGE = "average"
    BELOW_AVERAGE = "below_average"
    POOR = "poor"
    NO_SHOW = "no_show"


class OfferStatus(str, Enum):
    """Statut d'une offre d'emploi envoyée"""
    DRAFT = "draft"
    SENT = "sent"
    ACCEPTED = "accepted"
    DECLINED = "declined"
    EXPIRED = "expired"
    WITHDRAWN = "withdrawn"


# ============================================================================
# MODÈLES - RECRUTEMENT
# ============================================================================

class JobPosting(Base):
    """
    Offre d'emploi / Poste à pourvoir
    ATS - Gestion des annonces de recrutement
    """
    __tablename__ = "job_postings"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, nullable=False, index=True)

    # Informations du poste
    title = Column(String(200), nullable=False, index=True)
    job_code = Column(String(50), unique=True, nullable=False)
    department = Column(String(100), nullable=False)
    location = Column(String(200), nullable=False)

    # Type et niveau
    job_type = Column(String, default=JobType.FULL_TIME)
    experience_level = Column(String, default=ExperienceLevel.INTERMEDIATE)

    # Description
    description = Column(Text, nullable=False)
    responsibilities = Column(Text)
    requirements = Column(Text)
    nice_to_have = Column(Text)

    # Compétences requises (array)
    required_skills = Column(ARRAY(String), default=list)
    preferred_skills = Column(ARRAY(String), default=list)

    # Rémunération
    salary_min = Column(Numeric(15, 2))
    salary_max = Column(Numeric(15, 2))
    currency = Column(String(3), default="XOF")
    salary_type = Column(String(50))  # monthly, yearly, hourly

    # Avantages
    benefits = Column(JSON, default=dict)
    # Exemple: {"health_insurance": true, "transport": 50000, "meal": 30000}

    # Manager recruteur
    hiring_manager_id = Column(String, ForeignKey("employees.id"), index=True)
    recruiter_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), index=True)

    # Statut et publication
    status = Column(String, default=JobStatus.DRAFT, index=True)
    published_date = Column(Date)
    closing_date = Column(Date)
    positions_available = Column(Integer, default=1)
    positions_filled = Column(Integer, default=0)

    # Canaux de publication
    publish_on_website = Column(Boolean, default=True)
    publish_on_linkedin = Column(Boolean, default=False)
    publish_on_indeed = Column(Boolean, default=False)

    # Statistiques
    views_count = Column(Integer, default=0)
    applications_count = Column(Integer, default=0)

    # Workflow automatique
    auto_rejection_enabled = Column(Boolean, default=False)
    auto_rejection_criteria = Column(JSON, default=dict)

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))


class Candidate(Base):
    """
    Candidat - Profil du candidat
    Base de données de candidats réutilisable
    """
    __tablename__ = "candidates"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, nullable=False, index=True)

    # Informations personnelles
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(255), nullable=False, index=True)
    phone = Column(String(20))
    mobile = Column(String(20))

    # Adresse
    address = Column(String(500))
    city = Column(String(100))
    country = Column(String(100))
    postal_code = Column(String(20))

    # Réseaux sociaux
    linkedin_url = Column(String(500))
    github_url = Column(String(500))
    portfolio_url = Column(String(500))

    # CV et documents
    resume_url = Column(String(500))
    cover_letter_url = Column(String(500))

    # Profil professionnel
    current_title = Column(String(200))
    current_company = Column(String(200))
    years_of_experience = Column(Integer)
    current_salary = Column(Numeric(15, 2))
    expected_salary = Column(Numeric(15, 2))
    currency = Column(String(3), default="XOF")

    # Compétences
    skills = Column(ARRAY(String), default=list)
    languages = Column(JSON, default=list)
    # Exemple: [{"language": "French", "level": "native"}, {"language": "English", "level": "fluent"}]

    # Éducation
    education = Column(JSON, default=list)
    # Exemple: [{"degree": "Master", "field": "Computer Science", "school": "MIT", "year": 2020}]

    # Disponibilité
    available_from = Column(Date)
    notice_period_days = Column(Integer)
    willing_to_relocate = Column(Boolean, default=False)

    # Score et évaluation
    overall_score = Column(Integer)  # 0-100
    technical_score = Column(Integer)  # 0-100

    # RGPD / Consentement
    consent_to_store_data = Column(Boolean, default=True)
    consent_date = Column(DateTime)
    data_retention_until = Column(Date)  # RGPD: 2 ans après dernier contact

    # Blacklist
    is_blacklisted = Column(Boolean, default=False)
    blacklist_reason = Column(Text)

    # Tags pour recherche
    tags = Column(ARRAY(String), default=list)

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    source = Column(String)  # Comment on a découvert ce candidat


class Application(Base):
    """
    Candidature - Lien entre un candidat et un poste
    Suivi du parcours de recrutement
    """
    __tablename__ = "applications"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, nullable=False, index=True)

    # Références
    job_posting_id = Column(String, ForeignKey("job_postings.id", ondelete="CASCADE"), nullable=False, index=True)
    candidate_id = Column(String, ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False, index=True)

    # Statut et étape
    status = Column(String, default=ApplicationStatus.NEW, index=True)
    current_stage = Column(String(100))

    # Source de candidature
    source = Column(String, default=ApplicationSource.WEBSITE)
    referrer_employee_id = Column(String, ForeignKey("employees.id"))  # Si référence interne
    referrer_bonus = Column(Numeric(15, 2))  # Prime de cooptation

    # Documents spécifiques à cette candidature
    resume_url = Column(String(500))
    cover_letter_url = Column(String(500))
    additional_documents = Column(JSON, default=list)

    # Réponses aux questions de screening
    screening_questions = Column(JSON, default=dict)
    # Exemple: {"experience_years": 5, "willing_to_travel": true}

    # Scores
    resume_score = Column(Integer)  # 0-100 (peut être automatique via IA)
    screening_score = Column(Integer)  # 0-100
    overall_score = Column(Integer)  # 0-100

    # Assignation
    assigned_recruiter_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))

    # Dates importantes
    applied_date = Column(DateTime, default=datetime.utcnow, index=True)
    reviewed_date = Column(DateTime)
    interview_scheduled_date = Column(DateTime)
    offer_sent_date = Column(DateTime)
    hire_date = Column(DateTime)
    rejection_date = Column(DateTime)

    # Rejection
    rejection_reason = Column(Text)
    rejection_feedback = Column(Text)
    can_reapply_after = Column(Date)  # Bloquer candidature pendant X mois

    # Communication
    emails_sent_count = Column(Integer, default=0)
    last_contact_date = Column(DateTime)

    # Notes et évaluation globale
    notes = Column(Text)
    recruiter_notes = Column(Text)
    hiring_manager_notes = Column(Text)

    # Tags
    tags = Column(ARRAY(String), default=list)

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Interview(Base):
    """
    Entretien - Planification et résultats d'entretiens
    Partie du processus de recrutement
    """
    __tablename__ = "interviews"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, nullable=False, index=True)

    # Références
    application_id = Column(String, ForeignKey("applications.id", ondelete="CASCADE"), nullable=False, index=True)

    # Type et round
    interview_type = Column(String, default=InterviewType.IN_PERSON)
    round_number = Column(Integer, default=1)
    title = Column(String(200))

    # Planification
    scheduled_date = Column(DateTime, nullable=False, index=True)
    duration_minutes = Column(Integer, default=60)
    location = Column(String(500))  # Adresse ou lien vidéo
    meeting_link = Column(String(500))
    meeting_instructions = Column(Text)

    # Interviewers
    interviewers = Column(JSON, default=list)
    # Exemple: [{"user_id": "uuid", "name": "John Doe", "role": "Technical Lead"}]

    # Statut
    status = Column(String(50), default="scheduled")  # scheduled, completed, cancelled, no_show

    # Évaluation (rempli après l'entretien)
    result = Column(String)  # InterviewResult
    overall_rating = Column(Integer)  # 1-5
    technical_rating = Column(Integer)  # 1-5
    communication_rating = Column(Integer)  # 1-5
    culture_fit_rating = Column(Integer)  # 1-5

    # Critères d'évaluation détaillés
    evaluation_criteria = Column(JSON, default=list)
    # Exemple: [{"criterion": "Problem solving", "score": 4, "notes": "Excellent"}]

    # Feedback
    strengths = Column(Text)
    weaknesses = Column(Text)
    recommendation = Column(String(50))  # strong_yes, yes, maybe, no, strong_no
    detailed_feedback = Column(Text)

    # Notes privées (non partagées avec le candidat)
    private_notes = Column(Text)

    # Rappels et notifications
    reminder_sent_candidate = Column(Boolean, default=False)
    reminder_sent_interviewers = Column(Boolean, default=False)

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    completed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    completed_at = Column(DateTime)


class JobOffer(Base):
    """
    Offre d'emploi envoyée - Proposition formelle
    Gestion des offres envoyées aux candidats sélectionnés
    """
    __tablename__ = "job_offers"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, nullable=False, index=True)

    # Références
    application_id = Column(String, ForeignKey("applications.id", ondelete="CASCADE"), nullable=False, index=True)
    job_posting_id = Column(String, ForeignKey("job_postings.id"), index=True)
    candidate_id = Column(String, ForeignKey("candidates.id"), index=True)

    # Numéro d'offre
    offer_number = Column(String(50), unique=True, nullable=False)

    # Détails de l'offre
    job_title = Column(String(200), nullable=False)
    department = Column(String(100))
    start_date = Column(Date, nullable=False)

    # Type de contrat
    contract_type = Column(String(50))  # CDI, CDD, Stage
    contract_duration_months = Column(Integer)  # Si CDD/Stage

    # Rémunération
    salary = Column(Numeric(15, 2), nullable=False)
    currency = Column(String(3), default="XOF")
    salary_type = Column(String(50))  # monthly, yearly

    # Avantages
    benefits = Column(JSON, default=dict)
    signing_bonus = Column(Numeric(15, 2))
    relocation_package = Column(Numeric(15, 2))

    # Conditions
    probation_period_months = Column(Integer, default=3)
    notice_period_days = Column(Integer)

    # Horaires
    work_hours_per_week = Column(Integer, default=40)
    remote_work_allowed = Column(Boolean, default=False)
    remote_days_per_week = Column(Integer)

    # Documents
    offer_letter_url = Column(String(500))
    contract_template_url = Column(String(500))

    # Statut et validité
    status = Column(String, default=OfferStatus.DRAFT, index=True)
    sent_date = Column(DateTime)
    expiry_date = Column(Date)  # Date limite pour accepter

    # Réponse du candidat
    response_date = Column(DateTime)
    acceptance_date = Column(DateTime)
    decline_reason = Column(Text)
    counter_offer_details = Column(JSON)

    # Approbations internes
    approved_by_manager = Column(Boolean, default=False)
    manager_approval_date = Column(DateTime)
    approved_by_hr = Column(Boolean, default=False)
    hr_approval_date = Column(DateTime)

    # Négociation
    negotiation_history = Column(JSON, default=list)
    # Exemple: [{"date": "2024-01-15", "field": "salary", "previous": 100000, "new": 110000}]

    # Notes
    notes = Column(Text)
    special_conditions = Column(Text)

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    sent_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))


class RecruitmentPipeline(Base):
    """
    Pipeline de recrutement - Configuration du processus
    Définit les étapes du processus de recrutement par poste
    """
    __tablename__ = "recruitment_pipelines"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, nullable=False, index=True)

    # Nom du pipeline
    name = Column(String(200), nullable=False)
    description = Column(Text)

    # Poste associé (optionnel, peut être réutilisable)
    job_posting_id = Column(String, ForeignKey("job_postings.id"))

    # Étapes du pipeline (ordre important)
    stages = Column(JSON, default=list)
    # Exemple: [
    #   {"name": "Screening", "order": 1, "auto_reject_after_days": 7},
    #   {"name": "Phone Interview", "order": 2, "required": true},
    #   {"name": "Technical Test", "order": 3},
    #   {"name": "Final Interview", "order": 4}
    # ]

    # Actif
    is_active = Column(Boolean, default=True)
    is_default = Column(Boolean, default=False)

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
