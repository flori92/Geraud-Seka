"""
Routes API pour l'import/export de données
"""

import csv
import io
import uuid
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, BackgroundTasks
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import and_
from pydantic import BaseModel

from app.db.session import get_db
from app.api.deps import get_current_user, get_current_tenant
from app.models.user import User
from app.models.tenant import Tenant
from app.models.notifications import ImportExportJob, ImportExportStatus
from app.models.crm import Lead, Contact, LeadStatus, LeadSource

router = APIRouter()


"""
Import/Export CRM endpoints removed (CRM deprecated).
Empty router kept for compatibility.
"""

from fastapi import APIRouter

router = APIRouter()

# ==================== ROUTES IMPORT ====================

@router.post("/import/upload")
async def upload_import_file(
    file: UploadFile = File(...),
    entity_type: str = Query(...),
    background_tasks: BackgroundTasks = None,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload un fichier CSV pour import"""
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Seuls les fichiers CSV sont acceptés")
    
    content = await file.read()
    
    # Analyser le fichier
    try:
        decoded = content.decode('utf-8')
        reader = csv.reader(io.StringIO(decoded))
        headers = next(reader)
        row_count = sum(1 for _ in reader)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erreur lecture CSV: {str(e)}")
    
    # Créer le job d'import
    job = ImportExportJob(
        job_type="import",
        entity_type=entity_type,
        file_name=file.filename,
        file_size=len(content),
        total_rows=row_count,
        status=ImportExportStatus.PENDING,
        config={"headers": headers},
        tenant_id=current_tenant.id,
        created_by=current_user.id
    )
    
    db.add(job)
    db.commit()
    db.refresh(job)
    
    return {
        "job_id": str(job.id),
        "file_name": file.filename,
        "total_rows": row_count,
        "headers": headers,
        "suggested_mapping": suggest_column_mapping(headers, entity_type)
    }


@router.post("/import/{job_id}/start")
async def start_import(
    job_id: str,
    mapping: dict,
    background_tasks: BackgroundTasks,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Démarrer l'import avec le mapping défini"""
    job = db.query(ImportExportJob).filter(
        and_(
            ImportExportJob.id == job_id,
            ImportExportJob.tenant_id == current_tenant.id
        )
    ).first()
    
    if not job:
        raise HTTPException(status_code=404, detail="Job non trouvé")
    
    job.config["mapping"] = mapping
    job.status = ImportExportStatus.PROCESSING
    job.started_at = datetime.utcnow()
    db.commit()
    
    # Lancer en arrière-plan
    background_tasks.add_task(process_import, str(job.id), str(current_tenant.id))
    
    return {"message": "Import démarré", "job_id": str(job.id)}


@router.get("/import/{job_id}/status")
async def get_import_status(
    job_id: str,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Statut d'un import"""
    job = db.query(ImportExportJob).filter(
        and_(
            ImportExportJob.id == job_id,
            ImportExportJob.tenant_id == current_tenant.id
        )
    ).first()
    
    if not job:
        raise HTTPException(status_code=404, detail="Job non trouvé")
    
    return {
        "id": str(job.id),
        "status": job.status,
        "progress": job.progress,
        "total_rows": job.total_rows,
        "processed_rows": job.processed_rows,
        "success_rows": job.success_rows,
        "error_rows": job.error_rows,
        "errors": job.errors[:10] if job.errors else [],
        "started_at": job.started_at.isoformat() if job.started_at else None,
        "completed_at": job.completed_at.isoformat() if job.completed_at else None
    }


# ==================== ROUTES EXPORT ====================

@router.get("/export/{entity_type}")
async def export_data(
    entity_type: str,
    format: str = Query("csv"),
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Exporter des données en CSV"""
    if entity_type == "leads":
        data = export_leads(db, current_tenant.id)
    elif entity_type == "contacts":
        data = export_contacts(db, current_tenant.id)
    else:
        raise HTTPException(status_code=400, detail="Type d'entité non supporté")
    
    # Créer le CSV
    output = io.StringIO()
    if data:
        writer = csv.DictWriter(output, fieldnames=data[0].keys())
        writer.writeheader()
        writer.writerows(data)
    
    output.seek(0)
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={entity_type}_{datetime.now().strftime('%Y%m%d')}.csv"}
    )


@router.get("/jobs")
async def list_jobs(
    job_type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    limit: int = Query(20),
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Liste des jobs d'import/export"""
    query = db.query(ImportExportJob).filter(
        ImportExportJob.tenant_id == current_tenant.id
    )
    
    if job_type:
        query = query.filter(ImportExportJob.job_type == job_type)
    if status:
        query = query.filter(ImportExportJob.status == status)
    
    jobs = query.order_by(ImportExportJob.created_at.desc()).limit(limit).all()
    
    return [
        {
            "id": str(j.id),
            "job_type": j.job_type,
            "entity_type": j.entity_type,
            "file_name": j.file_name,
            "status": j.status,
            "progress": j.progress,
            "total_rows": j.total_rows,
            "success_rows": j.success_rows,
            "error_rows": j.error_rows,
            "created_at": j.created_at.isoformat() if j.created_at else None
        }
        for j in jobs
    ]


# ==================== HELPERS ====================

def suggest_column_mapping(headers: List[str], entity_type: str) -> dict:
    """Suggère un mapping automatique des colonnes"""
    mapping = {}
    
    field_aliases = {
        "leads": {
            "first_name": ["prénom", "prenom", "firstname", "first name"],
            "last_name": ["nom", "lastname", "last name", "family name"],
            "email": ["email", "e-mail", "mail", "courriel"],
            "phone": ["téléphone", "telephone", "phone", "tel"],
            "company": ["entreprise", "société", "societe", "company", "organisation"],
            "job_title": ["poste", "fonction", "job", "title", "job title"],
            "source": ["source", "origine", "provenance"],
            "status": ["statut", "status", "état", "etat"],
            "city": ["ville", "city"],
            "country": ["pays", "country"]
        },
        "contacts": {
            "first_name": ["prénom", "prenom", "firstname", "first name"],
            "last_name": ["nom", "lastname", "last name"],
            "email": ["email", "e-mail", "mail"],
            "phone": ["téléphone", "telephone", "phone"],
            "mobile": ["mobile", "portable", "cell"],
            "job_title": ["poste", "fonction", "job title"],
            "department": ["département", "departement", "service", "department"]
        }
    }
    
    aliases = field_aliases.get(entity_type, {})
    
    for header in headers:
        header_lower = header.lower().strip()
        for field, possible_names in aliases.items():
            if header_lower in possible_names or header_lower == field:
                mapping[header] = field
                break
    
    return mapping


def export_leads(db: Session, tenant_id: str) -> List[dict]:
    """Exporte les leads"""
    leads = db.query(Lead).filter(Lead.tenant_id == tenant_id).all()
    
    return [
        {
            "id": str(l.id),
            "first_name": l.first_name,
            "last_name": l.last_name,
            "email": l.email,
            "phone": l.phone,
            "company": l.company,
            "job_title": l.job_title,
            "status": l.status,
            "source": l.source,
            "score": l.score,
            "city": l.city,
            "country": l.country,
            "created_at": l.created_at.isoformat() if l.created_at else ""
        }
        for l in leads
    ]


def export_contacts(db: Session, tenant_id: str) -> List[dict]:
    """Exporte les contacts"""
    contacts = db.query(Contact).filter(Contact.tenant_id == tenant_id).all()
    
    return [
        {
            "id": str(c.id),
            "first_name": c.first_name,
            "last_name": c.last_name,
            "email": c.email,
            "phone": c.phone,
            "mobile": c.mobile,
            "job_title": c.job_title,
            "department": c.department,
            "city": c.city,
            "country": c.country,
            "created_at": c.created_at.isoformat() if c.created_at else ""
        }
        for c in contacts
    ]


async def process_import(job_id: str, tenant_id: str):
    """Traite un import en arrière-plan"""
    from app.db.session import SessionLocal
    
    db = SessionLocal()
    
    try:
        job = db.query(ImportExportJob).get(job_id)
        if not job:
            return
        
        mapping = job.config.get("mapping", {})
        errors = []
        success = 0
        
        # TODO: Lire le fichier depuis le stockage
        # Pour l'instant, simulation
        
        for i in range(job.total_rows):
            try:
                # Créer l'entité selon le type
                if job.entity_type == "leads":
                    # Créer un lead
                    pass
                elif job.entity_type == "contacts":
                    # Créer un contact
                    pass
                
                success += 1
            except Exception as e:
                errors.append({"row": i + 1, "error": str(e)})
            
            job.processed_rows = i + 1
            if i % 100 == 0:
                db.commit()
        
        job.success_rows = success
        job.error_rows = len(errors)
        job.errors = errors
        job.status = ImportExportStatus.COMPLETED
        job.completed_at = datetime.utcnow()
        db.commit()
        
    except Exception as e:
        job.status = ImportExportStatus.FAILED
        job.errors = [{"error": str(e)}]
        db.commit()
    finally:
        db.close()
