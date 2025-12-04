"""
API Routes Reports pour SEKA Enterprise
Génération de rapports: ventes, comptabilité, RH
"""

from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, Query
from app.core.deps import get_current_user, get_current_tenant
from app.models.user import User
from app.models.tenant import Tenant

router = APIRouter()


@router.get("/sales")
async def get_sales_report(
    period: str = Query("month", description="Period: day, week, month, quarter, year"),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
):
    """
    Rapport des ventes avec métriques clés
    """
    # Mock sales data
    return {
        "report_type": "sales",
        "period": period,
        "start_date": start_date or (datetime.now() - timedelta(days=30)).isoformat(),
        "end_date": end_date or datetime.now().isoformat(),
        "summary": {
            "total_revenue": 45600000,
            "total_orders": 156,
            "average_order_value": 292307,
            "total_items_sold": 842,
            "growth_rate": 12.5
        },
        "by_category": [
            {"category": "Électronique", "revenue": 25000000, "orders": 78},
            {"category": "Mobilier", "revenue": 12000000, "orders": 45},
            {"category": "Fournitures", "revenue": 8600000, "orders": 33}
        ],
        "by_client_type": {
            "B2B": {"revenue": 35000000, "percentage": 76.7},
            "B2C": {"revenue": 10600000, "percentage": 23.3}
        },
        "top_products": [
            {"name": "Ordinateur Portable Dell XPS", "quantity": 45, "revenue": 38250000},
            {"name": "Imprimante HP LaserJet", "quantity": 28, "revenue": 7000000}
        ],
        "generated_at": datetime.now().isoformat()
    }


@router.get("/accounting")
async def get_accounting_report(
    period: str = Query("month", description="Period: day, week, month, quarter, year"),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
):
    """
    Rapport comptable avec bilan et compte de résultat
    """
    # Mock accounting data
    return {
        "report_type": "accounting",
        "period": period,
        "start_date": start_date or (datetime.now() - timedelta(days=30)).isoformat(),
        "end_date": end_date or datetime.now().isoformat(),
        "income_statement": {
            "revenue": 45600000,
            "cost_of_goods_sold": 28000000,
            "gross_profit": 17600000,
            "operating_expenses": 8500000,
            "operating_income": 9100000,
            "net_income": 7500000
        },
        "balance_sheet": {
            "assets": {
                "current_assets": 85000000,
                "fixed_assets": 120000000,
                "total_assets": 205000000
            },
            "liabilities": {
                "current_liabilities": 35000000,
                "long_term_liabilities": 60000000,
                "total_liabilities": 95000000
            },
            "equity": 110000000
        },
        "cash_flow": {
            "operating_activities": 8500000,
            "investing_activities": -15000000,
            "financing_activities": 5000000,
            "net_cash_flow": -1500000
        },
        "key_ratios": {
            "current_ratio": 2.43,
            "debt_to_equity": 0.86,
            "gross_profit_margin": 38.6,
            "net_profit_margin": 16.4,
            "return_on_assets": 3.7
        },
        "generated_at": datetime.now().isoformat()
    }


@router.get("/hr")
async def get_hr_report(
    period: str = Query("month", description="Period: day, week, month, quarter, year"),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
):
    """
    Rapport RH: effectifs, paie, congés, recrutement
    """
    # Mock HR data
    return {
        "report_type": "hr",
        "period": period,
        "start_date": start_date or (datetime.now() - timedelta(days=30)).isoformat(),
        "end_date": end_date or datetime.now().isoformat(),
        "workforce": {
            "total_employees": 127,
            "active_employees": 125,
            "new_hires": 8,
            "terminations": 3,
            "turnover_rate": 2.4
        },
        "by_department": [
            {"department": "Ventes", "count": 45, "percentage": 35.4},
            {"department": "IT", "count": 28, "percentage": 22.0},
            {"department": "Finance", "count": 22, "percentage": 17.3},
            {"department": "RH", "count": 12, "percentage": 9.4},
            {"department": "Autres", "count": 20, "percentage": 15.7}
        ],
        "payroll": {
            "total_gross_salary": 52500000,
            "total_deductions": 7800000,
            "total_net_salary": 44700000,
            "employer_contributions": 9450000,
            "average_salary": 413385
        },
        "leaves": {
            "total_leave_days": 156,
            "by_type": {
                "annual": 98,
                "sick": 38,
                "other": 20
            },
            "pending_requests": 12,
            "approved_requests": 87
        },
        "attendance": {
            "average_attendance_rate": 96.5,
            "total_absences": 45,
            "late_arrivals": 28
        },
        "generated_at": datetime.now().isoformat()
    }
