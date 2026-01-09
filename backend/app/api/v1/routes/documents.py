from typing import List, Optional, Any
from uuid import UUID
from datetime import date
from decimal import Decimal
import os

from pydantic import BaseModel
from pydantic import model_validator

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status, Query
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
        
        # Lire le contenu du fichier AVANT l'upload (pour l'OCR)
        file_content = await file.read()
        file_size = len(file_content)
        
        if file_size > 50 * 1024 * 1024:  # 50MB
            raise HTTPException(status_code=413, detail="Fichier trop volumineux (max 50MB)")
        
        # Remettre le curseur au début pour l'upload
        from io import BytesIO
        file.file = BytesIO(file_content)
        
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
            ocr_data = await ocr_service.process_invoice(file_path, file_content=file_content)
            print(f"✅ OCR completed. Extracted data: {ocr_data}")

            # Classification automatique Achat/Vente
            from app.services.invoice_classifier import InvoiceClassifier
            from app.models.document import DocumentType
            classifier = InvoiceClassifier(db, str(current_user.tenant_id))
            invoice_type, classification_confidence, classification_metadata = classifier.classify_invoice(ocr_data)
            
            # Mise à jour du type de document
            if invoice_type == "PURCHASE":
                db_obj.type = DocumentType.INVOICE_PURCHASE
            elif invoice_type == "SALE":
                db_obj.type = DocumentType.INVOICE_SALES
            
            # Stocker les métadonnées de classification
            if not db_obj.ai_extracted_data:
                db_obj.ai_extracted_data = {}
            db_obj.ai_extracted_data["classification"] = classification_metadata
            print(f"📋 Classification: {invoice_type} (confiance: {classification_confidence:.2f})")

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
            db_obj.supplier_name = ocr_data.get("supplier_name")
            db_obj.ocr_data = ocr_data  # Store full OCR data
            db_obj.ocr_confidence = ocr_data.get("confidence", 0.0)
            db_obj.status = DocumentStatus.OCR_COMPLETED
            
            print(f"📋 Classification: {invoice_type} | Fournisseur: {ocr_data.get('supplier_name')} | Montant: {ocr_data.get('amount_ttc')}")

            print(f"💾 Saving OCR data to database for document {db_obj.id}")
            db.commit()
            db.refresh(db_obj)
            print(f"✅ OCR data saved successfully. Status: {db_obj.status}")

        except Exception as ocr_error:
            print(f"❌ OCR Error: {ocr_error}")
            import traceback
            traceback.print_exc()
            db.rollback()  # Rollback en cas d'erreur OCR
            # Recharger le document et mettre à jour son statut
            db_obj = db.query(Document).filter(Document.id == db_obj.id).first()
            if db_obj:
                db_obj.status = DocumentStatus.UPLOADED
                db.commit()
                db.refresh(db_obj)
            print(f"⚠️  Document saved with UPLOADED status (OCR failed)")

        return db_obj
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        print(f"Upload error: {str(e)}")
        import traceback
        traceback.print_exc()
        
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de l'upload du document: {str(e)}"
        )


