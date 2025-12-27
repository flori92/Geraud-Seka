"""Service d'envoi d'emails avec Resend et tracking intégré."""
from typing import List, Optional, Dict, Any
import httpx
import secrets
import re
from datetime import datetime

from app.core.config import get_settings

settings = get_settings()


def generate_tracking_token() -> str:
    """Génère un token de tracking unique et sécurisé"""
    return secrets.token_urlsafe(32)


class EmailService:
    """Service d'envoi d'emails via Resend avec tracking intégré."""
    
    def __init__(self):
        self.api_key = settings.resend_api_key
        self.from_email = settings.resend_from_email
        self.from_name = settings.resend_from_name
        self.base_url = "https://api.resend.com"
        self.tracking_base_url = "https://www.sekagestion.com/api/v1/email"
    
    def inject_tracking_pixel(self, html: str, tracking_token: str) -> str:
        """Injecte le pixel de tracking dans le HTML de l'email"""
        pixel_url = f"{self.tracking_base_url}/open/{tracking_token}.png"
        pixel_tag = f'<img src="{pixel_url}" width="1" height="1" style="display:none;" alt="" />'
        
        if "</body>" in html.lower():
            html = re.sub(
                r'(</body>)',
                f'{pixel_tag}\\1',
                html,
                flags=re.IGNORECASE
            )
        else:
            html += pixel_tag
        
        return html
    
    def rewrite_links_for_tracking(self, html: str, links_mapping: Dict[str, str]) -> str:
        """Réécrit les liens dans le HTML pour le tracking"""
        for original_url, tracked_url in links_mapping.items():
            html = html.replace(f'href="{original_url}"', f'href="{tracked_url}"')
            html = html.replace(f"href='{original_url}'", f"href='{tracked_url}'")
        return html
    
    async def send_email(
        self,
        to: str | List[str],
        subject: str,
        html: str,
        text: Optional[str] = None,
        reply_to: Optional[str] = None,
        tracking_token: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Envoyer un email via Resend.
        
        Args:
            to: Email(s) destinataire(s)
            subject: Sujet de l'email
            html: Contenu HTML
            text: Contenu texte (optionnel)
            reply_to: Email de réponse (optionnel)
            tracking_token: Token de tracking (optionnel, pour injection du pixel)
        """
        if tracking_token:
            html = self.inject_tracking_pixel(html, tracking_token)
        
        if not self.api_key:
            print(f"[EMAIL MOCK] To: {to} | Subject: {subject}")
            return {"id": "mock_email_id", "status": "sent"}
        
        try:
            payload = {
                "from": f"{self.from_name} <{self.from_email}>",
                "to": to if isinstance(to, list) else [to],
                "subject": subject,
                "html": html
            }
            
            if text:
                payload["text"] = text
            if reply_to:
                payload["reply_to"] = reply_to
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/emails",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json=payload
                )
                
                if response.status_code == 200:
                    return response.json()
                else:
                    print(f"Erreur Resend: {response.status_code} - {response.text}")
                    return {"error": response.text}
                    
        except Exception as e:
            print(f"Erreur envoi email: {e}")
            return {"error": str(e)}
    
    async def send_tracked_email(
        self,
        db,  # Session SQLAlchemy
        to: str,
        subject: str,
        html: str,
        tenant_id: str,
        lead_id: Optional[str] = None,
        contact_id: Optional[str] = None,
        campaign_id: Optional[str] = None,
        template_name: Optional[str] = None,
        sent_by: Optional[str] = None,
        text: Optional[str] = None,
        reply_to: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Envoyer un email avec tracking complet.
        Crée automatiquement l'entrée EmailTracking et injecte le pixel.
        
        Args:
            db: Session SQLAlchemy
            to: Email destinataire
            subject: Sujet de l'email
            html: Contenu HTML
            tenant_id: ID du tenant
            lead_id: ID du lead (optionnel)
            contact_id: ID du contact (optionnel)
            campaign_id: ID de campagne (optionnel)
            template_name: Nom du template (optionnel)
            sent_by: ID de l'utilisateur qui envoie (optionnel)
            text: Contenu texte (optionnel)
            reply_to: Email de réponse (optionnel)
        """
        tracking_token = generate_tracking_token()

        result = await self.send_email(
            to=to,
            subject=subject,
            html=html,
            text=text,
            reply_to=reply_to,
            tracking_token=tracking_token
        )

        return {
            **(result if isinstance(result, dict) else {}),
            "tracking_token": tracking_token,
            "tracking_saved": False
        }
    
    async def send_welcome_email(self, to: str, name: str, tenant_slug: str):
        """Email de bienvenue pour nouveau tenant."""
        html = f"""
        <h1>Bienvenue sur SEKA ! 🎉</h1>
        <p>Bonjour {name},</p>
        <p>Votre compte SEKA a été créé avec succès.</p>
        <p>Vous pouvez accéder à votre espace sur :</p>
        <p><strong>https://{tenant_slug}.sekagestion.com</strong></p>
        <p>ou</p>
        <p><strong>https://app.sekagestion.com/{tenant_slug}</strong></p>
        <br>
        <p>Commencez dès maintenant à gérer votre comptabilité avec intelligence !</p>
        <p>L'équipe SEKA</p>
        """
        
        return await self.send_email(
            to=to,
            subject="Bienvenue sur SEKA - Votre espace est prêt",
            html=html
        )
    
    async def send_invoice_email(
        self,
        to: str,
        invoice_number: str,
        amount: float,
        due_date: str,
        pdf_url: Optional[str] = None
    ):
        """Email de notification de facture."""
        html = f"""
        <h2>Nouvelle facture disponible</h2>
        <p>Une nouvelle facture a été générée :</p>
        <ul>
            <li><strong>Numéro :</strong> {invoice_number}</li>
            <li><strong>Montant :</strong> {amount:,.0f} FCFA</li>
            <li><strong>Échéance :</strong> {due_date}</li>
        </ul>
        """
        
        if pdf_url:
            html += f'<p><a href="{pdf_url}">Télécharger la facture (PDF)</a></p>'
        
        html += """
        <br>
        <p>Cordialement,<br>L'équipe SEKA</p>
        """
        
        return await self.send_email(
            to=to,
            subject=f"Facture {invoice_number} disponible",
            html=html
        )
    
    async def send_payment_reminder(
        self,
        to: str,
        invoice_number: str,
        amount: float,
        days_overdue: int
    ):
        """Email de relance de paiement."""
        html = f"""
        <h2>Rappel de paiement</h2>
        <p>La facture <strong>{invoice_number}</strong> est en retard de {days_overdue} jour(s).</p>
        <p><strong>Montant dû :</strong> {amount:,.0f} FCFA</p>
        <p>Merci de régulariser votre situation dans les plus brefs délais.</p>
        <br>
        <p>Cordialement,<br>L'équipe SEKA</p>
        """
        
        return await self.send_email(
            to=to,
            subject=f"Rappel - Facture {invoice_number} en retard",
            html=html
        )


email_service = EmailService()
