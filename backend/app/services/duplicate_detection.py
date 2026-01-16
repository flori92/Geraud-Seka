"""
Service de Détection et Gestion des Doublons
=============================================

RÈGLE SIMPLE - UN SEUL NIVEAU:
1. Même fournisseur + Même N° facture → DOUBLON (blocage)
2. Même fournisseur + Même montant TTC + Même date → DOUBLON (blocage)
3. Tout le reste → PAS DE DOUBLON (traitement normal)

Actions possibles lors de la confrontation:
- REJECT: Rejeter la nouvelle facture (garder l'existante)
- KEEP_BOTH: Conserver les deux (avec motif obligatoire)
- REPLACE: Remplacer l'existante par la nouvelle

Ce qui NE déclenche PAS de doublon:
- Même fournisseur + Même montant + Dates différentes (ex: abonnement mensuel Canal+)
- Même fournisseur + Même date + Montants différents
- Même montant + Même date + Fournisseurs différents
"""

from typing import Optional, Dict, Any, List, Tuple
from uuid import UUID, uuid4
from datetime import datetime, date
from decimal import Decimal
from enum import Enum

from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func

from app.models.document import Document, DocumentStatus


class DuplicateReason(str, Enum):
    """Raisons de détection de doublon"""
    SAME_INVOICE_NUMBER = "same_invoice_number"  # Même fournisseur + Même N° facture
    SAME_AMOUNT_DATE = "same_amount_date"  # Même fournisseur + Même montant + Même date


class DuplicateAction(str, Enum):
    """Actions possibles pour traiter un doublon"""
    REJECT = "reject"  # Rejeter la nouvelle facture
    KEEP_BOTH = "keep_both"  # Conserver les deux (motif obligatoire)
    REPLACE = "replace"  # Remplacer l'existante par la nouvelle


