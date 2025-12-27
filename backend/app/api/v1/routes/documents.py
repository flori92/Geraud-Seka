from typing import List, Optional, Any
from uuid import UUID
from datetime import date
from decimal import Decimal

from pydantic import BaseModel
from pydantic import model_validator

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
        if not file.filename:
            raise HTTPException(status_code=400, detail="Nom de fichier manquant")
        
        file.file.seek(0, 2)  # Seek to end
        file_size = file.file.tell()
        file.file.seek(0)  # Reset to start
        
        if file_size > 50 * 1024 * 1024:  # 50MB
            raise HTTPException(status_code=413, detail="Fichier trop volumineux (max 50MB)")
        
        upload_result = await storage_service.upload_file(file, tenant_id=str(current_user.tenant_id))

        if isinstance(upload_result, dict):
            file_path = upload_result.get('key') or upload_result.get('url') or upload_result.get('path')
            file_size = upload_result.get('size', file_size)
        else:
            file_path = str(upload_result)
            file.file.seek(0, 2)
            file_size = file.file.tell()
            file.file.seek(0)

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

        if client_id:
            doc_data["client_id"] = client_id

        db_obj = Document(**doc_data)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        
        try:
            print(f"🔍 Starting OCR processing for document: {file.filename}")
            ocr_data = await ocr_service.process_invoice(file_path)
            print(f"✅ OCR completed. Extracted data: {ocr_data}")

            db_obj.reference_number = ocr_data.get("reference_number")

            from datetime import datetime
            if ocr_data.get("date"):
                try:
                    db_obj.document_date = datetime.fromisoformat(str(ocr_data.get("date"))).date()
                except (ValueError, TypeError) as e:
                    print(f"⚠️  Date parsing error for 'date': {e}")
                    db_obj.document_date = None

            if ocr_data.get("due_date"):
                try:
                    db_obj.due_date = datetime.fromisoformat(str(ocr_data.get("due_date"))).date()
                except (ValueError, TypeError) as e:
                    print(f"⚠️  Date parsing error for 'due_date': {e}")
                    db_obj.due_date = None

            db_obj.amount_ht = ocr_data.get("amount_ht")
            db_obj.amount_vat = ocr_data.get("amount_vat")
            db_obj.amount_ttc = ocr_data.get("amount_ttc")
            db_obj.currency = ocr_data.get("currency")
            db_obj.ocr_data = ocr_data  # Store full OCR data
            db_obj.ocr_confidence = ocr_data.get("confidence", 0.0)
            db_obj.status = DocumentStatus.OCR_COMPLETED

            print(f"💾 Saving OCR data to database for document {db_obj.id}")
            db.commit()
            db.refresh(db_obj)
            print(f"✅ OCR data saved successfully. Status: {db_obj.status}")

        except Exception as ocr_error:
            print(f"❌ OCR Error: {ocr_error}")
            import traceback
            traceback.print_exc()
            db_obj.status = DocumentStatus.UPLOADED
            db.commit()
            db.refresh(db_obj)
            print(f"⚠️  Document saved with UPLOADED status (OCR failed)")

        return db_obj
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Upload error: {str(e)}")
        import traceback
        traceback.print_exc()
        
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
        query = db.query(Document).filter(Document.tenant_id == current_user.tenant_id)
        
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
from app.models.client import Client
from app.models.supplier import Supplier
from datetime import date
from pydantic import BaseModel

class ValidationData(BaseModel):
    reference_number: Optional[str] = None
    date: date
    due_date: Optional[date] = None
    supplier_name: Optional[str] = None

    amount_ht: Optional[Decimal] = None
    amount_vat: Optional[Decimal] = None
    amount_ttc: Optional[Decimal] = None

    total_amount: Optional[Decimal] = None
    tax_amount: Optional[Decimal] = None

    description: str
    account_number: Optional[str] = None
    journal_code: Optional[str] = "ACH"

    @model_validator(mode="after")
    def compute_amounts(self):
        if self.total_amount is None:
            if self.amount_ttc is not None:
                self.total_amount = self.amount_ttc
            elif self.amount_ht is not None and self.amount_vat is not None:
                self.total_amount = self.amount_ht + self.amount_vat

        if self.tax_amount is None and self.amount_vat is not None:
            self.tax_amount = self.amount_vat

        if self.amount_ttc is None and self.total_amount is not None:
            self.amount_ttc = self.total_amount
        if self.amount_vat is None and self.tax_amount is not None:
            self.amount_vat = self.tax_amount
        if self.amount_ht is None and self.total_amount is not None and self.tax_amount is not None:
            self.amount_ht = self.total_amount - self.tax_amount

        return self

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

    document.status = DocumentStatus.VALIDATED
    document.reference_number = validation_data.reference_number or document.reference_number
    document.document_date = validation_data.date
    document.due_date = validation_data.due_date
    document.amount_ht = float(validation_data.amount_ht) if validation_data.amount_ht is not None else document.amount_ht
    document.amount_vat = float(validation_data.amount_vat) if validation_data.amount_vat is not None else document.amount_vat
    document.amount_ttc = float(validation_data.amount_ttc) if validation_data.amount_ttc is not None else document.amount_ttc
    document.description = validation_data.description
    
    supplier_name = (validation_data.supplier_name or "").strip()
    if not supplier_name:
        raise HTTPException(status_code=422, detail="supplier_name est requis")

    if document.client_id is None:
        client = db.query(Client).filter(Client.tenant_id == current_user.tenant_id).first()
        if not client:
            raise HTTPException(status_code=422, detail="Aucun client n'est configuré pour ce tenant")
        document.client_id = client.id

    supplier = db.query(Supplier).filter(Supplier.name == supplier_name, Supplier.client_id == document.client_id).first()
    if not supplier:
        supplier = Supplier(name=supplier_name, client_id=document.client_id)
        db.add(supplier)
        db.flush() # Get ID

    document.supplier_id = supplier.id
    
    if validation_data.account_number:
        supplier.default_account = validation_data.account_number
    if validation_data.journal_code:
        supplier.default_journal = validation_data.journal_code
    
    if validation_data.total_amount is None or validation_data.tax_amount is None:
        raise HTTPException(status_code=422, detail="Montants invalides (total_amount/tax_amount) - vérifiez HT/TVA/TTC")

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
        client_id=document.client_id,
        journal_code=validation_data.journal_code or "ACH",
        tenant_id=current_user.tenant_id
    )
    db.add(entry_expense)
    
    if validation_data.tax_amount > 0:
        entry_vat = AccountingEntry(
            document_id=document.id,
            entry_type=EntryType.DEBIT,
            account_number="445200", # TVA Récupérable
            label=f"TVA sur {validation_data.description}",
            debit=validation_data.tax_amount,
            credit=0,
            date=validation_data.date,
            client_id=document.client_id,
            journal_code=validation_data.journal_code or "ACH",
            tenant_id=current_user.tenant_id
        )
        db.add(entry_vat)
        
    entry_payable = AccountingEntry(
        document_id=document.id,
        entry_type=EntryType.CREDIT,
        account_number="401100", # Fournisseurs
        label=f"Facture {supplier_name}",
        debit=0,
        credit=validation_data.total_amount,
        date=validation_data.date,
        client_id=document.client_id,
        journal_code=validation_data.journal_code or "ACH",
        tenant_id=current_user.tenant_id
    )
    db.add(entry_payable)

    db.commit()
    db.refresh(document)
    return document
