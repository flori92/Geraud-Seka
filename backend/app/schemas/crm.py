"""
Schémas Pydantic pour le module CRM
"""

from typing import Optional, List
from datetime import datetime, date
from uuid import UUID
from pydantic import BaseModel, Field
from app.schemas.base import BaseSchema


# ===== LEAD SCHEMAS =====

class LeadBase(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    email: str = Field(..., max_length=255)
    phone: Optional[str] = Field(None, max_length=20)
    mobile: Optional[str] = Field(None, max_length=20)
    company: Optional[str] = Field(None, max_length=255)
    job_title: Optional[str] = Field(None, max_length=100)
    industry: Optional[str] = Field(None, max_length=100)
    company_size: Optional[str] = Field(None, max_length=50)
    annual_revenue: Optional[str] = Field(None, max_length=50)
    address: Optional[str] = None
    city: Optional[str] = Field(None, max_length=100)
    country: Optional[str] = Field(None, max_length=100)
    source: str = Field(default="direct", max_length=50)
    budget_range: Optional[str] = Field(None, max_length=50)
    timeline: Optional[str] = Field(None, max_length=50)
    pain_points: Optional[List[str]] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = None
    assigned_to: Optional[UUID] = None

class LeadCreate(LeadBase):
    pass

class LeadUpdate(BaseModel):
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    email: Optional[str] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=20)
    mobile: Optional[str] = Field(None, max_length=20)
    company: Optional[str] = Field(None, max_length=255)
    job_title: Optional[str] = Field(None, max_length=100)
    industry: Optional[str] = Field(None, max_length=100)
    company_size: Optional[str] = Field(None, max_length=50)
    annual_revenue: Optional[str] = Field(None, max_length=50)
    address: Optional[str] = None
    city: Optional[str] = Field(None, max_length=100)
    country: Optional[str] = Field(None, max_length=100)
    status: Optional[str] = Field(None, max_length=20)
    source: Optional[str] = Field(None, max_length=50)
    score: Optional[int] = Field(None, ge=0, le=100)
    quality_grade: Optional[str] = Field(None, max_length=2)
    budget_range: Optional[str] = Field(None, max_length=50)
    timeline: Optional[str] = Field(None, max_length=50)
    pain_points: Optional[List[str]] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = None
    assigned_to: Optional[UUID] = None

class Lead(LeadBase, BaseSchema):
    id: UUID
    full_name: Optional[str] = None
    status: str = "new"
    score: int = 0
    quality_grade: Optional[str] = None
    email_opens: int = 0
    email_clicks: int = 0
    website_visits: int = 0
    last_activity_date: Optional[datetime] = None
    last_contact_date: Optional[datetime] = None
    next_action_date: Optional[datetime] = None
    converted_at: Optional[datetime] = None
    converted_to_client_id: Optional[UUID] = None
    conversion_value: Optional[float] = None
    tenant_id: UUID

    class Config:
        from_attributes = True


# ===== OPPORTUNITY SCHEMAS =====

class OpportunityBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    amount: float = Field(..., ge=0)
    currency: str = Field(default="XOF", max_length=3)
    probability: int = Field(default=50, ge=0, le=100)
    stage: str = Field(default="qualification", max_length=50)
    expected_close_date: Optional[date] = None
    products_interested: Optional[List[str]] = None
    requirements: Optional[str] = None
    budget_confirmed: bool = Field(default=False)
    decision_maker_identified: bool = Field(default=False)
    competitors: Optional[List[str]] = None
    competitive_advantage: Optional[str] = None
    forecast_category: str = Field(default="pipeline", max_length=20)
    next_action: Optional[str] = None
    notes: Optional[str] = None
    lead_id: Optional[UUID] = None
    client_id: Optional[UUID] = None
    assigned_to: UUID

class OpportunityCreate(OpportunityBase):
    pass

class OpportunityUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    amount: Optional[float] = Field(None, ge=0)
    currency: Optional[str] = Field(None, max_length=3)
    probability: Optional[int] = Field(None, ge=0, le=100)
    stage: Optional[str] = Field(None, max_length=50)
    expected_close_date: Optional[date] = None
    actual_close_date: Optional[date] = None
    products_interested: Optional[List[str]] = None
    requirements: Optional[str] = None
    budget_confirmed: Optional[bool] = None
    decision_maker_identified: Optional[bool] = None
    competitors: Optional[List[str]] = None
    competitive_advantage: Optional[str] = None
    forecast_category: Optional[str] = Field(None, max_length=20)
    next_action: Optional[str] = None
    loss_reason: Optional[str] = Field(None, max_length=255)
    notes: Optional[str] = None
    lead_id: Optional[UUID] = None
    client_id: Optional[UUID] = None
    assigned_to: Optional[UUID] = None

class Opportunity(OpportunityBase, BaseSchema):
    id: UUID
    reference: Optional[str] = None
    stage_changed_at: datetime
    created_date: date
    actual_close_date: Optional[date] = None
    last_activity_date: Optional[datetime] = None
    loss_reason: Optional[str] = None
    tenant_id: UUID

    class Config:
        from_attributes = True


# ===== CRM ACTIVITY SCHEMAS =====

class CRMActivityBase(BaseModel):
    type: str = Field(default="note", max_length=50)
    subject: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    duration_minutes: Optional[int] = Field(None, ge=0)
    priority: str = Field(default="medium", max_length=20)
    outcome: Optional[str] = Field(None, max_length=50)
    next_action_required: bool = Field(default=False)
    next_action_description: Optional[str] = None
    call_duration: Optional[int] = Field(None, ge=0)
    email_opened: Optional[bool] = None
    meeting_attended: Optional[bool] = None
    lead_id: Optional[UUID] = None
    client_id: Optional[UUID] = None
    opportunity_id: Optional[UUID] = None
    assigned_to: UUID

class CRMActivityCreate(CRMActivityBase):
    pass

class CRMActivityUpdate(BaseModel):
    type: Optional[str] = Field(None, max_length=50)
    subject: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    duration_minutes: Optional[int] = Field(None, ge=0)
    is_completed: Optional[bool] = None
    completed_at: Optional[datetime] = None
    priority: Optional[str] = Field(None, max_length=20)
    outcome: Optional[str] = Field(None, max_length=50)
    next_action_required: Optional[bool] = None
    next_action_description: Optional[str] = None
    call_duration: Optional[int] = Field(None, ge=0)
    email_opened: Optional[bool] = None
    meeting_attended: Optional[bool] = None
    lead_id: Optional[UUID] = None
    client_id: Optional[UUID] = None
    opportunity_id: Optional[UUID] = None
    assigned_to: Optional[UUID] = None

class CRMActivity(CRMActivityBase, BaseSchema):
    id: UUID
    is_completed: bool = False
    completed_at: Optional[datetime] = None
    tenant_id: UUID

    class Config:
        from_attributes = True


# ===== CAMPAIGN SCHEMAS =====

class CampaignBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    type: str = Field(..., max_length=50)
    start_date: datetime
    end_date: Optional[datetime] = None
    budget: Optional[float] = Field(None, ge=0)
    message: Optional[str] = None
    call_to_action: Optional[str] = Field(None, max_length=255)
    landing_page_url: Optional[str] = Field(None, max_length=500)
    target_audience: Optional[List[str]] = None
    expected_reach: Optional[int] = Field(None, ge=0)
    created_by: UUID

class CampaignCreate(CampaignBase):
    pass

class CampaignUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    type: Optional[str] = Field(None, max_length=50)
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    budget: Optional[float] = Field(None, ge=0)
    message: Optional[str] = None
    call_to_action: Optional[str] = Field(None, max_length=255)
    landing_page_url: Optional[str] = Field(None, max_length=500)
    target_audience: Optional[List[str]] = None
    expected_reach: Optional[int] = Field(None, ge=0)
    status: Optional[str] = Field(None, max_length=20)
    total_sent: Optional[int] = Field(None, ge=0)
    total_opened: Optional[int] = Field(None, ge=0)
    total_clicked: Optional[int] = Field(None, ge=0)
    total_converted: Optional[int] = Field(None, ge=0)
    total_cost: Optional[float] = Field(None, ge=0)

class Campaign(CampaignBase, BaseSchema):
    id: UUID
    status: str = "draft"
    total_sent: int = 0
    total_opened: int = 0
    total_clicked: int = 0
    total_converted: int = 0
    total_cost: float = 0
    tenant_id: UUID

    class Config:
        from_attributes = True