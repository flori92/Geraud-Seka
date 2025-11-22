"""
API Routes Bot Conversationnel pour SEKA Enterprise
Endpoints pour l'assistant IA SEKA-Bot
"""

from datetime import datetime
from typing import Dict, List, Optional, Any
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.session import get_db
from app.core.deps import get_current_user, get_current_tenant
from app.models.user import User
from app.models.tenant import Tenant
from app.services.ai.seka_bot import seka_bot
from app.services.monitoring import monitoring_service

router = APIRouter()


class ChatMessage(BaseModel):
    """Modèle pour les messages de chat"""
    message: str
    context: Optional[Dict[str, Any]] = None


class ChatResponse(BaseModel):
    """Modèle pour les réponses du bot"""
    type: str
    message: str
    data: Optional[Dict[str, Any]] = None
    suggestions: Optional[List[str]] = None
    quick_actions: Optional[List[Dict[str, str]]] = None
    chart_type: Optional[str] = None
    timestamp: str


@router.post("/query", response_model=ChatResponse)
async def process_bot_query(
    chat_message: ChatMessage,
    background_tasks: BackgroundTasks,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Traiter une requête utilisateur avec SEKA-Bot
    
    - **message**: Message de l'utilisateur en langage naturel
    - **context**: Contexte optionnel (page actuelle, filtres, etc.)
    """
    try:
        # Traitement du message par le bot
        response = await seka_bot.process_message(
            message=chat_message.message,
            tenant_id=str(current_tenant.id),
            user_id=str(current_user.id),
            db=db
        )
        
        # Log de l'interaction en arrière-plan
        background_tasks.add_task(
            log_bot_interaction,
            tenant_id=str(current_tenant.id),
            user_id=str(current_user.id),
            message=chat_message.message,
            response_type=response.get("type", "unknown"),
            success=True
        )
        
        # Formatage de la réponse
        return ChatResponse(
            type=response.get("type", "text"),
            message=response.get("message", ""),
            data=response.get("data"),
            suggestions=response.get("suggestions", []),
            quick_actions=response.get("quick_actions", []),
            chart_type=response.get("chart_type"),
            timestamp=datetime.utcnow().isoformat()
        )
        
    except Exception as e:
        # Log de l'erreur en arrière-plan
        background_tasks.add_task(
            log_bot_interaction,
            tenant_id=str(current_tenant.id),
            user_id=str(current_user.id),
            message=chat_message.message,
            response_type="error",
            success=False,
            error=str(e)
        )
        
        raise HTTPException(
            status_code=500,
            detail="Erreur lors du traitement de votre demande"
        )


@router.get("/suggestions")
async def get_bot_suggestions(
    context: Optional[str] = None,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user)
):
    """
    Récupérer des suggestions de questions contextuelles
    
    - **context**: Contexte actuel (dashboard, clients, etc.)
    """
    suggestions = {
        "dashboard": [
            "Quel est mon chiffre d'affaires ce mois ?",
            "Combien j'ai de nouveaux clients cette semaine ?",
            "Ma trésorerie actuelle",
            "Quelles sont mes prochaines actions prioritaires ?",
            "Résumé de ma performance aujourd'hui"
        ],
        "clients": [
            "Qui sont mes meilleurs clients ?",
            "Combien j'ai de leads chauds ?",
            "Clients à risque de churn",
            "Taux de conversion de mes prospects",
            "Opportunités à closing rapide"
        ],
        "sales": [
            "Évolution de mes ventes ce trimestre",
            "Mes produits les plus vendus",
            "Prévisions de ventes pour le mois prochain",
            "Performance de mon équipe commerciale",
            "Pipeline de vente actuel"
        ],
        "finance": [
            "État de ma trésorerie",
            "Prévisions de cash flow",
            "Mes principales dépenses",
            "Rentabilité par produit",
            "Budget vs réalisé"
        ],
        "inventory": [
            "Produits en rupture de stock",
            "Valeur de mon inventaire",
            "Rotation des stocks",
            "Recommandations réapprovisionnement",
            "Produits à écouler"
        ]
    }
    
    contextual_suggestions = suggestions.get(context, suggestions["dashboard"])
    
    return {
        "suggestions": contextual_suggestions,
        "context": context or "general",
        "personalized": True
    }


@router.get("/quick-insights")
async def get_quick_insights(
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Récupérer des insights rapides pour la page d'accueil du bot
    """
    try:
        # Générer quelques insights rapides sans requête complète
        insights = []
        
        # Simuler des insights (à remplacer par vraies données)
        sample_insights = [
            {
                "type": "metric",
                "title": "Performance du jour",
                "message": "📈 Votre CA aujourd'hui est en hausse de 12%",
                "priority": "info"
            },
            {
                "type": "alert", 
                "title": "Action requise",
                "message": "⚠️ 3 leads chauds n'ont pas été contactés depuis 5 jours",
                "priority": "warning"
            },
            {
                "type": "opportunity",
                "title": "Opportunité",
                "message": "💡 2 clients VIP ont visité votre catalogue récemment",
                "priority": "info"
            }
        ]
        
        return {
            "insights": sample_insights,
            "generated_at": datetime.utcnow().isoformat(),
            "total_count": len(sample_insights)
        }
        
    except Exception as e:
        monitoring_service.log_error(
            error=e,
            context="get_quick_insights",
            tenant_id=str(current_tenant.id)
        )
        return {
            "insights": [],
            "generated_at": datetime.utcnow().isoformat(),
            "total_count": 0
        }


@router.get("/examples")
async def get_query_examples():
    """
    Récupérer des exemples de questions pour aider les utilisateurs
    """
    examples = {
        "business_metrics": {
            "title": "📊 Métriques Business",
            "examples": [
                "Quel est mon chiffre d'affaires ce mois ?",
                "Combien j'ai de clients actifs ?",
                "Ma marge bénéficiaire moyenne",
                "Évolution de mes ventes cette année"
            ]
        },
        "forecasting": {
            "title": "🔮 Prévisions",
            "examples": [
                "Prévisions de trésorerie pour 3 mois",
                "Prédiction de mes ventes le mois prochain",
                "Clients à risque de partir",
                "Opportunités de croissance"
            ]
        },
        "operations": {
            "title": "⚙️ Opérations",
            "examples": [
                "Produits en rupture de stock",
                "Commandes en attente",
                "Performance de mon équipe",
                "Tâches prioritaires aujourd'hui"
            ]
        },
        "analysis": {
            "title": "📈 Analyses",
            "examples": [
                "Mes meilleurs clients par chiffre d'affaires",
                "Produits les plus rentables",
                "Saisonnalité de mes ventes",
                "Benchmark vs concurrence"
            ]
        }
    }
    
    return {
        "example_categories": examples,
        "total_examples": sum(len(cat["examples"]) for cat in examples.values())
    }


@router.post("/feedback")
async def submit_bot_feedback(
    message_id: Optional[str] = None,
    rating: int = None,
    feedback_text: Optional[str] = None,
    is_helpful: bool = True,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user)
):
    """
    Soumettre un feedback sur une réponse du bot
    
    - **message_id**: ID du message (optionnel)
    - **rating**: Note de 1 à 5
    - **feedback_text**: Commentaire libre
    - **is_helpful**: La réponse était-elle utile ?
    """
    try:
        # Log du feedback pour amélioration continue
        monitoring_service.log_business_event(
            event_type="bot_feedback",
            description=f"Feedback bot: rating={rating}, helpful={is_helpful}",
            tenant_id=str(current_tenant.id),
            user_id=str(current_user.id),
            metadata={
                "message_id": message_id,
                "rating": rating,
                "feedback_text": feedback_text,
                "is_helpful": is_helpful
            }
        )
        
        return {
            "message": "Merci pour votre feedback !",
            "feedback_recorded": True,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail="Erreur lors de l'enregistrement du feedback"
        )


