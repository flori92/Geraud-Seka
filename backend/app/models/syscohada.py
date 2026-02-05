"""
Modeles pour le referentiel SYSCOHADA (Plan Comptable OHADA)

Ce module contient:
- SyscohadaAccount: Referentiel des comptes SYSCOHADA (classes 1-8)
- SupplierCategory: Categories de fournisseurs avec compte de charge par defaut
- AccountKeyword: Mapping mots-cles -> comptes pour suggestion intelligente
"""
import uuid

from sqlalchemy import Column, ForeignKey, String, Integer, Boolean, Text, JSON
from sqlalchemy.dialects.postgresql import UUID

from app.db.base import Base


class SyscohadaAccount(Base):
    """
    Referentiel des comptes SYSCOHADA.
    Table de reference immuable (pas de tenant_id).

    Structure hierarchique:
    - Classe (niveau 1): 1-8
    - Compte principal (niveau 2): 10, 20, 60...
    - Sous-compte (niveau 3): 101, 601...
    - Divisionnaire (niveau 4): 6061, 6062...
    """
    __tablename__ = "syscohada_accounts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    account_number = Column(String(10), unique=True, nullable=False, index=True)
    account_label = Column(String(200), nullable=False)
    account_class = Column(Integer, nullable=False, index=True)
    parent_account = Column(String(10), nullable=True)
    level = Column(Integer, nullable=False, default=2)
    is_detail = Column(Boolean, nullable=False, default=True)
    description = Column(Text, nullable=True)

    def __repr__(self):
        return f"<SyscohadaAccount {self.account_number}: {self.account_label}>"


class SupplierCategory(Base):
    """
    Categories de fournisseurs avec compte de charge par defaut.
    Permet l'auto-suggestion lors de la creation de fournisseurs.

    Exemples:
    - ENERGIE -> 6061 (Electricite)
    - TELECOM -> 6261 (Telecommunications)
    - CARBURANT -> 6063 (Carburants)
    """
    __tablename__ = "supplier_categories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = Column(String(20), unique=True, nullable=False, index=True)
    label = Column(String(100), nullable=False)
    default_charge_account = Column(String(10), nullable=False)
    keywords = Column(JSON, nullable=False, default=list)
    # tenant_id NULL = categorie systeme (partagee)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=True, index=True)

    def __repr__(self):
        return f"<SupplierCategory {self.code}: {self.label}>"


class AccountKeyword(Base):
    """
    Mapping mots-cles -> comptes pour suggestion intelligente.
    Utilise quand aucune categorie ne matche.
    """
    __tablename__ = "account_keywords"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    keyword = Column(String(100), nullable=False, index=True)
    account_number = Column(String(10), nullable=False)
    priority = Column(Integer, nullable=False, default=0)

    def __repr__(self):
        return f"<AccountKeyword {self.keyword} -> {self.account_number}>"
