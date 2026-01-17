"""
Service de génération automatique des écritures comptables
"""
from datetime import date
from decimal import Decimal
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from uuid import UUID

from app.models.document import Document
from app.models.supplier import Supplier
from app.models.accounting import AccountingEntry
from app.models.accounting_advanced import AccountingJournal
from app.models.ledger_account import LedgerAccount
from app.models.accounting_rules import AccountingRule


class AccountingEntryGenerator:
    """
    Génère automatiquement les écritures comptables pour une facture.
    
    Selon le document client:
    Une facture génère 3 lignes:
    1. Débit compte de charge (6061) = Montant HT
    2. Débit compte TVA (4454) = Montant TVA
    3. Crédit compte fournisseur (401SBEE) = Montant TTC
    """
    
    def __init__(self, db: Session, tenant_id: str):
        self.db = db
        self.tenant_id = tenant_id
    
    def generate_entries_from_invoice(
        self,
        document: Document,
        supplier: Supplier,
        rule: Optional[AccountingRule] = None
    ) -> List[AccountingEntry]:
        """
        Génère les écritures comptables pour une facture fournisseur.
        
        Args:
            document: La facture
            supplier: Le fournisseur
            rule: La règle d'imputation (optionnelle)
        
        Returns:
            Liste des écritures générées (3 lignes)
        """
        
        # Récupérer les montants
        amount_ht = float(document.amount_ht or 0)
        amount_vat = float(document.amount_vat or 0)
        amount_ttc = float(document.amount_ttc or 0)
        
        if amount_ttc == 0:
            raise ValueError("Le montant TTC est requis")
        
        # Si pas de règle, impossible de générer
        if not rule:
            raise ValueError("Une règle d'imputation est requise pour générer les écritures")
        
        # Parser les actions de la règle pour trouver les comptes
        charge_account_id = None
        vat_account_id = None
        supplier_account_id = None
        journal_id = None
        
        # Analyser les actions de la règle
        for action in (rule.actions or []):
            if action.get('type') == 'set_account':
                account_type = action.get('account_type')
                account_id = action.get('account_id')
                
                if account_type == 'expense':
                    charge_account_id = account_id
                elif account_type == 'vat':
                    vat_account_id = account_id
                elif account_type == 'payable':
                    supplier_account_id = account_id
            elif action.get('type') == 'set_journal':
                journal_id = action.get('journal_id')
        
        # Fallback: utiliser les comptes du fournisseur
        if not charge_account_id and supplier.default_expense_account_id:
            charge_account_id = str(supplier.default_expense_account_id)
        
        if not vat_account_id and supplier.default_vat_account_id:
            vat_account_id = str(supplier.default_vat_account_id)
        
        if not supplier_account_id and supplier.auxiliary_account_id:
            supplier_account_id = str(supplier.auxiliary_account_id)
        
        # Vérifier que tous les comptes sont présents
        if not charge_account_id:
            raise ValueError("Compte de charge manquant")
        if not vat_account_id:
            raise ValueError("Compte TVA manquant")
        if not supplier_account_id:
            raise ValueError("Compte fournisseur manquant")
        
        # Trouver le journal (par défaut: ACH)
        if not journal_id:
            journal = self.db.query(AccountingJournal).filter(
                AccountingJournal.tenant_id == self.tenant_id,
                AccountingJournal.code == "ACH"
            ).first()
            if journal:
                journal_id = str(journal.id)
        
        if not journal_id:
            raise ValueError("Journal comptable manquant")
        
        # Préparer le libellé
        reference = document.reference_number or f"DOC-{document.id}"
        label = f"Facture {supplier.name} - {reference}"
        
        # Créer les 3 écritures
        entries = []
        
        # Ligne 1: Débit compte de charge
        entry1 = AccountingEntry(
            tenant_id=self.tenant_id,
            document_id=document.id,
            accounting_rule_id=rule.id if rule else None,
            ledger_account_id=charge_account_id,
            journal_id=journal_id,
            entry_date=document.document_date or date.today(),
            label=label,
            reference=reference,
            debit=Decimal(str(amount_ht)),
            credit=Decimal('0'),
            is_validated=False
        )
        entries.append(entry1)
        
        # Ligne 2: Débit compte TVA (si TVA > 0)
        if amount_vat > 0:
            entry2 = AccountingEntry(
                tenant_id=self.tenant_id,
                document_id=document.id,
                accounting_rule_id=rule.id if rule else None,
                ledger_account_id=vat_account_id,
                journal_id=journal_id,
                entry_date=document.document_date or date.today(),
                label=f"TVA déductible - {label}",
                reference=reference,
                debit=Decimal(str(amount_vat)),
                credit=Decimal('0'),
                is_validated=False
            )
            entries.append(entry2)
        
        # Ligne 3: Crédit compte fournisseur
        entry3 = AccountingEntry(
            tenant_id=self.tenant_id,
            document_id=document.id,
            accounting_rule_id=rule.id if rule else None,
            ledger_account_id=supplier_account_id,
            journal_id=journal_id,
            entry_date=document.document_date or date.today(),
            label=label,
            reference=reference,
            debit=Decimal('0'),
            credit=Decimal(str(amount_ttc)),
            is_validated=False
        )
        entries.append(entry3)
        
        # Sauvegarder les écritures
        for entry in entries:
            self.db.add(entry)
        
        self.db.flush()
        
        return entries
    
    def validate_entries_balance(self, entries: List[AccountingEntry]) -> bool:
        """
        Vérifie que les écritures sont équilibrées (Débit = Crédit).
        """
        total_debit = sum(float(e.debit) for e in entries)
        total_credit = sum(float(e.credit) for e in entries)
        
        return abs(total_debit - total_credit) < 0.01  # Tolérance de 1 centime
    
    def get_entries_for_document(self, document_id: UUID) -> List[AccountingEntry]:
        """
        Récupère toutes les écritures d'un document.
        """
        return self.db.query(AccountingEntry).filter(
            AccountingEntry.document_id == document_id,
            AccountingEntry.tenant_id == self.tenant_id
        ).all()
    
    def delete_entries_for_document(self, document_id: UUID):
        """
        Supprime toutes les écritures d'un document (pour régénération).
        """
        self.db.query(AccountingEntry).filter(
            AccountingEntry.document_id == document_id,
            AccountingEntry.tenant_id == self.tenant_id
        ).delete()
        self.db.flush()


def get_accounting_entry_generator(db: Session, tenant_id: str) -> AccountingEntryGenerator:
    """Factory pour le générateur d'écritures."""
    return AccountingEntryGenerator(db, tenant_id)
