# 🚀 PLAN DE MODERNISATION ERP SEKA
## Transformation vers un ERP Mondial de Classe Entreprise

**Version:** 1.0
**Date:** 7 Décembre 2024
**Objectif:** Faire de SEKA un ERP compétitif face à Odoo, SAP Business One, Microsoft Dynamics

---

## 📊 ÉTAT DES LIEUX

### Points Forts Actuels
- ✅ Architecture moderne (FastAPI, async, PostgreSQL)
- ✅ CRM avancé avec IA (scoring leads, prédictions)
- ✅ Comptabilité OHADA/SYSCOHADA complète
- ✅ Trésorerie avec ML (Prophet/LSTM forecasting)
- ✅ GED sophistiquée avec OCR et IA
- ✅ Multi-tenant natif
- ✅ Automatisation CRM poussée

### Lacunes Critiques
- ❌ Module RH incomplet (30% vs ERPs modernes)
- ❌ Module Inventaire basique (20% vs ERPs)
- ❌ Pas de Manufacturing/Production
- ❌ Pas de Gestion de Projets
- ❌ Multi-devises partiel
- ❌ Pas d'applications mobiles natives

---

## 🎯 ROADMAP GLOBALE

### Phase 1 : Fondations RH & Inventaire (8-10 semaines)
**Objectif:** Module RH complet + Inventaire/WMS professionnel

### Phase 2 : Manufacturing & Projets (10-12 semaines)
**Objectif:** Production, MRP, Gestion de projets

### Phase 3 : Extensions & Optimisations (8 semaines)
**Objectif:** Multi-devises, Mobile, BI avancée

---

# 📋 PHASE 1 : MODULE RH MODERNE (Détails)

## 1.1 POINTAGE & TEMPS DE TRAVAIL 🕐

### Nouveau Modèle: `Attendance`
```python
class Attendance(Base):
    """Pointages et présences des employés"""
    __tablename__ = "attendances"

    id = Column(UUID, primary_key=True)
    tenant_id = Column(UUID, ForeignKey("tenants.id"))
    employee_id = Column(UUID, ForeignKey("employees.id"))

    # Pointage
    check_in = Column(DateTime, nullable=False)
    check_in_location = Column(String)  # GPS ou bureau
    check_in_method = Column(Enum('badge', 'biometric', 'mobile', 'manual'))
    check_in_ip = Column(String)

    check_out = Column(DateTime)
    check_out_location = Column(String)
    check_out_method = Column(Enum('badge', 'biometric', 'mobile', 'manual'))
    check_out_ip = Column(String)

    # Calculs
    worked_hours = Column(Numeric(5, 2))  # Heures travaillées
    overtime_hours = Column(Numeric(5, 2))  # Heures supplémentaires
    break_duration = Column(Integer)  # Pause en minutes

    # Statut
    status = Column(Enum('present', 'late', 'absent', 'half_day', 'remote'))
    is_validated = Column(Boolean, default=False)
    validated_by = Column(UUID, ForeignKey("users.id"))
    validated_at = Column(DateTime)

    # Notes
    notes = Column(Text)
    attendance_type = Column(Enum('office', 'remote', 'client_site', 'field'))
```

### Nouveau Modèle: `WorkSchedule`
```python
class WorkSchedule(Base):
    """Horaires de travail configurables"""
    __tablename__ = "work_schedules"

    id = Column(UUID, primary_key=True)
    tenant_id = Column(UUID, ForeignKey("tenants.id"))
    name = Column(String(100))  # Ex: "35h Standard", "Équipe Matin"

    # Configuration hebdomadaire
    monday_start = Column(Time)
    monday_end = Column(Time)
    monday_hours = Column(Numeric(4, 2))

    tuesday_start = Column(Time)
    tuesday_end = Column(Time)
    tuesday_hours = Column(Numeric(4, 2))

    # ... (mercredi à dimanche)

    # Paramètres
    weekly_hours = Column(Numeric(5, 2))  # Total hebdomadaire
    flexible = Column(Boolean, default=False)
    tolerance_minutes = Column(Integer, default=15)  # Retard toléré

    # Pauses
    break_duration = Column(Integer)  # Minutes de pause
    break_paid = Column(Boolean, default=True)

    is_default = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
```

### Nouveau Modèle: `Shift` (Équipes/Rotations)
```python
class Shift(Base):
    """Équipes de travail (matin, soir, nuit)"""
    __tablename__ = "shifts"

    id = Column(UUID, primary_key=True)
    tenant_id = Column(UUID)
    name = Column(String(100))  # "Équipe Matin", "Nuit A"

    start_time = Column(Time)
    end_time = Column(Time)
    color = Column(String(7))  # Code couleur pour planning

    # Rotations
    rotation_type = Column(Enum('fixed', 'weekly', 'bi_weekly', 'monthly'))
    rotation_pattern = Column(JSON)  # Ex: [1,1,2,2,0,0,0] pour semaine
```

### Nouveau Modèle: `ShiftAssignment`
```python
class ShiftAssignment(Base):
    """Affectation employés aux équipes"""
    __tablename__ = "shift_assignments"

    id = Column(UUID, primary_key=True)
    tenant_id = Column(UUID)
    employee_id = Column(UUID, ForeignKey("employees.id"))
    shift_id = Column(UUID, ForeignKey("shifts.id"))

    start_date = Column(Date)
    end_date = Column(Date)
    days_of_week = Column(ARRAY(Integer))  # [1,2,3,4,5] = Lun-Ven
```

### Fonctionnalités Clés
1. **Pointage Multi-Canal**
   - Badge RFID/NFC
   - Biométrie (empreinte, facial)
   - Application mobile avec géolocalisation
   - Navigateur web
   - Import manuel CSV

2. **Calculs Automatiques**
   - Heures normales vs supplémentaires
   - Retards/départs anticipés
   - Absences injustifiées
   - Temps de pause
   - Majorations (nuit, dimanche, jours fériés)

3. **Alertes & Notifications**
   - Oubli de pointage
   - Retards récurrents
   - Heures sup. dépassées
   - Anomalies (pointages multiples, horaires impossibles)

4. **Dashboard Manager**
   - Qui est présent en temps réel
   - Taux de présence par équipe
   - Heures sup. accumulées
   - Validation pointages en attente

---

## 1.2 GESTION DE LA PERFORMANCE & ÉVALUATIONS 📈

### Nouveau Modèle: `PerformanceReview`
```python
class PerformanceReview(Base):
    """Évaluations de performance périodiques"""
    __tablename__ = "performance_reviews"

    id = Column(UUID, primary_key=True)
    tenant_id = Column(UUID)
    employee_id = Column(UUID, ForeignKey("employees.id"))
    reviewer_id = Column(UUID, ForeignKey("users.id"))

    # Période
    review_period = Column(Enum('monthly', 'quarterly', 'semi_annual', 'annual'))
    period_start = Column(Date)
    period_end = Column(Date)
    review_date = Column(Date)

    # Scores (1-5 ou 1-10)
    technical_skills_score = Column(Numeric(3, 1))
    soft_skills_score = Column(Numeric(3, 1))
    productivity_score = Column(Numeric(3, 1))
    initiative_score = Column(Numeric(3, 1))
    teamwork_score = Column(Numeric(3, 1))
    punctuality_score = Column(Numeric(3, 1))

    overall_score = Column(Numeric(3, 1))  # Moyenne pondérée
    overall_rating = Column(Enum('excellent', 'good', 'satisfactory', 'needs_improvement', 'unsatisfactory'))

    # Commentaires
    strengths = Column(Text)
    areas_for_improvement = Column(Text)
    achievements = Column(Text)
    goals_met = Column(Text)

    # Objectifs futurs
    next_period_goals = Column(JSON)  # Liste d'objectifs

    # Recommandations
    promotion_recommended = Column(Boolean, default=False)
    salary_increase_recommended = Column(Boolean, default=False)
    recommended_increase_percentage = Column(Numeric(5, 2))
    training_recommended = Column(Text)

    # Processus
    status = Column(Enum('draft', 'pending_employee', 'employee_reviewed', 'pending_manager', 'completed'))
    employee_comments = Column(Text)
    employee_acknowledged_at = Column(DateTime)

    # Signatures
    reviewer_signature = Column(Text)  # Base64 ou URL
    employee_signature = Column(Text)
    signed_at = Column(DateTime)
```

### Nouveau Modèle: `Goal` (Objectifs/OKRs)
```python
class Goal(Base):
    """Objectifs individuels et d'équipe (OKR style)"""
    __tablename__ = "goals"

    id = Column(UUID, primary_key=True)
    tenant_id = Column(UUID)
    employee_id = Column(UUID, ForeignKey("employees.id"))
    manager_id = Column(UUID, ForeignKey("users.id"))

    # Définition
    title = Column(String(200))
    description = Column(Text)
    category = Column(Enum('sales', 'productivity', 'quality', 'development', 'behavioral', 'other'))

    # Mesure
    metric_type = Column(Enum('number', 'percentage', 'boolean', 'currency'))
    target_value = Column(Numeric(15, 2))
    current_value = Column(Numeric(15, 2))
    unit = Column(String(50))  # "ventes", "%", "clients"

    # Période
    start_date = Column(Date)
    due_date = Column(Date)

    # Suivi
    progress_percentage = Column(Numeric(5, 2))
    status = Column(Enum('not_started', 'in_progress', 'at_risk', 'completed', 'cancelled'))
    priority = Column(Enum('low', 'medium', 'high', 'critical'))

    # Résultat
    achieved = Column(Boolean)
    achievement_percentage = Column(Numeric(5, 2))
    completion_date = Column(Date)

    # Relation
    parent_goal_id = Column(UUID, ForeignKey("goals.id"))  # Cascade d'objectifs
    weight = Column(Numeric(5, 2), default=100)  # Pondération dans évaluation
```

