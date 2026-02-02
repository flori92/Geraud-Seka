from typing import List, Optional, Any
from uuid import UUID
from datetime import date, datetime, timedelta
from decimal import Decimal
import os
from contextlib import suppress
import logging

from pydantic import BaseModel
from pydantic import model_validator

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status, Query
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.api import deps
from app.models.accounting import AccountingEntry
from app.models.document import Document, DocumentStatus, DocumentType
from app.services.invoice_classifier import InvoiceClassifier
from app.models.user import User
from app.schemas.document import Document as DocumentSchema
from app.schemas.document import DocumentCreate, DocumentUpdate
from app.services.ocr import ocr_service
from app.services.storage import storage_service

router = APIRouter()
logger = logging.getLogger(__name__)


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

            # Use a nested transaction (savepoint) so that OCR-specific updates
            # can be rolled back without deleting the original uploaded record.
            # This prevents losing the uploaded file record on OCR failures.
            with db.begin_nested():
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

                # ===== DÉTECTION DES DOUBLONS =====
                try:
                    from app.services.duplicate_detection import DuplicateDetectionService
                    import json
                    
                    duplicate_service = DuplicateDetectionService(db, str(current_user.tenant_id))
                    
                    # Détecter si c'est un doublon
                    duplicate_result = duplicate_service.detect_duplicate(
                        supplier_name=ocr_data.get('supplier_name'),
                        invoice_number=ocr_data.get('reference_number'),
                        amount_ttc=ocr_data.get('amount_ttc'),
                        document_date=db_obj.document_date
                    )
                    
                    if duplicate_result:
                        existing_doc, detection_reason = duplicate_result
                        
                        # Comparer les documents
                        comparison = duplicate_service.compare_documents(db_obj, existing_doc)
                        
                        # Créer l'enregistrement de doublon
                        duplicate_service.create_duplicate_record(
                            new_document_id=str(db_obj.id),
                            existing_document_id=str(existing_doc.id),
                            detection_reason=detection_reason,
                            comparison_data=json.dumps(comparison)
                        )
                        
                        # Marquer le document comme doublon potentiel
                        db_obj.status = DocumentStatus.A_TRAITER_DOUBLON  # En attente de résolution
                        
                        print(f"🛑 DOUBLON DÉTECTÉ! Raison: {detection_reason.value}")
                        print(f"   Nouveau: {db_obj.supplier_name} - {db_obj.reference_number}")
                        print(f"   Existant: {existing_doc.supplier_name} - {existing_doc.reference_number}")
                    
                except Exception as dup_err:
                    print(f"⚠️ Erreur détection doublons: {dup_err}")
                    import traceback
                    traceback.print_exc()

                # Vérifier si le document correspond à une règle active
                try:
                    from app.services.accounting_rules import AccountingRulesEngine
                    from app.models.accounting_rules import AccountingRule
                    
                    rules_service = AccountingRulesEngine(db, str(current_user.tenant_id))
                    
                    # Récupérer toutes les règles actives
                    active_rules = db.query(AccountingRule).filter(
                        AccountingRule.tenant_id == current_user.tenant_id,
                        AccountingRule.is_active == True
                    ).all()
                    
                    if active_rules and ocr_data.get('supplier_name'):
                        # Appliquer les règles au document
                        result = rules_service.apply_rules({
                            "supplier_name": ocr_data.get('supplier_name', ''),
                            "reference_number": ocr_data.get('reference_number', ''),
                            "amount_ttc": float(ocr_data.get('amount_ttc', 0)),
                            "document_date": ocr_data.get('date'),
                            "description": ocr_data.get('description', '')
                        })
                        
                        if result.get("matched") or result.get("rule_id"):
                            # 🟡 Règle trouvée → Statut PRE_TRAITEE (prête à valider)
                            db_obj.status = DocumentStatus.PRE_TRAITEE
                            db_obj.auto_validable = True
                            db_obj.matched_rule_id = result.get('rule_id')
                            db_obj.matched_rule_name = result.get('rule_name', 'Règle sans nom')

                            # Stocker les comptes de la règle dans ai_extracted_data
                            if not db_obj.ai_extracted_data:
                                db_obj.ai_extracted_data = {}
                            db_obj.ai_extracted_data["applied_rule"] = {
                                "rule_id": result.get('rule_id'),
                                "rule_name": result.get('rule_name'),
                                "charge_account": result.get('suggested_debit_account'),
                                "vat_account": result.get('suggested_vat_account', '4454'),
                                "supplier_account": result.get('suggested_credit_account'),
                                "tiers_account": result.get('suggested_credit_account'),
                                "journal_code": result.get('journal_code', 'ACH'),
                                "vat_rate": result.get('suggested_vat_rate', 18),
                                "confidence": result.get('confidence', 0.0),
                                "source": result.get('source', 'rule')
                            }
                            print(f"✅ Document correspond à la règle: {result.get('rule_name')} → Statut PRE_TRAITEE")
                            print(f"   Comptes: {result.get('suggested_debit_account')} / {result.get('suggested_vat_account', '4454')} / {result.get('suggested_credit_account')}")
                        else:
                            # 🔴 Aucune règle → Statut A_TRAITER (nécessite intervention manuelle)
                            db_obj.status = DocumentStatus.A_TRAITER
                            db_obj.auto_validable = False
                            print(f"ℹ️  Aucune règle active ne correspond → Statut A_TRAITER")
                    else:
                        db_obj.status = DocumentStatus.A_TRAITER
                        db_obj.auto_validable = False
                        
                except Exception as rule_err:
                    print(f"⚠️ Erreur vérification règles: {rule_err}")
                    db_obj.auto_validable = False

                # Flush nested changes; commit below will persist them.
                db.flush()

            # Commit outer transaction to persist nested updates
            db.commit()
            db.refresh(db_obj)
            print(f"💾 OCR data saved successfully. Status: {db_obj.status}")

        except Exception as ocr_error:
            print(f"❌ OCR Error: {ocr_error}")
            import traceback
            traceback.print_exc()
            # Rollback nested/outer if needed and keep the uploaded record with
            # a safe status so it can be retried or inspected.
            try:
                db.rollback()
            except Exception:
                pass

            # Ensure the initial uploaded document remains and mark as UPLOADED
            try:
                safe_obj = db.query(Document).filter(Document.id == db_obj.id).first()
                if safe_obj:
                    safe_obj.status = DocumentStatus.UPLOADED
                    db.add(safe_obj)
                    db.commit()
                    db.refresh(safe_obj)
                    print("⚠️  Document saved with UPLOADED status (OCR failed)")
            except Exception as e_inner:
                print(f"⚠️ Failed to set UPLOADED status after OCR failure: {e_inner}")

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
        ) from e


