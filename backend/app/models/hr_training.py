"""
Modèles RH - Formation & Développement
Gestion de la formation, développement des compétences et plans de carrière pour SEKA ERP
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

class TrainingType(str, Enum):
    """Type de formation"""
    IN_PERSON = "in_person"
    ONLINE = "online"
    HYBRID = "hybrid"
    SELF_PACED = "self_paced"
    WORKSHOP = "workshop"
    CONFERENCE = "conference"
    CERTIFICATION = "certification"
    MENTORING = "mentoring"


class TrainingCategory(str, Enum):
    """Catégorie de formation"""
    TECHNICAL = "technical"
    SOFT_SKILLS = "soft_skills"
    MANAGEMENT = "management"
    LEADERSHIP = "leadership"
    COMPLIANCE = "compliance"
    SAFETY = "safety"
    PRODUCT = "product"
    SALES = "sales"
    CUSTOMER_SERVICE = "customer_service"
    LANGUAGES = "languages"


class TrainingStatus(str, Enum):
    """Statut d'une formation"""
    DRAFT = "draft"
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    POSTPONED = "postponed"


class EnrollmentStatus(str, Enum):
    """Statut d'une inscription"""
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    ENROLLED = "enrolled"
    COMPLETED = "completed"
    FAILED = "failed"
    WITHDRAWN = "withdrawn"


class SkillLevel(str, Enum):
    """Niveau de compétence"""
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    EXPERT = "expert"


class CertificationStatus(str, Enum):
    """Statut d'une certification"""
    ACTIVE = "active"
    EXPIRED = "expired"
    SUSPENDED = "suspended"
    REVOKED = "revoked"


# ============================================================================
# MODÈLES - FORMATION
# ============================================================================

class TrainingCourse(Base):
    """
    Cours de formation - Catalogue de formations
    Base de données des formations disponibles
    """
    __tablename__ = "training_courses"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, nullable=False, index=True)

    # Informations du cours
    code = Column(String(50), unique=True, nullable=False)
    title = Column(String(200), nullable=False, index=True)
    description = Column(Text, nullable=False)

    # Catégorisation
    category = Column(String, default=TrainingCategory.TECHNICAL)
    type = Column(String, default=TrainingType.IN_PERSON)
    tags = Column(ARRAY(String), default=list)

    # Niveau et prérequis
    level = Column(String, default=SkillLevel.BEGINNER)
    prerequisites = Column(Text)
    target_audience = Column(Text)

    # Durée et format
    duration_hours = Column(Numeric(5, 2), nullable=False)
    duration_days = Column(Integer)
    max_participants = Column(Integer)
    min_participants = Column(Integer)

    # Objectifs pédagogiques
    learning_objectives = Column(JSON, default=list)
    # Exemple: ["Understand Python basics", "Write simple scripts", "Debug code"]

    # Compétences enseignées
    skills_taught = Column(JSON, default=list)
    # Exemple: [{"skill": "Python", "level": "intermediate"}]

    # Contenu du cours
    curriculum = Column(JSON, default=list)
    # Exemple: [{"module": "Introduction", "topics": ["History", "Setup"], "duration": 2}]

    # Formateur
    default_trainer_id = Column(String, ForeignKey("employees.id"))
    external_trainer_name = Column(String(200))
    external_trainer_company = Column(String(200))

    # Coût
    cost_per_participant = Column(Numeric(15, 2))
    currency = Column(String(3), default="XOF")
    external_provider_cost = Column(Numeric(15, 2))

    # Matériel pédagogique
    materials_url = Column(String(500))
    video_url = Column(String(500))
    documents = Column(JSON, default=list)

    # Évaluation
    has_exam = Column(Boolean, default=False)
    passing_score = Column(Integer)  # Pourcentage
    certification_awarded = Column(String(200))
    certification_validity_months = Column(Integer)

    # Disponibilité
    is_active = Column(Boolean, default=True)
    is_mandatory = Column(Boolean, default=False)  # Formation obligatoire
    mandatory_for_roles = Column(ARRAY(String), default=list)

    # Statistiques
    times_delivered = Column(Integer, default=0)
    total_participants = Column(Integer, default=0)
    average_rating = Column(Numeric(3, 2))

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))


