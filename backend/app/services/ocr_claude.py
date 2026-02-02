"""
Service OCR Claude Vision - Extraction de données de factures avec Claude
Claude Vision est le modèle le plus précis pour l'extraction de données structurées.

Priorité OCR recommandée: Claude > Groq Llama 4 > Gemini > Fallback
"""
import base64
import io
import json
import os
from datetime import date
from typing import Any, Dict, Optional

import httpx

try:
    from pdf2image import convert_from_bytes
    PDF_SUPPORT = True
except (ImportError, Exception):
    PDF_SUPPORT = False

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
CLAUDE_MODEL = os.getenv("CLAUDE_VISION_MODEL", "claude-sonnet-4-20250514")
CLAUDE_API_URL = "https://api.anthropic.com/v1/messages"


class ClaudeOCRService:
    """Service OCR utilisant Claude Vision pour l'extraction de factures."""

    def __init__(self):
        self.api_key = ANTHROPIC_API_KEY
        self.model = CLAUDE_MODEL
        self.supported_formats = ['.pdf', '.jpg', '.jpeg', '.png', '.tiff', '.heic', '.webp', '.gif']

    async def process_invoice(
        self,
        file_path: str,
        file_content: Optional[bytes] = None,
        extract_all_pages: bool = True
    ) -> Dict[str, Any]:
        """
        Traite une facture avec Claude Vision API.

        Args:
            file_path: Chemin du fichier ou nom du fichier
            file_content: Contenu binaire du fichier (optionnel)
            extract_all_pages: Extraire toutes les pages (PDF)

        Returns:
            Dict contenant les données extraites
        """
        if not self.api_key:
            raise RuntimeError("ANTHROPIC_API_KEY non configuré")

        # Lire le fichier si pas de contenu fourni
        if not file_content:
            if os.path.exists(file_path):
                with open(file_path, 'rb') as f:
                    file_content = f.read()
            else:
                raise FileNotFoundError(f"Fichier introuvable: {file_path}")

        file_ext = os.path.splitext(file_path)[1].lower() if file_path else ""

        # Convertir PDF en image si nécessaire
        images_base64 = []
        media_types = []

        if file_ext == '.pdf' or (file_content and file_content.startswith(b'%PDF')):
            if not PDF_SUPPORT:
                raise RuntimeError("Support PDF non disponible (pdf2image/poppler manquant)")

            try:
                # Convertir toutes les pages ou juste la première
                max_pages = 5 if extract_all_pages else 1
                images = convert_from_bytes(
                    file_content,
                    first_page=1,
                    last_page=max_pages,
                    dpi=200  # Meilleure qualité
                )

                for img in images:
                    img_byte_arr = io.BytesIO()
                    img.save(img_byte_arr, format='JPEG', quality=95)
                    images_base64.append(base64.b64encode(img_byte_arr.getvalue()).decode('utf-8'))
                    media_types.append("image/jpeg")

            except Exception as e:
                print(f"⚠️ Erreur conversion PDF: {e}")
                raise
        else:
            # Image directe
            images_base64.append(base64.b64encode(file_content).decode('utf-8'))

            # Déterminer le media type
            ext_to_media = {
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.png': 'image/png',
                '.gif': 'image/gif',
                '.webp': 'image/webp',
            }
            media_types.append(ext_to_media.get(file_ext, 'image/jpeg'))

        # Construire le message pour Claude
        content = []

        # Ajouter toutes les images
        for i, (img_b64, media_type) in enumerate(zip(images_base64, media_types)):
            if i > 0:
                content.append({
                    "type": "text",
                    "text": f"\n--- Page {i + 1} ---\n"
                })

            content.append({
                "type": "image",
                "source": {
                    "type": "base64",
                    "media_type": media_type,
                    "data": img_b64
                }
            })

        # Ajouter le prompt d'extraction
        content.append({
            "type": "text",
            "text": self._get_extraction_prompt()
        })

        # Appel API Claude
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                CLAUDE_API_URL,
                headers={
                    "x-api-key": self.api_key,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json"
                },
                json={
                    "model": self.model,
                    "max_tokens": 4096,
                    "messages": [
                        {
                            "role": "user",
                            "content": content
                        }
                    ]
                }
            )

            if response.status_code == 200:
                result = response.json()
                text_content = result['content'][0]['text']

                # Extraire le JSON de la réponse
                parsed_data = self._extract_json(text_content)
                return self._format_response(parsed_data, len(images_base64))

            else:
                error_detail = response.text
                print(f"❌ Claude API error {response.status_code}: {error_detail}")
                raise RuntimeError(f"Claude API error {response.status_code}: {error_detail}")

    def _get_extraction_prompt(self) -> str:
        """Prompt optimisé pour l'extraction de factures."""
        return """Analyse cette facture et extrais les informations suivantes en JSON.

IMPORTANT:
- Extrais TOUTES les valeurs numériques avec précision
- Les montants doivent être des nombres (pas de formatage)
- Les dates en format YYYY-MM-DD
- Si une information n'est pas trouvée, utilise null

Retourne UNIQUEMENT un objet JSON valide avec cette structure exacte:
{
    "reference_number": "numéro de facture",
    "date": "YYYY-MM-DD",
    "due_date": "YYYY-MM-DD ou null",
    "amount_ht": 0.00,
    "amount_vat": 0.00,
    "amount_ttc": 0.00,
    "vat_rate": 18,
    "currency": "XOF",
    "supplier_name": "nom du fournisseur",
    "supplier_address": "adresse complète",
    "supplier_tax_id": "NIF/IFU du fournisseur",
    "supplier_phone": "téléphone",
    "supplier_email": "email",
    "customer_name": "nom du client",
    "customer_address": "adresse du client",
    "customer_tax_id": "NIF/IFU du client",
    "payment_terms": "conditions de paiement",
    "payment_method": "mode de paiement",
    "bank_details": "coordonnées bancaires",
    "line_items": [
        {
            "description": "description",
            "quantity": 1,
            "unit_price": 0.00,
            "total_amount": 0.00,
            "tax_rate": 18
        }
    ],
    "notes": "remarques ou observations"
}

Assure-toi que amount_ht + amount_vat = amount_ttc (vérifie le calcul).
Si les montants semblent incohérents, recalcule-les correctement."""

    def _extract_json(self, text: str) -> Dict[str, Any]:
        """Extrait le JSON de la réponse Claude."""
        # Essayer d'extraire le JSON des blocs markdown
        if "```json" in text:
            json_str = text.split("```json")[1].split("```")[0]
        elif "```" in text:
            json_str = text.split("```")[1].split("```")[0]
        else:
            # Chercher le JSON directement
            start = text.find('{')
            end = text.rfind('}') + 1
            if start != -1 and end > start:
                json_str = text[start:end]
            else:
                json_str = text

        try:
            return json.loads(json_str.strip())
        except json.JSONDecodeError as e:
            print(f"⚠️ Erreur parsing JSON Claude: {e}")
            print(f"Contenu reçu: {text[:500]}...")
            return {}

    def _format_response(self, data: Dict[str, Any], page_count: int = 1) -> Dict[str, Any]:
        """Formate la réponse pour être cohérente avec les autres services OCR."""

        # Valider et corriger les montants
        amount_ht = float(data.get("amount_ht") or 0)
        amount_vat = float(data.get("amount_vat") or 0)
        amount_ttc = float(data.get("amount_ttc") or 0)

        # Auto-correction des montants si incohérents
        if amount_ht > 0 and amount_vat > 0 and amount_ttc == 0:
            amount_ttc = amount_ht + amount_vat
        elif amount_ttc > 0 and amount_ht > 0 and amount_vat == 0:
            amount_vat = amount_ttc - amount_ht
        elif amount_ttc > 0 and amount_vat > 0 and amount_ht == 0:
            amount_ht = amount_ttc - amount_vat

        # Vérifier la cohérence
        if amount_ht > 0 and amount_ttc > 0:
            expected_ttc = amount_ht + amount_vat
            if abs(expected_ttc - amount_ttc) > 1:  # Tolérance de 1
                print(f"⚠️ Incohérence montants: {amount_ht} + {amount_vat} = {expected_ttc} ≠ {amount_ttc}")
                # Faire confiance au TTC et recalculer
                if amount_vat > 0:
                    amount_ht = amount_ttc - amount_vat

        formatted_data = {
            "reference_number": data.get("reference_number") or "",
            "date": data.get("date") or date.today().isoformat(),
            "due_date": data.get("due_date"),
            "amount_ht": amount_ht,
            "amount_vat": amount_vat,
            "amount_ttc": amount_ttc,
            "vat_rate": float(data.get("vat_rate") or 18),
            "currency": data.get("currency") or "XOF",
            "supplier_name": data.get("supplier_name") or "",
            "supplier_address": data.get("supplier_address") or "",
            "supplier_tax_id": data.get("supplier_tax_id") or "",
            "supplier_phone": data.get("supplier_phone") or "",
            "supplier_email": data.get("supplier_email") or "",
            "customer_name": data.get("customer_name") or "",
            "customer_address": data.get("customer_address") or "",
            "customer_tax_id": data.get("customer_tax_id") or "",
            "payment_terms": data.get("payment_terms") or "",
            "payment_method": data.get("payment_method") or "",
            "bank_details": data.get("bank_details") or "",
            "line_items": data.get("line_items") or [],
            "notes": data.get("notes") or "",
            "page_count": page_count,
            "raw_text": json.dumps(data),
            "confidence": 0.95,  # Claude a généralement une haute confiance
            "source": "claude-vision",
            "is_multi_page": page_count > 1
        }

        # Classification automatique basée sur le contenu
        supplier = (data.get("supplier_name") or "").lower()
        customer = (data.get("customer_name") or "").lower()

        # Heuristique simple: si le fournisseur est identifié clairement, c'est un achat
        if supplier and len(supplier) > 3:
            formatted_data["document_type"] = "INVOICE_PURCHASE"
        elif customer and len(customer) > 3:
            formatted_data["document_type"] = "INVOICE_SALES"
        else:
            formatted_data["document_type"] = "INVOICE_PURCHASE"  # Par défaut

        return formatted_data


# Instance singleton
claude_ocr_service = ClaudeOCRService()
