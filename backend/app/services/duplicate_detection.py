from typing import Optional, Dict, Any, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from datetime import date

from app.models.document import Document, DocumentStatus
from app.models.duplicate import DocumentDuplicate, DuplicateDetectionReason


class DuplicateDetectionService:
    
    def __init__(self, db: Session, tenant_id: str):
        self.db = db
        self.tenant_id = tenant_id
    
    def detect_duplicate(
        self,
        supplier_name: str,
        invoice_number: Optional[str],
        amount_ttc: Optional[float],
        document_date: Optional[date]
    ) -> Optional[Tuple[Document, DuplicateDetectionReason]]:
        
        # CRITÈRE 1: Même fournisseur + Même N° facture
        if supplier_name and invoice_number:
            existing = self.db.query(Document).filter(
                and_(
                    Document.tenant_id == self.tenant_id,
                    Document.supplier_name.ilike(f"%{supplier_name}%"),
                    Document.reference_number == invoice_number,
                    Document.status != DocumentStatus.REJECTED  # Ignorer les documents rejetés
                )
            ).first()
            
            if existing:
                return (existing, DuplicateDetectionReason.SAME_INVOICE_NUMBER)
        
        # CRITÈRE 2: Même fournisseur + Même montant TTC + Même date
        if supplier_name and amount_ttc and document_date:
            existing = self.db.query(Document).filter(
                and_(
                    Document.tenant_id == self.tenant_id,
                    Document.supplier_name.ilike(f"%{supplier_name}%"),
                    Document.amount_ttc == amount_ttc,
                    Document.document_date == document_date,
                    Document.status != DocumentStatus.REJECTED
                )
            ).first()
            
            if existing:
                return (existing, DuplicateDetectionReason.SAME_AMOUNT_DATE)
        
        # Pas de doublon détecté
        return None
    
    def create_duplicate_record(
        self,
        new_document_id: str,
        existing_document_id: str,
        detection_reason: DuplicateDetectionReason,
        comparison_data: Optional[str] = None
    ) -> DocumentDuplicate:
        """
        Crée un enregistrement de doublon détecté.
        """
        duplicate = DocumentDuplicate(
            tenant_id=self.tenant_id,
            new_document_id=new_document_id,
            existing_document_id=existing_document_id,
            detection_reason=detection_reason,
            comparison_data=comparison_data
        )
        
        self.db.add(duplicate)
        self.db.flush()
        
        return duplicate
    
    def resolve_duplicate(
        self,
        duplicate_id: str,
        resolution: str,
        user_id: str,
        resolution_reason: Optional[str] = None
    ) -> DocumentDuplicate:
        """
        Résout un doublon selon le choix de l'utilisateur.
        
        Args:
            duplicate_id: ID de l'enregistrement de doublon
            resolution: "rejected", "kept_both", ou "replaced"
            user_id: ID de l'utilisateur qui résout
            resolution_reason: Motif (obligatoire si kept_both)
        """
        from datetime import datetime
        from app.models.duplicate import DuplicateResolution
        
        duplicate = self.db.query(DocumentDuplicate).filter(
            DocumentDuplicate.id == duplicate_id
        ).first()
        
        if not duplicate:
            raise ValueError("Duplicate record not found")
        
        duplicate.resolution = DuplicateResolution(resolution)
        duplicate.resolution_reason = resolution_reason
        duplicate.resolved_by = user_id
        duplicate.resolved_at = datetime.utcnow()
        
        # Appliquer la résolution
        if resolution == "rejected":
            # Rejeter le nouveau document
            new_doc = self.db.query(Document).filter(
                Document.id == duplicate.new_document_id
            ).first()
            if new_doc:
                new_doc.status = DocumentStatus.REJECTED
        
        elif resolution == "replaced":
            # Archiver l'ancien, activer le nouveau
            existing_doc = self.db.query(Document).filter(
                Document.id == duplicate.existing_document_id
            ).first()
            if existing_doc:
                existing_doc.is_archived = True
                existing_doc.status = DocumentStatus.ARCHIVED
        
        elif resolution == "kept_both":
            # Conserver les deux : passer le nouveau à PRE_TRAITEE
            new_doc = self.db.query(Document).filter(
                Document.id == duplicate.new_document_id
            ).first()
            if new_doc:
                new_doc.status = DocumentStatus.PRE_TRAITEE
        
        # Si kept_both, on ne fait rien de spécial
        
        self.db.flush()
        return duplicate
    
    def compare_documents(
        self,
        new_doc: Document,
        existing_doc: Document
    ) -> dict:
        """
        Compare deux documents pour la modal de confrontation.
        """
        comparison_fields = [
            {
                "field": "supplier_name",
                "label": "Fournisseur",
                "new_value": new_doc.supplier_name or "N/A",
                "existing_value": existing_doc.supplier_name or "N/A",
                "identical": (new_doc.supplier_name or "").lower() == (existing_doc.supplier_name or "").lower()
            },
            {
                "field": "reference_number",
                "label": "N° Facture",
                "new_value": new_doc.reference_number or "N/A",
                "existing_value": existing_doc.reference_number or "N/A",
                "identical": (new_doc.reference_number or "").lower() == (existing_doc.reference_number or "").lower()
            },
            {
                "field": "document_date",
                "label": "Date facture",
                "new_value": new_doc.document_date.strftime("%d/%m/%Y") if new_doc.document_date else "N/A",
                "existing_value": existing_doc.document_date.strftime("%d/%m/%Y") if existing_doc.document_date else "N/A",
                "identical": new_doc.document_date == existing_doc.document_date
            },
            {
                "field": "amount_ttc",
                "label": "Montant TTC",
                "new_value": f"{float(new_doc.amount_ttc):.2f} FCFA" if new_doc.amount_ttc else "N/A",
                "existing_value": f"{float(existing_doc.amount_ttc):.2f} FCFA" if existing_doc.amount_ttc else "N/A",
                "identical": new_doc.amount_ttc == existing_doc.amount_ttc
            }
        ]
        
        all_identical = all(field["identical"] for field in comparison_fields)
        
        return {
            "fields": comparison_fields,
            "all_identical": all_identical
        }
    
    def get_duplicate_history(
        self,
        limit: int = 50,
        offset: int = 0
    ) -> list:
        """
        Récupère l'historique des doublons traités.
        """
        duplicates = self.db.query(DocumentDuplicate).filter(
            and_(
                DocumentDuplicate.tenant_id == self.tenant_id,
                DocumentDuplicate.resolution.isnot(None)  # Seulement les résolus
            )
        ).order_by(
            DocumentDuplicate.resolved_at.desc()
        ).offset(offset).limit(limit).all()
        
        return duplicates
    
    def get_pending_duplicates(self) -> list:
        """
        Récupère les doublons en attente de résolution.
        """
        duplicates = self.db.query(DocumentDuplicate).filter(
            and_(
                DocumentDuplicate.tenant_id == self.tenant_id,
                DocumentDuplicate.resolution.is_(None)  # Non résolus
            )
        ).order_by(
            DocumentDuplicate.created_at.desc()
        ).all()
        
        return duplicates
    
    def compare_documents(
        self,
        doc1: Document,
        doc2: Document
    ) -> Dict[str, Any]:
        """
        Compare deux documents et retourne les différences.
        """
        fields = [
            ("supplier_name", "Fournisseur"),
            ("reference_number", "N° facture"),
            ("document_date", "Date facture"),
            ("due_date", "Date échéance"),
            ("amount_ht", "Montant HT"),
            ("amount_vat", "TVA"),
            ("amount_ttc", "Montant TTC"),
        ]
        
        comparison = {
            "fields": [],
            "all_identical": True
        }
        
        for field_name, field_label in fields:
            val1 = getattr(doc1, field_name, None)
            val2 = getattr(doc2, field_name, None)
            
            # Formater les valeurs pour affichage
            if isinstance(val1, date):
                val1 = val1.isoformat() if val1 else None
            if isinstance(val2, date):
                val2 = val2.isoformat() if val2 else None
            
            identical = val1 == val2
            if not identical:
                comparison["all_identical"] = False
            
            comparison["fields"].append({
                "name": field_name,
                "label": field_label,
                "new_value": val1,
                "existing_value": val2,
                "identical": identical
            })
        
        return comparison