### Nouveau Modèle: `Feedback360`
```python
class Feedback360(Base):
    """Feedbacks 360° (pairs, managers, subordonnés)"""
    __tablename__ = "feedbacks_360"

    id = Column(UUID, primary_key=True)
    tenant_id = Column(UUID)

    # Qui est évalué
    employee_id = Column(UUID, ForeignKey("employees.id"))

    # Qui évalue
    reviewer_id = Column(UUID, ForeignKey("users.id"))
    reviewer_relationship = Column(Enum('manager', 'peer', 'subordinate', 'client', 'self'))

    # Campagne
    campaign_id = Column(UUID)  # Pour grouper les feedbacks d'une période
    is_anonymous = Column(Boolean, default=True)

    # Questions et réponses
    responses = Column(JSON)  # {question_id: {score: X, comment: "..."}}

    # Scores par catégorie
    leadership_score = Column(Numeric(3, 1))
    communication_score = Column(Numeric(3, 1))
    collaboration_score = Column(Numeric(3, 1))
    problem_solving_score = Column(Numeric(3, 1))

    overall_feedback = Column(Text)

    status = Column(Enum('pending', 'in_progress', 'submitted'))
    submitted_at = Column(DateTime)
```

### Fonctionnalités Clés
1. **Cycles d'Évaluation**
   - Campagnes planifiées (mensuel, trimestriel, annuel)
   - Workflow: auto-évaluation → manager → validation RH
   - Modèles de formulaires personnalisables
   - Matrices 9-box pour identifier talents

2. **OKRs & Objectifs**
   - Cascade d'objectifs (entreprise → équipe → individu)
   - Suivi temps réel du progrès
   - Check-ins réguliers (1-on-1)
   - Alignement stratégique

3. **Feedback Continu**
   - Feedback 360° anonyme
   - Reconnaissance entre pairs (kudos)
   - Commentaires en temps réel
   - Historique complet

4. **Analytics Performance**
   - Évolution scores dans le temps
   - Comparaison avec moyennes
   - Identification high performers
   - Plans de développement personnalisés

---

## 1.3 PAIE OHADA AVANCÉE 💰

### Amélioration Modèle: `Payslip` (Existant)
**Ajouts nécessaires:**
```python
class Payslip(Base):
    # ... (existant) ...

    # NOUVEAUX CHAMPS pour OHADA complet

    # Base de calcul
    base_salary = Column(Numeric(15, 2))
    hourly_rate = Column(Numeric(10, 2))
    hours_worked = Column(Numeric(6, 2))
    overtime_hours = Column(Numeric(6, 2))

    # Éléments de rémunération
    earnings = Column(JSON)  # Détail complet
    # {
    #   "base_salary": 500000,
    #   "transport_allowance": 25000,
    #   "housing_allowance": 50000,
    #   "function_allowance": 30000,
    #   "overtime_pay": 45000,
    #   "bonus": 100000,
    #   "commission": 75000
    # }

    # Cotisations sociales OHADA/CNSS
    social_contributions = Column(JSON)
    # {
    #   "cnss_employee": 36400,  # 3.2% plafonné
    #   "cnss_employer": 163800,  # 14.4% plafonné
    #   "pension_employee": 18200,  # 1.6%
    #   "pension_employer": 40950,  # 3.6%
    #   "fne": 9100,  # 0.8% employeur
    #   "accident_work": 18200  # 1.6% employeur
    # }

    # Impôts (IUTS/IRPP selon pays)
    tax_details = Column(JSON)
    # {
    #   "taxable_income": 650000,
    #   "tax_brackets": [...],
    #   "iuts_amount": 95000,
    #   "tax_rate": 14.6,
    #   "deductions": {...}
    # }

    # Déductions diverses
    other_deductions = Column(JSON)
    # {
    #   "loan_repayment": 50000,
    #   "advance_deduction": 25000,
    #   "union_fees": 2000,
    #   "insurance": 10000
    # }

    # Résultats finaux
    gross_salary = Column(Numeric(15, 2))
    taxable_salary = Column(Numeric(15, 2))
    total_employee_deductions = Column(Numeric(15, 2))
    total_employer_contributions = Column(Numeric(15, 2))
    net_salary = Column(Numeric(15, 2))
    net_to_pay = Column(Numeric(15, 2))  # Après toutes déductions

    # Coût entreprise total
    total_cost = Column(Numeric(15, 2))

    # Validation
    validated_by_manager = Column(UUID)
    manager_validation_date = Column(DateTime)
    validated_by_hr = Column(UUID)
    hr_validation_date = Column(DateTime)
    validated_by_finance = Column(UUID)
    finance_validation_date = Column(DateTime)

    # Paiement
    payment_method = Column(Enum('bank_transfer', 'check', 'cash', 'mobile_money'))
    bank_account = Column(String)
    payment_reference = Column(String)
    paid_at = Column(DateTime)
```

### Nouveau Modèle: `PayrollParameter`
```python
class PayrollParameter(Base):
    """Paramètres de paie par pays/tenant"""
    __tablename__ = "payroll_parameters"

    id = Column(UUID, primary_key=True)
    tenant_id = Column(UUID)
    country_code = Column(String(2))  # BJ, CI, SN, etc.

    # Plafonds CNSS
    cnss_ceiling_monthly = Column(Numeric(15, 2))  # Ex: 70000 FCFA pour certains
    cnss_floor_monthly = Column(Numeric(15, 2))

    # Taux de cotisations (%)
    cnss_employee_rate = Column(Numeric(5, 2))  # 3.2
    cnss_employer_rate = Column(Numeric(5, 2))  # 14.4
    pension_employee_rate = Column(Numeric(5, 2))
    pension_employer_rate = Column(Numeric(5, 2))
    fne_employer_rate = Column(Numeric(5, 2))  # Formation
    accident_work_rate = Column(Numeric(5, 2))

    # Barème IUTS/IRPP
    tax_brackets = Column(JSON)
    # [
    #   {"min": 0, "max": 50000, "rate": 0, "deduction": 0},
    #   {"min": 50001, "max": 130000, "rate": 12.5, "deduction": 6250},
    #   {"min": 130001, "max": 280000, "rate": 14.5, "deduction": 8850},
    #   {"min": 280001, "max": 530000, "rate": 17.5, "deduction": 17250},
    #   {"min": 530001, "max": null, "rate": 20, "deduction": 30500}
    # ]

    # Abattements fiscaux
    tax_deduction_percentage = Column(Numeric(5, 2))  # 20% sur salaire brut
    tax_deduction_max = Column(Numeric(15, 2))
    family_deduction_per_child = Column(Numeric(10, 2))
    max_children_deduction = Column(Integer, default=4)

    # SMIG/Salaire minimum
    minimum_wage = Column(Numeric(10, 2))

    # Heures supplémentaires
    overtime_rate_regular = Column(Numeric(5, 2), default=115)  # +15%
    overtime_rate_night = Column(Numeric(5, 2), default=135)  # +35%
    overtime_rate_sunday = Column(Numeric(5, 2), default=150)  # +50%
    overtime_rate_holiday = Column(Numeric(5, 2), default=200)  # +100%

    # Jours fériés
    public_holidays = Column(JSON)  # Liste des jours fériés

    effective_date = Column(Date)
    is_active = Column(Boolean, default=True)
```

### Nouveau Modèle: `SalaryAdvance`
```python
class SalaryAdvance(Base):
    """Avances sur salaire"""
    __tablename__ = "salary_advances"

    id = Column(UUID, primary_key=True)
    tenant_id = Column(UUID)
    employee_id = Column(UUID, ForeignKey("employees.id"))

    request_date = Column(Date)
    amount_requested = Column(Numeric(15, 2))
    amount_approved = Column(Numeric(15, 2))

    reason = Column(Text)

    # Approbation
    status = Column(Enum('pending', 'approved', 'rejected', 'paid', 'reimbursed'))
    approved_by = Column(UUID, ForeignKey("users.id"))
    approval_date = Column(DateTime)
    rejection_reason = Column(Text)

    # Paiement
    payment_date = Column(Date)
    payment_method = Column(Enum('bank_transfer', 'cash', 'mobile_money'))

    # Remboursement
    repayment_installments = Column(Integer)  # Nombre de mois
    monthly_deduction = Column(Numeric(15, 2))
    total_repaid = Column(Numeric(15, 2), default=0)
    remaining_balance = Column(Numeric(15, 2))
```

### Nouveau Modèle: `Loan` (Prêts employés)
```python
class Loan(Base):
    """Prêts accordés aux employés"""
    __tablename__ = "employee_loans"

    id = Column(UUID, primary_key=True)
    tenant_id = Column(UUID)
    employee_id = Column(UUID, ForeignKey("employees.id"))

    # Montant
    principal_amount = Column(Numeric(15, 2))
    interest_rate = Column(Numeric(5, 2), default=0)
    total_amount = Column(Numeric(15, 2))  # Principal + intérêts

    # Durée
    duration_months = Column(Integer)
    monthly_installment = Column(Numeric(15, 2))

    # Dates
    grant_date = Column(Date)
    first_repayment_date = Column(Date)

    # Statut
    status = Column(Enum('active', 'completed', 'defaulted', 'cancelled'))

    # Remboursement
    total_repaid = Column(Numeric(15, 2), default=0)
    remaining_balance = Column(Numeric(15, 2))

    # Garanties
    guarantor_id = Column(UUID, ForeignKey("employees.id"))
    collateral = Column(Text)
```

### Fonctionnalités Paie Avancées

1. **Calcul Automatique OHADA**
   - Cotisations CNSS avec plafonnement
   - Retraite complémentaire
   - Accidents du travail
   - FNE (Formation)
   - IUTS/IRPP progressif avec barème
   - Abattements fiscaux (20% + famille)

2. **Éléments Variables**
   - Primes (performance, ancienneté, transport)
   - Heures supplémentaires (taux majorés)
   - Indemnités (logement, fonction, déplacement)
   - Commissions
   - Avantages en nature (valorisation fiscale)

3. **Gestion Avances & Prêts**
   - Demandes d'avance workflow
   - Prêts avec échéancier
   - Déductions automatiques sur paie
   - Historique remboursements

4. **Workflow Validation**
   - Manager → RH → Finance
   - Contrôles automatiques (SMIG, plafonds)
   - Alertes anomalies
   - Verrouillage période paie

