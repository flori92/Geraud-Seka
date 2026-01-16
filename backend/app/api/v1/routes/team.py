"""
Team Management API Routes
Gestion des invitations et des membres d'équipe
"""
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from pydantic import BaseModel, EmailStr
from uuid import UUID

from app.db.session import get_db
from app.core.deps import get_current_user, get_current_tenant
from app.models.user import User
from app.models.tenant import Tenant
from app.models.team_invitation import TeamInvitation
from app.core.security import get_password_hash
from app.services.email import send_team_invitation_email

router = APIRouter()


class InviteMemberRequest(BaseModel):
    email: EmailStr
    role: str = "viewer"


class InvitationResponse(BaseModel):
    id: str
    email: str
    role: str
    invited_by_name: str
    status: str
    created_at: datetime
    expires_at: datetime

    class Config:
        from_attributes = True


class TeamMemberResponse(BaseModel):
    id: str
    full_name: str
    email: str
    role: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class AcceptInvitationRequest(BaseModel):
    token: str
    full_name: str
    password: str


@router.post("/invite", status_code=status.HTTP_201_CREATED)
async def invite_team_member(
    data: InviteMemberRequest,
    current_user: User = Depends(get_current_user),
    current_tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """
    Invite a new team member by email.
    Sends an invitation email with a unique token.
    """
    if current_user.role not in ["admin", "manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins and managers can invite team members"
        )
    
    existing_user = db.query(User).filter(
        User.email == data.email,
        User.tenant_id == current_tenant.id
    ).first()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists in your organization"
        )
    
    pending_invitation = db.query(TeamInvitation).filter(
        TeamInvitation.email == data.email,
        TeamInvitation.tenant_id == current_tenant.id,
        TeamInvitation.is_accepted == False,
        TeamInvitation.is_cancelled == False,
        TeamInvitation.expires_at > datetime.utcnow()
    ).first()
    
    if pending_invitation:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An active invitation already exists for this email"
        )
    
    token = TeamInvitation.generate_token()
    
    invitation = TeamInvitation(
        email=data.email,
        role=data.role,
        token=token,
        invited_by_id=current_user.id,
        tenant_id=current_tenant.id,
        expires_at=TeamInvitation.default_expiry()
    )
    
    db.add(invitation)
    db.commit()
    db.refresh(invitation)
    
    try:
        await send_team_invitation_email(
            to_email=data.email,
            inviter_name=current_user.full_name or current_user.email,
            company_name=current_tenant.name,
            invitation_token=token,
            role=data.role
        )
    except Exception as e:
        db.delete(invitation)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send invitation email: {str(e)}"
        )
    
    return {
        "message": "Invitation sent successfully",
        "invitation_id": str(invitation.id),
        "email": invitation.email,
        "expires_at": invitation.expires_at
    }


