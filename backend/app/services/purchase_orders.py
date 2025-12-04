"""
Service for Purchase Order operations
"""
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc
from datetime import datetime

from app.models.purchase_order import PurchaseOrder, PurchaseOrderItem


class PurchaseOrderService:
    def get_purchase_orders(
        self,
        db: Session,
        tenant_id: str,
        skip: int = 0,
        limit: int = 100,
        status: Optional[str] = None,
        supplier_id: Optional[str] = None,
    ) -> List[PurchaseOrder]:
        """Get all purchase orders for a tenant with optional filters"""
        query = db.query(PurchaseOrder).filter(PurchaseOrder.tenant_id == tenant_id)

        if status:
            query = query.filter(PurchaseOrder.status == status)

        if supplier_id:
            query = query.filter(PurchaseOrder.supplier_id == supplier_id)

        return query.order_by(desc(PurchaseOrder.created_at)).offset(skip).limit(limit).all()

    def get_purchase_order_by_id(self, db: Session, po_id: str, tenant_id: str) -> Optional[PurchaseOrder]:
        """Get a specific purchase order by ID"""
        return db.query(PurchaseOrder).filter(
            and_(
                PurchaseOrder.id == po_id,
                PurchaseOrder.tenant_id == tenant_id
            )
        ).first()

    def create_purchase_order(self, db: Session, tenant_id: str, po_data: dict) -> PurchaseOrder:
        """Create a new purchase order"""
        # Extract items if present
        items_data = po_data.pop("items", [])

        # Create purchase order
        po = PurchaseOrder(tenant_id=tenant_id, **po_data)
        db.add(po)
        db.flush()  # Get the PO ID

        # Create items
        for item_data in items_data:
            item = PurchaseOrderItem(purchase_order_id=po.id, **item_data)
            db.add(item)

        db.commit()
        db.refresh(po)
        return po

    def update_purchase_order(self, db: Session, po_id: str, tenant_id: str, po_data: dict) -> Optional[PurchaseOrder]:
        """Update an existing purchase order"""
        po = self.get_purchase_order_by_id(db, po_id, tenant_id)
        if not po:
            return None

        for key, value in po_data.items():
            if key != "items" and hasattr(po, key):
                setattr(po, key, value)

        db.commit()
        db.refresh(po)
        return po

    def delete_purchase_order(self, db: Session, po_id: str, tenant_id: str) -> bool:
        """Delete a purchase order"""
        po = self.get_purchase_order_by_id(db, po_id, tenant_id)
        if not po:
            return False

        db.delete(po)
        db.commit()
        return True


purchase_order_service = PurchaseOrderService()