5. **Génération Documents**
   - Bulletin de paie PDF conforme
   - Livre de paie
   - Déclarations sociales (CNSS)
   - Déclarations fiscales (IUTS)
   - État récapitulatif mensuel

6. **Intégration Comptable**
   - Écritures comptables auto (6xx, 4xx)
   - Lettrage avec paiements
   - États de charges sociales
   - Provisions congés payés

---

## 1.4 RECRUTEMENT (ATS - Applicant Tracking System) 🎯

### Nouveau Modèle: `JobPosting`
```python
class JobPosting(Base):
    """Offres d'emploi"""
    __tablename__ = "job_postings"

    id = Column(UUID, primary_key=True)
    tenant_id = Column(UUID)

    # Poste
    title = Column(String(200))
    department = Column(String(100))
    job_type = Column(Enum('full_time', 'part_time', 'contract', 'internship', 'freelance'))
    contract_type = Column(Enum('CDI', 'CDD', 'stage', 'alternance'))
    location = Column(String(200))
    remote_allowed = Column(Boolean, default=False)

    # Description
    description = Column(Text)
    responsibilities = Column(Text)
    requirements = Column(Text)
    nice_to_have = Column(Text)

    # Rémunération
    salary_min = Column(Numeric(15, 2))
    salary_max = Column(Numeric(15, 2))
    salary_currency = Column(String(3), default='XOF')
    salary_period = Column(Enum('hour', 'month', 'year'))
    benefits = Column(Text)

    # Détails
    experience_years_min = Column(Integer)
    experience_years_max = Column(Integer)
    education_level = Column(Enum('high_school', 'bachelor', 'master', 'phd', 'none'))
    languages = Column(JSON)  # [{"language": "French", "level": "fluent"}]
    skills_required = Column(ARRAY(String))

    # Processus
    hiring_manager_id = Column(UUID, ForeignKey("users.id"))
    recruiter_id = Column(UUID, ForeignKey("users.id"))
    positions_available = Column(Integer, default=1)

    # Publication
    status = Column(Enum('draft', 'open', 'paused', 'closed', 'filled'))
    published_date = Column(Date)
    closing_date = Column(Date)

    # Diffusion
    publish_on_website = Column(Boolean, default=True)
    publish_on_linkedin = Column(Boolean, default=False)
    publish_on_jobboards = Column(JSON)  # ["Indeed", "Glassdoor"]

    # Tracking
    views_count = Column(Integer, default=0)
    applications_count = Column(Integer, default=0)
```

### Nouveau Modèle: `JobApplication`
```python
class JobApplication(Base):
    """Candidatures"""
    __tablename__ = "job_applications"

    id = Column(UUID, primary_key=True)
    tenant_id = Column(UUID)
    job_posting_id = Column(UUID, ForeignKey("job_postings.id"))

    # Candidat
    first_name = Column(String(100))
    last_name = Column(String(100))
    email = Column(String(255), index=True)
    phone = Column(String(20))

    # Adresse
    address = Column(Text)
    city = Column(String(100))
    country = Column(String(100))

    # Documents
    cv_file_url = Column(String(500))
    cover_letter_file_url = Column(String(500))
    portfolio_url = Column(String(500))
    linkedin_url = Column(String(500))

    # Informations
    current_position = Column(String(200))
    current_company = Column(String(200))
    years_experience = Column(Integer)
    education = Column(Text)
    skills = Column(ARRAY(String))

    # Motivation
    cover_letter_text = Column(Text)

    # Salaire
    expected_salary = Column(Numeric(15, 2))
    salary_currency = Column(String(3))

    # Disponibilité
    available_from = Column(Date)
    notice_period_days = Column(Integer)

    # Source
    application_source = Column(Enum('website', 'linkedin', 'referral', 'job_board', 'direct'))
    referral_employee_id = Column(UUID, ForeignKey("employees.id"))

    # Statut
    status = Column(Enum(
        'new', 'reviewed', 'shortlisted', 'phone_screen', 'interview',
        'technical_test', 'offer', 'hired', 'rejected', 'withdrawn'
    ))

    # Évaluation
    rating = Column(Numeric(3, 1))  # 1-5 étoiles
    notes = Column(Text)

    # Processus
    assigned_to = Column(UUID, ForeignKey("users.id"))

    # Dates
    applied_at = Column(DateTime)
    reviewed_at = Column(DateTime)
    last_activity_at = Column(DateTime)
```

### Nouveau Modèle: `Interview`
```python
class Interview(Base):
    """Entretiens"""
    __tablename__ = "interviews"

    id = Column(UUID, primary_key=True)
    tenant_id = Column(UUID)
    application_id = Column(UUID, ForeignKey("job_applications.id"))

    # Type
    interview_type = Column(Enum('phone', 'video', 'in_person', 'technical', 'panel'))
    interview_round = Column(Integer)  # 1er tour, 2ème tour

    # Planification
    scheduled_date = Column(DateTime)
    duration_minutes = Column(Integer, default=60)
    location = Column(String(200))  # Bureau ou lien visio
    meeting_link = Column(String(500))

    # Interviewers
    interviewers = Column(ARRAY(UUID))  # Liste d'IDs users

    # Statut
    status = Column(Enum('scheduled', 'completed', 'cancelled', 'no_show'))

    # Résultats
    interview_date_actual = Column(DateTime)
    overall_rating = Column(Numeric(3, 1))
    technical_score = Column(Numeric(3, 1))
    communication_score = Column(Numeric(3, 1))
    cultural_fit_score = Column(Numeric(3, 1))

    # Feedback
    interviewer_notes = Column(JSON)  # {interviewer_id: "notes..."}
    strengths = Column(Text)
    weaknesses = Column(Text)
    recommendation = Column(Enum('strong_yes', 'yes', 'maybe', 'no', 'strong_no'))

    # Documents
    evaluation_form_url = Column(String(500))
```

### Nouveau Modèle: `JobOffer`
```python
class JobOffer(Base):
    """Offres d'emploi aux candidats retenus"""
    __tablename__ = "job_offers"

    id = Column(UUID, primary_key=True)
    tenant_id = Column(UUID)
    application_id = Column(UUID, ForeignKey("job_applications.id"))

    # Poste
    job_title = Column(String(200))
    department = Column(String(100))
    start_date = Column(Date)
    contract_type = Column(Enum('CDI', 'CDD', 'stage', 'freelance'))
    contract_duration_months = Column(Integer)  # Si CDD

    # Rémunération
    base_salary = Column(Numeric(15, 2))
    currency = Column(String(3))
    salary_period = Column(Enum('month', 'year'))

    # Avantages
    benefits = Column(JSON)
    # {
    #   "transport_allowance": 25000,
    #   "housing_allowance": 50000,
    #   "health_insurance": true,
    #   "meal_vouchers": true,
    #   "vacation_days": 22
    # }

    # Conditions
    probation_period_months = Column(Integer, default=3)
    notice_period_days = Column(Integer)
    work_schedule = Column(String(100))

    # Processus
    offer_date = Column(Date)
    expiry_date = Column(Date)

    status = Column(Enum('draft', 'sent', 'accepted', 'declined', 'expired'))

    # Réponse candidat
    candidate_response_date = Column(DateTime)
    candidate_comments = Column(Text)

    # Documents
    offer_letter_url = Column(String(500))
    signed_offer_url = Column(String(500))
```

### Fonctionnalités Clés Recrutement

1. **Gestion Offres**
   - Publication multi-canal (site, LinkedIn, job boards)
   - Modèles d'offres réutilisables
   - SEO optimisé
   - Partage facile (URL, QR code)

2. **Sourcing Candidats**
   - Parsing CV automatique (extraction données)
   - Intégration LinkedIn
   - Import candidatures email
   - Cooptation employés (bonus)

3. **Tri & Qualification**
   - Filtres avancés (compétences, expérience, salaire)
   - Scoring automatique candidats
   - Alertes candidats correspondants
   - Shortlisting

4. **Pipeline Recrutement**
   - Workflow personnalisable par poste
   - Drag & drop entre étapes
   - Actions groupées
   - Statistiques temps par étape

5. **Entretiens**
   - Planification avec calendrier
   - Invitations auto (email + calendar)
   - Grilles d'évaluation standardisées
   - Feedback collaboratif

6. **Offres & Onboarding**
   - Génération offres d'emploi
   - Signature électronique
   - Suivi acceptations
   - Transition vers employé

---

## 1.5 FORMATION & DÉVELOPPEMENT 📚

### Nouveau Modèle: `TrainingCourse`
```python
class TrainingCourse(Base):
    """Catalogue de formations"""
    __tablename__ = "training_courses"

    id = Column(UUID, primary_key=True)
    tenant_id = Column(UUID)

    # Informations
    code = Column(String(50), unique=True)
    title = Column(String(200))
    description = Column(Text)
    category = Column(Enum(
        'technical', 'management', 'soft_skills', 'compliance',
        'safety', 'product', 'sales', 'language', 'certification'
    ))

    # Contenu
    objectives = Column(Text)
    syllabus = Column(Text)
    prerequisites = Column(Text)
    target_audience = Column(String(200))

    # Format
    delivery_method = Column(Enum('classroom', 'online', 'blended', 'on_the_job', 'workshop'))
    duration_hours = Column(Integer)
    max_participants = Column(Integer)

    # Logistique
    provider = Column(String(200))  # Interne ou organisme externe
    trainer_id = Column(UUID, ForeignKey("employees.id"))
    cost_per_participant = Column(Numeric(15, 2))
    currency = Column(String(3))

    # Certification
    certification_available = Column(Boolean, default=False)
    certification_name = Column(String(200))
    certification_validity_months = Column(Integer)

    # Documents
    materials_url = Column(String(500))

    is_active = Column(Boolean, default=True)
```

