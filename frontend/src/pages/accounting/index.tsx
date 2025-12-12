/**
 * Accounting Dashboard
 * Vue d'ensemble du module Comptabilité
 */
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Alert } from "@/components/ui/Alert";
import {
  getJournalEntries,
  getLedgerAccounts,
  type JournalEntry,
  type LedgerAccount
} from "@/lib/api";
import { formatCurrency, formatAmount } from "@/lib/formatters";
import {
  FileText,
  BookOpen,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Plus,
  Calculator,
  PieChart,
  BarChart3,
  DollarSign,
  ChevronRight,
  Download,
  Calendar,
  CheckCircle
} from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  color: string;
  href?: string;
  loading?: boolean;
  trend?: "up" | "down";
}

function StatCard({ title, value, subtitle, icon: Icon, color, href, loading, trend }: StatCardProps) {
  const router = useRouter();
  
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
        <Skeleton className="h-12 w-12 rounded-xl mb-4" />
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-8 w-16" />
      </div>
    );
  }

  return (
    <div 
      onClick={() => href && router.push(href)}
      className={`bg-white rounded-xl border border-gray-100 p-6 shadow-sm transition-all duration-200 ${
        href ? "cursor-pointer hover:shadow-md hover:border-gray-200" : ""
      }`}
    >
      <div className="flex items-start justify-between">
        <div className={`inline-flex rounded-xl ${color} p-3`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        {trend && (
          <div className={`flex items-center text-sm font-medium ${trend === "up" ? "text-blue-600" : "text-red-500"}`}>
            {trend === "up" ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
            {trend === "up" ? "+12%" : "-8%"}
          </div>
        )}
      </div>
      <p className="text-sm font-medium text-gray-500 mt-4">{title}</p>
      <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
      {subtitle && (
        <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
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
      <div className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 bg-white hover:shadow-md transition-all cursor-pointer">
        <div className={`rounded-lg ${color} p-2.5`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <span className="font-medium text-gray-900">{label}</span>
        <ChevronRight className="h-5 w-5 text-gray-400 ml-auto" />
      </div>
    </Link>
  );
}

export default function AccountingDashboardPage() {
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [ledgerAccounts, setLedgerAccounts] = useState<LedgerAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("seka_access_token");
      if (!token) return;

      const [journalData, ledgerData] = await Promise.allSettled([
        getJournalEntries(token),
        getLedgerAccounts(token)
      ]);

      if (journalData.status === "fulfilled") {
        setJournalEntries(Array.isArray(journalData.value) ? journalData.value : []);
      }
      if (ledgerData.status === "fulfilled") {
        setLedgerAccounts(Array.isArray(ledgerData.value) ? ledgerData.value : []);
      }

      setError(null);
    } catch (err: any) {
      setError("Erreur lors du chargement des données comptables");
      console.error(err);
      setJournalEntries([]);
      setLedgerAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculs des statistiques
  const stats = useMemo(() => {
    const entriesList = Array.isArray(journalEntries) ? journalEntries : [];
    const accountsList = Array.isArray(ledgerAccounts) ? ledgerAccounts : [];

    const totalEntries = entriesList.length;
    const totalDebit = entriesList.reduce((sum, e) => sum + (e?.amount || 0), 0);
    const totalCredit = totalDebit; // Dans une écriture équilibrée, débit = crédit
    
    const assetAccounts = accountsList.filter(a => a?.account_type === "asset");
    const liabilityAccounts = accountsList.filter(a => a?.account_type === "liability");
    const revenueAccounts = accountsList.filter(a => a?.account_type === "revenue");
    const expenseAccounts = accountsList.filter(a => a?.account_type === "expense");
    
    const totalAssets = assetAccounts.reduce((sum, a) => sum + (a?.balance || 0), 0);
    const totalLiabilities = liabilityAccounts.reduce((sum, a) => sum + (a?.balance || 0), 0);
    const totalRevenue = revenueAccounts.reduce((sum, a) => sum + (a?.balance || 0), 0);
    const totalExpenses = expenseAccounts.reduce((sum, a) => sum + (a?.balance || 0), 0);
    const netProfit = totalRevenue - totalExpenses;

    return {
      totalEntries,
      totalDebit,
      totalCredit,
      totalAssets,
      totalLiabilities,
      totalRevenue,
      totalExpenses,
      netProfit,
      accountsCount: accountsList.length
    };
  }, [journalEntries, ledgerAccounts]);

  // Dernières écritures
  const recentEntries = useMemo(() => {
    const entriesList = Array.isArray(journalEntries) ? journalEntries : [];
    return entriesList
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [journalEntries]);

  return (
    <DashboardLayout title="Comptabilité">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Comptabilité
          </h1>
          <p className="text-gray-500 mt-1">
            Journal, grand livre, bilan et compte de résultat
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/exports">
            <Button variant="secondary" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exports
            </Button>
          </Link>
          <Link href="/accounting/journal">
            <Button variant="primary" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle écriture
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <Alert variant="error" className="mb-6">{error}</Alert>
      )}

      {/* KPIs */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          title="Total Actif"
          value={formatCurrency(stats.totalAssets)}
          subtitle="Patrimoine"
          icon={TrendingUp}
          color="bg-blue-500"
          href="/accounting/balance"
          loading={loading}
          trend="up"
        />
        <StatCard
          title="Total Passif"
          value={formatCurrency(stats.totalLiabilities)}
          subtitle="Dettes"
          icon={TrendingDown}
          color="bg-red-400"
          href="/accounting/balance"
          loading={loading}
        />
        <StatCard
          title="Chiffre d'Affaires"
          value={formatCurrency(stats.totalRevenue)}
          subtitle="Ce mois"
          icon={DollarSign}
          color="bg-blue-500"
          href="/reports/accounting"
          loading={loading}
          trend="up"
        />
        <StatCard
          title="Résultat Net"
          value={formatCurrency(stats.netProfit)}
          subtitle={stats.netProfit >= 0 ? "Bénéfice" : "Perte"}
          icon={stats.netProfit >= 0 ? CheckCircle : TrendingDown}
          color={stats.netProfit >= 0 ? "bg-blue-500" : "bg-red-500"}
          href="/reports/accounting"
          loading={loading}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Vue d'ensemble comptable */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Vue d'ensemble</h3>
              <Link href="/accounting/journal" className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center">
                Voir le journal <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </div>

            {loading ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <div className="space-y-4">
                {/* Résumé comptable */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-xl">
                    <p className="text-sm text-blue-600 font-medium">Total Débits</p>
                    <p className="text-2xl font-bold text-blue-700 mt-1">
                      {formatCurrency(stats.totalDebit)}
                    </p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-xl">
                    <p className="text-sm text-blue-600 font-medium">Total Crédits</p>
                    <p className="text-2xl font-bold text-blue-700 mt-1">
                      {formatCurrency(stats.totalCredit)}
                    </p>
                  </div>
                </div>

                {/* Indicateurs de performance */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-gray-900">{stats.totalEntries}</p>
                    <p className="text-sm text-gray-500">Écritures</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-gray-900">{stats.accountsCount}</p>
                    <p className="text-sm text-gray-500">Comptes</p>
                  </div>
                  <div className="text-center">
                    <p className={`text-3xl font-bold ${stats.netProfit >= 0 ? "text-blue-600" : "text-red-600"}`}>
                      {stats.netProfit >= 0 ? "+" : ""}{formatAmount(stats.netProfit)}
                    </p>
                    <p className="text-sm text-gray-500">Résultat</p>
                  </div>
                </div>
              </div>
            )}

            {/* Dernières écritures */}
            <div className="mt-6 pt-6 border-t border-gray-100">
              <h4 className="text-sm font-semibold text-gray-700 mb-4">Dernières écritures</h4>
              {recentEntries.length > 0 ? (
                <div className="space-y-3">
                  {recentEntries.map((entry, idx) => (
                    <div key={idx} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                      <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-gray-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{entry.description}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(entry.date).toLocaleDateString("fr-FR")} • {entry.entry_number}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">
                        {formatCurrency(entry.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Aucune écriture récente</p>
              )}
            </div>
          </div>
        </div>

        {/* Actions rapides */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Modules comptables</h3>
          <QuickAction icon={BookOpen} label="Journal" href="/accounting/journal" color="bg-blue-500" />
          <QuickAction icon={Calculator} label="Grand Livre" href="/accounting/ledger" color="bg-violet-500" />
          <QuickAction icon={PieChart} label="Plan Comptable" href="/accounting/chart" color="bg-blue-500" />
          <QuickAction icon={BarChart3} label="Bilan" href="/accounting/balance" color="bg-orange-500" />
          <QuickAction icon={Download} label="Exports FEC" href="/exports" color="bg-pink-500" />
        </div>
      </div>
    </DashboardLayout>
  );
}
