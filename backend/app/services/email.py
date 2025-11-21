"""Service d'envoi d'emails avec Resend."""
from typing import List, Optional, Dict, Any
import httpx

from app.core.config import get_settings

settings = get_settings()


class EmailService:
    """Service d'envoi d'emails via Resend."""
    
    def __init__(self):
        self.api_key = settings.resend_api_key
        self.from_email = settings.resend_from_email
        self.from_name = settings.resend_from_name
        self.base_url = "https://api.resend.com"
    
    async def send_email(
        self,
        to: str | List[str],
        subject: str,
        html: str,
        text: Optional[str] = None,
        reply_to: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Envoyer un email via Resend.
        
        Args:
            to: Email(s) destinataire(s)
            subject: Sujet de l'email
            html: Contenu HTML
            text: Contenu texte (optionnel)
            reply_to: Email de réponse (optionnel)
        """
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


# Instance singleton
email_service = EmailService()
