"""
Settings endpoints - Company, VAT, Users, etc.
"""
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from uuid import UUID

from app.api import deps
from app.models.user import User
from app.models.tenant import Tenant
from app.db.session import get_db

router = APIRouter()


# ============================================================================
# COMPANY SETTINGS
# ============================================================================

@router.get("/company")
async def get_company_settings(
    current_tenant: Tenant = Depends(deps.get_current_tenant),
    db: Session = Depends(deps.get_db_session)
):
    """Get company settings"""
    return {
        "name": current_tenant.name or "",
        "legal_form": getattr(current_tenant, 'legal_form', 'SARL'),
        "address": getattr(current_tenant, 'address', ''),
        "city": getattr(current_tenant, 'city', ''),
        "country": getattr(current_tenant, 'country', 'Bénin'),
        "phone": getattr(current_tenant, 'phone', ''),
        "email": getattr(current_tenant, 'email', ''),
        "website": getattr(current_tenant, 'website', ''),
        "nif": getattr(current_tenant, 'nif', ''),
        "rccm": getattr(current_tenant, 'rccm', ''),
        "currency": getattr(current_tenant, 'currency', 'FCFA'),
        "fiscal_year_start": getattr(current_tenant, 'fiscal_year_start', '01-01'),
        "logo_url": getattr(current_tenant, 'logo_url', None)
    }


@router.put("/company")
async def update_company_settings(
    data: dict,
    current_tenant: Tenant = Depends(deps.get_current_tenant),
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db_session)
):
    """Update company settings"""
    # Update tenant with provided data
    for key, value in data.items():
        if hasattr(current_tenant, key):
            setattr(current_tenant, key, value)
    
    db.commit()
    db.refresh(current_tenant)
    
    return {"message": "Settings updated successfully"}


@router.post("/company/logo")
async def upload_company_logo(
    logo: UploadFile = File(...),
    current_tenant: Tenant = Depends(deps.get_current_tenant),
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db_session)
):
    """Upload company logo"""
    # TODO: Implement logo upload to storage (R2/S3)
    # For now, return a placeholder
    logo_url = f"/uploads/logos/{current_tenant.id}/{logo.filename}"
    
    current_tenant.logo_url = logo_url
    db.commit()
    
    return {"logo_url": logo_url}


# ============================================================================
# VAT SETTINGS
# ============================================================================

@router.get("/vat")
async def get_vat_settings(
    current_tenant: Tenant = Depends(deps.get_current_tenant),
    db: Session = Depends(deps.get_db_session)
):
    """Get VAT settings"""
    # Return default VAT rates for now
    return [
        {
            "id": "1",
            "rate": 18,
            "name": "TVA standard Bénin",
            "deductible_account": "4454",
            "collected_account": "4457",
            "is_default": True
        },
        {
            "id": "2",
            "rate": 0,
            "name": "Exonéré",
            "deductible_account": "4454",
            "collected_account": "4457",
            "is_default": False
        }
    ]


@router.put("/vat")
async def update_vat_settings(
    data: dict,
    current_tenant: Tenant = Depends(deps.get_current_tenant),
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db_session)
):
    """Update VAT settings"""
    # TODO: Store VAT rates in database
    return {"message": "VAT settings updated successfully"}


# ============================================================================
# CABINET SETTINGS
# ============================================================================

@router.get("/cabinet/clients")
async def get_cabinet_clients(
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db_session)
):
    """Get cabinet clients list"""
    # TODO: Implement cabinet clients management
    # For now return empty list
    return []
