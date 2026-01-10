"""
Service de détection de doublons de factures
Détecte les factures avec même numéro + fournisseur + montant
"""
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

from app.models.document import Document, DocumentStatus


class DuplicateDetectionService:
    """Service de détection de doublons de factures"""

    def __init__(self, db: Session, tenant_id: str):
        self.db = db
        self.tenant_id = tenant_id

    def check_duplicate(
        self,
        reference_number: str,
        supplier_name: Optional[str] = None,
        amount_ttc: Optional[float] = None,
        exclude_document_id: Optional[str] = None
    ) -> Tuple[bool, List[Document]]:
        """
        Vérifie si une facture est un doublon
        
        Critères de doublon:
        1. Même numéro de facture
        2. Même fournisseur (si fourni)
        3. Même montant TTC (si fourni)
        
        Returns:
            Tuple (is_duplicate, list_of_duplicates)
        """
        if not reference_number:
            return False, []

        # Recherche de base : même numéro de facture
        query = self.db.query(Document).filter(
            Document.tenant_id == self.tenant_id,
            Document.reference_number == reference_number,
            Document.status.in_([
                DocumentStatus.VALIDATED,
                DocumentStatus.OCR_COMPLETED,
                DocumentStatus.PENDING_VALIDATION
            ])
        )

        # Exclure le document en cours de validation
        if exclude_document_id:
            query = query.filter(Document.id != exclude_document_id)

        # Filtrer par fournisseur si fourni
        if supplier_name:
            # Recherche dans ocr_data ou ai_extracted_data
            query = query.filter(
                or_(
                    Document.ocr_data['supplier_name'].astext == supplier_name,
                    Document.ai_extracted_data['supplier_name'].astext == supplier_name
                )
            )

        # Filtrer par montant si fourni (avec tolérance de 1 FCFA)
        if amount_ttc is not None:
            tolerance = 1.0
            query = query.filter(
                and_(
                    Document.amount_ttc >= amount_ttc - tolerance,
                    Document.amount_ttc <= amount_ttc + tolerance
                )
            )

        duplicates = query.all()
        
        return len(duplicates) > 0, duplicates

    def get_all_duplicates(self) -> List[dict]:
        """
        Retourne tous les doublons potentiels dans le tenant
        
        Returns:
            Liste de groupes de doublons
        """
        # Récupérer tous les documents validés ou en attente
        documents = self.db.query(Document).filter(
            Document.tenant_id == self.tenant_id,
            Document.status.in_([
                DocumentStatus.VALIDATED,
                DocumentStatus.OCR_COMPLETED,
                DocumentStatus.PENDING_VALIDATION
            ]),
            Document.reference_number.isnot(None)
        ).all()

        # Grouper par numéro de facture
        groups = {}
        for doc in documents:
            key = doc.reference_number
            if key not in groups:
                groups[key] = []
            groups[key].append(doc)

        # Filtrer les groupes avec plus d'un document
        duplicate_groups = []
        for ref_num, docs in groups.items():
            if len(docs) > 1:
                # Vérifier si même fournisseur et montant
                suppliers = set()
                amounts = set()
                
                for doc in docs:
                    supplier = None
                    if doc.ocr_data and isinstance(doc.ocr_data, dict):
                        supplier = doc.ocr_data.get('supplier_name')
                    if not supplier and doc.ai_extracted_data and isinstance(doc.ai_extracted_data, dict):
                        supplier = doc.ai_extracted_data.get('supplier_name')
                    
                    if supplier:
                        suppliers.add(supplier)
                    if doc.amount_ttc:
                        amounts.add(round(doc.amount_ttc, 2))

                # Si même fournisseur ET même montant = doublon confirmé
                if len(suppliers) == 1 and len(amounts) == 1:
                    duplicate_groups.append({
                        'reference_number': ref_num,
                        'supplier_name': list(suppliers)[0] if suppliers else None,
                        'amount_ttc': list(amounts)[0] if amounts else None,
                        'count': len(docs),
                        'documents': [
                            {
                                'id': str(doc.id),
                                'filename': doc.filename,
                                'document_date': doc.document_date.isoformat() if doc.document_date else None,
                                'status': doc.status.value if doc.status else None,
                                'created_at': doc.created_at.isoformat() if doc.created_at else None
                            }
                            for doc in docs
                        ]
                    })

        return duplicate_groups

    def mark_as_duplicate(self, document_id: str, original_document_id: str) -> bool:
        """
        Marque un document comme doublon d'un autre
        
        Args:
            document_id: ID du document doublon
            original_document_id: ID du document original
        """
        document = self.db.query(Document).filter(
            Document.id == document_id,
            Document.tenant_id == self.tenant_id
        ).first()

        if not document:
            return False

        # Marquer comme rejeté avec raison "doublon"
        document.status = DocumentStatus.REJECTED
        
        if not document.ai_extracted_data:
            document.ai_extracted_data = {}
        
        document.ai_extracted_data['duplicate_of'] = original_document_id
        document.ai_extracted_data['rejection_reason'] = 'duplicate'
        
        self.db.commit()
        return True
