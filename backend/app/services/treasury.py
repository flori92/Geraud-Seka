"""Treasury Service for business logic."""
from typing import List, Dict, Optional
from uuid import UUID
from decimal import Decimal
from datetime import date, datetime, timedelta

from sqlalchemy.orm import Session

from app.crud import bank_account as ba_crud
from app.crud import bank_transaction as bt_crud
from app.crud import payment_schedule as ps_crud
from app.models.treasury import TreasuryAlert
from app.schemas.treasury import (
    TreasuryDashboardResponse,
    TreasuryKPIs,
    CashFlowSummary,
    TreasuryAlert as TreasuryAlertSchema,
)


class TreasuryService:
    """Service for treasury management operations."""

    def __init__(self, db: Session):
        self.db = db

    def get_dashboard_data(self, tenant_id: UUID) -> TreasuryDashboardResponse:
        """Get complete dashboard data for treasury."""
        accounts = ba_crud.get_multi(self.db, tenant_id=tenant_id, is_active=True)

        total_balance = ba_crud.get_total_balance(self.db, tenant_id=tenant_id)

        total_balance_by_currency = {}
        for account in accounts:
            currency = account.currency
            if currency not in total_balance_by_currency:
                total_balance_by_currency[currency] = Decimal("0.00")
            total_balance_by_currency[currency] += account.balance

        recent_transactions = bt_crud.get_recent(self.db, tenant_id=tenant_id, limit=10)

        upcoming_payments = ps_crud.get_upcoming(self.db, tenant_id=tenant_id, days_ahead=30)

        cash_runway_days = self.calculate_cash_runway(tenant_id)

        alerts = self._get_active_alerts(tenant_id)

        today = date.today()
        month_start = date(today.year, today.month, 1)
        cash_flow_summary = self.get_cash_flow_summary(
            tenant_id=tenant_id,
            start_date=month_start,
            end_date=today
        )

        return TreasuryDashboardResponse(
            total_balance=total_balance,
            total_balance_by_currency=total_balance_by_currency,
            accounts_summary=accounts,
            recent_transactions=recent_transactions,
            upcoming_payments=upcoming_payments,
            cash_runway_days=cash_runway_days,
            alerts=alerts,
            cash_flow_summary=cash_flow_summary,
        )

    def get_total_balance(self, tenant_id: UUID, currency: str = "XOF") -> Decimal:
        """Get total balance across all active accounts."""
        return ba_crud.get_total_balance(self.db, tenant_id=tenant_id, currency=currency)

    def get_balance_history(
        self,
        tenant_id: UUID,
        bank_account_id: Optional[UUID] = None,
        months: int = 12,
    ) -> List[Dict]:
        """Get balance history for the last N months."""
        end_date = date.today()
        start_date = end_date - timedelta(days=months * 30)

        transactions = bt_crud.get_by_date_range(
            self.db,
            tenant_id=tenant_id,
            start_date=start_date,
            end_date=end_date,
            bank_account_id=bank_account_id,
        )

        history = []
        current_date = start_date
        
        while current_date <= end_date:
            month_end = date(current_date.year, current_date.month, 1) + timedelta(days=32)
            month_end = date(month_end.year, month_end.month, 1) - timedelta(days=1)

            month_transactions = [
                t for t in transactions
                if t.transaction_date <= month_end and t.status == "cleared"
            ]

            if month_transactions:
                balance = month_transactions[-1].balance_after
            else:
                balance = Decimal("0.00")

            history.append({
                "date": month_end.isoformat(),
                "balance": float(balance),
            })

            current_date = month_end + timedelta(days=1)

        return history

    def get_cash_flow_summary(
        self,
        tenant_id: UUID,
        start_date: date,
        end_date: date,
        bank_account_id: Optional[UUID] = None,
    ) -> CashFlowSummary:
        """Get cash flow summary for a period."""
        if bank_account_id:
            account = ba_crud.get(self.db, bank_account_id)
            opening_balance = account.initial_balance if account else Decimal("0.00")
        else:
            opening_balance = ba_crud.get_total_balance(self.db, tenant_id=tenant_id)

        transactions = bt_crud.get_by_date_range(
            self.db,
            tenant_id=tenant_id,
            start_date=start_date,
            end_date=end_date,
            bank_account_id=bank_account_id,
        )

        total_income = sum(
            t.amount for t in transactions
            if t.amount > 0 and t.status == "cleared"
        )
        total_expenses = sum(
            abs(t.amount) for t in transactions
            if t.amount < 0 and t.status == "cleared"
        )

        net_cash_flow = total_income - total_expenses
        closing_balance = opening_balance + net_cash_flow

        return CashFlowSummary(
            period_start=start_date,
            period_end=end_date,
            opening_balance=opening_balance,
            total_income=Decimal(str(total_income)),
            total_expenses=Decimal(str(total_expenses)),
            net_cash_flow=net_cash_flow,
            closing_balance=closing_balance,
        )

    def calculate_cash_runway(self, tenant_id: UUID) -> int:
        """Calculate days of cash runway available."""
        total_balance = ba_crud.get_total_balance(self.db, tenant_id=tenant_id)

        if total_balance <= 0:
            return 0

        end_date = date.today()
        start_date = end_date - timedelta(days=30)

        transactions = bt_crud.get_by_date_range(
            self.db,
            tenant_id=tenant_id,
            start_date=start_date,
            end_date=end_date,
        )

        total_expenses = sum(
            abs(t.amount) for t in transactions
            if t.amount < 0 and t.status == "cleared"
        )

        if total_expenses == 0:
            return 999  # No expenses, runway is indefinite

        avg_daily_expense = total_expenses / 30

        runway_days = int(total_balance / avg_daily_expense)

        return runway_days

    def generate_alerts(self, tenant_id: UUID) -> List[TreasuryAlert]:
        """Generate treasury alerts based on current state."""
        alerts = []

        accounts = ba_crud.get_multi(self.db, tenant_id=tenant_id, is_active=True)
        for account in accounts:
            threshold = account.overdraft_limit or Decimal("100000")  # Default 100k XOF
            if account.balance < threshold:
                alert = TreasuryAlert(
                    tenant_id=tenant_id,
                    alert_type="low_balance",
                    severity="warning" if account.balance > 0 else "critical",
                    title=f"Solde faible sur {account.name}",
                    message=f"Le solde du compte {account.name} est de {account.balance} {account.currency}, "
                            f"inférieur au seuil de {threshold} {account.currency}.",
                    related_entity_type="bank_account",
                    related_entity_id=account.id,
                )
                self.db.add(alert)
                alerts.append(alert)

        overdue_schedules = ps_crud.get_overdue(self.db, tenant_id=tenant_id)
        if overdue_schedules:
            total_overdue = sum(s.remaining_amount for s in overdue_schedules)
            alert = TreasuryAlert(
                tenant_id=tenant_id,
                alert_type="overdue_payment",
                severity="warning",
                title=f"{len(overdue_schedules)} paiement(s) en retard",
                message=f"Vous avez {len(overdue_schedules)} paiement(s) en retard pour un total de {total_overdue} XOF.",
            )
            self.db.add(alert)
            alerts.append(alert)

        runway_days = self.calculate_cash_runway(tenant_id)
        if runway_days < 30:
            severity = "critical" if runway_days < 7 else "warning"
            alert = TreasuryAlert(
                tenant_id=tenant_id,
                alert_type="low_cash_runway",
                severity=severity,
                title=f"Trésorerie critique: {runway_days} jours restants",
                message=f"Votre trésorerie actuelle ne couvre que {runway_days} jours de dépenses. "
                        f"Envisagez de réduire les dépenses ou de chercher un financement.",
            )
            self.db.add(alert)
            alerts.append(alert)

        self.db.commit()
        return alerts

    def _get_active_alerts(self, tenant_id: UUID) -> List[TreasuryAlertSchema]:
        """Get active (unresolved) alerts."""
        alerts = self.db.query(TreasuryAlert).filter(
            TreasuryAlert.tenant_id == tenant_id,
            TreasuryAlert.is_resolved == False
        ).order_by(TreasuryAlert.created_at.desc()).limit(10).all()

        return [TreasuryAlertSchema.model_validate(alert) for alert in alerts]

    def get_kpis(self, tenant_id: UUID) -> TreasuryKPIs:
        """Get key performance indicators for treasury."""
        total_balance = ba_crud.get_total_balance(self.db, tenant_id=tenant_id)

        today = date.today()
        month_start = date(today.year, today.month, 1)
        
        summary = self.get_cash_flow_summary(
            tenant_id=tenant_id,
            start_date=month_start,
            end_date=today
        )

        cash_runway_days = self.calculate_cash_runway(tenant_id)

        accounts_count = len(ba_crud.get_multi(self.db, tenant_id=tenant_id, is_active=True))
        pending_payments_count = ps_crud.get_count(
            self.db,
            tenant_id=tenant_id,
            status="pending"
        )
        overdue_payments_count = ps_crud.get_count(
            self.db,
            tenant_id=tenant_id,
            status="overdue"
        )
        alerts_count = self.db.query(TreasuryAlert).filter(
            TreasuryAlert.tenant_id == tenant_id,
            TreasuryAlert.is_resolved == False
        ).count()

        return TreasuryKPIs(
            total_balance=total_balance,
            monthly_income=summary.total_income,
            monthly_expenses=summary.total_expenses,
            net_cash_flow=summary.net_cash_flow,
            cash_runway_days=cash_runway_days,
            accounts_count=accounts_count,
            pending_payments_count=pending_payments_count,
            overdue_payments_count=overdue_payments_count,
            alerts_count=alerts_count,
        )


treasury_service = TreasuryService