### Nouveau Modèle: `TrainingSession`
```python
class TrainingSession(Base):
    """Sessions de formation planifiées"""
    __tablename__ = "training_sessions"

    id = Column(UUID, primary_key=True)
    tenant_id = Column(UUID)
    course_id = Column(UUID, ForeignKey("training_courses.id"))

    # Planification
    session_code = Column(String(50))
    start_date = Column(DateTime)
    end_date = Column(DateTime)
    location = Column(String(200))
    online_link = Column(String(500))

    # Formateur
    trainer_id = Column(UUID, ForeignKey("employees.id"))
    external_trainer_name = Column(String(200))

    # Capacité
    max_participants = Column(Integer)
    registered_count = Column(Integer, default=0)

    # Statut
    status = Column(Enum('planned', 'confirmed', 'in_progress', 'completed', 'cancelled'))

    # Évaluation
    average_rating = Column(Numeric(3, 1))
    completion_rate = Column(Numeric(5, 2))

    # Coûts
    total_cost = Column(Numeric(15, 2))
```

### Nouveau Modèle: `TrainingEnrollment`
```python
class TrainingEnrollment(Base):
    """Inscriptions aux formations"""
    __tablename__ = "training_enrollments"

    id = Column(UUID, primary_key=True)
    tenant_id = Column(UUID)
    session_id = Column(UUID, ForeignKey("training_sessions.id"))
    employee_id = Column(UUID, ForeignKey("employees.id"))

    # Inscription
    enrollment_date = Column(Date)
    enrollment_type = Column(Enum('voluntary', 'mandatory', 'manager_assigned'))
    enrolled_by = Column(UUID, ForeignKey("users.id"))

    # Approbation
    status = Column(Enum('pending', 'approved', 'rejected', 'registered', 'completed', 'cancelled'))
    approved_by = Column(UUID)
    approval_date = Column(DateTime)

    # Participation
    attendance_status = Column(Enum('registered', 'attended', 'partially_attended', 'absent'))
    attendance_percentage = Column(Numeric(5, 2))

    # Résultats
    completed = Column(Boolean, default=False)
    completion_date = Column(Date)
    exam_score = Column(Numeric(5, 2))
    passed = Column(Boolean)

    # Certification
    certificate_issued = Column(Boolean, default=False)
    certificate_url = Column(String(500))
    certificate_number = Column(String(100))
    certificate_expiry_date = Column(Date)

    # Feedback
    rating = Column(Numeric(3, 1))
    feedback = Column(Text)
```

### Nouveau Modèle: `SkillMatrix`
```python
class SkillMatrix(Base):
    """Matrice de compétences"""
    __tablename__ = "skill_matrices"

    id = Column(UUID, primary_key=True)
    tenant_id = Column(UUID)

    # Compétence
    skill_name = Column(String(200))
    skill_category = Column(Enum(
        'technical', 'software', 'language', 'management',
        'communication', 'analytical', 'creative', 'other'
    ))
    description = Column(Text)

    # Niveaux
    # 1 = Débutant, 2 = Intermédiaire, 3 = Avancé, 4 = Expert, 5 = Maître
    level_1_description = Column(String(200))
    level_2_description = Column(String(200))
    level_3_description = Column(String(200))
    level_4_description = Column(String(200))
    level_5_description = Column(String(200))

    is_active = Column(Boolean, default=True)
```

### Nouveau Modèle: `EmployeeSkill`
```python
class EmployeeSkill(Base):
    """Compétences des employés"""
    __tablename__ = "employee_skills"

    id = Column(UUID, primary_key=True)
    tenant_id = Column(UUID)
    employee_id = Column(UUID, ForeignKey("employees.id"))
    skill_id = Column(UUID, ForeignKey("skill_matrices.id"))

    # Niveau actuel
    current_level = Column(Integer)  # 1-5
    self_assessed_level = Column(Integer)
    manager_assessed_level = Column(Integer)

    # Niveau cible
    target_level = Column(Integer)
    target_date = Column(Date)

    # Acquisition
    acquired_date = Column(Date)
    last_used_date = Column(Date)

    # Validation
    certified = Column(Boolean, default=False)
    certification_name = Column(String(200))
    certification_date = Column(Date)
    certification_expiry = Column(Date)

    # Évaluation
    last_assessed_date = Column(Date)
    assessed_by = Column(UUID, ForeignKey("users.id"))
    notes = Column(Text)
```

### Nouveau Modèle: `DevelopmentPlan`
```python
class DevelopmentPlan(Base):
    """Plans de développement individuel (PDI)"""
    __tablename__ = "development_plans"

    id = Column(UUID, primary_key=True)
    tenant_id = Column(UUID)
    employee_id = Column(UUID, ForeignKey("employees.id"))

    # Période
    plan_year = Column(Integer)
    start_date = Column(Date)
    end_date = Column(Date)

    # Objectifs carrière
    career_goals = Column(Text)
    desired_position = Column(String(200))
    target_timeline = Column(String(100))

    # Compétences à développer
    skills_to_develop = Column(JSON)
    # [
    #   {"skill_id": "xxx", "current": 2, "target": 4, "priority": "high"},
    #   ...
    # ]

    # Actions
    training_required = Column(JSON)  # Liste de formations nécessaires
    mentoring_required = Column(Boolean)
    job_rotation_planned = Column(Boolean)

    # Budget
    budget_allocated = Column(Numeric(15, 2))
    budget_spent = Column(Numeric(15, 2))

    # Suivi
    status = Column(Enum('draft', 'active', 'in_progress', 'completed', 'cancelled'))
    progress_percentage = Column(Numeric(5, 2))

    # Revues
    last_review_date = Column(Date)
    next_review_date = Column(Date)

    # Approbation
    approved_by = Column(UUID, ForeignKey("users.id"))
    approval_date = Column(DateTime)
```

### Fonctionnalités Formation

1. **Catalogue de Formations**
   - Formations internes/externes
   - E-learning intégré
   - Modèles de formations
   - Certification tracking

2. **Gestion Sessions**
   - Planification automatique
   - Gestion salles/équipements
   - Inscriptions en ligne
   - Listes d'attente

3. **Suivi Participation**
   - Présence (signature, QR code)
   - Évaluations à chaud/à froid
   - Certificats automatiques
   - ROI formation

4. **Matrice de Compétences**
   - Référentiel entreprise
   - Auto-évaluation employés
   - Évaluation managers
   - Gap analysis

5. **Plans de Développement**
   - PDI personnalisés
   - Succession planning
   - Budget formation
   - Suivi carrière

---

## 1.6 NOTES DE FRAIS 💳

### Nouveau Modèle: `ExpenseReport`
```python
class ExpenseReport(Base):
    """Notes de frais"""
    __tablename__ = "expense_reports"

    id = Column(UUID, primary_key=True)
    tenant_id = ma(UUID)
    employee_id = Column(UUID, ForeignKey("employees.id"))

    # Identification
    report_number = Column(String(50), unique=True)
    title = Column(String(200))

    # Période
    period_start = Column(Date)
    period_end = Column(Date)

    # Montants
    total_amount = Column(Numeric(15, 2))
    currency = Column(String(3), default='XOF')
    total_amount_xof = Column(Numeric(15, 2))  # Converti

    # Catégories
    mileage_total = Column(Numeric(10, 2))
    meal_total = Column(Numeric(15, 2))
    accommodation_total = Column(Numeric(15, 2))
    transport_total = Column(Numeric(15, 2))
    other_total = Column(Numeric(15, 2))

    # Workflow
    status = Column(Enum('draft', 'submitted', 'manager_approved', 'finance_approved', 'paid', 'rejected'))

    submitted_date = Column(DateTime)

    manager_approved_by = Column(UUID, ForeignKey("users.id"))
    manager_approval_date = Column(DateTime)
    manager_comments = Column(Text)

    finance_approved_by = Column(UUID)
    finance_approval_date = Column(DateTime)
    finance_comments = Column(Text)

    rejection_reason = Column(Text)

    # Paiement
    payment_method = Column(Enum('bank_transfer', 'check', 'cash'))
    paid_date = Column(Date)
    payment_reference = Column(String(100))
```

### Nouveau Modèle: `ExpenseLine`
```python
class ExpenseLine(Base):
    """Lignes de note de frais"""
    __tablename__ = "expense_lines"

    id = Column(UUID, primary_key=True)
    tenant_id = Column(UUID)
    expense_report_id = Column(UUID, ForeignKey("expense_reports.id"))

    # Date & description
    expense_date = Column(Date)
    description = Column(String(500))

    # Catégorie
    category = Column(Enum(
        'meal', 'accommodation', 'transport', 'fuel', 'mileage',
        'parking', 'toll', 'phone', 'internet', 'supplies',
        'training', 'conference', 'client_entertainment', 'other'
    ))

    # Montant
    amount = Column(Numeric(15, 2))
    currency = Column(String(3))
    amount_xof = Column(Numeric(15, 2))

    # TVA
    vat_amount = Column(Numeric(15, 2))
    vat_recoverable = Column(Boolean, default=False)

    # Kilométrage
    distance_km = Column(Numeric(10, 2))
    vehicle_type = Column(Enum('car', 'motorcycle', 'bicycle'))
    rate_per_km = Column(Numeric(10, 2))

    # Lieu
    location = Column(String(200))

    # Projet/client
    project_id = Column(UUID)
    client_id = Column(UUID, ForeignKey("clients.id"))
    billable_to_client = Column(Boolean, default=False)

    # Justificatif
    receipt_url = Column(String(500))
    receipt_required = Column(Boolean, default=True)
    receipt_missing_reason = Column(Text)

    # Validation
    is_approved = Column(Boolean)
    rejection_reason = Column(Text)
```

### Nouveau Modèle: `ExpensePolicy`
```python
class ExpensePolicy(Base):
    """Politique de frais (plafonds, règles)"""
    __tablename__ = "expense_policies"

    id = Column(UUID, primary_key=True)
    tenant_id = Column(UUID)

    name = Column(String(100))
    description = Column(Text)

    # Limites par catégorie (par jour)
    meal_daily_limit = Column(Numeric(10, 2))
    accommodation_daily_limit = Column(Numeric(10, 2))

    # Kilométrage
    mileage_rate_car = Column(Numeric(10, 2))  # Par km
    mileage_rate_motorcycle = Column(Numeric(10, 2))
    mileage_rate_bicycle = Column(Numeric(10, 2))

    # Règles
    receipt_required_above = Column(Numeric(10, 2))  # Montant
    requires_advance_approval = Column(Boolean)
    approval_required_above = Column(Numeric(15, 2))

    # Délais
    submission_deadline_days = Column(Integer)  # Jours après dépense

    # Applicabilité
    applies_to_departments = Column(ARRAY(String))
    applies_to_job_titles = Column(ARRAY(String))

    effective_date = Column(Date)
    is_active = Column(Boolean, default=True)
```

