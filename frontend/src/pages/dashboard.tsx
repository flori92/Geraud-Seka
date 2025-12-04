/**
 * Dashboard Principal SEKA ERP
 * Interface professionnelle avec KPIs, graphiques et modules intégrés
 */
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { DashboardLayout } from "@/components/DashboardLayout";
import { 
  getDashboardStats, 
  getClients, 
  getInvoices,
  getQuotes,
  getOpportunities,
  getCRMActivities,
  type DashboardStats,
  type Client,
  type Invoice,
  type Quote,
  type Opportunity,
  type CRMActivity
} from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatAmount, formatCurrency } from "@/lib/formatters";
import {
  Users,
  CheckSquare,
  FileText,
  Wallet,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertCircle,
  ArrowUpRight,
  ArrowRight,
  BarChart3,
  PieChart,
  Target,
  ShoppingCart,
  Package,
  DollarSign,
  Calendar,
  Activity,
  Bell,
  RefreshCw,
  Plus,
  Eye,
  Building2,
  Briefcase,
  CreditCard,
  Receipt,
  ChevronRight,
  Sparkles,
  Zap
} from "lucide-react";

// ========== COMPOSANTS DE DASHBOARD ==========

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: { value: string; type: "up" | "down" | "neutral" };
  icon: React.ElementType;
  iconColor: string;
  loading?: boolean;
  href?: string;
}