@router.post("/upload-multipage")
async def upload_multipage_pdf(
    *,
    db: Session = Depends(deps.get_db_session),
    file: UploadFile = File(...),
    current_user: User = Depends(deps.get_current_user),
    client_id: Optional[UUID] = None,
    pages_per_document: int = Query(1, ge=1, description="Nombre de pages par document créé"),
):
    """
    Upload un PDF multi-pages et le découpe en plusieurs documents.
    Optimisé pour éviter les timeouts Cloudflare (max 100s).
    
    - Utilise PyPDF2 pour extraire les pages directement (plus rapide)
    - DPI réduit à 150 pour l'OCR (suffisant et 2x plus rapide)
    - Limite à 30 pages en synchrone, au-delà retourne une erreur avec conseil
    """
    from app.services.ocr_enhanced import enhanced_ocr_service
    from io import BytesIO
    import asyncio
    import time
    
    if not file.filename or not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Seuls les fichiers PDF sont acceptés")
    
    start_time = time.time()
    
    try:
        file_content = await file.read()
        
        # Compter les pages
        page_count = enhanced_ocr_service.get_pdf_page_count(file_content)
        print(f"📑 PDF multi-pages détecté: {page_count} pages. Split tous les {pages_per_document} pages.")
        
        # Si on ne veut pas splitter (et que le PDF n'est pas trop gros), ou si pages_per_doc >= page_count
        if pages_per_document >= page_count:
             file.file = BytesIO(file_content)
             file.file.seek(0)
             return await upload_document(
                db=db,
                file=file,
                current_user=current_user,
                client_id=client_id
             )
        
        # Calculer le nombre de documents à créer
        num_chunks = (page_count + pages_per_document - 1) // pages_per_document
        
        # Limiter pour éviter les timeouts Cloudflare
        # Avec DPI 150 et thread_count=2, on peut traiter jusqu'à 150 docs
        MAX_SYNC_DOCUMENTS = 150
        if num_chunks > MAX_SYNC_DOCUMENTS:
            raise HTTPException(
                status_code=400, 
                detail=f"Trop de documents à créer ({num_chunks}). Maximum en une fois: {MAX_SYNC_DOCUMENTS}. "
                       f"Veuillez diviser votre PDF en plusieurs fichiers de {MAX_SYNC_DOCUMENTS * pages_per_document} pages maximum, "
                       f"ou augmenter le nombre de pages par document."
            )
        
        # Limiter pour éviter les abus (max 200 pages)
        if page_count > 200:
            raise HTTPException(
                status_code=400, 
                detail=f"PDF trop volumineux ({page_count} pages). Maximum: 200 pages."
            )
        
        created_documents = []
        failed_chunks = []
        
        from pdf2image import convert_from_bytes
        import io as io_module
        from fastapi import UploadFile as FastAPIUploadFile

        print(f"🔄 Création de {num_chunks} documents à partir du PDF")
        
        # Process chunks with better error handling
        for chunk_idx in range(num_chunks):
            start_page = chunk_idx * pages_per_document + 1
            end_page = min((chunk_idx + 1) * pages_per_document, page_count)
            
            try:
                chunk_start_time = time.time()
                print(f"📄 Traitement chunk {chunk_idx+1}/{num_chunks} (Pages {start_page}-{end_page})")
                
                # Convertir les pages du chunk en images (DPI 150 = plus rapide, suffisant pour OCR)
                images = convert_from_bytes(
                    file_content,
                    first_page=start_page,
                    last_page=end_page,
                    dpi=150,  # Réduit de 200 à 150 pour performance
                    thread_count=2  # Paralléliser la conversion
                )
                
                if not images:
                    failed_chunks.append({"pages": f"{start_page}-{end_page}", "error": "Conversion failed"})
                    continue
                
                # Pour l'OCR et le stockage, on peut:
                # 1. Soit créer un nouveau PDF avec ces pages (plus propre pour le multi-page)
                # 2. Soit stocker la première page comme image (si 1 page)
                
                # Ici pour simplifier et rester cohérent avec la logique précédente:
                # Si 1 page, on stocke en JPG. Si > 1 page, idéalement on refait un PDF, 
                # mais convert_from_bytes donne des images.
                # ON VA RECRÉER UN PDF POUR CE CHUNK SI > 1 PAGE, SINON JPG.
                
                chunk_file_buffer = io_module.BytesIO()
                chunk_filename = ""
                content_type = ""
                file_ext = ""

                if len(images) == 1:
                    images[0].save(chunk_file_buffer, format='JPEG', quality=90)
                    chunk_filename = f"{file.filename.rsplit('.', 1)[0]}_p{start_page}.jpg"
                    content_type = "image/jpeg"
                    file_ext = ".jpg"
                else:
                    images[0].save(chunk_file_buffer, format='PDF', save_all=True, append_images=images[1:])
                    chunk_filename = f"{file.filename.rsplit('.', 1)[0]}_p{start_page}-{end_page}.pdf"
                    content_type = "application/pdf"
                    file_ext = ".pdf"
                
                chunk_file_buffer.seek(0)
                
                # Upload
                chunk_upload_file = FastAPIUploadFile(
                    file=chunk_file_buffer,
                    filename=chunk_filename
                )
                
                upload_result = await storage_service.upload_file(
                    chunk_upload_file, 
                    tenant_id=str(current_user.tenant_id)
                )
                
                if isinstance(upload_result, dict):
                    chunk_file_path = upload_result.get('key') or upload_result.get('url')
                else:
                    chunk_file_path = str(upload_result)
                
                # Créer Document
                doc_data = {
                    "filename": chunk_filename,
                    "original_filename": f"{file.filename} (pages {start_page}-{end_page})",
                    "file_path": chunk_file_path,
                    "content_type": content_type,
                    "file_size": len(chunk_file_buffer.getvalue()),
                    "file_extension": file_ext,
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
                
                # OCR Processing
                # Pour l'instant on utilise process_single_page pour la première page ou un service OCR qui gère le fichier
                # Si c'est un PDF (multi-page chunk), il faudrait appeler process_invoice complet.
                # Si c'est une image (single page chunk), process_single_page ou process_invoice fonctionnent.
                
                try:
                    # On utilise le contenu binaire du chunk
                    chunk_ocr_data = await ocr_service.process_invoice(chunk_file_path, file_content=chunk_file_buffer.getvalue())
                    
                    db_obj.reference_number = chunk_ocr_data.get("reference_number")
                    
                    from datetime import datetime
                    if chunk_ocr_data.get("date"):
                        with suppress(ValueError, TypeError):
                             db_obj.document_date = datetime.fromisoformat(str(chunk_ocr_data.get("date"))).date()
                    
                    db_obj.amount_ht = chunk_ocr_data.get("amount_ht")
                    db_obj.amount_vat = chunk_ocr_data.get("amount_vat")
                    db_obj.amount_ttc = chunk_ocr_data.get("amount_ttc")
                    db_obj.supplier_name = chunk_ocr_data.get("supplier_name")
                    db_obj.ocr_data = chunk_ocr_data
                    db_obj.ocr_confidence = chunk_ocr_data.get("confidence", 0.0)
                    db_obj.status = DocumentStatus.OCR_COMPLETED
                    
                    db.commit()
                    db.refresh(db_obj)
                    
                    chunk_duration = time.time() - chunk_start_time
                    print(f"✅ Chunk {chunk_idx+1} traité en {chunk_duration:.2f}s - Doc ID: {db_obj.id}")
                    
                    created_documents.append({
                        "id": str(db_obj.id),
                        "pages": f"{start_page}-{end_page}",
                        "filename": chunk_filename,
                        "status": "success",
                        "amount_ttc": chunk_ocr_data.get("amount_ttc"),
                        "processing_time": round(chunk_duration, 2)
                    })

                except Exception as ocr_error:
                     print(f"❌ OCR error chunk {start_page}-{end_page}: {ocr_error}")
                     db_obj.status = DocumentStatus.UPLOADED
                     db.commit()
                     created_documents.append({
                        "id": str(db_obj.id),
                        "pages": f"{start_page}-{end_page}",
                        "status": "ocr_failed",
                        "error": str(ocr_error)
                     })

            except Exception as chunk_error:
                print(f"❌ Chunk {start_page}-{end_page} error: {chunk_error}")
                failed_chunks.append({"pages": f"{start_page}-{end_page}", "error": str(chunk_error)})

        total_duration = time.time() - start_time
        print(f"🎉 Traitement terminé en {total_duration:.2f}s - {len(created_documents)}/{num_chunks} documents créés")
        
        return {
            "message": f"PDF traité: {len(created_documents)} documents créés",
            "total_pages": page_count,
            "documents_created": len(created_documents),
            "documents": created_documents,
            "failed_chunks": failed_chunks,
            "processing_time": round(total_duration, 2),
            "avg_time_per_chunk": round(total_duration / num_chunks, 2) if num_chunks > 0 else 0
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


MAX_PAGE_SIZE = 200


@router.get("/", response_model=List[DocumentSchema])
def read_documents(
    db: Session = Depends(deps.get_db_session),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_user),
    client_id: Optional[UUID] = None,
    status: Optional[str] = None,
    document_type: Optional[str] = None,
) -> Any:
    """
    Retrieve documents filtered by tenant.
    """
    try:
        safe_skip = max(0, skip)
        safe_limit = max(1, min(limit or 1, MAX_PAGE_SIZE))

        query = db.query(Document).filter(Document.tenant_id == current_user.tenant_id)

        if client_id:
            query = query.filter(Document.client_id == client_id)

        if status:
            try:
                status_enum = DocumentStatus(status)
            except ValueError as exc:
                logger.warning("Invalid status filter provided", extra={"status": status, "user_id": str(current_user.id)})
                raise HTTPException(status_code=400, detail=f"Statut invalide: {status}") from exc
            query = query.filter(Document.status == status_enum)

        if document_type:
            try:
                type_enum = DocumentType(document_type)
            except ValueError as exc:
                logger.warning("Invalid document_type filter provided", extra={"document_type": document_type, "user_id": str(current_user.id)})
                raise HTTPException(status_code=400, detail=f"Type de document invalide: {document_type}") from exc
            query = query.filter(Document.type == type_enum)

        results = (
            query
            .order_by(Document.created_at.desc())
            .offset(safe_skip)
            .limit(safe_limit)
            .all()
        )
        logger.info(
            "Documents fetched",
            extra={
                "tenant_id": str(current_user.tenant_id),
                "filters": {
                    "client_id": str(client_id) if client_id else None,
                    "status": status,
                    "document_type": document_type,
                    "skip": safe_skip,
                    "limit": safe_limit,
                },
                "count": len(results),
            },
        )
        return results

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error fetching documents", exc_info=True)
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
    if not (document := db.query(Document).filter(Document.id == id).first()):
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
        
        return StreamingResponse(
            io.BytesIO(content),
            media_type=content_type,
            headers={
                "Content-Disposition": f"inline; filename={file_key.split('/')[-1]}",
                "X-Frame-Options": "SAMEORIGIN",
                "Content-Security-Policy": "frame-ancestors 'self'"
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"Erreur affichage document: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur: {str(e)}") from e


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
        
        return StreamingResponse(
            io.BytesIO(content),
            media_type=content_type,
            headers={
                "Content-Disposition": f"inline; filename={file_key.split('/')[-1]}",
                "X-Frame-Options": "SAMEORIGIN",
                "Content-Security-Policy": "frame-ancestors 'self'"
            }
        )
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Document non trouvé")
    except Exception as e:
        print(f"Erreur téléchargement: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur: {str(e)}") from e


from app.models.accounting import AccountingEntry, EntryType
from app.models.client import Client
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
    document_type: Optional[str] = "INVOICE_PURCHASE"
    
    class Config:
        extra = "ignore"

@router.post("/{document_id}/validate", response_model=DocumentSchema)
def validate_document(
    *,
    db: Session = Depends(deps.get_db_session),
    document_id: UUID,
    validation_data: ValidationData,
    current_user: User = Depends(deps.get_current_user),
):
    """
    Validate a document and generate accounting entries.
    """
    try:
        print(f"📝 [v4] Validation request received: {validation_data}")
        print(f"🔍 Imports disponibles: datetime={datetime}, timedelta={timedelta}, date={date}")
        document = db.query(Document).filter(Document.id == document_id, Document.tenant_id == current_user.tenant_id).first()
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
    except NameError as ne:
        import traceback
        print(f"❌ NameError détecté au début: {ne}")
        print(f"📋 Traceback:\n{traceback.format_exc()}")
        raise

    # 🟢 Validation utilisateur → Statut VALIDEE (prête pour export)
    # Vérifier qu'aucun doublon en attente de résolution n'existe pour ce document
    from app.models.duplicate import DocumentDuplicate
    pending_duplicate = db.query(DocumentDuplicate).filter(
        DocumentDuplicate.new_document_id == document_id,
        DocumentDuplicate.resolution.is_(None)
    ).first()
    if pending_duplicate:
        raise HTTPException(
            status_code=422,
            detail="Impossible de valider un document avec un doublon en attente de résolution."
        )

    document.status = DocumentStatus.VALIDEE
    document.reference_number = validation_data.reference_number or document.reference_number
    
    # Classification automatique du type de document si non spécifié
    if not validation_data.document_type and document.ocr_data and isinstance(document.ocr_data, dict):
        try:
            from app.models.tenant import Tenant
            tenant = db.query(Tenant).filter(Tenant.id == current_user.tenant_id).first()
            tenant_name = tenant.name if tenant else None
            
            classifier = InvoiceClassifier(db, current_user.tenant_id)
            invoice_type, confidence, metadata = classifier.classify_invoice(document.ocr_data, tenant_name)
            
            # Mapper les types du classifier vers les types du modèle
            type_mapping = {
                "PURCHASE": "INVOICE_PURCHASE",
                "SALE": "INVOICE_SALES"
            }
            
            mapped_type = type_mapping.get(invoice_type, "INVOICE_PURCHASE")
            document.type = DocumentType(mapped_type)
            
            print(f"🤖 Classification automatique: {invoice_type} (confiance: {confidence:.2f})")
            print(f"📋 Métadonnées: {metadata}")
        except Exception as classify_err:
            print(f"⚠️ Erreur classification automatique: {classify_err}")
            # En cas d'erreur, garder le type par défaut
            pass
    
    # Utiliser le type spécifié si fourni
    if validation_data.document_type:
        try:
            document.type = DocumentType(validation_data.document_type)
        except ValueError:
            print(f"⚠️ Type de document invalide: {validation_data.document_type}, ignoré")
    
    if validation_data.date:
        with suppress(ValueError):
            document.document_date = datetime.strptime(validation_data.date, "%Y-%m-%d").date()
    if validation_data.due_date:
        with suppress(ValueError):
            document.due_date = datetime.strptime(validation_data.due_date, "%Y-%m-%d").date()
    document.amount_ht = float(validation_data.amount_ht) if validation_data.amount_ht is not None else document.amount_ht
    document.amount_vat = float(validation_data.amount_vat) if validation_data.amount_vat is not None else document.amount_vat
    document.amount_ttc = float(validation_data.amount_ttc) if validation_data.amount_ttc is not None else document.amount_ttc
    document.description = validation_data.description
    
    supplier_name = (validation_data.supplier_name or "").strip()
    if not supplier_name and document.ocr_data and isinstance(document.ocr_data, dict):
        supplier_name = (document.ocr_data.get("supplier_name") or "").strip()
    if not supplier_name:
        raise HTTPException(status_code=422, detail="supplier_name est requis. Veuillez renseigner le fournisseur.")

    if document.client_id is None:
        client = db.query(Client).filter(Client.tenant_id == current_user.tenant_id).first()
        if not client:
            from app.models.tenant import Tenant

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

    supplier_id = None
    supplier_default_account = None
    supplier_default_journal = None
    supplier_auxiliary_account = None
    try:
        try:
            row = db.execute(
                text(
                    """
                    SELECT id, default_account, default_journal, auxiliary_account_code
                    FROM suppliers
                    WHERE name = :name AND client_id = :client_id
                    LIMIT 1
                    """
                ),
                {"name": supplier_name, "client_id": document.client_id},
            ).fetchone()
            if row:
                supplier_id = row[0]
                supplier_default_account = row[1]
                supplier_default_journal = row[2]
                supplier_auxiliary_account = row[3]
        except Exception:
            row = db.execute(
                text(
                    """
                    SELECT id
                    FROM suppliers
                    WHERE name = :name AND client_id = :client_id
                    LIMIT 1
                    """
                ),
                {"name": supplier_name, "client_id": document.client_id},
            ).fetchone()
            if row:
                supplier_id = row[0]

        if supplier_id is None:
            import uuid

            supplier_id = uuid.uuid4()
            db.execute(
                text(
                    """
                    INSERT INTO suppliers (id, name, client_id)
                    VALUES (:id, :name, :client_id)
                    """
                ),
                {"id": supplier_id, "name": supplier_name, "client_id": document.client_id},
            )
            print(f"✅ Fournisseur créé (SQL): {supplier_name}")
        else:
            print(f"✅ Fournisseur existant (SQL): {supplier_name}")

        document.supplier_id = supplier_id

        if validation_data.account_number:
            try:
                db.execute(
                    text("UPDATE suppliers SET default_account = :acc WHERE id = :id"),
                    {"acc": validation_data.account_number, "id": supplier_id},
                )
                supplier_default_account = validation_data.account_number
            except Exception:
                supplier_default_account = validation_data.account_number

        if validation_data.journal_code:
            try:
                db.execute(
                    text("UPDATE suppliers SET default_journal = :j WHERE id = :id"),
                    {"j": validation_data.journal_code, "id": supplier_id},
                )
                supplier_default_journal = validation_data.journal_code
            except Exception:
                supplier_default_journal = validation_data.journal_code

    except Exception as supplier_err:
        db.rollback()
        print(f"❌ Erreur fournisseur: {type(supplier_err).__name__}: {supplier_err}")
        raise HTTPException(status_code=500, detail=f"Erreur fournisseur: {supplier_err}")
    
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

    journal_code = validation_data.journal_code or supplier_default_journal or "ACH"
    expense_account = validation_data.account_number or supplier_default_account or "601000"
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
            journal_code=journal_code,
            tenant_id=current_user.tenant_id
        )
        db.add(entry_expense)
        print("✅ Écriture dépense ajoutée")
    
        if tax_amount and tax_amount > 0:
            # Récupérer le compte TVA du fournisseur ou utiliser la valeur par défaut
            supplier_vat_account = None
            if supplier_id:
                try:
                    vat_row = db.execute(
                        text("SELECT default_vat_account FROM suppliers WHERE id = :id"),
                        {"id": supplier_id}
                    ).fetchone()
                    if vat_row and vat_row[0]:
                        supplier_vat_account = vat_row[0]
                except Exception:
                    pass
            
            entry_vat = AccountingEntry(
                document_id=document.id,
                entry_type=EntryType.DEBIT,
                account_number=supplier_vat_account or "445200", # Compte TVA fournisseur ou par défaut
                label=f"TVA sur {entry_label}",
                debit=tax_amount,
                credit=0,
                date=entry_date,
                client_id=document.client_id,
                journal_code=journal_code,
                tenant_id=current_user.tenant_id
            )
            db.add(entry_vat)
        
        entry_payable = AccountingEntry(
            document_id=document.id,
            entry_type=EntryType.CREDIT,
            account_number=supplier_auxiliary_account or "401100", # Compte auxiliaire fournisseur ou collectif par défaut
            label=f"Facture {supplier_name}",
            debit=0,
            credit=total_amount,
            date=entry_date,
            client_id=document.client_id,
            journal_code=journal_code,
            tenant_id=current_user.tenant_id
        )
        db.add(entry_payable)
        print(f"✅ Écriture fournisseur ajoutée: {supplier_auxiliary_account or '401100'} ({supplier_name})")

        db.commit()
        
        # Invalider le cache des stats pour mise à jour immédiate
        from app.core.cache import clear_cache
        clear_cache(pattern="dashboard")
        
        return document
    except Exception as e:
        db.rollback()
        import traceback
        error_trace = traceback.format_exc()
        print(f"❌ Erreur validation/comptabilisation: {type(e).__name__}: {e}")
        print(f"📋 Stack trace:\n{error_trace}")
        print(f"📋 Contexte: document_id={document.id}, client_id={document.client_id}, supplier_id={supplier_id}, date={entry_date}")
        raise HTTPException(status_code=500, detail=f"Erreur lors de la comptabilisation: {str(e)}")


# ============================================================================
# ASYNC UPLOAD ENDPOINTS
# ============================================================================

@router.post("/upload-multipage-async")
async def upload_multipage_pdf_async(
    *,
    db: Session = Depends(deps.get_db_session),
    file: UploadFile = File(...),
    current_user: User = Depends(deps.get_current_user),
    client_id: Optional[UUID] = None,
    pages_per_document: int = Query(1, ge=1, description="Nombre de pages par document créé"),
):
    """
    Upload un PDF multi-pages en mode ASYNCHRONE.
    Retourne immédiatement un job_id pour suivre la progression.
    
    Idéal pour les gros PDFs (>30 pages) qui risquent de timeout.
    Le traitement se fait en arrière-plan.
    """
    from app.services.ocr_enhanced import enhanced_ocr_service
    from app.models.upload_job import UploadJob, UploadJobStatus
    from app.services.async_upload import start_background_job
    
    if not file.filename or not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Seuls les fichiers PDF sont acceptés")
    
    try:
        file_content = await file.read()
        
        # Compter les pages
        page_count = enhanced_ocr_service.get_pdf_page_count(file_content)
        
        if page_count == 0:
            raise HTTPException(status_code=400, detail="Impossible de lire le PDF ou PDF vide")
        
        # Limite absolue
        if page_count > 500:
            raise HTTPException(
                status_code=400,
                detail=f"PDF trop volumineux ({page_count} pages). Maximum: 500 pages."
            )
        
        # Upload le PDF original vers le storage
        from io import BytesIO
        from fastapi import UploadFile as FastAPIUploadFile
        
        temp_file = FastAPIUploadFile(
            file=BytesIO(file_content),
            filename=f"async_job_{file.filename}"
        )
        
        upload_result = await storage_service.upload_file(
            temp_file,
            tenant_id=str(current_user.tenant_id)
        )
        
        if isinstance(upload_result, dict):
            stored_path = upload_result.get('key') or upload_result.get('url')
        else:
            stored_path = str(upload_result)
        
        # Créer le job
        job = UploadJob(
            tenant_id=current_user.tenant_id,
            user_id=current_user.id,
            original_filename=file.filename,
            file_path=stored_path,
            total_pages=page_count,
            pages_per_document=pages_per_document,
            status=UploadJobStatus.PENDING,
            client_id=client_id,
        )
        db.add(job)
        db.commit()
        db.refresh(job)
        
        # Démarrer le traitement en arrière-plan
        start_background_job(job.id)
        
        return {
            "success": True,
            "mode": "async",
            "job_id": str(job.id),
            "message": f"Traitement démarré pour {page_count} pages. Utilisez /upload-jobs/{job.id} pour suivre la progression.",
            "total_pages": page_count,
            "expected_documents": job.expected_documents,
            "status_url": f"/api/v1/documents/upload-jobs/{job.id}"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Async upload error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Erreur lors de la création du job: {str(e)}")


@router.get("/upload-jobs/{job_id}")
async def get_upload_job_status(
    job_id: UUID,
    db: Session = Depends(deps.get_db_session),
    current_user: User = Depends(deps.get_current_user),
):
    """
    Récupère le statut d'un job d'upload async.
    Utilisez cet endpoint pour le polling de progression.
    """
    from app.models.upload_job import UploadJob
    
    job = db.query(UploadJob).filter(
        UploadJob.id == job_id,
        UploadJob.tenant_id == current_user.tenant_id
    ).first()
    
    if not job:
        raise HTTPException(status_code=404, detail="Job non trouvé")
    
    return job.to_dict()


@router.get("/upload-jobs")
async def list_upload_jobs(
    db: Session = Depends(deps.get_db_session),
    current_user: User = Depends(deps.get_current_user),
    status: Optional[str] = None,
    limit: int = Query(20, ge=1, le=100),
):
    """
    Liste les jobs d'upload de l'utilisateur.
    """
    from app.models.upload_job import UploadJob, UploadJobStatus
    
    query = db.query(UploadJob).filter(
        UploadJob.tenant_id == current_user.tenant_id
    )
    
    if status:
        try:
            status_enum = UploadJobStatus(status)
            query = query.filter(UploadJob.status == status_enum)
        except ValueError:
            pass
    
    jobs = query.order_by(UploadJob.created_at.desc()).limit(limit).all()
    
    return {
        "jobs": [job.to_dict() for job in jobs],
        "count": len(jobs)
    }


@router.get("/ocr-test")
async def test_ocr_service(
    current_user: User = Depends(deps.get_current_user),
):
    """Test OCR service configuration and connectivity."""
    import os
    from app.services.ocr import ocr_service, GROQ_API_KEY, GROQ_MODEL
    from app.services.ocr_enhanced import enhanced_ocr_service, VISION_MODEL, VISION_FALLBACK, PROCESSING_MODEL
    
    result = {
        "groq_api_key_configured": bool(GROQ_API_KEY),
        "groq_api_key_length": len(GROQ_API_KEY) if GROQ_API_KEY else 0,
        "models": {
            "basic_model": GROQ_MODEL,
            "vision_model": VISION_MODEL,
            "vision_fallback": VISION_FALLBACK,
            "processing_model": PROCESSING_MODEL,
        },
        "use_enhanced": ocr_service.use_enhanced,
    }
    
    if GROQ_API_KEY:
        import httpx
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    "https://api.groq.com/openai/v1/models",
                    headers={"Authorization": f"Bearer {GROQ_API_KEY}"}
                )
                if response.status_code == 200:
                    models_data = response.json()
                    available_models = [m["id"] for m in models_data.get("data", [])]
                    result["available_models"] = sorted(available_models)
                    result["vision_model_valid"] = VISION_MODEL in available_models
                    result["fallback_model_valid"] = VISION_FALLBACK in available_models
                else:
                    result["groq_api_error"] = f"{response.status_code}: {response.text[:200]}"
        except Exception as e:
            result["groq_connection_error"] = str(e)
    
    return result


@router.get("/validees", response_model=List[DocumentSchema])
def get_validated_documents(
    db: Session = Depends(deps.get_db_session),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_user),
    client_id: Optional[UUID] = None,
) -> Any:
    """
    Récupère les documents validés (status = VALIDEE).
    """
    try:
        query = db.query(Document).filter(
            Document.tenant_id == current_user.tenant_id,
            Document.status == DocumentStatus.VALIDEE
        )
        
        if client_id:
            query = query.filter(Document.client_id == client_id)
        
        results = query.order_by(Document.created_at.desc()).offset(skip).limit(limit).all()
        print(f"Found {len(results)} validated documents")
        return results
        
    except Exception as e:
        print(f"Error fetching validated documents: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de la récupération des documents validés: {str(e)}"
        )