class TrainingSession(Base):
    """
    Session de formation - Instance planifiée d'un cours
    Occurrence spécifique d'une formation avec dates et participants
    """
    __tablename__ = "training_sessions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, nullable=False, index=True)

    # Cours associé
    course_id = Column(String, ForeignKey("training_courses.id", ondelete="CASCADE"), nullable=False, index=True)

    # Informations de session
    session_code = Column(String(50), unique=True, nullable=False)
    title = Column(String(200))  # Override du titre du cours si besoin

    # Planification
    start_date = Column(Date, nullable=False, index=True)
    end_date = Column(Date, nullable=False)
    schedule = Column(JSON, default=list)
    # Exemple: [{"date": "2024-01-15", "start_time": "09:00", "end_time": "17:00", "topic": "Module 1"}]

    # Formateur
    trainer_id = Column(String, ForeignKey("employees.id"), index=True)
    external_trainer_name = Column(String(200))
    co_trainers = Column(JSON, default=list)

    # Lieu
    location = Column(String(500))
    room = Column(String(100))
    online_meeting_link = Column(String(500))
    is_remote = Column(Boolean, default=False)

    # Capacité
    max_participants = Column(Integer, nullable=False)
    enrolled_count = Column(Integer, default=0)
    waiting_list_count = Column(Integer, default=0)

    # Statut
    status = Column(String, default=TrainingStatus.SCHEDULED, index=True)

    # Budget
    budget = Column(Numeric(15, 2))
    actual_cost = Column(Numeric(15, 2))
    currency = Column(String(3), default="XOF")

    # Matériel
    materials_provided = Column(Boolean, default=False)
    equipment_needed = Column(JSON, default=list)

    # Évaluation post-formation
    feedback_form_url = Column(String(500))
    average_rating = Column(Numeric(3, 2))
    completion_rate = Column(Numeric(5, 2))  # Pourcentage
    pass_rate = Column(Numeric(5, 2))  # Pourcentage de réussite à l'examen

    # Notes
    notes = Column(Text)
    cancellation_reason = Column(Text)

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))


class TrainingEnrollment(Base):
    """
    Inscription à une formation
    Lien entre employé et session de formation
    """
    __tablename__ = "training_enrollments"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, nullable=False, index=True)

    # Références
    session_id = Column(String, ForeignKey("training_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    employee_id = Column(String, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)

    # Statut
    status = Column(String, default=EnrollmentStatus.PENDING, index=True)

    # Type d'inscription
    is_mandatory = Column(Boolean, default=False)
    is_self_enrolled = Column(Boolean, default=False)
    nominated_by_manager = Column(Boolean, default=False)

    # Approbation
    manager_approved = Column(Boolean, default=False)
    manager_approval_date = Column(DateTime)
    manager_id = Column(String, ForeignKey("employees.id"))

    hr_approved = Column(Boolean, default=False)
    hr_approval_date = Column(DateTime)

    # Dates importantes
    enrolled_date = Column(DateTime, default=datetime.utcnow, index=True)
    start_date = Column(Date)
    completion_date = Column(Date)
    withdrawal_date = Column(DateTime)
    withdrawal_reason = Column(Text)

    # Présence
    attendance_percentage = Column(Numeric(5, 2))
    days_attended = Column(Integer, default=0)
    days_total = Column(Integer)

    # Évaluation
    pre_test_score = Column(Numeric(5, 2))
    post_test_score = Column(Numeric(5, 2))
    final_score = Column(Numeric(5, 2))
    passed = Column(Boolean)

    # Feedback de l'employé
    rating = Column(Integer)  # 1-5
    feedback = Column(Text)
    would_recommend = Column(Boolean)

    # Évaluation du formateur
    trainer_rating = Column(Integer)  # 1-5
    trainer_feedback = Column(Text)

    # Certificat
    certificate_issued = Column(Boolean, default=False)
    certificate_url = Column(String(500))
    certificate_number = Column(String(100))
    certificate_issue_date = Column(Date)

    # Coût
    cost = Column(Numeric(15, 2))
    currency = Column(String(3), default="XOF")
    paid_by_employee = Column(Boolean, default=False)

    # Notes
    notes = Column(Text)
    internal_notes = Column(Text)

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Skill(Base):
    """
    Compétence - Référentiel des compétences
    Catalogue des compétences techniques et soft skills
    """
    __tablename__ = "skills"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, nullable=False, index=True)

    # Informations
    name = Column(String(200), nullable=False, index=True)
    description = Column(Text)
    category = Column(String(100), index=True)  # Technical, Soft Skills, Language, etc.

    # Hiérarchie
    parent_skill_id = Column(String, ForeignKey("skills.id"))
    # Exemple: "Python" parent de "Django", "Flask"

    # Importance
    is_core_skill = Column(Boolean, default=False)  # Compétence clé de l'entreprise
    demand_level = Column(String(50))  # high, medium, low

    # Évaluation
    levels = Column(JSON, default=list)
    # Exemple: [
    #   {"level": "beginner", "description": "Basic knowledge"},
    #   {"level": "intermediate", "description": "Can work independently"},
    #   {"level": "expert", "description": "Can teach others"}
    # ]

    # Certifications associées
    related_certifications = Column(JSON, default=list)

    # Formation associée
    training_courses_available = Column(ARRAY(String), default=list)  # IDs de cours

    # Statistiques
    employees_with_skill = Column(Integer, default=0)
    average_proficiency = Column(Numeric(3, 2))

    # Actif
    is_active = Column(Boolean, default=True)

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class EmployeeSkill(Base):
    """
    Compétence d'un employé
    Niveau de maîtrise d'une compétence par un employé
    """
    __tablename__ = "employee_skills"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, nullable=False, index=True)

    # Références
    employee_id = Column(String, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)
    skill_id = Column(String, ForeignKey("skills.id", ondelete="CASCADE"), nullable=False, index=True)

    # Niveau de maîtrise
    proficiency_level = Column(String, default=SkillLevel.BEGINNER)
    proficiency_score = Column(Integer)  # 0-100

    # Auto-évaluation vs évaluation manager
    self_assessment_level = Column(String)
    manager_assessment_level = Column(String)
    assessed_by_manager_id = Column(String, ForeignKey("employees.id"))

    # Expérience
    years_of_experience = Column(Numeric(4, 1))
    last_used_date = Column(Date)

    # Acquisition
    acquired_date = Column(Date)
    acquired_through = Column(String(100))  # training, on_job, certification, etc.
    training_session_id = Column(String, ForeignKey("training_sessions.id"))

    # Certification
    is_certified = Column(Boolean, default=False)
    certification_name = Column(String(200))
    certification_date = Column(Date)
    certification_expiry_date = Column(Date)
    certification_url = Column(String(500))

    # Validation
    is_validated = Column(Boolean, default=False)
    validated_by_id = Column(String, ForeignKey("employees.id"))
    validation_date = Column(Date)

    # Intérêt de développement
    wants_to_improve = Column(Boolean, default=False)
    target_level = Column(String)
    improvement_plan = Column(Text)

    # Utilisation
    currently_using = Column(Boolean, default=True)
    projects_used_in = Column(ARRAY(String), default=list)

    # Notes
    notes = Column(Text)
    evidence = Column(JSON, default=list)  # Preuves de compétence (projets, réalisations)

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class DevelopmentPlan(Base):
    """
    Plan de développement individuel (PDI)
    Plan de carrière et développement des compétences d'un employé
    """
    __tablename__ = "development_plans"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, nullable=False, index=True)

    # Employé
    employee_id = Column(String, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)

    # Période
    plan_year = Column(Integer, nullable=False, index=True)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)

    # Objectifs de carrière
    career_goals = Column(Text)
    target_position = Column(String(200))
    target_position_timeframe = Column(Integer)  # Mois

    # Compétences à développer
    skills_to_develop = Column(JSON, default=list)
    # Exemple: [{"skill": "Leadership", "current": "beginner", "target": "intermediate", "priority": "high"}]

    # Actions plannifiées
    planned_actions = Column(JSON, default=list)
    # Exemple: [{"action": "Complete MBA", "type": "education", "deadline": "2024-12-31", "status": "in_progress"}]

    # Formations plannifiées
    planned_trainings = Column(JSON, default=list)

    # Mentorat
    has_mentor = Column(Boolean, default=False)
    mentor_id = Column(String, ForeignKey("employees.id"))
    mentoring_goals = Column(Text)

    # Projets stretch
    stretch_assignments = Column(JSON, default=list)

    # Budget alloué
    budget_allocated = Column(Numeric(15, 2))
    budget_used = Column(Numeric(15, 2), default=0)
    currency = Column(String(3), default="XOF")

    # Revues
    mid_year_review_date = Column(Date)
    mid_year_review_notes = Column(Text)
    mid_year_progress_percentage = Column(Integer)

    end_year_review_date = Column(Date)
    end_year_review_notes = Column(Text)
    end_year_progress_percentage = Column(Integer)

    # Statut
    is_active = Column(Boolean, default=True)
    completion_percentage = Column(Integer, default=0)

    # Approbation
    approved_by_manager = Column(Boolean, default=False)
    manager_approval_date = Column(Date)
    approved_by_hr = Column(Boolean, default=False)
    hr_approval_date = Column(Date)

    # Notes
    notes = Column(Text)
    manager_notes = Column(Text)

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))