function StatCard({ title, value, subtitle, trend, icon: Icon, iconColor, loading, href }: StatCardProps) {
  const router = useRouter();

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <Skeleton className="h-4 w-24 mb-3" />
            <Skeleton className="h-9 w-20 mb-2" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-12 w-12 rounded-xl" />
        </div>
      </div>
    );
  }

  const handleClick = () => {
    if (href) router.push(href);
  };

  return (
    <div 
      onClick={handleClick}
      className={`bg-white rounded-xl border border-gray-100 p-6 shadow-sm transition-all duration-200 ${
        href ? "cursor-pointer hover:shadow-md hover:border-gray-200 hover:-translate-y-0.5" : ""
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <h3 className="text-3xl font-bold tracking-tight text-gray-900">{value}</h3>
            {trend && (
              <span className={`inline-flex items-center text-sm font-medium ${
                trend.type === "up" ? "text-emerald-600" : 
                trend.type === "down" ? "text-red-600" : "text-gray-500"
              }`}>
                {trend.type === "up" ? <TrendingUp className="h-4 w-4 mr-0.5" /> : 
                 trend.type === "down" ? <TrendingDown className="h-4 w-4 mr-0.5" /> : null}
                {trend.value}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="mt-2 text-sm text-gray-500">{subtitle}</p>
          )}
        </div>
        <div className={`rounded-xl ${iconColor} p-3 shadow-sm`}>
          <Icon className="h-6 w-6 text-white" strokeWidth={2} />
        </div>
      </div>
      {href && (
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center text-sm text-blue-600 font-medium">
          Voir détails <ArrowRight className="h-4 w-4 ml-1" />
        </div>
      )}
    </div>
  );
}

interface QuickActionProps {
  label: string;
  description: string;
  icon: React.ElementType;
  href: string;
  color: string;
}

function QuickAction({ label, description, icon: Icon, href, color }: QuickActionProps) {
  return (
    <Link href={href}>
      <div className="group flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-4 transition-all hover:shadow-md hover:border-gray-200 cursor-pointer">
        <div className={`rounded-xl ${color} p-3 transition-transform group-hover:scale-110`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-gray-900">{label}</h4>
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        </div>
        <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-gray-500 transition-colors" />
      </div>
    </Link>
  );
}

interface ModuleCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  stats?: { label: string; value: string | number }[];
  color: string;
  gradient: string;
}

function ModuleCard({ title, description, icon: Icon, href, stats, color, gradient }: ModuleCardProps) {
  return (
    <Link href={href}>
      <div className={`group relative overflow-hidden rounded-2xl ${gradient} p-6 text-white shadow-lg transition-all hover:shadow-xl hover:-translate-y-1 cursor-pointer`}>
        <div className="absolute top-0 right-0 opacity-10">
          <Icon className="h-32 w-32 -mr-8 -mt-8" />
        </div>
        <div className="relative">
          <div className={`inline-flex rounded-xl ${color} p-3 mb-4`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-xl font-bold mb-2">{title}</h3>
          <p className="text-sm text-white/80 mb-4">{description}</p>
          {stats && stats.length > 0 && (
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/20">
              {stats.map((stat, idx) => (
                <div key={idx}>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-white/70">{stat.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

interface ActivityItemProps {
  icon: React.ElementType;
  iconBg: string;
  title: string;
  subtitle: string;
  time: string;
  amount?: string;
}

function ActivityItem({ icon: Icon, iconBg, title, subtitle, time, amount }: ActivityItemProps) {
  return (
    <div className="flex items-start gap-4 py-4 border-b border-gray-100 last:border-0">
      <div className={`rounded-full ${iconBg} p-2.5`}>
        <Icon className="h-4 w-4 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{title}</p>
        <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
      </div>
      <div className="text-right">
        {amount && (
          <p className="text-sm font-semibold text-gray-900">{amount}</p>
        )}
        <p className="text-xs text-gray-400">{time}</p>
      </div>
    </div>
  );
}

// ========== COMPOSANT PRINCIPAL ==========

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [activities, setActivities] = useState<CRMActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAllData = async () => {
    try {
      const token = localStorage.getItem("seka_access_token");
      if (!token) {
        router.push("/login");
        return;
      }

      // Fetch all data in parallel
      const [statsData, clientsData, invoicesData, quotesData, oppsData, activitiesData] = await Promise.allSettled([
        getDashboardStats(token),
        getClients(token),
        getInvoices(token),
        getQuotes(token),
        getOpportunities(token),
        getCRMActivities(token)
      ]);

      if (statsData.status === "fulfilled") setStats(statsData.value);
      if (clientsData.status === "fulfilled") setClients(clientsData.value);
      if (invoicesData.status === "fulfilled") setInvoices(invoicesData.value);
      if (quotesData.status === "fulfilled") setQuotes(quotesData.value);
      if (oppsData.status === "fulfilled") setOpportunities(oppsData.value);
      if (activitiesData.status === "fulfilled") setActivities(activitiesData.value);

      setError(null);
    } catch (err: any) {
      console.error("Failed to fetch dashboard data", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("seka_access_token");
        router.push("/login");
        return;
      }
      setError("Impossible de charger les données du tableau de bord.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [router]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAllData();
  };

  // Calculs des métriques
  const calculatedStats = useMemo(() => {
    const totalRevenue = invoices?.reduce((sum, inv) => sum + (inv?.paid || 0), 0) || 0;
    const pendingInvoices = invoices?.filter(inv => inv?.status === "Impayée" || inv?.status === "unpaid")?.length || 0;
    const totalPipeline = opportunities?.reduce((sum, opp) => sum + (opp?.value || 0), 0) || 0;
    const activeQuotes = quotes?.filter(q => q?.status === "pending" || q?.status === "draft")?.length || 0;
    const completedActivities = activities?.filter(a => a?.status === "completed")?.length || 0;

    return {
      totalRevenue,
      pendingInvoices,
      totalPipeline,
      activeQuotes,
      completedActivities,
      clientCount: clients?.length || 0,
      invoiceCount: invoices?.length || 0,
      opportunityCount: opportunities?.length || 0
    };
  }, [invoices, opportunities, quotes, activities, clients]);

  return (
    <DashboardLayout title="Tableau de bord">
      {/* Header avec actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Bienvenue sur SEKA 👋
          </h1>
          <p className="text-gray-500 mt-1">
            Voici un aperçu de votre activité aujourd'hui
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Actualiser
          </Button>
          <Link href="/sales/invoices">
            <Button variant="primary" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle facture
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <Alert variant="error" title="Erreur" className="mb-6">
          {error}
        </Alert>
      )}

      {/* KPIs Principaux */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          title="Chiffre d'Affaires"
          value={formatCurrency(calculatedStats.totalRevenue)}
          subtitle="Ce mois"
          trend={{ value: "+12.5%", type: "up" }}
          icon={DollarSign}
          iconColor="bg-emerald-500"
          loading={loading}
          href="/reports/sales"
        />
        <StatCard
          title="Clients Actifs"
          value={calculatedStats.clientCount}
          subtitle={`${stats?.documents_pending || 0} dossiers en attente`}
          trend={{ value: "+8%", type: "up" }}
          icon={Users}
          iconColor="bg-blue-500"
          loading={loading}
          href="/clients"
        />
        <StatCard
          title="Pipeline Commercial"
          value={formatCurrency(calculatedStats.totalPipeline)}
          subtitle={`${calculatedStats.opportunityCount} opportunités`}
          trend={{ value: "+15%", type: "up" }}
          icon={Target}
          iconColor="bg-violet-500"
          loading={loading}
          href="/crm/opportunities"
        />
        <StatCard
          title="Factures Impayées"
          value={calculatedStats.pendingInvoices}
          subtitle="À relancer"
          trend={calculatedStats.pendingInvoices > 0 ? { value: "Action requise", type: "down" } : undefined}
          icon={Receipt}
          iconColor={calculatedStats.pendingInvoices > 0 ? "bg-red-500" : "bg-gray-400"}
          loading={loading}
          href="/sales/invoices"
        />
      </div>

      {/* Modules Principaux */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <ModuleCard
          title="CRM & Ventes"
          description="Gérez vos clients, leads et opportunités"
          icon={Briefcase}
          href="/crm/opportunities"
          color="bg-blue-600/50"
          gradient="bg-gradient-to-br from-blue-500 to-blue-700"
          stats={[
            { label: "Opportunités", value: calculatedStats.opportunityCount },
            { label: "Devis actifs", value: calculatedStats.activeQuotes }
          ]}
        />
        <ModuleCard
          title="Facturation"
          description="Devis, factures et paiements"
          icon={Receipt}
          href="/sales/invoices"
          color="bg-emerald-600/50"
          gradient="bg-gradient-to-br from-emerald-500 to-emerald-700"
          stats={[
            { label: "Factures", value: calculatedStats.invoiceCount },
            { label: "À encaisser", value: calculatedStats.pendingInvoices }
          ]}
        />
        <ModuleCard
          title="Trésorerie"
          description="Cash flow et prévisions financières"
          icon={Wallet}
          href="/treasury"
          color="bg-orange-600/50"
          gradient="bg-gradient-to-br from-orange-500 to-orange-700"
          stats={[
            { label: "Solde", value: formatAmount(stats?.total_revenue || 0) },
            { label: "Prévisions", value: "90j" }
          ]}
        />
      </div>

      {/* Alertes */}
      {stats?.alerts && stats.alerts.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="h-5 w-5 text-orange-500" />
            <h2 className="text-lg font-semibold text-gray-900">Alertes importantes</h2>
            <Badge variant="warning">{stats.alerts.length}</Badge>
          </div>
          <div className="space-y-3">
            {stats.alerts.slice(0, 3).map((alert: any, idx: number) => (
              <Alert key={idx} variant={alert.type || "warning"} title={alert.title}>
                {alert.message}
              </Alert>
            ))}
          </div>
        </div>
      )}

      {/* Section Activité et Actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Activité Récente */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-500" />
                <h3 className="font-semibold text-gray-900">Activité Récente</h3>
              </div>
              <Link href="/crm/activities" className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center">
                Voir tout <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
            <div className="p-6">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-start gap-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-48 mb-2" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : stats?.recent_activities && stats.recent_activities.length > 0 ? (
                <div>
                  {stats.recent_activities.slice(0, 5).map((activity: any, idx: number) => (
                    <ActivityItem
                      key={idx}
                      icon={activity.action?.includes("facture") ? Receipt : 
                            activity.action?.includes("client") ? Users :
                            activity.action?.includes("paiement") ? CreditCard : FileText}
                      iconBg={activity.action?.includes("facture") ? "bg-emerald-500" : 
                              activity.action?.includes("client") ? "bg-blue-500" :
                              activity.action?.includes("paiement") ? "bg-violet-500" : "bg-gray-500"}
                      title={activity.action}
                      subtitle={activity.client}
                      time={activity.time}
                      amount={activity.amount}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500 font-medium">Aucune activité récente</p>
                  <p className="text-sm text-gray-400 mt-1">Vos dernières actions apparaîtront ici</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions Rapides */}
        <div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-6">
              <Zap className="h-5 w-5 text-yellow-500" />
              <h3 className="font-semibold text-gray-900">Actions Rapides</h3>
            </div>
            <div className="space-y-3">
              <QuickAction
                label="Nouvelle facture"
                description="Créer une facture client"
                icon={Receipt}
                href="/sales/invoices"
                color="bg-emerald-500"
              />
              <QuickAction
                label="Nouveau devis"
                description="Établir un devis commercial"
                icon={FileText}
                href="/sales/quotes"
                color="bg-blue-500"
              />
              <QuickAction
                label="Ajouter un client"
                description="Enregistrer un nouveau contact"
                icon={Users}
                href="/clients"
                color="bg-violet-500"
              />
              <QuickAction
                label="Trésorerie"
                description="Voir les flux de trésorerie"
                icon={TrendingUp}
                href="/treasury"
                color="bg-orange-500"
              />
              <QuickAction
                label="Rapports"
                description="Consulter les analyses"
                icon={BarChart3}
                href="/reports"
                color="bg-pink-500"
              />
            </div>
          </div>

          {/* Aide IA */}
          <div className="mt-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-6 text-white">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-5 w-5" />
              <h3 className="font-semibold">Assistant IA</h3>
            </div>
            <p className="text-sm text-white/80 mb-4">
              Notre assistant intelligent peut vous aider à analyser vos données et optimiser votre gestion.
            </p>
            <Link href="/intelligence">
              <Button variant="secondary" size="sm" className="w-full bg-white/20 hover:bg-white/30 border-0 text-white">
                Découvrir l'IA <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer Navigation Rapide */}
      <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
        {[
          { label: "Stock", icon: Package, href: "/stock", color: "text-amber-600 bg-amber-50" },
          { label: "RH", icon: Users, href: "/hr/employees", color: "text-teal-600 bg-teal-50" },
          { label: "Comptabilité", icon: BarChart3, href: "/accounting/journal", color: "text-indigo-600 bg-indigo-50" },
          { label: "Documents", icon: FileText, href: "/documents", color: "text-pink-600 bg-pink-50" },
          { label: "Paramètres", icon: Building2, href: "/settings", color: "text-gray-600 bg-gray-100" },
          { label: "Aide", icon: Sparkles, href: "/docs", color: "text-purple-600 bg-purple-50" },
        ].map((item, idx) => (
          <Link key={idx} href={item.href}>
            <div className={`${item.color} rounded-xl p-4 text-center hover:shadow-md transition-all cursor-pointer`}>
              <item.icon className="h-6 w-6 mx-auto mb-2" />
              <p className="text-sm font-medium">{item.label}</p>
            </div>
          </Link>
        ))}
      </div>
    </DashboardLayout>
  );
}
