import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { 
  BarChart3, TrendingUp, TrendingDown, Users, Target, Mail,
  MousePointer, Eye, Zap, DollarSign, Calendar, RefreshCw,
  ArrowUpRight, ArrowDownRight, Activity, PieChart
} from "lucide-react";

interface CRMStats {
  leads: {
    total: number;
    new_this_month: number;
    converted: number;
    conversion_rate: number;
    by_status: Record<string, number>;
    by_source: Record<string, number>;
  };
  contacts: {
    total: number;
    active: number;
    new_this_month: number;
  };
  opportunities: {
    total: number;
    open: number;
    won: number;
    lost: number;
    total_value: number;
    won_value: number;
    win_rate: number;
  };
  emails: {
    sent: number;
    opened: number;
    clicked: number;
    open_rate: number;
    click_rate: number;
  };
  campaigns: {
    total: number;
    active: number;
    sent: number;
    avg_open_rate: number;
    avg_click_rate: number;
  };
  automations: {
    total: number;
    active: number;
    executions: number;
    success_rate: number;
  };
}

export default function CRMAnalyticsPage() {
  const [stats, setStats] = useState<CRMStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("month");

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  useEffect(() => {
    fetchStats();
  }, [period]);

  const getHeaders = () => {
    const token = localStorage.getItem("seka_access_token");
    return { 
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    };
  };

  const fetchStats = async () => {
    setLoading(true);
    try {
      // Fetch multiple endpoints in parallel
      const [leadsRes, campaignsRes, automationsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/v1/crm/leads/stats`, { headers: getHeaders() }),
        fetch(`${API_BASE_URL}/api/v1/campaigns?limit=100`, { headers: getHeaders() }),
        fetch(`${API_BASE_URL}/api/v1/automations/stats`, { headers: getHeaders() })
      ]);

      // Process leads stats
      let leadsData = { total: 0, new_this_month: 0, converted: 0, conversion_rate: 0, by_status: {}, by_source: {} };
      if (leadsRes.ok) {
        const data = await leadsRes.json();
        leadsData = data;
      }

      // Process campaigns
      let campaignsData = { total: 0, active: 0, sent: 0, avg_open_rate: 0, avg_click_rate: 0 };
      if (campaignsRes.ok) {
        const data = await campaignsRes.json();
        const campaigns = data.campaigns || [];
        const sentCampaigns = campaigns.filter((c: any) => c.status === "sent");
        campaignsData = {
          total: campaigns.length,
          active: campaigns.filter((c: any) => c.status === "sending").length,
          sent: sentCampaigns.length,
          avg_open_rate: sentCampaigns.length > 0 
            ? Math.round(sentCampaigns.reduce((sum: number, c: any) => sum + c.open_rate, 0) / sentCampaigns.length)
            : 0,
          avg_click_rate: sentCampaigns.length > 0
            ? Math.round(sentCampaigns.reduce((sum: number, c: any) => sum + c.click_rate, 0) / sentCampaigns.length)
            : 0
        };
      }

      // Process automations
      let automationsData = { total: 0, active: 0, executions: 0, success_rate: 0 };
      if (automationsRes.ok) {
        const data = await automationsRes.json();
        automationsData = {
          total: data.total_automations || 0,
          active: data.active || 0,
          executions: data.total_executions || 0,
          success_rate: data.success_rate || 0
        };
      }

      setStats({
        leads: leadsData,
        contacts: { total: 0, active: 0, new_this_month: 0 },
        opportunities: { total: 0, open: 0, won: 0, lost: 0, total_value: 0, won_value: 0, win_rate: 0 },
        emails: { sent: 0, opened: 0, clicked: 0, open_rate: 0, click_rate: 0 },
        campaigns: campaignsData,
        automations: automationsData
      });
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XOF",
      maximumFractionDigits: 0
    }).format(num);
  };

  if (loading) {
    return (
      <DashboardLayout title="Analytics CRM">
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Analytics CRM">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Analytics CRM</h1>
            <p className="text-sm text-accents-5">
              Vue d'ensemble de vos performances commerciales
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-4 py-2 border rounded-lg bg-white"
            >
              <option value="week">Cette semaine</option>
              <option value="month">Ce mois</option>
              <option value="quarter">Ce trimestre</option>
              <option value="year">Cette année</option>
            </select>
            <Button variant="secondary" onClick={fetchStats}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-accents-5">Leads</span>
              <Users className="h-4 w-4 text-blue-500" />
            </div>
            <p className="text-3xl font-bold">{formatNumber(stats?.leads.total || 0)}</p>
            <div className="flex items-center gap-1 mt-1 text-xs">
              <span className="text-green-500 flex items-center">
                <ArrowUpRight className="h-3 w-3" />
                +{stats?.leads.new_this_month || 0}
              </span>
              <span className="text-accents-5">ce mois</span>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-accents-5">Taux conversion</span>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-3xl font-bold">{stats?.leads.conversion_rate || 0}%</p>
            <div className="flex items-center gap-1 mt-1 text-xs">
              <span className="text-accents-5">{stats?.leads.converted || 0} convertis</span>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-accents-5">Campagnes</span>
              <Mail className="h-4 w-4 text-purple-500" />
            </div>
            <p className="text-3xl font-bold">{stats?.campaigns.total || 0}</p>
            <div className="flex items-center gap-1 mt-1 text-xs">
              <span className="text-accents-5">{stats?.campaigns.sent || 0} envoyées</span>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-accents-5">Automatisations</span>
              <Zap className="h-4 w-4 text-yellow-500" />
            </div>
            <p className="text-3xl font-bold">{stats?.automations.active || 0}</p>
            <div className="flex items-center gap-1 mt-1 text-xs">
              <span className="text-accents-5">{formatNumber(stats?.automations.executions || 0)} exécutions</span>
            </div>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Leads by Status */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <PieChart className="h-5 w-5 text-primary" />
              Leads par statut
            </h3>
            <div className="space-y-3">
              {stats?.leads.by_status && Object.entries(stats.leads.by_status).map(([status, count]) => {
                const total = stats.leads.total || 1;
                const percentage = Math.round((count / total) * 100);
                const colors: Record<string, string> = {
                  new: "bg-blue-500",
                  contacted: "bg-yellow-500",
                  qualified: "bg-green-500",
                  proposal: "bg-purple-500",
                  negotiation: "bg-orange-500",
                  won: "bg-emerald-500",
                  lost: "bg-red-500"
                };
                return (
                  <div key={status}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="capitalize">{status}</span>
                      <span className="font-medium">{count} ({percentage}%)</span>
                    </div>
                    <div className="h-2 bg-accents-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${colors[status] || "bg-primary"} rounded-full transition-all`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {(!stats?.leads.by_status || Object.keys(stats.leads.by_status).length === 0) && (
                <p className="text-center text-accents-5 py-8">Aucune donnée</p>
              )}
            </div>
          </Card>

          {/* Leads by Source */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Leads par source
            </h3>
            <div className="space-y-3">
              {stats?.leads.by_source && Object.entries(stats.leads.by_source)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 6)
                .map(([source, count]) => {
                  const total = stats.leads.total || 1;
                  const percentage = Math.round((count / total) * 100);
                  return (
                    <div key={source}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="capitalize">{source.replace(/_/g, " ")}</span>
                        <span className="font-medium">{count}</span>
                      </div>
                      <div className="h-2 bg-accents-2 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              {(!stats?.leads.by_source || Object.keys(stats.leads.by_source).length === 0) && (
                <p className="text-center text-accents-5 py-8">Aucune donnée</p>
              )}
            </div>
          </Card>
        </div>

        {/* Email & Automation Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Email Performance */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Mail className="h-5 w-5 text-purple-500" />
              Performance Email
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-accents-1 rounded-lg">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">Taux d'ouverture</span>
                </div>
                <span className="text-xl font-bold">{stats?.campaigns.avg_open_rate || 0}%</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-accents-1 rounded-lg">
                <div className="flex items-center gap-2">
                  <MousePointer className="h-4 w-4 text-purple-500" />
                  <span className="text-sm">Taux de clic</span>
                </div>
                <span className="text-xl font-bold">{stats?.campaigns.avg_click_rate || 0}%</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-accents-1 rounded-lg">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Campagnes envoyées</span>
                </div>
                <span className="text-xl font-bold">{stats?.campaigns.sent || 0}</span>
              </div>
            </div>
          </Card>

          {/* Automation Performance */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              Automatisations
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-accents-1 rounded-lg">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Actives</span>
                </div>
                <span className="text-xl font-bold">{stats?.automations.active || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-accents-1 rounded-lg">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">Exécutions</span>
                </div>
                <span className="text-xl font-bold">{formatNumber(stats?.automations.executions || 0)}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-accents-1 rounded-lg">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-purple-500" />
                  <span className="text-sm">Taux de succès</span>
                </div>
                <span className="text-xl font-bold">{stats?.automations.success_rate || 0}%</span>
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Actions rapides</h3>
            <div className="space-y-3">
              <Button className="w-full justify-start" variant="secondary" onClick={() => window.location.href = "/crm/leads"}>
                <Users className="mr-2 h-4 w-4" />
                Voir tous les leads
              </Button>
              <Button className="w-full justify-start" variant="secondary" onClick={() => window.location.href = "/crm/campaigns"}>
                <Mail className="mr-2 h-4 w-4" />
                Gérer les campagnes
              </Button>
              <Button className="w-full justify-start" variant="secondary" onClick={() => window.location.href = "/crm/automations"}>
                <Zap className="mr-2 h-4 w-4" />
                Configurer les automatisations
              </Button>
              <Button className="w-full justify-start" variant="secondary" onClick={() => window.location.href = "/crm/segments"}>
                <Target className="mr-2 h-4 w-4" />
                Gérer les segments
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
