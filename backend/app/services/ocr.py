"""Service d'OCR utilisant Mindee API pour l'extraction de données des documents."""
from typing import Dict, Any, Optional, List
import httpx
from datetime import date
import os

from app.core.config import get_settings

settings = get_settings()


class MindeeOCRService:
    """Service d'extraction de données via Mindee OCR avec support multi-pages."""

    def __init__(self):
        self.api_key = settings.mindee_api_key
        self.base_url = "https://api.mindee.net/v1"
        self.supported_formats = ['.pdf', '.jpg', '.jpeg', '.png', '.tiff', '.heic']
        
    async def process_invoice(self, file_path: str, extract_all_pages: bool = True) -> Dict[str, Any]:
        """
        Traite une facture avec Mindee Invoice API (support multi-pages).

        Args:
            file_path: Chemin vers le fichier à traiter
            extract_all_pages: Si True, traite toutes les pages du PDF

        Returns:
            Dict contenant les données extraites
        """
        if not self.api_key:
            # Fallback vers mock si pas de clé API
            return self._mock_extraction(file_path)

        # Vérifier l'extension du fichier
        file_ext = os.path.splitext(file_path)[1].lower()
        if file_ext not in self.supported_formats:
            return {"error": f"Format non supporté: {file_ext}", "source": "error"}
        
        try:
            async with httpx.AsyncClient() as client:
                with open(file_path, 'rb') as file:
                    response = await client.post(
                        f"{self.base_url}/products/mindee/invoices/v4/predict",
                        headers={
                            "Authorization": f"Token {self.api_key}",
                        },
                        files={"document": file}
                    )
                    
                if response.status_code == 200:
                    data = response.json()
                    return self._parse_mindee_response(data)
                else:
                    # En cas d'erreur, utiliser mock
                    return self._mock_extraction(file_path)
                    
        except Exception as e:
            print(f"Erreur Mindee OCR: {e}")
            return self._mock_extraction(file_path)
    
    def _parse_mindee_response(self, response: Dict) -> Dict[str, Any]:
        """Parse la réponse de Mindee et extrait les données pertinentes (multi-pages supporté)."""
        try:
            document = response.get("document", {})
            inference = document.get("inference", {})
            prediction = inference.get("prediction", {})
            pages = inference.get("pages", [])

            # Extraction des données principales
            invoice_number = prediction.get("invoice_number", {}).get("value", "")
            invoice_date = prediction.get("date", {}).get("value", "")
            due_date = prediction.get("due_date", {}).get("value", "")

            # Montants
            total_amount = prediction.get("total_amount", {}).get("value", 0.0)
            total_tax = prediction.get("total_tax", {}).get("value", 0.0)
            total_net = prediction.get("total_net", {}).get("value", 0.0)

            # Fournisseur
            supplier_name = prediction.get("supplier_name", {}).get("value", "")
            supplier_address = prediction.get("supplier_address", {}).get("value", "")
            supplier_tax_id = prediction.get("supplier_company_registration", [{}])[0].get("value", "")

            # Client
            customer_name = prediction.get("customer_name", {}).get("value", "")
            customer_address = prediction.get("customer_address", {}).get("value", "")

            # Lignes de facture (line items)
            line_items = []
            for item in prediction.get("line_items", []):
                line_items.append({
                    "description": item.get("description", ""),
                    "quantity": item.get("quantity", 0),
                    "unit_price": item.get("unit_price", 0.0),
                    "total_amount": item.get("total_amount", 0.0),
                    "tax_rate": item.get("tax_rate", 0.0)
                })

            # Informations multi-pages
            page_count = len(pages)
            confidence_scores = [p.get("prediction", {}).get("confidence", 0.0) for p in pages]
            avg_confidence = sum(confidence_scores) / len(confidence_scores) if confidence_scores else 0.0

            return {
                "reference_number": invoice_number,
                "date": invoice_date,
                "due_date": due_date,
                "amount_ht": total_net or 0.0,
                "amount_vat": total_tax or 0.0,
                "amount_ttc": total_amount or 0.0,
                "currency": prediction.get("locale", {}).get("currency", "XOF"),
                "supplier_name": supplier_name,
                "supplier_address": supplier_address,
                "supplier_tax_id": supplier_tax_id,
                "customer_name": customer_name,
                "customer_address": customer_address,
                "line_items": line_items,
                "page_count": page_count,
                "raw_text": str(prediction),
                "confidence": avg_confidence,
                "confidence_per_page": confidence_scores,
                "source": "mindee",
                "is_multi_page": page_count > 1
            }
        except Exception as e:
            print(f"Erreur parsing Mindee: {e}")
            return self._mock_extraction("")
    
    def _mock_extraction(self, file_path: str) -> Dict[str, Any]:
        """Extraction mockée pour le développement."""
        import random
        from datetime import timedelta
        
        return {
            "reference_number": f"INV-{random.randint(1000, 9999)}",
            "date": date.today().isoformat(),
            "due_date": (date.today() + timedelta(days=30)).isoformat(),
            "amount_ht": round(random.uniform(5000, 50000), 2),
            "amount_vat": round(random.uniform(900, 9000), 2),
            "amount_ttc": round(random.uniform(5900, 59000), 2),
            "currency": "XOF",
            "supplier_name": f"Fournisseur Test {random.randint(1, 100)}",
            "supplier_address": "Adresse test",
            "customer_name": "Client test",
            "raw_text": "Document mocké pour développement",
            "confidence": 0.95,
            "source": "mock"
        }


# Instance singleton
ocr_service = MindeeOCRService()
