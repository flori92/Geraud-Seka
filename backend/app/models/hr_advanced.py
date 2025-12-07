"""
Modèles RH Avancés pour SEKA ERP
Inclut: Pointage, Performance, Paie OHADA avancée, Notes de frais, Recrutement, Formation
"""
from datetime import date, datetime, time
from enum import Enum
from typing import Optional, List
from sqlalchemy import Column, String, Integer, Float, Boolean, ForeignKey, Date, DateTime, JSON, Text, Time, Numeric, ARRAY
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import Base
import uuid


# ============================================================================
# ENUMS
# ============================================================================

class AttendanceMethod(str, Enum):
    """Méthode de pointage"""
    BADGE = "badge"
    BIOMETRIC = "biometric"
    MOBILE = "mobile"
    MANUAL = "manual"
    WEB = "web"


class AttendanceStatus(str, Enum):
    """Statut de présence"""
    PRESENT = "present"
    LATE = "late"
    ABSENT = "absent"
    HALF_DAY = "half_day"
    REMOTE = "remote"


class AttendanceType(str, Enum):
    """Type de présence"""
    OFFICE = "office"
    REMOTE = "remote"
    CLIENT_SITE = "client_site"
    FIELD = "field"


class ShiftRotationType(str, Enum):
    """Type de rotation d'équipe"""
    FIXED = "fixed"
    WEEKLY = "weekly"
    BI_WEEKLY = "bi_weekly"
    MONTHLY = "monthly"


class PerformanceReviewPeriod(str, Enum):
    """Période d'évaluation"""
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    SEMI_ANNUAL = "semi_annual"
    ANNUAL = "annual"


class PerformanceRating(str, Enum):
    """Note globale d'évaluation"""
    EXCELLENT = "excellent"
    GOOD = "good"
    SATISFACTORY = "satisfactory"
    NEEDS_IMPROVEMENT = "needs_improvement"
    UNSATISFACTORY = "unsatisfactory"


class ReviewStatus(str, Enum):
    """Statut du processus d'évaluation"""
    DRAFT = "draft"
    PENDING_EMPLOYEE = "pending_employee"
    EMPLOYEE_REVIEWED = "employee_reviewed"
    PENDING_MANAGER = "pending_manager"
    COMPLETED = "completed"


class GoalCategory(str, Enum):
    """Catégorie d'objectif"""
    SALES = "sales"
    PRODUCTIVITY = "productivity"
    QUALITY = "quality"
    DEVELOPMENT = "development"
    BEHAVIORAL = "behavioral"
    OTHER = "other"


class GoalStatus(str, Enum):
    """Statut d'objectif"""
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    AT_RISK = "at_risk"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class GoalMetricType(str, Enum):
    """Type de métrique pour objectif"""
    NUMBER = "number"
    PERCENTAGE = "percentage"
    BOOLEAN = "boolean"
    CURRENCY = "currency"


class GoalPriority(str, Enum):
    """Priorité d'objectif"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class ReviewerRelationship(str, Enum):
    """Relation avec la personne évaluée"""
    MANAGER = "manager"
    PEER = "peer"
    SUBORDINATE = "subordinate"
    CLIENT = "client"
    SELF = "self"


class Feedback360Status(str, Enum):
    """Statut feedback 360"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    SUBMITTED = "submitted"


class PaymentMethodType(str, Enum):
    """Méthode de paiement"""
    BANK_TRANSFER = "bank_transfer"
    CHECK = "check"
    CASH = "cash"
    MOBILE_MONEY = "mobile_money"


class ExpenseCategory(str, Enum):
    """Catégorie de dépense"""
    MEAL = "meal"
    ACCOMMODATION = "accommodation"
    TRANSPORT = "transport"
    FUEL = "fuel"
    MILEAGE = "mileage"
    PARKING = "parking"
    TOLL = "toll"
    PHONE = "phone"
    INTERNET = "internet"
    SUPPLIES = "supplies"
    TRAINING = "training"
    CONFERENCE = "conference"
    CLIENT_ENTERTAINMENT = "client_entertainment"
    OTHER = "other"


