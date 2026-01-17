from typing import List, Any, Optional
from uuid import UUID
from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core import deps
from app.models.client import Client
from app.models.user import User
from app.models.sales_invoice import SalesInvoice
from app.schemas import client as client_schema
from app.services.tiers_interconnection import TiersInterconnectionService
from pydantic import BaseModel

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
    MVP: calculs basés sur les factures de vente (sales_invoices).
    """
    try:
        today = date.today()
        horizon = today + timedelta(days=30)

        requested_sort = (sort_by or "balance").strip()
        sort_key = requested_sort
        if requested_sort == "name":
            sort_key = "client_name"
        elif requested_sort == "overdue":
            sort_key = "overdue_amount"

        allowed_sort_keys = {
            "balance",
            "client_name",
            "overdue_amount",
            "upcoming_30d_amount",
        }
        if sort_key not in allowed_sort_keys:
            sort_key = "balance"

        order = (sort_order or "desc").strip().lower()
        reverse = order != "asc"

        clients = db.query(Client).filter(Client.tenant_id == current_user.tenant_id).all()

        rows: list[dict] = []
        for client in clients:
            if search and search.strip():
                q = search.strip().lower()
                if q not in (client.name or "").lower():
                    continue

            inv_query = db.query(SalesInvoice).filter(
                SalesInvoice.tenant_id == current_user.tenant_id,
                SalesInvoice.client_id == client.id,
            )

            invoices_count = inv_query.count()
            total_due = float(inv_query.with_entities(func.coalesce(func.sum(SalesInvoice.balance_due), 0)).scalar() or 0)

            overdue_amount = float(
                inv_query.filter(
                    SalesInvoice.due_date < today,
                    SalesInvoice.payment_status.in_(["unpaid", "partial"])
                ).with_entities(func.coalesce(func.sum(SalesInvoice.balance_due), 0)).scalar() or 0
            )

            upcoming_30d_amount = float(
                inv_query.filter(
                    SalesInvoice.due_date >= today,
                    SalesInvoice.due_date <= horizon,
                    SalesInvoice.payment_status.in_(["unpaid", "partial"])
                ).with_entities(func.coalesce(func.sum(SalesInvoice.balance_due), 0)).scalar() or 0
            )

            oldest_overdue = (
                inv_query.filter(
                    SalesInvoice.due_date < today,
                    SalesInvoice.payment_status.in_(["unpaid", "partial"])
                )
                .order_by(SalesInvoice.due_date.asc())
                .with_entities(SalesInvoice.due_date)
                .first()
            )

            last_inv = (
                inv_query.order_by(SalesInvoice.issue_date.desc())
                .with_entities(
                    SalesInvoice.issue_date,
                    SalesInvoice.invoice_number,
                )
                .first()
            )

            last_invoice_date = last_inv.issue_date.isoformat() if last_inv and last_inv.issue_date else ""
            last_invoice_number = last_inv.invoice_number if last_inv and last_inv.invoice_number else ""
            payment_terms = ""

            client_code = str(client.id)[:8]

            rows.append(
                {
                    "id": str(client.id),
                    "client_name": client.name,
                    "client_code": client_code,
                    "balance": total_due,
                    "overdue_amount": overdue_amount,
                    "upcoming_30d_amount": upcoming_30d_amount,
                    "last_invoice_date": last_invoice_date,
                    "last_invoice_number": last_invoice_number,
                    "payment_terms": payment_terms,
                    "contact_email": None,
                    "contact_phone": None,
                    "invoices_count": invoices_count,
                    "oldest_overdue_date": oldest_overdue.due_date.isoformat() if oldest_overdue and oldest_overdue.due_date else None,
                }
            )

        rows.sort(key=lambda x: x.get(sort_key) or 0, reverse=reverse)
        return rows[skip : skip + limit]

    except Exception as e:
        print(f"Error getting client balances: {e}")
        import traceback
        traceback.print_exc()
        return []


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
        print(f"Error getting client balance stats: {e}")
        import traceback
        traceback.print_exc()
        return {
            "total_du": 0,
            "en_retard": 0,
            "a_payer_30j": 0,
            "clients_actifs": 0,
        }


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
