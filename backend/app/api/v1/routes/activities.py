from typing import List, Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core import deps
from app.models.activity import Activity
from app.models.user import User
from app.schemas import activity as activity_schema

router = APIRouter()

@router.get("/", response_model=List[activity_schema.Activity])
def read_activities(
    db: Session = Depends(deps.get_db_session),
    skip: int = 0,
    limit: int = 100,
    client_id: UUID = None,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Retrieve activities.
    """
    query = db.query(Activity).filter(Activity.tenant_id == current_user.tenant_id)
    
    if client_id:
        query = query.filter(Activity.client_id == client_id)
        
    activities = query.offset(skip).limit(limit).all()
    return activities

@router.post("/", response_model=activity_schema.Activity)
def create_activity(
    *,
    db: Session = Depends(deps.get_db_session),
    activity_in: activity_schema.ActivityCreate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Create new activity.
    """
    activity = Activity(
        type=activity_in.type,
        date=activity_in.date,
        amount=activity_in.amount,
        description=activity_in.description,
        client_id=activity_in.client_id,
        tenant_id=current_user.tenant_id,
    )
    db.add(activity)
    db.commit()
    db.refresh(activity)
    return activity

@router.get("/{activity_id}", response_model=activity_schema.Activity)
def read_activity(
    *,
    db: Session = Depends(deps.get_db_session),
    activity_id: UUID,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get activity by ID.
    """
    activity = db.query(Activity).filter(Activity.id == activity_id, Activity.tenant_id == current_user.tenant_id).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    return activity