class ExpenseReportStatus(str, Enum):
    """Statut note de frais"""
    DRAFT = "draft"
    SUBMITTED = "submitted"
    MANAGER_APPROVED = "manager_approved"
    FINANCE_APPROVED = "finance_approved"
    PAID = "paid"
    REJECTED = "rejected"


class VehicleType(str, Enum):
    """Type de véhicule pour kilométrage"""
    CAR = "car"
    MOTORCYCLE = "motorcycle"
    BICYCLE = "bicycle"


# ============================================================================
# POINTAGE & TEMPS DE TRAVAIL
# ============================================================================

class WorkSchedule(Base):
    """Horaires de travail configurables"""
    __tablename__ = "work_schedules"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, nullable=False, index=True)

    name = Column(String(100), nullable=False)  # "35h Standard", "Équipe Matin"
    description = Column(Text)

    # Configuration hebdomadaire - Lundi
    monday_start = Column(Time)
    monday_end = Column(Time)
    monday_hours = Column(Numeric(4, 2))
    monday_working = Column(Boolean, default=True)

    # Mardi
    tuesday_start = Column(Time)
    tuesday_end = Column(Time)
    tuesday_hours = Column(Numeric(4, 2))
    tuesday_working = Column(Boolean, default=True)

    # Mercredi
    wednesday_start = Column(Time)
    wednesday_end = Column(Time)
    wednesday_hours = Column(Numeric(4, 2))
    wednesday_working = Column(Boolean, default=True)

    # Jeudi
    thursday_start = Column(Time)
    thursday_end = Column(Time)
    thursday_hours = Column(Numeric(4, 2))
    thursday_working = Column(Boolean, default=True)

    # Vendredi
    friday_start = Column(Time)
    friday_end = Column(Time)
    friday_hours = Column(Numeric(4, 2))
    friday_working = Column(Boolean, default=True)

    # Samedi
    saturday_start = Column(Time)
    saturday_end = Column(Time)
    saturday_hours = Column(Numeric(4, 2))
    saturday_working = Column(Boolean, default=False)

    # Dimanche
    sunday_start = Column(Time)
    sunday_end = Column(Time)
    sunday_hours = Column(Numeric(4, 2))
    sunday_working = Column(Boolean, default=False)

    # Paramètres
    weekly_hours = Column(Numeric(5, 2), nullable=False)  # Total hebdomadaire
    flexible = Column(Boolean, default=False)
    tolerance_minutes = Column(Integer, default=15)  # Retard toléré

    # Pauses
    break_duration = Column(Integer, default=60)  # Minutes de pause
    break_paid = Column(Boolean, default=True)

    is_default = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Shift(Base):
    """Équipes de travail (matin, soir, nuit) avec rotations"""
    __tablename__ = "shifts"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, nullable=False, index=True)

    name = Column(String(100), nullable=False)  # "Équipe Matin", "Nuit A"
    description = Column(Text)

    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)

    color = Column(String(7), default="#3B82F6")  # Code couleur pour planning

    # Rotations
    rotation_type = Column(String, default=ShiftRotationType.FIXED)
    rotation_pattern = Column(JSON)  # Ex: [1,1,2,2,0,0,0] pour semaine

    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ShiftAssignment(Base):
    """Affectation employés aux équipes"""
    __tablename__ = "shift_assignments"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, nullable=False, index=True)
    employee_id = Column(String, ForeignKey("employees.id"), nullable=False)
    shift_id = Column(String, ForeignKey("shifts.id"), nullable=False)

    start_date = Column(Date, nullable=False)
    end_date = Column(Date)

    # Jours de la semaine (1=Lundi, 7=Dimanche)
    days_of_week = Column(ARRAY(Integer))  # [1,2,3,4,5] = Lun-Ven

    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Attendance(Base):
    """Pointages et présences des employés"""
    __tablename__ = "attendances"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, nullable=False, index=True)
    employee_id = Column(String, ForeignKey("employees.id"), nullable=False, index=True)

    # Pointage entrée
    check_in = Column(DateTime, nullable=False, index=True)
    check_in_location = Column(String(200))  # GPS ou bureau
    check_in_method = Column(String, default=AttendanceMethod.WEB)
    check_in_ip = Column(String(45))  # Support IPv6
    check_in_latitude = Column(Numeric(10, 7))
    check_in_longitude = Column(Numeric(10, 7))

    # Pointage sortie
    check_out = Column(DateTime)
    check_out_location = Column(String(200))
    check_out_method = Column(String, default=AttendanceMethod.WEB)
    check_out_ip = Column(String(45))
    check_out_latitude = Column(Numeric(10, 7))
    check_out_longitude = Column(Numeric(10, 7))

    # Calculs automatiques
    worked_hours = Column(Numeric(5, 2))  # Heures travaillées
    overtime_hours = Column(Numeric(5, 2))  # Heures supplémentaires
    night_hours = Column(Numeric(5, 2))  # Heures de nuit
    weekend_hours = Column(Numeric(5, 2))  # Heures weekend
    break_duration = Column(Integer, default=0)  # Pause en minutes

    # Statut
    status = Column(String, default=AttendanceStatus.PRESENT)
    attendance_type = Column(String, default=AttendanceType.OFFICE)

    # Validation
    is_validated = Column(Boolean, default=False)
    validated_by = Column(String, ForeignKey("users.id"))
    validated_at = Column(DateTime)

    # Notes
    notes = Column(Text)
    employee_notes = Column(Text)  # Notes de l'employé
    manager_notes = Column(Text)  # Notes du manager

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# ============================================================================
# GESTION DE LA PERFORMANCE
# ============================================================================

