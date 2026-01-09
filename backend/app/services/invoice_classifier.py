"""
Service de classification automatique des factures (Achat vs Vente)
"""
from typing import Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import text


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
        
        # 1. Vérification dans la base de données (avec gestion d'erreur si colonnes manquantes)
        try:
            if supplier_name:
                # Chercher si c'est un fournisseur connu (requête simplifiée)
                supplier_match = self.db.execute(
                    text("SELECT name FROM suppliers WHERE LOWER(name) LIKE :name LIMIT 1"),
                    {"name": f"%{supplier_name.lower()}%"}
                ).fetchone()
                
                if supplier_match:
                    scores["purchase"] += 0.4
                    reasons["purchase"].append(f"Fournisseur reconnu: {supplier_match[0]}")
            
            if customer_name:
                # Chercher si c'est un client connu
                client_match = self.db.execute(
                    text("SELECT name FROM clients WHERE tenant_id = :tenant_id AND LOWER(name) LIKE :name LIMIT 1"),
                    {"tenant_id": self.tenant_id, "name": f"%{customer_name.lower()}%"}
                ).fetchone()
                
                if client_match:
                    scores["sale"] += 0.4
                    reasons["sale"].append(f"Client reconnu: {client_match[0]}")
        except Exception as db_err:
            print(f"⚠️  Erreur DB classification (ignorée): {db_err}")
            self.db.rollback()
        
        # 2. Analyse des mots-clés dans le texte
        purchase_keywords = [
            "facture fournisseur", "facture d'achat", "facture achat",
            "invoice from", "facture reçue", "reçu de", "à payer",
            "fournisseur:", "supplier:", "vendor:", "achat",
            "bon de livraison", "doit", "notre client", "payable",
            # Fournisseurs connus au Bénin
            "sbee", "soneb", "mtn", "moov", "spie", "total", "oryx",
            "sodeco", "ceb", "canalplus", "canal+", "orange"
        ]
        
        sale_keywords = [
            "facture client", "facture de vente", "facture vente",
            "invoice to", "facture émise", "facturé à", "à recevoir",
            "client:", "customer:", "facture n°", "facture numéro",
            "votre facture", "montant à payer", "nous vous facturons",
            "avoir", "crédit"
        ]
        
        for keyword in purchase_keywords:
            if keyword in raw_text:
                scores["purchase"] += 0.2
                reasons["purchase"].append(f"Mot-clé détecté: '{keyword}'")
        
        for keyword in sale_keywords:
            if keyword in raw_text:
                scores["sale"] += 0.2
                reasons["sale"].append(f"Mot-clé détecté: '{keyword}'")
        
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
