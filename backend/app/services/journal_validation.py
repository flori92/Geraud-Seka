"""
Service de validation des journaux comptables
Valide les écritures selon les règles spécifiques à chaque type de journal
Conforme à l'architecture comptable SYSCOHADA
"""
from typing import List, Dict, Optional, Tuple
from decimal import Decimal
from sqlalchemy.orm import Session

from app.models.accounting_advanced import JournalEntry, JournalEntryLine, JournalType
from app.models.ledger_account import LedgerAccount


# Règles de validation par type de journal (conforme au document d'architecture)
JOURNAL_VALIDATION_RULES = {
    JournalType.PURCHASE: {
        "name": "Journal des Achats",
        "comptes_autorises": ["401*", "445*", "6*"],
        "comptes_obligatoires": ["401*", "6*"],
        "description": "Doit avoir au moins un compte fournisseur (401*) et un compte de charge (6*)"
    },
    JournalType.SALES: {
        "name": "Journal des Ventes",
        "comptes_autorises": ["411*", "443*", "7*"],
        "comptes_obligatoires": ["411*", "7*"],
        "description": "Doit avoir au moins un compte client (411*) et un compte de produit (7*)"
    },
    JournalType.BANK: {
        "name": "Journal de Banque",
        "compte_principal": "52*",
        "rapprochement_obligatoire": True,
        "description": "Doit impliquer un compte de banque (52*)"
    },
    JournalType.CASH: {
        "name": "Journal de Caisse",
        "compte_principal": "57*",
        "solde_negatif_interdit": True,
        "description": "Doit impliquer un compte de caisse (57*), solde négatif interdit"
    },
    JournalType.MISC: {
        "name": "Journal des Opérations Diverses",
        "comptes_autorises": "*",
        "justification_requise": True,
        "description": "Tous comptes autorisés, justification requise"
    },
    JournalType.PAYROLL: {
        "name": "Journal de Paie",
        "comptes_autorises": ["42*", "43*", "44*", "64*"],
        "comptes_obligatoires": ["64*"],
        "description": "Doit avoir au moins un compte de charges de personnel (64*)"
    },
    JournalType.OPENING: {
        "name": "Journal À Nouveau",
        "description": "Journal d'ouverture d'exercice"
    },
    JournalType.CLOSING: {
        "name": "Journal de Clôture",
        "description": "Journal de clôture d'exercice"
    }
}


class JournalValidationError:
    """Représente une erreur de validation"""
    def __init__(self, code: str, message: str, severity: str = "error"):
        self.code = code
        self.message = message
        self.severity = severity  # error, warning, info

    def to_dict(self) -> Dict:
        return {
            "code": self.code,
            "message": self.message,
            "severity": self.severity
        }


