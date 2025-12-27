"""
Service for Delivery Note operations
"""
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc
from datetime import datetime

from app.models.purchase_order import DeliveryNote, DeliveryNoteItem


class DeliveryNoteService:
    def get_delivery_notes(
        self,
        db: Session,
        tenant_id: str,
        skip: int = 0,
        limit: int = 100,
        status: Optional[str] = None,
        purchase_order_id: Optional[str] = None,
    ) -> List[DeliveryNote]:
        """Get all delivery notes for a tenant with optional filters"""
        query = db.query(DeliveryNote).filter(DeliveryNote.tenant_id == tenant_id)

        if status:
            query = query.filter(DeliveryNote.status == status)

        if purchase_order_id:
            query = query.filter(DeliveryNote.purchase_order_id == purchase_order_id)

        return query.order_by(desc(DeliveryNote.created_at)).offset(skip).limit(limit).all()

    def get_delivery_note_by_id(self, db: Session, delivery_note_id: str, tenant_id: str) -> Optional[DeliveryNote]:
        """Get a specific delivery note by ID"""
        return db.query(DeliveryNote).filter(
            and_(
                DeliveryNote.id == delivery_note_id,
                DeliveryNote.tenant_id == tenant_id
            )
        ).first()

    def create_delivery_note(self, db: Session, tenant_id: str, delivery_note_data: dict) -> DeliveryNote:
        """Create a new delivery note"""
        items_data = delivery_note_data.pop("items", [])

        delivery_note = DeliveryNote(tenant_id=tenant_id, **delivery_note_data)
        db.add(delivery_note)
        db.flush()  # Get the delivery note ID

        for item_data in items_data:
            item = DeliveryNoteItem(delivery_note_id=delivery_note.id, **item_data)
            db.add(item)

        db.commit()
        db.refresh(delivery_note)
        return delivery_note

    def update_delivery_note(self, db: Session, delivery_note_id: str, tenant_id: str, delivery_note_data: dict) -> Optional[DeliveryNote]:
        """Update an existing delivery note"""
        delivery_note = self.get_delivery_note_by_id(db, delivery_note_id, tenant_id)
        if not delivery_note:
            return None

        for key, value in delivery_note_data.items():
            if key != "items" and hasattr(delivery_note, key):
                setattr(delivery_note, key, value)

        db.commit()
        db.refresh(delivery_note)
        return delivery_note

    def delete_delivery_note(self, db: Session, delivery_note_id: str, tenant_id: str) -> bool:
        """Delete a delivery note"""
        delivery_note = self.get_delivery_note_by_id(db, delivery_note_id, tenant_id)
        if not delivery_note:
            return False

        db.delete(delivery_note)
        db.commit()
        return True


delivery_note_service = DeliveryNoteService()
