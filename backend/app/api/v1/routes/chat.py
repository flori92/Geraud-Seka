"""
Simple Chat API for SEKA Chatbot Widget
Simplified endpoint for the frontend chatbot widget
"""

from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.session import get_db
from app.core.deps import get_current_user_optional, get_current_tenant_optional
from app.models.user import User
from app.models.tenant import Tenant

router = APIRouter()


class ChatMessageRequest(BaseModel):
    """Simple chat message request"""
    message: str


class ChatMessageResponse(BaseModel):
    """Simple chat message response"""
    response: str
    timestamp: str


@router.post("/message", response_model=ChatMessageResponse)
async def send_chat_message(
    request: ChatMessageRequest,
    current_user: Optional[User] = Depends(get_current_user_optional),
    current_tenant: Optional[Tenant] = Depends(get_current_tenant_optional),
    db: Session = Depends(get_db)
):
    """
    Send a message to the SEKA chatbot

    This is a simplified endpoint for the chatbot widget.
    Works for both authenticated and anonymous users.
    """
    user_message = request.message.lower().strip()

    # Simple rule-based responses for common questions
    # TODO: Replace with actual AI/LLM integration (OpenAI, etc.)

    if any(word in user_message for word in ["bonjour", "salut", "hello", "hi"]):
        response = "Bonjour ! Je suis l'assistant SEKA. Je peux vous aider avec :\n\n" \
                  "• Questions sur les fonctionnalités SEKA\n" \
                  "• Aide à la navigation\n" \
                  "• Tarification et plans\n" \
                  "• Support technique\n\n" \
                  "Comment puis-je vous aider ?"

    elif any(word in user_message for word in ["prix", "tarif", "coût", "combien"]):
        response = "SEKA propose 3 plans tarifaires :\n\n" \
                  "**Starter** - 19,000 FCFA/mois\n" \
                  "• Jusqu'à 3 utilisateurs\n" \
                  "• 5 clients maximum\n" \
                  "• 50 documents OCR/mois\n\n" \
                  "**Business** - 65,000 FCFA/mois\n" \
                  "• Jusqu'à 15 utilisateurs\n" \
                  "• 50 clients maximum\n" \
                  "• 500 documents OCR/mois\n\n" \
                  "**Enterprise** - Sur mesure\n" \
                  "• Utilisateurs illimités\n" \
                  "• Support 24/7\n\n" \
                  "Voulez-vous démarrer un essai gratuit ?"

    elif any(word in user_message for word in ["essai", "gratuit", "demo", "test"]):
        response = "Excellent ! Vous pouvez démarrer un essai gratuit de 14 jours sans carte bancaire.\n\n" \
                  "Cliquez sur 'Essai Gratuit' en haut de page ou visitez /register pour créer votre compte.\n\n" \
                  "Durant l'essai, vous aurez accès à toutes les fonctionnalités du plan Business !"

    elif any(word in user_message for word in ["fonctionnalité", "feature", "module", "quoi"]):
        response = "SEKA est un ERP complet avec les modules suivants :\n\n" \
                  "📊 **CRM** - Gestion clients, leads, opportunités\n" \
                  "💰 **Comptabilité** - Journal, bilan, compte de résultat\n" \
                  "👥 **RH** - Employés, contrats, bulletins de paie\n" \
                  "📦 **Stock** - Inventaire, mouvements, alertes\n" \
                  "💳 **Trésorerie** - Prévisions, cash flow, paiements\n" \
                  "📈 **Ventes** - Devis, factures, bons de commande\n" \
                  "🤖 **IA** - OCR automatique, prévisions, insights\n\n" \
                  "Quelle fonctionnalité vous intéresse particulièrement ?"

    elif any(word in user_message for word in ["ocr", "scan", "document"]):
        response = "L'OCR (reconnaissance optique de caractères) de SEKA permet de :\n\n" \
                  "✅ Scanner automatiquement vos factures et reçus\n" \
                  "✅ Extraire les données importantes (montant, date, fournisseur)\n" \
                  "✅ Créer automatiquement les écritures comptables\n" \
                  "✅ Économiser jusqu'à 80% du temps de saisie\n\n" \
                  "Propulsé par Mindee, notre OCR reconnaît les documents en français, anglais et portugais."

    elif any(word in user_message for word in ["mobile money", "kkiapay", "paiement"]):
        response = "SEKA supporte le Mobile Money pour l'Afrique ! 📱\n\n" \
                  "Nous acceptons :\n" \
                  "• Orange Money\n" \
                  "• MTN Mobile Money\n" \
                  "• Moov Money\n" \
                  "• Wave\n\n" \
                  "Via notre partenaire KKiaPay, les paiements sont instantanés et sécurisés.\n" \
                  "Vous pouvez aussi payer par carte bancaire (Stripe)."

    elif any(word in user_message for word in ["support", "aide", "help", "problème"]):
        response = "Pour obtenir de l'aide :\n\n" \
                  "📧 **Email**: support@sekagestion.com\n" \
                  "📖 **Documentation**: /docs\n" \
                  "❓ **FAQ**: /faq\n\n" \
                  "Temps de réponse moyen : 2-4 heures (jours ouvrables)\n" \
                  "Support prioritaire disponible pour les plans Business et Enterprise."

    elif any(word in user_message for word in ["sécurité", "security", "donnée", "gdpr", "rgpd"]):
        response = "La sécurité est notre priorité ! 🔒\n\n" \
                  "✅ Cryptage SSL/TLS pour toutes les données\n" \
                  "✅ Serveurs certifiés ISO 27001\n" \
                  "✅ Sauvegardes quotidiennes automatiques\n" \
                  "✅ Authentification à deux facteurs (2FA)\n" \
                  "✅ Conformité RGPD\n\n" \
                  "Vos données sont hébergées en Europe et ne sont jamais vendues à des tiers."

    elif any(word in user_message for word in ["contact", "email", "téléphone"]):
        response = "Vous pouvez nous contacter via :\n\n" \
                  "📧 support@sekagestion.com\n" \
                  "📧 sales@sekagestion.com (ventes)\n" \
                  "📧 privacy@sekagestion.com (données personnelles)\n\n" \
                  "📍 Adresse : SEKA, Cotonou, Bénin\n\n" \
                  "Nous répondons généralement sous 24h !"

    elif any(word in user_message for word in ["merci", "thank"]):
        response = "Je vous en prie ! N'hésitez pas si vous avez d'autres questions. 😊\n\n" \
                  "Je suis là pour vous aider à découvrir SEKA et à optimiser la gestion de votre entreprise !"

    else:
        # Default response for unrecognized questions
        response = "Je comprends que vous avez une question sur SEKA. Voici quelques sujets sur lesquels je peux vous aider :\n\n" \
                  "• Tarifs et plans d'abonnement\n" \
                  "• Fonctionnalités et modules\n" \
                  "• Essai gratuit\n" \
                  "• Mobile Money et paiements\n" \
                  "• Support et documentation\n\n" \
                  "Pouvez-vous reformuler votre question ou choisir un de ces sujets ?\n\n" \
                  "Pour un support personnalisé, contactez-nous à support@sekagestion.com"

    return ChatMessageResponse(
        response=response,
        timestamp=datetime.utcnow().isoformat()
    )


@router.get("/status")
async def get_chat_status():
    """Check if chat service is available"""
    return {
        "status": "online",
        "message": "SEKA Chatbot is ready to help!",
        "version": "1.0",
        "features": ["rule-based", "multilingual"],
        "timestamp": datetime.utcnow().isoformat()
    }
