import csv
import io
from typing import Any, Optional
from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_

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


@router.get("/perfecto", response_class=Response)
def export_perfecto(
    db: Session = Depends(deps.get_db_session),
    start_date: date = None,
    end_date: date = None,
    journal_type: Optional[str] = Query(None, description="Type de journal (ACH, VEN, BQ, OD)"),
    status: Optional[str] = Query("validated", description="Statut des écritures (validated, all)"),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Export accounting entries to Perfecto format (.txt).
    Format Bénin: DatePiece;Journal;Compte;Libelle;Debit;Credit;Ref_piece;DateEcheance
    Date format: JJ/MM/AAAA
    Separator: ;
    Currency: FCFA
    """
    query = db.query(AccountingEntry).filter(AccountingEntry.tenant_id == current_user.tenant_id)
    
    if status == "validated":
        query = query.filter(AccountingEntry.status == "validated")
    
    if start_date:
        query = query.filter(AccountingEntry.date >= start_date)
    if end_date:
        query = query.filter(AccountingEntry.date <= end_date)
    if journal_type:
        query = query.filter(AccountingEntry.journal_code == journal_type)
        
    entries = query.order_by(AccountingEntry.date, AccountingEntry.created_at).all()
    
    lines = []
    for entry in entries:
        date_piece = entry.date.strftime("%d/%m/%Y") if entry.date else ""
        date_echeance = entry.due_date.strftime("%d/%m/%Y") if entry.due_date else ""
        
        debit_val = int(entry.debit) if entry.debit else 0
        credit_val = int(entry.credit) if entry.credit else 0
        
        line = ";".join([
            date_piece,
            entry.journal_code or "ACH",
            entry.account_number or "",
            (entry.label or "").replace(";", ","),
            str(debit_val),
            str(credit_val),
            (entry.reference or "").replace(";", ","),
            date_echeance
        ])
        lines.append(line)
    
    content = "\n".join(lines)
    
    filename_date = date.today().strftime("%Y%m%d")
    filename = f"export_perfecto_{filename_date}.txt"
    
    return Response(
        content=content,
        media_type="text/plain; charset=utf-8",
        headers={
            "Content-Disposition": f"attachment; filename={filename}",
            "Content-Type": "text/plain; charset=utf-8"
        }
    )


@router.get("/saari", response_class=Response)
def export_saari(
    db: Session = Depends(deps.get_db_session),
    start_date: date = None,
    end_date: date = None,
    journal_type: Optional[str] = Query(None, description="Type de journal"),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Export accounting entries to SAARI CSV format.
    """
    query = db.query(AccountingEntry).filter(AccountingEntry.tenant_id == current_user.tenant_id)
    
    if start_date:
        query = query.filter(AccountingEntry.date >= start_date)
    if end_date:
        query = query.filter(AccountingEntry.date <= end_date)
    if journal_type:
        query = query.filter(AccountingEntry.journal_code == journal_type)
        
    entries = query.order_by(AccountingEntry.date).all()
    
    output = io.StringIO()
    writer = csv.writer(output, delimiter=';', quoting=csv.QUOTE_MINIMAL)
    
    writer.writerow(["Date", "Journal", "Compte", "Libelle", "Debit", "Credit", "Reference", "Echeance"])
    
    for entry in entries:
        writer.writerow([
            entry.date.strftime("%d/%m/%Y") if entry.date else "",
            entry.journal_code or "",
            entry.account_number or "",
            entry.label or "",
            f"{entry.debit:.2f}" if entry.debit else "0",
            f"{entry.credit:.2f}" if entry.credit else "0",
            entry.reference or "",
            entry.due_date.strftime("%d/%m/%Y") if entry.due_date else ""
        ])
    
    filename = f"export_saari_{date.today().strftime('%Y%m%d')}.csv"
    
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/fiscal-year", response_class=Response)
def export_fiscal_year(
    db: Session = Depends(deps.get_db_session),
    fiscal_year_code: Optional[str] = Query(None, description="Code de l'exercice (ex: 2023, S1-2024)"),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Export accounting entries for a fiscal year/period to CSV.
    Format: Date;Journal;Compte;Libelle;Debit;Credit;Reference;DateEcheance
    """
    query = db.query(AccountingEntry).filter(AccountingEntry.tenant_id == current_user.tenant_id)

    if start_date:
        query = query.filter(AccountingEntry.date >= start_date)
    if end_date:
        query = query.filter(AccountingEntry.date <= end_date)

    entries = query.order_by(AccountingEntry.date, AccountingEntry.created_at).all()

    output = io.StringIO()
    writer = csv.writer(output, delimiter=';', quoting=csv.QUOTE_MINIMAL)

    writer.writerow(["Date", "Journal", "Compte", "Libelle", "Debit", "Credit", "Reference", "DateEcheance", "NumeroEcriture"])

    for entry in entries:
        writer.writerow([
            entry.date.strftime("%Y-%m-%d"),
            entry.journal_code or "",
            entry.account_number or "",
            entry.label or "",
            f"{entry.debit:.2f}" if entry.debit else "0.00",
            f"{entry.credit:.2f}" if entry.credit else "0.00",
            entry.reference or "",
            entry.due_date.strftime("%Y-%m-%d") if entry.due_date else "",
            entry.entry_number or ""
        ])

    filename = f"export_exercice_{fiscal_year_code or 'custom'}.csv"
    content_length = len(output.getvalue().encode('utf-8'))

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename={filename}",
            "Content-Length": str(content_length)
        }
    )
