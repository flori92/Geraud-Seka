"""
Gemini AI Service
Integration with Google's Gemini API for intelligent chat responses
Avec fallback vers Groq (Llama) en cas de quota dépassé
"""
import os
import httpx
from typing import Optional, List, Dict
import google.generativeai as genai
from datetime import datetime


class GeminiService:
    """Service for interacting with Google Gemini AI with Groq fallback"""
    
    def __init__(self):
        """Initialize Gemini with API key from environment"""
        self.gemini_api_key = os.getenv("GEMINI_API_KEY")
        self.groq_api_key = os.getenv("GROQ_API_KEY")
        
        if not self.gemini_api_key:
            print("⚠️ GEMINI_API_KEY non trouvée - utilisation de Groq uniquement")
        else:
            genai.configure(api_key=self.gemini_api_key)
            # Initialiser le modèle Gemini
            self.model = genai.GenerativeModel('gemini-1.5-flash')
        
        if not self.groq_api_key:
            print("⚠️ GROQ_API_KEY non trouvée - pas de fallback disponible")
        
        self.use_groq_fallback = False  # Flag pour basculer vers Groq après quota exceeded
        
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
    
    def _build_prompt(
        self,
        user_message: str,
        conversation_history: Optional[List[Dict[str, str]]] = None
    ) -> str:
        """Build the full prompt with context and history"""
        full_prompt = self.system_context + "\n\n"
        
        if conversation_history:
            for msg in conversation_history[-5:]:  # Last 5 messages for context
                role = "Utilisateur" if msg["role"] == "user" else "Assistant"
                full_prompt += f"{role}: {msg['content']}\n"
        
        full_prompt += f"\nUtilisateur: {user_message}\nAssistant:"
        return full_prompt
    
    def _call_groq(self, prompt: str) -> str:
        """Call Groq API (Llama) as fallback"""
        if not self.groq_api_key:
            raise ValueError("GROQ_API_KEY non configurée")
        
        with httpx.Client(timeout=30.0) as client:
            response = client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.groq_api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "llama-3.1-8b-instant",
                    "messages": [
                        {"role": "system", "content": self.system_context},
                        {"role": "user", "content": prompt}
                    ],
                    "max_tokens": 1024,
                    "temperature": 0.7
                }
            )
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"].strip()
    
    def generate_response(
        self,
        user_message: str,
        conversation_history: Optional[List[Dict[str, str]]] = None
    ) -> str:
        """
        Generate AI response using Gemini with Groq fallback
        
        Args:
            user_message: The user's message
            conversation_history: Optional list of previous messages
                                 [{"role": "user", "content": "..."}, {"role": "assistant", "content": "..."}]
        
        Returns:
            AI-generated response
        """
        full_prompt = self._build_prompt(user_message, conversation_history)
        
        # Si Groq est activé en fallback (après quota exceeded)
        if self.use_groq_fallback and self.groq_api_key:
            try:
                print("🔄 Utilisation de Groq (Llama) - Gemini quota exceeded")
                return self._call_groq(user_message)
            except Exception as e:
                print(f"Groq API Error: {str(e)}")
                return self._get_fallback_response(user_message)
        
        # Essayer Gemini d'abord
        if self.gemini_api_key and hasattr(self, 'model'):
            try:
                response = self.model.generate_content(full_prompt)
                return response.text.strip()
                
            except Exception as e:
                error_str = str(e)
                print(f"Gemini API Error: {error_str}")
                
                # Détecter erreur de quota (429)
                if "429" in error_str or "quota" in error_str.lower() or "exceeded" in error_str.lower():
                    print("⚠️ Quota Gemini dépassé - basculement vers Groq")
                    self.use_groq_fallback = True
                    
                    # Réessayer avec Groq
                    if self.groq_api_key:
                        try:
                            return self._call_groq(user_message)
                        except Exception as groq_error:
                            print(f"Groq API Error: {str(groq_error)}")
                
                return self._get_fallback_response(user_message)
        
        # Si pas de Gemini, essayer Groq directement
        if self.groq_api_key:
            try:
                return self._call_groq(user_message)
            except Exception as e:
                print(f"Groq API Error: {str(e)}")
        
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
