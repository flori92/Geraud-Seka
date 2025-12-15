
from typing import List, Dict, Any, Optional
from datetime import date, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, case, and_, or_

from app.models.accounting import AccountingEntry

class AccountingAnalyticsService:
    def __init__(self, db: Session, tenant_id):
        self.db = db
        self.tenant_id = tenant_id

    def get_sig(self, year: int) -> Dict[str, Any]:
        start_date = date(year, 1, 1)
        end_date = date(year, 12, 31)

        # Chiffre d'affaires: comptes 70* (approx)
        revenue = self.db.query(func.sum(AccountingEntry.credit - AccountingEntry.debit)).filter(
            AccountingEntry.tenant_id == self.tenant_id,
            AccountingEntry.account_number.like("70%"),
            AccountingEntry.date.between(start_date, end_date)
        ).scalar() or 0.0

        # Achats consommés: comptes 60* (approx)
        purchases = self.db.query(func.sum(AccountingEntry.debit - AccountingEntry.credit)).filter(
            AccountingEntry.tenant_id == self.tenant_id,
            AccountingEntry.account_number.like("60%"),
            AccountingEntry.date.between(start_date, end_date)
        ).scalar() or 0.0

        # Charges externes: 61/62*
        external_charges = self.db.query(func.sum(AccountingEntry.debit - AccountingEntry.credit)).filter(
            AccountingEntry.tenant_id == self.tenant_id,
            or_(AccountingEntry.account_number.like("61%"), AccountingEntry.account_number.like("62%")),
            AccountingEntry.date.between(start_date, end_date)
        ).scalar() or 0.0

        # Impôts & taxes: 63*
        taxes = self.db.query(func.sum(AccountingEntry.debit - AccountingEntry.credit)).filter(
            AccountingEntry.tenant_id == self.tenant_id,
            AccountingEntry.account_number.like("63%"),
            AccountingEntry.date.between(start_date, end_date)
        ).scalar() or 0.0

        # Charges de personnel: 64*
        payroll = self.db.query(func.sum(AccountingEntry.debit - AccountingEntry.credit)).filter(
            AccountingEntry.tenant_id == self.tenant_id,
            AccountingEntry.account_number.like("64%"),
            AccountingEntry.date.between(start_date, end_date)
        ).scalar() or 0.0

        # Dotations: 68*
        depreciation = self.db.query(func.sum(AccountingEntry.debit - AccountingEntry.credit)).filter(
            AccountingEntry.tenant_id == self.tenant_id,
            AccountingEntry.account_number.like("68%"),
            AccountingEntry.date.between(start_date, end_date)
        ).scalar() or 0.0

        # Produits/charges financiers: 76* / 66*
        financial_products = self.db.query(func.sum(AccountingEntry.credit - AccountingEntry.debit)).filter(
            AccountingEntry.tenant_id == self.tenant_id,
            AccountingEntry.account_number.like("76%"),
            AccountingEntry.date.between(start_date, end_date)
        ).scalar() or 0.0

        financial_charges = self.db.query(func.sum(AccountingEntry.debit - AccountingEntry.credit)).filter(
            AccountingEntry.tenant_id == self.tenant_id,
            AccountingEntry.account_number.like("66%"),
            AccountingEntry.date.between(start_date, end_date)
        ).scalar() or 0.0

        marge_commerciale = revenue - purchases
        valeur_ajoutee = marge_commerciale - external_charges
        ebe = valeur_ajoutee - taxes - payroll
        resultat_exploitation = ebe - depreciation
        resultat_financier = financial_products - financial_charges
        resultat_courant = resultat_exploitation + resultat_financier

        # Résultat net: revenus classe 7 - charges classe 6
        income_stmt = self.get_income_statement(year)

        lines = [
            {"label": "Chiffre d'affaires", "amount": float(revenue)},
            {"label": "Marge commerciale", "amount": float(marge_commerciale)},
            {"label": "Valeur ajoutée", "amount": float(valeur_ajoutee)},
            {"label": "EBE", "amount": float(ebe)},
            {"label": "Résultat d'exploitation", "amount": float(resultat_exploitation)},
            {"label": "Résultat financier", "amount": float(resultat_financier)},
            {"label": "Résultat courant", "amount": float(resultat_courant)},
            {"label": "Résultat net", "amount": float(income_stmt.get("net_income") or 0.0)},
        ]

        return {"year": year, "lines": lines}

    def get_cash_flow(self, year: int) -> Dict[str, Any]:
        start_date = date(year, 1, 1)
        end_date = date(year, 12, 31)

        # Approximation: variation trésorerie = solde classe 5 (débit - crédit)
        cash = self.db.query(func.sum(AccountingEntry.debit - AccountingEntry.credit)).filter(
            AccountingEntry.tenant_id == self.tenant_id,
            AccountingEntry.account_number.like("5%"),
            AccountingEntry.date.between(start_date, end_date)
        ).scalar() or 0.0

        # On renvoie une structure simple (lignes) consommable par le front
        return {
            "year": year,
            "lines": [
                {"section": "Exploitation", "label": "Flux de trésorerie", "amount": float(cash)},
            ],
        }

    def get_is_ir(self, year: int) -> Dict[str, Any]:
        income_stmt = self.get_income_statement(year)
        result = float(income_stmt.get("net_income") or 0.0)

        # Base simplifiée = résultat net (à affiner ensuite)
        base = max(0.0, result)
        rate = 0.0
        amount = base * rate

        return {
            "year": year,
            "lines": [
                {"label": "Résultat fiscal", "base": base, "rate": rate, "amount": amount},
            ],
        }

    def get_other_taxes(self, year: int) -> Dict[str, Any]:
        start_date = date(year, 1, 1)
        end_date = date(year, 12, 31)

        # Taxes diverses: classe 63* (impôts & taxes)
        total = self.db.query(func.sum(AccountingEntry.debit - AccountingEntry.credit)).filter(
            AccountingEntry.tenant_id == self.tenant_id,
            AccountingEntry.account_number.like("63%"),
            AccountingEntry.date.between(start_date, end_date)
        ).scalar() or 0.0

        return {
            "year": year,
            "lines": [
                {"name": "Impôts & taxes (classe 63)", "period": str(year), "base": float(total), "rate": 0.0, "amount": float(total)},
            ],
        }

    def get_account_balance(self, account_number: str, start_date: Optional[date] = None, end_date: Optional[date] = None) -> float:
        """Calcule le solde d'un compte (Crédit - Débit pour passif/pdts, Débit - Crédit pour actif/charges)"""
        # Note: Pour simplifier, on retourne solde algébrique (Crédit - Débit)
        # Positif = Créditeur, Négatif = Débiteur
        query = self.db.query(
            func.sum(AccountingEntry.credit - AccountingEntry.debit)
        ).filter(
            AccountingEntry.tenant_id == self.tenant_id,
            AccountingEntry.account_number.like(f"{account_number}%")
        )

        if start_date:
            query = query.filter(AccountingEntry.date >= start_date)
        if end_date:
            query = query.filter(AccountingEntry.date <= end_date)

        result = query.scalar()
        return result or 0.0

    def get_income_statement(self, year: int) -> Dict[str, Any]:
        """Génère le Compte de Résultat (Profit & Loss)"""
        start_date = date(year, 1, 1)
        end_date = date(year, 12, 31)

        # Revenus (Classe 7)
        revenue = self.db.query(func.sum(AccountingEntry.credit - AccountingEntry.debit)).filter(
            AccountingEntry.tenant_id == self.tenant_id,
            AccountingEntry.account_number.like("7%"),
            AccountingEntry.date.between(start_date, end_date)
        ).scalar() or 0.0

        # Charges (Classe 6) - On veut la valeur positive pour l'affichage
        expenses = self.db.query(func.sum(AccountingEntry.debit - AccountingEntry.credit)).filter(
            AccountingEntry.tenant_id == self.tenant_id,
            AccountingEntry.account_number.like("6%"),
            AccountingEntry.date.between(start_date, end_date)
        ).scalar() or 0.0

        net_income = revenue - expenses

        return {
            "revenue": revenue,
            "expenses": expenses,
            "net_income": net_income,
            "period": f"{year}"
        }

    def get_balance_sheet_summary(self) -> Dict[str, Any]:
        """Génère les agrégats principaux du Bilan"""
        # Actif: Classes 2 (Immo), 3 (Stocks), 4 (Tiers Actif), 5 (Trésorerie)
        # Note: Simplification majeure, normalement il faut trier les comptes de tiers débiteurs vs créditeurs

        # Total Actif (Approximation: Solde débiteur des classes 2, 3, 4, 5)
        # On somme (Debit - Credit) pour les comptes d'actif
        total_assets = 0.0
        for classe in ["2", "3", "4", "5"]:
             balance = self.db.query(func.sum(AccountingEntry.debit - AccountingEntry.credit)).filter(
                AccountingEntry.tenant_id == self.tenant_id,
                AccountingEntry.account_number.like(f"{classe}%")
            ).scalar() or 0.0
             # Si globalement débiteur, c'est un actif
             if balance > 0:
                 total_assets += balance

        # Passif & Capitaux Propres: Classes 1 (Capitaux), 4 (Tiers Passif)
        # Capitaux Propres (Classe 1)
        equity = self.db.query(func.sum(AccountingEntry.credit - AccountingEntry.debit)).filter(
            AccountingEntry.tenant_id == self.tenant_id,
            AccountingEntry.account_number.like("1%")
        ).scalar() or 0.0

        # Dettes (Passif - Capitaux)
        # On approxime avec les soldes créditeurs des classes 4 et 1 (hors resultats)
        total_liabilities = 0.0
        for classe in ["1", "4", "5"]: # 5 peut être passif (découvert)
             balance = self.db.query(func.sum(AccountingEntry.credit - AccountingEntry.debit)).filter(
                AccountingEntry.tenant_id == self.tenant_id,
                AccountingEntry.account_number.like(f"{classe}%")
            ).scalar() or 0.0
             if balance > 0:
                 total_liabilities += balance
        
        # Ajustement capitaux propres (Equity est une partie de Liabilities dans cette logique compta anglo-saxonne étendue)
        # Liabilities au sens strict (Dettes) = Total Passif - Capitaux Propres
        liabilities_only = total_liabilities - equity

        return {
            "total_assets": total_assets,
            "equity": equity,
            "total_liabilities": liabilities_only,
            "total_equity_and_liabilities": total_liabilities # Devrait égaler total_assets si équilibré
        }
    
    def get_receivables_payables(self) -> Dict[str, float]:
        """Calcule Créances Clients et Dettes Fournisseurs"""
        # Créances Clients (411)
        receivables = self.db.query(func.sum(AccountingEntry.debit - AccountingEntry.credit)).filter(
            AccountingEntry.tenant_id == self.tenant_id,
            AccountingEntry.account_number.like("411%")
        ).scalar() or 0.0

        # Dettes Fournisseurs (401)
        payables = self.db.query(func.sum(AccountingEntry.credit - AccountingEntry.debit)).filter(
            AccountingEntry.tenant_id == self.tenant_id,
            AccountingEntry.account_number.like("401%")
        ).scalar() or 0.0

        return {
            "receivables": max(0, receivables),
            "payables": max(0, payables)
        }

    def get_monthly_trends(self, year: int) -> Dict[str, List[float]]:
        """Calcule l'évolution mensuelle des revenus et charges"""
        months = range(1, 13)
        revenue_data = []
        expenses_data = []

        for month in months:
            start_dt = date(year, month, 1)
            # Fin du mois
            if month == 12:
                end_dt = date(year, 12, 31)
            else:
                end_dt = date(year, month + 1, 1) - timedelta(days=1)

            rev = self.db.query(func.sum(AccountingEntry.credit - AccountingEntry.debit)).filter(
                AccountingEntry.tenant_id == self.tenant_id,
                AccountingEntry.account_number.like("7%"),
                AccountingEntry.date.between(start_dt, end_dt)
            ).scalar() or 0.0
            
            exp = self.db.query(func.sum(AccountingEntry.debit - AccountingEntry.credit)).filter(
                AccountingEntry.tenant_id == self.tenant_id,
                AccountingEntry.account_number.like("6%"),
                AccountingEntry.date.between(start_dt, end_dt)
            ).scalar() or 0.0

            revenue_data.append(rev)
            expenses_data.append(exp)

        return {
            "revenue": revenue_data,
            "expenses": expenses_data,
            "labels": ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"]
        }

    def get_tva_declaration(self, year: int, month: int) -> Dict[str, Any]:
        """
        Génère une déclaration TVA mensuelle basée sur les écritures comptables.

        En UEMOA/CI:
        - TVA Collectée (sur ventes): compte 4431
        - TVA Déductible (sur achats): compte 4451
        - Taux standard: 18%
        """
        from calendar import monthrange

        # Déterminer les dates de la période
        start_date = date(year, month, 1)
        last_day = monthrange(year, month)[1]
        end_date = date(year, month, last_day)

        # TVA Collectée (4431) - Créditeur normal
        tva_collectee = self.db.query(func.sum(AccountingEntry.credit - AccountingEntry.debit)).filter(
            AccountingEntry.tenant_id == self.tenant_id,
            AccountingEntry.account_number.like("4431%"),
            AccountingEntry.date.between(start_date, end_date)
        ).scalar() or 0.0

        # TVA Déductible (4451) - Débiteur normal
        tva_deductible = self.db.query(func.sum(AccountingEntry.debit - AccountingEntry.credit)).filter(
            AccountingEntry.tenant_id == self.tenant_id,
            AccountingEntry.account_number.like("4451%"),
            AccountingEntry.date.between(start_date, end_date)
        ).scalar() or 0.0

        # Calcul de la base HT à partir de la TVA (base = TVA / taux)
        # Pour 18%, base_ht = tva / 0.18

        # Lignes TVA collectée (détail par taux)
        collectee_lines = []

        # Ventes soumises à 18%
        if tva_collectee > 0:
            base_18 = tva_collectee / 0.18
            collectee_lines.append({
                "code": "CA3-01",
                "label": "Ventes de marchandises et services (18%)",
                "base": round(base_18, 2),
                "tva": round(tva_collectee, 2),
                "rate": "18%"
            })

        # Ventes exonérées (estimer à partir des ventes sans TVA)
        # On peut approximer en regardant les ventes (classe 70) sans TVA correspondante
        revenue_total = self.db.query(func.sum(AccountingEntry.credit - AccountingEntry.debit)).filter(
            AccountingEntry.tenant_id == self.tenant_id,
            AccountingEntry.account_number.like("70%"),
            AccountingEntry.date.between(start_date, end_date)
        ).scalar() or 0.0

        # Ventes exonérées = Revenue total - Base soumise à TVA
        base_exempt = max(0, revenue_total - (tva_collectee / 0.18 if tva_collectee > 0 else 0))
        if base_exempt > 100:  # Seuil minimal pour afficher
            collectee_lines.append({
                "code": "CA3-02",
                "label": "Ventes exonérées",
                "base": round(base_exempt, 2),
                "tva": 0,
                "rate": "0%"
            })

        # Lignes TVA déductible (détail par nature)
        deductible_lines = []

        if tva_deductible > 0:
            # Répartir la TVA déductible par nature d'achat (approximatif)
            # On regarde les comptes de charges correspondants

            # Achats de marchandises (60)
            achats_marchandises = self.db.query(func.sum(AccountingEntry.debit - AccountingEntry.credit)).filter(
                AccountingEntry.tenant_id == self.tenant_id,
                AccountingEntry.account_number.like("60%"),
                AccountingEntry.date.between(start_date, end_date)
            ).scalar() or 0.0

            # Services extérieurs (61/62)
            services = self.db.query(func.sum(AccountingEntry.debit - AccountingEntry.credit)).filter(
                AccountingEntry.tenant_id == self.tenant_id,
                or_(AccountingEntry.account_number.like("61%"), AccountingEntry.account_number.like("62%")),
                AccountingEntry.date.between(start_date, end_date)
            ).scalar() or 0.0

            # Immobilisations (2x)
            immobilisations = self.db.query(func.sum(AccountingEntry.debit - AccountingEntry.credit)).filter(
                AccountingEntry.tenant_id == self.tenant_id,
                AccountingEntry.account_number.like("2%"),
                AccountingEntry.date.between(start_date, end_date)
            ).scalar() or 0.0

            total_charges = achats_marchandises + services + immobilisations

            if total_charges > 0:
                # Répartir proportionnellement la TVA déductible
                if achats_marchandises > 0:
                    tva_achats = tva_deductible * (achats_marchandises / total_charges)
                    deductible_lines.append({
                        "code": "DD-01",
                        "label": "Achats de marchandises",
                        "base": round(achats_marchandises, 2),
                        "tva": round(tva_achats, 2),
                        "rate": "18%"
                    })

                if services > 0:
                    tva_services = tva_deductible * (services / total_charges)
                    deductible_lines.append({
                        "code": "DD-02",
                        "label": "Services extérieurs",
                        "base": round(services, 2),
                        "tva": round(tva_services, 2),
                        "rate": "18%"
                    })

                if immobilisations > 0:
                    tva_immob = tva_deductible * (immobilisations / total_charges)
                    deductible_lines.append({
                        "code": "DD-03",
                        "label": "Investissements (immobilisations)",
                        "base": round(immobilisations, 2),
                        "tva": round(tva_immob, 2),
                        "rate": "18%"
                    })
            else:
                # Pas de détail, afficher juste le total
                deductible_lines.append({
                    "code": "DD-01",
                    "label": "TVA déductible sur achats",
                    "base": round(tva_deductible / 0.18, 2),
                    "tva": round(tva_deductible, 2),
                    "rate": "18%"
                })

        # Calcul TVA à payer (ou crédit de TVA)
        tva_due = tva_collectee - tva_deductible

        # Date limite de paiement (généralement 15 du mois suivant)
        if month == 12:
            due_date = date(year + 1, 1, 15)
        else:
            due_date = date(year, month + 1, 15)

        # Récupérer l'historique des déclarations précédentes (3 derniers mois)
        history = []
        for i in range(1, 4):
            prev_month = month - i
            prev_year = year
            if prev_month <= 0:
                prev_month += 12
                prev_year -= 1

            prev_start = date(prev_year, prev_month, 1)
            prev_last_day = monthrange(prev_year, prev_month)[1]
            prev_end = date(prev_year, prev_month, prev_last_day)

            prev_collectee = self.db.query(func.sum(AccountingEntry.credit - AccountingEntry.debit)).filter(
                AccountingEntry.tenant_id == self.tenant_id,
                AccountingEntry.account_number.like("4431%"),
                AccountingEntry.date.between(prev_start, prev_end)
            ).scalar() or 0.0

            prev_deductible = self.db.query(func.sum(AccountingEntry.debit - AccountingEntry.credit)).filter(
                AccountingEntry.tenant_id == self.tenant_id,
                AccountingEntry.account_number.like("4451%"),
                AccountingEntry.date.between(prev_start, prev_end)
            ).scalar() or 0.0

            prev_due = prev_collectee - prev_deductible

            if prev_month == 12:
                prev_due_date = date(prev_year + 1, 1, 15)
            else:
                prev_due_date = date(prev_year, prev_month + 1, 15)

            history.append({
                "id": f"h{i}",
                "period": f"{prev_year}-{prev_month:02d}",
                "due_date": prev_due_date.isoformat(),
                "status": "paid" if prev_due_date < date.today() else "submitted",
                "tva_collectee": round(prev_collectee, 2),
                "tva_deductible": round(prev_deductible, 2),
                "tva_due": round(prev_due, 2)
            })

        return {
            "period": f"{year}-{month:02d}",
            "due_date": due_date.isoformat(),
            "status": "draft" if date.today() < due_date else "overdue",
            "tva_collectee": round(tva_collectee, 2),
            "tva_deductible": round(tva_deductible, 2),
            "tva_due": round(tva_due, 2),
            "collectee_lines": collectee_lines,
            "deductible_lines": deductible_lines,
            "history": history,
            "generated_at": date.today().isoformat()
        }

    def get_dashboard_summary(self) -> Dict[str, Any]:
        """Agrège tout pour le dashboard"""
        current_year = date.today().year

        income_stmt = self.get_income_statement(current_year)
        balance_sheet = self.get_balance_sheet_summary()
        rec_pay = self.get_receivables_payables()

        # Cash = Classe 5 (Actif)
        cash_balance = self.db.query(func.sum(AccountingEntry.debit - AccountingEntry.credit)).filter(
            AccountingEntry.tenant_id == self.tenant_id,
            AccountingEntry.account_number.like("5%")
        ).scalar() or 0.0

        return {
            "revenue": income_stmt["revenue"],
            "expenses": income_stmt["expenses"],
            "net_income": income_stmt["net_income"],
            "total_assets": balance_sheet["total_assets"],
            "total_liabilities": balance_sheet["total_liabilities"],
            "equity": balance_sheet["equity"],
            "receivables": rec_pay["receivables"],
            "payables": rec_pay["payables"],
            "cash_balance": cash_balance
        }
