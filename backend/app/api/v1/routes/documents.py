from typing import List, Optional, Any
from uuid import UUID
from datetime import date
from pydantic import BaseModel

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core import deps
from app.models.document import Document, DocumentStatus
from app.models.user import User
from app.schemas.document import Document as DocumentSchema
from app.schemas.document import DocumentCreate, DocumentUpdate
from app.services.ocr import ocr_service
from app.services.storage import storage_service

router = APIRouter()


@router.post("/", response_model=DocumentSchema)
async def upload_document(
    *,
    db: Session = Depends(deps.get_db_session),
    file: UploadFile = File(...),
    current_user: User = Depends(deps.get_current_user),
    client_id: Optional[UUID] = None, # Made optional - can be linked later
) -> Any:
    """
    Upload a new document, save to storage, and trigger OCR.
    """
    try:
        # Validate file
        if not file.filename:
            raise HTTPException(status_code=400, detail="Nom de fichier manquant")
        
        # Check file size (max 50MB)
        file.file.seek(0, 2)  # Seek to end
        file_size = file.file.tell()
        file.file.seek(0)  # Reset to start
        
        if file_size > 50 * 1024 * 1024:  # 50MB
            raise HTTPException(status_code=413, detail="Fichier trop volumineux (max 50MB)")
        
        # 1. Upload to Storage
        upload_result = await storage_service.upload_file(file, tenant_id=str(current_user.tenant_id))

        # Extract file path from upload result (storage service returns a dict)
        if isinstance(upload_result, dict):
            file_path = upload_result.get('key') or upload_result.get('url') or upload_result.get('path')
            file_size = upload_result.get('size', file_size)
        else:
            # Fallback if it's a string (old behavior)
            file_path = str(upload_result)
            file.file.seek(0, 2)
            file_size = file.file.tell()
            file.file.seek(0)

        # 2. Create Document in DB
        doc_data = {
            "filename": file.filename,
            "original_filename": file.filename,
            "file_path": file_path,
            "content_type": file.content_type or "application/octet-stream",
            "file_size": file_size,
            "file_extension": f".{file.filename.split('.')[-1]}" if '.' in file.filename else "",
            "status": DocumentStatus.OCR_PROCESSING,
            "tenant_id": current_user.tenant_id,
            "uploaded_by": current_user.id,
        }

        # Add client_id only if provided
        if client_id:
            doc_data["client_id"] = client_id

        db_obj = Document(**doc_data)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        
        # 4. Process with OCR (Mindee) - Non-blocking
        try:
            ocr_data = await ocr_service.process_invoice(file_path)

            # Update document with OCR data
            db_obj.reference_number = ocr_data.get("reference_number")
            db_obj.document_date = ocr_data.get("date")  # Use document_date field
            db_obj.due_date = ocr_data.get("due_date")
            db_obj.amount_ht = ocr_data.get("amount_ht")
            db_obj.amount_vat = ocr_data.get("amount_vat")
            db_obj.amount_ttc = ocr_data.get("amount_ttc")
            db_obj.currency = ocr_data.get("currency")
            db_obj.ocr_data = ocr_data  # Store full OCR data
            db_obj.ocr_confidence = ocr_data.get("confidence", 0.0)
            db_obj.status = DocumentStatus.OCR_COMPLETED

            db.commit()
            db.refresh(db_obj)

        except Exception as ocr_error:
            print(f"OCR Error: {ocr_error}")
            # Set status to UPLOADED if OCR fails
            db_obj.status = DocumentStatus.UPLOADED
            db.commit()
            db.refresh(db_obj)
            # Continue without failing the upload

        return db_obj
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Log the error for debugging
        print(f"Upload error: {str(e)}")
        import traceback
        traceback.print_exc()
        
        # Raise a more informative error
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de l'upload du document: {str(e)}"
        )


@router.get("/", response_model=List[DocumentSchema])
def read_documents(
    db: Session = Depends(deps.get_db_session),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_user),
    client_id: Optional[UUID] = None,
) -> Any:
    """
    Retrieve documents filtered by tenant.
    """
    try:
        # Filtrer par tenant_id de l'utilisateur pour la sécurité
        query = db.query(Document).filter(Document.tenant_id == current_user.tenant_id)
        
        # Filtrer par client si spécifié
        if client_id:
            query = query.filter(Document.client_id == client_id)
        
        documents = query.order_by(Document.created_at.desc()).offset(skip).limit(limit).all()
        return documents
        
    except Exception as e:
        print(f"Error fetching documents: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de la récupération des documents: {str(e)}"
        )


