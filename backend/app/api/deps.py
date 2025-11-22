"""API dependencies - re-exports from core.deps for backward compatibility."""
from app.core.deps import get_current_user, get_db_session, get_current_tenant

# Alias for backward compatibility
get_db = get_db_session

__all__ = ["get_db", "get_current_user", "get_current_tenant", "get_db_session"]
