"""
Base Service Classes for SEKA Backend

Ce module fournit des classes de base pour les services:
- BaseService: Classe de base avec logging et gestion du tenant
- CRUDService: Service avec opérations CRUD génériques
- TransactionalService: Service avec gestion des transactions

Usage:
    from app.services.base import CRUDService

    class ClientService(CRUDService[Client, ClientCreate, ClientUpdate]):
        pass
"""

import logging
from typing import TypeVar, Generic, Optional, List, Type, Any
from uuid import UUID

from sqlalchemy.orm import Session
from sqlalchemy import and_
from pydantic import BaseModel

from app.db.base import Base
from app.core.logging import get_logger, get_context_logger

# Type variables for generics
ModelType = TypeVar("ModelType", bound=Base)
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseModel)


class BaseService:
    """
    Classe de base pour tous les services.

    Fournit:
    - Accès à la session DB
    - Logging contextualisé
    - Gestion du tenant_id
    """

    def __init__(
        self,
        db: Session,
        tenant_id: Optional[str] = None,
        user_id: Optional[str] = None,
    ):
        self.db = db
        self.tenant_id = tenant_id
        self.user_id = user_id
        self._logger = get_context_logger(
            self.__class__.__module__,
            tenant_id=tenant_id,
            user_id=user_id,
        )

    @property
    def logger(self) -> logging.LoggerAdapter:
        """Logger contextualisé pour ce service."""
        return self._logger

    def _validate_tenant(self) -> None:
        """Valide que le tenant_id est défini."""
        if not self.tenant_id:
            raise ValueError("tenant_id is required for this operation")


class CRUDService(BaseService, Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    """
    Service CRUD générique.

    Fournit des opérations de base:
    - get: Récupérer par ID
    - get_multi: Récupérer plusieurs avec pagination
    - create: Créer une entité
    - update: Mettre à jour une entité
    - delete: Supprimer une entité

    Usage:
        class ClientService(CRUDService[Client, ClientCreate, ClientUpdate]):
            model = Client
    """

    model: Type[ModelType]

    def get(self, id: UUID) -> Optional[ModelType]:
        """Récupère une entité par son ID."""
        self._validate_tenant()

        query = self.db.query(self.model).filter(self.model.id == id)

        # Filter by tenant if model has tenant_id
        if hasattr(self.model, "tenant_id"):
            query = query.filter(self.model.tenant_id == UUID(self.tenant_id))

        return query.first()

    def get_or_404(self, id: UUID) -> ModelType:
        """Récupère une entité par ID ou lève une exception."""
        obj = self.get(id)
        if not obj:
            raise ValueError(f"{self.model.__name__} with id {id} not found")
        return obj

    def get_multi(
        self,
        *,
        skip: int = 0,
        limit: int = 100,
        order_by: Optional[str] = None,
        order_desc: bool = False,
    ) -> List[ModelType]:
        """Récupère plusieurs entités avec pagination."""
        self._validate_tenant()

        query = self.db.query(self.model)

        # Filter by tenant if model has tenant_id
        if hasattr(self.model, "tenant_id"):
            query = query.filter(self.model.tenant_id == UUID(self.tenant_id))

        # Order by
        if order_by and hasattr(self.model, order_by):
            column = getattr(self.model, order_by)
            query = query.order_by(column.desc() if order_desc else column)

        return query.offset(skip).limit(limit).all()

    def get_count(self) -> int:
        """Compte le nombre total d'entités."""
        self._validate_tenant()

        query = self.db.query(self.model)

        if hasattr(self.model, "tenant_id"):
            query = query.filter(self.model.tenant_id == UUID(self.tenant_id))

        return query.count()

    def create(self, *, obj_in: CreateSchemaType) -> ModelType:
        """Crée une nouvelle entité."""
        self._validate_tenant()

        obj_data = obj_in.model_dump()

        # Add tenant_id if model has it
        if hasattr(self.model, "tenant_id"):
            obj_data["tenant_id"] = UUID(self.tenant_id)

        db_obj = self.model(**obj_data)
        self.db.add(db_obj)
        self.db.flush()

        self.logger.info(f"Created {self.model.__name__} with id {db_obj.id}")

        return db_obj

    def update(
        self,
        *,
        db_obj: ModelType,
        obj_in: UpdateSchemaType,
    ) -> ModelType:
        """Met à jour une entité existante."""
        obj_data = obj_in.model_dump(exclude_unset=True)

        for field, value in obj_data.items():
            if hasattr(db_obj, field):
                setattr(db_obj, field, value)

        self.db.add(db_obj)
        self.db.flush()

        self.logger.info(f"Updated {self.model.__name__} with id {db_obj.id}")

        return db_obj

    def delete(self, *, id: UUID) -> bool:
        """Supprime une entité."""
        obj = self.get(id)
        if not obj:
            return False

        self.db.delete(obj)
        self.db.flush()

        self.logger.info(f"Deleted {self.model.__name__} with id {id}")

        return True

    def exists(self, id: UUID) -> bool:
        """Vérifie si une entité existe."""
        return self.get(id) is not None


class TransactionalService(BaseService):
    """
    Service avec gestion des transactions.

    Fournit des méthodes pour gérer les transactions:
    - commit: Valider la transaction
    - rollback: Annuler la transaction
    - Context manager pour transactions automatiques

    Usage:
        with TransactionalService(db) as service:
            service.do_something()
            # Auto-commit si pas d'exception
    """

    def commit(self) -> None:
        """Valide la transaction en cours."""
        try:
            self.db.commit()
            self.logger.debug("Transaction committed")
        except Exception as e:
            self.logger.error(f"Commit failed: {e}")
            self.rollback()
            raise

    def rollback(self) -> None:
        """Annule la transaction en cours."""
        self.db.rollback()
        self.logger.debug("Transaction rolled back")

    def __enter__(self) -> "TransactionalService":
        """Entre dans le context manager."""
        return self

    def __exit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:
        """Sort du context manager avec commit/rollback automatique."""
        if exc_type is not None:
            self.rollback()
        else:
            self.commit()
