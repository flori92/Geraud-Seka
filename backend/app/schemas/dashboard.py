from typing import List, Optional, Any
from pydantic import BaseModel
from datetime import datetime


class DashboardAlert(BaseModel):
    type: str  # "warning", "error", "info", "success"
    title: str
    message: str


class RecentActivity(BaseModel):
    action: str
    client: str
    amount: Optional[str] = None
    time: str


class DashboardStats(BaseModel):
    total_clients: int
    active_clients: int
    documents_pending: int
    documents_processed_this_month: int
    tasks_overdue: int
    tasks_due_this_week: int
    total_revenue: Optional[float] = None
    total_invoices: Optional[int] = None
    pending_payments: Optional[int] = None
    alerts: Optional[List[DashboardAlert]] = []
    recent_activities: Optional[List[RecentActivity]] = []


class ClientDashboardStats(BaseModel):
    client_name: str
    documents_pending: int
    last_activity: Optional[str]


class FinancialMetrics(BaseModel):
    total_revenue: float
    total_expenses: float
    net_profit: float
    outstanding_invoices: float
    cash_balance: float


class SalesOverview(BaseModel):
    total_quotes: int
    pending_quotes: int
    total_invoices: int
    unpaid_invoices: int
    total_revenue: float
    revenue_this_month: float


class ModuleStats(BaseModel):
    crm: Optional[dict] = None
    sales: Optional[dict] = None
    treasury: Optional[dict] = None
    hr: Optional[dict] = None
    stock: Optional[dict] = None
