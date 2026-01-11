"""
OCR Service using Google Gemini Vision API.
More reliable than Groq for invoice data extraction.
"""
import os
import base64
import json
import io
from typing import Dict, Any, Optional
from datetime import date

try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False

try:
    from pdf2image import convert_from_bytes
    PDF_SUPPORT = True
except (ImportError, Exception):
    PDF_SUPPORT = False

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")


class GeminiOCRService:
    def __init__(self):
        self.api_key = GEMINI_API_KEY
        self.model = None
        
        if GEMINI_AVAILABLE and self.api_key:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel('gemini-1.5-flash')
            print("✅ Gemini OCR Service initialized")
        else:
            print("⚠️ Gemini OCR not available - check GEMINI_API_KEY")
    
    async def process_invoice(self, file_path: str, file_content: Optional[bytes] = None, extract_all_pages: bool = True) -> Dict[str, Any]:
        if not self.model:
            raise RuntimeError("GEMINI_API_KEY non configurée")
        
        if not file_content:
            if os.path.exists(file_path):
                with open(file_path, 'rb') as f:
                    file_content = f.read()
            else:
                raise FileNotFoundError(f"Fichier non trouvé: {file_path}")
        
        file_ext = os.path.splitext(file_path)[1].lower() if file_path else ""
        
        # Convert PDF to image if needed
        if file_ext == '.pdf' or (file_content and file_content.startswith(b'%PDF')):
            if not PDF_SUPPORT:
                raise RuntimeError("Support PDF non disponible")
            images = convert_from_bytes(file_content, first_page=1, last_page=1, dpi=150)
            if not images:
                raise ValueError("PDF conversion failed")
            img_buffer = io.BytesIO()
            images[0].save(img_buffer, format='JPEG', quality=90)
            image_data = img_buffer.getvalue()
            mime_type = "image/jpeg"
        else:
            image_data = file_content
            mime_type = "image/jpeg" if file_ext in ['.jpg', '.jpeg'] else "image/png"
        
        prompt = """Analyse cette facture et extrais les informations suivantes en JSON.

IMPORTANT: Retourne UNIQUEMENT un objet JSON valide, sans markdown ni texte additionnel.

Structure attendue:
{
    "reference_number": "numéro de facture",
    "date": "YYYY-MM-DD",
    "due_date": "YYYY-MM-DD ou null",
    "amount_ht": nombre (montant hors taxes),
    "amount_vat": nombre (montant TVA),
    "amount_ttc": nombre (montant TTC),
    "vat_rate": nombre (taux TVA en %),
    "currency": "XOF ou EUR ou USD",
    "supplier_name": "nom du fournisseur",
    "supplier_address": "adresse fournisseur",
    "supplier_tax_id": "NIF/RCCM fournisseur",
    "customer_name": "nom du client",
    "customer_address": "adresse client",
    "line_items": [
        {
            "description": "description",
            "quantity": nombre,
            "unit_price": nombre,
            "total_amount": nombre
        }
    ]
}

Règles:
- Si un champ n'est pas trouvé, utilise null
- Les montants doivent être des nombres (pas de texte)
- Pour les factures africaines (FCFA), currency = "XOF"
- Le taux TVA au Bénin est généralement 18%
- amount_ht + amount_vat = amount_ttc"""

        try:
            response = self.model.generate_content([
                prompt,
                {"mime_type": mime_type, "data": base64.b64encode(image_data).decode()}
            ])
            
            content = response.text.strip()
            
            # Clean markdown if present
            if content.startswith("```"):
                content = content.split("```")[1]
                if content.startswith("json"):
                    content = content[4:]
                content = content.strip()
            
            data = json.loads(content)
            return self._format_response(data)
            
        except json.JSONDecodeError as e:
            print(f"❌ JSON parse error: {e}")
            print(f"Raw response: {content[:500]}")
            return self._empty_response()
        except Exception as e:
            print(f"❌ Gemini OCR error: {e}")
            raise
    
    def _format_response(self, data: Dict[str, Any]) -> Dict[str, Any]:
        # Validate and fix amounts
        ht = float(data.get("amount_ht") or 0)
        vat = float(data.get("amount_vat") or 0)
        ttc = float(data.get("amount_ttc") or 0)
        
        if ht > 0 and vat > 0 and ttc == 0:
            ttc = round(ht + vat, 2)
        elif ttc > 0 and ht > 0 and vat == 0:
            vat = round(ttc - ht, 2)
        elif ttc > 0 and vat > 0 and ht == 0:
            ht = round(ttc - vat, 2)
        
        return {
            "reference_number": data.get("reference_number") or "",
            "date": data.get("date") or date.today().isoformat(),
            "due_date": data.get("due_date"),
            "amount_ht": ht,
            "amount_vat": vat,
            "amount_ttc": ttc,
            "vat_rate": float(data.get("vat_rate") or 18),
            "currency": data.get("currency") or "XOF",
            "supplier_name": data.get("supplier_name") or "",
            "supplier_address": data.get("supplier_address") or "",
            "supplier_tax_id": data.get("supplier_tax_id") or "",
            "customer_name": data.get("customer_name") or "",
            "customer_address": data.get("customer_address") or "",
            "line_items": data.get("line_items") or [],
            "confidence": 0.95,
            "source": "gemini-1.5-flash",
        }
    
    def _empty_response(self) -> Dict[str, Any]:
        return {
            "reference_number": "",
            "date": date.today().isoformat(),
            "due_date": None,
            "amount_ht": 0,
            "amount_vat": 0,
            "amount_ttc": 0,
            "vat_rate": 18,
            "currency": "XOF",
            "supplier_name": "",
            "supplier_address": "",
            "supplier_tax_id": "",
            "customer_name": "",
            "customer_address": "",
            "line_items": [],
            "confidence": 0,
            "source": "gemini-error",
        }


gemini_ocr_service = GeminiOCRService()
