from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.base import IDSchema, TimestampSchema


class TenantBase(BaseModel):
    name: str = Field(..., max_length=255)
    slug: str = Field(..., max_length=150)
    country: Optional[str] = Field(None, max_length=64)


class TenantCreate(TenantBase):
    pass


class TenantUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    country: Optional[str] = Field(None, max_length=64)


class TenantRead(TenantBase, IDSchema, TimestampSchema):
    pass


Tenant = TenantRead
