"""
Gemini AI Service
Integration with Google's Gemini API for intelligent chat responses
"""
import os
from typing import Optional, List, Dict
import google.generativeai as genai
from datetime import datetime


class GeminiService:
    """Service for interacting with Google Gemini AI"""
    
    def __init__(self):
        """Initialize Gemini with API key from environment"""
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY not found in environment variables")
        
        genai.configure(api_key=api_key)
        
        self.model = genai.GenerativeModel('gemini-2.0-flash')
        
        self.system_context = """
Tu es l'assistant virtuel de SEKA, un ERP/CRM moderne pour les PME africaines.

INFORMATIONS SUR SEKA:

MODULES:
- CRM: Gestion clients, leads, opportunités
- Comptabilité: Journal, bilan, compte de résultat (SYSCOHADA)
- RH: Employés, contrats, bulletins de paie
- Stock: Inventaire, mouvements, alertes
- Trésorerie: Prévisions, cash flow, paiements
- Ventes: Devis, factures, bons de commande
- IA: OCR automatique (Mindee), prévisions, insights

TARIFS:
- Starter: 19,000 FCFA/mois (3 users, 5 clients, 50 docs OCR)
- Business: 65,000 FCFA/mois (15 users, 50 clients, 500 docs OCR)
- Enterprise: Sur mesure (users illimités, support 24/7)

PAIEMENTS:
- Mobile Money (Orange, MTN, Moov, Wave) via KKiaPay
- Carte bancaire via Stripe
- Essai gratuit 14 jours sans CB

SÉCURITÉ:
- Cryptage SSL/TLS
- Serveurs ISO 27001
- Sauvegardes quotidiennes
- 2FA disponible
- Conformité RGPD

CONTACT:
- Support: support@sekagestion.com
- Ventes: sales@sekagestion.com
- Localisation: Cotonou, Bénin

INSTRUCTIONS:
- Réponds en français professionnel mais accessible
- Sois concis et précis
- Utilise des emojis avec modération (📊 💰 ✅)
- Propose toujours une action concrète
- Si tu ne sais pas, redirige vers support@sekagestion.com
- Mets en avant les avantages pour les PME africaines
"""
    
    def generate_response(
        self,
        user_message: str,
        conversation_history: Optional[List[Dict[str, str]]] = None
    ) -> str:
        """
        Generate AI response using Gemini
        
        Args:
            user_message: The user's message
            conversation_history: Optional list of previous messages
                                 [{"role": "user", "content": "..."}, {"role": "assistant", "content": "..."}]
        
        Returns:
            AI-generated response
        """
        try:
            full_prompt = self.system_context + "\n\n"
            
            if conversation_history:
                for msg in conversation_history[-5:]:  # Last 5 messages for context
                    role = "Utilisateur" if msg["role"] == "user" else "Assistant"
                    full_prompt += f"{role}: {msg['content']}\n"
            
            full_prompt += f"\nUtilisateur: {user_message}\nAssistant:"
            
            response = self.model.generate_content(full_prompt)
            
            return response.text.strip()
            
        except Exception as e:
            print(f"Gemini API Error: {str(e)}")
            return self._get_fallback_response(user_message)
    
    def _get_fallback_response(self, user_message: str) -> str:
        """Fallback response if Gemini fails"""
        return (
            "Je suis désolé, je rencontre un problème technique temporaire. 😔\n\n"
            "Pour une assistance immédiate, contactez-nous à:\n"
            "📧 support@sekagestion.com\n\n"
            "Nous répondons généralement sous 2-4 heures."
        )
    
    async def generate_response_async(
        self,
        user_message: str,
        conversation_history: Optional[List[Dict[str, str]]] = None
    ) -> str:
        """Async version of generate_response"""
        return self.generate_response(user_message, conversation_history)


_gemini_service: Optional[GeminiService] = None


def get_gemini_service() -> GeminiService:
    """Get or create Gemini service instance"""
    global _gemini_service
    if _gemini_service is None:
        _gemini_service = GeminiService()
    return _gemini_service
