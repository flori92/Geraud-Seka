"""
SEKA-Bot - Assistant IA Conversationnel pour SEKA Enterprise
Traitement du langage naturel et génération de réponses intelligentes
"""

import re
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, desc

from app.models.sales_invoice import SalesInvoice
from app.models.client import Client
from app.models.product import Product
from app.models.crm import Lead, Opportunity
from app.models.accounting import AccountingEntry
from app.services.analytics import analytics_service
from app.services.crm import crm_service
from app.services.ai.forecasting import forecasting_service
from app.services.monitoring import monitoring_service


class SekaBot:
    """Assistant IA conversationnel pour SEKA"""
    
    def __init__(self):
        self.monitoring = monitoring_service
        
        # Patterns de reconnaissance d'intention
        self.intent_patterns = {
            'revenue_query': [
                r'chiffre.*affaires?',
                r'c[ah]',
                r'revenus?',
                r'ventes?',
                r'factur(ation|es?)'
            ],
            'client_query': [
                r'clients?',
                r'customers?',
                r'prospects?',
                r'leads?'
            ],
            'cash_flow_query': [
                r'tr[eé]sorerie',
                r'cash.?flow',
                r'liquidit[eé]s?',
                r'banque',
                r'compte'
            ],
            'inventory_query': [
                r'stocks?',
                r'inventaires?',
                r'produits?',
                r'articles?'
            ],
            'forecast_query': [
                r'pr[eé]vision',
                r'forecast',
                r'futur',
                r'prochain',
                r'pr[eé]dire'
            ],
            'help_query': [
                r'aide',
                r'help',
                r'comment',
                r'que.*faire',
                r'assistance'
            ],
            'greeting': [
                r'bonjour',
                r'salut',
                r'hello',
                r'bonsoir'
            ]
        }
        
        # Mots-clés temporels
        self.time_patterns = {
            'today': ['aujourd\'hui', 'ce jour'],
            'week': ['semaine', 'hebdo'],
            'month': ['mois', 'mensuel'],
            'quarter': ['trimestre', 'trimestriel'],
            'year': ['ann[eé]e', 'annuel']
        }
    
    async def process_message(self, message: str, tenant_id: str, user_id: str, db: Session) -> Dict[str, Any]:
        """
        Traite un message utilisateur et génère une réponse intelligente
        
        Args:
            message: Message de l'utilisateur
            tenant_id: ID du tenant
            user_id: ID de l'utilisateur
            db: Session de base de données
            
        Returns:
            Réponse formatée avec données et visualisations
        """
        try:
            # Nettoyage et préparation du message
            clean_message = self._clean_message(message)
            
            # Détection d'intention
            intent = self._detect_intent(clean_message)
            
            # Extraction des paramètres temporels
            time_period = self._extract_time_period(clean_message)
            
            # Log de l'interaction
            self.monitoring.log_business_event(
                event_type="bot_query",
                description=f"Query: {message[:100]}... Intent: {intent}",
                tenant_id=tenant_id,
                user_id=user_id,
                metadata={
                    "intent": intent,
                    "time_period": time_period,
                    "message_length": len(message)
                }
            )
            
            # Génération de réponse basée sur l'intention
            response = await self._generate_response(intent, time_period, tenant_id, user_id, db, clean_message)
            
            return response
            
        except Exception as e:
            self.monitoring.log_error(
                error=e,
                context="process_message",
                tenant_id=tenant_id,
                user_id=user_id,
                extra_data={"message": message}
            )
            
            return {
                "type": "error",
                "message": "Désolé, je n'ai pas pu traiter votre demande. Pouvez-vous la reformuler ?",
                "suggestions": [
                    "Quel est mon chiffre d'affaires ce mois ?",
                    "Combien j'ai de nouveaux clients ?",
                    "Quelle est ma trésorerie actuelle ?"
                ]
            }
    
    async def _generate_response(self, intent: str, time_period: str, tenant_id: str, user_id: str, db: Session, message: str) -> Dict[str, Any]:
        """Génère une réponse basée sur l'intention détectée"""
        
        if intent == 'greeting':
            return await self._handle_greeting(tenant_id, user_id, db)
        
        elif intent == 'revenue_query':
            return await self._handle_revenue_query(time_period, tenant_id, db)
        
        elif intent == 'client_query':
            return await self._handle_client_query(time_period, tenant_id, db)
        
        elif intent == 'cash_flow_query':
            return await self._handle_cash_flow_query(time_period, tenant_id, db)
        
        elif intent == 'inventory_query':
            return await self._handle_inventory_query(tenant_id, db)
        
        elif intent == 'forecast_query':
            return await self._handle_forecast_query(time_period, tenant_id, db)
        
        elif intent == 'help_query':
            return await self._handle_help_query()
        
        else:
            return await self._handle_unknown_query(message, tenant_id, db)
    
    async def _handle_greeting(self, tenant_id: str, user_id: str, db: Session) -> Dict[str, Any]:
        """Gestion des salutations avec résumé personnalisé"""
        try:
            # Récupérer quelques métriques rapides pour personnaliser
            today_revenue = await self._get_today_revenue(tenant_id, db)
            pending_tasks = await self._get_pending_tasks(user_id, db)
            
            greeting_messages = [
                f"Bonjour ! 👋 Votre chiffre d'affaires aujourd'hui est de {self._format_currency(today_revenue)}.",
                f"Salut ! Je suis là pour vous aider à analyser votre business. Vous avez {pending_tasks} tâches en attente.",
                "Hello ! Comment puis-je vous aider avec SEKA aujourd'hui ?"
            ]
            
            # Choisir le message selon les données disponibles
            if today_revenue > 0:
                message = greeting_messages[0]
            elif pending_tasks > 0:
                message = greeting_messages[1]
            else:
                message = greeting_messages[2]
            
            return {
                "type": "text",
                "message": message,
                "quick_actions": [
                    {
                        "title": "📊 Résumé du jour",
                        "query": "Résumé de ma journée"
                    },
                    {
                        "title": "💰 Chiffre d'affaires",
                        "query": "Quel est mon CA ce mois ?"
                    },
                    {
                        "title": "👥 Nouveaux clients",
                        "query": "Combien de nouveaux clients cette semaine ?"
                    },
                    {
                        "title": "📈 Prévisions",
                        "query": "Prévisions de trésorerie"
                    }
                ]
            }
            
        except Exception as e:
            return {
                "type": "text",
                "message": "Bonjour ! Comment puis-je vous aider avec SEKA aujourd'hui ?",
                "quick_actions": []
            }
    
    async def _handle_revenue_query(self, time_period: str, tenant_id: str, db: Session) -> Dict[str, Any]:
        """Gestion des requêtes sur le chiffre d'affaires"""
        try:
            # Récupérer les métriques via le service analytics
            metrics = await analytics_service.calculate_real_time_metrics(tenant_id, time_period)
            
            revenue_data = metrics.get('total_revenue', {})
            current_revenue = revenue_data.get('value', 0)
            previous_revenue = revenue_data.get('previous_value', 0)
            
            # Calcul de la variation
            if previous_revenue > 0:
                change_percent = ((current_revenue - previous_revenue) / previous_revenue) * 100
                trend = "hausse" if change_percent > 0 else "baisse"
                trend_emoji = "📈" if change_percent > 0 else "📉"
            else:
                change_percent = 0
                trend = "stable"
                trend_emoji = "📊"
            
            # Construction de la réponse
            period_label = self._get_period_label(time_period)
            message = f"💰 Votre chiffre d'affaires {period_label} est de **{self._format_currency(current_revenue)}**"
            
            if abs(change_percent) > 0.1:  # Si variation significative
                message += f"\n\n{trend_emoji} {trend.capitalize()} de {abs(change_percent):.1f}% par rapport à la période précédente"
            
            # Analyse contextuelle
            insights = []
            if change_percent > 20:
                insights.append("🎉 Excellente performance ! Votre croissance est remarquable.")
            elif change_percent < -10:
                insights.append("⚠️ Attention à la baisse. Analysez les causes et renforcez vos actions commerciales.")
            elif 5 <= change_percent <= 20:
                insights.append("✅ Bonne croissance. Continuez sur cette lancée !")
            
            return {
                "type": "metric_with_chart",
                "message": message,
                "data": {
                    "current_value": current_revenue,
                    "previous_value": previous_revenue,
                    "change_percent": change_percent,
                    "currency": "XOF",
                    "period": time_period
                },
                "insights": insights,
                "chart_type": "line",
                "suggested_actions": await self._get_revenue_suggestions(change_percent, current_revenue)
            }
            
        except Exception as e:
            return {
                "type": "error",
                "message": "Je n'ai pas pu récupérer les données de chiffre d'affaires. Vérifiez vos données de ventes."
            }
    
    async def _handle_client_query(self, time_period: str, tenant_id: str, db: Session) -> Dict[str, Any]:
        """Gestion des requêtes sur les clients"""
        try:
            # Récupérer les métriques clients
            metrics = await analytics_service.calculate_real_time_metrics(tenant_id, time_period)
            
            active_clients = metrics.get('active_customers', {}).get('value', 0)
            new_clients = metrics.get('new_customers', {}).get('value', 0)
            total_clients = metrics.get('total_customers', {}).get('value', 0)
            
            # Message principal
            period_label = self._get_period_label(time_period)
            
            if time_period in ['day', 'week', 'month']:
                message = f"👥 {period_label.capitalize()}, vous avez :\n"
                message += f"• **{new_clients}** nouveaux clients\n"
                message += f"• **{active_clients}** clients actifs\n"
                message += f"• **{total_clients}** clients au total"
            else:
                message = f"👥 Vous avez **{total_clients}** clients au total"
            
            # Données CRM si disponibles
            crm_data = None
            try:
                hot_leads = await self._get_hot_leads_count(tenant_id, db)
                if hot_leads > 0:
                    message += f"\n\n🔥 **{hot_leads}** leads chauds à convertir rapidement"
                    crm_data = {"hot_leads": hot_leads}
            except:
                pass
            
            # Recommandations
            suggestions = []
            if new_clients == 0:
                suggestions.append("Lancez une campagne d'acquisition de nouveaux clients")
            elif new_clients > 0:
                suggestions.append(f"Contactez vos {new_clients} nouveaux clients pour un suivi personnalisé")
            
            return {
                "type": "metric_summary",
                "message": message,
                "data": {
                    "active_clients": active_clients,
                    "new_clients": new_clients,
                    "total_clients": total_clients,
                    "crm_data": crm_data
                },
                "suggestions": suggestions,
                "quick_actions": [
                    {"title": "📞 Voir leads chauds", "query": "Montre-moi mes leads chauds"},
                    {"title": "📈 Analyse conversion", "query": "Taux de conversion des leads"},
                    {"title": "👑 Top clients", "query": "Mes meilleurs clients"}
                ]
            }
            
        except Exception as e:
            return {
                "type": "error",
                "message": "Je n'ai pas pu récupérer les données clients."
            }
    
    async def _handle_cash_flow_query(self, time_period: str, tenant_id: str, db: Session) -> Dict[str, Any]:
        """Gestion des requêtes sur la trésorerie"""
        try:
            # Récupérer métriques trésorerie
            metrics = await analytics_service.calculate_real_time_metrics(tenant_id, time_period)
            
            cash_in = metrics.get('cash_inflow', {}).get('value', 0)
            cash_out = metrics.get('cash_outflow', {}).get('value', 0)
            net_cash_flow = metrics.get('net_cash_flow', {}).get('value', 0)
            
            # Message principal
            period_label = self._get_period_label(time_period)
            message = f"💳 Trésorerie {period_label} :\n"
            message += f"• **Entrées** : {self._format_currency(cash_in)}\n"
            message += f"• **Sorties** : {self._format_currency(cash_out)}\n"
            
            # Flux net avec indicateur visuel
            if net_cash_flow > 0:
                message += f"• **Flux net** : +{self._format_currency(net_cash_flow)} 💚"
                health_status = "positive"
            elif net_cash_flow < 0:
                message += f"• **Flux net** : {self._format_currency(net_cash_flow)} ⚠️"
                health_status = "negative"
            else:
                message += f"• **Flux net** : {self._format_currency(net_cash_flow)} ⚖️"
                health_status = "neutral"
            
            # Prédictions si demandées
            forecast_data = None
            if 'prév' in message.lower() or 'futur' in message.lower():
                try:
                    forecast = await forecasting_service.predict_cash_flow(tenant_id, 3)
                    forecast_data = forecast.get('predictions', [])
                    if forecast_data:
                        message += f"\n\n🔮 **Prévision 3 mois** : tendance {forecast.get('trend', 'stable')}"
                except:
                    pass
            
            # Alertes et recommandations
            alerts = []
            if net_cash_flow < -50000:
                alerts.append("🚨 Attention : flux négatif important. Vérifiez vos échéances.")
            elif net_cash_flow > 200000:
                alerts.append("💡 Trésorerie excédentaire. Opportunité d'investissement ?")
            
            return {
                "type": "cash_flow_analysis",
                "message": message,
                "data": {
                    "cash_in": cash_in,
                    "cash_out": cash_out,
                    "net_cash_flow": net_cash_flow,
                    "health_status": health_status,
                    "forecast": forecast_data
                },
                "alerts": alerts,
                "chart_type": "waterfall",
                "quick_actions": [
                    {"title": "📊 Prévisions 6 mois", "query": "Prévisions trésorerie 6 mois"},
                    {"title": "💸 Analyse dépenses", "query": "Mes principales dépenses"},
                    {"title": "⚡ Optimisation", "query": "Comment optimiser ma trésorerie"}
                ]
            }
            
        except Exception as e:
            return {
                "type": "error", 
                "message": "Je n'ai pas pu récupérer les données de trésorerie."
            }
    
    async def _handle_forecast_query(self, time_period: str, tenant_id: str, db: Session) -> Dict[str, Any]:
        """Gestion des requêtes de prévisions"""
        try:
            # Générer rapport complet de prévisions
            forecast_report = await forecasting_service.generate_business_forecast_report(tenant_id)
            
            # Extraire les insights clés
            executive_summary = forecast_report.get('executive_summary', {})
            key_insights = executive_summary.get('key_insights', [])
            health_score = executive_summary.get('overall_health_score', 0)
            
            # Message principal
            message = f"🔮 **Prévisions Business**\n\n"
            message += f"📊 **Score de santé** : {health_score}/100\n\n"
            
            if key_insights:
                message += "**Insights clés :**\n"
                for i, insight in enumerate(key_insights[:3], 1):
                    message += f"{i}. {insight}\n"
            
            # Actions prioritaires
            priority_actions = forecast_report.get('priority_actions', [])
            if priority_actions:
                message += f"\n⚡ **Actions prioritaires :**\n"
                for action in priority_actions[:2]:
                    priority_emoji = "🔴" if action['priority'] == 'high' else "🟡"
                    message += f"{priority_emoji} {action['action']} - {action['impact']}\n"
            
            return {
                "type": "forecast_report",
                "message": message,
                "data": {
                    "health_score": health_score,
                    "forecasts": forecast_report.get('forecasts', {}),
                    "priority_actions": priority_actions
                },
                "chart_type": "forecast_combo",
                "quick_actions": [
                    {"title": "💰 Prévision CA", "query": "Prévision chiffre d'affaires"},
                    {"title": "💳 Prévision trésorerie", "query": "Prévision trésorerie"},
                    {"title": "👥 Risque clients", "query": "Clients à risque de churn"}
                ]
            }
            
        except Exception as e:
            return {
                "type": "error",
                "message": "Je n'ai pas pu générer les prévisions. Assurez-vous d'avoir suffisamment de données historiques."
            }
    
    async def _handle_help_query(self) -> Dict[str, Any]:
        """Gestion des demandes d'aide"""
        help_message = """
🤖 **SEKA-Bot à votre service !**

Je peux vous aider avec :

**📊 Analyses Business**
• "Quel est mon CA ce mois ?"
• "Combien j'ai de nouveaux clients ?"
• "Ma trésorerie actuelle"

**🔮 Prévisions**
• "Prévisions de trésorerie"
• "Prédictions de ventes"
• "Clients à risque"

**📈 Insights**
• "Résumé de performance"
• "Points d'amélioration"
• "Opportunités business"

💡 **Conseil** : Posez vos questions en langage naturel, je comprends le français !
        """
        
        return {
            "type": "help",
            "message": help_message,
            "examples": [
                "Quel est mon chiffre d'affaires cette semaine ?",
                "Montre-moi mes clients les plus rentables",
                "Ai-je des produits en rupture de stock ?",
                "Prévisions trésorerie pour les 3 prochains mois",
                "Quelles sont mes opportunités prioritaires ?"
            ]
        }
    
    async def _handle_unknown_query(self, message: str, tenant_id: str, db: Session) -> Dict[str, Any]:
        """Gestion des requêtes non reconnues avec suggestions intelligentes"""
        
        # Essayer de donner des suggestions contextuelles
        suggestions = [
            "Quel est mon chiffre d'affaires ce mois ?",
            "Combien j'ai de nouveaux clients ?",
            "Ma trésorerie actuelle",
            "Prévisions pour les 3 prochains mois"
        ]
        
        # Analyser le message pour des mots-clés partiels
        message_lower = message.lower()
        if any(word in message_lower for word in ['stock', 'produit', 'inventaire']):
            suggestions = [
                "Quels produits sont en rupture de stock ?",
                "Valeur totale de mon inventaire",
                "Produits les plus vendus ce mois"
            ]
        elif any(word in message_lower for word in ['équipe', 'employé', 'rh']):
            suggestions = [
                "Combien j'ai d'employés ?",
                "Budget RH ce mois",
                "Prochaines évaluations"
            ]
        
        return {
            "type": "clarification",
            "message": "🤔 Je n'ai pas bien compris votre demande. Pouvez-vous la reformuler ?",
            "suggestions": suggestions,
            "quick_actions": [
                {"title": "❓ Aide", "query": "aide"},
                {"title": "📊 Dashboard", "query": "résumé du jour"},
                {"title": "💡 Exemples", "query": "exemples de questions"}
            ]
        }
    
    # Méthodes utilitaires
    
    def _clean_message(self, message: str) -> str:
        """Nettoie et normalise le message"""
        # Suppression des caractères spéciaux, normalisation
        cleaned = re.sub(r'[^\w\s\-\'àâäéèêëïîôöùûüÿç]', ' ', message.lower())
        cleaned = re.sub(r'\s+', ' ', cleaned).strip()
        return cleaned
    
    def _detect_intent(self, message: str) -> str:
        """Détecte l'intention du message"""
        for intent, patterns in self.intent_patterns.items():
            for pattern in patterns:
                if re.search(pattern, message, re.IGNORECASE):
                    return intent
        return 'unknown'
    
    def _extract_time_period(self, message: str) -> str:
        """Extrait la période temporelle du message"""
        for period, patterns in self.time_patterns.items():
            for pattern in patterns:
                if re.search(pattern, message, re.IGNORECASE):
                    return period
        return 'month'  # Période par défaut
    
    def _format_currency(self, amount: float) -> str:
        """Formate les montants en devise"""
        if amount >= 1000000:
            return f"{amount/1000000:.1f}M XOF"
        elif amount >= 1000:
            return f"{amount/1000:.0f}K XOF"
        else:
            return f"{amount:.0f} XOF"
    
    def _get_period_label(self, period: str) -> str:
        """Retourne le label français de la période"""
        labels = {
            'day': "aujourd'hui",
            'week': "cette semaine", 
            'month': "ce mois",
            'quarter': "ce trimestre",
            'year': "cette année"
        }
        return labels.get(period, period)
    
    async def _get_today_revenue(self, tenant_id: str, db: Session) -> float:
        """Récupère le CA du jour"""
        try:
            today = datetime.now().date()
            revenue = db.query(func.sum(SalesInvoice.total_amount)).filter(
                and_(
                    SalesInvoice.tenant_id == tenant_id,
                    SalesInvoice.invoice_date == today
                )
            ).scalar()
            return float(revenue or 0)
        except:
            return 0
    
    async def _get_pending_tasks(self, user_id: str, db: Session) -> int:
        """Récupère le nombre de tâches en attente"""
        # Placeholder - à implémenter selon le modèle de tâches
        return 0
    
    async def _get_hot_leads_count(self, tenant_id: str, db: Session) -> int:
        """Récupère le nombre de leads chauds"""
        try:
            count = db.query(Lead).filter(
                and_(
                    Lead.tenant_id == tenant_id,
                    Lead.score >= 70,
                    Lead.status.in_(['contacted', 'qualified'])
                )
            ).count()
            return count
        except:
            return 0
    
    async def _get_revenue_suggestions(self, change_percent: float, current_revenue: float) -> List[str]:
        """Génère des suggestions basées sur la performance revenue"""
        suggestions = []
        
        if change_percent < -10:
            suggestions.extend([
                "Analysez les causes de la baisse",
                "Relancez vos clients inactifs", 
                "Lancez une promotion ciblée"
            ])
        elif change_percent > 20:
            suggestions.extend([
                "Capitalisez sur cette croissance",
                "Augmentez vos investissements marketing",
                "Préparez la montée en charge"
            ])
        elif current_revenue < 100000:  # Seuil arbitraire
            suggestions.extend([
                "Développez votre portefeuille client",
                "Optimisez vos prix",
                "Explorez de nouveaux canaux"
            ])
        
        return suggestions[:3]  # Limiter à 3 suggestions


# Instance singleton
seka_bot = SekaBot()