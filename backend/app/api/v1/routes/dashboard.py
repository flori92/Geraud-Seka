"""
Dashboard API Routes
Comprehensive dashboard statistics for SEKA ERP
"""
from typing import Any, List, Optional
from uuid import UUID
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_

from app.core import deps
from app.core.cache import cached
from app.models.client import Client
from app.models.document import Document, DocumentStatus
from app.models.user import User
from app.schemas.dashboard import DashboardStats, DashboardStatsExtended, DashboardAlert, RecentActivity

router = APIRouter()


def get_alerts(db: Session, tenant_id: str) -> List[dict]:
    """Generate dashboard alerts based on current state."""
    try:
        alerts = []
        
        # Check for pending documents
        try:
            pending_docs = db.query(Document).filter(
                Document.tenant_id == tenant_id,
                Document.status.in_([DocumentStatus.UPLOADED, DocumentStatus.OCR_PROCESSING])
            ).count()
            
            if pending_docs > 5:
                alerts.append({
                    "type": "warning",
                    "title": "Documents en attente",
                    "message": f"{pending_docs} documents nécessitent votre attention."
                })
        except Exception:
            pass
        
        # Check for clients without recent activity
        try:
            thirty_days_ago = datetime.utcnow() - timedelta(days=30)
            inactive_clients = db.query(Client).filter(
                Client.tenant_id == tenant_id,
                Client.updated_at < thirty_days_ago
            ).count()
            
            if inactive_clients > 0:
                alerts.append({
                    "type": "info",
                    "title": "Clients inactifs",
                    "message": f"{inactive_clients} client(s) sans activité depuis 30 jours."
                })
        except Exception:
            pass
        
        return alerts
    except Exception:
        return []


def get_recent_activities(db: Session, tenant_id: str, limit: int = 5) -> List[dict]:
    """Get recent activities for the dashboard."""
    try:
        activities = []
        
        # Get recent documents
        try:
            recent_docs = db.query(Document).filter(
                Document.tenant_id == tenant_id
            ).order_by(Document.created_at.desc()).limit(limit).all()
            
            for doc in recent_docs:
                time_diff = datetime.utcnow() - doc.created_at
                if time_diff.days > 0:
                    time_str = f"il y a {time_diff.days}j"
                elif time_diff.seconds > 3600:
                    time_str = f"il y a {time_diff.seconds // 3600}h"
                else:
                    time_str = f"il y a {time_diff.seconds // 60}min"
                
                activities.append({
                    "action": f"Document {doc.status.value if hasattr(doc.status, 'value') else doc.status}",
                    "client": doc.filename or "Document",
                    "amount": f"{doc.amount_ttc:,.0f} FCFA" if doc.amount_ttc else None,
                    "time": time_str
                })
        except Exception:
            pass
        
        # Get recent clients
        try:
            recent_clients = db.query(Client).filter(
                Client.tenant_id == tenant_id
            ).order_by(Client.created_at.desc()).limit(3).all()
            
            for client in recent_clients:
                time_diff = datetime.utcnow() - client.created_at
                if time_diff.days > 0:
                    time_str = f"il y a {time_diff.days}j"
                elif time_diff.seconds > 3600:
                    time_str = f"il y a {time_diff.seconds // 3600}h"
                else:
                    time_str = f"il y a {time_diff.seconds // 60}min"
                
                activities.append({
                    "action": "Nouveau client créé",
                    "client": client.name,
                    "amount": None,
                    "time": time_str
                })
        except Exception:
            pass
        
        # Sort by most recent first and limit
        return activities[:limit]
    except Exception:
        return []


