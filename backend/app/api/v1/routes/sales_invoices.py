"""
API Routes pour la gestion des Factures (Sales Invoices)
Endpoints RESTful complètement typés et documentés
"""

from datetime import datetime, timedelta
from decimal import Decimal
from typing import Optional
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import and_, desc, func
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models.sales_invoice import SalesInvoice, SalesInvoiceItem
from app.models.user import User
from app.schemas.invoices import (
    InvoiceCreate,
    InvoiceResponse,
    InvoiceUpdate,
    InvoiceStats,
    InvoiceListResponse,
    InvoiceStatus,
)

router = APIRouter(prefix="/invoices", tags=["Invoices"])


@router.get(
    "",
    response_model=InvoiceListResponse,
    summary="Lister les factures",
    description="Récupère la liste des factures avec pagination et filtrage optionnel",
)
async def list_invoices(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = Query(0, ge=0, description="Nombre d'éléments à ignorer"),
    limit: int = Query(20, ge=1, le=100, description="Nombre max d'éléments retournés"),
    status: Optional[InvoiceStatus] = Query(None, description="Filtrer par statut"),
    client_id: Optional[str] = Query(None, description="Filtrer par client"),
    search: Optional[str] = Query(None, description="Rechercher par référence ou description"),
) -> InvoiceListResponse:
    """
    Retourne la liste des factures du tenant avec pagination.
    
    **Paramètres optionnels:**
    - status: draft, pending, paid, overdue, cancelled
    - client_id: UUID du client
    - search: Recherche par numéro de facture ou description
    """
    query = db.query(SalesInvoice).filter(
        SalesInvoice.tenant_id == current_user.tenant_id
    )
    
    if status:
        query = query.filter(SalesInvoice.status == status.value)
    
    if client_id:
        query = query.filter(SalesInvoice.client_id == client_id)
    
    if search:
        query = query.filter(
            SalesInvoice.reference_number.ilike(f"%{search}%") |
            SalesInvoice.description.ilike(f"%{search}%")
        )
    
    total = query.count()
    invoices = query.order_by(desc(SalesInvoice.created_at)).offset(skip).limit(limit).all()
    
    return InvoiceListResponse(
        items=[InvoiceResponse.from_orm(inv) for inv in invoices],
        total=total,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/stats",
    response_model=InvoiceStats,
    summary="Statistiques des factures",
    description="Récupère les statistiques globales des factures du tenant",
)
async def get_invoice_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> InvoiceStats:
    """
    Retourne les statistiques de toutes les factures du tenant.
    Utile pour afficher un dashboard ou KPIs.
    """
    invoices = db.query(SalesInvoice).filter(
        SalesInvoice.tenant_id == current_user.tenant_id
    ).all()
    
    total_amount = sum(inv.total_ttc for inv in invoices) or Decimal(0)
    paid_amount = sum(
        inv.total_ttc for inv in invoices if inv.status == "paid"
    ) or Decimal(0)
    pending_amount = sum(
        inv.total_ttc for inv in invoices if inv.status == "pending"
    ) or Decimal(0)
    overdue_amount = sum(
        inv.total_ttc for inv in invoices if inv.status == "overdue"
    ) or Decimal(0)
    
    return InvoiceStats(
        total_amount=total_amount,
        paid_amount=paid_amount,
        pending_amount=pending_amount,
        overdue_amount=overdue_amount,
        draft_count=len([i for i in invoices if i.status == "draft"]),
        pending_count=len([i for i in invoices if i.status == "pending"]),
        paid_count=len([i for i in invoices if i.status == "paid"]),
        overdue_count=len([i for i in invoices if i.status == "overdue"]),
    )


