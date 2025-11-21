from typing import Optional
from uuid import UUID
from decimal import Decimal
from pydantic import BaseModel, ConfigDict

class ProductBase(BaseModel):
    name: str
    sku: Optional[str] = None
    price: Decimal
    stock_quantity: int
    min_stock_alert: Optional[int] = 5
    client_id: UUID

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    sku: Optional[str] = None
    price: Optional[Decimal] = None
    stock_quantity: Optional[int] = None
    min_stock_alert: Optional[int] = None

class Product(ProductBase):
    id: UUID
    tenant_id: UUID
    
    model_config = ConfigDict(from_attributes=True)
