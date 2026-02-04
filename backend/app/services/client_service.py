"""
Client Service - Business logic for client management

Ce service gère:
- CRUD des clients
- Calcul des soldes et statistiques
- Interconnexion avec le plan comptable
"""

from datetime import date, timedelta
from typing import List, Optional, Dict, Any
from uuid import UUID
from decimal import Decimal

from sqlalchemy import func, case, and_
from sqlalchemy.orm import Session

from app.services.base import CRUDService
from app.models.client import Client
from app.models.sales_invoice import SalesInvoice
from app.schemas.client import ClientCreate, ClientUpdate


class ClientService(CRUDService[Client, ClientCreate, ClientUpdate]):
    """Service de gestion des clients."""

    model = Client

    def search(
        self,
        *,
        query: str,
        skip: int = 0,
        limit: int = 100,
    ) -> List[Client]:
        """Recherche des clients par nom, code ou compte auxiliaire."""
        self._validate_tenant()

        search_filter = f"%{query}%"

        return (
            self.db.query(Client)
            .filter(
                Client.tenant_id == UUID(self.tenant_id),
                (
                    Client.name.ilike(search_filter)
                    | Client.code.ilike(search_filter)
                    | Client.auxiliary_account_code.ilike(search_filter)
                ),
            )
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_balance_summary(
        self,
        *,
        search: Optional[str] = None,
        skip: int = 0,
        limit: int = 100,
        sort_by: str = "balance",
        sort_order: str = "desc",
    ) -> List[Dict[str, Any]]:
        """
        Calcule les soldes de tous les clients.

        Optimized: Single SQL query with aggregations.
        Replaces the N+1 pattern in the route handler.
        """
        self._validate_tenant()

        today = date.today()
        horizon = today + timedelta(days=30)
        tenant_uuid = UUID(self.tenant_id)

        # Subquery for invoice aggregations
        invoice_stats = (
            self.db.query(
                SalesInvoice.client_id,
                func.count(SalesInvoice.id).label("invoices_count"),
                func.coalesce(func.sum(SalesInvoice.balance_due), 0).label("total_due"),
                # Overdue amount
                func.coalesce(
                    func.sum(
                        case(
                            (
                                and_(
                                    SalesInvoice.due_date < today,
                                    SalesInvoice.payment_status.in_(["unpaid", "partial"]),
                                ),
                                SalesInvoice.balance_due,
                            ),
                            else_=0,
                        )
                    ),
                    0,
                ).label("overdue_amount"),
                # Upcoming 30 days
                func.coalesce(
                    func.sum(
                        case(
                            (
                                and_(
                                    SalesInvoice.due_date >= today,
                                    SalesInvoice.due_date <= horizon,
                                    SalesInvoice.payment_status.in_(["unpaid", "partial"]),
                                ),
                                SalesInvoice.balance_due,
                            ),
                            else_=0,
                        )
                    ),
                    0,
                ).label("upcoming_30d"),
                # Oldest overdue date
                func.min(
                    case(
                        (
                            and_(
                                SalesInvoice.due_date < today,
                                SalesInvoice.payment_status.in_(["unpaid", "partial"]),
                            ),
                            SalesInvoice.due_date,
                        ),
                        else_=None,
                    )
                ).label("oldest_overdue_date"),
                # Last invoice date
                func.max(SalesInvoice.issue_date).label("last_invoice_date"),
            )
            .filter(SalesInvoice.tenant_id == tenant_uuid)
            .group_by(SalesInvoice.client_id)
            .subquery()
        )

        # Main query with LEFT JOIN
        query = (
            self.db.query(
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
            )
            .outerjoin(invoice_stats, Client.id == invoice_stats.c.client_id)
            .filter(Client.tenant_id == tenant_uuid)
        )

        # Search filter
        if search:
            search_filter = f"%{search.strip()}%"
            query = query.filter(Client.name.ilike(search_filter))

        results = query.all()

        # Build response
        rows = [
            {
                "id": str(row.id),
                "client_name": row.name,
                "client_code": row.code or str(row.id)[:8],
                "balance": float(row.balance),
                "overdue_amount": float(row.overdue_amount),
                "upcoming_30d_amount": float(row.upcoming_30d_amount),
                "last_invoice_date": (
                    row.last_invoice_date.isoformat() if row.last_invoice_date else ""
                ),
                "last_invoice_number": "",  # Would need another subquery
                "payment_terms": "",
                "contact_email": row.email,
                "contact_phone": row.phone,
                "invoices_count": int(row.invoices_count),
                "oldest_overdue_date": (
                    row.oldest_overdue_date.isoformat()
                    if row.oldest_overdue_date
                    else None
                ),
            }
            for row in results
        ]

        # Sort
        sort_mapping = {
            "name": "client_name",
            "overdue": "overdue_amount",
            "balance": "balance",
            "client_name": "client_name",
            "overdue_amount": "overdue_amount",
            "upcoming_30d_amount": "upcoming_30d_amount",
        }
        sort_key = sort_mapping.get(sort_by, "balance")
        reverse = sort_order.lower() != "asc"

        rows.sort(key=lambda x: x.get(sort_key) or 0, reverse=reverse)

        return rows[skip : skip + limit]

    def get_balance_stats(self) -> Dict[str, Any]:
        """
        Calcule les statistiques globales des soldes clients.
        """
        self._validate_tenant()

        today = date.today()
        horizon = today + timedelta(days=30)
        tenant_uuid = UUID(self.tenant_id)

        # Get all client IDs for this tenant
        client_ids = [
            c[0]
            for c in self.db.query(Client.id)
            .filter(Client.tenant_id == tenant_uuid)
            .all()
        ]

        if not client_ids:
            return {
                "total_du": 0,
                "en_retard": 0,
                "a_payer_30j": 0,
                "clients_actifs": 0,
            }

        inv_base = self.db.query(SalesInvoice).filter(
            SalesInvoice.tenant_id == tenant_uuid,
            SalesInvoice.client_id.in_(client_ids),
        )

        total_du = float(
            inv_base.with_entities(
                func.coalesce(func.sum(SalesInvoice.balance_due), 0)
            ).scalar()
            or 0
        )

        en_retard = float(
            inv_base.filter(
                SalesInvoice.due_date < today,
                SalesInvoice.payment_status.in_(["unpaid", "partial"]),
            )
            .with_entities(func.coalesce(func.sum(SalesInvoice.balance_due), 0))
            .scalar()
            or 0
        )

        a_payer_30j = float(
            inv_base.filter(
                SalesInvoice.due_date >= today,
                SalesInvoice.due_date <= horizon,
                SalesInvoice.payment_status.in_(["unpaid", "partial"]),
            )
            .with_entities(func.coalesce(func.sum(SalesInvoice.balance_due), 0))
            .scalar()
            or 0
        )

        clients_actifs = (
            self.db.query(SalesInvoice.client_id)
            .filter(
                SalesInvoice.tenant_id == tenant_uuid,
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

    def get_with_rule_info(self, client_id: UUID) -> Optional[Dict[str, Any]]:
        """
        Récupère un client avec les informations de règle d'imputation.
        """
        client = self.get(client_id)
        if not client:
            return None

        return {
            "id": str(client.id),
            "name": client.name,
            "code": client.code,
            "auxiliary_account_code": client.auxiliary_account_code,
            "has_active_rule": client.has_active_rule,
            "default_revenue_account": client.default_revenue_account,
            "default_vat_account": client.default_vat_account,
            "default_tax_rate": float(client.default_tax_rate or 0),
            "default_journal": client.default_journal,
            "default_description": client.default_description,
            "ocr_keywords": client.ocr_keywords,
        }
