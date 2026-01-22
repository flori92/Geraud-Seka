from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import uuid
from pydantic import BaseModel

from app.api.deps import get_db_session, get_current_user
from app.models.user import User
from app.models.document import Document, DocumentStatus
from app.models.accounting_entries import AccountingEntryHeader, AccountingEntryLine
from app.services.accounting_entry_generator import AccountingEntryGenerator

router = APIRouter()

class ExportRequest(BaseModel):
    document_ids: List[str]

@router.post("/export")
def export_documents(
    export_request: ExportRequest,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
):
    """
    Export documents to accounting system.
    """
    try:
        print(f"📤 Export request received for {len(export_request.document_ids)} documents")
        
        # Validate documents
        documents = db.query(Document).filter(
            Document.id.in_(export_request.document_ids),
            Document.tenant_id == current_user.tenant_id,
            Document.status == DocumentStatus.VALIDEE
        ).all()
        
        if len(documents) != len(export_request.document_ids):
            raise HTTPException(
                status_code=400, 
                detail="Some documents are not valid for export"
            )
        
        # Bloquer l'export si un doublon est en attente pour un des documents
        from app.models.duplicate import DocumentDuplicate
        pending_duplicates = db.query(DocumentDuplicate).filter(
            DocumentDuplicate.new_document_id.in_(export_request.document_ids),
            DocumentDuplicate.resolution.is_(None)
        ).all()
        if pending_duplicates:
            raise HTTPException(
                status_code=422,
                detail="Impossible d'exporter des documents avec des doublons en attente de résolution."
            )
        
        exported_count = 0
        errors = []
        
        for document in documents:
            try:
                # Generate accounting entries
                entry_generator = AccountingEntryGenerator(db, current_user.tenant_id)
                
                # Determine document type for journal
                if document.type == 'INVOICE_PURCHASE':
                    journal_type = 'ACHAT'
                elif document.type == 'INVOICE_SALES':
                    journal_type = 'VENTE'
                else:
                    journal_type = 'BANQUE'
                
                # Create accounting entry header
                entry_header = AccountingEntryHeader(
                    tenant_id=current_user.tenant_id,
                    journal_type=journal_type,
                    entry_date=datetime.utcnow(),
                    reference_number=document.reference_number,
                    description=f"Export automatique - {document.filename}",
                    total_amount=document.amount_ttc or 0,
                    created_by_id=current_user.id,
                    document_id=document.id
                )
                
                db.add(entry_header)
                db.flush()
                
                # Generate entry lines based on document data
                if document.type == 'INVOICE_PURCHASE':
                    # Purchase invoice: Debit expense, VAT, Credit supplier
                    lines = [
                        AccountingEntryLine(
                            entry_header_id=entry_header.id,
                            tenant_id=current_user.tenant_id,
                            account_code='607000',  # Achats de marchandises
                            debit=document.amount_ht or (document.amount_ttc or 0) / 1.2,
                            credit=0,
                            description=f"Achat - {document.supplier_name or 'Fournisseur'}"
                        ),
                        AccountingEntryLine(
                            entry_header_id=entry_header.id,
                            tenant_id=current_user.tenant_id,
                            account_code='445660',  # TVA déductible
                            debit=(document.amount_ttc or 0) - (document.amount_ht or (document.amount_ttc or 0) / 1.2),
                            credit=0,
                            description="TVA déductible"
                        ),
                        AccountingEntryLine(
                            entry_header_id=entry_header.id,
                            tenant_id=current_user.tenant_id,
                            account_code='401000',  # Fournisseurs
                            debit=0,
                            credit=document.amount_ttc or 0,
                            description=f"Fournisseur - {document.supplier_name or 'N/A'}"
                        )
                    ]
                elif document.type == 'INVOICE_SALES':
                    # Sales invoice: Debit customer, Credit revenue, VAT
                    lines = [
                        AccountingEntryLine(
                            entry_header_id=entry_header.id,
                            tenant_id=current_user.tenant_id,
                            account_code='411000',  # Clients
                            debit=document.amount_ttc or 0,
                            credit=0,
                            description=f"Client - {document.client_name or 'N/A'}"
                        ),
                        AccountingEntryLine(
                            entry_header_id=entry_header.id,
                            tenant_id=current_user.tenant_id,
                            account_code='707000',  # Ventes de marchandises
                            debit=0,
                            credit=document.amount_ht or (document.amount_ttc or 0) / 1.2,
                            description="Ventes de marchandises"
                        ),
                        AccountingEntryLine(
                            entry_header_id=entry_header.id,
                            tenant_id=current_user.tenant_id,
                            account_code='445710',  # TVA collectée
                            debit=0,
                            credit=(document.amount_ttc or 0) - (document.amount_ht or (document.amount_ttc or 0) / 1.2),
                            description="TVA collectée"
                        )
                    ]
                else:
                    # Default entry for other document types
                    lines = [
                        AccountingEntryLine(
                            entry_header_id=entry_header.id,
                            tenant_id=current_user.tenant_id,
                            account_code='512000',  # Banque
                            debit=document.amount_ttc or 0,
                            credit=0,
                            description=f"Document - {document.filename}"
                        )
                    ]
                
                # Add all lines
                for line in lines:
                    db.add(line)
                
                # Update document status
                document.status = DocumentStatus.EXPORTED
                document.exported_at = datetime.utcnow()
                document.accounting_entry_id = entry_header.id
                
                exported_count += 1
                print(f"✅ Document {document.id} exported successfully")
                
            except Exception as e:
                print(f"❌ Error exporting document {document.id}: {e}")
                errors.append(f"Document {document.reference_number}: {str(e)}")
                continue
        
        db.commit()
        
        # Invalider le cache des stats pour mise à jour immédiate
        from app.core.cache import clear_cache
        clear_cache(pattern="dashboard")
        
        if errors:
            print(f"⚠️ Export completed with {len(errors)} errors")
            return {
                "success": True,
                "exported_count": exported_count,
                "total_count": len(export_request.document_ids),
                "errors": errors
            }
        else:
            print(f"🎉 Export completed successfully - {exported_count} documents")
            return {
                "success": True,
                "exported_count": exported_count,
                "total_count": len(export_request.document_ids),
                "errors": []
            }
            
    except Exception as e:
        print(f"❌ Export error: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")

@router.get("/accounting")
def get_accounting_documents(
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
):
    """
    Get documents that have been exported to accounting.
    """
    try:
        documents = db.query(Document).filter(
            Document.tenant_id == current_user.tenant_id,
            Document.status.in_([DocumentStatus.EXPORTED, DocumentStatus.IN_ACCOUNTING])
        ).order_by(Document.exported_at.desc()).all()
        
        return documents
        
    except Exception as e:
        print(f"❌ Error fetching accounting documents: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch accounting documents: {str(e)}")
