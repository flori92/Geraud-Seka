import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { 
  ArrowLeft, Zap, Play, Pause, Trash2, Settings, Edit,
  CheckCircle, XCircle, Clock, BarChart3, RefreshCw,
  ChevronRight, AlertTriangle
} from "lucide-react";

interface Automation {
  id: string;
  name: string;
  description: string;
  trigger_type: string;
  trigger_config: Record<string, any>;
  conditions: any[];
  status: string;
  execution_count: number;
  success_count: number;
  error_count: number;
  last_executed_at: string | null;
  actions: {
    id: string;
    action_type: string;
    config: Record<string, any>;
    order: number;
  }[];
  created_at: string;
  created_by: string;
}

interface Execution {
  id: string;
  entity_type: string;
  entity_id: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  actions_completed: number;
  error_message: string | null;
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

const actionLabels: Record<string, string> = {
  send_email: "Envoyer un email",
  add_to_campaign: "Ajouter à une campagne",
  update_lead: "Modifier le lead",
  update_contact: "Modifier le contact",
  update_opportunity: "Modifier l'opportunité",
  assign_to_user: "Assigner à un utilisateur",
  add_to_segment: "Ajouter à un segment",
  remove_from_segment: "Retirer d'un segment",
  create_activity: "Créer une activité",
  create_task: "Créer une tâche",
  send_notification: "Envoyer une notification",
  send_webhook: "Appeler un webhook",
  wait: "Attendre",
  condition: "Condition",
};

export default function AutomationDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  
  const [automation, setAutomation] = useState<Automation | null>(null);
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  useEffect(() => {
    if (id) {
      fetchAutomation();
    }
  }, [id]);

  const getHeaders = () => {
    const token = localStorage.getItem("seka_access_token");
    return { 
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    };
  };

