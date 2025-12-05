import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { 
  Zap, Plus, Search, Play, Pause, Trash2, Eye, Settings,
  CheckCircle, XCircle, Clock, BarChart3, TrendingUp
} from "lucide-react";

interface Automation {
  id: string;
  name: string;
  description: string;
  trigger_type: string;
  trigger_config: Record<string, any>;
  status: string;
  action_count: number;
  execution_count: number;
  success_count: number;
  error_count: number;
  last_executed_at: string | null;
  created_at: string;
}

const statusConfig: Record<string, { label: string; variant: "default" | "success" | "warning" | "error" }> = {
  draft: { label: "Brouillon", variant: "default" },
  active: { label: "Active", variant: "success" },
  paused: { label: "En pause", variant: "warning" },
  archived: { label: "Archivée", variant: "error" },
};

const triggerLabels: Record<string, string> = {
  lead_created: "Lead créé",
  lead_status_changed: "Statut lead changé",
  lead_score_changed: "Score lead changé",
  lead_assigned: "Lead assigné",
  contact_created: "Contact créé",
  contact_updated: "Contact modifié",
  opportunity_created: "Opportunité créée",
  opportunity_stage_changed: "Étape opportunité changée",
  opportunity_won: "Opportunité gagnée",
  opportunity_lost: "Opportunité perdue",
  email_opened: "Email ouvert",
  email_clicked: "Lien email cliqué",
  email_bounced: "Email rebondi",
  scheduled: "Programmé",
  inactivity: "Inactivité",
};

export default function AutomationsPage() {
  const router = useRouter();
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    paused: 0,
    totalExecutions: 0,
    successRate: 0
  });

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  useEffect(() => {
    fetchAutomations();
    fetchStats();
  }, [statusFilter]);

  const getHeaders = () => {
    const token = localStorage.getItem("seka_access_token");
    return { 
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    };
  };

  const fetchAutomations = async () => {
    setLoading(true);
    try {
      const url = statusFilter 
        ? `${API_BASE_URL}/api/v1/automations?status=${statusFilter}`
        : `${API_BASE_URL}/api/v1/automations`;
      
      const res = await fetch(url, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setAutomations(data);
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/automations/stats`, {
        headers: getHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setStats({
          total: data.total_automations,
          active: data.active,
          paused: data.paused,
          totalExecutions: data.total_executions,
          successRate: data.success_rate
        });
      }
    } catch (error) {
      console.error("Erreur stats:", error);
    }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    const endpoint = currentStatus === "active" ? "pause" : "activate";
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/automations/${id}/${endpoint}`, {
        method: "POST",
        headers: getHeaders()
      });
      if (res.ok) {
        fetchAutomations();
        fetchStats();
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const deleteAutomation = async (id: string) => {
    if (!confirm("Supprimer cette automatisation ?")) return;
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/automations/${id}`, {
        method: "DELETE",
        headers: getHeaders()
      });
      if (res.ok) {
        fetchAutomations();
        fetchStats();
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const filteredAutomations = automations.filter(a =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    triggerLabels[a.trigger_type]?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Jamais";
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <DashboardLayout title="Automatisations">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Automatisations</h1>
            <p className="text-sm text-accents-5">
              Automatisez vos workflows CRM
            </p>
          </div>
          <Button onClick={() => router.push("/crm/automations/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle automatisation
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-accents-5">Total</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Play className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.active}</p>
                <p className="text-xs text-accents-5">Actives</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Pause className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.paused}</p>
                <p className="text-xs text-accents-5">En pause</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalExecutions}</p>
                <p className="text-xs text-accents-5">Exécutions</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.successRate}%</p>
                <p className="text-xs text-accents-5">Taux succès</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-accents-5" />
              <Input
                placeholder="Rechercher une automatisation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg bg-white"
            >
              <option value="">Tous les statuts</option>
              <option value="active">Actives</option>
              <option value="paused">En pause</option>
              <option value="draft">Brouillons</option>
            </select>
          </div>
        </Card>

        {/* Automations List */}
        <Card>
          {loading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : filteredAutomations.length === 0 ? (
            <div className="p-12 text-center">
              <Zap className="h-12 w-12 text-accents-4 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Aucune automatisation</h3>
              <p className="text-accents-5 mb-4">
                Créez votre première automatisation pour gagner du temps
              </p>
              <Button onClick={() => router.push("/crm/automations/new")}>
                <Plus className="mr-2 h-4 w-4" />
                Créer une automatisation
              </Button>
            </div>
          ) : (
            <div className="divide-y">
              {filteredAutomations.map((automation) => {
                const status = statusConfig[automation.status] || statusConfig.draft;
                const successRate = automation.execution_count > 0 
                  ? Math.round((automation.success_count / automation.execution_count) * 100)
                  : 0;
                
                return (
                  <div
                    key={automation.id}
                    className="p-4 hover:bg-accents-1 cursor-pointer transition-colors"
                    onClick={() => router.push(`/crm/automations/${automation.id}`)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <div className={`p-1.5 rounded-lg ${automation.status === "active" ? "bg-green-100" : "bg-accents-2"}`}>
                            <Zap className={`h-4 w-4 ${automation.status === "active" ? "text-green-600" : "text-accents-5"}`} />
                          </div>
                          <h3 className="font-medium truncate">{automation.name}</h3>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </div>
                        <p className="text-sm text-accents-5 mb-2 ml-9">
                          Déclencheur: {triggerLabels[automation.trigger_type] || automation.trigger_type}
                        </p>
                        <div className="flex flex-wrap items-center gap-4 text-xs text-accents-5 ml-9">
                          <span className="flex items-center gap-1">
                            <Settings className="h-3 w-3" />
                            {automation.action_count} action{automation.action_count > 1 ? "s" : ""}
                          </span>
                          <span className="flex items-center gap-1">
                            <BarChart3 className="h-3 w-3" />
                            {automation.execution_count} exécution{automation.execution_count > 1 ? "s" : ""}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Dernière: {formatDate(automation.last_executed_at)}
                          </span>
                        </div>
                      </div>

                      {/* Stats */}
                      {automation.execution_count > 0 && (
                        <div className="flex items-center gap-4 text-sm">
                          <div className="text-center">
                            <div className="flex items-center gap-1">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span className="font-semibold">{automation.success_count}</span>
                            </div>
                            <p className="text-xs text-accents-5">Succès</p>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center gap-1">
                              <XCircle className="h-4 w-4 text-red-500" />
                              <span className="font-semibold">{automation.error_count}</span>
                            </div>
                            <p className="text-xs text-accents-5">Erreurs</p>
                          </div>
                          <div className="text-center">
                            <p className="font-semibold text-primary">{successRate}%</p>
                            <p className="text-xs text-accents-5">Taux</p>
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleStatus(automation.id, automation.status)}
                          title={automation.status === "active" ? "Mettre en pause" : "Activer"}
                        >
                          {automation.status === "active" ? (
                            <Pause className="h-4 w-4 text-yellow-500" />
                          ) : (
                            <Play className="h-4 w-4 text-green-500" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/crm/automations/${automation.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {automation.status !== "active" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteAutomation(automation.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
