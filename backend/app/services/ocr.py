"""Service d'OCR utilisant Groq API (Llama Vision) pour l'extraction de données."""
from typing import Dict, Any, Optional, List
import httpx
import base64
import json
import io
import os
from datetime import date, timedelta

# Tentative d'import de pdf2image, avec gestion d'erreur si poppler n'est pas installé
try:
    from pdf2image import convert_from_bytes
    PDF_SUPPORT = True
except (ImportError, Exception):
    PDF_SUPPORT = False
    print("Attention: pdf2image non disponible ou poppler manquant. Le support PDF OCR sera limité.")


from app.core.config import get_settings

settings = get_settings()

# Clé API Groq (chargée depuis les variables d'environnement)
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "llama-3.2-11b-vision-preview"

class GroqOCRService:
    """Service d'extraction de données via Groq Llama Vision."""

    def __init__(self):
        self.api_key = GROQ_API_KEY
        self.supported_formats = ['.pdf', '.jpg', '.jpeg', '.png', '.tiff', '.heic', '.webp']
        
    async def process_invoice(self, file_path: str, file_content: Optional[bytes] = None, extract_all_pages: bool = True) -> Dict[str, Any]:
        """
        Traite une facture avec Groq Vision API.
        Convertit les PDF en images si nécessaire.
        """
        if not self.api_key:
            return self._mock_extraction(file_path)

        # Lecture fichier si nécessaire
        if not file_content:
            if os.path.exists(file_path):
                try:
                    with open(file_path, 'rb') as f:
                        file_content = f.read()
                except Exception as e:
                    print(f"Erreur lecture fichier local {file_path}: {e}")
                    return self._mock_extraction(file_path)
            else:
                 return self._mock_extraction(file_path)

        # Détection type et conversion si PDF
        file_ext = os.path.splitext(file_path)[1].lower() if file_path else ""
        
        # Préparation de l'image (base64)
        image_base64 = None
        
        try:
            # Si c'est un PDF, on convertit la première page en image
            if file_ext == '.pdf' or (file_content and file_content.startswith(b'%PDF')):
                if not PDF_SUPPORT:
                    print("Erreur: Support PDF non disponible (pdf2image/poppler manquant).")
                    return self._mock_extraction(file_path)
                
                try:
                    # Convertir la première page seulement pour économiser tokens et temps
                    # (Llama Vision prend une image)
                    images = convert_from_bytes(file_content, first_page=1, last_page=1)
                    if images:
                        # Sauvegarder en buffer bytes JPEG
                        img_byte_arr = io.BytesIO()
                        images[0].save(img_byte_arr, format='JPEG')
                        image_base64 = base64.b64encode(img_byte_arr.getvalue()).decode('utf-8')
                        file_ext = ".jpg" # Traité comme image maintenant
                except Exception as e:
                    print(f"Erreur conversion PDF vers Image: {e}")
                    return self._mock_extraction(file_path)
            
            else:
                # C'est déjà une image (normalement)
                image_base64 = base64.b64encode(file_content).decode('utf-8')

            if not image_base64:
                raise ValueError("Impossible de générer l'image Base64")

            # Appel API Groq
            async with httpx.AsyncClient(timeout=60.0) as client:
                data_schema = self._get_json_schema()
                
                system_prompt = f"""You are an expert OCR specialist and accountant. 
                Extract structured data from the provided invoice image. 
                Return ONLY a valid JSON object matching exactly this schema:
                {json.dumps(data_schema, indent=2)}
                
                Rules:
                - Do not include markdown code blocks (```json ... ```). Return raw JSON.
                - If a field is not found, use null or empty string/0 as appropriate.
                - Convert all amounts to numbers (float).
                - Dates should be YYYY-MM-DD.
                - Currency should be 'XOF' if CFA detected, else extract it.
                - 'amount_ht' is Net Amount, 'amount_vat' is Tax Amount, 'amount_ttc' is Total Amount.
                """

                payload = {
                    "model": GROQ_MODEL,
                    "messages": [
                        {
                            "role": "user",
                            "content": [
                                {"type": "text", "text": system_prompt},
                                {
                                    "type": "image_url", 
                                    "image_url": {
                                        "url": f"data:image/jpeg;base64,{image_base64}"
                                    }
                                }
                            ]
                        }
                    ],
                    "temperature": 0.1,
                    "max_tokens": 2048,
                    "response_format": {"type": "json_object"} 
                }

                response = await client.post(
                    GROQ_API_URL,
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json=payload
                )
                    
                if response.status_code == 200:
                    result = response.json()
                    content = result['choices'][0]['message']['content']
                    # Nettoyage si jamais le modèle met des backticks
                    if content.strip().startswith("```json"):
                        content = content.strip().split("```json")[1].split("```")[0]
                    elif content.strip().startswith("```"):
                        content = content.strip().split("```")[1].split("```")[0]
                        
                    parsed_data = json.loads(content)
                    return self._format_response(parsed_data)
                else:
                    print(f"Erreur API Groq {response.status_code}: {response.text}")
                    return self._mock_extraction(file_path)
                    
        except Exception as e:
            print(f"Erreur Groq OCR: {e}")
            return self._mock_extraction(file_path)
    
    def _get_json_schema(self):
        return {
            "reference_number": "string (invoice number)",
            "date": "string (YYYY-MM-DD)",
            "due_date": "string (YYYY-MM-DD)",
            "amount_ht": "number (net amount before tax)",
            "amount_vat": "number (tax amount)",
            "amount_ttc": "number (total amount including tax)",
            "currency": "string (ISO code e.g. XOF, EUR)",
            "supplier_name": "string",
            "supplier_address": "string",
            "supplier_tax_id": "string",
            "customer_name": "string",
            "customer_address": "string",
            "line_items": [
                {
                    "description": "string",
                    "quantity": "number",
                    "unit_price": "number",
                    "total_amount": "number",
                    "tax_rate": "number"
                }
            ]
        }

    def _format_response(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Assure que la réponse respecte le format interne attendu."""
        return {
            "reference_number": data.get("reference_number") or "",
            "date": data.get("date") or date.today().isoformat(),
            "due_date": data.get("due_date"),
            "amount_ht": float(data.get("amount_ht") or 0.0),
            "amount_vat": float(data.get("amount_vat") or 0.0),
            "amount_ttc": float(data.get("amount_ttc") or 0.0),
            "currency": data.get("currency") or "XOF",
            "supplier_name": data.get("supplier_name") or "Inconnu",
            "supplier_address": data.get("supplier_address") or "",
            "supplier_tax_id": data.get("supplier_tax_id") or "",
            "customer_name": data.get("customer_name") or "",
            "customer_address": data.get("customer_address") or "",
            "line_items": data.get("line_items") or [],
            "page_count": 1,
            "raw_text": json.dumps(data),
            "confidence": 0.9, # Simulé car Groq ne donne pas de confidence
            "source": "groq-llama-vision",
            "is_multi_page": False
        }
    
    def _mock_extraction(self, file_path: str) -> Dict[str, Any]:
        """Extraction mockée pour le développement/fallback."""
        import random
        
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
            "raw_text": "Document mocké (Fallback Groq)",
            "confidence": 0.95,
            "source": "mock"
        }


# Instance singleton remplacée
ocr_service = GroqOCRService()