---

## 1.7 GESTION DES ÉQUIPEMENTS (Asset Management) 💻

### Nouveau Modèle: `Asset`
```python
class Asset(Base):
    """Équipements/matériel de l'entreprise"""
    __tablename__ = "assets"

    id = Column(UUID, primary_key=True)
    tenant_id = Column(UUID)

    # Identification
    asset_tag = Column(String(50), unique=True)
    name = Column(String(200))
    category = Column(Enum(
        'computer', 'laptop', 'phone', 'tablet', 'printer',
        'furniture', 'vehicle', 'equipment', 'software_license', 'other'
    ))
    subcategory = Column(String(100))

    # Détails
    brand = Column(String(100))
    model = Column(String(100))
    serial_number = Column(String(100))
    description = Column(Text)

    # Valeur
    purchase_price = Column(Numeric(15, 2))
    current_value = Column(Numeric(15, 2))
    currency = Column(String(3))

    # Dates
    purchase_date = Column(Date)
    warranty_expiry_date = Column(Date)
    depreciation_period_months = Column(Integer)

    # Localisation
    location = Column(String(200))
    department = Column(String(100))

    # Assignation
    assigned_to_employee_id = Column(UUID, ForeignKey("employees.id"))
    assigned_date = Column(Date)
    return_date = Column(Date)

    # Statut
    status = Column(Enum('available', 'assigned', 'in_repair', 'retired', 'lost', 'stolen'))
    condition = Column(Enum('excellent', 'good', 'fair', 'poor'))

    # Maintenance
    last_maintenance_date = Column(Date)
    next_maintenance_date = Column(Date)

    # Fournisseur
    supplier_id = Column(UUID, ForeignKey("suppliers.id"))
    purchase_order_number = Column(String(50))

    # Documents
    invoice_url = Column(String(500))
    warranty_document_url = Column(String(500))
    manual_url = Column(String(500))

    is_active = Column(Boolean, default=True)
```

### Nouveau Modèle: `AssetAssignment`
```python
class AssetAssignment(Base):
    """Historique d'assignation des équipements"""
    __tablename__ = "asset_assignments"

    id = Column(UUID, primary_key=True)
    tenant_id = Column(UUID)
    asset_id = Column(UUID, ForeignKey("assets.id"))
    employee_id = Column(UUID, ForeignKey("employees.id"))

    assigned_date = Column(Date)
    expected_return_date = Column(Date)
    actual_return_date = Column(Date)

    assigned_by = Column(UUID, ForeignKey("users.id"))
    return_condition = Column(Enum('excellent', 'good', 'fair', 'poor', 'damaged'))

    notes = Column(Text)

    # Signature
    employee_signature = Column(Text)
    signed_at = Column(DateTime)
```

---

## 1.8 ONBOARDING/OFFBOARDING 🚪

### Nouveau Modèle: `OnboardingChecklist`
```python
class OnboardingChecklist(Base):
    """Checklist d'intégration nouveaux employés"""
    __tablename__ = "onboarding_checklists"

    id = Column(UUID, primary_key=True)
    tenant_id = Column(UUID)
    employee_id = Column(UUID, ForeignKey("employees.id"))

    # Dates
    start_date = Column(Date)
    target_completion_date = Column(Date)
    actual_completion_date = Column(Date)

    # Statut
    status = Column(Enum('not_started', 'in_progress', 'completed'))
    completion_percentage = Column(Numeric(5, 2))

    # Responsable
    assigned_to = Column(UUID, ForeignKey("users.id"))  # RH ou manager
    buddy_id = Column(UUID, ForeignKey("employees.id"))  # Parrain
```

### Nouveau Modèle: `OnboardingTask`
```python
class OnboardingTask(Base):
    """Tâches d'onboarding"""
    __tablename__ = "onboarding_tasks"

    id = Column(UUID, primary_key=True)
    tenant_id = Column(UUID)
    checklist_id = Column(UUID, ForeignKey("onboarding_checklists.id"))

    # Tâche
    title = Column(String(200))
    description = Column(Text)
    category = Column(Enum('admin', 'it', 'training', 'introduction', 'documentation'))

    # Responsable
    responsible_department = Column(Enum('hr', 'it', 'manager', 'employee'))
    assigned_to = Column(UUID, ForeignKey("users.id"))

    # Timing
    due_days_after_start = Column(Integer)  # Ex: J+1, J+7
    due_date = Column(Date)

    # Statut
    status = Column(Enum('pending', 'in_progress', 'completed', 'skipped'))
    completed_by = Column(UUID)
    completed_date = Column(DateTime)

    # Documents
    document_url = Column(String(500))
    requires_signature = Column(Boolean, default=False)
    signature_url = Column(String(500))
```

### Nouveau Modèle: `OffboardingChecklist`
**Similaire à OnboardingChecklist mais pour départs**
- Récupération équipements
- Clôture accès IT
- Transfert connaissances
- Documents légaux (certificat travail, solde tout compte)
- Entretien de sortie

---

## 1.9 ORGANIGRAMME & HIÉRARCHIE 🏢

### Amélioration Modèle Employee (Existant)
```python
# Déjà existant:
manager_id = Column(UUID, ForeignKey("employees.id"))

# À AJOUTER:
reports_to = Column(UUID, ForeignKey("employees.id"))  # Hiérarchie fonctionnelle
dotted_line_manager_id = Column(UUID)  # Manager matriciel
level = Column(Integer)  # Niveau hiérarchique (1=CEO, 2=VP, etc.)
```

### Nouveau Modèle: `OrganizationUnit`
```python
class OrganizationUnit(Base):
    """Unités organisationnelles / Départements"""
    __tablename__ = "organization_units"

    id = Column(UUID, primary_key=True)
    tenant_id = Column(UUID)

    # Identification
    code = Column(String(50), unique=True)
    name = Column(String(200))
    description = Column(Text)

    # Hiérarchie
    parent_unit_id = Column(UUID, ForeignKey("organization_units.id"))
    level = Column(Integer)
    path = Column(String(500))  # Ex: "/1/5/12/" pour recherche

    # Responsable
    manager_id = Column(UUID, ForeignKey("employees.id"))

    # Budgets
    annual_budget = Column(Numeric(15, 2))
    headcount_budget = Column(Integer)
    actual_headcount = Column(Integer)

    # Localisation
    location = Column(String(200))
    cost_center_code = Column(String(50))

    is_active = Column(Boolean, default=True)
```

---

## 1.10 DÉCLARATIONS SOCIALES AUTOMATISÉES 📄

### Nouveau Modèle: `SocialDeclaration`
```python
class SocialDeclaration(Base):
    """Déclarations CNSS, IUTS, etc."""
    __tablename__ = "social_declarations"

    id = Column(UUID, primary_key=True)
    tenant_id = Column(UUID)

    # Type
    declaration_type = Column(Enum('cnss_monthly', 'iuts_monthly', 'annual_summary'))

    # Période
    period_year = Column(Integer)
    period_month = Column(Integer)

    # Montants
    total_gross_salaries = Column(Numeric(15, 2))
    total_cnss_contributions = Column(Numeric(15, 2))
    total_iuts_withheld = Column(Numeric(15, 2))

    # Détails
    employee_count = Column(Integer)
    declaration_data = Column(JSON)  # Détail par employé

    # Soumission
    generated_date = Column(Date)
    submitted_date = Column(Date)
    submission_reference = Column(String(100))

    # Fichiers
    declaration_file_url = Column(String(500))  # CSV ou XML selon format pays

    status = Column(Enum('draft', 'generated', 'submitted', 'accepted', 'rejected'))
```

---

# 📦 PHASE 1 : MODULE INVENTAIRE/WMS COMPLET

## 2.1 GESTION MULTI-EMPLACEMENTS 📍

### Nouveau Modèle: `Warehouse`
```python
class Warehouse(Base):
    """Entrepôts"""
    __tablename__ = "warehouses"

    id = Column(UUID, primary_key=True)
    tenant_id = Column(UUID)

    # Identification
    code = Column(String(50), unique=True)
    name = Column(String(200))

    # Adresse
    address = Column(Text)
    city = Column(String(100))
    country = Column(String(100))
    gps_latitude = Column(Numeric(10, 7))
    gps_longitude = Column(Numeric(10, 7))

    # Type
    warehouse_type = Column(Enum('main', 'regional', 'retail', 'consignment', 'virtual'))

    # Responsable
    manager_id = Column(UUID, ForeignKey("employees.id"))

    is_active = Column(Boolean, default=True)
```

### Nouveau Modèle: `Location` (Emplacement dans entrepôt)
```python
class Location(Base):
    """Emplacements de stockage dans entrepôts"""
    __tablename__ = "locations"

    id = Column(UUID, primary_key=True)
    tenant_id = Column(UUID)
    warehouse_id = Column(UUID, ForeignKey("warehouses.id"))

    # Identification
    code = Column(String(50), unique=True)  # Ex: "A-01-05-B"
    name = Column(String(200))

    # Structure
    aisle = Column(String(10))  # Allée
    rack = Column(String(10))  # Rack/Étagère
    shelf = Column(String(10))  # Niveau
    bin = Column(String(10))  # Casier

    # Type
    location_type = Column(Enum('storage', 'picking', 'receiving', 'shipping', 'quarantine', 'damaged'))

    # Capacité
    max_weight_kg = Column(Numeric(10, 2))
    max_volume_m3 = Column(Numeric(10, 2))

    is_active = Column(Boolean, default=True)
```

