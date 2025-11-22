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

class ContractUpdate(BaseModel):
    type: Optional[ContractType] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    base_salary: Optional[float] = None
    currency: Optional[str] = None
    allowances: Optional[Dict[str, float]] = None

class ContractResponse(ContractBase):
    id: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Payslip Schemas
class PayslipBase(BaseModel):
    employee_id: str
    period_start: date
    period_end: date
    gross_salary: float
    net_salary: float
    earnings: Dict[str, Any] = {}
    deductions: Dict[str, Any] = {}

class PayslipCreate(PayslipBase):
    pass

class PayslipUpdate(BaseModel):
    gross_salary: Optional[float] = None
    net_salary: Optional[float] = None
    earnings: Optional[Dict[str, Any]] = None
    deductions: Optional[Dict[str, Any]] = None
    status: Optional[str] = None

class PayslipGenerate(BaseModel):
    employee_id: str
    period_start: date
    period_end: date

class PayslipResponse(PayslipBase):
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
class LeaveRequestBase(BaseModel):
    employee_id: str
    type: LeaveType
    start_date: date
    end_date: date
    days_count: float
    reason: Optional[str] = None

class LeaveRequestCreate(LeaveRequestBase):
    pass

class LeaveRequestUpdate(BaseModel):
    type: Optional[LeaveType] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    days_count: Optional[float] = None
    reason: Optional[str] = None
    status: Optional[LeaveStatus] = None

class LeaveRequestResponse(LeaveRequestBase):
    id: str
    status: LeaveStatus
    created_at: datetime

    class Config:
        from_attributes = True

# Aliases for backward compatibility
Employee = EmployeeResponse
Contract = ContractResponse
Payslip = PayslipResponse
LeaveRequest = LeaveRequestResponse