@router.get("/{id}", response_model=DocumentSchema)
def read_document(
    *,
    db: Session = Depends(deps.get_db_session),
    id: UUID,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get document by ID.
    """
    document = db.query(Document).filter(Document.id == id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    return document


@router.patch("/{id}", response_model=DocumentSchema)
def update_document(
    *,
    db: Session = Depends(deps.get_db_session),
    id: UUID,
    document_in: DocumentUpdate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Update a document.
    """
    document = db.query(Document).filter(Document.id == id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
        
    update_data = document_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(document, field, value)
        
    db.add(document)
    db.commit()
    db.refresh(document)
    return document


from app.models.accounting import AccountingEntry, EntryType
from app.models.supplier import Supplier
from decimal import Decimal
from datetime import date
from pydantic import BaseModel

class ValidationData(BaseModel):
    date: date
    supplier_name: str
    total_amount: Decimal
    tax_amount: Decimal
    description: str
    # Accounting overrides
    account_number: Optional[str] = None
    journal_code: Optional[str] = "ACH"

@router.post("/{document_id}/validate", response_model=DocumentSchema)
def validate_document(
    *,
    db: Session = Depends(deps.get_db_session),
    document_id: UUID,
    validation_data: ValidationData,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Validate a document and generate accounting entries.
    """
    document = db.query(Document).filter(Document.id == document_id, Document.tenant_id == current_user.tenant_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    # 1. Update Document Metadata
    document.status = DocumentStatus.VALIDATED
    document.total_amount = validation_data.total_amount
    document.tax_amount = validation_data.tax_amount
    # document.extracted_data = validation_data.model_dump(mode='json') # Optional: update extracted data
    
    # 2. Manage Supplier & Rules
    supplier = db.query(Supplier).filter(Supplier.name == validation_data.supplier_name, Supplier.tenant_id == current_user.tenant_id).first()
    if not supplier:
        supplier = Supplier(name=validation_data.supplier_name, tenant_id=current_user.tenant_id)
        db.add(supplier)
        db.flush() # Get ID
    
    # Update rules if provided
    if validation_data.account_number:
        supplier.default_account = validation_data.account_number
    if validation_data.journal_code:
        supplier.default_journal = validation_data.journal_code
    
    # 3. Generate Accounting Entries (Simple Schema: Expense + VAT = Payable)
    # Expense Line (Debit)
    expense_account = validation_data.account_number or supplier.default_account or "601000"
    ht_amount = validation_data.total_amount - validation_data.tax_amount
    
    entry_expense = AccountingEntry(
        document_id=document.id,
        entry_type=EntryType.DEBIT,
        account_number=expense_account,
        label=validation_data.description,
        debit=ht_amount,
        credit=0,
        date=validation_data.date,
        journal_code=validation_data.journal_code or "ACH",
        tenant_id=current_user.tenant_id
    )
    db.add(entry_expense)
    
    # VAT Line (Debit)
    if validation_data.tax_amount > 0:
        entry_vat = AccountingEntry(
            document_id=document.id,
            entry_type=EntryType.DEBIT,
            account_number="445200", # TVA Récupérable
            label=f"TVA sur {validation_data.description}",
            debit=validation_data.tax_amount,
            credit=0,
            date=validation_data.date,
            journal_code=validation_data.journal_code or "ACH",
            tenant_id=current_user.tenant_id
        )
        db.add(entry_vat)
        
    # Payable Line (Credit)
    entry_payable = AccountingEntry(
        document_id=document.id,
        entry_type=EntryType.CREDIT,
        account_number="401100", # Fournisseurs
        label=f"Facture {validation_data.supplier_name}",
        debit=0,
        credit=validation_data.total_amount,
        date=validation_data.date,
        journal_code=validation_data.journal_code or "ACH",
        tenant_id=current_user.tenant_id
    )
    db.add(entry_payable)

    db.commit()
    db.refresh(document)
    return document