class PerformanceReview(Base):
    """Évaluations de performance périodiques"""
    __tablename__ = "performance_reviews"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, nullable=False, index=True)
    employee_id = Column(String, ForeignKey("employees.id"), nullable=False, index=True)
    reviewer_id = Column(String, ForeignKey("users.id"), nullable=False)

    # Période
    review_period = Column(String, default=PerformanceReviewPeriod.ANNUAL)
    period_start = Column(Date, nullable=False)
    period_end = Column(Date, nullable=False)
    review_date = Column(Date)

    # Scores (échelle 1-5)
    technical_skills_score = Column(Numeric(3, 1))
    soft_skills_score = Column(Numeric(3, 1))
    productivity_score = Column(Numeric(3, 1))
    initiative_score = Column(Numeric(3, 1))
    teamwork_score = Column(Numeric(3, 1))
    punctuality_score = Column(Numeric(3, 1))
    leadership_score = Column(Numeric(3, 1))
    communication_score = Column(Numeric(3, 1))

    overall_score = Column(Numeric(3, 1))  # Moyenne pondérée
    overall_rating = Column(String, default=PerformanceRating.SATISFACTORY)

    # Commentaires détaillés
    strengths = Column(Text)
    areas_for_improvement = Column(Text)
    achievements = Column(Text)
    goals_met = Column(Text)
    goals_not_met = Column(Text)

    # Objectifs futurs
    next_period_goals = Column(JSON)  # Liste d'objectifs
    development_plan = Column(Text)

    # Recommandations
    promotion_recommended = Column(Boolean, default=False)
    promotion_details = Column(Text)
    salary_increase_recommended = Column(Boolean, default=False)
    recommended_increase_percentage = Column(Numeric(5, 2))
    training_recommended = Column(Text)

    # Processus
    status = Column(String, default=ReviewStatus.DRAFT)
    employee_comments = Column(Text)
    employee_acknowledged_at = Column(DateTime)
    employee_signature = Column(Text)  # Base64 ou URL

    # Signatures
    reviewer_signature = Column(Text)  # Base64 ou URL
    hr_signature = Column(Text)
    signed_at = Column(DateTime)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Goal(Base):
    """Objectifs individuels et d'équipe (OKR style)"""
    __tablename__ = "goals"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, nullable=False, index=True)
    employee_id = Column(String, ForeignKey("employees.id"), nullable=False, index=True)
    manager_id = Column(String, ForeignKey("users.id"), nullable=False)

    # Définition
    title = Column(String(200), nullable=False)
    description = Column(Text)
    category = Column(String, default=GoalCategory.OTHER)

    # Mesure
    metric_type = Column(String, default=GoalMetricType.NUMBER)
    target_value = Column(Numeric(15, 2))
    current_value = Column(Numeric(15, 2), default=0)
    unit = Column(String(50))  # "ventes", "%", "clients", etc.

    # Période
    start_date = Column(Date, nullable=False)
    due_date = Column(Date, nullable=False)

    # Suivi
    progress_percentage = Column(Numeric(5, 2), default=0)
    status = Column(String, default=GoalStatus.NOT_STARTED)
    priority = Column(String, default=GoalPriority.MEDIUM)

    # Résultat
    achieved = Column(Boolean, default=False)
    achievement_percentage = Column(Numeric(5, 2))
    completion_date = Column(Date)
    final_notes = Column(Text)

    # Hiérarchie d'objectifs (cascade)
    parent_goal_id = Column(String, ForeignKey("goals.id"))
    weight = Column(Numeric(5, 2), default=100)  # Pondération dans évaluation

    # Jalons
    milestones = Column(JSON)  # Liste de jalons avec dates

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Feedback360(Base):
    """Feedbacks 360° (pairs, managers, subordonnés)"""
    __tablename__ = "feedbacks_360"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, nullable=False, index=True)

    # Qui est évalué
    employee_id = Column(String, ForeignKey("employees.id"), nullable=False, index=True)

    # Qui évalue
    reviewer_id = Column(String, ForeignKey("users.id"), nullable=False)
    reviewer_relationship = Column(String, default=ReviewerRelationship.PEER)

    # Campagne de feedback
    campaign_id = Column(String, index=True)  # Pour grouper les feedbacks d'une période
    campaign_name = Column(String(200))
    is_anonymous = Column(Boolean, default=True)

    # Questions et réponses
    responses = Column(JSON)  # {question_id: {score: X, comment: "..."}}

    # Scores par catégorie (calculés depuis responses)
    leadership_score = Column(Numeric(3, 1))
    communication_score = Column(Numeric(3, 1))
    collaboration_score = Column(Numeric(3, 1))
    problem_solving_score = Column(Numeric(3, 1))
    adaptability_score = Column(Numeric(3, 1))

    overall_score = Column(Numeric(3, 1))
    overall_feedback = Column(Text)

    # Statut
    status = Column(String, default=Feedback360Status.PENDING)
    submitted_at = Column(DateTime)

    created_at = Column(DateTime, default=datetime.utcnow)


