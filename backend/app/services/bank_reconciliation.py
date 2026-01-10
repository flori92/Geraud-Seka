from typing import List, Optional, Dict
from datetime import date
from sqlalchemy.orm import Session
from decimal import Decimal

from app.models.document import Document, DocumentStatus
from app.models.accounting import AccountingEntry


class BankReconciliationService:

    def __init__(self, db: Session, tenant_id: str):
        self.db = db
        self.tenant_id = tenant_id

    def extract_bank_lines_from_pdf(self, pdf_content: bytes) -> List[Dict]:
        lines = []
        return lines

    def match_bank_line_with_invoices(
        self,
        bank_line: Dict,
        tolerance: float = 1.0
    ) -> List[Document]:
        amount = abs(bank_line.get('amount', 0))
        
        query = self.db.query(Document).filter(
            Document.tenant_id == self.tenant_id,
            Document.status == DocumentStatus.VALIDATED,
            Document.amount_ttc >= amount - tolerance,
            Document.amount_ttc <= amount + tolerance
        )
        
        return query.all()

    def reconcile_line(
        self,
        bank_line_id: str,
        document_id: str
    ) -> bool:
        document = self.db.query(Document).filter(
            Document.id == document_id,
            Document.tenant_id == self.tenant_id
        ).first()
        
        if not document:
            return False
        
        if not document.ai_extracted_data:
            document.ai_extracted_data = {}
        
        document.ai_extracted_data['bank_reconciliation'] = {
            'reconciled': True,
            'bank_line_id': bank_line_id
        }
        
        self.db.commit()
        return True

    def get_unreconciled_invoices(
        self,
        start_date: date,
        end_date: date
    ) -> List[Document]:
        documents = self.db.query(Document).filter(
            Document.tenant_id == self.tenant_id,
            Document.status == DocumentStatus.VALIDATED,
            Document.document_date >= start_date,
            Document.document_date <= end_date
        ).all()
        
        unreconciled = []
        for doc in documents:
            if not doc.ai_extracted_data or not doc.ai_extracted_data.get('bank_reconciliation', {}).get('reconciled'):
                unreconciled.append(doc)
        
        return unreconciled
