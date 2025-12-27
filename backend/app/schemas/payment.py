from typing import Optional, Dict, Any
from uuid import UUID
from datetime import date
from decimal import Decimal
from pydantic import BaseModel, ConfigDict

class PaymentBase(BaseModel):
    amount: Decimal
    payment_date: date
    payment_method: Optional[str] = None
    reference: Optional[str] = None

class PaymentCreate(PaymentBase):
    invoice_id: UUID

class PaymentUpdate(BaseModel):
    amount: Optional[Decimal] = None
    payment_date: Optional[date] = None
    payment_method: Optional[str] = None
    reference: Optional[str] = None

class Payment(PaymentBase):
    id: UUID
    invoice_id: UUID
    tenant_id: UUID
    
    model_config = ConfigDict(from_attributes=True)

class StripeCustomerCreate(BaseModel):
    email: str
    name: str
    metadata: Optional[Dict[str, Any]] = None

class StripeSubscriptionCreate(BaseModel):
    customer_id: str
    price_id: str
    trial_days: Optional[int] = None

class KKiaPayLinkCreate(BaseModel):
    amount: float
    reason: str
    callback_url: str

class KKiaPayVerify(BaseModel):
    transaction_id: str