  const fetchAutomation = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/automations/${id}`, {
        headers: getHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setAutomation(data);
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchExecutions = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/automations/${id}/executions?limit=50`, {
        headers: getHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setExecutions(data.executions || []);
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const toggleStatus = async () => {
    if (!automation) return;
    
    const endpoint = automation.status === "active" ? "pause" : "activate";
    setActionLoading(true);
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/automations/${id}/${endpoint}`, {
        method: "POST",
        headers: getHeaders()
      });
      if (res.ok) {
        fetchAutomation();
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const deleteAutomation = async () => {
    if (!confirm("Supprimer cette automatisation ?")) return;
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/automations/${id}`, {
        method: "DELETE",
        headers: getHeaders()
      });
      if (res.ok) {
        router.push("/crm/automations");
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("fr-FR");
  };

  if (loading) {
    return (
      <DashboardLayout title="Chargement...">
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!automation) {
    return (
      <DashboardLayout title="Automatisation non trouvée">
        <div className="text-center py-12">
          <p className="text-accents-5">Automatisation non trouvée</p>
          <Button className="mt-4" onClick={() => router.push("/crm/automations")}>
            Retour aux automatisations
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const status = statusConfig[automation.status] || statusConfig.draft;
  const successRate = automation.execution_count > 0 
    ? Math.round((automation.success_count / automation.execution_count) * 100)
    : 0;

  return (
    <DashboardLayout title={automation.name}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.push("/crm/automations")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${automation.status === "active" ? "bg-green-100" : "bg-accents-2"}`}>
                  <Zap className={`h-5 w-5 ${automation.status === "active" ? "text-green-600" : "text-accents-5"}`} />
                </div>
                <h1 className="text-2xl font-bold">{automation.name}</h1>
                <Badge variant={status.variant}>{status.label}</Badge>
              </div>
              <p className="text-sm text-accents-5 mt-1">
                {triggerLabels[automation.trigger_type] || automation.trigger_type}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              variant="secondary" 
              onClick={toggleStatus}
              disabled={actionLoading || (automation.status === "draft" && automation.actions.length === 0)}
            >
              {automation.status === "active" ? (
                <>
                  <Pause className="mr-2 h-4 w-4" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Activer
                </>
              )}
            </Button>
            {automation.status !== "active" && (
              <Button variant="ghost" onClick={deleteAutomation}>
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 text-center">
            <BarChart3 className="h-5 w-5 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{automation.execution_count}</p>
            <p className="text-xs text-accents-5">Exécutions</p>
          </Card>
          <Card className="p-4 text-center">
            <CheckCircle className="h-5 w-5 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{automation.success_count}</p>
            <p className="text-xs text-accents-5">Succès</p>
          </Card>
          <Card className="p-4 text-center">
            <XCircle className="h-5 w-5 text-red-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{automation.error_count}</p>
            <p className="text-xs text-accents-5">Erreurs</p>
          </Card>
          <Card className="p-4 text-center">
            <RefreshCw className="h-5 w-5 text-purple-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{successRate}%</p>
            <p className="text-xs text-accents-5">Taux succès</p>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(val) => { setActiveTab(val); if (val === "history") fetchExecutions(); }}>
          <TabsList>
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="actions">Actions ({automation.actions.length})</TabsTrigger>
            <TabsTrigger value="history">Historique</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Infos */}
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Informations</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-accents-5">Créée le:</span>
                    <span>{formatDate(automation.created_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-accents-5">Créée par:</span>
                    <span>{automation.created_by || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-accents-5">Dernière exécution:</span>
                    <span>{formatDate(automation.last_executed_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-accents-5">Nombre d'actions:</span>
                    <span>{automation.actions.length}</span>
                  </div>
                </div>
                {automation.description && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-accents-5">{automation.description}</p>
                  </div>
                )}
              </Card>

              {/* Déclencheur */}
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Déclencheur</h3>
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Zap className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{triggerLabels[automation.trigger_type]}</p>
                      <p className="text-xs text-accents-5">{automation.trigger_type}</p>
                    </div>
                  </div>
                  {automation.trigger_config && Object.keys(automation.trigger_config).length > 0 && (
                    <div className="mt-3 pt-3 border-t border-primary/20">
                      <p className="text-xs text-accents-5 mb-2">Configuration:</p>
                      <pre className="text-xs bg-white p-2 rounded overflow-x-auto">
                        {JSON.stringify(automation.trigger_config, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="actions">
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Séquence d'actions</h3>
              
              {automation.actions.length === 0 ? (
                <div className="text-center py-8">
                  <Settings className="h-12 w-12 text-accents-4 mx-auto mb-4" />
                  <p className="text-accents-5">Aucune action configurée</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {automation.actions
                    .sort((a, b) => a.order - b.order)
                    .map((action, index) => (
                      <div key={action.id} className="flex items-start gap-4">
                        {/* Numéro */}
                        <div className="flex flex-col items-center">
                          <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </div>
                          {index < automation.actions.length - 1 && (
                            <div className="w-0.5 h-8 bg-accents-3 mt-2" />
                          )}
                        </div>
                        
                        {/* Contenu */}
                        <div className="flex-1 p-4 border rounded-lg bg-accents-1">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">
                              {actionLabels[action.action_type] || action.action_type}
                            </span>
                            <Badge>{action.action_type}</Badge>
                          </div>
                          {action.config && Object.keys(action.config).length > 0 && (
                            <div className="text-sm text-accents-5">
                              {Object.entries(action.config).map(([key, value]) => (
                                <div key={key} className="flex gap-2">
                                  <span className="capitalize">{key.replace(/_/g, " ")}:</span>
                                  <span className="font-medium text-foreground">{String(value)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              {executions.length === 0 ? (
                <div className="p-8 text-center">
                  <Clock className="h-12 w-12 text-accents-4 mx-auto mb-4" />
                  <p className="text-accents-5">Aucune exécution</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-accents-1">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-accents-5">Statut</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-accents-5">Entité</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-accents-5">Démarré</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-accents-5">Terminé</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-accents-5">Actions</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-accents-5">Erreur</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {executions.map((exec) => (
                        <tr key={exec.id} className="hover:bg-accents-1">
                          <td className="px-4 py-3">
                            <Badge variant={exec.status === "completed" ? "success" : exec.status === "failed" ? "error" : "warning"}>
                              {exec.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className="capitalize">{exec.entity_type}</span>
                          </td>
                          <td className="px-4 py-3 text-sm">{formatDate(exec.started_at)}</td>
                          <td className="px-4 py-3 text-sm">{formatDate(exec.completed_at)}</td>
                          <td className="px-4 py-3 text-sm">{exec.actions_completed}</td>
                          <td className="px-4 py-3 text-sm">
                            {exec.error_message ? (
                              <span className="text-red-500 truncate max-w-xs block" title={exec.error_message}>
                                {exec.error_message.substring(0, 50)}...
                              </span>
                            ) : (
                              "-"
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