@router.get("/invitations", response_model=List[InvitationResponse])
async def list_invitations(
    current_user: User = Depends(get_current_user),
    current_tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """List all pending invitations for the current tenant"""
    invitations = db.query(TeamInvitation).filter(
        TeamInvitation.tenant_id == current_tenant.id,
        TeamInvitation.is_accepted == False,
        TeamInvitation.is_cancelled == False
    ).order_by(TeamInvitation.created_at.desc()).all()
    
    return [
        InvitationResponse(
            id=str(inv.id),
            email=inv.email,
            role=inv.role,
            invited_by_name=inv.invited_by.full_name or inv.invited_by.email,
            status="expired" if inv.expires_at < datetime.utcnow() else "pending",
            created_at=inv.created_at,
            expires_at=inv.expires_at
        )
        for inv in invitations
    ]


@router.get("/members", response_model=List[TeamMemberResponse])
async def list_team_members(
    current_user: User = Depends(get_current_user),
    current_tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """List all team members for the current tenant"""
    users = db.query(User).filter(
        User.tenant_id == current_tenant.id,
        User.is_active == True
    ).order_by(User.created_at.desc()).all()
    
    return [
        TeamMemberResponse(
            id=str(user.id),
            full_name=user.full_name or "N/A",
            email=user.email,
            role=user.role,
            status="active",
            created_at=user.created_at
        )
        for user in users
    ]


@router.post("/invitations/{invitation_id}/resend")
async def resend_invitation(
    invitation_id: UUID,
    current_user: User = Depends(get_current_user),
    current_tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """Resend an invitation email"""
    invitation = db.query(TeamInvitation).filter(
        TeamInvitation.id == invitation_id,
        TeamInvitation.tenant_id == current_tenant.id
    ).first()
    
    if not invitation:
        raise HTTPException(status_code=404, detail="Invitation not found")
    
    if invitation.is_accepted:
        raise HTTPException(status_code=400, detail="Invitation already accepted")
    
    if invitation.is_cancelled:
        raise HTTPException(status_code=400, detail="Invitation was cancelled")
    
    invitation.expires_at = TeamInvitation.default_expiry()
    invitation.token = TeamInvitation.generate_token()
    db.commit()
    
    await send_team_invitation_email(
        to_email=invitation.email,
        inviter_name=current_user.full_name or current_user.email,
        company_name=current_tenant.name,
        invitation_token=invitation.token,
        role=invitation.role
    )
    
    return {"message": "Invitation resent successfully"}


@router.delete("/invitations/{invitation_id}")
async def cancel_invitation(
    invitation_id: UUID,
    current_user: User = Depends(get_current_user),
    current_tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """Cancel a pending invitation"""
    invitation = db.query(TeamInvitation).filter(
        TeamInvitation.id == invitation_id,
        TeamInvitation.tenant_id == current_tenant.id
    ).first()
    
    if not invitation:
        raise HTTPException(status_code=404, detail="Invitation not found")
    
    invitation.is_cancelled = True
    db.commit()
    
    return {"message": "Invitation cancelled successfully"}


@router.post("/accept-invitation")
async def accept_invitation(
    data: AcceptInvitationRequest,
    db: Session = Depends(get_db)
):
    """Accept an invitation and create a new user account"""
    invitation = db.query(TeamInvitation).filter(
        TeamInvitation.token == data.token
    ).first()
    
    if not invitation:
        raise HTTPException(status_code=404, detail="Invalid invitation token")
    
    if not invitation.is_valid():
        raise HTTPException(
            status_code=400,
            detail="This invitation has expired or is no longer valid"
        )
    
    existing_user = db.query(User).filter(User.email == invitation.email).first()
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="An account with this email already exists"
        )
    
    new_user = User(
        email=invitation.email,
        full_name=data.full_name,
        hashed_password=get_password_hash(data.password),
        role=invitation.role,
        tenant_id=invitation.tenant_id,
        is_active=True,
        is_superuser=False
    )
    
    db.add(new_user)
    
    invitation.is_accepted = True
    invitation.accepted_at = datetime.utcnow()
    
    db.commit()
    db.refresh(new_user)
    
    return {
        "message": "Account created successfully",
        "user_id": str(new_user.id),
        "email": new_user.email
    }


@router.put("/members/{user_id}/role")
async def update_member_role(
    user_id: UUID,
    role: str,
    current_user: User = Depends(get_current_user),
    current_tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """Update a team member's role"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Only admins can change user roles"
        )
    
    user = db.query(User).filter(
        User.id == user_id,
        User.tenant_id == current_tenant.id
    ).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if str(user.id) == str(current_user.id):
        raise HTTPException(
            status_code=400,
            detail="You cannot change your own role"
        )
    
    user.role = role
    db.commit()
    
    return {"message": "Role updated successfully"}


@router.delete("/members/{user_id}")
async def remove_team_member(
    user_id: UUID,
    current_user: User = Depends(get_current_user),
    current_tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """Remove a team member"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Only admins can remove team members"
        )
    
    user = db.query(User).filter(
        User.id == user_id,
        User.tenant_id == current_tenant.id
    ).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if str(user.id) == str(current_user.id):
        raise HTTPException(
            status_code=400,
            detail="You cannot remove yourself"
        )
    
    user.is_active = False
    db.commit()
    
    return {"message": "Team member removed successfully"}
