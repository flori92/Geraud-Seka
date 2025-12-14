"""HR advanced module removed — placeholder file.

The HR modules were intentionally removed from the codebase.
This file is left as a harmless placeholder to avoid import errors.
"""

__all__ = []

# Marker to indicate the HR module was removed.
removed = True
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
    tenant_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    employee_id = Column(UUID(as_uuid=True), ForeignKey("employees.id"), nullable=False, index=True)

    request_date = Column(Date, nullable=False)
    amount_requested = Column(Numeric(15, 2), nullable=False)
    amount_approved = Column(Numeric(15, 2))

    reason = Column(Text)

    # Approbation
    status = Column(String, default="pending")  # pending, approved, rejected, paid, reimbursed
    approved_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
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
    tenant_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    employee_id = Column(UUID(as_uuid=True), ForeignKey("employees.id"), nullable=False, index=True)

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
    guarantor_id = Column(UUID(as_uuid=True), ForeignKey("employees.id"))
    collateral = Column(Text)

    # Approbation
    approved_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
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

    manager_approved_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    manager_approval_date = Column(DateTime)
    manager_comments = Column(Text)

    finance_approved_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    finance_approval_date = Column(DateTime)
    finance_comments = Column(Text)

    rejection_reason = Column(Text)
    rejected_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
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
    client_id = Column(UUID(as_uuid=True), ForeignKey("clients.id"))
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
