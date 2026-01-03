/**
 * Treasury Dashboard Page
 * Main dashboard for treasury management with KPIs, alerts, and cash flow summary
 */
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Alert } from '@/components/ui/Alert';
import { getTreasuryDashboard, TreasuryDashboardData } from '@/lib/api';
import { formatCurrency, formatAmount } from '@/lib/formatters';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Plus,
  Clock,
  CreditCard,
  Building2,
  BarChart3,
  ChevronRight,
  RefreshCw,
  AlertTriangle,
  Calendar,
  Landmark
} from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  color: string;
  href?: string;
  loading?: boolean;
  trend?: 'up' | 'down';
  alert?: boolean;
}

function StatCard({ title, value, subtitle, icon: Icon, color, href, loading, trend, alert }: StatCardProps) {
  const router = useRouter();
  
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6 shadow-sm">
        <Skeleton className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl mb-3 sm:mb-4" />
        <Skeleton className="h-3 sm:h-4 w-20 sm:w-24 mb-2" />
        <Skeleton className="h-6 sm:h-8 w-14 sm:w-16" />
      </div>
    );
  }

  return (
    <div 
      onClick={() => href && router.push(href)}
      className={`bg-white rounded-xl border ${alert ? 'border-orange-200 bg-orange-50/30' : 'border-gray-100'} p-4 sm:p-6 shadow-sm transition-all duration-200 ${
        href ? 'cursor-pointer hover:shadow-md hover:border-gray-200' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div className={`inline-flex rounded-xl ${color} p-2 sm:p-3`}>
          <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
        </div>
        {trend && (
          <div className={`flex items-center text-xs sm:text-sm font-medium ${trend === 'up' ? 'text-blue-600' : 'text-red-500'}`}>
            {trend === 'up' ? <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 mr-1" /> : <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />}
          </div>
        )}
        {alert && <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />}
      </div>
      <p className="text-xs sm:text-sm font-medium text-gray-500 mt-3 sm:mt-4">{title}</p>
      <p className="text-xl sm:text-3xl font-bold text-gray-900 mt-1">{value}</p>
      {subtitle && (
        <p className={`text-xs sm:text-sm mt-1 ${alert ? 'text-orange-600 font-medium' : 'text-gray-500'}`}>{subtitle}</p>
      )}
    </div>
  );
}

interface QuickActionProps {
  icon: React.ElementType;
  label: string;
  href: string;
  color: string;
}

function QuickAction({ icon: Icon, label, href, color }: QuickActionProps) {
  return (
    <Link href={href}>
      <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl border border-gray-100 bg-white hover:shadow-md transition-all cursor-pointer">
        <div className={`rounded-lg ${color} p-2 sm:p-2.5`}>
          <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
        </div>
        <span className="text-sm sm:font-medium text-gray-900 line-clamp-1">{label}</span>
        <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 ml-auto flex-shrink-0" />
      </div>
    </Link>
  );
}

export default function TreasuryDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<TreasuryDashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('seka_access_token');
      if (!token) {
        setError('Non authentifié');
        return;
      }
      const data = await getTreasuryDashboard(token);
      setDashboardData(data);
      setError(null);
    } catch (err: any) {
      setError('Erreur lors du chargement du dashboard');
      console.error('Error fetching dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    if (!dashboardData) return null;
    
    const netCashFlow = (dashboardData.cash_flow_summary?.total_income || 0) - 
                        (dashboardData.cash_flow_summary?.total_expenses || 0);
    const isLowRunway = (dashboardData.cash_runway_days || 0) < 30;
    const criticalAlerts = (dashboardData.alerts || []).filter(a => a.severity === 'critical').length;
    
    return {
      totalBalance: dashboardData.total_balance || 0,
      cashRunway: dashboardData.cash_runway_days || 0,
      totalIncome: dashboardData.cash_flow_summary?.total_income || 0,
      totalExpenses: dashboardData.cash_flow_summary?.total_expenses || 0,
      netCashFlow,
      isLowRunway,
      criticalAlerts,
      accountsCount: (dashboardData.accounts_summary || []).length,
      transactionsCount: (dashboardData.recent_transactions || []).length,
      upcomingPaymentsCount: (dashboardData.upcoming_payments || []).length
    };
  }, [dashboardData]);

  return (
    <DashboardLayout title="Trésorerie">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Trésorerie</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Gestion de trésorerie, comptes bancaires et prévisions
          </p>
        </div>
        <div className="flex gap-2 sm:gap-3">
          <Link href="/treasury/accounts">
            <Button variant="secondary" size="sm">
              <Building2 className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Comptes</span>
            </Button>
          </Link>
          <Link href="/treasury/transactions">
            <Button variant="primary" size="sm">
              <Plus className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Nouvelle transaction</span>
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <Alert variant="error" className="mb-6">{error}</Alert>
      )}

      {/* Alertes critiques */}
      {dashboardData?.alerts && dashboardData.alerts.filter(a => a.severity === 'critical').length > 0 && (
        <div className="mb-6 space-y-3">
          {dashboardData.alerts.filter(a => a.severity === 'critical').map((alert, idx) => (
            <Alert key={idx} variant="error" title={alert.title}>
              {alert.message}
            </Alert>
          ))}
        </div>
      )}
      
      {stats?.isLowRunway && (
        <Alert variant="warning" className="mb-6" title="Trésorerie tendue">
          Moins de 30 jours de trésorerie disponible. Surveillez vos flux de trésorerie.
        </Alert>
      )}

      {/* KPIs */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-6 sm:mb-8">
        <StatCard
          title="Solde Total"
          value={formatCurrency(stats?.totalBalance || 0)}
          subtitle={`${stats?.accountsCount || 0} compte(s)`}
          icon={Wallet}
          color="bg-blue-500"
          href="/treasury/accounts"
          loading={loading}
        />
        <StatCard
          title="Jours de Trésorerie"
          value={`${stats?.cashRunway || 0} jours`}
          subtitle={stats?.isLowRunway ? 'Attention !' : 'Situation saine'}
          icon={Clock}
          color={stats?.isLowRunway ? 'bg-orange-500' : 'bg-blue-500'}
          href="/treasury/forecast"
          loading={loading}
          alert={stats?.isLowRunway}
        />
        <StatCard
          title="Revenus du Mois"
          value={formatCurrency(stats?.totalIncome || 0)}
          subtitle="Encaissements"
          icon={TrendingUp}
          color="bg-blue-500"
          href="/treasury/transactions"
          loading={loading}
          trend="up"
        />
        <StatCard
          title="Dépenses du Mois"
          value={formatCurrency(stats?.totalExpenses || 0)}
          subtitle="Décaissements"
          icon={TrendingDown}
          color="bg-red-400"
          href="/treasury/transactions"
          loading={loading}
        />
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Vue d'ensemble cash flow */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Flux de Trésorerie</h3>
              <Link href="/treasury/transactions" className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center">
                Voir tout <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </div>

            {loading ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <>
                {/* Indicateurs visuels */}
                <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3 mb-6">
                  <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-xl">
                    <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500 mx-auto mb-2" />
                    <p className="text-lg sm:text-2xl font-bold text-blue-600">
                      {formatAmount(stats?.totalIncome || 0)}
                    </p>
                    <p className="text-xs sm:text-sm text-blue-700 font-medium">Entrées</p>
                  </div>
                  <div className="text-center p-3 sm:p-4 bg-red-50 rounded-xl">
                    <TrendingDown className="h-6 w-6 sm:h-8 sm:w-8 text-red-500 mx-auto mb-2" />
                    <p className="text-lg sm:text-2xl font-bold text-red-600">
                      {formatAmount(stats?.totalExpenses || 0)}
                    </p>
                    <p className="text-xs sm:text-sm text-red-700 font-medium">Sorties</p>
                  </div>
                  <div className={`text-center p-3 sm:p-4 rounded-xl ${(stats?.netCashFlow || 0) >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
                    <Wallet className={`h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 ${(stats?.netCashFlow || 0) >= 0 ? 'text-blue-500' : 'text-orange-500'}`} />
                    <p className={`text-lg sm:text-2xl font-bold ${(stats?.netCashFlow || 0) >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                      {(stats?.netCashFlow || 0) >= 0 ? '+' : ''}{formatAmount(stats?.netCashFlow || 0)}
                    </p>
                    <p className={`text-xs sm:text-sm font-medium ${(stats?.netCashFlow || 0) >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>Solde Net</p>
                  </div>
                </div>

                {/* Transactions récentes */}
                <div className="pt-4 border-t border-gray-100">
                  <h4 className="text-sm font-semibold text-gray-700 mb-4">Dernières transactions</h4>
                  {dashboardData?.recent_transactions && dashboardData.recent_transactions.length > 0 ? (
                    <div className="space-y-3">
                      {dashboardData.recent_transactions.slice(0, 4).map((transaction, idx) => (
                        <div key={idx} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                          <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                            transaction.amount >= 0 ? 'bg-blue-100' : 'bg-red-100'
                          }`}>
                            {transaction.amount >= 0 ? (
                              <TrendingUp className="h-5 w-5 text-blue-500" />
                            ) : (
                              <TrendingDown className="h-5 w-5 text-red-500" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{transaction.description}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(transaction.transaction_date).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                          <Badge variant={transaction.amount >= 0 ? 'success' : 'error'}>
                            {transaction.amount >= 0 ? '+' : ''}{formatAmount(transaction.amount)}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">Aucune transaction récente</p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Actions rapides */}
        <div className="space-y-3 sm:space-y-4">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Actions rapides</h3>
          <div className="space-y-2 sm:space-y-3">
            <QuickAction icon={Building2} label="Comptes bancaires" href="/treasury/accounts" color="bg-blue-500" />
            <QuickAction icon={CreditCard} label="Transactions" href="/treasury/transactions" color="bg-primary-500" />
            <QuickAction icon={Calendar} label="Échéances" href="/treasury/forecast" color="bg-blue-500" />
            <QuickAction icon={BarChart3} label="Prévisions" href="/treasury/forecast" color="bg-orange-500" />
            <QuickAction icon={Landmark} label="Rapprochement" href="/treasury/reconciliation" color="bg-pink-500" />
          </div>
        </div>
      </div>

      {/* Échéances à venir */}
      {dashboardData?.upcoming_payments && dashboardData.upcoming_payments.length > 0 && (
        <div className="mt-6 sm:mt-8">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="p-4 sm:p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Échéances à venir</h3>
              <Link href="/treasury/forecast" className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center">
                Voir tout <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
              </Link>
            </div>
            <div className="p-4 sm:p-6">
              <div className="space-y-2 sm:space-y-3">
                {dashboardData.upcoming_payments.slice(0, 5).map((payment, idx) => (
                  <div key={idx} className="flex items-center gap-2 sm:gap-4 py-2 sm:py-3 border-b border-gray-50 last:border-0">
                    <div className={`h-8 w-8 sm:h-10 sm:w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      payment.is_income ? 'bg-blue-100' : 'bg-red-100'
                    }`}>
                      {payment.is_income ? (
                        <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                      ) : (
                        <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">{payment.description}</p>
                      <p className="text-xs text-gray-500">
                        Échéance: {new Date(payment.due_date).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 flex-shrink-0">
                      <Badge variant={payment.is_income ? 'success' : 'error'} className="text-xs">
                        {payment.is_income ? 'À recevoir' : 'À payer'}
                      </Badge>
                      <p className={`text-xs sm:text-sm font-semibold ${payment.is_income ? 'text-blue-600' : 'text-red-600'}`}>
                        {formatCurrency(payment.remaining_amount)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
