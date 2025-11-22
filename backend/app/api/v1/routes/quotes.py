"""API routes for Quote management (Devis)."""
from typing import List, Any, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core import deps
from app.models.user import User
from app.schemas.quote import (
    Quote,
    QuoteCreate,
    QuoteUpdate,
    QuoteWithItems,
)
from app.crud import quote as quote_crud
from app.services.pdf_generator import PDFGenerator

router = APIRouter()


@router.get("/", response_model=List[QuoteWithItems])
def list_quotes(
    db: Session = Depends(deps.get_db_session),
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = Query(None, description="Filter by status"),
    client_id: Optional[UUID] = Query(None, description="Filter by client"),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Retrieve quotes for the current tenant.
    """
    quotes = quote_crud.get_multi(
        db,
        tenant_id=current_user.tenant_id,
        skip=skip,
        limit=limit,
        status=status,
        client_id=client_id,
    )
    return quotes


@router.post("/", response_model=QuoteWithItems, status_code=201)
def create_quote(
    *,
    db: Session = Depends(deps.get_db_session),
    quote_in: QuoteCreate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Create new quote with items.
    """
    quote = quote_crud.create(
        db,
        obj_in=quote_in,
        tenant_id=current_user.tenant_id,
        user_id=current_user.id,
    )
    return quote


@router.get("/{quote_id}", response_model=QuoteWithItems)
def get_quote(
    *,
    db: Session = Depends(deps.get_db_session),
    quote_id: UUID,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get quote by ID.
    """
    quote = quote_crud.get(db, quote_id=quote_id)
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")
    if quote.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=403, detail="Not authorized to access this quote")
    return quote


@router.get("/number/{quote_number}", response_model=QuoteWithItems)
def get_quote_by_number(
    *,
    db: Session = Depends(deps.get_db_session),
    quote_number: str,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get quote by quote number.
    """
    quote = quote_crud.get_by_number(db, quote_number=quote_number, tenant_id=current_user.tenant_id)
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")
    return quote


@router.put("/{quote_id}", response_model=QuoteWithItems)
def update_quote(
    *,
    db: Session = Depends(deps.get_db_session),
    quote_id: UUID,
    quote_in: QuoteUpdate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Update a quote.
    """
    quote = quote_crud.get(db, quote_id=quote_id)
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")
    if quote.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this quote")

    quote = quote_crud.update(db, db_obj=quote, obj_in=quote_in)
    return quote


@router.delete("/{quote_id}", status_code=204)
def delete_quote(
    *,
    db: Session = Depends(deps.get_db_session),
    quote_id: UUID,
    current_user: User = Depends(deps.get_current_user),
) -> None:
    """
    Delete a quote.
    """
    quote = quote_crud.get(db, quote_id=quote_id)
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")
    if quote.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this quote")

    success = quote_crud.delete(db, quote_id=quote_id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete quote")


@router.post("/{quote_id}/send", response_model=QuoteWithItems)
def send_quote(
    *,
    db: Session = Depends(deps.get_db_session),
    quote_id: UUID,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Mark quote as sent to client.
    """
    quote = quote_crud.get(db, quote_id=quote_id)
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")
    if quote.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this quote")

    quote = quote_crud.mark_as_sent(db, quote_id=quote_id)
    return quote


@router.post("/{quote_id}/accept", response_model=QuoteWithItems)
def accept_quote(
    *,
    db: Session = Depends(deps.get_db_session),
    quote_id: UUID,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Mark quote as accepted by client.
    """
    quote = quote_crud.get(db, quote_id=quote_id)
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")
    if quote.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this quote")

    quote = quote_crud.mark_as_accepted(db, quote_id=quote_id)
    return quote


@router.post("/{quote_id}/reject", response_model=QuoteWithItems)
def reject_quote(
    *,
    db: Session = Depends(deps.get_db_session),
    quote_id: UUID,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Mark quote as rejected by client.
    """
    quote = quote_crud.get(db, quote_id=quote_id)
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")
    if quote.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this quote")

    quote = quote_crud.mark_as_rejected(db, quote_id=quote_id)
    return quote


@router.post("/{quote_id}/convert", response_model=Any)
def convert_quote_to_invoice(
    *,
    db: Session = Depends(deps.get_db_session),
    quote_id: UUID,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Convert accepted quote to sales invoice.
    """
    from app.schemas.sales_invoice import SalesInvoiceWithDetails

    quote = quote_crud.get(db, quote_id=quote_id)
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")
    if quote.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=403, detail="Not authorized to convert this quote")

    invoice = quote_crud.convert_to_invoice(db, quote_id=quote_id)
    if not invoice:
        raise HTTPException(status_code=400, detail="Failed to convert quote. Quote must be accepted first.")

    return invoice


@router.get("/{quote_id}/pdf")
def generate_quote_pdf(
    *,
    db: Session = Depends(deps.get_db_session),
    quote_id: UUID,
    current_user: User = Depends(deps.get_current_user),
) -> FileResponse:
    """
    Generate and download PDF for this quote.
    """
    quote = quote_crud.get(db, quote_id=quote_id)
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")
    if quote.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=403, detail="Not authorized to access this quote")

    try:
        pdf_gen = PDFGenerator()
        pdf_path = pdf_gen.generate_quote_pdf(quote, current_user.tenant)

        return FileResponse(
            pdf_path,
            media_type='application/pdf',
            filename=f"devis_{quote.quote_number}.pdf"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate PDF: {str(e)}")
