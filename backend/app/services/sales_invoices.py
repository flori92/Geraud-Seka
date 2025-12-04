"""
Service for Sales Invoice operations
"""
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc
from datetime import datetime

from app.models.sales_invoice import SalesInvoice, SalesInvoiceItem


class SalesInvoiceService:
    def get_invoices(
        self,
        db: Session,
        tenant_id: str,
        skip: int = 0,
        limit: int = 100,
        status: Optional[str] = None,
        client_id: Optional[str] = None,
    ) -> List[SalesInvoice]:
        """Get all invoices for a tenant with optional filters"""
        query = db.query(SalesInvoice).filter(SalesInvoice.tenant_id == tenant_id)

        if status:
            query = query.filter(SalesInvoice.status == status)

        if client_id:
            query = query.filter(SalesInvoice.client_id == client_id)

        return query.order_by(desc(SalesInvoice.created_at)).offset(skip).limit(limit).all()

    def get_invoice_by_id(self, db: Session, invoice_id: str, tenant_id: str) -> Optional[SalesInvoice]:
        """Get a specific invoice by ID"""
        return db.query(SalesInvoice).filter(
            and_(
                SalesInvoice.id == invoice_id,
                SalesInvoice.tenant_id == tenant_id
            )
        ).first()

    def create_invoice(self, db: Session, tenant_id: str, invoice_data: dict) -> SalesInvoice:
        """Create a new invoice"""
        # Extract items if present
        items_data = invoice_data.pop("items", [])

        # Create invoice
        invoice = SalesInvoice(tenant_id=tenant_id, **invoice_data)
        db.add(invoice)
        db.flush()  # Get the invoice ID

        # Create items
        for item_data in items_data:
            item = SalesInvoiceItem(invoice_id=invoice.id, **item_data)
            db.add(item)

        db.commit()
        db.refresh(invoice)
        return invoice

    def update_invoice(self, db: Session, invoice_id: str, tenant_id: str, invoice_data: dict) -> Optional[SalesInvoice]:
        """Update an existing invoice"""
        invoice = self.get_invoice_by_id(db, invoice_id, tenant_id)
        if not invoice:
            return None

        for key, value in invoice_data.items():
            if key != "items" and hasattr(invoice, key):
                setattr(invoice, key, value)

        db.commit()
        db.refresh(invoice)
        return invoice

    def delete_invoice(self, db: Session, invoice_id: str, tenant_id: str) -> bool:
        """Delete an invoice"""
        invoice = self.get_invoice_by_id(db, invoice_id, tenant_id)
        if not invoice:
            return False

        db.delete(invoice)
        db.commit()
        return True


sales_invoice_service = SalesInvoiceService()