@router.post("/upload-multipage")
async def upload_multipage_pdf(
    *,
    db: Session = Depends(deps.get_db_session),
    file: UploadFile = File(...),
    current_user: User = Depends(deps.get_current_user),
    client_id: Optional[UUID] = None,
):
    """
    Upload un PDF multi-pages et crée un document par page.
    Chaque page est traitée par OCR séparément.
    """
    from app.services.ocr_enhanced import enhanced_ocr_service
    from io import BytesIO
    
    if not file.filename or not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Seuls les fichiers PDF sont acceptés")
    
    try:
        file_content = await file.read()
        
        # Compter les pages
        page_count = enhanced_ocr_service.get_pdf_page_count(file_content)
        print(f"📑 PDF multi-pages détecté: {page_count} pages")
        
        if page_count <= 1:
            # Si une seule page, utiliser l'upload normal
            file.file = BytesIO(file_content)
            file.file.seek(0)
            return await upload_document(
                db=db,
                file=file,
                current_user=current_user,
                client_id=client_id
            )
        
        # Limiter pour éviter les abus (max 200 pages)
        if page_count > 200:
            raise HTTPException(
                status_code=400, 
                detail=f"PDF trop volumineux ({page_count} pages). Maximum: 200 pages."
            )
        
        created_documents = []
        failed_pages = []
        
        # Traiter chaque page
        for page_num in range(1, page_count + 1):
            try:
                print(f"📄 Traitement page {page_num}/{page_count}")
                
                # Extraire la page comme PDF séparé
                from pdf2image import convert_from_bytes
                from PIL import Image
                import io as io_module
                
                # Convertir la page en image
                images = convert_from_bytes(
                    file_content,
                    first_page=page_num,
                    last_page=page_num,
                    dpi=200
                )
                
                if not images:
                    failed_pages.append({"page": page_num, "error": "Conversion failed"})
                    continue
                
                # Sauvegarder l'image comme JPEG temporaire
                img_buffer = io_module.BytesIO()
                images[0].save(img_buffer, format='JPEG', quality=90)
                img_buffer.seek(0)
                
                # Créer un UploadFile pour cette page
                page_filename = f"{file.filename.rsplit('.', 1)[0]}_page_{page_num}.jpg"
                
                # Upload de l'image de la page
                from fastapi import UploadFile as FastAPIUploadFile
                page_file = FastAPIUploadFile(
                    file=img_buffer,
                    filename=page_filename
                )
                
                upload_result = await storage_service.upload_file(
                    page_file, 
                    tenant_id=str(current_user.tenant_id)
                )
                
                if isinstance(upload_result, dict):
                    page_file_path = upload_result.get('key') or upload_result.get('url')
                else:
                    page_file_path = str(upload_result)
                
                # Créer le document
                doc_data = {
                    "filename": page_filename,
                    "original_filename": f"{file.filename} (page {page_num}/{page_count})",
                    "file_path": page_file_path,
                    "content_type": "image/jpeg",
                    "file_size": len(img_buffer.getvalue()),
                    "file_extension": ".jpg",
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
                
                # OCR sur la page
                try:
                    ocr_data = await enhanced_ocr_service.process_single_page(
                        file_content, 
                        page_number=page_num,
                        file_path=page_file_path
                    )
                    
                    db_obj.reference_number = ocr_data.get("reference_number")
                    
                    from datetime import datetime
                    if ocr_data.get("date"):
                        try:
                            db_obj.document_date = datetime.fromisoformat(str(ocr_data.get("date"))).date()
                        except (ValueError, TypeError):
                            pass
                    
                    db_obj.amount_ht = ocr_data.get("amount_ht")
                    db_obj.amount_vat = ocr_data.get("amount_vat")
                    db_obj.amount_ttc = ocr_data.get("amount_ttc")
                    db_obj.supplier_name = ocr_data.get("supplier_name")
                    db_obj.ocr_data = ocr_data
                    db_obj.ocr_confidence = ocr_data.get("confidence", 0.0)
                    db_obj.status = DocumentStatus.OCR_COMPLETED
                    
                    db.commit()
                    db.refresh(db_obj)
                    
                    created_documents.append({
                        "id": str(db_obj.id),
                        "page": page_num,
                        "filename": page_filename,
                        "status": "success",
                        "reference": ocr_data.get("reference_number"),
                        "supplier": ocr_data.get("supplier_name"),
                        "amount_ttc": ocr_data.get("amount_ttc")
                    })
                    
                except Exception as ocr_error:
                    print(f"❌ OCR error page {page_num}: {ocr_error}")
                    db_obj.status = DocumentStatus.UPLOADED
                    db.commit()
                    created_documents.append({
                        "id": str(db_obj.id),
                        "page": page_num,
                        "filename": page_filename,
                        "status": "ocr_failed",
                        "error": str(ocr_error)
                    })
                
            except Exception as page_error:
                print(f"❌ Page {page_num} error: {page_error}")
                failed_pages.append({"page": page_num, "error": str(page_error)})
        
        return {
            "message": f"PDF traité: {len(created_documents)} documents créés",
            "total_pages": page_count,
            "documents_created": len(created_documents),
            "documents": created_documents,
            "failed_pages": failed_pages
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Multipage upload error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Erreur traitement PDF multi-pages: {str(e)}"
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


@router.delete("/{id}", status_code=204)
def delete_document(
    *,
    db: Session = Depends(deps.get_db_session),
    id: UUID,
    current_user: User = Depends(deps.get_current_user),
) -> None:
    """
    Delete a document.
    """
    document = db.query(Document).filter(
        Document.id == id,
        Document.tenant_id == current_user.tenant_id
    ).first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Optionnel: supprimer le fichier du storage
    if document.file_path:
        try:
            storage_service.delete_file(document.file_path)
        except Exception as e:
            print(f"⚠️  Erreur suppression fichier storage: {e}")
    
    db.delete(document)
    db.commit()
    print(f"🗑️  Document {id} supprimé")


@router.get("/{document_id}/view-url")
async def get_document_view_url(
    document_id: UUID,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db_session),
):
    """
    Génère une URL signée temporaire pour afficher un document dans un iframe.
    L'URL est valide pendant 1 heure.
    """
    from datetime import datetime, timedelta
    import hashlib
    import hmac
    import base64
    from app.core.config import get_settings
    
    document = db.query(Document).filter(
        Document.id == document_id,
        Document.tenant_id == current_user.tenant_id
    ).first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document non trouvé")
    
    if not document.file_path:
        raise HTTPException(status_code=404, detail="Fichier non disponible")
    
    # Générer un token signé valide 1 heure
    expires_at = datetime.utcnow() + timedelta(hours=1)
    token_data = f"{document_id}:{current_user.id}:{expires_at.timestamp()}"
    
    # Utiliser la clé secrète depuis settings
    settings = get_settings()
    secret_key = settings.secret_key.encode() if hasattr(settings, 'secret_key') else os.getenv("SECRET_KEY", "default-secret-key").encode()
    signature = hmac.new(
        secret_key,
        token_data.encode(),
        hashlib.sha256
    ).hexdigest()
    
    token = base64.urlsafe_b64encode(f"{token_data}:{signature}".encode()).decode()
    
    base_url = settings.backend_url if hasattr(settings, 'backend_url') and settings.backend_url else "https://api.sekagestion.com"
    
    view_url = f"{base_url}/api/v1/documents/view/{token}/{base64.urlsafe_b64encode(document.file_path.encode()).decode()}"
    
    return {
        "view_url": view_url,
        "expires_at": expires_at.isoformat(),
        "expires_in": 3600
    }


@router.get("/view/{token}/{file_key_b64}")
async def view_document_with_token(
    token: str,
    file_key_b64: str,
):
    """
    Affiche un document avec un token signé temporaire.
    Permet l'affichage dans un iframe sans authentification directe.
    """
    from fastapi.responses import StreamingResponse
    from datetime import datetime
    import io
    import hashlib
    import hmac
    import base64
    from app.core.config import get_settings
    
    try:
        # Décoder le file_key
        file_key = base64.urlsafe_b64decode(file_key_b64.encode()).decode()
        
        # Décoder et vérifier le token
        decoded = base64.urlsafe_b64decode(token.encode()).decode()
        parts = decoded.split(":")
        if len(parts) < 4:
            raise HTTPException(status_code=401, detail="Token invalide")
        
        document_id_str, user_id_str, expires_str, signature = parts[0], parts[1], parts[2], ":".join(parts[3:])
        
        # Vérifier l'expiration
        expires_at = datetime.fromtimestamp(float(expires_str))
        if datetime.utcnow() > expires_at:
            raise HTTPException(status_code=401, detail="Token expiré")
        
        # Vérifier la signature
        settings = get_settings()
        secret_key = settings.secret_key.encode() if hasattr(settings, 'secret_key') else os.getenv("SECRET_KEY", "default-secret-key").encode()
        token_data = f"{document_id_str}:{user_id_str}:{expires_str}"
        expected_signature = hmac.new(
            secret_key,
            token_data.encode(),
            hashlib.sha256
        ).hexdigest()
        
        if signature != expected_signature:
            raise HTTPException(status_code=401, detail="Token invalide")
        
        # Récupérer le contenu
        content = await storage_service.get_file_content(file_key)
        
        content_type = "application/octet-stream"
        if file_key.lower().endswith('.pdf'):
            content_type = "application/pdf"
        elif file_key.lower().endswith(('.jpg', '.jpeg')):
            content_type = "image/jpeg"
        elif file_key.lower().endswith('.png'):
            content_type = "image/png"
        
        response = StreamingResponse(
            io.BytesIO(content),
            media_type=content_type,
            headers={
                "Content-Disposition": f"inline; filename={file_key.split('/')[-1]}",
                "X-Frame-Options": "SAMEORIGIN",
                "Content-Security-Policy": "frame-ancestors 'self'"
            }
        )
        return response
    except HTTPException:
        raise
    except Exception as e:
        print(f"Erreur affichage document: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur: {str(e)}")


@router.get("/download/{file_key:path}")
async def download_document_by_key(
    file_key: str,
    current_user: User = Depends(deps.get_current_user),
):
    """
    Télécharge un document par sa clé de stockage.
    Sert de proxy pour les fichiers R2 non accessibles publiquement.
    Permet l'affichage dans un iframe (headers CSP ajustés).
    """
    from fastapi.responses import StreamingResponse
    import io
    
    try:
        content = await storage_service.get_file_content(file_key)
        
        content_type = "application/octet-stream"
        if file_key.lower().endswith('.pdf'):
            content_type = "application/pdf"
        elif file_key.lower().endswith(('.jpg', '.jpeg')):
            content_type = "image/jpeg"
        elif file_key.lower().endswith('.png'):
            content_type = "image/png"
        
        response = StreamingResponse(
            io.BytesIO(content),
            media_type=content_type,
            headers={
                "Content-Disposition": f"inline; filename={file_key.split('/')[-1]}",
                "X-Frame-Options": "SAMEORIGIN",
                "Content-Security-Policy": "frame-ancestors 'self'"
            }
        )
        return response
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Document non trouvé")
    except Exception as e:
        print(f"Erreur téléchargement: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur: {str(e)}")


from app.models.accounting import AccountingEntry, EntryType
from app.models.client import Client
from app.models.supplier import Supplier
from datetime import date
from pydantic import BaseModel

class ValidationData(BaseModel):
    reference_number: Optional[str] = None
    date: Optional[str] = None
    due_date: Optional[str] = None
    supplier_name: Optional[str] = None
    amount_ht: Optional[float] = None
    amount_vat: Optional[float] = None
    amount_ttc: Optional[float] = None
    description: Optional[str] = None
    account_number: Optional[str] = None
    journal_code: Optional[str] = "ACH"
    
    class Config:
        extra = "ignore"  # Ignorer les champs inconnus

@router.post("/{document_id}/validate")
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
    print(f"📝 Validation request received: {validation_data}")
    document = db.query(Document).filter(Document.id == document_id, Document.tenant_id == current_user.tenant_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    document.status = DocumentStatus.VALIDATED
    document.reference_number = validation_data.reference_number or document.reference_number
    
    # Parser les dates string en objets date
    from datetime import datetime
    if validation_data.date:
        try:
            document.document_date = datetime.strptime(validation_data.date, "%Y-%m-%d").date()
        except ValueError:
            pass
    if validation_data.due_date:
        try:
            document.due_date = datetime.strptime(validation_data.due_date, "%Y-%m-%d").date()
        except ValueError:
            pass
    document.amount_ht = float(validation_data.amount_ht) if validation_data.amount_ht is not None else document.amount_ht
    document.amount_vat = float(validation_data.amount_vat) if validation_data.amount_vat is not None else document.amount_vat
    document.amount_ttc = float(validation_data.amount_ttc) if validation_data.amount_ttc is not None else document.amount_ttc
    document.description = validation_data.description
    
    supplier_name = (validation_data.supplier_name or "").strip()
    if not supplier_name:
        # Essayer d'extraire depuis les données OCR si disponible
        if document.ocr_data and isinstance(document.ocr_data, dict):
            supplier_name = (document.ocr_data.get("supplier_name") or "").strip()
        if not supplier_name:
            raise HTTPException(status_code=422, detail="supplier_name est requis. Veuillez renseigner le fournisseur.")

    if document.client_id is None:
        client = db.query(Client).filter(Client.tenant_id == current_user.tenant_id).first()
        if not client:
            from app.models.tenant import Tenant
            import uuid as uuid_module

            tenant = db.query(Tenant).filter(Tenant.id == current_user.tenant_id).first()
            tenant_name = (tenant.name if tenant else "Client") or "Client"
            # Générer un slug unique basé sur le tenant_id pour éviter les conflits
            unique_slug = f"default-{str(current_user.tenant_id)[:8]}"

            try:
                client = Client(
                    name=tenant_name,
                    slug=unique_slug,
                    sector=None,
                    tenant_id=current_user.tenant_id,
                )
                db.add(client)
                db.flush()
                print(f"✅ Client par défaut créé: {tenant_name} (slug: {unique_slug})")
            except Exception as client_err:
                db.rollback()
                print(f"❌ Erreur création client: {type(client_err).__name__}: {client_err}")
                raise HTTPException(status_code=500, detail=f"Impossible de créer le client par défaut: {client_err}")
        document.client_id = client.id

    try:
        supplier = db.query(Supplier).filter(Supplier.name == supplier_name, Supplier.client_id == document.client_id).first()
        if not supplier:
            supplier = Supplier(name=supplier_name, client_id=document.client_id)
            db.add(supplier)
            db.flush() # Get ID
            print(f"✅ Fournisseur créé: {supplier_name}")
        else:
            print(f"✅ Fournisseur existant: {supplier_name}")
        document.supplier_id = supplier.id
    except Exception as supplier_err:
        db.rollback()
        print(f"❌ Erreur fournisseur: {type(supplier_err).__name__}: {supplier_err}")
        raise HTTPException(status_code=500, detail=f"Erreur fournisseur: {supplier_err}")
    
    if validation_data.account_number:
        supplier.default_account = validation_data.account_number
    if validation_data.journal_code:
        supplier.default_journal = validation_data.journal_code
    
    # Calculer les montants pour la comptabilisation
    total_amount = validation_data.amount_ttc
    tax_amount = validation_data.amount_vat
    ht_amount = validation_data.amount_ht
    
    # Calculs de fallback
    if total_amount is None and ht_amount is not None and tax_amount is not None:
        total_amount = ht_amount + tax_amount
    if tax_amount is None and total_amount is not None and ht_amount is not None:
        tax_amount = total_amount - ht_amount
    if ht_amount is None and total_amount is not None and tax_amount is not None:
        ht_amount = total_amount - tax_amount
    
    # Valeurs par défaut si manquantes
    total_amount = total_amount or 0
    tax_amount = tax_amount or 0
    ht_amount = ht_amount or total_amount

    expense_account = validation_data.account_number or supplier.default_account or "601000"
    entry_date = document.document_date or datetime.utcnow().date()
    entry_label = validation_data.description or document.description or f"Document {document.filename}"
    
    print(f"📊 Création écritures: HT={ht_amount}, TVA={tax_amount}, TTC={total_amount}, date={entry_date}")
    try:
        entry_expense = AccountingEntry(
            document_id=document.id,
            entry_type=EntryType.DEBIT,
            account_number=expense_account,
            label=entry_label,
            debit=ht_amount,
            credit=0,
            date=entry_date,
            client_id=document.client_id,
            journal_code=validation_data.journal_code or "ACH",
            tenant_id=current_user.tenant_id
        )
        db.add(entry_expense)
        print(f"✅ Écriture dépense ajoutée")
    
        if tax_amount and tax_amount > 0:
            entry_vat = AccountingEntry(
                document_id=document.id,
                entry_type=EntryType.DEBIT,
                account_number="445200", # TVA Récupérable
                label=f"TVA sur {entry_label}",
                debit=tax_amount,
                credit=0,
                date=entry_date,
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
            credit=total_amount,
            date=entry_date,
            client_id=document.client_id,
            journal_code=validation_data.journal_code or "ACH",
            tenant_id=current_user.tenant_id
        )
        db.add(entry_payable)

        db.commit()
        db.refresh(document)
        return document
    except Exception as e:
        db.rollback()
        print(f"❌ Erreur validation/comptabilisation: {type(e).__name__}: {e}")
        raise
