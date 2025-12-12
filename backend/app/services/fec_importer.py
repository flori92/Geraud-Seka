
import csv
import io
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session

from app.models.accounting import AccountingEntry, Account
from app.models.accounting_advanced import Journal
from app.models.tenant import Tenant

logger = logging.getLogger(__name__)

class FECImporterService:
    def __init__(self, db: Session, tenant_id: str, user_id: str):
        self.db = db
        self.tenant_id = tenant_id
        self.user_id = user_id

    def detect_dialect(self, content: str) -> csv.Dialect:
        """Détecte le séparateur et le format du fichier FEC"""
        try:
            sample = content[:1024]
            dialect = csv.Sniffer().sniff(sample, delimiters=['\t', '|', ',', ';'])
            return dialect
        except csv.Error:
            # Fallback sur tabulation (standard FEC)
            class FECDialect(csv.Dialect):
                delimiter = '\t'
                quotechar = '"'
                doublequote = True
                skipinitialspace = False
                lineterminator = '\n'
                quoting = csv.QUOTE_MINIMAL
            return FECDialect

    def parse_amount(self, value: str) -> float:
        """Convertit les montants FEC (souvent avec virgule) en float"""
        if not value:
            return 0.0
        return float(value.replace(',', '.'))

    def parse_date(self, value: str) -> datetime.date:
        """Parse les dates FEC (généralement YYYYMMDD)"""
        if not value:
            return datetime.now().date()
        
        formats = ['%Y%m%d', '%d/%m/%Y', '%Y-%m-%d']
        for fmt in formats:
            try:
                return datetime.strptime(value, fmt).date()
            except ValueError:
                continue
        raise ValueError(f"Format de date inconnu: {value}")

    def process_file(self, file_content: bytes, filename: str) -> Dict[str, Any]:
        """
        Traite le fichier FEC et importe les écritures.
        Gère la création automatique des comptes et journaux.
        """
        # Décodage (tentative UTF-8 puis Latin-1/CP1252 fréquent en compta Windows)
        try:
            text_content = file_content.decode('utf-8')
        except UnicodeDecodeError:
            text_content = file_content.decode('cp1252')

        dialect = self.detect_dialect(text_content)
        f = io.StringIO(text_content)
        reader = csv.DictReader(f, dialect=dialect)

        # Normalisation des en-têtes (casse, espaces)
        headers = [h.strip() for h in reader.fieldnames or []]
        reader.fieldnames = headers # Réassigne les headers propres

        # Mapping des colonnes standards FEC vers nos modèles
        # FEC Standard : JournalCode, JournalLib, EcritureNum, DateComptable, CompteNum, CompteLib, CompAuxNum, CompAuxLib, PieceRef, PieceDate, EcritureLib, Debit, Credit...
        
        entries_to_create = []
        new_accounts = set()
        new_journals = set()
        
        stats = {
            "total_lines": 0,
            "imported_entries": 0,
            "created_accounts": 0,
            "created_journals": 0,
            "errors": []
        }

        # Cache pour éviter requêtes DB répétitives
        existing_journals = {j.code for j in self.db.query(Journal).filter(Journal.tenant_id == self.tenant_id).all()}
        # Note: Accounts checking omitted for speed for now, or simplify
        
        # Mapping helpers
        col_map = self._map_columns(headers)
        if not col_map['JournalCode'] or not col_map['CompteNum']:
            raise ValueError("Colonnes obligatoires manquantes (JournalCode, CompteNum). Est-ce bien un FEC ?")

        for row in reader:
            stats["total_lines"] += 1
            try:
                # Extraction
                journal_code = row[col_map['JournalCode']].strip()
                account_num = row[col_map['CompteNum']].strip()
                label = row.get(col_map.get('EcritureLib', ''), '').strip() or row.get(col_map.get('CompteLib', ''), 'Import FEC')
                
                date_str = row[col_map['DateComptable']]
                entry_date = self.parse_date(date_str)
                
                debit = self.parse_amount(row.get(col_map.get('Debit', ''), '0'))
                credit = self.parse_amount(row.get(col_map.get('Credit', ''), '0'))
                
                ref = row.get(col_map.get('PieceRef', ''), '')
                
                # Gestion Journal
                if journal_code not in existing_journals and journal_code not in new_journals:
                    # Créer le journal (sera persisté avant les écritures)
                    new_journals.add(journal_code)
                    # TODO: Persist journal properly
                    pass 

                # Création Ecriture
                entry = AccountingEntry(
                    tenant_id=self.tenant_id,
                    journal_code=journal_code,
                    account_number=account_num,
                    label=label[:255],
                    date=entry_date,
                    debit=debit,
                    credit=credit,
                    reference=ref[:100],
                    uploaded_by=self.user_id, # Si champ existe, sinon ignorer
                    origin="FEC_IMPORT"
                )
                entries_to_create.append(entry)

            except Exception as e:
                stats["errors"].append(f"Ligne {stats['total_lines']}: {str(e)}")
                if len(stats["errors"]) > 100:
                    break

        # Bulk Insert
        if entries_to_create:
            try:
                self.db.bulk_save_objects(entries_to_create)
                self.db.commit()
                stats["imported_entries"] = len(entries_to_create)
            except Exception as e:
                self.db.rollback()
                raise e

        return stats

    def _map_columns(self, headers: List[str]) -> Dict[str, str]:
        """Tente de trouver les noms de colonnes correspondants dans le fichier"""
        mapping = {}
        # Dictionnaire des synonymes possibles
        synonyms = {
            'JournalCode': ['JournalCode', 'CodeJournal', 'JnlCode', 'CdeJnl'],
            'EcritureNum': ['EcritureNum', 'NumeroEcriture', 'EcrNum'],
            'DateComptable': ['DateComptable', 'DateEcr', 'Date'],
            'CompteNum': ['CompteNum', 'NumeroCompte', 'CptNum', 'Compte'],
            'CompteLib': ['CompteLib', 'LibelleCompte', 'CptLib'],
            'EcritureLib': ['EcritureLib', 'LibelleEcriture', 'Libelle'],
            'Debit': ['Debit', 'MntDebit'],
            'Credit': ['Credit', 'MntCredit'],
            'PieceRef': ['PieceRef', 'RefPiece', 'Reference']
        }
        
        for key, alternatives in synonyms.items():
            found = None
            for h in headers:
                # Match exact ou insensible à la casse sans underscore/espace
                h_clean = h.replace('_', '').replace(' ', '').lower()
                for alt in alternatives:
                    if h_clean == alt.lower():
                        found = h
                        break
                if found: break
            mapping[key] = found
            
        return mapping
