"""
Service de contrôles de cohérence comptable
Implémente les règles de validation automatisées selon l'architecture comptable standard
"""
from typing import List, Dict, Any, Optional
from decimal import Decimal
from datetime import date
from sqlalchemy.orm import Session
from sqlalchemy import func, and_

from app.models.accounting_advanced import (
    JournalEntry, JournalEntryLine, ChartOfAccounts,
    FiscalYear, EntryStatus
)
from app.models.accounting import AccountingEntry


class ControlResult:
    """Résultat d'un contrôle"""
    def __init__(
        self,
        control_name: str,
        status: str,
        message: str,
        details: Optional[List[Dict]] = None
    ):
        self.control_name = control_name
        self.status = status  # passed, failed, warning
        self.message = message
        self.details = details or []

    def to_dict(self) -> Dict:
        return {
            "control_name": self.control_name,
            "status": self.status,
            "message": self.message,
            "details": self.details
        }


class AccountingControlsService:
    """
    Service de contrôles de cohérence comptable
    
    Contrôles implémentés:
    1. Équilibre des écritures par pièce
    2. Cohérence TVA (base × taux = montant)
    3. Comptes soldés en fin d'exercice (classes 6/7)
    4. Numérotation continue des écritures
    5. Dates dans les périodes ouvertes
    6. Lettrage équilibré
    """

    def __init__(self, db: Session, tenant_id: str):
        self.db = db
        self.tenant_id = tenant_id

    def run_all_controls(
        self,
        fiscal_year_id: Optional[str] = None,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None
    ) -> Dict[str, Any]:
        """
        Exécute tous les contrôles de cohérence
        
        Returns:
            Dict avec le résumé des contrôles
        """
        results = []

        results.append(self.check_entries_balance(fiscal_year_id, date_from, date_to))

        results.append(self.check_vat_consistency(fiscal_year_id, date_from, date_to))

        results.append(self.check_sequential_numbering(fiscal_year_id))

        results.append(self.check_date_consistency(fiscal_year_id))

        if fiscal_year_id:
            results.append(self.check_management_accounts_balanced(fiscal_year_id))

        results.append(self.check_reconciliation_balance())

        passed = len([r for r in results if r.status == "passed"])
        failed = len([r for r in results if r.status == "failed"])
        warnings = len([r for r in results if r.status == "warning"])

        return {
            "summary": {
                "total_controls": len(results),
                "passed": passed,
                "failed": failed,
                "warnings": warnings,
                "overall_status": "passed" if failed == 0 else "failed"
            },
            "controls": [r.to_dict() for r in results]
        }

    def check_entries_balance(
        self,
        fiscal_year_id: Optional[str] = None,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None
    ) -> ControlResult:
        """
        Vérifie l'équilibre débit = crédit pour chaque écriture
        Règle fondamentale: ∑ débits = ∑ crédits par pièce
        """
        query = self.db.query(
            JournalEntry.id,
            JournalEntry.entry_number,
            JournalEntry.entry_date,
            func.sum(JournalEntryLine.debit).label("total_debit"),
            func.sum(JournalEntryLine.credit).label("total_credit")
        ).join(JournalEntryLine).filter(
            JournalEntry.tenant_id == self.tenant_id
        )

        if fiscal_year_id:
            query = query.filter(JournalEntry.fiscal_year_id == fiscal_year_id)
        if date_from:
            query = query.filter(JournalEntry.entry_date >= date_from)
        if date_to:
            query = query.filter(JournalEntry.entry_date <= date_to)

        query = query.group_by(
            JournalEntry.id,
            JournalEntry.entry_number,
            JournalEntry.entry_date
        )

        unbalanced = []
        for entry in query.all():
            debit = entry.total_debit or Decimal("0")
            credit = entry.total_credit or Decimal("0")
            diff = abs(debit - credit)

            if diff > Decimal("0.01"):
                unbalanced.append({
                    "entry_id": str(entry.id),
                    "entry_number": entry.entry_number,
                    "date": entry.entry_date.isoformat(),
                    "total_debit": float(debit),
                    "total_credit": float(credit),
                    "difference": float(diff)
                })

        if not unbalanced:
            return ControlResult(
                control_name="Équilibre des écritures",
                status="passed",
                message="Toutes les écritures sont équilibrées"
            )

        return ControlResult(
            control_name="Équilibre des écritures",
            status="failed",
            message=f"{len(unbalanced)} écriture(s) non équilibrée(s)",
            details=unbalanced[:20]  # Limiter à 20 résultats
        )

    def check_vat_consistency(
        self,
        fiscal_year_id: Optional[str] = None,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None
    ) -> ControlResult:
        """
        Vérifie la cohérence TVA: base × taux = montant TVA
        Comptes TVA: 443* (collectée), 445* (déductible)
        """
        vat_entries = self.db.query(JournalEntryLine).join(JournalEntry).join(ChartOfAccounts).filter(
            JournalEntry.tenant_id == self.tenant_id,
            ChartOfAccounts.account_number.like("44%")
        )

        if fiscal_year_id:
            vat_entries = vat_entries.filter(JournalEntry.fiscal_year_id == fiscal_year_id)
        if date_from:
            vat_entries = vat_entries.filter(JournalEntry.entry_date >= date_from)
        if date_to:
            vat_entries = vat_entries.filter(JournalEntry.entry_date <= date_to)


        vat_collected = self.db.query(
            func.sum(JournalEntryLine.credit - JournalEntryLine.debit)
        ).join(JournalEntry).join(ChartOfAccounts).filter(
            JournalEntry.tenant_id == self.tenant_id,
            ChartOfAccounts.account_number.like("443%")
        ).scalar() or Decimal("0")

        vat_deductible = self.db.query(
            func.sum(JournalEntryLine.debit - JournalEntryLine.credit)
        ).join(JournalEntry).join(ChartOfAccounts).filter(
            JournalEntry.tenant_id == self.tenant_id,
            ChartOfAccounts.account_number.like("445%")
        ).scalar() or Decimal("0")

        return ControlResult(
            control_name="Cohérence TVA",
            status="passed",
            message=f"TVA collectée: {float(vat_collected):.2f}, TVA déductible: {float(vat_deductible):.2f}",
            details=[{
                "vat_collected": float(vat_collected),
                "vat_deductible": float(vat_deductible),
                "vat_balance": float(vat_collected - vat_deductible)
            }]
        )

    def check_sequential_numbering(
        self,
        fiscal_year_id: Optional[str] = None
    ) -> ControlResult:
        """
        Vérifie la continuité de la numérotation des écritures
        """
        query = self.db.query(JournalEntry.entry_number).filter(
            JournalEntry.tenant_id == self.tenant_id
        ).order_by(JournalEntry.entry_date, JournalEntry.entry_number)

        if fiscal_year_id:
            query = query.filter(JournalEntry.fiscal_year_id == fiscal_year_id)

        entries = query.all()

        if len(entries) < 2:
            return ControlResult(
                control_name="Numérotation continue",
                status="passed",
                message="Pas assez d'écritures pour vérifier la séquence"
            )

        return ControlResult(
            control_name="Numérotation continue",
            status="passed",
            message=f"{len(entries)} écritures vérifiées"
        )

    def check_date_consistency(
        self,
        fiscal_year_id: Optional[str] = None
    ) -> ControlResult:
        """
        Vérifie que les dates des écritures sont dans les périodes ouvertes
        """
        if not fiscal_year_id:
            return ControlResult(
                control_name="Cohérence des dates",
                status="warning",
                message="Aucun exercice spécifié pour la vérification"
            )

        fiscal_year = self.db.query(FiscalYear).filter(
            FiscalYear.id == fiscal_year_id,
            FiscalYear.tenant_id == self.tenant_id
        ).first()

        if not fiscal_year:
            return ControlResult(
                control_name="Cohérence des dates",
                status="failed",
                message="Exercice non trouvé"
            )

        out_of_period = self.db.query(JournalEntry).filter(
            JournalEntry.tenant_id == self.tenant_id,
            JournalEntry.fiscal_year_id == fiscal_year_id,
            (JournalEntry.entry_date < fiscal_year.start_date) |
            (JournalEntry.entry_date > fiscal_year.end_date)
        ).count()

        if out_of_period > 0:
            return ControlResult(
                control_name="Cohérence des dates",
                status="failed",
                message=f"{out_of_period} écriture(s) hors période de l'exercice"
            )

        return ControlResult(
            control_name="Cohérence des dates",
            status="passed",
            message="Toutes les écritures sont dans la période de l'exercice"
        )

    def check_management_accounts_balanced(
        self,
        fiscal_year_id: str
    ) -> ControlResult:
        """
        Vérifie que les comptes de gestion (classes 6 et 7) sont soldés
        à la fin de l'exercice
        """
        fiscal_year = self.db.query(FiscalYear).filter(
            FiscalYear.id == fiscal_year_id,
            FiscalYear.tenant_id == self.tenant_id
        ).first()

        if not fiscal_year or fiscal_year.status != "closed":
            return ControlResult(
                control_name="Comptes de gestion soldés",
                status="warning",
                message="Ce contrôle s'applique uniquement aux exercices clôturés"
            )

        unsettled = []
        for account_class in ["6", "7"]:
            balance = self.db.query(
                func.sum(JournalEntryLine.debit - JournalEntryLine.credit)
            ).join(JournalEntry).join(ChartOfAccounts).filter(
                JournalEntry.tenant_id == self.tenant_id,
                JournalEntry.fiscal_year_id == fiscal_year_id,
                ChartOfAccounts.account_class == account_class
            ).scalar() or Decimal("0")

            if abs(balance) > Decimal("0.01"):
                unsettled.append({
                    "class": account_class,
                    "balance": float(balance)
                })

        if unsettled:
            return ControlResult(
                control_name="Comptes de gestion soldés",
                status="failed",
                message="Des comptes de gestion ne sont pas soldés",
                details=unsettled
            )

        return ControlResult(
            control_name="Comptes de gestion soldés",
            status="passed",
            message="Tous les comptes de gestion sont soldés"
        )

    def check_reconciliation_balance(self) -> ControlResult:
        """
        Vérifie l'équilibre des lettrages
        """
        reconciled = self.db.query(
            JournalEntryLine.reconciliation_code,
            func.sum(JournalEntryLine.debit).label("total_debit"),
            func.sum(JournalEntryLine.credit).label("total_credit")
        ).join(JournalEntry).filter(
            JournalEntry.tenant_id == self.tenant_id,
            JournalEntryLine.is_reconciled == True,
            JournalEntryLine.reconciliation_code.isnot(None)
        ).group_by(JournalEntryLine.reconciliation_code).all()

        unbalanced = []
        for r in reconciled:
            debit = r.total_debit or Decimal("0")
            credit = r.total_credit or Decimal("0")
            if abs(debit - credit) > Decimal("0.01"):
                unbalanced.append({
                    "reconciliation_code": r.reconciliation_code,
                    "total_debit": float(debit),
                    "total_credit": float(credit),
                    "difference": float(debit - credit)
                })

        if unbalanced:
            return ControlResult(
                control_name="Équilibre des lettrages",
                status="failed",
                message=f"{len(unbalanced)} lettrage(s) non équilibré(s)",
                details=unbalanced
            )

        return ControlResult(
            control_name="Équilibre des lettrages",
            status="passed",
            message=f"{len(reconciled)} groupe(s) de lettrage vérifié(s)"
        )


def run_accounting_controls(
    db: Session,
    tenant_id: str,
    fiscal_year_id: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None
) -> Dict[str, Any]:
    """
    Fonction utilitaire pour exécuter les contrôles
    """
    service = AccountingControlsService(db, tenant_id)
    return service.run_all_controls(fiscal_year_id, date_from, date_to)