### Amélioration Modèle Product
```python
# À AJOUTER au modèle Product existant:

# Unités de mesure
unit_of_measure = Column(Enum('piece', 'kg', 'liter', 'meter', 'box', 'pallet'))
weight_kg = Column(Numeric(10, 3))
volume_m3 = Column(Numeric(10, 3))

# Stockage
min_stock_level = Column(Numeric(15, 2))  # Déjà existant
max_stock_level = Column(Numeric(15, 2))  # AJOUTER
reorder_point = Column(Numeric(15, 2))  # AJOUTER
reorder_quantity = Column(Numeric(15, 2))  # AJOUTER
lead_time_days = Column(Integer)  # AJOUTER

# Catégories
product_category_id = Column(UUID, ForeignKey("product_categories.id"))  # AJOUTER
abc_classification = Column(Enum('A', 'B', 'C'))  # AJOUTER (rotation)

# Traçabilité
track_by_serial = Column(Boolean, default=False)  # AJOUTER
track_by_lot = Column(Boolean, default=False)  # AJOUTER
perishable = Column(Boolean, default=False)  # AJOUTER
```

### Nouveau Modèle: `ProductCategory`
```python
class ProductCategory(Base):
    """Catégories de produits"""
    __tablename__ = "product_categories"

    id = Column(UUID, primary_key=True)
    tenant_id = Column(UUID)

    code = Column(String(50))
    name = Column(String(200))
    description = Column(Text)

    parent_category_id = Column(UUID, ForeignKey("product_categories.id"))

    is_active = Column(Boolean, default=True)
```

---

## 2.2 MOUVEMENTS DE STOCK 📊

### Nouveau Modèle: `StockMovement`
```python
class StockMovement(Base):
    """Mouvements de stock (entrées/sorties)"""
    __tablename__ = "stock_movements"

    id = Column(UUID, primary_key=True)
    tenant_id = Column(UUID)

    # Référence
    movement_number = Column(String(50), unique=True)
    movement_date = Column(DateTime)

    # Produit
    product_id = Column(UUID, ForeignKey("products.id"))

    # Emplacement
    warehouse_id = Column(UUID, ForeignKey("warehouses.id"))
    location_id = Column(UUID, ForeignKey("locations.id"))

    # Type de mouvement
    movement_type = Column(Enum(
        'purchase_receipt',  # Réception achat
        'sales_delivery',    # Livraison vente
        'transfer_in',       # Transfert entrant
        'transfer_out',      # Transfert sortant
        'adjustment',        # Ajustement inventaire
        'production_in',     # Entrée production
        'production_out',    # Consommation production
        'return_customer',   # Retour client
        'return_supplier',   # Retour fournisseur
        'damaged',           # Perte/casse
        'theft',             # Vol
        'expiry'             # Péremption
    ))

    # Quantité
    quantity = Column(Numeric(15, 2))
    unit_of_measure = Column(String(20))

    # Valorisation
    unit_cost = Column(Numeric(15, 2))
    total_cost = Column(Numeric(15, 2))

    # Traçabilité
    lot_number = Column(String(100))
    serial_number = Column(String(100))
    expiry_date = Column(Date)

    # Référence document source
    source_document_type = Column(Enum('purchase_order', 'sales_invoice', 'transfer', 'production_order', 'adjustment'))
    source_document_id = Column(UUID)
    source_document_number = Column(String(50))

    # Utilisateur
    created_by = Column(UUID, ForeignKey("users.id"))

    # Notes
    notes = Column(Text)
```

### Nouveau Modèle: `StockLevel`
```python
class StockLevel(Base):
    """Niveaux de stock en temps réel (vue consolidée)"""
    __tablename__ = "stock_levels"

    id = Column(UUID, primary_key=True)
    tenant_id = Column(UUID)

    # Produit & Emplacement
    product_id = Column(UUID, ForeignKey("products.id"))
    warehouse_id = Column(UUID, ForeignKey("warehouses.id"))
    location_id = Column(UUID, ForeignKey("locations.id"))

    # Quantités
    quantity_on_hand = Column(Numeric(15, 2))  # Stock physique
    quantity_reserved = Column(Numeric(15, 2))  # Réservé commandes
    quantity_available = Column(Numeric(15, 2))  # Disponible = on_hand - reserved
    quantity_on_order = Column(Numeric(15, 2))  # En commande fournisseur

    # Valorisation
    unit_cost = Column(Numeric(15, 2))
    total_value = Column(Numeric(15, 2))

    # Alertes
    status = Column(Enum('ok', 'low', 'out_of_stock', 'overstock'))

    last_movement_date = Column(DateTime)
    last_updated = Column(DateTime)
```

---

## 2.3 TRAÇABILITÉ (Lots & Séries) 🔍

### Nouveau Modèle: `LotNumber`
```python
class LotNumber(Base):
    """Numéros de lot pour traçabilité"""
    __tablename__ = "lot_numbers"

    id = Column(UUID, primary_key=True)
    tenant_id = Column(UUID)

    # Produit
    product_id = Column(UUID, ForeignKey("products.id"))

    # Lot
    lot_number = Column(String(100), index=True)

    # Dates
    manufacturing_date = Column(Date)
    expiry_date = Column(Date)
    receipt_date = Column(Date)

    # Quantités
    initial_quantity = Column(Numeric(15, 2))
    current_quantity = Column(Numeric(15, 2))

    # Fournisseur
    supplier_id = Column(UUID, ForeignKey("suppliers.id"))
    supplier_lot_number = Column(String(100))

    # Documents
    certificate_url = Column(String(500))  # Certificat qualité

    # Statut
    status = Column(Enum('active', 'quarantine', 'approved', 'rejected', 'expired', 'depleted'))

    is_active = Column(Boolean, default=True)
```

### Nouveau Modèle: `SerialNumber`
```python
class SerialNumber(Base):
    """Numéros de série pour traçabilité unitaire"""
    __tablename__ = "serial_numbers"

    id = Column(UUID, primary_key=True)
    tenant_id = Column(UUID)

    # Produit
    product_id = Column(UUID, ForeignKey("products.id"))

    # Série
    serial_number = Column(String(100), unique=True, index=True)

    # Localisation
    warehouse_id = Column(UUID, ForeignKey("warehouses.id"))
    location_id = Column(UUID, ForeignKey("locations.id"))

    # Statut
    status = Column(Enum('in_stock', 'sold', 'in_transit', 'damaged', 'returned'))

    # Vente
    sold_to_client_id = Column(UUID, ForeignKey("clients.id"))
    sold_date = Column(Date)
    sales_invoice_id = Column(UUID)

    # Garantie
    warranty_expiry_date = Column(Date)
```

---

## 2.4 TRANSFERTS INTER-ENTREPÔTS 🚚

### Nouveau Modèle: `StockTransfer`
```python
class StockTransfer(Base):
    """Transferts entre entrepôts"""
    __tablename__ = "stock_transfers"

    id = Column(UUID, primary_key=True)
    tenant_id = Column(UUID)

    # Référence
    transfer_number = Column(String(50), unique=True)
    transfer_date = Column(Date)

    # Source & Destination
    source_warehouse_id = Column(UUID, ForeignKey("warehouses.id"))
    destination_warehouse_id = Column(UUID, ForeignKey("warehouses.id"))

    # Statut
    status = Column(Enum('draft', 'confirmed', 'in_transit', 'received', 'cancelled'))

    # Dates
    expected_date = Column(Date)
    shipped_date = Column(Date)
    received_date = Column(Date)

    # Responsables
    requested_by = Column(UUID, ForeignKey("users.id"))
    approved_by = Column(UUID)
    shipped_by = Column(UUID)
    received_by = Column(UUID)

    # Transport
    carrier = Column(String(200))
    tracking_number = Column(String(100))

    # Coûts
    transport_cost = Column(Numeric(15, 2))

    notes = Column(Text)
```

### Nouveau Modèle: `StockTransferLine`
```python
class StockTransferLine(Base):
    """Lignes de transfert"""
    __tablename__ = "stock_transfer_lines"

    id = Column(UUID, primary_key=True)
    tenant_id = Column(UUID)
    transfer_id = Column(UUID, ForeignKey("stock_transfers.id"))

    # Produit
    product_id = Column(UUID, ForeignKey("products.id"))

    # Quantités
    quantity_ordered = Column(Numeric(15, 2))
    quantity_shipped = Column(Numeric(15, 2))
    quantity_received = Column(Numeric(15, 2))

    # Traçabilité
    lot_number = Column(String(100))
    serial_numbers = Column(ARRAY(String))

    # Emplacements
    source_location_id = Column(UUID, ForeignKey("locations.id"))
    destination_location_id = Column(UUID, ForeignKey("locations.id"))
```

---

## 2.5 INVENTAIRES PHYSIQUES 📋

### Nouveau Modèle: `PhysicalInventory`
```python
class PhysicalInventory(Base):
    """Inventaires physiques"""
    __tablename__ = "physical_inventories"

    id = Column(UUID, primary_key=True)
    tenant_id = Column(UUID)

    # Référence
    inventory_number = Column(String(50), unique=True)
    inventory_date = Column(Date)

    # Périmètre
    warehouse_id = Column(UUID, ForeignKey("warehouses.id"))
    location_ids = Column(ARRAY(UUID))  # Emplacements spécifiques ou NULL pour tout
    product_category_ids = Column(ARRAY(UUID))  # Catégories ou NULL pour tout

    # Type
    inventory_type = Column(Enum('full', 'partial', 'cycle_count', 'spot_check'))

    # Statut
    status = Column(Enum('planned', 'in_progress', 'completed', 'validated', 'cancelled'))

    # Responsables
    created_by = Column(UUID, ForeignKey("users.id"))
    assigned_to = Column(ARRAY(UUID))  # Équipe de comptage
    validated_by = Column(UUID)
    validation_date = Column(DateTime)

    # Résultats
    items_counted = Column(Integer)
    discrepancies_count = Column(Integer)
    total_value_difference = Column(Numeric(15, 2))
```

