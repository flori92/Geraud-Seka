from typing import Optional, Dict, Any
from pydantic import BaseModel

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
