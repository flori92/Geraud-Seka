from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field

from app.schemas.base import IDSchema, TimestampSchema


class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = Field(None, max_length=255)
    role: str = Field("client", max_length=50)
    is_active: bool = True
    is_superuser: bool = False
    tenant_id: Optional[UUID] = None


class UserCreate(UserBase):
    password: str = Field(..., min_length=8)


class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(None, max_length=255)
    role: Optional[str] = Field(None, max_length=50)
    is_active: Optional[bool] = None
    is_superuser: Optional[bool] = None


class UserRead(UserBase, IDSchema, TimestampSchema):
    pass


# Alias pour compatibilité
User = UserRead


class UserInDB(UserBase, IDSchema):
    hashed_password: str
