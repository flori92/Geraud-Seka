/**
 * Dashboard Exécutif SEKA Enterprise
 * Vue d'ensemble temps réel avec métriques business et IA
 */

import React, { useState, useEffect } from 'react';
import { 
  TrendingUpIcon, 
  TrendingDownIcon,
  UsersIcon,
  DollarSignIcon,
  AlertTriangleIcon,
  BarChart3Icon,
  RefreshCwIcon,
  FilterIcon,
  BellIcon,
  TrendingUp,
  ArrowUpIcon,
  ArrowDownIcon
} from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';

import { MetricCard } from './MetricCard';
import SalesChart from '../charts/SalesChart';
import CashFlowChart from '../charts/CashFlowChart';
import { InsightsPanel } from './InsightsPanel';
import { AlertsPanel } from './AlertsPanel';
import { ConversionFunnel } from './ConversionFunnel';

interface DashboardProps {
  tenantId: string;
  userId: string;
}

interface Metric {
  value: number;
  previous_value?: number;
  unit: string;
  category: string;
}

interface Metrics {
  [key: string]: Metric;
}

interface Insight {
  id: string;
  title: string;
  description: string;
  insight_type: string;
  priority: string;
  confidence_score: number;
  recommendations: string[];
}

interface Alert {
  id: string;
  title: string;
  message: string;
  severity: string;
  is_read: boolean;
  created_at: string;
}

