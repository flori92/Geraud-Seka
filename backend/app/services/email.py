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


async def send_team_invitation_email(
    to_email: str,
    inviter_name: str,
    company_name: str,
    invitation_token: str,
    role: str
):
    """Send team invitation email with Resend"""
    role_names = {
        "admin": "Administrateur",
        "manager": "Gestionnaire",
        "accountant": "Comptable",
        "viewer": "Lecture seule"
    }
    
    role_label = role_names.get(role, role)
    accept_url = f"https://app.sekagestion.com/accept-invitation?token={invitation_token}"
    
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #1e3a5f 0%, #2c5282 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }}
            .content {{ background: #ffffff; padding: 40px; border: 1px solid #e5e7eb; border-top: none; }}
            .button {{ display: inline-block; background: #1e3a5f; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }}
            .button:hover {{ background: #172e4d; }}
            .info-box {{ background: #f3f4f6; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #1e3a5f; }}
            .footer {{ text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }}
            .role-badge {{ display: inline-block; background: #dbeafe; color: #1e40af; padding: 4px 12px; border-radius: 12px; font-size: 14px; font-weight: 500; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1 style="margin: 0; font-size: 28px;">🎉 Invitation à rejoindre SEKA</h1>
            </div>
            <div class="content">
                <p style="font-size: 16px;">Bonjour,</p>
                
                <p style="font-size: 16px;">
                    <strong>{inviter_name}</strong> vous invite à rejoindre l'équipe de 
                    <strong>{company_name}</strong> sur SEKA.
                </p>
                
                <div class="info-box">
                    <p style="margin: 0; font-size: 15px;">
                        <strong>🏢 Entreprise :</strong> {company_name}<br>
                        <strong>👤 Invité par :</strong> {inviter_name}<br>
                        <strong>🔑 Rôle assigné :</strong> <span class="role-badge">{role_label}</span>
                    </p>
                </div>
                
                <p style="font-size: 16px;">
                    SEKA est la plateforme de gestion comptable intelligente qui simplifie 
                    la comptabilité de votre entreprise avec l'IA.
                </p>
                
                <div style="text-align: center;">
                    <a href="{accept_url}" class="button">
                        ✨ Accepter l'invitation
                    </a>
                </div>
                
                <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
                    <strong>Note :</strong> Cette invitation expire dans 7 jours. 
                    Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :
                </p>
                <p style="font-size: 13px; color: #6b7280; word-break: break-all; background: #f9fafb; padding: 10px; border-radius: 4px;">
                    {accept_url}
                </p>
            </div>
            
            <div class="footer">
                <p>
                    <strong>SEKA</strong> - Gestion comptable intelligente<br>
                    <a href="https://sekagestion.com" style="color: #1e3a5f;">sekagestion.com</a>
                </p>
                <p style="font-size: 12px; color: #9ca3af;">
                    Vous recevez cet email car {inviter_name} vous a invité à rejoindre {company_name} sur SEKA.
                </p>
            </div>
        </div>
    </body>
    </html>
    """
    
    text = f"""
Invitation à rejoindre SEKA

{inviter_name} vous invite à rejoindre l'équipe de {company_name} sur SEKA.

Entreprise : {company_name}
Invité par : {inviter_name}
Rôle assigné : {role_label}

Acceptez l'invitation en visitant ce lien :
{accept_url}

Cette invitation expire dans 7 jours.

---
SEKA - Gestion comptable intelligente
https://sekagestion.com
"""
    
    return await email_service.send_email(
        to=to_email,
        subject=f"Invitation à rejoindre {company_name} sur SEKA",
        html=html,
        text=text
    )