### Nouveau Modèle: `InventoryCountLine`
```python
class InventoryCountLine(Base):
    """Lignes de comptage inventaire"""
    __tablename__ = "inventory_count_lines"

    id = Column(UUID, primary_key=True)
    tenant_id = Column(UUID)
    inventory_id = Column(UUID, ForeignKey("physical_inventories.id"))

    # Produit
    product_id = Column(UUID, ForeignKey("products.id"))
    location_id = Column(UUID, ForeignKey("locations.id"))

    # Quantités
    theoretical_quantity = Column(Numeric(15, 2))  # Quantité système
    counted_quantity = Column(Numeric(15, 2))  # Quantité comptée
    difference = Column(Numeric(15, 2))  # Écart

    # Traçabilité
    lot_number = Column(String(100))
    serial_number = Column(String(100))

    # Comptage
    counted_by = Column(UUID, ForeignKey("users.id"))
    counted_at = Column(DateTime)

    # Validation
    is_validated = Column(Boolean, default=False)
    adjustment_created = Column(Boolean, default=False)
    stock_movement_id = Column(UUID)  # Lien vers ajustement créé

    notes = Column(Text)
```

---

## 2.6 VALORISATION STOCKS (FIFO, LIFO, WAC) 💰

### Nouveau Modèle: `StockValuationMethod`
```python
class StockValuationMethod(Base):
    """Méthode de valorisation par produit/tenant"""
    __tablename__ = "stock_valuation_methods"

    id = Column(UUID, primary_key=True)
    tenant_id = Column(UUID)

    # Méthode globale ou par produit
    product_id = Column(UUID, ForeignKey("products.id"), nullable=True)  # NULL = méthode par défaut tenant

    # Méthode
    valuation_method = Column(Enum('FIFO', 'LIFO', 'WAC', 'STANDARD'))  # WAC = Weighted Average Cost

    # Coût standard (si méthode STANDARD)
    standard_cost = Column(Numeric(15, 2))

    effective_date = Column(Date)
    is_active = Column(Boolean, default=True)
```

### Nouveau Modèle: `StockValuationLayer`
```python
class StockValuationLayer(Base):
    """Couches de valorisation pour FIFO/LIFO"""
    __tablename__ = "stock_valuation_layers"

    id = Column(UUID, primary_key=True)
    tenant_id = Column(UUID)

    # Produit & Localisation
    product_id = Column(UUID, ForeignKey("products.id"))
    warehouse_id = Column(UUID, ForeignKey("warehouses.id"))

    # Layer
    receipt_date = Column(DateTime)  # Date d'entrée de cette couche
    unit_cost = Column(Numeric(15, 2))  # Coût unitaire de cette couche

    # Quantités
    initial_quantity = Column(Numeric(15, 2))
    remaining_quantity = Column(Numeric(15, 2))

    # Traçabilité
    lot_number = Column(String(100))
    stock_movement_id = Column(UUID, ForeignKey("stock_movements.id"))  # Mouvement d'entrée
```

---

## 2.7 PRÉVISIONS & RÉAPPROVISIONNEMENT 📈

### Nouveau Modèle: `DemandForecast`
```python
class DemandForecast(Base):
    """Prévisions de demande (ML-based)"""
    __tablename__ = "demand_forecasts"

    id = Column(UUID, primary_key=True)
    tenant_id = Column(UUID)

    # Produit
    product_id = Column(UUID, ForeignKey("products.id"))
    warehouse_id = Column(UUID, ForeignKey("warehouses.id"))

    # Période
    forecast_date = Column(Date)
    forecast_period = Column(Enum('daily', 'weekly', 'monthly'))

    # Prévision
    predicted_demand = Column(Numeric(15, 2))
    confidence_interval_low = Column(Numeric(15, 2))
    confidence_interval_high = Column(Numeric(15, 2))

    # Modèle utilisé
    model_used = Column(Enum('moving_average', 'exponential_smoothing', 'prophet', 'lstm'))
    model_accuracy = Column(Numeric(5, 2))  # %

    # Comparaison
    actual_demand = Column(Numeric(15, 2))  # Rempli après coup

    created_at = Column(DateTime)
```

### Nouveau Modèle: `ReplenishmentOrder`
```python
class ReplenishmentOrder(Base):
    """Ordres de réapprovisionnement automatiques"""
    __tablename__ = "replenishment_orders"

    id = Column(UUID, primary_key=True)
    tenant_id = Column(UUID)

    # Produit
    product_id = Column(UUID, ForeignKey("products.id"))
    warehouse_id = Column(UUID, ForeignKey("warehouses.id"))

    # Quantités
    current_stock = Column(Numeric(15, 2))
    reorder_point = Column(Numeric(15, 2))
    recommended_quantity = Column(Numeric(15, 2))
    approved_quantity = Column(Numeric(15, 2))

    # Priorité
    priority = Column(Enum('low', 'medium', 'high', 'urgent'))
    days_until_stockout = Column(Integer)

    # Statut
    status = Column(Enum('suggested', 'approved', 'ordered', 'received', 'cancelled'))

    # Conversion
    purchase_order_id = Column(UUID, ForeignKey("purchase_orders.id"))

    created_at = Column(DateTime)
    created_by = Column(Enum('system', 'manual'))
```

---

# 🏭 PHASE 2 : MODULE MANUFACTURING/PRODUCTION

## 3.1 NOMENCLATURES (BOM - Bill of Materials)

### Nouveau Modèle: `BillOfMaterial`
```python
class BillOfMaterial(Base):
    """Nomenclatures de production"""
    __tablename__ = "bills_of_material"

    id = Column(UUID, primary_key=True)
    tenant_id = Column(UUID)

    # Produit fini
    product_id = Column(UUID, ForeignKey("products.id"))

    # Référence
    bom_number = Column(String(50), unique=True)
    version = Column(Integer, default=1)

    # Type
    bom_type = Column(Enum('manufacturing', 'kit', 'phantom'))  # phantom = sous-assemblage

    # Quantité
    quantity_to_produce = Column(Numeric(15, 2), default=1)  # Quantité de référence

    # Dates
    effective_from = Column(Date)
    effective_to = Column(Date)

    # Statut
    status = Column(Enum('draft', 'approved', 'obsolete'))
    is_active = Column(Boolean, default=True)

    # Coûts
    total_material_cost = Column(Numeric(15, 2))
    total_labor_cost = Column(Numeric(15, 2))
    total_overhead_cost = Column(Numeric(15, 2))
    total_cost = Column(Numeric(15, 2))
```

### Nouveau Modèle: `BomLine`
```python
class BomLine(Base):
    """Composants d'une nomenclature"""
    __tablename__ = "bom_lines"

    id = Column(UUID, primary_key=True)
    tenant_id = Column(UUID)
    bom_id = Column(UUID, ForeignKey("bills_of_material.id"))

    # Composant
    component_product_id = Column(UUID, ForeignKey("products.id"))

    # Quantité
    quantity_per_unit = Column(Numeric(15, 2))  # Quantité nécessaire par unité produite
    unit_of_measure = Column(String(20))

    # Alternative
    is_alternative = Column(Boolean, default=False)
    alternative_group = Column(Integer)  # Groupe d'alternatives

    # Gaspillage
    scrap_percentage = Column(Numeric(5, 2), default=0)  # % de perte normale

    # Opération
    operation_sequence = Column(Integer)  # À quelle étape ce composant est utilisé

    # Notes
    notes = Column(Text)
```

---

## 3.2 ORDRES DE FABRICATION (Production Orders)

### Nouveau Modèle: `ProductionOrder`
```python
class ProductionOrder(Base):
    """Ordres de fabrication"""
    __tablename__ = "production_orders"

    id = Column(UUID, primary_key=True)
    tenant_id = Column(UUID)

    # Référence
    order_number = Column(String(50), unique=True)

    # Produit
    product_id = Column(UUID, ForeignKey("products.id"))
    bom_id = Column(UUID, ForeignKey("bills_of_material.id"))

    # Quantités
    quantity_to_produce = Column(Numeric(15, 2))
    quantity_produced = Column(Numeric(15, 2), default=0)
    quantity_scrapped = Column(Numeric(15, 2), default=0)

    # Dates
    planned_start_date = Column(DateTime)
    planned_end_date = Column(DateTime)
    actual_start_date = Column(DateTime)
    actual_end_date = Column(DateTime)

    # Priorité
    priority = Column(Enum('low', 'normal', 'high', 'urgent'))

    # Statut
    status = Column(Enum('draft', 'confirmed', 'ready', 'in_progress', 'done', 'cancelled'))

    # Entrepôt
    warehouse_id = Column(UUID, ForeignKey("warehouses.id"))
    production_location_id = Column(UUID, ForeignKey("locations.id"))

    # Responsable
    assigned_to = Column(UUID, ForeignKey("employees.id"))

    # Coûts
    material_cost = Column(Numeric(15, 2))
    labor_cost = Column(Numeric(15, 2))
    overhead_cost = Column(Numeric(15, 2))
    total_cost = Column(Numeric(15, 2))

    # Notes
    notes = Column(Text)
```

### Nouveau Modèle: `ProductionOrderComponent`
```python
class ProductionOrderComponent(Base):
    """Composants consommés pour un ordre de fabrication"""
    __tablename__ = "production_order_components"

    id = Column(UUID, primary_key=True)
    tenant_id = Column(UUID)
    production_order_id = Column(UUID, ForeignKey("production_orders.id"))

    # Composant
    component_product_id = Column(UUID, ForeignKey("products.id"))

    # Quantités
    quantity_required = Column(Numeric(15, 2))
    quantity_consumed = Column(Numeric(15, 2), default=0)
    quantity_scrapped = Column(Numeric(15, 2), default=0)

    # Traçabilité
    lot_numbers_consumed = Column(ARRAY(String))

    # Disponibilité
    quantity_available = Column(Numeric(15, 2))
    is_available = Column(Boolean, default=False)
```

---

## 3.3 MRP (Material Requirements Planning)

### Nouveau Modèle: `MrpRun`
```python
class MrpRun(Base):
    """Exécutions du calcul MRP"""
    __tablename__ = "mrp_runs"

    id = Column(UUID, primary_key=True)
    tenant_id = Column(UUID)

    # Exécution
    run_number = Column(String(50), unique=True)
    run_date = Column(DateTime)

    # Paramètres
    planning_horizon_days = Column(Integer, default=90)
    include_safety_stock = Column(Boolean, default=True)
    include_forecasts = Column(Boolean, default=True)

    # Résultats
    products_analyzed = Column(Integer)
    purchase_suggestions = Column(Integer)
    production_suggestions = Column(Integer)

    # Statut
    status = Column(Enum('running', 'completed', 'error'))

    # Temps d'exécution
    started_at = Column(DateTime)
    completed_at = Column(DateTime)

    # Utilisateur
    run_by = Column(UUID, ForeignKey("users.id"))
```