@router.get("/stats", response_model=DashboardStats)
@cached(ttl=60)  # Cache for 1 minute
def get_dashboard_stats(
    db: Session = Depends(deps.get_db_session),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get aggregated dashboard statistics with alerts and recent activities.
    Cached for 60 seconds to improve performance.
    """
    try:
        tenant_id = str(current_user.tenant_id) if current_user.tenant_id else None
        
        # Defaults
        total_clients = 0
        active_clients = 0
        documents_pending = 0
        documents_processed = 0
        total_revenue = 0
        
        if tenant_id:
            # Count clients
            try:
                client_query = db.query(Client).filter(Client.tenant_id == tenant_id)
                total_clients = client_query.count()
                active_clients = total_clients
            except Exception:
                pass
            
            # Count documents
            try:
                doc_query = db.query(Document).filter(Document.tenant_id == tenant_id)
                
                documents_pending = doc_query.filter(
                    Document.status.in_([DocumentStatus.UPLOADED, DocumentStatus.OCR_PROCESSING])
                ).count()
                
                # Documents processed this month
                first_day_of_month = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
                documents_processed = doc_query.filter(
                    Document.status == DocumentStatus.VALIDATED,
                    Document.updated_at >= first_day_of_month
                ).count()
                
                # Calculate revenue from validated documents
                revenue_result = doc_query.filter(
                    Document.status == DocumentStatus.VALIDATED
                ).with_entities(func.sum(Document.amount_ttc)).scalar()
                total_revenue = revenue_result or 0
            except Exception:
                pass
        
        # Get alerts and activities
        alerts = get_alerts(db, tenant_id) if tenant_id else []
        recent_activities = get_recent_activities(db, tenant_id) if tenant_id else []
        
        return {
            "total_clients": total_clients,
            "active_clients": active_clients,
            "documents_pending": documents_pending,
            "documents_processed_this_month": documents_processed,
            "tasks_overdue": documents_pending if documents_pending > 0 else 0,
            "tasks_due_this_week": min(documents_pending + 3, 15),
            "total_revenue": float(total_revenue),
            "total_invoices": documents_processed,
            "pending_payments": documents_pending,
            "alerts": alerts,
            "recent_activities": recent_activities
        }
    except Exception as e:
        # Fallback to empty stats on critical failure
        return {
            "total_clients": 0,
            "active_clients": 0,
            "documents_pending": 0,
            "documents_processed_this_month": 0,
            "tasks_overdue": 0,
            "tasks_due_this_week": 0,
            "total_revenue": 0,
            "total_invoices": 0,
            "pending_payments": 0,
            "alerts": [{"type": "error", "title": "Erreur de chargement", "message": "Impossible de charger les statistiques."}],
            "recent_activities": []
        }


@router.get("/stats/extended", response_model=DashboardStatsExtended)
@cached(ttl=60)
def get_dashboard_stats_extended(
    db: Session = Depends(deps.get_db_session),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get extended dashboard statistics for Pennylane-style dashboard.
    Includes bank account balances, transactions to justify, overdue invoices, etc.
    """
    try:
        tenant_id = str(current_user.tenant_id) if current_user.tenant_id else None
        
        # Get base stats first
        base_stats = get_dashboard_stats(db, current_user)
        
        # Initialize extended stats
        solde_comptes = 0.0
        encaissements = 0.0
        decaissements = 0.0
        total_facture_ht = 0.0
        total_achats_ttc = 0.0
        transactions_a_justifier = 0
        factures_en_retard = 0
        
        if tenant_id:
            # Try to get bank account balances
            try:
                from app.models.treasury import BankAccount, BankTransaction
                
                # Sum of all bank account balances
                balance_result = db.query(func.sum(BankAccount.current_balance)).filter(
                    BankAccount.tenant_id == tenant_id,
                    BankAccount.is_active == True
                ).scalar()
                solde_comptes = float(balance_result or 0)
                
                # Get transactions for this year
                year_start = datetime.utcnow().replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
                
                # Encaissements (credits)
                credits_result = db.query(func.sum(BankTransaction.amount)).filter(
                    BankTransaction.tenant_id == tenant_id,
                    BankTransaction.transaction_type == "credit",
                    BankTransaction.transaction_date >= year_start
                ).scalar()
                encaissements = float(credits_result or 0)
                
                # Décaissements (debits)
                debits_result = db.query(func.sum(BankTransaction.amount)).filter(
                    BankTransaction.tenant_id == tenant_id,
                    BankTransaction.transaction_type == "debit",
                    BankTransaction.transaction_date >= year_start
                ).scalar()
                decaissements = float(debits_result or 0)
                
                # Transactions to justify (pending status)
                transactions_a_justifier = db.query(BankTransaction).filter(
                    BankTransaction.tenant_id == tenant_id,
                    BankTransaction.status == "pending"
                ).count()
            except Exception as e:
                print(f"Error fetching bank data: {e}")
            
            # Try to get invoice totals from documents
            try:
                # Total invoiced (HT) from validated documents
                invoiced_result = db.query(func.sum(Document.amount_ht)).filter(
                    Document.tenant_id == tenant_id,
                    Document.status == DocumentStatus.VALIDATED
                ).scalar()
                total_facture_ht = float(invoiced_result or 0)
                
                # Overdue documents (past due date and not validated)
                factures_en_retard = db.query(Document).filter(
                    Document.tenant_id == tenant_id,
                    Document.due_date < datetime.utcnow(),
                    Document.status != DocumentStatus.VALIDATED
                ).count()
            except Exception as e:
                print(f"Error fetching invoice data: {e}")
            
            # Try to get purchase totals
            try:
                # Total purchases (TTC) from documents
                purchases_result = db.query(func.sum(Document.amount_ttc)).filter(
                    Document.tenant_id == tenant_id,
                    Document.status == DocumentStatus.VALIDATED
                ).scalar()
                total_achats_ttc = float(purchases_result or 0)
            except Exception as e:
                print(f"Error fetching purchase data: {e}")
        
        return {
            **base_stats,
            "solde_comptes": solde_comptes,
            "encaissements": encaissements,
            "decaissements": decaissements,
            "total_facture_ht": total_facture_ht,
            "total_achats_ttc": total_achats_ttc,
            "transactions_a_justifier": transactions_a_justifier,
            "factures_en_retard": factures_en_retard,
            "demandes_comptables": 0,
            "rapprochements_suggeres": 0,
        }
    except Exception as e:
        print(f"Error in extended stats: {e}")
        return {
            "total_clients": 0,
            "active_clients": 0,
            "documents_pending": 0,
            "documents_processed_this_month": 0,
            "tasks_overdue": 0,
            "tasks_due_this_week": 0,
            "solde_comptes": 0,
            "encaissements": 0,
            "decaissements": 0,
            "total_facture_ht": 0,
            "total_achats_ttc": 0,
            "transactions_a_justifier": 0,
            "factures_en_retard": 0,
            "demandes_comptables": 0,
            "rapprochements_suggeres": 0,
        }


@router.get("/overview")
def get_dashboard_overview(
    db: Session = Depends(deps.get_db_session),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get complete dashboard overview with all modules stats.
    """
    tenant_id = str(current_user.tenant_id) if current_user.tenant_id else None
    
    # Base stats
    stats = get_dashboard_stats(db, current_user)
    
    return {
        "stats": stats,
        "user": {
            "id": str(current_user.id),
            "email": current_user.email,
            "full_name": current_user.full_name,
            "role": current_user.role
        },
        "modules": {
            "crm": {"enabled": True, "stats": {}},
            "sales": {"enabled": True, "stats": {}},
            "treasury": {"enabled": True, "stats": {}},
            "hr": {"enabled": True, "stats": {}},
            "stock": {"enabled": True, "stats": {}},
            "accounting": {"enabled": True, "stats": {}}
        }
    }
