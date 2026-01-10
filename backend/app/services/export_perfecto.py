"""
Service d'export au format Perfecto
Format: DatePiece;Journal;Compte;Libelle;Debit;Credit;Ref_piece;DateEcheance
"""
from typing import List, Optional
from datetime import date, datetime
from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.models.accounting import AccountingEntry
from app.models.document import Document, DocumentStatus


class PerfectoExportService:
    """Service d'export des écritures au format Perfecto"""

    def __init__(self, db: Session, tenant_id: str):
        self.db = db
        self.tenant_id = tenant_id

    def generate_export(
        self,
        start_date: date,
        end_date: date,
        journal_code: Optional[str] = None,
        validated_only: bool = True
    ) -> str:
        """
        Génère un fichier d'export Perfecto
        
        Format: DatePiece;Journal;Compte;Libelle;Debit;Credit;Ref_piece;DateEcheance
        Exemple: 05/01/2026;ACH;6061;Facture SBEE-2024-0892;100000;0;SBEE-2024-0892;05/02/2026
        """
        
        # Récupérer les documents validés dans la période
        query = self.db.query(Document).filter(
            Document.tenant_id == self.tenant_id,
            Document.document_date >= start_date,
            Document.document_date <= end_date
        )
        
        if validated_only:
            query = query.filter(Document.status == DocumentStatus.VALIDATED)
        
        if journal_code:
            # Filtrer par journal si spécifié
            pass  # TODO: ajouter filtre journal
        
        documents = query.all()
        
        # Générer les lignes d'export
        lines = []
        lines.append("DatePiece;Journal;Compte;Libelle;Debit;Credit;Ref_piece;DateEcheance")
        
        for doc in documents:
            # Récupérer les écritures comptables du document
            entries = self.db.query(AccountingEntry).filter(
                AccountingEntry.document_id == doc.id
            ).all()
            
            for entry in entries:
                # Format de date Perfecto: DD/MM/YYYY
                date_piece = entry.entry_date.strftime("%d/%m/%Y") if entry.entry_date else doc.document_date.strftime("%d/%m/%Y")
                date_echeance = doc.due_date.strftime("%d/%m/%Y") if doc.due_date else ""
                
                # Journal (ACH, VEN, etc.)
                journal = entry.journal_code or "ACH"
                
                # Compte
                compte = entry.account_number or ""
                
                # Libellé
                libelle = (entry.label or doc.description or "").replace(";", ",")  # Remplacer ; par , pour éviter conflit
                
                # Débit/Crédit (en centimes ou en unités selon config)
                debit = int(entry.debit_amount or 0)
                credit = int(entry.credit_amount or 0)
                
                # Référence pièce
                ref_piece = doc.reference_number or ""
                
                # Construire la ligne
                line = f"{date_piece};{journal};{compte};{libelle};{debit};{credit};{ref_piece};{date_echeance}"
                lines.append(line)
        
        return "\n".join(lines)

    def generate_saari_export(
        self,
        start_date: date,
        end_date: date,
        journal_code: Optional[str] = None,
        validated_only: bool = True
    ) -> str:
        """
        Génère un fichier d'export SAARI (CSV)
        Format similaire à Perfecto mais avec virgules
        """
        perfecto_content = self.generate_export(start_date, end_date, journal_code, validated_only)
        # Remplacer ; par , pour format CSV
        return perfecto_content.replace(";", ",")

    def generate_sage_export(
        self,
        start_date: date,
        end_date: date,
        journal_code: Optional[str] = None,
        validated_only: bool = True
    ) -> str:
        """
        Génère un fichier d'export Sage (CSV)
        Format: Journal,Date,Compte,Libelle,Debit,Credit,Piece
        """
        query = self.db.query(Document).filter(
            Document.tenant_id == self.tenant_id,
            Document.document_date >= start_date,
            Document.document_date <= end_date
        )
        
        if validated_only:
            query = query.filter(Document.status == DocumentStatus.VALIDATED)
        
        documents = query.all()
        
        lines = []
        lines.append("Journal,Date,Compte,Libelle,Debit,Credit,Piece")
        
        for doc in documents:
            entries = self.db.query(AccountingEntry).filter(
                AccountingEntry.document_id == doc.id
            ).all()
            
            for entry in entries:
                date_piece = entry.entry_date.strftime("%d/%m/%Y") if entry.entry_date else doc.document_date.strftime("%d/%m/%Y")
                journal = entry.journal_code or "ACH"
                compte = entry.account_number or ""
                libelle = (entry.label or doc.description or "").replace(",", " ")
                debit = int(entry.debit_amount or 0)
                credit = int(entry.credit_amount or 0)
                piece = doc.reference_number or ""
                
                line = f"{journal},{date_piece},{compte},{libelle},{debit},{credit},{piece}"
                lines.append(line)
        
        return "\n".join(lines)

    def get_export_stats(
        self,
        start_date: date,
        end_date: date,
        validated_only: bool = True
    ) -> dict:
        """Retourne les statistiques de l'export"""
        query = self.db.query(Document).filter(
            Document.tenant_id == self.tenant_id,
            Document.document_date >= start_date,
            Document.document_date <= end_date
        )
        
        if validated_only:
            query = query.filter(Document.status == DocumentStatus.VALIDATED)
        
        documents = query.all()
        
        total_entries = 0
        for doc in documents:
            entries_count = self.db.query(AccountingEntry).filter(
                AccountingEntry.document_id == doc.id
            ).count()
            total_entries += entries_count
        
        return {
            "total_documents": len(documents),
            "total_entries": total_entries,
            "period_start": start_date.strftime("%d/%m/%Y"),
            "period_end": end_date.strftime("%d/%m/%Y")
        }
