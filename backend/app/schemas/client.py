from typing import Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict

class ClientBase(BaseModel):
    name: str
    slug: str
    sector: Optional[str] = None

class ClientCreate(ClientBase):
    pass

class ClientUpdate(ClientBase):
    name: Optional[str] = None
    slug: Optional[str] = None

class Client(ClientBase):
    id: UUID
    tenant_id: UUID
    
    model_config = ConfigDict(from_attributes=True)
