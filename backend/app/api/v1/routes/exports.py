import csv
import io
from typing import Any
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session

from app.core import deps
from app.models.accounting import AccountingEntry
from app.models.user import User

router = APIRouter()

@router.get("/sage", response_class=Response)
def export_sage(
    db: Session = Depends(deps.get_db_session),
    start_date: date = None,
    end_date: date = None,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Export accounting entries to Sage CSV format.
    Format: DatePiece;Journal;Compte;Libelle;Debit;Credit;Ref_piece;DateEcheance
    """
    query = db.query(AccountingEntry).filter(AccountingEntry.tenant_id == current_user.tenant_id)
    
    if start_date:
        query = query.filter(AccountingEntry.date >= start_date)
    if end_date:
        query = query.filter(AccountingEntry.date <= end_date)
        
    entries = query.all()
    
    output = io.StringIO()
    writer = csv.writer(output, delimiter=';', quoting=csv.QUOTE_MINIMAL)
    
    # Header
    writer.writerow(["DatePiece", "Journal", "Compte", "Libelle", "Debit", "Credit", "Ref_piece", "DateEcheance"])
    
    for entry in entries:
        writer.writerow([
            entry.date.strftime("%Y-%m-%d"),
            entry.journal_code,
            entry.account_number,
            entry.label,
            f"{entry.debit:.2f}".replace('.', ',') if entry.debit else "0",
            f"{entry.credit:.2f}".replace('.', ',') if entry.credit else "0",
            entry.reference,
            entry.due_date.strftime("%Y-%m-%d") if entry.due_date else ""
        ])
        
    return Response(content=output.getvalue(), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=export_sage.csv"})