class DuplicateDetectionService:
    """
    Service de détection et gestion des doublons de factures.
    
    Implémente la logique du cahier des charges:
    - Blocage UNIQUEMENT pour les vrais doublons
    - Pas d'alertes inutiles pour les abonnements récurrents
    - Interface de confrontation obligatoire
    """
    
    def __init__(self, db: Session, tenant_id: str):
        self.db = db
        self.tenant_id = tenant_id
    
    # =========================================================================
    # DÉTECTION DE DOUBLONS
    # =========================================================================
    
    def detect_duplicate(
        self,
        supplier_id: Optional[str] = None,
        supplier_name: Optional[str] = None,
        invoice_number: Optional[str] = None,
        amount_ttc: Optional[float] = None,
        invoice_date: Optional[date] = None,
        exclude_document_id: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Détecte si une facture est un doublon.
        
        Algorithme:
        1. Critère 1: Même fournisseur + Même N° facture → DOUBLON
        2. Critère 2: Même fournisseur + Même montant TTC + Même date → DOUBLON
        3. Sinon → PAS DE DOUBLON
        
        Args:
            supplier_id: ID du fournisseur
            supplier_name: Nom du fournisseur (fallback)
            invoice_number: Numéro de facture
            amount_ttc: Montant TTC
            invoice_date: Date de la facture
            exclude_document_id: ID du document à exclure (pour mise à jour)
            
        Returns:
            Dict avec détails du doublon ou None
        """
        # Statuts à considérer (exclure les rejetés/archivés)
        valid_statuses = [
            DocumentStatus.VALIDATED.value if hasattr(DocumentStatus.VALIDATED, 'value') else 'validated',
            DocumentStatus.OCR_COMPLETED.value if hasattr(DocumentStatus.OCR_COMPLETED, 'value') else 'ocr_completed',
            DocumentStatus.PENDING_VALIDATION.value if hasattr(DocumentStatus.PENDING_VALIDATION, 'value') else 'pending_validation',
            'pending',
            'pre_processed'
        ]
        
        # Query de base
        base_query = self.db.query(Document).filter(
            Document.tenant_id == self.tenant_id
        )
        
        # Filtrer par statut (gérer les différents types de status)
        try:
            base_query = base_query.filter(
                or_(
                    Document.status.in_(valid_statuses),
                    Document.status.in_([s.upper() for s in valid_statuses if isinstance(s, str)])
                )
            )
        except Exception:
            # Fallback si problème avec le filtre
            pass
        
        # Exclure le document actuel
        if exclude_document_id:
            base_query = base_query.filter(Document.id != exclude_document_id)
        
        # =====================================================================
        # CRITÈRE 1: Même fournisseur + Même N° facture
        # =====================================================================
        if invoice_number and invoice_number.strip():
            query = base_query
            
            # Filtrer par fournisseur
            if supplier_id:
                query = query.filter(Document.supplier_id == supplier_id)
            elif supplier_name:
                query = query.filter(
                    func.lower(func.trim(Document.supplier_name)) == func.lower(supplier_name.strip())
                )
            
            # Rechercher par numéro de facture (insensible à la casse)
            existing = query.filter(
                func.lower(func.trim(Document.reference_number)) == func.lower(invoice_number.strip())
            ).first()
            
            if existing:
                return self._build_duplicate_result(
                    existing,
                    DuplicateReason.SAME_INVOICE_NUMBER,
                    "Même fournisseur + Même N° facture"
                )
        
        # =====================================================================
        # CRITÈRE 2: Même fournisseur + Même montant TTC + Même date
        # =====================================================================
        if amount_ttc is not None and amount_ttc > 0 and invoice_date:
            query = base_query
            
            # Filtrer par fournisseur
            if supplier_id:
                query = query.filter(Document.supplier_id == supplier_id)
            elif supplier_name:
                query = query.filter(
                    func.lower(func.trim(Document.supplier_name)) == func.lower(supplier_name.strip())
                )
            
            # Tolérance sur le montant (0.01 pour gérer les arrondis)
            amount_tolerance = Decimal("0.01")
            amount_decimal = Decimal(str(amount_ttc))
            
            # Filtrer par montant ET date
            existing = query.filter(
                and_(
                    Document.amount_ttc >= amount_decimal - amount_tolerance,
                    Document.amount_ttc <= amount_decimal + amount_tolerance,
                    func.date(Document.document_date) == invoice_date
                )
            ).first()
            
            if existing:
                return self._build_duplicate_result(
                    existing,
                    DuplicateReason.SAME_AMOUNT_DATE,
                    "Même fournisseur + Même montant + Même date"
                )
        
        # Pas de doublon détecté
        return None
    
    def _build_duplicate_result(
        self,
        existing_document: Document,
        reason: DuplicateReason,
        reason_text: str
    ) -> Dict[str, Any]:
        """Construit le résultat de détection"""
        return {
            "is_duplicate": True,
            "reason": reason.value,
            "reason_text": reason_text,
            "existing_document": {
                "id": str(existing_document.id),
                "supplier_name": existing_document.supplier_name,
                "supplier_id": str(existing_document.supplier_id) if existing_document.supplier_id else None,
                "reference_number": existing_document.reference_number,
                "document_date": existing_document.document_date.isoformat() if existing_document.document_date else None,
                "due_date": existing_document.due_date.isoformat() if hasattr(existing_document, 'due_date') and existing_document.due_date else None,
                "amount_ht": float(existing_document.amount_ht) if existing_document.amount_ht else None,
                "amount_vat": float(existing_document.amount_vat) if existing_document.amount_vat else None,
                "amount_ttc": float(existing_document.amount_ttc) if existing_document.amount_ttc else None,
                "status": existing_document.status.value if hasattr(existing_document.status, 'value') else str(existing_document.status),
                "created_at": existing_document.created_at.isoformat() if existing_document.created_at else None,
                "validated_at": existing_document.validated_at.isoformat() if hasattr(existing_document, 'validated_at') and existing_document.validated_at else None,
                "exported_at": existing_document.exported_at.isoformat() if hasattr(existing_document, 'exported_at') and existing_document.exported_at else None,
                "file_url": existing_document.file_url if hasattr(existing_document, 'file_url') else None,
                "filename": existing_document.filename if hasattr(existing_document, 'filename') else None,
            }
        }
    
    # =========================================================================
    # RÉSOLUTION DE DOUBLONS
    # =========================================================================
    
    def resolve_duplicate(
        self,
        new_document_id: str,
        existing_document_id: str,
        action: DuplicateAction,
        reason: Optional[str] = None,
        resolved_by: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Résout un doublon avec l'action choisie par l'utilisateur.
        
        Actions:
        - REJECT: Rejeter la nouvelle facture
        - KEEP_BOTH: Conserver les deux (motif OBLIGATOIRE)
        - REPLACE: Remplacer l'existante par la nouvelle
        
        Args:
            new_document_id: ID du nouveau document (doublon)
            existing_document_id: ID du document existant
            action: Action à effectuer
            reason: Motif (obligatoire pour KEEP_BOTH)
            resolved_by: ID de l'utilisateur
            
        Returns:
            Dict avec le résultat de la résolution
        """
        new_doc = self.db.query(Document).filter(
            Document.id == new_document_id,
            Document.tenant_id == self.tenant_id
        ).first()
        
        existing_doc = self.db.query(Document).filter(
            Document.id == existing_document_id,
            Document.tenant_id == self.tenant_id
        ).first()
        
        if not new_doc:
            return {"success": False, "error": "Nouveau document non trouvé"}
        
        if not existing_doc:
            return {"success": False, "error": "Document existant non trouvé"}
        
        result = {
            "success": True,
            "action": action.value,
            "new_document_id": new_document_id,
            "existing_document_id": existing_document_id,
            "resolved_at": datetime.utcnow().isoformat()
        }
        
        # Initialiser ai_extracted_data si nécessaire
        if not new_doc.ai_extracted_data:
            new_doc.ai_extracted_data = {}
        
        if action == DuplicateAction.REJECT:
            # ===============================================================
            # REJETER la nouvelle facture
            # ===============================================================
            new_doc.status = DocumentStatus.REJECTED
            new_doc.ai_extracted_data['duplicate_of'] = existing_document_id
            new_doc.ai_extracted_data['rejection_reason'] = 'duplicate'
            new_doc.ai_extracted_data['duplicate_resolution'] = {
                'action': 'reject',
                'existing_document_id': existing_document_id,
                'resolved_by': resolved_by,
                'resolved_at': datetime.utcnow().isoformat()
            }
            result["message"] = "Nouvelle facture rejetée (doublon)"
            
        elif action == DuplicateAction.KEEP_BOTH:
            # ===============================================================
            # CONSERVER LES DEUX (motif obligatoire)
            # ===============================================================
            if not reason or not reason.strip():
                return {
                    "success": False, 
                    "error": "Motif obligatoire pour conserver les deux factures"
                }
            
            # Remettre en statut normal pour traitement
            new_doc.status = DocumentStatus.PENDING_VALIDATION
            new_doc.ai_extracted_data['not_duplicate'] = True
            new_doc.ai_extracted_data['keep_both_reason'] = reason.strip()
            new_doc.ai_extracted_data['duplicate_resolution'] = {
                'action': 'keep_both',
                'existing_document_id': existing_document_id,
                'reason': reason.strip(),
                'resolved_by': resolved_by,
                'resolved_at': datetime.utcnow().isoformat()
            }
            result["message"] = f"Les deux factures sont conservées. Motif: {reason}"
            result["reason"] = reason
            
        elif action == DuplicateAction.REPLACE:
            # ===============================================================
            # REMPLACER l'existante par la nouvelle
            # ===============================================================
            # Archiver l'existante
            existing_doc.status = DocumentStatus.REJECTED
            if not existing_doc.ai_extracted_data:
                existing_doc.ai_extracted_data = {}
            existing_doc.ai_extracted_data['replaced_by'] = new_document_id
            existing_doc.ai_extracted_data['rejection_reason'] = 'replaced'
            existing_doc.ai_extracted_data['replaced_at'] = datetime.utcnow().isoformat()
            
            # La nouvelle prend le relais
            new_doc.status = DocumentStatus.PENDING_VALIDATION
            new_doc.ai_extracted_data['replaces'] = existing_document_id
            new_doc.ai_extracted_data['duplicate_resolution'] = {
                'action': 'replace',
                'replaced_document_id': existing_document_id,
                'resolved_by': resolved_by,
                'resolved_at': datetime.utcnow().isoformat()
            }
            result["message"] = "Ancienne facture archivée, nouvelle conservée"
        
        self.db.commit()
        return result
    
    # =========================================================================
    # COMPARAISON DE DOCUMENTS
    # =========================================================================
    
    def compare_documents(
        self,
        document_id_1: str,
        document_id_2: str
    ) -> Dict[str, Any]:
        """
        Compare deux documents champ par champ pour la confrontation.
        
        Returns:
            Dict avec comparaison détaillée et conclusion
        """
        doc1 = self.db.query(Document).filter(
            Document.id == document_id_1,
            Document.tenant_id == self.tenant_id
        ).first()
        
        doc2 = self.db.query(Document).filter(
            Document.id == document_id_2,
            Document.tenant_id == self.tenant_id
        ).first()
        
        if not doc1 or not doc2:
            return {"error": "Document(s) non trouvé(s)"}
        
        # Champs à comparer
        fields_to_compare = [
            ('supplier_name', 'Fournisseur'),
            ('reference_number', 'N° facture'),
            ('document_date', 'Date facture'),
            ('due_date', 'Date échéance'),
            ('amount_ht', 'Montant HT'),
            ('amount_vat', 'TVA'),
            ('amount_ttc', 'Montant TTC'),
        ]
        
        comparison = []
        identical_count = 0
        total_count = 0
        
        for field, label in fields_to_compare:
            val1 = getattr(doc1, field, None)
            val2 = getattr(doc2, field, None)
            
            # Formater les valeurs pour l'affichage
            display_val1 = self._format_value(val1)
            display_val2 = self._format_value(val2)
            
            # Comparer (avec tolérance pour les montants)
            is_identical = self._values_equal(val1, val2)
            
            if is_identical:
                identical_count += 1
            total_count += 1
            
            comparison.append({
                'field': field,
                'label': label,
                'value_1': display_val1,
                'value_2': display_val2,
                'identical': is_identical
            })
        
        all_identical = identical_count == total_count
        
        return {
            'document_1': {
                'id': str(doc1.id),
                'filename': doc1.filename if hasattr(doc1, 'filename') else None,
                'file_url': doc1.file_url if hasattr(doc1, 'file_url') else None,
                'status': doc1.status.value if hasattr(doc1.status, 'value') else str(doc1.status),
                'created_at': doc1.created_at.isoformat() if doc1.created_at else None,
                'validated_at': doc1.validated_at.isoformat() if hasattr(doc1, 'validated_at') and doc1.validated_at else None,
                'exported_at': doc1.exported_at.isoformat() if hasattr(doc1, 'exported_at') and doc1.exported_at else None,
            },
            'document_2': {
                'id': str(doc2.id),
                'filename': doc2.filename if hasattr(doc2, 'filename') else None,
                'file_url': doc2.file_url if hasattr(doc2, 'file_url') else None,
                'status': doc2.status.value if hasattr(doc2.status, 'value') else str(doc2.status),
                'created_at': doc2.created_at.isoformat() if doc2.created_at else None,
                'validated_at': doc2.validated_at.isoformat() if hasattr(doc2, 'validated_at') and doc2.validated_at else None,
                'exported_at': doc2.exported_at.isoformat() if hasattr(doc2, 'exported_at') and doc2.exported_at else None,
            },
            'comparison': comparison,
            'identical_fields': identical_count,
            'total_fields': total_count,
            'all_identical': all_identical,
            'conclusion': "TOUS LES CHAMPS SONT IDENTIQUES = C'EST UN DOUBLON" if all_identical else "DIFFÉRENCES DÉTECTÉES"
        }
    
    def _format_value(self, value: Any) -> Any:
        """Formate une valeur pour l'affichage"""
        if value is None:
            return None
        if isinstance(value, (date, datetime)):
            return value.isoformat()
        if isinstance(value, Decimal):
            return float(value)
        return value
    
    def _values_equal(self, val1: Any, val2: Any) -> bool:
        """Compare deux valeurs avec tolérance pour les nombres"""
        if val1 is None and val2 is None:
            return True
        if val1 is None or val2 is None:
            return False
        
        # Comparaison de montants avec tolérance
        if isinstance(val1, (int, float, Decimal)) and isinstance(val2, (int, float, Decimal)):
            return abs(float(val1) - float(val2)) < 0.01
        
        # Comparaison de dates
        if isinstance(val1, (date, datetime)) and isinstance(val2, (date, datetime)):
            if isinstance(val1, datetime):
                val1 = val1.date()
            if isinstance(val2, datetime):
                val2 = val2.date()
            return val1 == val2
        
        # Comparaison de chaînes (insensible à la casse)
        if isinstance(val1, str) and isinstance(val2, str):
            return val1.strip().lower() == val2.strip().lower()
        
        return val1 == val2
    
    # =========================================================================
    # HISTORIQUE ET LISTE
    # =========================================================================
    
    def get_pending_duplicates(self) -> List[Dict[str, Any]]:
        """
        Récupère la liste des doublons en attente de traitement.
        """
        # Chercher les documents marqués comme doublons mais non traités
        documents = self.db.query(Document).filter(
            Document.tenant_id == self.tenant_id
        ).all()
        
        result = []
        for doc in documents:
            # Vérifier si c'est un doublon non résolu
            if doc.ai_extracted_data and doc.ai_extracted_data.get('pending_duplicate'):
                duplicate_info = doc.ai_extracted_data.get('detected_duplicate', {})
                result.append({
                    'id': str(doc.id),
                    'supplier_name': doc.supplier_name,
                    'reference_number': doc.reference_number,
                    'document_date': doc.document_date.isoformat() if doc.document_date else None,
                    'amount_ttc': float(doc.amount_ttc) if doc.amount_ttc else None,
                    'created_at': doc.created_at.isoformat() if doc.created_at else None,
                    'duplicate_of_id': duplicate_info.get('existing_document_id'),
                    'reason': duplicate_info.get('reason'),
                    'reason_text': duplicate_info.get('reason_text')
                })
        
        return result
    
    def get_duplicate_history(
        self,
        limit: int = 50,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """
        Récupère l'historique des doublons traités.
        """
        documents = self.db.query(Document).filter(
            Document.tenant_id == self.tenant_id,
            Document.status == DocumentStatus.REJECTED
        ).order_by(Document.updated_at.desc()).limit(limit).offset(offset).all()
        
        history = []
        for doc in documents:
            if doc.ai_extracted_data:
                resolution = doc.ai_extracted_data.get('duplicate_resolution')
                if resolution:
                    history.append({
                        'id': str(doc.id),
                        'reference_number': doc.reference_number,
                        'supplier_name': doc.supplier_name,
                        'amount_ttc': float(doc.amount_ttc) if doc.amount_ttc else None,
                        'action': resolution.get('action'),
                        'existing_document_id': resolution.get('existing_document_id') or resolution.get('replaced_document_id'),
                        'reason': resolution.get('reason'),
                        'resolved_by': resolution.get('resolved_by'),
                        'resolved_at': resolution.get('resolved_at')
                    })
                elif doc.ai_extracted_data.get('rejection_reason') == 'duplicate':
                    history.append({
                        'id': str(doc.id),
                        'reference_number': doc.reference_number,
                        'supplier_name': doc.supplier_name,
                        'amount_ttc': float(doc.amount_ttc) if doc.amount_ttc else None,
                        'action': 'reject',
                        'existing_document_id': doc.ai_extracted_data.get('duplicate_of'),
                        'reason': None,
                        'resolved_by': None,
                        'resolved_at': doc.updated_at.isoformat() if doc.updated_at else None
                    })
        
        return history
    
    def get_all_duplicates(self) -> List[Dict[str, Any]]:
        """
        Récupère tous les groupes de doublons potentiels (legacy method).
        Groupés par numéro de facture.
        """
        valid_statuses = [
            DocumentStatus.VALIDATED,
            DocumentStatus.OCR_COMPLETED,
            DocumentStatus.PENDING_VALIDATION
        ]
        
        documents = self.db.query(Document).filter(
            Document.tenant_id == self.tenant_id,
            Document.status.in_(valid_statuses),
            Document.reference_number.isnot(None)
        ).all()
        
        # Grouper par numéro de facture
        groups = {}
        for doc in documents:
            key = (doc.reference_number.strip().lower(), doc.supplier_name.strip().lower() if doc.supplier_name else '')
            if key not in groups:
                groups[key] = []
            groups[key].append(doc)
        
        # Ne garder que les groupes avec plus d'un document
        duplicate_groups = []
        for (ref_num, supplier), docs in groups.items():
            if len(docs) > 1:
                duplicate_groups.append({
                    'reference_number': docs[0].reference_number,
                    'supplier_name': docs[0].supplier_name,
                    'amount_ttc': float(docs[0].amount_ttc) if docs[0].amount_ttc else None,
                    'count': len(docs),
                    'documents': [
                        {
                            'id': str(doc.id),
                            'filename': doc.filename,
                            'document_date': doc.document_date.isoformat() if doc.document_date else None,
                            'status': doc.status.value if hasattr(doc.status, 'value') else str(doc.status),
                            'created_at': doc.created_at.isoformat() if doc.created_at else None
                        }
                        for doc in docs
                    ]
                })
        
        return duplicate_groups
    
    # Legacy method for compatibility
    def check_duplicate(
        self,
        reference_number: str,
        supplier_name: Optional[str] = None,
        amount_ttc: Optional[float] = None,
        exclude_document_id: Optional[str] = None
    ) -> Tuple[bool, List[Document]]:
        """
        Vérifie si un document est un doublon (méthode legacy).
        
        Returns:
            Tuple (is_duplicate, list_of_duplicates)
        """
        result = self.detect_duplicate(
            supplier_name=supplier_name,
            invoice_number=reference_number,
            amount_ttc=amount_ttc,
            exclude_document_id=exclude_document_id
        )
        
        if result and result.get('is_duplicate'):
            existing_id = result['existing_document']['id']
            existing_doc = self.db.query(Document).filter(Document.id == existing_id).first()
            return True, [existing_doc] if existing_doc else []
        
        return False, []
    
    def mark_as_duplicate(self, document_id: str, original_document_id: str) -> bool:
        """
        Marque un document comme doublon (méthode legacy).
        """
        result = self.resolve_duplicate(
            new_document_id=document_id,
            existing_document_id=original_document_id,
            action=DuplicateAction.REJECT
        )
        return result.get('success', False)


# Factory function
def get_duplicate_detection_service(db: Session, tenant_id: str) -> DuplicateDetectionService:
    """Factory function pour créer une instance du service."""
    return DuplicateDetectionService(db, tenant_id)