class JournalValidationService:
    """Service de validation des écritures par type de journal"""

    def __init__(self, db: Session, tenant_id: str):
        self.db = db
        self.tenant_id = tenant_id

    def validate_entry(self, entry: JournalEntry) -> Tuple[bool, List[JournalValidationError]]:
        """
        Valide une écriture comptable selon les règles du journal
        
        Returns:
            Tuple (is_valid, list_of_errors)
        """
        errors = []

        # 1. Validation de l'équilibre (règle fondamentale)
        balance_errors = self._validate_balance(entry)
        errors.extend(balance_errors)

        # 2. Validation spécifique au type de journal
        journal_errors = self._validate_journal_rules(entry)
        errors.extend(journal_errors)

        # 3. Validation des montants
        amount_errors = self._validate_amounts(entry)
        errors.extend(amount_errors)

        # Déterminer si l'écriture est valide (pas d'erreurs de type "error")
        is_valid = not any(e.severity == "error" for e in errors)

        return is_valid, errors

    def _validate_balance(self, entry: JournalEntry) -> List[JournalValidationError]:
        """Vérifie l'équilibre débit = crédit"""
        errors = []

        total_debit = sum(line.debit or Decimal("0") for line in entry.lines)
        total_credit = sum(line.credit or Decimal("0") for line in entry.lines)

        if abs(total_debit - total_credit) > Decimal("0.01"):
            errors.append(JournalValidationError(
                code="BALANCE_ERROR",
                message=f"L'écriture n'est pas équilibrée: Débit={total_debit}, Crédit={total_credit}",
                severity="error"
            ))

        return errors

    def _validate_journal_rules(self, entry: JournalEntry) -> List[JournalValidationError]:
        """Valide selon les règles spécifiques au type de journal"""
        errors = []

        journal_type = entry.journal.journal_type if entry.journal else None
        if not journal_type:
            return errors

        rules = JOURNAL_VALIDATION_RULES.get(JournalType(journal_type), {})

        # Extraire les codes de compte des lignes
        account_codes = []
        for line in entry.lines:
            if line.account:
                account_codes.append(line.account.account_code if hasattr(line.account, 'account_code') else str(line.account.account_number))

        # Vérifier les comptes obligatoires
        comptes_obligatoires = rules.get("comptes_obligatoires", [])
        for pattern in comptes_obligatoires:
            if not self._has_matching_account(account_codes, pattern):
                errors.append(JournalValidationError(
                    code="MISSING_REQUIRED_ACCOUNT",
                    message=f"Le journal {rules.get('name', journal_type)} requiert un compte {pattern}",
                    severity="error"
                ))

        # Vérifier le compte principal (banque, caisse)
        compte_principal = rules.get("compte_principal")
        if compte_principal:
            if not self._has_matching_account(account_codes, compte_principal):
                errors.append(JournalValidationError(
                    code="MISSING_PRINCIPAL_ACCOUNT",
                    message=f"Le journal {rules.get('name', journal_type)} requiert un compte {compte_principal}",
                    severity="error"
                ))

        # Vérifier les comptes autorisés
        comptes_autorises = rules.get("comptes_autorises", [])
        if comptes_autorises and comptes_autorises != "*":
            for code in account_codes:
                if not any(self._matches_pattern(code, pattern) for pattern in comptes_autorises):
                    errors.append(JournalValidationError(
                        code="UNAUTHORIZED_ACCOUNT",
                        message=f"Le compte {code} n'est pas autorisé dans le journal {rules.get('name', journal_type)}",
                        severity="warning"
                    ))

        # Vérifier le solde négatif pour la caisse
        if rules.get("solde_negatif_interdit"):
            cash_balance = self._get_cash_balance(account_codes)
            if cash_balance < 0:
                errors.append(JournalValidationError(
                    code="NEGATIVE_CASH_BALANCE",
                    message="Le solde de caisse ne peut pas être négatif",
                    severity="error"
                ))

        # Avertissement si justification requise (OD)
        if rules.get("justification_requise"):
            if not entry.notes and not entry.reference:
                errors.append(JournalValidationError(
                    code="JUSTIFICATION_REQUIRED",
                    message="Les opérations diverses requièrent une justification (notes ou référence)",
                    severity="warning"
                ))

        return errors

    def _validate_amounts(self, entry: JournalEntry) -> List[JournalValidationError]:
        """Valide les montants des lignes"""
        errors = []

        for i, line in enumerate(entry.lines):
            debit = line.debit or Decimal("0")
            credit = line.credit or Decimal("0")

            # Une ligne ne peut pas avoir à la fois débit et crédit
            if debit > 0 and credit > 0:
                errors.append(JournalValidationError(
                    code="DUAL_AMOUNT",
                    message=f"Ligne {i+1}: Une ligne ne peut pas avoir à la fois un débit et un crédit",
                    severity="error"
                ))

            # Une ligne doit avoir au moins un montant
            if debit == 0 and credit == 0:
                errors.append(JournalValidationError(
                    code="ZERO_AMOUNT",
                    message=f"Ligne {i+1}: La ligne n'a aucun montant",
                    severity="warning"
                ))

            # Les montants doivent être positifs
            if debit < 0 or credit < 0:
                errors.append(JournalValidationError(
                    code="NEGATIVE_AMOUNT",
                    message=f"Ligne {i+1}: Les montants doivent être positifs",
                    severity="error"
                ))

        return errors

    def _has_matching_account(self, account_codes: List[str], pattern: str) -> bool:
        """Vérifie si au moins un compte correspond au pattern"""
        return any(self._matches_pattern(code, pattern) for code in account_codes)

    def _matches_pattern(self, account_code: str, pattern: str) -> bool:
        """Vérifie si un code de compte correspond à un pattern (ex: 401* → 401000)"""
        if pattern == "*":
            return True
        if pattern.endswith("*"):
            prefix = pattern[:-1]
            return account_code.startswith(prefix)
        return account_code == pattern

    def _get_cash_balance(self, account_codes: List[str]) -> Decimal:
        """
        Calcule le solde de caisse après l'opération
        Note: Implémentation simplifiée, à améliorer avec le solde réel
        """
        # Pour une implémentation complète, récupérer le solde actuel du compte
        # et vérifier si l'opération le rendrait négatif
        return Decimal("0")  # Placeholder


def validate_journal_entry(
    db: Session,
    tenant_id: str,
    entry: JournalEntry
) -> Dict:
    """
    Fonction utilitaire pour valider une écriture
    
    Returns:
        Dict avec is_valid et errors
    """
    service = JournalValidationService(db, tenant_id)
    is_valid, errors = service.validate_entry(entry)

    return {
        "is_valid": is_valid,
        "errors": [e.to_dict() for e in errors],
        "error_count": len([e for e in errors if e.severity == "error"]),
        "warning_count": len([e for e in errors if e.severity == "warning"])
    }
