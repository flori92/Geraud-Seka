/**
 * CRM Dashboard
 * Vue d'ensemble du module CRM avec statistiques et accès rapide
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
  getLeads,
  getOpportunities,
  getCRMActivities,
  type Lead,
  type Opportunity,
  type CRMActivity
} from "@/lib/api";
import { formatCurrency } from "@/lib/formatters";
import {
  Users,
  Target,
  Calendar,
  TrendingUp,
  ArrowRight,
  Plus,
  Phone,
  Mail,
  MessageSquare,
  CheckCircle,
  Clock,
  DollarSign,
  Activity,
  BarChart3,
  ChevronRight
} from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  color: string;
  href?: string;
  loading?: boolean;
}

function StatCard({ title, value, subtitle, icon: Icon, color, href, loading }: StatCardProps) {
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
      <div className={`inline-flex rounded-xl ${color} p-3 mb-4`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      <p className="text-sm font-medium text-gray-500">{title}</p>
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

export default function CRMDashboardPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [activities, setActivities] = useState<CRMActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("seka_access_token");
      if (!token) return;

      const [leadsData, oppsData, activitiesData] = await Promise.allSettled([
        getLeads(token),
        getOpportunities(token),
        getCRMActivities(token)
      ]);

      if (leadsData.status === "fulfilled") setLeads(leadsData.value);
      if (oppsData.status === "fulfilled") setOpportunities(oppsData.value);
      if (activitiesData.status === "fulfilled") setActivities(activitiesData.value);

      setError(null);
    } catch (err: any) {
      setError("Erreur lors du chargement des données CRM");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Calculs des statistiques
  const stats = useMemo(() => {
    const totalLeads = leads?.length || 0;
    const newLeads = leads?.filter(l => l?.status === "new" || l?.status === "nouveau")?.length || 0;
    const qualifiedLeads = leads?.filter(l => l?.status === "qualified" || l?.status === "qualifié")?.length || 0;
    
    const totalOpportunities = opportunities?.length || 0;
    const pipelineValue = opportunities?.reduce((sum, opp) => sum + (opp?.value || 0), 0) || 0;
    const wonOpportunities = opportunities?.filter(o => o?.stage === "won" || o?.stage === "gagné")?.length || 0;
    const conversionRate = totalOpportunities > 0 ? Math.round((wonOpportunities / totalOpportunities) * 100) : 0;
    
    const pendingActivities = activities?.filter(a => a?.status === "pending" || a?.status === "scheduled")?.length || 0;
    const completedActivities = activities?.filter(a => a?.status === "completed")?.length || 0;
    const todayActivities = activities?.filter(a => {
      const actDate = new Date(a?.date);
      const today = new Date();
      return actDate.toDateString() === today.toDateString();
    })?.length || 0;

    return {
      totalLeads,
      newLeads,
      qualifiedLeads,
      totalOpportunities,
      pipelineValue,
      wonOpportunities,
      conversionRate,
      pendingActivities,
      completedActivities,
      todayActivities
    };
  }, [leads, opportunities, activities]);

  // Activités récentes
  const recentActivities = useMemo(() => {
    return activities
      ?.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      ?.slice(0, 5) || [];
  }, [activities]);

  const getActivityIcon = (type: string) => {
    switch(type) {
      case "call": return Phone;
      case "email": return Mail;
      case "meeting": return Calendar;
      default: return MessageSquare;
    }
  };

  return (
    <DashboardLayout title="CRM">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Gestion de la Relation Client
          </h1>
          <p className="text-gray-500 mt-1">
            Gérez vos leads, opportunités et activités commerciales
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/crm/leads">
            <Button variant="secondary" size="sm">
              <Users className="h-4 w-4 mr-2" />
              Leads
            </Button>
          </Link>
          <Link href="/crm/opportunities">
            <Button variant="primary" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle opportunité
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
          title="Total Leads"
          value={stats.totalLeads}
          subtitle={`${stats.newLeads} nouveaux`}
          icon={Users}
          color="bg-blue-500"
          href="/crm/leads"
          loading={loading}
        />
        <StatCard
          title="Opportunités"
          value={stats.totalOpportunities}
          subtitle={`${stats.conversionRate}% conversion`}
          icon={Target}
          color="bg-violet-500"
          href="/crm/opportunities"
          loading={loading}
        />
        <StatCard
          title="Pipeline"
          value={formatCurrency(stats.pipelineValue)}
          subtitle="Valeur totale"
          icon={DollarSign}
          color="bg-emerald-500"
          href="/crm/opportunities"
          loading={loading}
        />
        <StatCard
          title="Activités"
          value={stats.pendingActivities}
          subtitle={`${stats.todayActivities} aujourd'hui`}
          icon={Activity}
          color="bg-orange-500"
          href="/crm/activities"
          loading={loading}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Pipeline visuel */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Pipeline Commercial</h3>
              <Link href="/crm/opportunities" className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center">
                Voir tout <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </div>

            {loading ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <div className="space-y-4">
                {[
                  { stage: "Prospection", count: opportunities?.filter(o => o.stage === "prospecting" || o.stage === "prospection").length || 0, color: "bg-gray-400" },
                  { stage: "Qualification", count: opportunities?.filter(o => o.stage === "qualification").length || 0, color: "bg-blue-400" },
                  { stage: "Proposition", count: opportunities?.filter(o => o.stage === "proposal" || o.stage === "proposition").length || 0, color: "bg-yellow-400" },
                  { stage: "Négociation", count: opportunities?.filter(o => o.stage === "negotiation" || o.stage === "négociation").length || 0, color: "bg-orange-400" },
                  { stage: "Gagné", count: opportunities?.filter(o => o.stage === "won" || o.stage === "gagné").length || 0, color: "bg-emerald-500" },
                ].map((item, idx) => {
                  const percentage = stats.totalOpportunities > 0 ? (item.count / stats.totalOpportunities) * 100 : 0;
                  return (
                    <div key={idx} className="flex items-center gap-4">
                      <div className="w-28 text-sm font-medium text-gray-600">{item.stage}</div>
                      <div className="flex-1 h-8 bg-gray-100 rounded-lg overflow-hidden">
                        <div 
                          className={`h-full ${item.color} flex items-center justify-end px-2`}
                          style={{ width: `${Math.max(percentage, 5)}%` }}
                        >
                          <span className="text-xs font-semibold text-white">{item.count}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Actions rapides */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Actions rapides</h3>
          <QuickAction icon={Users} label="Nouveau lead" href="/crm/leads" color="bg-blue-500" />
          <QuickAction icon={Target} label="Nouvelle opportunité" href="/crm/opportunities" color="bg-violet-500" />
          <QuickAction icon={Calendar} label="Planifier activité" href="/crm/activities" color="bg-orange-500" />
          <QuickAction icon={BarChart3} label="Rapport ventes" href="/reports/sales" color="bg-emerald-500" />
        </div>
      </div>

      {/* Activités récentes */}
      <div className="mt-8">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Activités récentes</h3>
            <Link href="/crm/activities" className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center">
              Voir tout <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-48 mb-2" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentActivities.length > 0 ? (
              <div className="space-y-4">
                {recentActivities.map((activity, idx) => {
                  const Icon = getActivityIcon(activity.type);
                  return (
                    <div key={idx} className="flex items-start gap-4 py-3 border-b border-gray-50 last:border-0">
                      <div className={`rounded-full p-2.5 ${
                        activity.status === "completed" ? "bg-emerald-100" : "bg-blue-100"
                      }`}>
                        <Icon className={`h-4 w-4 ${
                          activity.status === "completed" ? "text-emerald-600" : "text-blue-600"
                        }`} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {activity.client_name || "Client"} • {new Date(activity.date).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                      <Badge variant={activity.status === "completed" ? "success" : "default"}>
                        {activity.status === "completed" ? "Terminé" : "Planifié"}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500 font-medium">Aucune activité récente</p>
                <Link href="/crm/activities">
                  <Button variant="primary" size="sm" className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Créer une activité
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
