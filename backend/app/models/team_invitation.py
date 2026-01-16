import uuid
from datetime import datetime, timedelta
from sqlalchemy import Boolean, Column, ForeignKey, String, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base import Base, TimestampMixin


class TeamInvitation(Base, TimestampMixin):
    __tablename__ = "team_invitations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), nullable=False, index=True)
    role = Column(String(50), nullable=False, default="viewer")
    token = Column(String(255), unique=True, nullable=False, index=True)
    
    invited_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    
    expires_at = Column(DateTime, nullable=False)
    accepted_at = Column(DateTime, nullable=True)
    is_accepted = Column(Boolean, nullable=False, default=False)
    is_cancelled = Column(Boolean, nullable=False, default=False)

    invited_by = relationship("User", foreign_keys=[invited_by_id])
    tenant = relationship("Tenant")

    @staticmethod
    def generate_token():
        """Generate a secure random token"""
        return uuid.uuid4().hex

    @staticmethod
    def default_expiry():
        """Default expiry: 7 days from now"""
        return datetime.utcnow() + timedelta(days=7)

    def is_valid(self):
        """Check if invitation is still valid"""
        if self.is_accepted or self.is_cancelled:
            return False
        if self.expires_at < datetime.utcnow():
            return False
        return True
