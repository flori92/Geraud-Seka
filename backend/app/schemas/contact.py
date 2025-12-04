"""
Schémas Pydantic pour les Contacts CRM
"""

from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field
from uuid import UUID


class ContactBase(BaseModel):
    """Schéma de base pour un contact"""
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    phone: Optional[str] = Field(None, max_length=20)
    mobile: Optional[str] = Field(None, max_length=20)
    job_title: Optional[str] = Field(None, max_length=100)
    department: Optional[str] = Field(None, max_length=100)
    contact_type: Optional[str] = "other"
    address: Optional[str] = None
    city: Optional[str] = Field(None, max_length=100)
    postal_code: Optional[str] = Field(None, max_length=20)
    country: Optional[str] = Field(None, max_length=100)
    preferred_contact_method: Optional[str] = Field(None, max_length=20)
    language: str = "fr"
    timezone: Optional[str] = Field(None, max_length=50)
    linkedin_url: Optional[str] = Field(None, max_length=500)
    twitter_handle: Optional[str] = Field(None, max_length=100)
    is_primary: bool = False
    is_active: bool = True
    do_not_contact: bool = False
    email_opt_out: bool = False
    notes: Optional[str] = None
    tags: Optional[List[str]] = None
    custom_fields: Optional[dict] = None


class ContactCreate(ContactBase):
    """Schéma pour créer un contact"""
    client_id: Optional[UUID] = None
    lead_id: Optional[UUID] = None
    assigned_to: Optional[UUID] = None


class ContactUpdate(BaseModel):
    """Schéma pour mettre à jour un contact"""
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=20)
    mobile: Optional[str] = Field(None, max_length=20)
    job_title: Optional[str] = Field(None, max_length=100)
    department: Optional[str] = Field(None, max_length=100)
    contact_type: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = Field(None, max_length=100)
    postal_code: Optional[str] = Field(None, max_length=20)
    country: Optional[str] = Field(None, max_length=100)
    preferred_contact_method: Optional[str] = Field(None, max_length=20)
    language: Optional[str] = None
    timezone: Optional[str] = Field(None, max_length=50)
    linkedin_url: Optional[str] = Field(None, max_length=500)
    twitter_handle: Optional[str] = Field(None, max_length=100)
    is_primary: Optional[bool] = None
    is_active: Optional[bool] = None
    do_not_contact: Optional[bool] = None
    email_opt_out: Optional[bool] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = None
    custom_fields: Optional[dict] = None
    client_id: Optional[UUID] = None
    lead_id: Optional[UUID] = None
    assigned_to: Optional[UUID] = None


class Contact(ContactBase):
    """Schéma complet pour un contact"""
    id: UUID
    full_name: Optional[str] = None
    client_id: Optional[UUID] = None
    lead_id: Optional[UUID] = None
    assigned_to: Optional[UUID] = None
    tenant_id: UUID
    last_contact_date: Optional[datetime] = None
    last_email_sent: Optional[datetime] = None
    last_email_opened: Optional[datetime] = None
    email_bounced: bool = False
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ContactWithRelations(Contact):
    """Schéma contact avec relations"""
    client_name: Optional[str] = None
    lead_name: Optional[str] = None
    assignee_name: Optional[str] = None
    days_since_last_contact: Optional[int] = None
    is_engaged: bool = False
