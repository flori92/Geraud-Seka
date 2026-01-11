import asyncio
import logging
import threading
from datetime import datetime
from uuid import UUID
import io

from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.document import Document, DocumentStatus
from app.models.upload_job import UploadJob, UploadJobStatus
from app.services.storage import storage_service
from app.services.ocr import ocr_service

logger = logging.getLogger(__name__)
_running_jobs = {}


def process_upload_job_sync(job_id: UUID):
    db = SessionLocal()
    
    try:
        job = db.query(UploadJob).filter(UploadJob.id == job_id).first()
        if not job or job.status != UploadJobStatus.PENDING:
            return
        
        job.status = UploadJobStatus.PROCESSING
        job.started_at = datetime.utcnow()
        db.commit()
        
        logger.info(f"Starting job {job_id}: {job.original_filename} ({job.total_pages} pages)")
        
        try:
            pdf_content = storage_service.download_file_sync(job.file_path)
        except Exception as e:
            logger.error(f"Failed to download PDF for job {job_id}: {e}")
            job.status = UploadJobStatus.FAILED
            job.errors = [f"Download failed: {str(e)}"]
            job.completed_at = datetime.utcnow()
            db.commit()
            return
        
        from pdf2image import convert_from_bytes
        from fastapi import UploadFile as FastAPIUploadFile
        
        created_docs = []
        errors = []
        pages_per_doc = job.pages_per_document
        total_pages = job.total_pages
        num_chunks = (total_pages + pages_per_doc - 1) // pages_per_doc
        
        for chunk_idx in range(num_chunks):
            start_page = chunk_idx * pages_per_doc + 1
            end_page = min((chunk_idx + 1) * pages_per_doc, total_pages)
            
            try:
                images = convert_from_bytes(
                    pdf_content,
                    first_page=start_page,
                    last_page=end_page,
                    dpi=150,
                    thread_count=2
                )
                
                if not images:
                    errors.append({"pages": f"{start_page}-{end_page}", "error": "Conversion failed"})
                    job.failed_documents += 1
                    continue
                
                chunk_buffer = io.BytesIO()
                base_name = job.original_filename.rsplit('.', 1)[0]
                
                if len(images) == 1:
                    images[0].save(chunk_buffer, format='JPEG', quality=90)
                    chunk_filename = f"{base_name}_p{start_page}.jpg"
                    content_type = "image/jpeg"
                    file_ext = ".jpg"
                else:
                    images[0].save(chunk_buffer, format='PDF', save_all=True, append_images=images[1:])
                    chunk_filename = f"{base_name}_p{start_page}-{end_page}.pdf"
                    content_type = "application/pdf"
                    file_ext = ".pdf"
                
                chunk_buffer.seek(0)
                
                chunk_upload = FastAPIUploadFile(file=chunk_buffer, filename=chunk_filename)
                upload_result = asyncio.run(
                    storage_service.upload_file(chunk_upload, tenant_id=str(job.tenant_id))
                )
                
                if isinstance(upload_result, dict):
                    chunk_file_path = upload_result.get('key') or upload_result.get('url')
                else:
                    chunk_file_path = str(upload_result)
                
                doc = Document(
                    filename=chunk_filename,
                    original_filename=f"{job.original_filename} (pages {start_page}-{end_page})",
                    file_path=chunk_file_path,
                    content_type=content_type,
                    file_size=len(chunk_buffer.getvalue()),
                    file_extension=file_ext,
                    status=DocumentStatus.OCR_PROCESSING,
                    tenant_id=job.tenant_id,
                    uploaded_by=job.user_id,
                    client_id=job.client_id,
                )
                db.add(doc)
                db.commit()
                db.refresh(doc)
                
                try:
                    chunk_buffer.seek(0)
                    ocr_data = asyncio.run(
                        ocr_service.process_invoice(chunk_file_path, file_content=chunk_buffer.getvalue())
                    )
                    
                    doc.reference_number = ocr_data.get("reference_number")
                    if ocr_data.get("date"):
                        try:
                            doc.document_date = datetime.fromisoformat(str(ocr_data.get("date"))).date()
                        except (ValueError, TypeError):
                            pass
                    
                    doc.amount_ht = ocr_data.get("amount_ht")
                    doc.amount_vat = ocr_data.get("amount_vat")
                    doc.amount_ttc = ocr_data.get("amount_ttc")
                    doc.supplier_name = ocr_data.get("supplier_name")
                    doc.ocr_data = ocr_data
                    doc.ocr_confidence = ocr_data.get("confidence", 0.0)
                    doc.status = DocumentStatus.OCR_COMPLETED
                except Exception as ocr_err:
                    logger.warning(f"OCR failed for chunk {start_page}-{end_page}: {ocr_err}")
                    doc.status = DocumentStatus.UPLOADED
                
                db.commit()
                
                created_docs.append(str(doc.id))
                job.successful_documents += 1
                job.processed_pages = end_page
                job.created_document_ids = created_docs
                db.commit()
                
            except Exception as chunk_err:
                logger.error(f"Job {job_id}: Chunk {start_page}-{end_page} failed: {chunk_err}")
                errors.append({"pages": f"{start_page}-{end_page}", "error": str(chunk_err)})
                job.failed_documents += 1
                job.errors = errors
                db.commit()
        
        job.completed_at = datetime.utcnow()
        job.created_document_ids = created_docs
        job.errors = errors
        
        if job.failed_documents == 0:
            job.status = UploadJobStatus.COMPLETED
        elif job.successful_documents > 0:
            job.status = UploadJobStatus.PARTIAL
        else:
            job.status = UploadJobStatus.FAILED
        
        db.commit()
        logger.info(f"Job {job_id} completed: {job.successful_documents} docs, {job.failed_documents} failed")
        
    except Exception as e:
        logger.error(f"Job {job_id} failed: {e}")
        try:
            job = db.query(UploadJob).filter(UploadJob.id == job_id).first()
            if job:
                job.status = UploadJobStatus.FAILED
                job.errors = [str(e)]
                job.completed_at = datetime.utcnow()
                db.commit()
        except:
            pass
    finally:
        db.close()
        if job_id in _running_jobs:
            del _running_jobs[job_id]


def start_background_job(job_id: UUID):
    if job_id in _running_jobs:
        return False
    
    thread = threading.Thread(target=process_upload_job_sync, args=(job_id,), daemon=True)
    _running_jobs[job_id] = thread
    thread.start()
    return True