### Nouveau Modèle: `MrpSuggestion`
```python
class MrpSuggestion(Base):
    """Suggestions du MRP"""
    __tablename__ = "mrp_suggestions"

    id = Column(UUID, primary_key=True)
    tenant_id = Column(UUID)
    mrp_run_id = Column(UUID, ForeignKey("mrp_runs.id"))

    # Produit
    product_id = Column(UUID, ForeignKey("products.id"))
    warehouse_id = Column(UUID, ForeignKey("warehouses.id"))

    # Type d'action
    action_type = Column(Enum('purchase', 'manufacture', 'transfer'))

    # Quantité
    suggested_quantity = Column(Numeric(15, 2))

    # Dates
    suggested_date = Column(Date)  # Date de commande/production
    required_date = Column(Date)  # Date de besoin

    # Raison
    reason = Column(Enum('sales_order', 'forecast', 'min_stock', 'production_order'))

    # Statut
    status = Column(Enum('pending', 'approved', 'ordered', 'cancelled'))

    # Conversion
    purchase_order_id = Column(UUID)
    production_order_id = Column(UUID)
```

---

# 💼 PHASE 2 : MODULE GESTION DE PROJETS

## 4.1 PROJETS

### Nouveau Modèle: `Project`
```python
class Project(Base):
    """Projets"""
    __tablename__ = "projects"

    id = Column(UUID, primary_key=True)
    tenant_id = Column(UUID)

    # Identification
    project_number = Column(String(50), unique=True)
    name = Column(String(200))
    description = Column(Text)

    # Client
    client_id = Column(UUID, ForeignKey("clients.id"))

    # Dates
    start_date = Column(Date)
    planned_end_date = Column(Date)
    actual_end_date = Column(Date)

    # Budget
    budget_amount = Column(Numeric(15, 2))
    actual_cost = Column(Numeric(15, 2))
    invoiced_amount = Column(Numeric(15, 2))

    # Temps
    estimated_hours = Column(Numeric(10, 2))
    actual_hours = Column(Numeric(10, 2))

    # Statut
    status = Column(Enum('draft', 'active', 'on_hold', 'completed', 'cancelled'))
    completion_percentage = Column(Numeric(5, 2))

    # Responsables
    project_manager_id = Column(UUID, ForeignKey("employees.id"))
    team_members = Column(ARRAY(UUID))  # IDs des employés

    # Facturation
    billing_type = Column(Enum('fixed_price', 'time_and_materials', 'milestone'))
    hourly_rate = Column(Numeric(10, 2))
```

### Nouveau Modèle: `ProjectTask`
```python
class ProjectTask(Base):
    """Tâches de projet"""
    __tablename__ = "project_tasks"

    id = Column(UUID, primary_key=True)
    tenant_id = Column(UUID)
    project_id = Column(UUID, ForeignKey("projects.id"))

    # Tâche
    task_number = Column(String(50))
    title = Column(String(200))
    description = Column(Text)

    # Hiérarchie
    parent_task_id = Column(UUID, ForeignKey("project_tasks.id"))

    # Dates
    start_date = Column(Date)
    due_date = Column(Date)
    completed_date = Column(Date)

    # Estimation
    estimated_hours = Column(Numeric(10, 2))
    actual_hours = Column(Numeric(10, 2))

    # Assignation
    assigned_to = Column(UUID, ForeignKey("employees.id"))

    # Priorité & Statut
    priority = Column(Enum('low', 'medium', 'high', 'urgent'))
    status = Column(Enum('todo', 'in_progress', 'review', 'done', 'blocked'))

    # Dépendances
    depends_on_task_ids = Column(ARRAY(UUID))

    # Facturable
    is_billable = Column(Boolean, default=True)
```

### Nouveau Modèle: `Timesheet`
```python
class Timesheet(Base):
    """Feuilles de temps"""
    __tablename__ = "timesheets"

    id = Column(UUID, primary_key=True)
    tenant_id = Column(UUID)

    # Employé
    employee_id = Column(UUID, ForeignKey("employees.id"))

    # Date
    date = Column(Date)

    # Projet/Tâche
    project_id = Column(UUID, ForeignKey("projects.id"))
    task_id = Column(UUID, ForeignKey("project_tasks.id"))

    # Temps
    hours_worked = Column(Numeric(5, 2))

    # Description
    description = Column(Text)

    # Facturation
    is_billable = Column(Boolean, default=True)
    hourly_rate = Column(Numeric(10, 2))
    amount = Column(Numeric(15, 2))

    # Statut
    status = Column(Enum('draft', 'submitted', 'approved', 'rejected', 'invoiced'))

    # Approbation
    approved_by = Column(UUID, ForeignKey("users.id"))
    approval_date = Column(DateTime)

    # Facturation
    invoiced = Column(Boolean, default=False)
    invoice_id = Column(UUID, ForeignKey("sales_invoices.id"))
```

---

# 💱 PHASE 3 : MULTI-DEVISES COMPLET

## 5.1 Gestion Devises

### Nouveau Modèle: `Currency`
```python
class Currency(Base):
    """Devises supportées"""
    __tablename__ = "currencies"

    id = Column(UUID, primary_key=True)
    tenant_id = Column(UUID)

    # Code ISO
    code = Column(String(3), unique=True)  # USD, EUR, XOF
    name = Column(String(100))
    symbol = Column(String(10))

    # Décimales
    decimal_places = Column(Integer, default=2)

    # Affichage
    symbol_position = Column(Enum('before', 'after'))  # $100 ou 100€

    is_active = Column(Boolean, default=True)
```

### Nouveau Modèle: `ExchangeRate`
```python
class ExchangeRate(Base):
    """Taux de change"""
    __tablename__ = "exchange_rates"

    id = Column(UUID, primary_key=True)
    tenant_id = Column(UUID)

    # Devises
    from_currency_code = Column(String(3))
    to_currency_code = Column(String(3))

    # Taux
    rate = Column(Numeric(15, 6))

    # Date
    effective_date = Column(Date)

    # Source
    source = Column(Enum('manual', 'auto_ecb', 'auto_api'))  # ECB = Banque Centrale Européenne

    is_active = Column(Boolean, default=True)
```

### Modifications Multi-Devises à Appliquer

**Tous les modèles avec montants doivent avoir:**
```python
# Exemple pour Quote, SalesInvoice, etc.
currency_code = Column(String(3), default='XOF')
exchange_rate = Column(Numeric(15, 6), default=1.0)
amount_in_base_currency = Column(Numeric(15, 2))  # Montant en XOF (devise de base)
```

---

# 📱 PHASE 3 : APPLICATIONS MOBILES

## 6.1 Fonctionnalités Mobiles Prioritaires

### Application Mobile RH
- Pointage (géolocalisé)
- Demandes de congés
- Bulletins de paie
- Organigramme
- Annuaire employés

### Application Mobile Ventes
- Catalogue produits
- Création devis terrain
- Signature client
- Suivi commandes
- CRM mobile

### Application Mobile Inventaire
- Scan code-barres/QR
- Mouvements stock
- Inventaire physique
- Alertes stock

---

# 🎯 PRIORISATION & PLANNING

## Recommandations d'Implémentation

### PHASE 1A : RH Essentiel (4 semaines)
**Priorité 1 - Critique**
1. Pointage & Temps de travail
2. Paie OHADA avancée
3. Performance & Évaluations
4. Notes de frais

### PHASE 1B : RH Avancé (4 semaines)
**Priorité 2 - Important**
5. Recrutement/ATS
6. Formation & Développement
7. Gestion équipements
8. Onboarding/Offboarding

### PHASE 1C : Inventaire (2 semaines)
**Priorité 1 - Critique**
9. Multi-emplacements
10. Mouvements de stock
11. Traçabilité lots/séries

### PHASE 2A : Manufacturing (6 semaines)
**Priorité 2 - Important**
12. Nomenclatures (BOM)
13. Ordres de fabrication
14. MRP

### PHASE 2B : Projets (4 semaines)
**Priorité 3 - Souhaitable**
15. Gestion projets
16. Timesheet & facturation

### PHASE 3 : Optimisations (4 semaines)
**Priorité 3**
17. Multi-devises complet
18. Applications mobiles
19. BI avancée

---

# 📈 MÉTRIQUES DE SUCCÈS

## KPIs Module RH
- Temps moyen de traitement paie : < 2 jours
- Taux d'erreur paie : < 0.5%
- Temps moyen recrutement : < 30 jours
- Taux de formation : > 80% employés/an
- Taux d'adoption pointage : > 95%

## KPIs Inventaire
- Précision inventaire : > 98%
- Taux de rotation stock : Optimisé
- Ruptures de stock : < 2%
- Temps de comptage : -60%

## KPIs Manufacturing
- Taux de rendement synthétique (TRS) : > 85%
- Respect délais production : > 90%
- Taux de rebut : < 3%

---

# 🛠️ STACK TECHNIQUE RECOMMANDÉ

## Backend (Conservé)
- FastAPI (actuel)
- PostgreSQL (actuel)
- SQLAlchemy (actuel)

## Nouveaux Composants
- **Celery** : Jobs asynchrones (paie, MRP, rapports)
- **Redis** : Cache & queues
- **MinIO/R2** : Stockage documents (déjà présent)
- **Prophet/LSTM** : Prévisions (déjà présent)

## Mobile
- **React Native** ou **Flutter**
- API REST existante

## BI/Reporting
- **Metabase** ou **Superset** (open-source)
- **Grafana** pour dashboards temps réel

---

## PROCHAINES ÉTAPES IMMÉDIATES

1. **Valider ce plan avec vous** - Ajustements priorités ?
2. **Commencer par PHASE 1A** - Module RH essentiel
3. **Créer les migrations** pour nouveaux modèles
4. **Implémenter services & API**
5. **Tests unitaires** pour chaque module

Voulez-vous que je commence l'implémentation de la Phase 1A (RH Essentiel) maintenant ?