# ============================================================================
# PAIE OHADA AVANCÉE (Extensions au modèle Payslip existant)
# ============================================================================

class PayrollParameter(Base):
    """Paramètres de paie OHADA par pays/tenant"""
    __tablename__ = "payroll_parameters"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, nullable=False, index=True)
    country_code = Column(String(2), nullable=False, index=True)  # BJ, CI, SN, etc.

    # Plafonds CNSS
    cnss_ceiling_monthly = Column(Numeric(15, 2))  # Ex: 70000 XOF ou illimité selon pays
    cnss_floor_monthly = Column(Numeric(15, 2))

    # Taux de cotisations sociales (en %)
    cnss_employee_rate = Column(Numeric(5, 2), default=3.2)
    cnss_employer_rate = Column(Numeric(5, 2), default=14.4)
    pension_employee_rate = Column(Numeric(5, 2), default=1.6)
    pension_employer_rate = Column(Numeric(5, 2), default=3.6)
    fne_employer_rate = Column(Numeric(5, 2), default=0.8)  # Formation professionnelle
    accident_work_rate = Column(Numeric(5, 2), default=1.6)  # Accidents du travail

    # Barème IUTS/IRPP progressif
    tax_brackets = Column(JSON)
    # Format: [
    #   {"min": 0, "max": 50000, "rate": 0, "deduction": 0},
    #   {"min": 50001, "max": 130000, "rate": 12.5, "deduction": 6250},
    #   ...
    # ]

    # Abattements fiscaux
    tax_deduction_percentage = Column(Numeric(5, 2), default=20)  # 20% sur salaire brut
    tax_deduction_max = Column(Numeric(15, 2))  # Plafond de l'abattement
    family_deduction_per_child = Column(Numeric(10, 2))  # Déduction par enfant à charge
    max_children_deduction = Column(Integer, default=4)  # Nombre max d'enfants

    # Salaire minimum (SMIG)
    minimum_wage = Column(Numeric(10, 2), nullable=False)

    # Heures supplémentaires (majorations en %)
    overtime_rate_regular = Column(Numeric(5, 2), default=115)  # +15%
    overtime_rate_night = Column(Numeric(5, 2), default=135)  # +35% (22h-5h)
    overtime_rate_sunday = Column(Numeric(5, 2), default=150)  # +50%
    overtime_rate_holiday = Column(Numeric(5, 2), default=200)  # +100%

    # Jours fériés légaux
    public_holidays = Column(JSON)  # Liste des jours fériés du pays

    effective_date = Column(Date, nullable=False)
    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class SalaryAdvance(Base):
    """Avances sur salaire"""
    __tablename__ = "salary_advances"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, nullable=False, index=True)
    employee_id = Column(String, ForeignKey("employees.id"), nullable=False, index=True)

    request_date = Column(Date, nullable=False)
    amount_requested = Column(Numeric(15, 2), nullable=False)
    amount_approved = Column(Numeric(15, 2))

    reason = Column(Text)

    # Approbation
    status = Column(String, default="pending")  # pending, approved, rejected, paid, reimbursed
    approved_by = Column(String, ForeignKey("users.id"))
    approval_date = Column(DateTime)
    rejection_reason = Column(Text)

    # Paiement
    payment_date = Column(Date)
    payment_method = Column(String, default=PaymentMethodType.BANK_TRANSFER)
    payment_reference = Column(String(100))

    # Remboursement
    repayment_installments = Column(Integer, default=1)  # Nombre de mois
    monthly_deduction = Column(Numeric(15, 2))
    total_repaid = Column(Numeric(15, 2), default=0)
    remaining_balance = Column(Numeric(15, 2))

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Loan(Base):
    """Prêts accordés aux employés"""
    __tablename__ = "employee_loans"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, nullable=False, index=True)
    employee_id = Column(String, ForeignKey("employees.id"), nullable=False, index=True)

    loan_number = Column(String(50), unique=True)

    # Montant
    principal_amount = Column(Numeric(15, 2), nullable=False)
    interest_rate = Column(Numeric(5, 2), default=0)  # Taux annuel en %
    total_amount = Column(Numeric(15, 2))  # Principal + intérêts

    # Durée
    duration_months = Column(Integer, nullable=False)
    monthly_installment = Column(Numeric(15, 2), nullable=False)

    # Dates
    grant_date = Column(Date, nullable=False)
    first_repayment_date = Column(Date, nullable=False)

    # Statut
    status = Column(String, default="active")  # active, completed, defaulted, cancelled

    # Remboursement
    total_repaid = Column(Numeric(15, 2), default=0)
    remaining_balance = Column(Numeric(15, 2))
    last_payment_date = Column(Date)

    # Garanties
    guarantor_id = Column(String, ForeignKey("employees.id"))
    collateral = Column(Text)

    # Approbation
    approved_by = Column(String, ForeignKey("users.id"))
    approval_date = Column(DateTime)

    notes = Column(Text)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# ============================================================================