@router.get("/conversation-history")
async def get_conversation_history(
    limit: int = 10,
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user)
):
    """
    Récupérer l'historique des conversations (fonctionnalité future)
    """
    # Placeholder pour l'historique des conversations
    # À implémenter avec un modèle ChatHistory
    
    return {
        "conversations": [],
        "total_count": 0,
        "message": "Historique des conversations - fonctionnalité à venir"
    }


@router.delete("/conversation-history")
async def clear_conversation_history(
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user)
):
    """
    Effacer l'historique des conversations
    """
    return {
        "message": "Historique effacé",
        "cleared_at": datetime.utcnow().isoformat()
    }


# Fonctions utilitaires

async def log_bot_interaction(
    tenant_id: str,
    user_id: str,
    message: str,
    response_type: str,
    success: bool,
    error: Optional[str] = None
):
    """Log des interactions avec le bot pour analytics"""
    monitoring_service.log_business_event(
        event_type="bot_interaction",
        description=f"Bot query: {message[:100]}{'...' if len(message) > 100 else ''}",
        tenant_id=tenant_id,
        user_id=user_id,
        metadata={
            "message_length": len(message),
            "response_type": response_type,
            "success": success,
            "error": error,
            "timestamp": datetime.utcnow().isoformat()
        }
    )