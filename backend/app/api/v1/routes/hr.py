from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.schemas import hr as schemas
from app.services.hr import hr_service
from app.models.user import User

router = APIRouter()

@router.get("/employees/", response_model=List[schemas.EmployeeResponse])
def get_employees(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve employees.
    """
    return hr_service.get_employees(db, tenant_id=str(current_user.tenant_id), skip=skip, limit=limit)

@router.post("/employees/", response_model=schemas.EmployeeResponse)
def create_employee(
    employee_in: schemas.EmployeeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create new employee.
    """
    return hr_service.create_employee(db, tenant_id=str(current_user.tenant_id), employee_data=employee_in.model_dump())

@router.get("/contracts/", response_model=List[schemas.ContractResponse])
def get_contracts(
    skip: int = 0,
    limit: int = 100,
    employee_id: str = None,
    is_active: bool = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve contracts. Optionally filter by employee_id and active status.
    """
    return hr_service.get_contracts(
        db,
        tenant_id=str(current_user.tenant_id),
        employee_id=employee_id,
        is_active=is_active,
        skip=skip,
        limit=limit
    )

@router.post("/contracts/", response_model=schemas.ContractResponse)
def create_contract(
    contract_in: schemas.ContractCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a contract for an employee.
    """
    return hr_service.create_contract(db, tenant_id=str(current_user.tenant_id), contract_data=contract_in.model_dump())

@router.get("/payslips/", response_model=List[schemas.PayslipResponse])
def get_payslips(
    skip: int = 0,
    limit: int = 100,
    employee_id: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve payslips for the tenant. Optionally filter by employee_id.
    """
    return hr_service.get_payslips(
        db,
        tenant_id=str(current_user.tenant_id),
        employee_id=employee_id,
        skip=skip,
        limit=limit
    )

@router.post("/payslips/generate/", response_model=schemas.PayslipResponse)
def generate_payslip(
    payslip_in: schemas.PayslipGenerate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Generate a payslip for an employee.
    """
    return hr_service.generate_payslip(
        db,
        tenant_id=str(current_user.tenant_id),
        employee_id=payslip_in.employee_id,
        period_start=payslip_in.period_start,
        period_end=payslip_in.period_end
    )

@router.get("/leaves/", response_model=List[schemas.LeaveRequestResponse])
def get_leaves(
    skip: int = 0,
    limit: int = 100,
    employee_id: str = None,
    status: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve leave requests. Optionally filter by employee_id and status.
    """
    return hr_service.get_leaves(
        db,
        tenant_id=str(current_user.tenant_id),
        employee_id=employee_id,
        status=status,
        skip=skip,
        limit=limit
    )

@router.post("/leaves/", response_model=schemas.LeaveRequestResponse)
def request_leave(
    leave_in: schemas.LeaveRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Submit a leave request.
    """
    return hr_service.request_leave(db, tenant_id=str(current_user.tenant_id), leave_data=leave_in.model_dump())
