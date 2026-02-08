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
            # Certains documents ne sont pas trouvés ou pas au statut VALIDEE
            # On continue avec ceux qu'on a trouvés, ou on bloque ?
            # Pour la cohérence, on va filtrer ceux qui sont valides
            valid_ids = [str(d.id) for d in documents]
            invalid_ids = set(export_request.document_ids) - set(valid_ids)
            print(f"⚠️ {len(invalid_ids)} documents ignorés car non valides/introuvables: {invalid_ids}")
            
            if not documents:
                raise HTTPException(
                    status_code=400, 
                    detail="Aucun document valide pour l'export (vérifiez s'ils sont déjà exportés)"
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
                # Use nested transaction to isolate each document export
                # If one fails, it won't break the entire batch commit
                with db.begin_nested():
                    # Generate accounting entries
                    # entry_generator = AccountingEntryGenerator(db, current_user.tenant_id)
                    
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
                    db.flush() # Flush to get entry_header.id
                    
                    # Generate entry lines based on document data
                 # Generate entry lines based on document data
                    lines = []
                    
                    # --- Determine Accounts to Use ---
                    # Use accounts from document (set by rules/validation) or fallbacks
                    
                    # 1. Charge/Product Account (6xxx or 7xxx)
                    charge_account = document.charge_account or (
                        '607000' if document.type == 'INVOICE_PURCHASE' else '707000'
                    )
                    
                    # 2. VAT Account (445x)
                    vat_account = document.vat_account or (
                        '445660' if document.type == 'INVOICE_PURCHASE' else '445710'
                    )
                    
                    # 3. Third Party Account (401x or 411x)
                    third_party_account = document.supplier_account 
                    if not third_party_account:
                        if document.type == 'INVOICE_PURCHASE':
                            third_party_account = '401000'
                        else:
                            third_party_account = '411000'
                            
                    # --- Determine Labels ---
                    supplier_label = document.supplier_name or 'Fournisseur Inconnu'
                    
                    # Handle Client Name safely (Document model has client relationship but not client_name column)
                    client_label = 'Client Inconnu'
                    if document.client:
                        client_label = document.client.name
                    elif document.ai_extracted_data and 'customer_name' in document.ai_extracted_data:
                        client_label = document.ai_extracted_data['customer_name'] or 'Client Inconnu'
                    elif document.ocr_data and 'customer_name' in document.ocr_data:
                        client_label = document.ocr_data['customer_name'] or 'Client Inconnu'

                    if document.type == 'INVOICE_PURCHASE':
                        # Purchase invoice: Debit expense, VAT, Credit supplier
                        lines = [
                            AccountingEntryLine(
                                entry_header_id=entry_header.id,
                                tenant_id=current_user.tenant_id,
                                account_code=charge_account,
                                debit=document.amount_ht or (document.amount_ttc or 0) / 1.2,
                                credit=0,
                                description=f"Achat - {supplier_label}"
                            ),
                            AccountingEntryLine(
                                entry_header_id=entry_header.id,
                                tenant_id=current_user.tenant_id,
                                account_code=vat_account,
                                debit=(document.amount_ttc or 0) - (document.amount_ht or (document.amount_ttc or 0) / 1.2),
                                credit=0,
                                description="TVA déductible"
                            ),
                            AccountingEntryLine(
                                entry_header_id=entry_header.id,
                                tenant_id=current_user.tenant_id,
                                account_code=third_party_account,
                                debit=0,
                                credit=document.amount_ttc or 0,
                                description=f"Fournisseur - {supplier_label}"
                            )
                        ]
                    elif document.type == 'INVOICE_SALES':
                        # Sales invoice: Debit customer, Credit revenue, VAT
                        lines = [
                            AccountingEntryLine(
                                entry_header_id=entry_header.id,
                                tenant_id=current_user.tenant_id,
                                account_code=third_party_account,
                                debit=document.amount_ttc or 0,
                                credit=0,
                                description=f"Client - {client_label}"
                            ),
                            AccountingEntryLine(
                                entry_header_id=entry_header.id,
                                tenant_id=current_user.tenant_id,
                                account_code=charge_account,
                                debit=0,
                                credit=document.amount_ht or (document.amount_ttc or 0) / 1.2,
                                description="Ventes de marchandises"
                            ),
                            AccountingEntryLine(
                                entry_header_id=entry_header.id,
                                tenant_id=current_user.tenant_id,
                                account_code=vat_account,
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
                    db.add(document) # Explicit add to ensure tracking
                
                # If we are here, nested transaction succeeded
                exported_count += 1
                print(f"✅ Document {document.id} exported successfully")
                
            except Exception as e:
                print(f"❌ Error exporting document {document.id}: {e}")
                errors.append(f"Document {document.reference_number}: {str(e)}")
                # Nested transaction is automatically rolled back by context manager on exception
                continue
        
        # Commit all successful exports
        db.commit()
        
        # Invalider le cache des stats pour mise à jour immédiate
        from app.core.cache import clear_cache
        clear_cache(pattern="dashboard")
        
        if errors:
            print(f"⚠️ Export completed with {len(errors)} errors")
            return {
                "success": True,
                "exported_count": exported_count,
                "total_count": len(documents),
                "errors": errors
            }
        else:
            print(f"🎉 Export completed successfully - {exported_count} documents")
            return {
                "success": True,
                "exported_count": exported_count,
                "total_count": len(documents),
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
