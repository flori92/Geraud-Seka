"""Reconciliation Service for bank statement matching."""
from typing import List, Dict, Optional
from uuid import UUID
from decimal import Decimal
from datetime import date
import csv
import io

from sqlalchemy.orm import Session

from app.crud import bank_transaction as bt_crud
from app.schemas.treasury import BankReconciliationMatch, BankStatementLine


class ReconciliationService:
    """Service for bank reconciliation operations."""

    def __init__(self, db: Session):
        self.db = db

    def parse_bank_statement(
        self,
        file_content: bytes,
        format: str = "csv"
    ) -> List[BankStatementLine]:
        """Parse a bank statement file."""
        if format == "csv":
            return self._parse_csv(file_content)
        else:
            raise ValueError(f"Unsupported format: {format}")

    def _parse_csv(self, file_content: bytes) -> List[BankStatementLine]:
        """Parse CSV bank statement."""
        lines = []
        content = file_content.decode('utf-8')
        reader = csv.DictReader(io.StringIO(content))

        line_number = 1
        for row in reader:
            try:
                if 'date' in row and 'amount' in row:
                    transaction_date = self._parse_date(row['date'])
                    amount = Decimal(row['amount'].replace(',', '').replace(' ', ''))
                    description = row.get('description', row.get('libelle', ''))
                    balance = Decimal(row.get('balance', row.get('solde', '0')).replace(',', '').replace(' ', ''))
                    reference = row.get('reference', row.get('ref', ''))

                    lines.append(BankStatementLine(
                        line_number=line_number,
                        transaction_date=transaction_date,
                        description=description,
                        amount=amount,
                        balance=balance if balance != 0 else None,
                        reference=reference if reference else None,
                    ))
                    line_number += 1
            except Exception as e:
                print(f"Error parsing line {line_number}: {e}")
                continue

        return lines

    def _parse_date(self, date_str: str) -> date:
        """Parse date from various formats."""
        from dateutil import parser
        try:
            return parser.parse(date_str, dayfirst=True).date()
        except:
            return date.fromisoformat(date_str)

    def match_transactions(
        self,
        tenant_id: UUID,
        bank_account_id: UUID,
        bank_lines: List[BankStatementLine]
    ) -> List[BankReconciliationMatch]:
        """Match bank statement lines with system transactions."""
        system_transactions = bt_crud.get_unreconciled(
            self.db,
            tenant_id=tenant_id,
            bank_account_id=bank_account_id
        )

        matches = []

        for bank_line in bank_lines:
            best_match = None
            best_score = 0.0

            for transaction in system_transactions:
                score = self._calculate_match_score(bank_line, transaction)
                
                if score > best_score and score >= 0.7:  # Minimum 70% match
                    best_score = score
                    best_match = transaction

            if best_match:
                match_type = "exact" if best_score >= 0.95 else "fuzzy"
                confidence = "high" if best_score >= 0.9 else "medium" if best_score >= 0.8 else "low"

                matches.append(BankReconciliationMatch(
                    system_transaction_id=best_match.id,
                    bank_statement_line=f"Line {bank_line.line_number}",
                    bank_date=bank_line.transaction_date,
                    bank_amount=bank_line.amount,
                    bank_description=bank_line.description,
                    match_score=best_score,
                    match_type=match_type,
                    confidence=confidence,
                ))

        return matches

    def _calculate_match_score(
        self,
        bank_line: BankStatementLine,
        transaction
    ) -> float:
        """Calculate match score between bank line and transaction."""
        score = 0.0

        if bank_line.transaction_date == transaction.transaction_date:
            score += 0.4
        elif abs((bank_line.transaction_date - transaction.transaction_date).days) <= 2:
            score += 0.2  # Close date

        if abs(bank_line.amount - transaction.amount) < Decimal("0.01"):
            score += 0.4
        elif abs(bank_line.amount - transaction.amount) < Decimal("1.00"):
            score += 0.2  # Very close amount

        if bank_line.reference and transaction.reference:
            if bank_line.reference.lower() == transaction.reference.lower():
                score += 0.1

        if bank_line.description and transaction.description:
            similarity = self._string_similarity(
                bank_line.description.lower(),
                transaction.description.lower()
            )
            score += 0.1 * similarity

        return score

    def _string_similarity(self, str1: str, str2: str) -> float:
        """Calculate string similarity (simple version)."""
        words1 = set(str1.split())
        words2 = set(str2.split())
        
        if not words1 or not words2:
            return 0.0

        intersection = words1.intersection(words2)
        union = words1.union(words2)

        return len(intersection) / len(union) if union else 0.0

    def apply_reconciliation(
        self,
        matches: List[Dict],
        reconciliation_date: Optional[date] = None
    ) -> int:
        """Apply reconciliation matches."""
        rec_date = reconciliation_date or date.today()
        count = 0

        for match in matches:
            transaction_id = match.get("transaction_id")
            bank_statement_line = match.get("bank_statement_line")

            if transaction_id:
                transaction = bt_crud.mark_as_reconciled(
                    self.db,
                    transaction_id=UUID(transaction_id),
                    reconciliation_date=rec_date,
                    bank_statement_line=bank_statement_line
                )
                if transaction:
                    count += 1

        return count


reconciliation_service = ReconciliationService