@router.post(
    "",
    response_model=InvoiceResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Créer une facture",
    description="Crée une nouvelle facture avec ses items",
)
async def create_invoice(
    invoice_data: InvoiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> InvoiceResponse:
    """
    Crée une nouvelle facture.
    
    **Body:**
    - reference_number: Numéro unique de facture (ex: INV-2025-001)
    - client_id: UUID du client
    - due_date: Date d'échéance requise
    - items: Liste d'au moins 1 item avec product_name, quantity, unit_price
    """
    existing = db.query(SalesInvoice).filter(
        and_(
            SalesInvoice.tenant_id == current_user.tenant_id,
            SalesInvoice.reference_number == invoice_data.reference_number,
        )
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Facture avec le numéro {invoice_data.reference_number} existe déjà",
        )
    
    invoice_id = str(uuid4())
    invoice = SalesInvoice(
        id=invoice_id,
        tenant_id=current_user.tenant_id,
        reference_number=invoice_data.reference_number,
        client_id=invoice_data.client_id,
        invoice_date=invoice_data.invoice_date,
        due_date=invoice_data.due_date,
        description=invoice_data.description,
        notes=invoice_data.notes,
        status=invoice_data.status.value,
    )
    
    total_ht = Decimal(0)
    total_tax = Decimal(0)
    
    for item_data in invoice_data.items:
        total_ht_item = item_data.quantity * item_data.unit_price
        total_tax_item = total_ht_item * (item_data.tax_rate / 100)
        total_ttc_item = total_ht_item + total_tax_item
        
        item = SalesInvoiceItem(
            id=str(uuid4()),
            sales_invoice_id=invoice_id,
            product_id=item_data.product_id,
            product_name=item_data.product_name,
            description=item_data.description,
            quantity=item_data.quantity,
            unit_price=item_data.unit_price,
            tax_rate=item_data.tax_rate,
            total_ht=total_ht_item,
            total_ttc=total_ttc_item,
        )
        invoice.items.append(item)
        total_ht += total_ht_item
        total_tax += total_tax_item
    
    invoice.total_ht = total_ht
    invoice.total_tax = total_tax
    invoice.total_ttc = total_ht + total_tax
    
    db.add(invoice)
    db.commit()
    db.refresh(invoice)
    
    return InvoiceResponse.from_orm(invoice)


@router.get(
    "/{invoice_id}",
    response_model=InvoiceResponse,
    summary="Récupérer une facture",
    description="Récupère une facture spécifique par ID",
)
async def get_invoice(
    invoice_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> InvoiceResponse:
    """Récupère une facture spécifique du tenant."""
    invoice = db.query(SalesInvoice).filter(
        and_(
            SalesInvoice.id == invoice_id,
            SalesInvoice.tenant_id == current_user.tenant_id,
        )
    ).first()
    
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Facture non trouvée",
        )
    
    return InvoiceResponse.from_orm(invoice)


@router.patch(
    "/{invoice_id}",
    response_model=InvoiceResponse,
    summary="Mettre à jour une facture",
    description="Met à jour une facture existante (partiellement ou totalement)",
)
async def update_invoice(
    invoice_id: str,
    invoice_data: InvoiceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> InvoiceResponse:
    """
    Met à jour une facture.
    
    Seules les factures en brouillon peuvent être mises à jour.
    """
    invoice = db.query(SalesInvoice).filter(
        and_(
            SalesInvoice.id == invoice_id,
            SalesInvoice.tenant_id == current_user.tenant_id,
        )
    ).first()
    
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Facture non trouvée",
        )
    
    if invoice.status != "draft":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Seules les factures en brouillon peuvent être modifiées",
        )
    
    update_data = invoice_data.dict(exclude_unset=True)
    
    items_data = update_data.pop("items", None)
    
    for field, value in update_data.items():
        if value is not None:
            if field == "status":
                setattr(invoice, field, value.value)
            else:
                setattr(invoice, field, value)
    
    if items_data is not None:
        db.query(SalesInvoiceItem).filter(
            SalesInvoiceItem.sales_invoice_id == invoice_id
        ).delete()
        
        total_ht = Decimal(0)
        total_tax = Decimal(0)
        
        for item_data in items_data:
            total_ht_item = item_data.quantity * item_data.unit_price
            total_tax_item = total_ht_item * (item_data.tax_rate / 100)
            
            item = SalesInvoiceItem(
                id=str(uuid4()),
                sales_invoice_id=invoice_id,
                product_id=item_data.product_id,
                product_name=item_data.product_name,
                description=item_data.description,
                quantity=item_data.quantity,
                unit_price=item_data.unit_price,
                tax_rate=item_data.tax_rate,
                total_ht=total_ht_item,
                total_ttc=total_ht_item + total_tax_item,
            )
            invoice.items.append(item)
            total_ht += total_ht_item
            total_tax += total_tax_item
        
        invoice.total_ht = total_ht
        invoice.total_tax = total_tax
        invoice.total_ttc = total_ht + total_tax
    
    db.commit()
    db.refresh(invoice)
    
    return InvoiceResponse.from_orm(invoice)


@router.delete(
    "/{invoice_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Supprimer une facture",
    description="Supprime une facture. Les factures payées nécessitent une confirmation.",
)
async def delete_invoice(
    invoice_id: str,
    force: bool = Query(False, description="Forcer la suppression même si la facture est payée"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    """
    Supprime une facture du tenant.
    
    - Les factures en brouillon peuvent être supprimées directement
    - Les factures envoyées/impayées peuvent être supprimées avec confirmation
    - Les factures payées nécessitent force=True pour être supprimées
    """
    invoice = db.query(SalesInvoice).filter(
        and_(
            SalesInvoice.id == invoice_id,
            SalesInvoice.tenant_id == current_user.tenant_id,
        )
    ).first()
    
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Facture non trouvée",
        )
    
    # Vérification des restrictions
    if invoice.payment_status == "paid" and not force:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cette facture est payée. Utilisez force=true pour confirmer la suppression.",
        )
    
    # Suppression
    db.delete(invoice)
    db.commit()


@router.post(
    "/{invoice_id}/mark-as-sent",
    response_model=InvoiceResponse,
    summary="Marquer facture comme envoyée",
    description="Change le statut d'une facture de brouillon à en attente",
)
async def mark_invoice_as_sent(
    invoice_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> InvoiceResponse:
    """Marque une facture comme envoyée (brouillon → en attente)."""
    invoice = db.query(SalesInvoice).filter(
        and_(
            SalesInvoice.id == invoice_id,
            SalesInvoice.tenant_id == current_user.tenant_id,
        )
    ).first()
    
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Facture non trouvée",
        )
    
    if invoice.status != "draft":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Seules les factures en brouillon peuvent être envoyées",
        )
    
    invoice.status = "pending"
    db.commit()
    db.refresh(invoice)
    
    return InvoiceResponse.from_orm(invoice)


@router.post(
    "/{invoice_id}/mark-as-paid",
    response_model=InvoiceResponse,
    summary="Marquer facture comme payée",
    description="Change le statut d'une facture à payée",
)
async def mark_invoice_as_paid(
    invoice_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> InvoiceResponse:
    """Marque une facture comme payée."""
    invoice = db.query(SalesInvoice).filter(
        and_(
            SalesInvoice.id == invoice_id,
            SalesInvoice.tenant_id == current_user.tenant_id,
        )
    ).first()
    
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Facture non trouvée",
        )
    
    if invoice.status not in ["pending", "overdue"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Seules les factures en attente ou en retard peuvent être marquées payées",
        )
    
    invoice.status = "paid"
    db.commit()
    db.refresh(invoice)
    
    return InvoiceResponse.from_orm(invoice)
