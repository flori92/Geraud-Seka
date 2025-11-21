from typing import List, Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core import deps
from app.models.client import Client
from app.models.user import User
from app.schemas import client as client_schema

router = APIRouter()

@router.get("/", response_model=List[client_schema.Client])
def read_clients(
    db: Session = Depends(deps.get_db_session),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Retrieve clients.
    """
    # Filter by tenant_id of the current user
    clients = (
        db.query(Client)
        .filter(Client.tenant_id == current_user.tenant_id)
        .offset(skip)
        .limit(limit)
        .all()
    )
    return clients

@router.post("/", response_model=client_schema.Client)
def create_client(
    *,
    db: Session = Depends(deps.get_db_session),
    client_in: client_schema.ClientCreate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Create new client.
    """
    client = Client(
        name=client_in.name,
        slug=client_in.slug,
        sector=client_in.sector,
        tenant_id=current_user.tenant_id,
    )
    db.add(client)
    db.commit()
    db.refresh(client)
    return client

@router.get("/{client_id}", response_model=client_schema.Client)
def read_client(
    *,
    db: Session = Depends(deps.get_db_session),
    client_id: UUID,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get client by ID.
    """
    client = db.query(Client).filter(Client.id == client_id, Client.tenant_id == current_user.tenant_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return client

@router.put("/{client_id}", response_model=client_schema.Client)
def update_client(
    *,
    db: Session = Depends(deps.get_db_session),
    client_id: UUID,
    client_in: client_schema.ClientUpdate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Update a client.
    """
    client = db.query(Client).filter(Client.id == client_id, Client.tenant_id == current_user.tenant_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    update_data = client_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(client, field, value)
        
    db.add(client)
    db.commit()
    db.refresh(client)
    return client
