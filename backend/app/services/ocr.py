"""Service d'OCR pour l'extraction de données de factures.

Priorité: Claude Vision > Groq Llama 4 > Gemini Vision > Fallback basique

Claude Vision est le plus précis pour l'extraction structurée.
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
    print("Attention: pdf2image non disponible ou poppler manquant.")

# Priority 1: Claude Vision (most accurate)
try:
    from app.services.ocr_claude import claude_ocr_service, ANTHROPIC_API_KEY
    USE_CLAUDE = bool(ANTHROPIC_API_KEY)
    if USE_CLAUDE:
        print("✅ Claude Vision OCR disponible (PRIORITÉ 1)")
except ImportError:
    USE_CLAUDE = False
    ANTHROPIC_API_KEY = ""
    print("⚠️ Claude OCR non disponible")

# Priority 2: Groq Llama 4 Vision
try:
    from app.services.ocr_enhanced import enhanced_ocr_service
    USE_ENHANCED = True
    print("✅ Groq Llama 4 Vision disponible (PRIORITÉ 2)")
except ImportError:
    USE_ENHANCED = False
    print("⚠️ Service OCR Groq non disponible")

# Priority 3: Gemini Vision
try:
    from app.services.ocr_gemini import gemini_ocr_service, GEMINI_API_KEY
    USE_GEMINI = bool(GEMINI_API_KEY)
    if USE_GEMINI:
        print("✅ Gemini OCR disponible (PRIORITÉ 3)")
except ImportError:
    USE_GEMINI = False
    GEMINI_API_KEY = ""
    print("⚠️ Gemini OCR non disponible")

try:
    from app.services.invoice_classifier import InvoiceClassifier
    CLASSIFIER_AVAILABLE = True
except ImportError:
    CLASSIFIER_AVAILABLE = False

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = os.getenv("GROQ_MODEL", "meta-llama/llama-4-scout-17b-16e-instruct")


class GroqOCRService:
    """
    Service d'extraction de données multi-modèles.

    Ordre de priorité:
    1. Claude Vision (plus précis pour extraction structurée)
    2. Groq Llama 4 Vision (rapide et efficace)
    3. Gemini Vision (bon fallback)
    4. Service basique (dernier recours)
    """

    def __init__(self):
        self.api_key = GROQ_API_KEY
        self.supported_formats = ['.pdf', '.jpg', '.jpeg', '.png', '.tiff', '.heic', '.webp']
        self.use_claude = USE_CLAUDE
        self.use_enhanced = USE_ENHANCED
        self.use_gemini = USE_GEMINI

    async def process_invoice(self, file_path: str, file_content: Optional[bytes] = None, extract_all_pages: bool = True) -> Dict[str, Any]:
        """
        Traite une facture avec le meilleur service OCR disponible.

        Cascade: Claude → Groq → Gemini → Basique
        """
        errors = []

        # Priority 1: Claude Vision (most accurate for invoices)
        if self.use_claude:
            print("🚀 Utilisation de Claude Vision OCR (PRIORITÉ 1)")
            try:
                result = await claude_ocr_service.process_invoice(file_path, file_content, extract_all_pages)
                if result.get("amount_ttc") or result.get("amount_ht") or result.get("supplier_name"):
                    print(f"✅ Claude OCR succès: {result.get('supplier_name')} - {result.get('amount_ttc')} {result.get('currency')}")
                    return result
                print("⚠️ Claude n'a pas extrait de données exploitables, essai Groq...")
            except Exception as e:
                errors.append(f"Claude: {e}")
                print(f"⚠️ Claude OCR échec: {e}, fallback Groq...")

        # Priority 2: Groq Llama 4 Vision (fast and efficient)
        if self.use_enhanced and self.api_key:
            print("🔄 Utilisation de Groq Llama 4 Vision OCR (PRIORITÉ 2)")
            try:
                result = await enhanced_ocr_service.process_invoice(file_path, file_content, extract_all_pages)
                if result.get("amount_ttc") or result.get("amount_ht") or result.get("supplier_name"):
                    print(f"✅ Groq OCR succès: {result.get('supplier_name')} - {result.get('amount_ttc')} {result.get('currency')}")
                    return result
                print("⚠️ Groq n'a pas extrait de données exploitables, essai Gemini...")
            except Exception as e:
                errors.append(f"Groq: {e}")
                print(f"⚠️ Groq OCR échec: {e}, fallback Gemini...")

        # Priority 3: Gemini Vision
        if self.use_gemini:
            print("🔄 Utilisation de Gemini Vision OCR (PRIORITÉ 3)")
            try:
                result = await gemini_ocr_service.process_invoice(file_path, file_content, extract_all_pages)
                if result.get("amount_ttc") or result.get("amount_ht") or result.get("supplier_name"):
                    print(f"✅ Gemini OCR succès: {result.get('supplier_name')} - {result.get('amount_ttc')} {result.get('currency')}")
                    return result
                print("⚠️ Gemini n'a pas extrait de données exploitables...")
            except Exception as e:
                errors.append(f"Gemini: {e}")
                print(f"⚠️ Gemini OCR échec: {e}")

        # Priority 4: Basic Groq fallback
        if self.api_key:
            print("⚠️ Utilisation du service OCR basique (dernier recours)")
            try:
                return await self._process_invoice_basic(file_path, file_content, extract_all_pages)
            except Exception as e:
                errors.append(f"Basique: {e}")
                print(f"❌ Service basique échec: {e}")

        # Aucun service n'a fonctionné
        error_summary = " | ".join(errors) if errors else "Aucun service configuré"
        raise RuntimeError(f"Tous les services OCR ont échoué: {error_summary}. Configurez ANTHROPIC_API_KEY, GROQ_API_KEY ou GEMINI_API_KEY.")

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
            "confidence": 0.9,
            "source": "groq-llama-vision",
            "is_multi_page": False
        }
        
        if CLASSIFIER_AVAILABLE:
            try:
                from app.services.invoice_classifier import InvoiceClassifier
                
                temp_classifier = InvoiceClassifier(None, "temp")
                invoice_type, confidence, metadata = temp_classifier.classify_invoice(data)
                
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
                formatted_data["document_type"] = "INVOICE_PURCHASE"
        
        return formatted_data


ocr_service = GroqOCRService()
