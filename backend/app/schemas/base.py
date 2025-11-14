from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class ORMBase(BaseModel):
    class Config:
        from_attributes = True


class TimestampSchema(BaseModel):
    created_at: datetime
    updated_at: datetime


class IDSchema(BaseModel):
    id: UUID
