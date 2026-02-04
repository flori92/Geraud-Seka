import logging
from typing import List, Any, Optional
from uuid import UUID
from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, case, and_, or_

from app.core import deps
from app.models.client import Client
from app.models.user import User
from app.models.sales_invoice import SalesInvoice
from app.schemas import client as client_schema
from app.services.tiers_interconnection import TiersInterconnectionService
from pydantic import BaseModel

logger = logging.getLogger(__name__)

router = APIRouter()

class ClientBalanceRow(BaseModel):
    id: str
    client_name: str
    client_code: str
    balance: float
    overdue_amount: float
    upcoming_30d_amount: float
    last_invoice_date: str
    last_invoice_number: str
    payment_terms: str
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    invoices_count: int
    oldest_overdue_date: Optional[str] = None


class ClientBalanceStatsResponse(BaseModel):
    total_du: float
    en_retard: float
    a_payer_30j: float
    clients_actifs: int


@router.get("/balance", response_model=List[ClientBalanceRow])
async def get_clients_balance(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    search: Optional[str] = Query(None),
    sort_by: Optional[str] = Query("balance"),
    sort_order: Optional[str] = Query("desc"),
    db: Session = Depends(deps.get_db_session),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Get client balances for the current tenant.
    Optimized: Single query with aggregations instead of N+1.
    """
    try:
        today = date.today()
        horizon = today + timedelta(days=30)

        # Mapping des clés de tri
        sort_mapping = {
            "name": "client_name",
            "overdue": "overdue_amount",
            "balance": "balance",
            "client_name": "client_name",
            "overdue_amount": "overdue_amount",
            "upcoming_30d_amount": "upcoming_30d_amount",
        }
        sort_key = sort_mapping.get((sort_by or "balance").strip(), "balance")
        reverse = (sort_order or "desc").strip().lower() != "asc"

        # ===== OPTIMIZED: Single query with all aggregations =====
        # Subquery pour les agrégations par client
        invoice_stats = (
            db.query(
                SalesInvoice.client_id,
                func.count(SalesInvoice.id).label("invoices_count"),
                func.coalesce(func.sum(SalesInvoice.balance_due), 0).label("total_due"),
                # Overdue: due_date < today AND unpaid/partial
                func.coalesce(
                    func.sum(
                        case(
                            (and_(
                                SalesInvoice.due_date < today,
                                SalesInvoice.payment_status.in_(["unpaid", "partial"])
                            ), SalesInvoice.balance_due),
                            else_=0
                        )
                    ), 0
                ).label("overdue_amount"),
                # Upcoming 30d: today <= due_date <= horizon AND unpaid/partial
                func.coalesce(
                    func.sum(
                        case(
                            (and_(
                                SalesInvoice.due_date >= today,
                                SalesInvoice.due_date <= horizon,
                                SalesInvoice.payment_status.in_(["unpaid", "partial"])
                            ), SalesInvoice.balance_due),
                            else_=0
                        )
                    ), 0
                ).label("upcoming_30d"),
                # Oldest overdue date
                func.min(
                    case(
                        (and_(
                            SalesInvoice.due_date < today,
                            SalesInvoice.payment_status.in_(["unpaid", "partial"])
                        ), SalesInvoice.due_date),
                        else_=None
                    )
                ).label("oldest_overdue_date"),
                # Last invoice info
                func.max(SalesInvoice.issue_date).label("last_invoice_date"),
            )
            .filter(SalesInvoice.tenant_id == current_user.tenant_id)
            .group_by(SalesInvoice.client_id)
            .subquery()
        )

        # Subquery pour le dernier numéro de facture par client
        last_invoice_subq = (
            db.query(
                SalesInvoice.client_id,
                SalesInvoice.invoice_number,
            )
            .filter(SalesInvoice.tenant_id == current_user.tenant_id)
            .distinct(SalesInvoice.client_id)
            .order_by(SalesInvoice.client_id, SalesInvoice.issue_date.desc())
            .subquery()
        )

        # Query principale avec LEFT JOIN
        query = (
            db.query(
                Client.id,
                Client.name,
                Client.code,
                Client.email,
                Client.phone,
                func.coalesce(invoice_stats.c.invoices_count, 0).label("invoices_count"),
                func.coalesce(invoice_stats.c.total_due, 0).label("balance"),
                func.coalesce(invoice_stats.c.overdue_amount, 0).label("overdue_amount"),
                func.coalesce(invoice_stats.c.upcoming_30d, 0).label("upcoming_30d_amount"),
                invoice_stats.c.oldest_overdue_date,
                invoice_stats.c.last_invoice_date,
                last_invoice_subq.c.invoice_number.label("last_invoice_number"),
            )
            .outerjoin(invoice_stats, Client.id == invoice_stats.c.client_id)
            .outerjoin(last_invoice_subq, Client.id == last_invoice_subq.c.client_id)
            .filter(Client.tenant_id == current_user.tenant_id)
        )

        # Filtre de recherche
        if search and search.strip():
            search_filter = f"%{search.strip()}%"
            query = query.filter(Client.name.ilike(search_filter))

        results = query.all()

        # Construire la réponse
        rows = [
            {
                "id": str(row.id),
                "client_name": row.name,
                "client_code": row.code or str(row.id)[:8],
                "balance": float(row.balance),
                "overdue_amount": float(row.overdue_amount),
                "upcoming_30d_amount": float(row.upcoming_30d_amount),
                "last_invoice_date": row.last_invoice_date.isoformat() if row.last_invoice_date else "",
                "last_invoice_number": row.last_invoice_number or "",
                "payment_terms": "",
                "contact_email": row.email,
                "contact_phone": row.phone,
                "invoices_count": int(row.invoices_count),
                "oldest_overdue_date": row.oldest_overdue_date.isoformat() if row.oldest_overdue_date else None,
            }
            for row in results
        ]

        # Tri en Python (plus flexible pour les différentes colonnes)
        rows.sort(key=lambda x: x.get(sort_key) or 0, reverse=reverse)

        return rows[skip : skip + limit]

    except Exception as e:
        logger.exception("Error getting client balances")
        raise HTTPException(status_code=500, detail="Erreur lors du calcul des soldes clients")


@router.get("/balance/stats", response_model=ClientBalanceStatsResponse)
async def get_clients_balance_stats(
    db: Session = Depends(deps.get_db_session),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Get aggregate statistics for client balances.
    """
    try:
        today = date.today()
        horizon = today + timedelta(days=30)

        client_ids = [c[0] for c in db.query(Client.id).filter(Client.tenant_id == current_user.tenant_id).all()]

        if not client_ids:
            return {
                "total_du": 0,
                "en_retard": 0,
                "a_payer_30j": 0,
                "clients_actifs": 0,
            }

        inv_base = db.query(SalesInvoice).filter(
            SalesInvoice.tenant_id == current_user.tenant_id,
            SalesInvoice.client_id.in_(client_ids),
        )

        total_du = float(inv_base.with_entities(func.coalesce(func.sum(SalesInvoice.balance_due), 0)).scalar() or 0)

        en_retard = float(
            inv_base.filter(
                SalesInvoice.due_date < today,
                SalesInvoice.payment_status.in_(["unpaid", "partial"])
            )
            .with_entities(func.coalesce(func.sum(SalesInvoice.balance_due), 0))
            .scalar()
            or 0
        )

        a_payer_30j = float(
            inv_base.filter(
                SalesInvoice.due_date >= today,
                SalesInvoice.due_date <= horizon,
                SalesInvoice.payment_status.in_(["unpaid", "partial"])
            )
            .with_entities(func.coalesce(func.sum(SalesInvoice.balance_due), 0))
            .scalar()
            or 0
        )

        clients_actifs = (
            db.query(SalesInvoice.client_id)
            .filter(
                SalesInvoice.tenant_id == current_user.tenant_id,
                SalesInvoice.balance_due > 0,
            )
            .distinct()
            .count()
        )

        return {
            "total_du": total_du,
            "en_retard": en_retard,
            "a_payer_30j": a_payer_30j,
            "clients_actifs": clients_actifs,
        }

    except Exception as e:
        logger.exception("Error getting client balance stats")
        raise HTTPException(status_code=500, detail="Erreur lors du calcul des statistiques")


@router.get("/", response_model=List[dict])
def read_clients(
    db: Session = Depends(deps.get_db_session),
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = Query(None),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Retrieve clients with auxiliary account information.
    """
    query = db.query(Client).filter(Client.tenant_id == current_user.tenant_id)
    
    # Search filter
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (Client.name.ilike(search_filter)) |
            (Client.code.ilike(search_filter)) |
            (Client.auxiliary_account_code.ilike(search_filter))
        )
    
    clients = query.offset(skip).limit(limit).all()
    
    # Return with auxiliary account info
    return [
        {
            "id": str(client.id),
            "name": client.name,
            "slug": client.slug,
            "code": getattr(client, 'code', None),
            "sector": client.sector,
            "auxiliary_account_code": getattr(client, 'auxiliary_account_code', None),
            "has_active_rule": getattr(client, 'has_active_rule', False),
            "default_revenue_account": getattr(client, 'default_revenue_account', None),
            "default_vat_account": getattr(client, 'default_vat_account', None),
            "default_tax_rate": float(getattr(client, 'default_tax_rate', 0) or 0),
            "contact_name": getattr(client, 'contact_name', None),
            "email": getattr(client, 'email', None),
            "phone": getattr(client, 'phone', None),
            "address": getattr(client, 'address', None),
        }
        for client in clients
    ]


class ClientCreateExtended(BaseModel):
    """Extended client creation with interconnection support"""
    name: str
    slug: Optional[str] = None
    code: Optional[str] = None
    sector: Optional[str] = None
    nif: Optional[str] = None
    rccm: Optional[str] = None
    contact_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    country: Optional[str] = "Bénin"
    
    # Interconnection options
    create_auxiliary_account: bool = True
    create_rule: bool = False
    revenue_account: Optional[str] = None  # 701, 706, etc.
    vat_account: Optional[str] = "4457"
    vat_rate: Optional[float] = 18.0
    journal_code: Optional[str] = "VTE"
    ocr_keywords: Optional[List[str]] = None


@router.post("/", response_model=dict)
def create_client(
    *,
    db: Session = Depends(deps.get_db_session),
    client_in: ClientCreateExtended,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Create new client with optional auxiliary account and rule.
    
    Options d'interconnexion:
    - create_auxiliary_account: Crée automatiquement un compte 411XXX
    - create_rule: Crée une règle d'imputation pour les factures de vente
    
    Exemple:
    {
        "name": "Entreprise ABC",
        "code": "CLI01",
        "create_auxiliary_account": true,
        "create_rule": true,
        "revenue_account": "701",
        "ocr_keywords": ["ABC", "Entreprise ABC SA"]
    }
    """
    try:
        # Use interconnection service if advanced features requested
        if client_in.create_auxiliary_account or client_in.create_rule:
            service = TiersInterconnectionService(db, str(current_user.tenant_id))
            
            result = service.create_client_with_interconnection(
                name=client_in.name,
                code=client_in.code,
                slug=client_in.slug,
                sector=client_in.sector,
                nif=client_in.nif,
                rccm=client_in.rccm,
                contact_name=client_in.contact_name,
                email=client_in.email,
                phone=client_in.phone,
                address=client_in.address,
                create_auxiliary_account=client_in.create_auxiliary_account,
                create_rule=client_in.create_rule,
                revenue_account=client_in.revenue_account,
                vat_account=client_in.vat_account,
                vat_rate=client_in.vat_rate,
                journal_code=client_in.journal_code,
                ocr_keywords=client_in.ocr_keywords
            )
            
            db.commit()
            
            client = result["client"]
            return {
                "id": str(client.id),
                "name": client.name,
                "slug": client.slug,
                "code": client.code,
                "sector": client.sector,
                "auxiliary_account_code": client.auxiliary_account_code,
                "has_active_rule": client.has_active_rule,
                "auxiliary_account_created": result["auxiliary_account"] is not None,
                "rule_created": result["rule"] is not None,
                "message": "Client créé avec succès"
            }
        else:
            # Simple creation without interconnection
            client = Client(
                name=client_in.name,
                slug=client_in.slug or client_in.name.lower().replace(" ", "-"),
                code=client_in.code,
                sector=client_in.sector,
                tenant_id=current_user.tenant_id,
            )
            db.add(client)
            db.commit()
            db.refresh(client)
            
            return {
                "id": str(client.id),
                "name": client.name,
                "slug": client.slug,
                "code": client.code,
                "sector": client.sector,
                "message": "Client créé avec succès"
            }
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Erreur lors de la création du client: {str(e)}")

@router.get("/{client_id}", response_model=client_schema.Client)
def read_client(
    *,
    db: Session = Depends(deps.get_db_session),
    client_id: UUID,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get client by ID.
    """
    client = db.query(Client).filter(Client.id == client_id, Client.tenant_id == current_user.tenant_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return client

@router.put("/{client_id}", response_model=client_schema.Client)
def update_client(
    *,
    db: Session = Depends(deps.get_db_session),
    client_id: UUID,
    client_in: client_schema.ClientUpdate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Update a client.
    """
    client = db.query(Client).filter(Client.id == client_id, Client.tenant_id == current_user.tenant_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    update_data = client_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(client, field, value)
        
    db.add(client)
    db.commit()
    db.refresh(client)
    return client
