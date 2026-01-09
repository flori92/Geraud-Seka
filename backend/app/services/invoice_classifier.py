"""
Service de classification automatique des factures (Achat vs Vente)
"""
from typing import Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import or_, func

from app.models.client import Client
from app.models.supplier import Supplier


class InvoiceClassifier:
    """Classifie automatiquement les factures en Achat ou Vente"""
    
    def __init__(self, db: Session, tenant_id: str):
        self.db = db
        self.tenant_id = tenant_id
    
    def classify_invoice(
        self, 
        ocr_data: Dict[str, Any],
        tenant_name: Optional[str] = None
    ) -> Tuple[str, float, Dict[str, Any]]:
        """
        Classifie une facture en Achat ou Vente
        
        Args:
            ocr_data: Données extraites par OCR
            tenant_name: Nom de l'entreprise (pour détection)
            
        Returns:
            Tuple (type, confidence, metadata)
            - type: "PURCHASE" ou "SALE"
            - confidence: Score de confiance 0.0-1.0
            - metadata: Informations sur la classification
        """
        supplier_name = (ocr_data.get("supplier_name") or "").strip()
        customer_name = (ocr_data.get("customer_name") or "").strip()
        raw_text = (ocr_data.get("raw_text") or "").lower()
        
        scores = {
            "purchase": 0.0,
            "sale": 0.0
        }
        reasons = {
            "purchase": [],
            "sale": []
        }
        
        # 1. Vérification dans la base de données
        if supplier_name:
            # Chercher si c'est un fournisseur connu
            supplier_match = self.db.query(Supplier).filter(
                Supplier.client_id.in_(
                    self.db.query(Client.id).filter(Client.tenant_id == self.tenant_id)
                ),
                or_(
                    func.lower(Supplier.name).like(f"%{supplier_name.lower()}%"),
                    func.lower(Supplier.name) == supplier_name.lower()
                )
            ).first()
            
            if supplier_match:
                scores["purchase"] += 0.4
                reasons["purchase"].append(f"Fournisseur reconnu: {supplier_match.name}")
        
        if customer_name:
            # Chercher si c'est un client connu
            client_match = self.db.query(Client).filter(
                Client.tenant_id == self.tenant_id,
                or_(
                    func.lower(Client.name).like(f"%{customer_name.lower()}%"),
                    func.lower(Client.name) == customer_name.lower()
                )
            ).first()
            
            if client_match:
                scores["sale"] += 0.4
                reasons["sale"].append(f"Client reconnu: {client_match.name}")
        
        # 2. Analyse des mots-clés dans le texte
        purchase_keywords = [
            "facture fournisseur", "facture d'achat", "facture achat",
            "invoice from", "facture reçue", "reçu de", "à payer",
            "fournisseur:", "supplier:", "vendor:", "achat"
        ]
        
        sale_keywords = [
            "facture client", "facture de vente", "facture vente",
            "invoice to", "facture émise", "facturé à", "à recevoir",
            "client:", "customer:", "facture n°", "facture numéro"
        ]
        
        for keyword in purchase_keywords:
            if keyword in raw_text:
                scores["purchase"] += 0.15
                reasons["purchase"].append(f"Mot-clé détecté: '{keyword}'")
                break
        
        for keyword in sale_keywords:
            if keyword in raw_text:
                scores["sale"] += 0.15
                reasons["sale"].append(f"Mot-clé détecté: '{keyword}'")
                break
        
        # 3. Analyse de la structure (si supplier_name présent mais pas customer_name → Achat)
        if supplier_name and not customer_name:
            scores["purchase"] += 0.2
            reasons["purchase"].append("Structure typique d'achat (fournisseur sans client)")
        
        if customer_name and not supplier_name:
            scores["sale"] += 0.2
            reasons["sale"].append("Structure typique de vente (client sans fournisseur)")
        
        # 4. Comparaison avec le nom du tenant (si fourni)
        if tenant_name:
            tenant_lower = tenant_name.lower()
            if supplier_name and tenant_lower in supplier_name.lower():
                scores["sale"] += 0.1
                reasons["sale"].append("Nom de l'entreprise dans le champ fournisseur → Vente")
            if customer_name and tenant_lower in customer_name.lower():
                scores["purchase"] += 0.1
                reasons["purchase"].append("Nom de l'entreprise dans le champ client → Achat")
        
        # 5. Normalisation des scores (max 1.0)
        scores["purchase"] = min(scores["purchase"], 1.0)
        scores["sale"] = min(scores["sale"], 1.0)
        
        # Détermination du type
        if scores["purchase"] > scores["sale"]:
            invoice_type = "PURCHASE"
            confidence = scores["purchase"]
            metadata = {
                "type": "PURCHASE",
                "confidence": confidence,
                "reasons": reasons["purchase"],
                "alternative_score": scores["sale"]
            }
        elif scores["sale"] > scores["purchase"]:
            invoice_type = "SALE"
            confidence = scores["sale"]
            metadata = {
                "type": "SALE",
                "confidence": confidence,
                "reasons": reasons["sale"],
                "alternative_score": scores["purchase"]
            }
        else:
            # Égalité ou indéterminé → Par défaut Achat
            invoice_type = "PURCHASE"
            confidence = 0.5
            metadata = {
                "type": "PURCHASE",
                "confidence": confidence,
                "reasons": ["Classification par défaut (indéterminé)"],
                "alternative_score": scores["sale"]
            }
        
        return invoice_type, confidence, metadata
