from typing import Optional
from uuid import UUID
from datetime import date
from decimal import Decimal
from pydantic import BaseModel, ConfigDict
from app.models.activity import ActivityType

class ActivityBase(BaseModel):
    type: ActivityType
    date: date
    amount: Decimal
    description: Optional[str] = None
    client_id: UUID

class ActivityCreate(ActivityBase):
    pass

class ActivityUpdate(BaseModel):
    type: Optional[ActivityType] = None
    date: Optional[date] = None
    amount: Optional[Decimal] = None
    description: Optional[str] = None

class Activity(ActivityBase):
    id: UUID
    tenant_id: UUID
    
    model_config = ConfigDict(from_attributes=True)
