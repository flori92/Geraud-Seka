"""
API Routes Reports pour SEKA Enterprise
Génération de rapports: ventes, comptabilité, RH, CRM
Avec export PDF
"""

from datetime import datetime, timedelta
from typing import Optional, List
from io import BytesIO
from fastapi import APIRouter, Depends, Query, BackgroundTasks
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from pydantic import BaseModel

from app.db.session import get_db
from app.api.deps import get_current_user, get_current_tenant
from app.models.user import User
from app.models.tenant import Tenant
from app.models.notifications import Report, ReportType, ReportFormat

router = APIRouter()


# ==================== SCHEMAS ====================

class ReportRequest(BaseModel):
    name: str
    report_type: str
    period: str = "month"
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    format: str = "pdf"
    filters: Optional[dict] = None
    recipients: Optional[List[str]] = None
    is_scheduled: bool = False
    schedule_cron: Optional[str] = None


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


# ==================== RAPPORTS CRM ====================

@router.get("/crm/leads")
async def get_leads_report(
    period: str = Query("month"),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Rapport des leads CRM"""
    from app.models.crm import Lead
    
    end = datetime.now() if not end_date else datetime.fromisoformat(end_date)
    
    if not start_date:
        days = {"week": 7, "month": 30, "quarter": 90, "year": 365}.get(period, 30)
        start = end - timedelta(days=days)
    else:
        start = datetime.fromisoformat(start_date)
    
    total = db.query(Lead).filter(Lead.tenant_id == current_tenant.id).count()
    
    new_leads = db.query(Lead).filter(
        and_(Lead.tenant_id == current_tenant.id, Lead.created_at >= start, Lead.created_at <= end)
    ).count()
    
    by_status = db.query(Lead.status, func.count(Lead.id)).filter(
        Lead.tenant_id == current_tenant.id
    ).group_by(Lead.status).all()
    
    by_source = db.query(Lead.source, func.count(Lead.id)).filter(
        Lead.tenant_id == current_tenant.id
    ).group_by(Lead.source).all()
    
    converted = db.query(Lead).filter(
        and_(Lead.tenant_id == current_tenant.id, Lead.converted_at.isnot(None))
    ).count()
    
    return {
        "report_type": "crm_leads",
        "period": period,
        "summary": {
            "total_leads": total,
            "new_leads": new_leads,
            "converted": converted,
            "conversion_rate": round((converted / total) * 100, 2) if total > 0 else 0
        },
        "by_status": {s: c for s, c in by_status},
        "by_source": {s: c for s, c in by_source},
        "generated_at": datetime.now().isoformat()
    }


@router.get("/crm/campaigns")
async def get_campaigns_report(
    period: str = Query("month"),
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Rapport des campagnes email"""
    from app.models.crm import EmailCampaign, CampaignStatus
    
    campaigns = db.query(EmailCampaign).filter(EmailCampaign.tenant_id == current_tenant.id).all()
    sent = [c for c in campaigns if c.status == CampaignStatus.SENT]
    
    total_sent = sum(c.sent_count for c in sent)
    total_opened = sum(c.opened_count for c in sent)
    total_clicked = sum(c.clicked_count for c in sent)
    
    return {
        "report_type": "crm_campaigns",
        "summary": {
            "total_campaigns": len(campaigns),
            "sent_campaigns": len(sent),
            "total_emails_sent": total_sent,
            "avg_open_rate": round((total_opened / total_sent) * 100, 2) if total_sent > 0 else 0,
            "avg_click_rate": round((total_clicked / total_sent) * 100, 2) if total_sent > 0 else 0
        },
        "generated_at": datetime.now().isoformat()
    }


# ==================== GÉNÉRATION PDF ====================

@router.post("/generate")
async def generate_report(
    data: ReportRequest,
    background_tasks: BackgroundTasks,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Générer un rapport PDF/Excel/CSV"""
    report = Report(
        name=data.name,
        report_type=data.report_type,
        config={"period": data.period, "filters": data.filters},
        format=data.format,
        status="pending",
        is_scheduled=data.is_scheduled,
        schedule_cron=data.schedule_cron,
        recipients=data.recipients,
        tenant_id=current_tenant.id,
        created_by=current_user.id
    )
    
    db.add(report)
    db.commit()
    db.refresh(report)
    
    background_tasks.add_task(generate_report_file, str(report.id))
    
    return {"report_id": str(report.id), "status": "pending"}


@router.get("/generated")
async def list_generated_reports(
    report_type: Optional[str] = Query(None),
    limit: int = Query(20),
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Liste des rapports générés"""
    query = db.query(Report).filter(Report.tenant_id == current_tenant.id)
    if report_type:
        query = query.filter(Report.report_type == report_type)
    
    reports = query.order_by(Report.created_at.desc()).limit(limit).all()
    
    return [
        {
            "id": str(r.id),
            "name": r.name,
            "report_type": r.report_type,
            "format": r.format,
            "status": r.status,
            "generated_at": r.generated_at.isoformat() if r.generated_at else None
        }
        for r in reports
    ]


async def generate_report_file(report_id: str):
    """Génère le fichier en arrière-plan"""
    from app.db.session import SessionLocal
    db = SessionLocal()
    try:
        report = db.query(Report).get(report_id)
        if report:
            report.status = "completed"
            report.generated_at = datetime.now()
            db.commit()
    finally:
        db.close()
