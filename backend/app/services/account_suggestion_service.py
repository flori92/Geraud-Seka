"""
Service pour l'auto-suggestion de comptes basee sur le nom fournisseur

Logique de suggestion:
1. Fournisseur existant avec categorie -> utiliser le compte de la categorie
2. Match dans les categories par mots-cles -> suggerer la categorie
3. Match dans account_keywords -> suggerer le compte
4. Fallback -> compte 601 (achats marchandises)
"""
from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.syscohada import SupplierCategory, AccountKeyword
from app.models.supplier import Supplier


class AccountSuggestionService:
    """Service de suggestion de comptes et categories"""

    def __init__(self, db: Session, tenant_id: str):
        self.db = db
        self.tenant_id = tenant_id

    def suggest_for_supplier(self, supplier_name: str) -> Dict[str, Any]:
        """
        Suggere un compte et une categorie pour un nom de fournisseur.

        Args:
            supplier_name: Nom du fournisseur (peut venir de l'OCR)

        Returns:
            Dict avec:
            - category: SupplierCategory serialisee ou None
            - charge_account: Numero du compte suggere
            - confidence: Score de confiance (0.0 - 1.0)
            - source: Origine de la suggestion
        """
        if not supplier_name:
            return self._default_suggestion()

        name_lower = supplier_name.strip().lower()

        # 1. Chercher fournisseur existant avec categorie
        existing = self._find_existing_supplier(name_lower)
        if existing and existing.category_id:
            category = self.db.query(SupplierCategory).filter(
                SupplierCategory.id == existing.category_id
            ).first()
            if category:
                return {
                    "category": self._serialize_category(category),
                    "charge_account": category.default_charge_account,
                    "confidence": 1.0,
                    "source": "existing_supplier"
                }

        # 2. Chercher categorie par mots-cles
        category = self._find_category_by_keywords(name_lower)
        if category:
            return {
                "category": self._serialize_category(category),
                "charge_account": category.default_charge_account,
                "confidence": 0.9,
                "source": "category_keywords"
            }

        # 3. Chercher dans account_keywords
        keyword_match = self._find_account_by_keywords(name_lower)
        if keyword_match:
            return {
                "category": None,
                "charge_account": keyword_match,
                "confidence": 0.7,
                "source": "account_keywords"
            }

        # 4. Fallback
        return self._default_suggestion()

    def suggest_category(self, supplier_name: str) -> Optional[Dict[str, Any]]:
        """
        Suggere uniquement une categorie.

        Args:
            supplier_name: Nom du fournisseur

        Returns:
            Categorie serialisee ou None
        """
        if not supplier_name:
            return None

        category = self._find_category_by_keywords(supplier_name.strip().lower())
        if category:
            return self._serialize_category(category)
        return None

    def _find_existing_supplier(self, name_lower: str) -> Optional[Supplier]:
        """Cherche un fournisseur existant par nom exact"""
        return self.db.query(Supplier).filter(
            Supplier.tenant_id == self.tenant_id,
            func.lower(Supplier.name) == name_lower
        ).first()

    def _find_category_by_keywords(self, name_lower: str) -> Optional[SupplierCategory]:
        """
        Cherche une categorie dont les mots-cles matchent le nom.

        Strategie:
        - Parcourir toutes les categories accessibles
        - Pour chaque categorie, verifier si un mot-cle est contenu dans le nom
        - Retourner la premiere categorie qui matche
        """
        from sqlalchemy import or_

        # Recuperer les categories accessibles (systeme + tenant)
        categories = self.db.query(SupplierCategory).filter(
            or_(
                SupplierCategory.tenant_id == None,
                SupplierCategory.tenant_id == self.tenant_id
            )
        ).all()

        for cat in categories:
            keywords = cat.keywords or []
            for keyword in keywords:
                keyword_lower = keyword.lower()
                # Match si le mot-cle est dans le nom OU le nom est dans le mot-cle
                if keyword_lower in name_lower or name_lower in keyword_lower:
                    return cat

        return None

    def _find_account_by_keywords(self, name_lower: str) -> Optional[str]:
        """
        Cherche un compte via la table account_keywords.

        Strategie:
        - Decoupe le nom en mots
        - Pour chaque mot significatif (>= 3 caracteres)
        - Cherche une correspondance dans account_keywords
        - Retourne le compte avec la plus haute priorite
        """
        words = name_lower.split()
        best_match = None
        best_priority = -1

        for word in words:
            if len(word) < 3:
                continue

            # Chercher correspondance exacte ou partielle
            match = self.db.query(AccountKeyword).filter(
                AccountKeyword.keyword.ilike(f"%{word}%")
            ).order_by(AccountKeyword.priority.desc()).first()

            if match and match.priority > best_priority:
                best_match = match.account_number
                best_priority = match.priority

        return best_match

    def _default_suggestion(self) -> Dict[str, Any]:
        """Suggestion par defaut quand aucune correspondance"""
        return {
            "category": None,
            "charge_account": "601",
            "confidence": 0.3,
            "source": "default"
        }

    def _serialize_category(self, category: SupplierCategory) -> Dict[str, Any]:
        """Serialise une categorie pour la reponse API"""
        return {
            "id": str(category.id),
            "code": category.code,
            "label": category.label,
            "default_charge_account": category.default_charge_account,
            "keywords": category.keywords or []
        }


def get_account_suggestion_service(db: Session, tenant_id: str) -> AccountSuggestionService:
    """Factory function pour creer le service"""
    return AccountSuggestionService(db, tenant_id)
