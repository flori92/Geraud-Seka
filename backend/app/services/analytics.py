"""
Service Analytics Intelligent pour SEKA Enterprise
Calcul automatique des métriques business et génération d'insights IA
"""

import asyncio
from datetime import datetime, timedelta, date, timezone
from typing import Dict, List, Optional, Any
from sqlalchemy import func, and_, or_
from sqlalchemy.orm import Session
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.analytics import Metric, Dashboard, Alert, BusinessInsight, KPITarget, MetricCategory, AlertSeverity
from app.models.client import Client
from app.models.product import Product
from app.models.sales_invoice import SalesInvoice
from app.models.accounting import AccountingEntry
# from app.models.crm import Lead, Opportunity, CRMActivity  # CRM models removed
from app.db.session import get_db
from app.services.monitoring import monitoring_service


class AnalyticsService:
    """Service d'analytics intelligent avec calculs automatiques"""
    
    def __init__(self):
        self.monitoring = monitoring_service
    
    async def calculate_real_time_metrics(self, tenant_id: str, period: str = "month") -> Dict[str, Any]:
        """
        Calcule toutes les métriques business en temps réel
        
        Args:
            tenant_id: ID du tenant
            period: Période d'analyse (day, week, month, quarter, year)
            
        Returns:
            Dict avec toutes les métriques calculées
        """
        try:
            # Définir les dates selon la période
            end_date = datetime.now(timezone.utc)
            start_date = self._get_period_start_date(end_date, period)
            
            # Calcul parallèle des métriques
            metrics_tasks = [
                self._calculate_revenue_metrics(tenant_id, start_date, end_date),
                self._calculate_sales_metrics(tenant_id, start_date, end_date),
                self._calculate_customer_metrics(tenant_id, start_date, end_date),
                self._calculate_inventory_metrics(tenant_id),
                self._calculate_cash_flow_metrics(tenant_id, start_date, end_date),
                self._calculate_crm_metrics(tenant_id, start_date, end_date)
            ]
            
            results = await asyncio.gather(*metrics_tasks)
            
            # Combiner tous les résultats
            all_metrics = {}
            for result in results:
                all_metrics |= result
            
            # Sauvegarder les métriques en base
            await self._save_metrics_to_db(tenant_id, all_metrics, period)
            
            # Log business event
            self.monitoring.log_business_event(
                event_type="metrics_calculated",
                description=f"Métriques {period} calculées: {len(all_metrics)} indicateurs",
                tenant_id=tenant_id
            )
            
            return all_metrics
            
        except Exception as e:
            self.monitoring.log_error(
                error=e,
                context="calculate_real_time_metrics",
                tenant_id=tenant_id
            )
            raise
    
    async def _calculate_revenue_metrics(self, tenant_id: str, start_date: datetime, end_date: datetime) -> Dict:
        """Calcule les métriques de chiffre d'affaires"""
        async with AsyncSession() as db:
            # CA total
            revenue_query = db.query(func.sum(SalesInvoice.total_amount)).filter(
                and_(
                    SalesInvoice.tenant_id == tenant_id,
                    SalesInvoice.invoice_date >= start_date.date(),
                    SalesInvoice.invoice_date <= end_date.date()
                )
            )
            total_revenue = await revenue_query.scalar() or 0
            
            # CA période précédente pour comparaison
            previous_start = start_date - (end_date - start_date)
            previous_revenue_query = db.query(func.sum(SalesInvoice.total_amount)).filter(
                and_(
                    SalesInvoice.tenant_id == tenant_id,
                    SalesInvoice.invoice_date >= previous_start.date(),
                    SalesInvoice.invoice_date < start_date.date()
                )
            )
            previous_revenue = await previous_revenue_query.scalar() or 0
            
            # Croissance
            growth_rate = 0
            if previous_revenue > 0:
                growth_rate = ((total_revenue - previous_revenue) / previous_revenue) * 100
            
            # CA moyen par facture
            invoice_count_query = db.query(func.count(SalesInvoice.id)).filter(
                and_(
                    SalesInvoice.tenant_id == tenant_id,
                    SalesInvoice.invoice_date >= start_date.date(),
                    SalesInvoice.invoice_date <= end_date.date()
                )
            )
            invoice_count = await invoice_count_query.scalar() or 0
            avg_invoice_value = total_revenue / invoice_count if invoice_count > 0 else 0
            
            return {
                "total_revenue": {
                    "value": float(total_revenue),
                    "previous_value": float(previous_revenue),
                    "unit": "XOF",
                    "category": MetricCategory.FINANCE
                },
                "revenue_growth_rate": {
                    "value": growth_rate,
                    "unit": "%",
                    "category": MetricCategory.FINANCE
                },
                "average_invoice_value": {
                    "value": float(avg_invoice_value),
                    "unit": "XOF",
                    "category": MetricCategory.SALES
                },
                "invoice_count": {
                    "value": invoice_count,
                    "unit": "count",
                    "category": MetricCategory.SALES
                }
            }
    
    async def _calculate_sales_metrics(self, tenant_id: str, start_date: datetime, end_date: datetime) -> Dict:
        """Calcule les métriques de vente"""
        async with AsyncSession() as db:
            # Nombre de ventes
            sales_count = await db.query(func.count(SalesInvoice.id)).filter(
                and_(
                    SalesInvoice.tenant_id == tenant_id,
                    SalesInvoice.invoice_date >= start_date.date(),
                    SalesInvoice.invoice_date <= end_date.date()
                )
            ).scalar()
            
            # CRM metrics disabled - models removed
            leads_created = 0
            conversion_rate = 0
            
            return {
                "sales_count": {
                    "value": sales_count or 0,
                    "unit": "count",
                    "category": MetricCategory.SALES
                },
                "conversion_rate": {
                    "value": conversion_rate,
                    "unit": "%",
                    "category": MetricCategory.SALES
                },
                "leads_generated": {
                    "value": leads_created or 0,
                    "unit": "count",
                    "category": MetricCategory.SALES
                }
            }
    
    async def _calculate_customer_metrics(self, tenant_id: str, start_date: datetime, end_date: datetime) -> Dict:
        """Calcule les métriques client"""
        async with AsyncSession() as db:
            # Clients actifs (qui ont acheté dans la période)
            active_clients = await db.query(func.count(func.distinct(SalesInvoice.client_id))).filter(
                and_(
                    SalesInvoice.tenant_id == tenant_id,
                    SalesInvoice.invoice_date >= start_date.date(),
                    SalesInvoice.invoice_date <= end_date.date()
                )
            ).scalar()
            
            # Nouveaux clients
            new_clients = await db.query(func.count(Client.id)).filter(
                and_(
                    Client.tenant_id == tenant_id,
                    Client.created_at >= start_date,
                    Client.created_at <= end_date
                )
            ).scalar()
            
            # Total clients
            total_clients = await db.query(func.count(Client.id)).filter(
                Client.tenant_id == tenant_id
            ).scalar()
            
            return {
                "active_customers": {
                    "value": active_clients or 0,
                    "unit": "count",
                    "category": MetricCategory.CUSTOMER
                },
                "new_customers": {
                    "value": new_clients or 0,
                    "unit": "count",
                    "category": MetricCategory.CUSTOMER
                },
                "total_customers": {
                    "value": total_clients or 0,
                    "unit": "count",
                    "category": MetricCategory.CUSTOMER
                }
            }
    
    async def _calculate_inventory_metrics(self, tenant_id: str) -> Dict:
        """Calcule les métriques de stock"""
        async with AsyncSession() as db:
            # Valeur totale du stock
            stock_value_query = db.query(
                func.sum(Product.price * Product.stock_quantity)
            ).filter(Product.tenant_id == tenant_id)
            
            total_stock_value = await stock_value_query.scalar() or 0
            
            # Produits en rupture de stock
            out_of_stock = await db.query(func.count(Product.id)).filter(
                and_(
                    Product.tenant_id == tenant_id,
                    Product.stock_quantity <= 0
                )
            ).scalar()
            
            # Produits en alerte stock bas
            low_stock = await db.query(func.count(Product.id)).filter(
                and_(
                    Product.tenant_id == tenant_id,
                    Product.stock_quantity <= Product.min_stock_alert,
                    Product.stock_quantity > 0
                )
            ).scalar()
            
            # Nombre total de produits
            total_products = await db.query(func.count(Product.id)).filter(
                Product.tenant_id == tenant_id
            ).scalar()
            
            return {
                "total_stock_value": {
                    "value": float(total_stock_value),
                    "unit": "XOF",
                    "category": MetricCategory.INVENTORY
                },
                "out_of_stock_products": {
                    "value": out_of_stock or 0,
                    "unit": "count",
                    "category": MetricCategory.INVENTORY
                },
                "low_stock_products": {
                    "value": low_stock or 0,
                    "unit": "count",
                    "category": MetricCategory.INVENTORY
                },
                "total_products": {
                    "value": total_products or 0,
                    "unit": "count",
                    "category": MetricCategory.INVENTORY
                }
            }
    
    async def _calculate_cash_flow_metrics(self, tenant_id: str, start_date: datetime, end_date: datetime) -> Dict:
        """Calcule les métriques de trésorerie"""
        async with AsyncSession() as db:
            # Entrées de trésorerie
            cash_in_query = db.query(func.sum(AccountingEntry.credit)).filter(
                and_(
                    AccountingEntry.tenant_id == tenant_id,
                    AccountingEntry.date >= start_date.date(),
                    AccountingEntry.date <= end_date.date(),
                    AccountingEntry.account_number.like('5%')  # Comptes de trésorerie
                )
            )
            cash_in = await cash_in_query.scalar() or 0
            
            # Sorties de trésorerie
            cash_out_query = db.query(func.sum(AccountingEntry.debit)).filter(
                and_(
                    AccountingEntry.tenant_id == tenant_id,
                    AccountingEntry.date >= start_date.date(),
                    AccountingEntry.date <= end_date.date(),
                    AccountingEntry.account_number.like('5%')  # Comptes de trésorerie
                )
            )
            cash_out = await cash_out_query.scalar() or 0
            
            # Flux de trésorerie net
            net_cash_flow = cash_in - cash_out
            
            return {
                "cash_inflow": {
                    "value": float(cash_in),
                    "unit": "XOF",
                    "category": MetricCategory.FINANCE
                },
                "cash_outflow": {
                    "value": float(cash_out),
                    "unit": "XOF",
                    "category": MetricCategory.FINANCE
                },
                "net_cash_flow": {
                    "value": float(net_cash_flow),
                    "unit": "XOF",
                    "category": MetricCategory.FINANCE
                }
            }
    
    async def _calculate_crm_metrics(self, tenant_id: str, start_date: datetime, end_date: datetime) -> Dict:
        """Calcule les métriques CRM - DISABLED (models removed)"""
        return {
            "pipeline_value": {
                "value": 0.0,
                "unit": "XOF",
                "category": MetricCategory.SALES
            },
            "won_opportunities": {
                "value": 0.0,
                "unit": "XOF",
                "category": MetricCategory.SALES
            },
            "crm_activities": {
                "value": 0,
                "unit": "count",
                "category": MetricCategory.SALES
            }
        }
    
    async def generate_business_insights(self, tenant_id: str) -> List[Dict[str, Any]]:
        """
        Génère des insights business intelligents basés sur l'analyse des métriques
        """
        insights = []
        
        # Récupérer les métriques récentes
        metrics = await self.calculate_real_time_metrics(tenant_id)
        
        # Analyse croissance du chiffre d'affaires
        revenue_growth = metrics.get("revenue_growth_rate", {}).get("value", 0)
        if revenue_growth < -10:
            insights.append({
                "type": "warning",
                "title": "Baisse significative du chiffre d'affaires",
                "description": f"Le CA a diminué de {abs(revenue_growth):.1f}% par rapport à la période précédente",
                "recommendations": [
                    "Analyser les causes de la baisse",
                    "Renforcer les actions commerciales",
                    "Revoir la stratégie pricing",
                    "Lancer une campagne marketing ciblée"
                ],
                "priority": "high",
                "confidence_score": 0.9
            })
        elif revenue_growth > 20:
            insights.append({
                "type": "opportunity",
                "title": "Excellente croissance du chiffre d'affaires",
                "description": f"Le CA a augmenté de {revenue_growth:.1f}% - tendance très positive",
                "recommendations": [
                    "Capitaliser sur cette dynamique",
                    "Augmenter les investissements marketing",
                    "Préparer la montée en charge",
                    "Identifier les facteurs de succès"
                ],
                "priority": "medium",
                "confidence_score": 0.95
            })
        
        # Analyse stock
        low_stock = metrics.get("low_stock_products", {}).get("value", 0)
        out_of_stock = metrics.get("out_of_stock_products", {}).get("value", 0)
        
        if out_of_stock > 0:
            insights.append({
                "type": "risk",
                "title": f"{out_of_stock} produit(s) en rupture de stock",
                "description": "Des produits sont indisponibles, risque de perte de ventes",
                "recommendations": [
                    "Réapprovisionner immédiatement",
                    "Mettre en place des alertes automatiques",
                    "Revoir les seuils de stock minimum",
                    "Analyser la demande pour optimiser les commandes"
                ],
                "priority": "high",
                "confidence_score": 1.0
            })
        
        if low_stock > 0:
            insights.append({
                "type": "warning",
                "title": f"{low_stock} produit(s) en stock bas",
                "description": "Attention aux niveaux de stock critiques",
                "recommendations": [
                    "Planifier le réapprovisionnement",
                    "Vérifier les délais fournisseurs",
                    "Considérer des commandes anticipées"
                ],
                "priority": "medium",
                "confidence_score": 0.8
            })
        
        # Analyse CRM
        conversion_rate = metrics.get("conversion_rate", {}).get("value", 0)
        if conversion_rate < 5 and conversion_rate > 0:
            insights.append({
                "type": "warning",
                "title": "Taux de conversion faible",
                "description": f"Seulement {conversion_rate:.1f}% des leads se convertissent",
                "recommendations": [
                    "Améliorer la qualification des leads",
                    "Former l'équipe commerciale",
                    "Revoir le processus de vente",
                    "Analyser les motifs de perte"
                ],
                "priority": "medium",
                "confidence_score": 0.7
            })
        
        # Sauvegarder les insights en base
        await self._save_insights_to_db(tenant_id, insights)
        
        return insights
    
    async def generate_alerts(self, tenant_id: str) -> List[Alert]:
        """Génère des alertes automatiques basées sur les seuils"""
        alerts = []
        
        # Récupérer les métriques actuelles
        metrics = await self.calculate_real_time_metrics(tenant_id)
        
        # Alerte cash flow négatif
        cash_flow = metrics.get("net_cash_flow", {}).get("value", 0)
        if cash_flow < -100000:  # Seuil configurable
            alerts.append(await self._create_alert(
                tenant_id=tenant_id,
                title="Flux de trésorerie négatif",
                message=f"Attention: flux de trésorerie négatif de {cash_flow:,.0f} XOF",
                severity=AlertSeverity.WARNING,
                metric_name="net_cash_flow",
                actual_value=cash_flow,
                threshold_value=-100000
            ))
        
        # Alerte croissance négative
        growth_rate = metrics.get("revenue_growth_rate", {}).get("value", 0)
        if growth_rate < -15:
            alerts.append(await self._create_alert(
                tenant_id=tenant_id,
                title="Chute du chiffre d'affaires",
                message=f"CA en baisse de {abs(growth_rate):.1f}% - action requise",
                severity=AlertSeverity.ERROR,
                metric_name="revenue_growth_rate",
                actual_value=growth_rate,
                threshold_value=-15
            ))
        
        return alerts
    
    def _get_period_start_date(self, end_date: datetime, period: str) -> datetime:
        """Calcule la date de début selon la période"""
        if period == "day":
            return end_date.replace(hour=0, minute=0, second=0, microsecond=0)
        elif period == "week":
            days_since_monday = end_date.weekday()
            return end_date - timedelta(days=days_since_monday)
        elif period == "month":
            return end_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        elif period == "quarter":
            quarter_start_month = ((end_date.month - 1) // 3) * 3 + 1
            return end_date.replace(month=quarter_start_month, day=1, hour=0, minute=0, second=0, microsecond=0)
        elif period == "year":
            return end_date.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        else:
            return end_date - timedelta(days=30)  # Défaut: 30 jours
    
    async def _save_metrics_to_db(self, tenant_id: str, metrics: Dict, period: str):
        """Sauvegarde les métriques en base de données"""
        async with AsyncSession() as db:
            for name, data in metrics.items():
                metric = Metric(
                    name=name,
                    display_name=name.replace("_", " ").title(),
                    category=data.get("category", "operations"),
                    value=data["value"],
                    previous_value=data.get("previous_value"),
                    unit=data.get("unit", "count"),
                    period=period,
                    tenant_id=tenant_id,
                    metadata={"calculation_time": datetime.now(timezone.utc).isoformat()}
                )
                db.add(metric)
            
            await db.commit()
    
    async def _save_insights_to_db(self, tenant_id: str, insights: List[Dict]):
        """Sauvegarde les insights en base de données"""
        async with AsyncSession() as db:
            for insight_data in insights:
                insight = BusinessInsight(
                    title=insight_data["title"],
                    description=insight_data["description"],
                    insight_type=insight_data["type"],
                    confidence_score=insight_data.get("confidence_score", 0.5),
                    priority=insight_data["priority"],
                    recommendations=insight_data.get("recommendations", []),
                    tenant_id=tenant_id
                )
                db.add(insight)
            
            await db.commit()
    
    async def _create_alert(self, **kwargs) -> Alert:
        """Crée une alerte"""
        alert = Alert(**kwargs)
        
        async with AsyncSession() as db:
            db.add(alert)
            await db.commit()
            await db.refresh(alert)
        
        return alert


# Instance singleton
analytics_service = AnalyticsService()