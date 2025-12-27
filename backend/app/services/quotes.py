"""
Service for Quote (Devis) operations
"""
from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import and_, desc
from datetime import datetime

from app.models.quote import Quote, QuoteItem
from app.models.client import Client


class QuoteService:
    def get_quotes(
        self,
        db: Session,
        tenant_id: UUID,
        skip: int = 0,
        limit: int = 100,
        status: Optional[str] = None,
        client_id: Optional[UUID] = None,
    ) -> List[Quote]:
        """Get all quotes for a tenant with optional filters"""
        query = (
            db.query(Quote)
            .options(
                selectinload(Quote.client),
                selectinload(Quote.items),
            )
            .filter(Quote.tenant_id == tenant_id)
        )

        if status:
            query = query.filter(Quote.status == status)

        if client_id:
            query = query.filter(Quote.client_id == client_id)

        return query.order_by(desc(Quote.created_at)).offset(skip).limit(limit).all()

    def get_quote_by_id(self, db: Session, quote_id: str, tenant_id: UUID) -> Optional[Quote]:
        """Get a specific quote by ID"""
        return db.query(Quote).filter(
            and_(
                Quote.id == quote_id,
                Quote.tenant_id == tenant_id
            )
        ).first()

    def create_quote(self, db: Session, tenant_id: UUID, quote_data: dict) -> Quote:
        """Create a new quote"""
        items_data = quote_data.pop("items", [])

        quote = Quote(tenant_id=tenant_id, **quote_data)
        db.add(quote)
        db.flush()  # Get the quote ID

        for item_data in items_data:
            item = QuoteItem(quote_id=quote.id, **item_data)
            db.add(item)

        db.commit()
        db.refresh(quote)
        return quote

    def update_quote(self, db: Session, quote_id: str, tenant_id: str, quote_data: dict) -> Optional[Quote]:
        """Update an existing quote"""
        quote = self.get_quote_by_id(db, quote_id, tenant_id)
        if not quote:
            return None

        for key, value in quote_data.items():
            if key != "items" and hasattr(quote, key):
                setattr(quote, key, value)

        db.commit()
        db.refresh(quote)
        return quote

    def delete_quote(self, db: Session, quote_id: str, tenant_id: str) -> bool:
        """Delete a quote"""
        quote = self.get_quote_by_id(db, quote_id, tenant_id)
        if not quote:
            return False

        db.delete(quote)
        db.commit()
        return True


quote_service = QuoteService()
