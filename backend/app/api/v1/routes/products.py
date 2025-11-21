from typing import List, Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core import deps
from app.models.product import Product
from app.models.user import User
from app.schemas import product as product_schema

router = APIRouter()

@router.get("/", response_model=List[product_schema.Product])
def read_products(
    db: Session = Depends(deps.get_db_session),
    skip: int = 0,
    limit: int = 100,
    client_id: UUID = None,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Retrieve products.
    """
    query = db.query(Product).filter(Product.tenant_id == current_user.tenant_id)
    
    if client_id:
        query = query.filter(Product.client_id == client_id)
        
    products = query.offset(skip).limit(limit).all()
    return products

@router.post("/", response_model=product_schema.Product)
def create_product(
    *,
    db: Session = Depends(deps.get_db_session),
    product_in: product_schema.ProductCreate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Create new product.
    """
    product = Product(
        name=product_in.name,
        sku=product_in.sku,
        price=product_in.price,
        stock_quantity=product_in.stock_quantity,
        min_stock_alert=product_in.min_stock_alert,
        client_id=product_in.client_id,
        tenant_id=current_user.tenant_id,
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product

@router.put("/{product_id}", response_model=product_schema.Product)
def update_product(
    *,
    db: Session = Depends(deps.get_db_session),
    product_id: UUID,
    product_in: product_schema.ProductUpdate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Update a product.
    """
    product = db.query(Product).filter(Product.id == product_id, Product.tenant_id == current_user.tenant_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    update_data = product_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(product, field, value)
        
    db.add(product)
    db.commit()
    db.refresh(product)
    return product