export function ExecutiveDashboard({ tenantId, userId }: DashboardProps) {
  const [metrics, setMetrics] = useState<Metrics>({});
  const [insights, setInsights] = useState<Insight[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, [selectedPeriod, selectedCategory]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      const token = localStorage.getItem('seka_access_token');
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
      
      const [metricsRes, insightsRes, alertsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/v1/analytics/metrics/realtime?period=${selectedPeriod}&category=${selectedCategory !== 'all' ? selectedCategory : ''}`, { headers }),
        fetch(`${API_BASE_URL}/api/v1/analytics/insights?limit=5`, { headers }),
        fetch(`${API_BASE_URL}/api/v1/analytics/alerts?unread_only=true&limit=10`, { headers })
      ]);

      if (metricsRes.ok) {
        const metricsData = await metricsRes.json();
        setMetrics(metricsData.metrics || {});
      }

      if (insightsRes.ok) {
        const insightsData = await insightsRes.json();
        setInsights(insightsData || []);
      }

      if (alertsRes.ok) {
        const alertsData = await alertsRes.json();
        setAlerts(alertsData || []);
      }

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Erreur lors du fetch dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateChangePercentage = (current: number, previous?: number): number => {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercentage = (value: number): string => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getUnreadAlertsCount = (): number => {
    return alerts.filter(alert => !alert.is_read).length;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header avec contrôles */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Dashboard Exécutif
            </h1>
            <p className="text-gray-600">
              Vue d'ensemble de votre activité en temps réel
            </p>
            {lastUpdated && (
              <p className="text-sm text-gray-500 mt-1">
                Dernière mise à jour: {lastUpdated.toLocaleTimeString('fr-FR')}
              </p>
            )}
          </div>
          
          <div className="flex items-center space-x-4 mt-4 lg:mt-0">
            {/* Sélecteur période */}
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm"
            >
              <option value="day">Aujourd'hui</option>
              <option value="week">Cette semaine</option>
              <option value="month">Ce mois</option>
              <option value="quarter">Ce trimestre</option>
              <option value="year">Cette année</option>
            </select>

            {/* Sélecteur catégorie */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm"
            >
              <option value="all">Toutes catégories</option>
              <option value="sales">Ventes</option>
              <option value="finance">Finance</option>
              <option value="customer">Clients</option>
              <option value="inventory">Stock</option>
            </select>

            {/* Bouton refresh */}
            <button
              onClick={fetchDashboardData}
              disabled={isLoading}
              className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              <RefreshCwIcon className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Actualiser
            </button>

            {/* Indicateur alertes */}
            {getUnreadAlertsCount() > 0 && (
              <div className="relative">
                <BellIcon className="h-6 w-6 text-red-500" />
                <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full text-xs px-2 py-1">
                  {getUnreadAlertsCount()}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-2">
            <RefreshCwIcon className="h-6 w-6 animate-spin text-blue-600" />
            <span className="text-gray-600">Chargement des métriques...</span>
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Chiffre d'affaires */}
        <MetricCard
          title="Chiffre d'Affaires"
          value={formatCurrency(metrics.total_revenue?.value || 0)}
          change={calculateChangePercentage(
            metrics.total_revenue?.value || 0,
            metrics.total_revenue?.previous_value
          )}
          icon={<DollarSignIcon className="h-6 w-6" />}
          color="green"
          trend={metrics.total_revenue?.value > (metrics.total_revenue?.previous_value || 0) ? 'up' : 'down'}
        />

        {/* Clients actifs */}
        <MetricCard
          title="Clients Actifs"
          value={metrics.active_customers?.value?.toString() || '0'}
          change={calculateChangePercentage(
            metrics.active_customers?.value || 0,
            metrics.active_customers?.previous_value
          )}
          icon={<UsersIcon className="h-6 w-6" />}
          color="blue"
          trend={metrics.active_customers?.value > (metrics.active_customers?.previous_value || 0) ? 'up' : 'down'}
        />

        {/* Taux de conversion */}
        <MetricCard
          title="Taux de Conversion"
          value={`${(metrics.conversion_rate?.value || 0).toFixed(1)}%`}
          change={calculateChangePercentage(
            metrics.conversion_rate?.value || 0,
            metrics.conversion_rate?.previous_value
          )}
          icon={<TrendingUpIcon className="h-6 w-6" />}
          color="purple"
          trend={metrics.conversion_rate?.value > (metrics.conversion_rate?.previous_value || 0) ? 'up' : 'down'}
        />

        {/* Cash Flow */}
        <MetricCard
          title="Cash Flow"
          value={formatCurrency(metrics.net_cash_flow?.value || 0)}
          change={calculateChangePercentage(
            metrics.net_cash_flow?.value || 0,
            metrics.net_cash_flow?.previous_value
          )}
          icon={<BarChart3Icon className="h-6 w-6" />}
          color={metrics.net_cash_flow?.value >= 0 ? "green" : "red"}
          trend={metrics.net_cash_flow?.value >= 0 ? 'up' : 'down'}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Graphique des ventes */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Évolution des Ventes
            </h3>
            <div className="text-sm text-gray-500">
              {selectedPeriod === 'month' ? '30 derniers jours' : selectedPeriod}
            </div>
          </div>
          <SalesChart 
            period={selectedPeriod}
            height={300}
          />
        </div>

        {/* Graphique Cash Flow */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Flux de Trésorerie
            </h3>
            <div className="text-sm text-gray-500">
              Entrées vs Sorties
            </div>
          </div>
          <CashFlowChart 
            period={selectedPeriod}
            height={300}
          />
        </div>
      </div>

      {/* Bottom Section: Insights + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel Insights IA */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
              Insights IA
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Recommandations basées sur l'analyse de vos données
            </p>
          </div>
          <div className="p-6">
            <InsightsPanel insights={insights} />
          </div>
        </div>

        {/* Panel Alertes */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <AlertTriangleIcon className="h-5 w-5 mr-2 text-orange-600" />
              Alertes & Notifications
              {getUnreadAlertsCount() > 0 && (
                <span className="ml-2 bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                  {getUnreadAlertsCount()} nouvelles
                </span>
              )}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Surveillance automatique de vos métriques critiques
            </p>
          </div>
          <div className="p-6">
            <AlertsPanel alerts={alerts} onMarkAsRead={(id: string) => {
              setAlerts(alerts.map(alert => 
                alert.id === id ? { ...alert, is_read: true } : alert
              ));
            }} />
          </div>
        </div>
      </div>

      {/* Conversion Funnel (si CRM activé) */}
      {metrics.conversion_rate && (
        <div className="mt-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Funnel de Conversion
              </h3>
              <div className="text-sm text-gray-500">
                Analyse du parcours client
              </div>
            </div>
            <ConversionFunnel period={selectedPeriod} />
          </div>
        </div>
      )}
    </div>
  );
}