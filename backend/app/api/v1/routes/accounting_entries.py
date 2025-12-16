from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Response
from fastapi.responses import StreamingResponse
from app.services.fec_importer import FECImporterService
import logging
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, and_, or_
from typing import List, Optional
from uuid import UUID
from datetime import date, datetime
from decimal import Decimal
import json
import csv
import io
from weasyprint import HTML

from app.db.session import get_db
from app.core.deps import get_current_user, get_current_client_id_optional
from app.models.user import User
from app.models.document import Document
from app.models.accounting_entries import (
    AccountingEntryHeader, AccountingEntryLine, 
    AccountingRevision, EntryStatus, JournalType
)
from app.models.accounting_advanced import BankReconciliation
from app.models.ledger_account import LedgerAccount
from app.schemas.accounting_entries import (
    AccountingEntryHeaderCreate, AccountingEntryHeaderResponse,
    AccountingEntryHeaderUpdate, BankReconciliationCreate,
    BankReconciliationResponse, AccountingRevisionCreate,
    AccountingRevisionResponse, LettrageRequest, ValidationRequest,
    EntrySearchCriteria, EntryExportFormat
)

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/entries/", response_model=AccountingEntryHeaderResponse)
def create_accounting_entry(
    entry_data: AccountingEntryHeaderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        count = db.query(func.count(AccountingEntryHeader.id)).filter(
            AccountingEntryHeader.tenant_id == current_user.tenant_id
        ).scalar() or 0
        
        entry_number = f"{entry_data.journal_type}-{datetime.now().year}-{count + 1:06d}"
        
        entry = AccountingEntryHeader(
            tenant_id=current_user.tenant_id,
            entry_number=entry_number,
            journal_type=JournalType(entry_data.journal_type),
            date=entry_data.date,
            reference=entry_data.reference,
            description=entry_data.description,
            status=EntryStatus.DRAFT,
            document_id=entry_data.document_id,
        )
        
        db.add(entry)
        db.flush()
        
        for line_data in entry_data.lines:
            account_id = line_data.account_id
            if account_id is None and getattr(line_data, "account_code", None):
                account = db.query(LedgerAccount).filter(
                    LedgerAccount.account_code == line_data.account_code,
                    LedgerAccount.tenant_id == current_user.tenant_id,
                ).first()
                if not account:
                    raise HTTPException(status_code=404, detail=f"Compte {line_data.account_code} introuvable")
                account_id = account.id
            else:
                account = db.query(LedgerAccount).filter(
                    LedgerAccount.id == account_id,
                    LedgerAccount.tenant_id == current_user.tenant_id
                ).first()

            if not account:
                raise HTTPException(status_code=404, detail=f"Compte {line_data.account_id} introuvable")
            
            line = AccountingEntryLine(
                tenant_id=current_user.tenant_id,
                entry_id=entry.id,
                account_id=account_id,
                label=line_data.label,
                debit=line_data.debit,
                credit=line_data.credit,
                analytic_code=line_data.analytic_code,
                partner_id=line_data.partner_id,
                partner_type=line_data.partner_type
            )
            db.add(line)
        
        db.commit()
        db.refresh(entry)
        
        return entry
    except HTTPException:
        db.rollback()
        raise
    except ValueError as ve:
        db.rollback()
        raise HTTPException(status_code=422, detail=str(ve))
    except Exception as e:
        db.rollback()
        logger.exception("Erreur inattendue lors de la création de l'écriture")
        raise HTTPException(status_code=500, detail=f"Erreur lors de la création de l'écriture: {str(e)}")


@router.get("/entries/", response_model=List[AccountingEntryHeaderResponse])
def get_accounting_entries(
    status: Optional[str] = None,
    journal_type: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    current_user: User = Depends(get_current_user),
    client_id: Optional[UUID] = Depends(get_current_client_id_optional),
    db: Session = Depends(get_db)
):
    query = (
        db.query(AccountingEntryHeader)
        .options(joinedload(AccountingEntryHeader.lines).joinedload(AccountingEntryLine.account))
        .filter(AccountingEntryHeader.tenant_id == current_user.tenant_id)
    )

    if client_id:
        query = query.join(Document, AccountingEntryHeader.document_id == Document.id).filter(Document.client_id == client_id)
    
    if status:
        query = query.filter(AccountingEntryHeader.status == status)
    if journal_type:
        query = query.filter(AccountingEntryHeader.journal_type == journal_type)
    if date_from:
        query = query.filter(AccountingEntryHeader.date >= date_from)
    if date_to:
        query = query.filter(AccountingEntryHeader.date <= date_to)
    
    entries = query.order_by(AccountingEntryHeader.date.desc()).all()
    return entries


@router.get("/entries/{entry_id}", response_model=AccountingEntryHeaderResponse)
def get_accounting_entry(
    entry_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    entry = db.query(AccountingEntryHeader).options(
        joinedload(AccountingEntryHeader.lines).joinedload(AccountingEntryLine.account)
    ).filter(
        AccountingEntryHeader.id == entry_id,
        AccountingEntryHeader.tenant_id == current_user.tenant_id
    ).first()
    
    if not entry:
        raise HTTPException(status_code=404, detail="Écriture introuvable")
    
    return entry


@router.put("/entries/{entry_id}", response_model=AccountingEntryHeaderResponse)
def update_accounting_entry(
    entry_id: str,
    entry_data: AccountingEntryHeaderUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    entry = db.query(AccountingEntryHeader).filter(
        AccountingEntryHeader.id == entry_id,
        AccountingEntryHeader.tenant_id == current_user.tenant_id
    ).first()
    
    if not entry:
        raise HTTPException(status_code=404, detail="Écriture introuvable")
    
    if entry.status != EntryStatus.DRAFT:
        raise HTTPException(status_code=400, detail="Seules les écritures en brouillon peuvent être modifiées")
    
    for field, value in entry_data.dict(exclude_unset=True).items():
        setattr(entry, field, value)
    
    db.commit()
    db.refresh(entry)
    
    return entry


@router.post("/entries/{entry_id}/validate")
def validate_entry(
    entry_id: str,
    validation: ValidationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    entry = db.query(AccountingEntryHeader).filter(
        AccountingEntryHeader.id == entry_id,
        AccountingEntryHeader.tenant_id == current_user.tenant_id
    ).first()
    
    if not entry:
        raise HTTPException(status_code=404, detail="Écriture introuvable")
    
    if entry.status != EntryStatus.DRAFT:
        raise HTTPException(status_code=400, detail="Cette écriture ne peut pas être validée")
    
    total_debit = sum(line.debit for line in entry.lines)
    total_credit = sum(line.credit for line in entry.lines)
    
    if abs(total_debit - total_credit) > Decimal("0.01"):
        raise HTTPException(status_code=400, detail="L'écriture n'est pas équilibrée")
    
    entry.status = EntryStatus.VALIDATED
    entry.validated_by = current_user.id
    entry.validated_at = datetime.now().date()
    
    revision = AccountingRevision(
        tenant_id=current_user.tenant_id,
        entry_id=entry.id,
        revision_type="validation",
        old_value="draft",
        new_value="validated",
        comment=validation.comment,
        revised_by=current_user.id
    )
    db.add(revision)
    
    db.commit()
    
    return {"message": "Écriture validée avec succès", "entry_id": str(entry.id)}


@router.post("/entries/search", response_model=List[AccountingEntryHeaderResponse])
async def search_entries(
    criteria: EntrySearchCriteria,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Recherche avancée d'écritures comptables avec filtres multiples
    """
    query = db.query(AccountingEntryHeader).options(
        joinedload(AccountingEntryHeader.lines).joinedload(AccountingEntryLine.account)
    ).filter(
        AccountingEntryHeader.tenant_id == current_user.tenant_id
    )
    
    # Filtres de base
    if criteria.journal_types:
        query = query.filter(AccountingEntryHeader.journal_type.in_(criteria.journal_types))
    
    if criteria.statuses:
        query = query.filter(AccountingEntryHeader.status.in_(criteria.statuses))
    
    if criteria.date_from:
        query = query.filter(AccountingEntryHeader.date >= criteria.date_from)
    
    if criteria.date_to:
        query = query.filter(AccountingEntryHeader.date <= criteria.date_to)
    
    if criteria.reference:
        query = query.filter(AccountingEntryHeader.reference.ilike(f"%{criteria.reference}%"))
    
    if criteria.description:
        query = query.filter(AccountingEntryHeader.description.ilike(f"%{criteria.description}%"))
    
    # Filtres sur les lignes d'écriture
    if any([criteria.account_number, criteria.partner_id, criteria.analytic_code]):
        query = query.join(AccountingEntryHeader.lines)
        
        if criteria.account_number:
            query = query.join(AccountingEntryLine.account)
            query = query.filter(LedgerAccount.account_number.ilike(f"{criteria.account_number}%"))
        
        if criteria.partner_id:
            query = query.filter(AccountingEntryLine.partner_id == criteria.partner_id)
            
        if criteria.analytic_code:
            query = query.filter(AccountingEntryLine.analytic_code == criteria.analytic_code)
    
    # Tri et pagination
    if criteria.sort_by:
        sort_field = getattr(AccountingEntryHeader, criteria.sort_by, None)
        if sort_field is not None:
            query = query.order_by(
                sort_field.asc() if criteria.sort_order == "asc" else sort_field.desc()
            )
    else:
        query = query.order_by(AccountingEntryHeader.date.desc())
    
    if criteria.limit:
        query = query.limit(criteria.limit)
    
    if criteria.offset:
        query = query.offset(criteria.offset)
    
    return query.all()


@router.get("/entries/export/{format}")
async def export_entries(
    format: EntryExportFormat,
    criteria: EntrySearchCriteria = Depends(),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Export des écritures dans différents formats (CSV, Excel, FEC, PDF)
    """
    # Récupère les écritures selon les critères
    entries = await search_entries(criteria, current_user, db)
    
    if format == EntryExportFormat.CSV:
        return export_entries_to_csv(entries)
    elif format == EntryExportFormat.EXCEL:
        return export_entries_to_excel(entries)
    elif format == EntryExportFormat.PDF:
        return export_entries_to_pdf(entries)
    elif format == EntryExportFormat.FEC:
        return export_entries_to_fec(entries, current_user.tenant_id)
    else:
        raise HTTPException(status_code=400, detail="Format d'export non supporté")


def export_entries_to_csv(entries: List[AccountingEntryHeader]):
    """Exporte les écritures au format CSV"""
    output = io.StringIO()
    writer = csv.writer(output, delimiter=';')
    
    # En-têtes
    writer.writerow([
        "Date", "Journal", "Pièce", "Référence", "Compte", "Libellé",
        "Débit", "Crédit", "Tiers", "Code Analytique"
    ])
    
    # Données
    for entry in entries:
        for line in entry.lines:
            writer.writerow([
                entry.date.isoformat(),
                entry.journal_type,
                entry.entry_number,
                entry.reference or "",
                line.account.account_number if line.account else "",
                line.label or "",
                str(line.debit) if line.debit else "",
                str(line.credit) if line.credit else "",
                line.partner_id or "",
                line.analytic_code or ""
            ])
    
    output.seek(0)
    return StreamingResponse(
        iter(["\ufeff" + output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=export_ecritures_{date.today().isoformat()}.csv",
            "Content-Type": "text/csv; charset=utf-8"
        }
    )


def export_entries_to_pdf(entries: List[AccountingEntryHeader]):
    """Exporte les écritures au format PDF"""
    rows = []
    for entry in entries:
        for line in entry.lines:
            rows.append(
                "<tr>"
                f"<td>{entry.date.isoformat()}</td>"
                f"<td>{entry.journal_type}</td>"
                f"<td>{entry.entry_number}</td>"
                f"<td>{(entry.reference or '')}</td>"
                f"<td>{(line.account.account_number if line.account else '')}</td>"
                f"<td>{(line.label or '')}</td>"
                f"<td style='text-align:right'>{(line.debit or 0)}</td>"
                f"<td style='text-align:right'>{(line.credit or 0)}</td>"
                "</tr>"
            )

    html = (
        "<html><head><meta charset='utf-8'>"
        "<style>"
        "body{font-family:Arial, sans-serif;font-size:12px;}"
        "table{width:100%;border-collapse:collapse;}"
        "th,td{border:1px solid #ddd;padding:6px;}"
        "th{background:#f2f2f2;text-align:left;}"
        "</style></head><body>"
        "<h2>Export écritures comptables</h2>"
        f"<div>Généré le {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</div>"
        "<br/>"
        "<table>"
        "<thead><tr>"
        "<th>Date</th><th>Journal</th><th>Pièce</th><th>Référence</th>"
        "<th>Compte</th><th>Libellé</th><th>Débit</th><th>Crédit</th>"
        "</tr></thead>"
        "<tbody>" + "".join(rows) + "</tbody>"
        "</table>"
        "</body></html>"
    )

    pdf_bytes = HTML(string=html).write_pdf()
    output = io.BytesIO(pdf_bytes)
    output.seek(0)
    return StreamingResponse(
        output,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=export_ecritures_{date.today().isoformat()}.pdf"
        }
    )


def export_entries_to_excel(entries: List[AccountingEntryHeader]):
    """Exporte les écritures au format Excel (XLSX)"""
    try:
        import pandas as pd
        from io import BytesIO
        
        # Création d'un DataFrame avec les données
        data = []
        for entry in entries:
            for line in entry.lines:
                data.append({
                    "Date": entry.date,
                    "Journal": entry.journal_type,
                    "Pièce": entry.entry_number,
                    "Référence": entry.reference or "",
                    "Compte": line.account.account_number if line.account else "",
                    "Libellé": line.label or "",
                    "Débit": float(line.debit) if line.debit else 0.0,
                    "Crédit": float(line.credit) if line.credit else 0.0,
                    "Tiers": line.partner_id or "",
                    "Code Analytique": line.analytic_code or ""
                })
        
        df = pd.DataFrame(data)
        
        # Création du fichier Excel en mémoire
        output = BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='Écritures')
        
        output.seek(0)
        
        return StreamingResponse(
            output,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename=export_ecritures_{date.today().isoformat()}.xlsx"}
        )
    except ImportError:
        raise HTTPException(status_code=500, detail="Le module pandas est requis pour l'export Excel")


def export_entries_to_fec(entries: List[AccountingEntryHeader], tenant_id: str):
    """Exporte les écritures au format FEC (Fichier des Écritures Comptables)"""
    output = io.StringIO()
    writer = csv.writer(output, delimiter='|')
    
    # En-tête FEC
    writer.writerow([
        "JournalCode", "JournalLib", "EcritureNum", "EcritureDate",
        "CompteNum", "CompteLib", "CompAuxNum", "CompAuxLib",
        "PieceRef", "PieceDate", "EcritureLib", "Debit", "Credit",
        "EcritureLet", "DateLet", "ValidDate", "Montantdevise",
        "Idevise", "DateRglt", "ModeRglt"
    ])
    
    # Données FEC
    for entry in entries:
        for line in entry.lines:
            writer.writerow([
                entry.journal_type,  # JournalCode
                str(entry.journal_type),  # JournalLib
                entry.entry_number,  # EcritureNum
                entry.date.strftime("%Y%m%d"),  # EcritureDate
                line.account.account_number if line.account else "",  # CompteNum
                line.account.name if line.account else "",  # CompteLib
                line.partner_id or "",  # CompAuxNum
                "",  # CompAuxLib (à compléter si nécessaire)
                entry.reference or "",  # PieceRef
                entry.date.strftime("%Y%m%d"),  # PieceDate
                line.label or "",  # EcritureLib
                str(line.debit) if line.debit else "0.00",  # Debit
                str(line.credit) if line.credit else "0.00",  # Credit
                "", "", "", "", "", "", ""  # Champs optionnels
            ])
    
    output.seek(0)
    
    # Nom du fichier FEC selon la norme
    siren = tenant_id.replace("-", "")[:9]  # Format SIREN sur 9 chiffres
    fec_filename = f"FEC_{siren}_{date.today().strftime('%Y%m%d')}.txt"
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/plain",
        headers={"Content-Disposition": f"attachment; filename={fec_filename}"}
    )


@router.post("/entries/batch/validate")
async def batch_validate_entries(
    entry_ids: List[str],
    comment: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Valide plusieurs écritures en une seule opération"""
    if not entry_ids:
        raise HTTPException(status_code=400, detail="Aucune écriture spécifiée")
    
    updated_count = 0
    errors = []
    
    for entry_id in entry_ids:
        try:
            entry = db.query(AccountingEntryHeader).filter(
                AccountingEntryHeader.id == entry_id,
                AccountingEntryHeader.tenant_id == current_user.tenant_id
            ).first()
            
            if not entry:
                errors.append(f"Écriture {entry_id} non trouvée")
                continue
                
            if entry.status != EntryStatus.DRAFT:
                errors.append(f"L'écriture {entry_id} n'est pas en statut brouillon")
                continue
                
            # Vérification de l'équilibre
            total_debit = sum(line.debit for line in entry.lines)
            total_credit = sum(line.credit for line in entry.lines)
            
            if abs(total_debit - total_credit) > Decimal("0.01"):
                errors.append(f"L'écriture {entry_id} n'est pas équilibrée")
                continue
                
            # Validation de l'écriture
            entry.status = EntryStatus.VALIDATED
            entry.validated_by = current_user.id
            entry.validated_at = datetime.now()
            
            # Création d'une révision
            revision = AccountingRevision(
                tenant_id=current_user.tenant_id,
                entry_id=entry.id,
                revision_type="batch_validation",
                old_value="draft",
                new_value="validated",
                comment=comment or "Validation par lot",
                revised_by=current_user.id
            )
            db.add(revision)
            
            updated_count += 1
            
        except Exception as e:
            errors.append(f"Erreur lors de la validation de l'écriture {entry_id}: {str(e)}")
    
    db.commit()
    
    return {
        "success": True,
        "validated_count": updated_count,
        "error_count": len(errors),
        "errors": errors
    }


@router.post("/entries/batch/delete")
async def batch_delete_entries(
    entry_ids: List[str],
    comment: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Supprime plusieurs écritures en une seule opération"""
    if not entry_ids:
        raise HTTPException(status_code=400, detail="Aucune écriture spécifiée")
    
    deleted_count = 0
    errors = []
    
    for entry_id in entry_ids:
        try:
            entry = db.query(AccountingEntryHeader).filter(
                AccountingEntryHeader.id == entry_id,
                AccountingEntryHeader.tenant_id == current_user.tenant_id
            ).first()
            
            if not entry:
                errors.append(f"Écriture {entry_id} non trouvée")
                continue
                
            if entry.status == EntryStatus.POSTED:
                errors.append(f"Impossible de supprimer une écriture comptabilisée ({entry_id})")
                continue
                
            # Création d'une révision avant suppression
            revision = AccountingRevision(
                tenant_id=current_user.tenant_id,
                entry_id=entry.id,
                revision_type="deletion",
                old_value=entry.status.value,
                new_value="deleted",
                comment=comment,
                revised_by=current_user.id
            )
            db.add(revision)
            
            # Suppression des lignes d'écriture
            db.query(AccountingEntryLine).filter(
                AccountingEntryLine.entry_id == entry.id,
                AccountingEntryLine.tenant_id == current_user.tenant_id
            ).delete()
            
            # Suppression de l'entête
            db.delete(entry)
            deleted_count += 1
            
        except Exception as e:
            errors.append(f"Erreur lors de la suppression de l'écriture {entry_id}: {str(e)}")
    
    db.commit()
    
    return {
        "success": True,
        "deleted_count": deleted_count,
        "error_count": len(errors),
        "errors": errors
    }


@router.post("/entries/batch/export")
async def batch_export_entries(
    entry_ids: List[str],
    format: EntryExportFormat,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Exporte des écritures spécifiques dans le format demandé"""
    if not entry_ids:
        raise HTTPException(status_code=400, detail="Aucune écriture spécifiée")
    
    # Récupération des écritures demandées
    entries = db.query(AccountingEntryHeader).options(
        joinedload(AccountingEntryHeader.lines).joinedload(AccountingEntryLine.account)
    ).filter(
        AccountingEntryHeader.id.in_(entry_ids),
        AccountingEntryHeader.tenant_id == current_user.tenant_id
    ).all()
    
    if not entries:
        raise HTTPException(status_code=404, detail="Aucune écriture trouvée avec les IDs fournis")
    
    # Appel à la fonction d'export appropriée
    if format == EntryExportFormat.CSV:
        return export_entries_to_csv(entries)
    elif format == EntryExportFormat.EXCEL:
        return export_entries_to_excel(entries)
    elif format == EntryExportFormat.FEC:
        return export_entries_to_fec(entries, current_user.tenant_id)
    else:
        raise HTTPException(status_code=400, detail="Format d'export non supporté")


@router.post("/entries/{entry_id}/post")
async def post_entry(
    entry_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Comptabilise une écriture (passe de l'état 'validated' à 'posted')
    """
    entry = db.query(AccountingEntryHeader).filter(
        AccountingEntryHeader.id == entry_id,
        AccountingEntryHeader.tenant_id == current_user.tenant_id
    ).first()
    
    if not entry:
        raise HTTPException(status_code=404, detail="Écriture introuvable")
    
    if entry.status != EntryStatus.VALIDATED:
        raise HTTPException(status_code=400, detail="Seules les écritures validées peuvent être comptabilisées")
    
    # Vérifier que l'écriture est équilibrée
    total_debit = sum(line.debit for line in entry.lines)
    total_credit = sum(line.credit for line in entry.lines)
    
    if abs(total_debit - total_credit) > Decimal("0.01"):
        raise HTTPException(status_code=400, detail="L'écriture n'est pas équilibrée")
    
    # Mettre à jour les soldes des comptes
    for line in entry.lines:
        account = db.query(LedgerAccount).filter(
            LedgerAccount.id == line.account_id,
            LedgerAccount.tenant_id == current_user.tenant_id
        ).with_for_update().first()
        
        if account:
            account.balance += (line.debit - line.credit)
    
    # Mettre à jour le statut
    entry.status = EntryStatus.POSTED
    entry.posted_by = current_user.id
    entry.posted_at = datetime.now()
    
    # Créer une révision
    revision = AccountingRevision(
        tenant_id=current_user.tenant_id,
        entry_id=entry.id,
        revision_type="posting",
        old_value="validated",
        new_value="posted",
        comment="Écriture comptabilisée",
        revised_by=current_user.id
    )
    db.add(revision)
    
    db.commit()
    db.refresh(entry)
    
    return {"message": "Écriture comptabilisée avec succès", "entry_id": str(entry.id)}


@router.post("/lettrage/")
def lettrage_entries(
    lettrage: LettrageRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    lines = db.query(AccountingEntryLine).filter(
        AccountingEntryLine.id.in_(lettrage.line_ids),
        AccountingEntryLine.tenant_id == current_user.tenant_id
    ).all()
    
    if len(lines) != len(lettrage.line_ids):
        raise HTTPException(status_code=404, detail="Certaines lignes sont introuvables")
    
    total_debit = sum(line.debit for line in lines)
    total_credit = sum(line.credit for line in lines)
    
    if abs(total_debit - total_credit) > Decimal("0.01"):
        raise HTTPException(
            status_code=400, 
            detail=f"Les lignes ne sont pas équilibrées: Débit={total_debit}, Crédit={total_credit}"
        )
    
    for line in lines:
        line.reconciled = True
        line.reconciliation_ref = lettrage.reconciliation_ref
    
    db.commit()
    
    return {"message": "Lettrage effectué avec succès", "reconciliation_ref": lettrage.reconciliation_ref}


@router.post("/reconciliation/", response_model=BankReconciliationResponse)
def create_bank_reconciliation(
    reconciliation_data: BankReconciliationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    book_balance = Decimal("0.00")
    
    reconciliation = BankReconciliation(
        tenant_id=current_user.tenant_id,
        bank_account_id=reconciliation_data.bank_account_id,
        period_start=reconciliation_data.period_start,
        period_end=reconciliation_data.period_end,
        statement_balance=reconciliation_data.statement_balance,
        book_balance=book_balance,
        difference=reconciliation_data.statement_balance - book_balance,
        status="in_progress"
    )
    
    db.add(reconciliation)
    db.commit()
    db.refresh(reconciliation)
    
    return reconciliation


@router.get("/reconciliation/", response_model=List[BankReconciliationResponse])
def get_bank_reconciliations(
    bank_account_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(BankReconciliation).filter(
        BankReconciliation.tenant_id == current_user.tenant_id
    )
    
    if bank_account_id:
        query = query.filter(BankReconciliation.bank_account_id == bank_account_id)
    
    reconciliations = query.order_by(BankReconciliation.period_end.desc()).all()
    return reconciliations


@router.get("/revisions/{entry_id}", response_model=List[AccountingRevisionResponse])
def get_entry_revisions(
    entry_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    revisions = db.query(AccountingRevision).filter(
        AccountingRevision.entry_id == entry_id,
        AccountingRevision.tenant_id == current_user.tenant_id
    ).order_by(AccountingRevision.created_at.desc()).all()
    
    return revisions


@router.delete("/entries/{entry_id}")
def delete_entry(
    entry_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    entry = db.query(AccountingEntryHeader).filter(
        AccountingEntryHeader.id == entry_id,
        AccountingEntryHeader.tenant_id == current_user.tenant_id
    ).first()
    
    if not entry:
        raise HTTPException(status_code=404, detail="Écriture introuvable")
    
    if entry.status == EntryStatus.POSTED:
        raise HTTPException(status_code=400, detail="Les écritures comptabilisées ne peuvent pas être supprimées")
    
    db.delete(entry)
    db.commit()
    
    return {"message": "Écriture supprimée avec succès"}


@router.post("/import/fec")
async def import_fec_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Importe un Fichier des Écritures Comptables (FEC).
    Accepte .txt ou .csv. Détecte automatiquement le format.
    """
    try:
        content = await file.read()
        service = FECImporterService(db, str(current_user.tenant_id), str(current_user.id))
        stats = service.process_file(content, file.filename)
        return {"message": "Import FEC réussi", "stats": stats}
    except Exception as e:
        logger.error(f"Erreur import FEC: {e}")
        raise HTTPException(status_code=400, detail=str(e))
