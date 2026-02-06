"""
Service pour la gestion du referentiel SYSCOHADA

Fonctionnalites:
- Lecture du plan comptable OHADA
- Recherche de comptes par numero ou libelle
- Navigation hierarchique (classes -> comptes -> sous-comptes)
- Gestion des categories fournisseurs
"""
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.models.syscohada import SyscohadaAccount, SupplierCategory


class SyscohadaService:
    """Service pour acceder au referentiel SYSCOHADA"""

    def __init__(self, db: Session):
        self.db = db

    def get_all_accounts(self, class_filter: Optional[int] = None) -> List[SyscohadaAccount]:
        """
        Retourne tous les comptes, optionnellement filtres par classe.

        Args:
            class_filter: Numero de classe (1-8) pour filtrer

        Returns:
            Liste des comptes tries par numero
        """
        query = self.db.query(SyscohadaAccount)
        if class_filter:
            query = query.filter(SyscohadaAccount.account_class == class_filter)
        return query.order_by(SyscohadaAccount.account_number).all()

    def get_detail_accounts(self, class_filter: Optional[int] = None) -> List[SyscohadaAccount]:
        """
        Retourne uniquement les comptes utilisables (is_detail=True).
        Ces comptes peuvent recevoir des ecritures comptables.

        Args:
            class_filter: Numero de classe (1-8) pour filtrer

        Returns:
            Liste des comptes de detail tries par numero
        """
        query = self.db.query(SyscohadaAccount).filter(
            SyscohadaAccount.is_detail == True
        )
        if class_filter:
            query = query.filter(SyscohadaAccount.account_class == class_filter)
        return query.order_by(SyscohadaAccount.account_number).all()

    def search_accounts(self, query: str, limit: int = 20) -> List[SyscohadaAccount]:
        """
        Recherche par numero ou libelle.

        Args:
            query: Terme de recherche
            limit: Nombre max de resultats

        Returns:
            Liste des comptes correspondants
        """
        if not query or len(query) < 1:
            return []

        search_term = f"%{query}%"
        return self.db.query(SyscohadaAccount).filter(
            or_(
                SyscohadaAccount.account_number.ilike(search_term),
                SyscohadaAccount.account_label.ilike(search_term)
            )
        ).order_by(SyscohadaAccount.account_number).limit(limit).all()

    def get_account_by_number(self, account_number: str) -> Optional[SyscohadaAccount]:
        """
        Recupere un compte par son numero exact.

        Args:
            account_number: Numero du compte (ex: "6061")

        Returns:
            Le compte ou None si non trouve
        """
        return self.db.query(SyscohadaAccount).filter(
            SyscohadaAccount.account_number == account_number
        ).first()

    def get_account_hierarchy(self) -> Dict[int, Dict[str, Any]]:
        """
        Retourne l'arborescence complete pour navigation.

        Structure retournee:
        {
            6: {
                "label": "Charges",
                "accounts": {
                    "60": {
                        "label": "Achats",
                        "children": [
                            {"number": "601", "label": "...", "is_detail": True},
                            ...
                        ]
                    }
                }
            }
        }
        """
        accounts = self.get_all_accounts()
        hierarchy: Dict[int, Dict[str, Any]] = {}

        # Premiere passe: creer la structure des classes et comptes principaux
        for acc in accounts:
            cls = acc.account_class

            # Initialiser la classe si necessaire
            if cls not in hierarchy:
                hierarchy[cls] = {
                    "label": self._get_class_label(cls),
                    "accounts": {}
                }

            # Niveau 2 = compte principal (10, 20, 60...)
            if acc.level == 2:
                hierarchy[cls]["accounts"][acc.account_number] = {
                    "label": acc.account_label,
                    "is_detail": acc.is_detail,
                    "children": []
                }

        # Deuxieme passe: ajouter les sous-comptes
        for acc in accounts:
            if acc.level > 2 and acc.parent_account:
                cls = acc.account_class
                parent = acc.parent_account

                # Trouver le compte parent dans la hierarchie
                if cls in hierarchy and parent in hierarchy[cls]["accounts"]:
                    hierarchy[cls]["accounts"][parent]["children"].append({
                        "number": acc.account_number,
                        "label": acc.account_label,
                        "is_detail": acc.is_detail
                    })

        return hierarchy

    def _get_class_label(self, class_num: int) -> str:
        """Labels des classes SYSCOHADA"""
        labels = {
            1: "Ressources durables",
            2: "Actif immobilise",
            3: "Stocks",
            4: "Tiers",
            5: "Tresorerie",
            6: "Charges",
            7: "Produits",
            8: "Autres charges/produits"
        }
        return labels.get(class_num, f"Classe {class_num}")

    # =========================================================================
    # CATEGORIES FOURNISSEURS
    # =========================================================================

    def get_categories(self, tenant_id: Optional[str] = None) -> List[SupplierCategory]:
        """
        Retourne les categories de fournisseurs.
        Inclut les categories systeme (tenant_id=None) + celles du tenant.

        Args:
            tenant_id: ID du tenant pour filtrer

        Returns:
            Liste des categories triees par label
        """
        query = self.db.query(SupplierCategory)

        if tenant_id:
            query = query.filter(
                or_(
                    SupplierCategory.tenant_id == None,
                    SupplierCategory.tenant_id == tenant_id
                )
            )
        else:
            # Sans tenant, ne retourner que les categories systeme
            query = query.filter(SupplierCategory.tenant_id == None)

        return query.order_by(SupplierCategory.label).all()

    def get_category_by_code(self, code: str) -> Optional[SupplierCategory]:
        """
        Recupere une categorie par son code.

        Args:
            code: Code de la categorie (ex: "ENERGIE")

        Returns:
            La categorie ou None si non trouvee
        """
        return self.db.query(SupplierCategory).filter(
            SupplierCategory.code == code
        ).first()

    def create_category(
        self,
        code: str,
        label: str,
        default_charge_account: str,
        keywords: List[str],
        tenant_id: Optional[str] = None
    ) -> SupplierCategory:
        """
        Cree une nouvelle categorie fournisseur.

        Args:
            code: Code unique (ex: "ENERGIE")
            label: Libelle affiche
            default_charge_account: Compte de charge par defaut
            keywords: Mots-cles pour la detection
            tenant_id: ID du tenant (None = categorie systeme)

        Returns:
            La categorie creee
        """
        import uuid

        category = SupplierCategory(
            id=uuid.uuid4(),
            code=code.upper(),
            label=label,
            default_charge_account=default_charge_account,
            keywords=keywords,
            tenant_id=tenant_id
        )

        self.db.add(category)
        self.db.flush()

        return category