# NOTES DE FRAIS
# ============================================================================

class ExpensePolicy(Base):
    """Politique de frais (plafonds, règles)"""
    __tablename__ = "expense_policies"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, nullable=False, index=True)

    name = Column(String(100), nullable=False)
    description = Column(Text)

    # Limites par catégorie (montants journaliers en XOF ou autre devise)
    meal_daily_limit = Column(Numeric(10, 2))
    accommodation_daily_limit = Column(Numeric(10, 2))
    transport_daily_limit = Column(Numeric(10, 2))

    # Kilométrage (barèmes en XOF/km)
    mileage_rate_car = Column(Numeric(10, 2))
    mileage_rate_motorcycle = Column(Numeric(10, 2))
    mileage_rate_bicycle = Column(Numeric(10, 2))

    # Règles
    receipt_required_above = Column(Numeric(10, 2))  # Montant à partir duquel justificatif obligatoire
    requires_advance_approval = Column(Boolean, default=False)
    approval_required_above = Column(Numeric(15, 2))  # Montant nécessitant approbation préalable

    # Délais
    submission_deadline_days = Column(Integer, default=30)  # Jours après dépense pour soumettre

    # Applicabilité (peut être par département, fonction, etc.)
    applies_to_departments = Column(ARRAY(String))
    applies_to_job_titles = Column(ARRAY(String))
    applies_to_all = Column(Boolean, default=True)

    effective_date = Column(Date, nullable=False)
    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ExpenseReport(Base):
    """Notes de frais"""
    __tablename__ = "expense_reports"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, nullable=False, index=True)
    employee_id = Column(String, ForeignKey("employees.id"), nullable=False, index=True)

    # Identification
    report_number = Column(String(50), unique=True, nullable=False)
    title = Column(String(200), nullable=False)

    # Période couverte
    period_start = Column(Date, nullable=False)
    period_end = Column(Date, nullable=False)

    # Montants totaux
    total_amount = Column(Numeric(15, 2), default=0)
    currency = Column(String(3), default='XOF')
    total_amount_xof = Column(Numeric(15, 2), default=0)  # Montant converti en devise de base

    # Catégories (calculés depuis les lignes)
    mileage_total = Column(Numeric(10, 2), default=0)
    meal_total = Column(Numeric(15, 2), default=0)
    accommodation_total = Column(Numeric(15, 2), default=0)
    transport_total = Column(Numeric(15, 2), default=0)
    other_total = Column(Numeric(15, 2), default=0)

    # TVA récupérable
    vat_total = Column(Numeric(15, 2), default=0)
    vat_recoverable = Column(Numeric(15, 2), default=0)

    # Workflow d'approbation
    status = Column(String, default=ExpenseReportStatus.DRAFT)

    submitted_date = Column(DateTime)

    manager_approved_by = Column(String, ForeignKey("users.id"))
    manager_approval_date = Column(DateTime)
    manager_comments = Column(Text)

    finance_approved_by = Column(String, ForeignKey("users.id"))
    finance_approval_date = Column(DateTime)
    finance_comments = Column(Text)

    rejection_reason = Column(Text)
    rejected_by = Column(String, ForeignKey("users.id"))
    rejected_at = Column(DateTime)

    # Paiement
    payment_method = Column(String, default=PaymentMethodType.BANK_TRANSFER)
    paid_date = Column(Date)
    payment_reference = Column(String(100))
    accounting_entry_id = Column(String)  # Lien vers écriture comptable

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ExpenseLine(Base):
    """Lignes de dépenses dans une note de frais"""
    __tablename__ = "expense_lines"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, nullable=False, index=True)
    expense_report_id = Column(String, ForeignKey("expense_reports.id", ondelete="CASCADE"), nullable=False)

    # Date & description
    expense_date = Column(Date, nullable=False)
    description = Column(String(500), nullable=False)

    # Catégorie
    category = Column(String, default=ExpenseCategory.OTHER)
    subcategory = Column(String(100))

    # Montant
    amount = Column(Numeric(15, 2), nullable=False)
    currency = Column(String(3), default='XOF')
    amount_xof = Column(Numeric(15, 2))  # Montant converti
    exchange_rate = Column(Numeric(15, 6), default=1.0)

    # TVA
    vat_amount = Column(Numeric(15, 2), default=0)
    vat_rate = Column(Numeric(5, 2))  # Taux de TVA en %
    vat_recoverable = Column(Boolean, default=False)

    # Kilométrage (si applicable)
    distance_km = Column(Numeric(10, 2))
    vehicle_type = Column(String, default=VehicleType.CAR)
    rate_per_km = Column(Numeric(10, 2))
    start_location = Column(String(200))
    end_location = Column(String(200))

    # Lieu
    city = Column(String(100))
    country = Column(String(100))

    # Projet/Client (si facturable)
    project_id = Column(String)
    client_id = Column(String, ForeignKey("clients.id"))
    billable_to_client = Column(Boolean, default=False)

    # Justificatif
    receipt_url = Column(String(500))
    receipt_required = Column(Boolean, default=True)
    receipt_missing_reason = Column(Text)

    # Participants (pour repas d'affaires, etc.)
    attendees = Column(JSON)  # Liste des participants

    # Validation
    is_approved = Column(Boolean)
    rejection_reason = Column(Text)

    notes = Column(Text)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
