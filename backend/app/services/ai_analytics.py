import pandas as pd
import numpy as np
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List, Dict, Any
from app.models.document import Document, DocumentType, DocumentStatus
from app.models.accounting import AccountingEntry

class AIAnalyticsService:
    def __init__(self):
        pass

    def predict_cash_flow(self, db: Session, tenant_id: str, days: int = 30) -> Dict[str, Any]:
        """
        Prédit les flux de trésorerie futurs basés sur les factures en attente et l'historique.
        Utilise une projection linéaire simple pondérée par la probabilité de paiement.
        """
        receivables = db.query(Document).filter(
            Document.tenant_id == tenant_id,
            Document.type == DocumentType.INVOICE,
            Document.status.in_([DocumentStatus.VALIDATED, DocumentStatus.SENT, DocumentStatus.PARTIALLY_PAID])
        ).all()

        payables = db.query(Document).filter(
            Document.tenant_id == tenant_id,
            Document.type == DocumentType.EXPENSE,
            Document.status.in_([DocumentStatus.VALIDATED, DocumentStatus.PARTIALLY_PAID])
        ).all()

        today = datetime.now().date()
        dates = [today + timedelta(days=i) for i in range(days + 1)]
        projection = {d.isoformat(): 0.0 for d in dates}
        
        current_balance = 1000000.0 # Exemple: 1M FCFA
        projection[today.isoformat()] = current_balance

        for doc in receivables:
            if doc.due_date and doc.due_date >= today:
                due_date_str = doc.due_date.isoformat()
                if due_date_str in projection:
                    remaining = (doc.amount_ttc or 0) - (doc.amount_paid or 0)
                    projection[due_date_str] += remaining * 0.9

        for doc in payables:
            if doc.due_date and doc.due_date >= today:
                due_date_str = doc.due_date.isoformat()
                if due_date_str in projection:
                    remaining = (doc.amount_ttc or 0) - (doc.amount_paid or 0)
                    projection[due_date_str] -= remaining

        cumulative_balance = current_balance
        result_data = []
        
        sorted_dates = sorted(projection.keys())
        for date_str in sorted_dates:
            daily_change = projection[date_str] - (current_balance if date_str == today.isoformat() else 0)
            if date_str != today.isoformat():
                cumulative_balance += daily_change
            
            result_data.append({
                "date": date_str,
                "balance": round(cumulative_balance, 2),
                "daily_change": round(daily_change, 2)
            })

        trend = "stable"
        if result_data[-1]["balance"] > result_data[0]["balance"] * 1.1:
            trend = "up"
        elif result_data[-1]["balance"] < result_data[0]["balance"] * 0.9:
            trend = "down"

        return {
            "projection": result_data,
            "trend": trend,
            "min_balance": min(d["balance"] for d in result_data),
            "max_balance": max(d["balance"] for d in result_data),
            "risk_alert": min(d["balance"] for d in result_data) < 0
        }

    def detect_anomalies(self, db: Session, tenant_id: str) -> List[Dict[str, Any]]:
        """
        Détecte les anomalies dans les écritures comptables en utilisant des méthodes statistiques (Z-Score).
        Identifie les montants inhabituellement élevés pour un compte donné.
        """
        entries = db.query(AccountingEntry).filter(
            AccountingEntry.tenant_id == tenant_id
        ).all()

        if not entries or len(entries) < 10:
            return []

        data = [{
            "id": str(e.id),
            "date": e.date,
            "amount": float(e.credit) if e.credit > 0 else float(e.debit),
            "account": e.account_number,
            "label": e.label
        } for e in entries]
        
        df = pd.DataFrame(data)
        anomalies = []

        for account in df['account'].unique():
            account_df = df[df['account'] == account].copy()
            
            if len(account_df) < 5:
                continue

            mean = account_df['amount'].mean()
            std = account_df['amount'].std()
            
            if std == 0:
                continue
                
            account_df['z_score'] = (account_df['amount'] - mean) / std
            
            outliers = account_df[account_df['z_score'].abs() > 2.5]
            
            for _, row in outliers.iterrows():
                anomalies.append({
                    "type": "montant_inhabituel",
                    "severity": "high" if abs(row['z_score']) > 3 else "medium",
                    "description": f"Montant inhabituel ({row['amount']:,.2f}) pour le compte {account}. Moyenne: {mean:,.2f}",
                    "entry_id": row['id'],
                    "date": row['date'],
                    "amount": row['amount']
                })

        return anomalies

ai_analytics_service = AIAnalyticsService()
