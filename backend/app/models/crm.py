"""
Modèles CRM - Compatibilité minimale

Ce fichier fournit des définitions minimales pour certains symboles
utilisés par des routes / migrations historiques (p.ex. `Automation`).
Ces implémentations sont intentionnellement légères : elles existent
uniquement pour rétablir les imports et permettre le démarrage de
l'application et des migrations. Ne pas utiliser ces modèles pour
nouveau code métier sans les remplacer par une implémentation complète.
"""

import uuid
from enum import Enum
from datetime import datetime

from sqlalchemy import (
    Column,
    String,
    Integer,
    ForeignKey,
    DateTime,
    Date,
    Boolean,
    Text,
    Numeric,
    func,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

from app.db.base import Base, TimestampMixin


# ========== Enums (petites valeurs) ==========
class AutomationTriggerType(Enum):
    MANUAL = "manual"
    SCHEDULE = "schedule"
    EVENT = "event"


class AutomationActionType(Enum):
    WEBHOOK = "webhook"
    EMAIL = "email"
    CREATE_LEAD = "create_lead"


class AutomationStatus(Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    PAUSED = "paused"
    DISABLED = "disabled"


# ========== Minimal ORM models ==========
class Automation:
    """Placeholder pour compatibilité d'import.

    Ne pas mapper cette classe avec SQLAlchemy. Elle existe uniquement
    pour éviter des ImportError lorsqu'un import direct est réalisé
    (p.ex. lors de l'import global `from app.models import *`).
    """

    def __init__(self, *args, **kwargs):
        raise RuntimeError("Automation model has been removed from the codebase and is unavailable.")
