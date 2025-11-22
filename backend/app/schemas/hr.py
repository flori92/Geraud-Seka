from typing import Optional, List, Dict, Any
from datetime import date, datetime
from pydantic import BaseModel, EmailStr
from app.models.hr import EmployeeStatus, ContractType, LeaveType, LeaveStatus

# Employee Schemas
class EmployeeBase(BaseModel):
    first_name: str
    last_name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    birth_date: Optional[date] = None
    nationality: Optional[str] = None
    job_title: str
    department: Optional[str] = None
    manager_id: Optional[str] = None
    hire_date: date
    bank_name: Optional[str] = None
    bank_account_number: Optional[str] = None

class EmployeeCreate(EmployeeBase):
    pass

class EmployeeUpdate(EmployeeBase):
    status: Optional[EmployeeStatus] = None

class EmployeeResponse(EmployeeBase):
    id: str
    tenant_id: str
    status: EmployeeStatus
    created_at: datetime
    
    class Config:
        from_attributes = True

# Contract Schemas
class ContractBase(BaseModel):
    employee_id: str
    type: ContractType = ContractType.CDI
    start_date: date
    end_date: Optional[date] = None
    base_salary: float
    currency: str = "XOF"
    allowances: Dict[str, float] = {}

class ContractCreate(ContractBase):
    pass

class ContractResponse(ContractBase):
    id: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Payslip Schemas
class PayslipGenerate(BaseModel):
    employee_id: str
    period_start: date
    period_end: date

class PayslipResponse(BaseModel):
    id: str
    employee_id: str
    period_start: date
    period_end: date
    gross_salary: float
    net_salary: float
    earnings: Dict[str, Any]
    deductions: Dict[str, Any]
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

# Leave Schemas
class LeaveRequestCreate(BaseModel):
    employee_id: str
    type: LeaveType
    start_date: date
    end_date: date
    days_count: float
    reason: Optional[str] = None

class LeaveRequestResponse(LeaveRequestCreate):
    id: str
    status: LeaveStatus
    created_at: datetime

    class Config:
        from_attributes = True
