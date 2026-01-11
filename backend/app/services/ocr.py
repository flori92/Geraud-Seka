"""Service d'OCR utilisant Groq API (Llama Vision) pour l'extraction de données.

Mode: Service principal - utilise le service amélioré en backend
"""
from typing import Dict, Any, Optional
from datetime import date, timedelta
import base64
import io
import json
import os

import httpx

try:
    from pdf2image import convert_from_bytes
    PDF_SUPPORT = True
except (ImportError, Exception):
    PDF_SUPPORT = False
    print("Attention: pdf2image non disponible ou poppler manquant. Le support PDF OCR sera limité.")

try:
    from app.services.ocr_enhanced import enhanced_ocr_service
    USE_ENHANCED = True
except ImportError:
    USE_ENHANCED = False
    print("⚠️  Service OCR amélioré non disponible, fallback vers service basique")

try:
    from app.services.invoice_classifier import InvoiceClassifier
    CLASSIFIER_AVAILABLE = True
except ImportError:
    CLASSIFIER_AVAILABLE = False
    print("⚠️  Service de classification non disponible")

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = os.getenv("GROQ_MODEL", "meta-llama/llama-4-scout-17b-16e-instruct")


class GroqOCRService:
    """Service d'extraction de données via Groq Llama Vision."""

    def __init__(self):
        self.api_key = GROQ_API_KEY
        self.supported_formats = ['.pdf', '.jpg', '.jpeg', '.png', '.tiff', '.heic', '.webp']
        self.use_enhanced = USE_ENHANCED

    async def process_invoice(self, file_path: str, file_content: Optional[bytes] = None, extract_all_pages: bool = True) -> Dict[str, Any]:
        """
        Traite une facture avec OCR.

        Utilise automatiquement le service amélioré si disponible,
        sinon fallback vers le service basique.
        """
        if not self.api_key:
            raise RuntimeError("GROQ_API_KEY non configurée: impossible d'utiliser l'OCR serveur.")

        if self.use_enhanced:
            print("🚀 Utilisation du service OCR amélioré (LlamaOCR)")
            try:
                return await enhanced_ocr_service.process_invoice(file_path, file_content, extract_all_pages)
            except Exception as e:
                print(f"⚠️  OCR amélioré en échec, fallback basique: {e}")
                return await self._process_invoice_basic(file_path, file_content, extract_all_pages)

        print("⚠️  Utilisation du service OCR basique (fallback)")
        return await self._process_invoice_basic(file_path, file_content, extract_all_pages)

    async def _process_invoice_basic(self, file_path: str, file_content: Optional[bytes] = None, extract_all_pages: bool = True) -> Dict[str, Any]:
        """
        Traite une facture avec Groq Vision API.
        Convertit les PDF en images si nécessaire.
        """
        if not file_content:
            if os.path.exists(file_path):
                try:
                    with open(file_path, 'rb') as f:
                        file_content = f.read()
                except Exception as e:
                    print(f"Erreur lecture fichier local {file_path}: {e}")
                    raise
            else:
                raise FileNotFoundError(f"Fichier introuvable: {file_path}")

        file_ext = os.path.splitext(file_path)[1].lower() if file_path else ""
        
        image_base64 = None
        
        try:
            if file_ext == '.pdf' or (file_content and file_content.startswith(b'%PDF')):
                if not PDF_SUPPORT:
                    print("Erreur: Support PDF non disponible (pdf2image/poppler manquant).")
                    raise RuntimeError("Support PDF non disponible (pdf2image/poppler manquant).")
                
                try:
                    images = convert_from_bytes(file_content, first_page=1, last_page=1)
                    if images:
                        img_byte_arr = io.BytesIO()
                        images[0].save(img_byte_arr, format='JPEG')
                        image_base64 = base64.b64encode(img_byte_arr.getvalue()).decode('utf-8')
                        file_ext = ".jpg" # Traité comme image maintenant
                except Exception as e:
                    print(f"Erreur conversion PDF vers Image: {e}")
                    raise
            
            else:
                image_base64 = base64.b64encode(file_content).decode('utf-8')

            if not image_base64:
                raise ValueError("Impossible de générer l'image Base64")

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
                    "temperature": 0.0,  # 0 pour plus de cohérence
                    "max_tokens": 4096,  # Plus de tokens pour grandes factures
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
                    if content.strip().startswith("```json"):
                        content = content.strip().split("```json")[1].split("```")[0]
                    elif content.strip().startswith("```"):
                        content = content.strip().split("```")[1].split("```")[0]
                        
                    parsed_data = json.loads(content)
                    return self._format_response(parsed_data)
                else:
                    print(f"Erreur API Groq {response.status_code}: {response.text}")
                    raise RuntimeError(f"Erreur API Groq {response.status_code}: {response.text}")
                    
        except Exception as e:
            print(f"Erreur Groq OCR: {e}")
            raise
    
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
        formatted_data = {
            "reference_number": data.get("reference_number") or "",
            "date": data.get("date") or date.today().isoformat(),
            "due_date": data.get("due_date"),
            "amount_ht": float(data.get("amount_ht") or 0.0),
            "amount_vat": float(data.get("amount_vat") or 0.0),
            "amount_ttc": float(data.get("amount_ttc") or 0.0),
            "currency": data.get("currency") or "XOF",
            "supplier_name": data.get("supplier_name") or "",
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
        
        # Ajouter la classification automatique si disponible
        if CLASSIFIER_AVAILABLE:
            try:
                # Importer ici pour éviter les imports circulaires
                from app.services.invoice_classifier import InvoiceClassifier
                
                # Créer une instance temporaire avec des paramètres par défaut
                # Note: Cette classification sera affinée lors de la validation avec le bon tenant_id
                temp_classifier = InvoiceClassifier(None, "temp")
                invoice_type, confidence, metadata = temp_classifier.classify_invoice(data)
                
                # Mapper les types
                type_mapping = {
                    "PURCHASE": "INVOICE_PURCHASE",
                    "SALE": "INVOICE_SALES"
                }
                
                formatted_data["document_type"] = type_mapping.get(invoice_type, "INVOICE_PURCHASE")
                formatted_data["classification_confidence"] = confidence
                formatted_data["classification_metadata"] = metadata
                
                print(f"🤖 Classification OCR: {invoice_type} (confiance: {confidence:.2f})")
            except Exception as classify_err:
                print(f"⚠️ Erreur classification OCR: {classify_err}")
                formatted_data["document_type"] = "INVOICE_PURCHASE"  # Par défaut
        
        return formatted_data


ocr_service = GroqOCRService()
