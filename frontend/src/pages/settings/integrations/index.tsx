import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { 
  Plug, Plus, Settings, Trash2, Play, Pause, CheckCircle,
  XCircle, RefreshCw, ExternalLink, Slack, Webhook, Zap
} from "lucide-react";

interface Integration {
  id: string;
  name: string;
  description: string;
  type: string;
  is_active: boolean;
  trigger_events: string[];
  last_sync_at: string | null;
  last_error: string | null;
  created_at: string;
}

const typeIcons: Record<string, any> = {
  slack: Slack,
  webhook: Webhook,
  zapier: Zap,
  custom: Plug
};

const typeLabels: Record<string, string> = {
  slack: "Slack",
  webhook: "Webhook",
  zapier: "Zapier",
  google_sheets: "Google Sheets",
  custom: "Personnalisé"
};

export default function IntegrationsPage() {
  const router = useRouter();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "webhook",
    config: { url: "", method: "POST", webhook_url: "" } as Record<string, string>,
    trigger_events: [] as string[]
  });

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const getHeaders = () => {
    const token = localStorage.getItem("seka_access_token");
    return { 
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    };
  };

  const fetchIntegrations = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/integrations`, {
        headers: getHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setIntegrations(data);
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveIntegration = async () => {
    try {
      const url = editingId 
        ? `${API_BASE_URL}/api/v1/integrations/${editingId}`
        : `${API_BASE_URL}/api/v1/integrations`;
      
      const res = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: getHeaders(),
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setShowModal(false);
        setEditingId(null);
        resetForm();
        fetchIntegrations();
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const toggleActive = async (id: string, currentState: boolean) => {
    try {
      await fetch(`${API_BASE_URL}/api/v1/integrations/${id}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify({ is_active: !currentState })
      });
      fetchIntegrations();
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const testIntegration = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/integrations/${id}/test`, {
        method: "POST",
        headers: getHeaders()
      });
      const data = await res.json();
      alert(data.success ? "Test réussi !" : `Erreur: ${data.error}`);
    } catch (error) {
      alert("Erreur de test");
    }
  };

  const deleteIntegration = async (id: string) => {
    if (!confirm("Supprimer cette intégration ?")) return;
    
    try {
      await fetch(`${API_BASE_URL}/api/v1/integrations/${id}`, {
        method: "DELETE",
        headers: getHeaders()
      });
      fetchIntegrations();
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      type: "webhook",
      config: { url: "", method: "POST" },
      trigger_events: []
    });
  };

  const triggerEvents = [
    { value: "lead_created", label: "Lead créé" },
    { value: "lead_converted", label: "Lead converti" },
    { value: "opportunity_won", label: "Opportunité gagnée" },
    { value: "opportunity_lost", label: "Opportunité perdue" },
    { value: "campaign_sent", label: "Campagne envoyée" },
    { value: "email_opened", label: "Email ouvert" }
  ];

  return (
    <DashboardLayout title="Intégrations">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Intégrations</h1>
            <p className="text-sm text-accents-5">Connectez vos outils externes</p>
          </div>
          <Button onClick={() => { resetForm(); setShowModal(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle intégration
          </Button>
        </div>

        {/* Integration Types */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { type: "slack", label: "Slack", desc: "Notifications Slack" },
            { type: "webhook", label: "Webhook", desc: "Appels HTTP" },
            { type: "zapier", label: "Zapier", desc: "Automatisations" },
            { type: "custom", label: "Personnalisé", desc: "API custom" }
          ].map((item) => {
            const Icon = typeIcons[item.type] || Plug;
            return (
              <Card 
                key={item.type}
                className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => {
                  setFormData({ ...formData, type: item.type });
                  setShowModal(true);
                }}
              >
                <Icon className="h-8 w-8 text-primary mb-2" />
                <h3 className="font-medium">{item.label}</h3>
                <p className="text-xs text-accents-5">{item.desc}</p>
              </Card>
            );
          })}
        </div>

        {/* Integrations List */}
        <Card>
          <div className="p-4 border-b">
            <h2 className="font-semibold">Intégrations configurées</h2>
          </div>

          {integrations.length === 0 ? (
            <div className="p-8 text-center text-accents-5">
              <Plug className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucune intégration configurée</p>
            </div>
          ) : (
            <div className="divide-y">
              {integrations.map((integration) => {
                const Icon = typeIcons[integration.type] || Plug;
                return (
                  <div key={integration.id} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${integration.is_active ? "bg-green-100" : "bg-accents-2"}`}>
                        <Icon className={`h-5 w-5 ${integration.is_active ? "text-green-600" : "text-accents-5"}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{integration.name}</h3>
                          <Badge variant={integration.is_active ? "success" : "default"}>
                            {integration.is_active ? "Actif" : "Inactif"}
                          </Badge>
                        </div>
                        <p className="text-sm text-accents-5">
                          {typeLabels[integration.type]} • {integration.trigger_events?.length || 0} événements
                        </p>
                        {integration.last_error && (
                          <p className="text-xs text-red-500 mt-1">{integration.last_error}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => testIntegration(integration.id)}
                        title="Tester"
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleActive(integration.id, integration.is_active)}
                        title={integration.is_active ? "Désactiver" : "Activer"}
                      >
                        {integration.is_active ? (
                          <Pause className="h-4 w-4 text-yellow-500" />
                        ) : (
                          <Play className="h-4 w-4 text-green-500" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteIntegration(integration.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-lg p-6">
              <h2 className="text-lg font-semibold mb-4">
                {editingId ? "Modifier" : "Nouvelle"} intégration
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nom</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Mon intégration"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="webhook">Webhook</option>
                    <option value="slack">Slack</option>
                    <option value="zapier">Zapier</option>
                    <option value="custom">Personnalisé</option>
                  </select>
                </div>

                {(formData.type === "webhook" || formData.type === "zapier") && (
                  <div>
                    <label className="block text-sm font-medium mb-1">URL</label>
                    <Input
                      value={formData.config.url || ""}
                      onChange={(e) => setFormData({
                        ...formData,
                        config: { ...formData.config, url: e.target.value }
                      })}
                      placeholder="https://..."
                    />
                  </div>
                )}

                {formData.type === "slack" && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Webhook Slack</label>
                    <Input
                      value={formData.config.webhook_url || ""}
                      onChange={(e) => setFormData({
                        ...formData,
                        config: { ...formData.config, webhook_url: e.target.value }
                      })}
                      placeholder="https://hooks.slack.com/..."
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2">Événements déclencheurs</label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {triggerEvents.map((event) => (
                      <label key={event.value} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.trigger_events.includes(event.value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                trigger_events: [...formData.trigger_events, event.value]
                              });
                            } else {
                              setFormData({
                                ...formData,
                                trigger_events: formData.trigger_events.filter(v => v !== event.value)
                              });
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm">{event.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button variant="secondary" onClick={() => { setShowModal(false); setEditingId(null); }}>
                  Annuler
                </Button>
                <Button onClick={saveIntegration}>
                  {editingId ? "Mettre à jour" : "Créer"}
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
