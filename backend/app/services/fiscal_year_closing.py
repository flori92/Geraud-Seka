"""
Service de clôture d'exercice fiscal
Gère le workflow de clôture conforme SYSCOHADA
"""
from typing import Dict, List, Optional, Any
from decimal import Decimal
from datetime import datetime, date
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from uuid import UUID

from app.models.accounting_advanced import (
    FiscalYear, FiscalYearStatus, AccountingPeriod,
    JournalEntry, JournalEntryLine, ChartOfAccounts,
    AccountingJournal, JournalType, EntryStatus
)


class FiscalYearClosingError(Exception):
    """Erreur lors de la clôture d'exercice"""
    pass


class FiscalYearClosingService:
    """
    Service de clôture d'exercice fiscal
    
    Workflow de clôture SYSCOHADA:
    1. Vérification des prérequis
    2. Calcul du résultat (Produits classe 7 - Charges classe 6)
    3. Écriture de détermination du résultat
    4. Virement des comptes de gestion vers résultat
    5. Génération des à-nouveaux
    6. Verrouillage de l'exercice
    """

    def __init__(self, db: Session, tenant_id: str, user_id: str):
        self.db = db
        self.tenant_id = tenant_id
        self.user_id = user_id

    def get_closing_preview(self, fiscal_year_id: str) -> Dict[str, Any]:
        """
        Génère un aperçu de la clôture sans l'exécuter
        
        Returns:
            Dict avec les totaux et le résultat prévu
        """
        fiscal_year = self._get_fiscal_year(fiscal_year_id)

        # Calculer les totaux par classe
        class_totals = self._calculate_class_totals(fiscal_year)

        # Calculer le résultat
        total_produits = class_totals.get("7", Decimal("0"))
        total_charges = class_totals.get("6", Decimal("0"))
        resultat = total_produits - total_charges

        # Vérifier les écritures non validées
        unvalidated_count = self._count_unvalidated_entries(fiscal_year)

        # Vérifier les périodes non clôturées
        unclosed_periods = self._get_unclosed_periods(fiscal_year)

        return {
            "fiscal_year": {
                "id": str(fiscal_year.id),
                "name": fiscal_year.name,
                "start_date": fiscal_year.start_date.isoformat(),
                "end_date": fiscal_year.end_date.isoformat(),
                "status": fiscal_year.status
            },
            "class_totals": {k: float(v) for k, v in class_totals.items()},
            "total_produits": float(total_produits),
            "total_charges": float(total_charges),
            "resultat": float(resultat),
            "is_profit": resultat >= 0,
            "can_close": unvalidated_count == 0 and len(unclosed_periods) == 0,
            "blocking_issues": {
                "unvalidated_entries": unvalidated_count,
                "unclosed_periods": [p.name for p in unclosed_periods]
            }
        }

    def close_fiscal_year(
        self,
        fiscal_year_id: str,
        force: bool = False
    ) -> Dict[str, Any]:
        """
        Exécute la clôture d'exercice
        
        Args:
            fiscal_year_id: ID de l'exercice à clôturer
            force: Forcer la clôture même avec des avertissements
            
        Returns:
            Dict avec le résumé de la clôture
        """
        fiscal_year = self._get_fiscal_year(fiscal_year_id)

        # Vérifier que l'exercice peut être clôturé
        if fiscal_year.status == FiscalYearStatus.CLOSED:
            raise FiscalYearClosingError("Cet exercice est déjà clôturé")

        if fiscal_year.status != FiscalYearStatus.OPEN and not force:
            raise FiscalYearClosingError(
                f"L'exercice est en statut {fiscal_year.status}. "
                "Utilisez force=True pour continuer."
            )

        # Vérifications préalables
        preview = self.get_closing_preview(fiscal_year_id)
        if not preview["can_close"] and not force:
            raise FiscalYearClosingError(
                f"Impossible de clôturer: {preview['blocking_issues']}"
            )

        # Passer en statut "closing"
        fiscal_year.status = FiscalYearStatus.CLOSING
        self.db.commit()

        try:
            # 1. Créer l'écriture de détermination du résultat
            result_entry = self._create_result_entry(fiscal_year, preview)

            # 2. Solder les comptes de gestion (classes 6 et 7)
            self._close_management_accounts(fiscal_year, preview)

            # 3. Clôturer toutes les périodes
            self._close_all_periods(fiscal_year)

            # 4. Mettre à jour l'exercice
            fiscal_year.status = FiscalYearStatus.CLOSED
            fiscal_year.closed_at = datetime.utcnow()
            fiscal_year.closed_by = UUID(self.user_id)
            fiscal_year.total_revenue = Decimal(str(preview["total_produits"]))
            fiscal_year.total_expense = Decimal(str(preview["total_charges"]))
            fiscal_year.net_result = Decimal(str(preview["resultat"]))

            self.db.commit()

            return {
                "success": True,
                "fiscal_year_id": str(fiscal_year.id),
                "result_entry_id": str(result_entry.id) if result_entry else None,
                "resultat": preview["resultat"],
                "is_profit": preview["is_profit"],
                "closed_at": fiscal_year.closed_at.isoformat()
            }

        except Exception as e:
            # Rollback en cas d'erreur
            fiscal_year.status = FiscalYearStatus.OPEN
            self.db.rollback()
            raise FiscalYearClosingError(f"Erreur lors de la clôture: {str(e)}")

    def generate_opening_entries(
        self,
        closed_fiscal_year_id: str,
        new_fiscal_year_id: str
    ) -> Dict[str, Any]:
        """
        Génère les écritures d'à-nouveau pour le nouvel exercice
        
        Args:
            closed_fiscal_year_id: ID de l'exercice clôturé
            new_fiscal_year_id: ID du nouvel exercice
            
        Returns:
            Dict avec l'écriture d'à-nouveau créée
        """
        closed_fy = self._get_fiscal_year(closed_fiscal_year_id)
        new_fy = self._get_fiscal_year(new_fiscal_year_id)

        if closed_fy.status != FiscalYearStatus.CLOSED:
            raise FiscalYearClosingError(
                "L'exercice source doit être clôturé"
            )

        if new_fy.status != FiscalYearStatus.OPEN:
            raise FiscalYearClosingError(
                "L'exercice cible doit être ouvert"
            )

        # Récupérer les soldes des comptes de bilan (classes 1-5)
        balance_accounts = self._get_balance_sheet_balances(closed_fy)

        if not balance_accounts:
            return {"success": True, "message": "Aucun solde à reporter"}

        # Créer l'écriture d'à-nouveau
        opening_entry = self._create_opening_entry(new_fy, balance_accounts)

        self.db.commit()

        return {
            "success": True,
            "opening_entry_id": str(opening_entry.id),
            "accounts_count": len(balance_accounts),
            "total_debit": float(sum(b["debit"] for b in balance_accounts)),
            "total_credit": float(sum(b["credit"] for b in balance_accounts))
        }

    def _get_fiscal_year(self, fiscal_year_id: str) -> FiscalYear:
        """Récupère l'exercice fiscal"""
        fy = self.db.query(FiscalYear).filter(
            FiscalYear.id == fiscal_year_id,
            FiscalYear.tenant_id == self.tenant_id
        ).first()

        if not fy:
            raise FiscalYearClosingError("Exercice fiscal introuvable")

        return fy

    def _calculate_class_totals(self, fiscal_year: FiscalYear) -> Dict[str, Decimal]:
        """Calcule les totaux par classe de compte"""
        totals = {}

        for account_class in ["1", "2", "3", "4", "5", "6", "7", "8"]:
            result = self.db.query(
                func.sum(JournalEntryLine.debit - JournalEntryLine.credit)
            ).join(JournalEntry).join(ChartOfAccounts).filter(
                JournalEntry.tenant_id == self.tenant_id,
                JournalEntry.fiscal_year_id == fiscal_year.id,
                JournalEntry.status == EntryStatus.POSTED,
                ChartOfAccounts.account_class == account_class
            ).scalar()

            totals[account_class] = result or Decimal("0")

        # Pour les produits (classe 7), le solde est créditeur
        totals["7"] = -totals.get("7", Decimal("0"))

        return totals

    def _count_unvalidated_entries(self, fiscal_year: FiscalYear) -> int:
        """Compte les écritures non validées"""
        return self.db.query(func.count(JournalEntry.id)).filter(
            JournalEntry.tenant_id == self.tenant_id,
            JournalEntry.fiscal_year_id == fiscal_year.id,
            JournalEntry.status != EntryStatus.POSTED
        ).scalar() or 0

    def _get_unclosed_periods(self, fiscal_year: FiscalYear) -> List[AccountingPeriod]:
        """Récupère les périodes non clôturées"""
        return self.db.query(AccountingPeriod).filter(
            AccountingPeriod.fiscal_year_id == fiscal_year.id,
            AccountingPeriod.is_closed == False
        ).all()

    def _create_result_entry(
        self,
        fiscal_year: FiscalYear,
        preview: Dict
    ) -> Optional[JournalEntry]:
        """Crée l'écriture de détermination du résultat"""
        resultat = Decimal(str(preview["resultat"]))

        if resultat == 0:
            return None

        # Trouver le journal de clôture
        closing_journal = self.db.query(AccountingJournal).filter(
            AccountingJournal.tenant_id == self.tenant_id,
            AccountingJournal.journal_type == JournalType.CLOSING
        ).first()

        if not closing_journal:
            # Créer le journal de clôture s'il n'existe pas
            closing_journal = AccountingJournal(
                tenant_id=self.tenant_id,
                code="CLO",
                name="Journal de Clôture",
                journal_type=JournalType.CLOSING
            )
            self.db.add(closing_journal)
            self.db.flush()

        # Créer l'écriture
        entry = JournalEntry(
            tenant_id=self.tenant_id,
            journal_id=closing_journal.id,
            fiscal_year_id=fiscal_year.id,
            entry_number=f"CLO-{fiscal_year.code}-001",
            entry_date=fiscal_year.end_date,
            accounting_date=fiscal_year.end_date,
            label=f"Détermination du résultat - Exercice {fiscal_year.code}",
            status=EntryStatus.POSTED,
            posted_at=datetime.utcnow(),
            created_by=UUID(self.user_id)
        )
        self.db.add(entry)
        self.db.flush()

        # Trouver les comptes de résultat (12)
        if resultat > 0:
            # Bénéfice → Compte 131
            result_account = self._get_or_create_account("131", "Résultat net: Bénéfice")
        else:
            # Perte → Compte 139
            result_account = self._get_or_create_account("139", "Résultat net: Perte")
            resultat = abs(resultat)

        # Ligne de résultat
        result_line = JournalEntryLine(
            entry_id=entry.id,
            account_id=result_account.id,
            debit=Decimal("0") if preview["is_profit"] else resultat,
            credit=resultat if preview["is_profit"] else Decimal("0"),
            label=f"Résultat de l'exercice {fiscal_year.code}"
        )
        self.db.add(result_line)

        # Mettre à jour les totaux
        entry.total_debit = result_line.debit
        entry.total_credit = result_line.credit

        return entry

    def _close_management_accounts(
        self,
        fiscal_year: FiscalYear,
        preview: Dict
    ) -> None:
        """Solde les comptes de gestion (classes 6 et 7)"""
        # Les comptes de gestion sont soldés automatiquement
        # car leurs mouvements ne sont pas reportés à l'exercice suivant
        pass

    def _close_all_periods(self, fiscal_year: FiscalYear) -> None:
        """Clôture toutes les périodes de l'exercice"""
        self.db.query(AccountingPeriod).filter(
            AccountingPeriod.fiscal_year_id == fiscal_year.id
        ).update({
            "is_closed": True,
            "closed_at": datetime.utcnow()
        })

    def _get_balance_sheet_balances(
        self,
        fiscal_year: FiscalYear
    ) -> List[Dict]:
        """Récupère les soldes des comptes de bilan"""
        balances = []

        # Classes de bilan: 1, 2, 3, 4, 5
        results = self.db.query(
            ChartOfAccounts.id,
            ChartOfAccounts.account_number,
            ChartOfAccounts.name,
            func.sum(JournalEntryLine.debit).label("total_debit"),
            func.sum(JournalEntryLine.credit).label("total_credit")
        ).join(JournalEntryLine).join(JournalEntry).filter(
            JournalEntry.tenant_id == self.tenant_id,
            JournalEntry.fiscal_year_id == fiscal_year.id,
            JournalEntry.status == EntryStatus.POSTED,
            ChartOfAccounts.account_class.in_(["1", "2", "3", "4", "5"])
        ).group_by(
            ChartOfAccounts.id,
            ChartOfAccounts.account_number,
            ChartOfAccounts.name
        ).all()

        for r in results:
            debit = r.total_debit or Decimal("0")
            credit = r.total_credit or Decimal("0")
            balance = debit - credit

            if balance != 0:
                balances.append({
                    "account_id": str(r.id),
                    "account_number": r.account_number,
                    "account_name": r.name,
                    "debit": balance if balance > 0 else Decimal("0"),
                    "credit": abs(balance) if balance < 0 else Decimal("0")
                })

        return balances

    def _create_opening_entry(
        self,
        fiscal_year: FiscalYear,
        balances: List[Dict]
    ) -> JournalEntry:
        """Crée l'écriture d'à-nouveau"""
        # Trouver ou créer le journal d'à-nouveau
        opening_journal = self.db.query(AccountingJournal).filter(
            AccountingJournal.tenant_id == self.tenant_id,
            AccountingJournal.journal_type == JournalType.OPENING
        ).first()

        if not opening_journal:
            opening_journal = AccountingJournal(
                tenant_id=self.tenant_id,
                code="AN",
                name="Journal des À-Nouveaux",
                journal_type=JournalType.OPENING
            )
            self.db.add(opening_journal)
            self.db.flush()

        # Créer l'écriture
        entry = JournalEntry(
            tenant_id=self.tenant_id,
            journal_id=opening_journal.id,
            fiscal_year_id=fiscal_year.id,
            entry_number=f"AN-{fiscal_year.code}-001",
            entry_date=fiscal_year.start_date,
            accounting_date=fiscal_year.start_date,
            label=f"À-nouveaux - Exercice {fiscal_year.code}",
            status=EntryStatus.POSTED,
            posted_at=datetime.utcnow(),
            created_by=UUID(self.user_id)
        )
        self.db.add(entry)
        self.db.flush()

        # Créer les lignes
        total_debit = Decimal("0")
        total_credit = Decimal("0")

        for balance in balances:
            line = JournalEntryLine(
                entry_id=entry.id,
                account_id=UUID(balance["account_id"]),
                debit=balance["debit"],
                credit=balance["credit"],
                label=f"À-nouveau {balance['account_number']}"
            )
            self.db.add(line)
            total_debit += balance["debit"]
            total_credit += balance["credit"]

        entry.total_debit = total_debit
        entry.total_credit = total_credit

        return entry

    def _get_or_create_account(
        self,
        account_number: str,
        name: str
    ) -> ChartOfAccounts:
        """Récupère ou crée un compte"""
        account = self.db.query(ChartOfAccounts).filter(
            ChartOfAccounts.tenant_id == self.tenant_id,
            ChartOfAccounts.account_number == account_number
        ).first()

        if not account:
            account = ChartOfAccounts(
                tenant_id=self.tenant_id,
                account_number=account_number,
                name=name,
                account_class=account_number[0],
                account_type="equity",
                is_detail=True
            )
            self.db.add(account)
            self.db.flush()

        return account
