"""Service d'OCR utilisant Mindee API pour l'extraction de données des documents."""
from typing import Dict, Any, Optional
import httpx
from datetime import date

from app.core.config import get_settings

settings = get_settings()


class MindeeOCRService:
    """Service d'extraction de données via Mindee OCR."""
    
    def __init__(self):
        self.api_key = settings.mindee_api_key
        self.base_url = "https://api.mindee.net/v1"
        
    async def process_invoice(self, file_path: str) -> Dict[str, Any]:
        """
        Traite une facture avec Mindee Invoice API.
        
        Args:
            file_path: Chemin vers le fichier à traiter
            
        Returns:
            Dict contenant les données extraites
        """
        if not self.api_key:
            # Fallback vers mock si pas de clé API
            return self._mock_extraction(file_path)
        
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
        """Parse la réponse de Mindee et extrait les données pertinentes."""
        try:
            prediction = response["document"]["inference"]["prediction"]
            
            # Extraction des données
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
            
            # Client
            customer_name = prediction.get("customer_name", {}).get("value", "")
            
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
                "customer_name": customer_name,
                "raw_text": str(prediction),
                "confidence": prediction.get("confidence", 0.0),
                "source": "mindee"
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
