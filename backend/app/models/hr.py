from datetime import date, datetime
from enum import Enum
from typing import Optional, List
from sqlalchemy import Column, String, Integer, Float, Boolean, ForeignKey, Date, DateTime, JSON, Text
from sqlalchemy.orm import relationship
from app.db.base_class import Base
import uuid

class EmployeeStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    ON_LEAVE = "on_leave"
    TERMINATED = "terminated"

class ContractType(str, Enum):
    CDI = "cdi"
    CDD = "cdd"
    STAGE = "stage"
    FREELANCE = "freelance"

class LeaveType(str, Enum):
    PAID = "paid"
    SICK = "sick"
    UNPAID = "unpaid"
    MATERNITY = "maternity"
    OTHER = "other"

class LeaveStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

class Employee(Base):
    __tablename__ = "employees"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, nullable=False, index=True)
    
    # Personal Info
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    address = Column(Text, nullable=True)
    birth_date = Column(Date, nullable=True)
    nationality = Column(String, nullable=True)
    
    # Professional Info
    job_title = Column(String, nullable=False)
    department = Column(String, nullable=True)
    manager_id = Column(String, ForeignKey("employees.id"), nullable=True)
    status = Column(String, default=EmployeeStatus.ACTIVE)
    hire_date = Column(Date, nullable=False)
    
    # Banking
    bank_name = Column(String, nullable=True)
    bank_account_number = Column(String, nullable=True)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    contracts = relationship("Contract", back_populates="employee")
    payslips = relationship("Payslip", back_populates="employee")
    leaves = relationship("LeaveRequest", back_populates="employee")
    manager = relationship("Employee", remote_side=[id])

class Contract(Base):
    __tablename__ = "contracts"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, nullable=False, index=True)
    employee_id = Column(String, ForeignKey("employees.id"), nullable=False)
    
    type = Column(String, default=ContractType.CDI)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)
    
    base_salary = Column(Float, nullable=False)
    currency = Column(String, default="XOF")
    
    # Allowances (stored as JSON)
    # Example: {"transport": 50000, "housing": 100000}
    allowances = Column(JSON, default=dict)
    
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    employee = relationship("Employee", back_populates="contracts")

class Payslip(Base):
    __tablename__ = "payslips"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, nullable=False, index=True)
    employee_id = Column(String, ForeignKey("employees.id"), nullable=False)
    
    period_start = Column(Date, nullable=False)
    period_end = Column(Date, nullable=False)
    payment_date = Column(Date, nullable=True)
    
    # Financials
    gross_salary = Column(Float, nullable=False)
    net_salary = Column(Float, nullable=False)
    
    # Details stored as JSON for flexibility with OHADA rules
    earnings = Column(JSON, default=dict) # Base, Overtime, Bonuses
    deductions = Column(JSON, default=dict) # Taxes, Social Security, Advances
    employer_contributions = Column(JSON, default=dict)
    
    status = Column(String, default="draft") # draft, generated, paid
    pdf_url = Column(String, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    employee = relationship("Employee", back_populates="payslips")

class LeaveRequest(Base):
    __tablename__ = "leave_requests"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, nullable=False, index=True)
    employee_id = Column(String, ForeignKey("employees.id"), nullable=False)
    
    type = Column(String, default=LeaveType.PAID)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    days_count = Column(Float, nullable=False)
    
    reason = Column(Text, nullable=True)
    status = Column(String, default=LeaveStatus.PENDING)
    
    approved_by_id = Column(String, ForeignKey("employees.id"), nullable=True)
    rejection_reason = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    employee = relationship("Employee", back_populates="leaves")
