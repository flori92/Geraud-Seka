"""
Modèles pour les règles comptables automatiques
Permet la catégorisation et l'imputation automatique des écritures
"""
from sqlalchemy import Column, String, Text, Float, Boolean, JSON, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import enum
import uuid

from app.db.base import Base


class RuleConditionType(str, enum.Enum):
    """Type de condition pour les règles"""
    SUPPLIER_NAME = "supplier_name"
    CUSTOMER_NAME = "customer_name"
    AMOUNT_RANGE = "amount_range"
    REFERENCE_PATTERN = "reference_pattern"
    DESCRIPTION_CONTAINS = "description_contains"
    DOCUMENT_TYPE = "document_type"


class RuleOperator(str, enum.Enum):
    """Opérateurs de comparaison"""
    EQUALS = "equals"
    CONTAINS = "contains"
    STARTS_WITH = "starts_with"
    ENDS_WITH = "ends_with"
    GREATER_THAN = "greater_than"
    LESS_THAN = "less_than"
    BETWEEN = "between"
    MATCHES_REGEX = "matches_regex"


class RuleActionType(str, enum.Enum):
    """Type d'action à effectuer"""
    ASSIGN_ACCOUNT = "assign_account"
    ASSIGN_ANALYTIC_CODE = "assign_analytic_code"
    SET_VAT_RATE = "set_vat_rate"
    SUGGEST_LABEL = "suggest_label"
    AUTO_VALIDATE = "auto_validate"


class AccountingRule(Base):
    """
    Règle comptable pour l'imputation automatique
    Inspiré de Pennylane "Centre de règles"
    """
    __tablename__ = "accounting_rules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)

    name = Column(String(255), nullable=False)
    description = Column(Text)
    priority = Column(Float, default=0)  # Plus élevé = exécuté en premier
    is_active = Column(Boolean, default=True)

    conditions = Column(JSON, nullable=False)
    
    actions = Column(JSON, nullable=False)

    auto_apply = Column(Boolean, default=False)  # Appliquer automatiquement ou suggérer
    confidence_threshold = Column(Float, default=0.8)  # Seuil de confiance pour auto-apply

    tenant = relationship("Tenant", back_populates="accounting_rules")


class DocumentClassification(Base):
    """
    Classification automatique des documents
    Historique des classifications pour ML
    """
    __tablename__ = "document_classifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id"), nullable=False)
    
    suggested_debit_account = Column(String(20))
    suggested_credit_account = Column(String(20))
    suggested_label = Column(String(500))
    suggested_vat_rate = Column(Float)
    suggested_analytic_code = Column(String(50))
    
    confidence_score = Column(Float)  # 0.0 à 1.0
    rule_id = Column(UUID(as_uuid=True), ForeignKey("accounting_rules.id"))  # Règle appliquée
    source = Column(String(50))  # "rule", "ml", "manual"
    
    validated = Column(Boolean, default=False)
    validated_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    
    user_corrections = Column(JSON)  # Corrections faites par l'utilisateur
    
    document = relationship("Document", back_populates="classifications")
    rule = relationship("AccountingRule")
    tenant = relationship("Tenant")
