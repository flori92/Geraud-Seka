from typing import List, Optional
from pydantic import BaseModel


class DashboardStats(BaseModel):
    total_clients: int
    active_clients: int
    documents_pending: int
    documents_processed_this_month: int
    tasks_overdue: int
    tasks_due_this_week: int


class ClientDashboardStats(BaseModel):
    client_name: str
    documents_pending: int
    last_activity: Optional[str]