class SuccessionPlan(Base):
    """
    Plan de succession
    Identification des successeurs potentiels pour postes clés
    """
    __tablename__ = "succession_plans"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, nullable=False, index=True)

    # Poste critique
    position_title = Column(String(200), nullable=False, index=True)
    department = Column(String(100))
    current_incumbent_id = Column(String, ForeignKey("employees.id"))

    # Criticité
    is_critical_position = Column(Boolean, default=True)
    business_impact = Column(String(50))  # high, medium, low
    replacement_urgency = Column(String(50))  # immediate, 6_months, 1_year, 2_years

    # Successeurs identifiés
    successors = Column(JSON, default=list)
    # Exemple: [
    #   {"employee_id": "uuid", "readiness": "ready_now", "confidence": "high"},
    #   {"employee_id": "uuid", "readiness": "1-2_years", "confidence": "medium"}
    # ]

    # Développement des successeurs
    development_actions = Column(JSON, default=list)

    # Risque de départ
    incumbent_flight_risk = Column(String(50))  # low, medium, high
    incumbent_retirement_date = Column(Date)

    # Compétences requises
    required_skills = Column(JSON, default=list)
    required_experience_years = Column(Integer)

    # Plan d'action
    action_plan = Column(Text)
    emergency_plan = Column(Text)  # Plan si départ immédiat

    # Revue
    last_review_date = Column(Date)
    next_review_date = Column(Date)
    review_frequency_months = Column(Integer, default=12)

    # Statut
    is_active = Column(Boolean, default=True)

    # Notes
    notes = Column(Text)

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
