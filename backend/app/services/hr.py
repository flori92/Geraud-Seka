from typing import List, Optional, Dict
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, datetime, timedelta
from app.models.hr import Employee, Contract, Payslip, LeaveRequest, EmployeeStatus, LeaveStatus
from fastapi import HTTPException

class HRService:
    def get_employees(self, db: Session, tenant_id: str, skip: int = 0, limit: int = 100) -> List[Employee]:
        return db.query(Employee).filter(Employee.tenant_id == tenant_id).offset(skip).limit(limit).all()

    def create_employee(self, db: Session, tenant_id: str, employee_data: dict) -> Employee:
        employee = Employee(tenant_id=tenant_id, **employee_data)
        db.add(employee)
        db.commit()
        db.refresh(employee)
        return employee

    def get_employee(self, db: Session, employee_id: str, tenant_id: str) -> Optional[Employee]:
        return db.query(Employee).filter(Employee.id == employee_id, Employee.tenant_id == tenant_id).first()

    def get_contracts(
        self,
        db: Session,
        tenant_id: str,
        employee_id: Optional[str] = None,
        is_active: Optional[bool] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Contract]:
        """
        Retrieve contracts for a tenant, optionally filtered by employee_id and active status.
        """
        query = db.query(Contract).filter(Contract.tenant_id == tenant_id)

        if employee_id:
            query = query.filter(Contract.employee_id == employee_id)

        if is_active is not None:
            query = query.filter(Contract.is_active == is_active)

        return query.order_by(Contract.start_date.desc()).offset(skip).limit(limit).all()

    def create_contract(self, db: Session, tenant_id: str, contract_data: dict) -> Contract:
        # Deactivate previous active contracts for this employee
        active_contracts = db.query(Contract).filter(
            Contract.employee_id == contract_data["employee_id"],
            Contract.is_active == True,
            Contract.tenant_id == tenant_id
        ).all()

        for contract in active_contracts:
            contract.is_active = False
            contract.end_date = contract_data["start_date"]

        new_contract = Contract(tenant_id=tenant_id, **contract_data)
        db.add(new_contract)
        db.commit()
        db.refresh(new_contract)
        return new_contract

    def get_payslips(
        self,
        db: Session,
        tenant_id: str,
        employee_id: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Payslip]:
        """
        Retrieve payslips for a tenant, optionally filtered by employee_id.
        """
        query = db.query(Payslip).filter(Payslip.tenant_id == tenant_id)

        if employee_id:
            query = query.filter(Payslip.employee_id == employee_id)

        return query.order_by(Payslip.period_end.desc()).offset(skip).limit(limit).all()

    def generate_payslip(self, db: Session, tenant_id: str, employee_id: str, period_start: date, period_end: date) -> Payslip:
        employee = self.get_employee(db, employee_id, tenant_id)
        if not employee:
            raise HTTPException(status_code=404, detail="Employee not found")

        # Get active contract
        contract = db.query(Contract).filter(
            Contract.employee_id == employee_id,
            Contract.is_active == True,
            Contract.tenant_id == tenant_id
        ).first()

        if not contract:
            raise HTTPException(status_code=400, detail="No active contract found for employee")

        # Simple Payroll Calculation Logic (Placeholder for complex OHADA logic)
        base_salary = contract.base_salary
        allowances = sum(contract.allowances.values()) if contract.allowances else 0
        gross_salary = base_salary + allowances

        # Mock deductions (CNSS, IUTS, etc.) - approx 5% for demo
        deductions_amount = gross_salary * 0.05
        deductions = {"cnss": deductions_amount}

        net_salary = gross_salary - deductions_amount

        payslip = Payslip(
            tenant_id=tenant_id,
            employee_id=employee_id,
            period_start=period_start,
            period_end=period_end,
            gross_salary=gross_salary,
            net_salary=net_salary,
            earnings={"base": base_salary, "allowances": allowances},
            deductions=deductions,
            employer_contributions={"cnss_employer": gross_salary * 0.15}, # Mock
            status="draft"
        )

        db.add(payslip)
        db.commit()
        db.refresh(payslip)
        return payslip

    def get_leaves(
        self,
        db: Session,
        tenant_id: str,
        employee_id: Optional[str] = None,
        status: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[LeaveRequest]:
        """
        Retrieve leave requests for a tenant, optionally filtered by employee_id and status.
        """
        query = db.query(LeaveRequest).filter(LeaveRequest.tenant_id == tenant_id)

        if employee_id:
            query = query.filter(LeaveRequest.employee_id == employee_id)

        if status:
            query = query.filter(LeaveRequest.status == status)

        return query.order_by(LeaveRequest.start_date.desc()).offset(skip).limit(limit).all()

    def request_leave(self, db: Session, tenant_id: str, leave_data: dict) -> LeaveRequest:
        leave = LeaveRequest(tenant_id=tenant_id, **leave_data)
        db.add(leave)
        db.commit()
        db.refresh(leave)
        return leave

hr_service = HRService()
