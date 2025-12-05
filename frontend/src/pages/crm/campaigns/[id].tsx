import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { 
  ArrowLeft, Mail, Users, Send, Pause, Play, Trash2, Eye,
  MousePointer, BarChart3, Clock, CheckCircle, XCircle,
  RefreshCw, Download, AlertTriangle
} from "lucide-react";

interface Campaign {
  id: string;
  name: string;
  description: string;
  status: string;
  subject: string;
  html_content: string;
  from_name: string;
  from_email: string;
  template: { id: string; name: string } | null;
  segment: { id: string; name: string; member_count: number } | null;
  target_entity_type: string;
  scheduled_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  stats: {
    total_recipients: number;
    sent_count: number;
    delivered_count: number;
    opened_count: number;
    clicked_count: number;
    bounced_count: number;
    unsubscribed_count: number;
    open_rate: number;
    click_rate: number;
    bounce_rate: number;
  };
  created_at: string;
  created_by: string;
}

interface Recipient {
  id: string;
  email: string;
  status: string;
  sent_at: string | null;
  opened: boolean;
  opened_at: string | null;
  clicked: boolean;
  clicked_at: string | null;
  entity_type: string;
  entity_name: string;
  error_message: string | null;
}

const statusConfig: Record<string, { label: string; variant: "default" | "success" | "warning" | "error" }> = {
  draft: { label: "Brouillon", variant: "default" },
  scheduled: { label: "Programmée", variant: "default" },
  sending: { label: "En cours", variant: "warning" },
  sent: { label: "Envoyée", variant: "success" },
  paused: { label: "En pause", variant: "warning" },
  cancelled: { label: "Annulée", variant: "error" },
};

export default function CampaignDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  useEffect(() => {
    if (id) {
      fetchCampaign();
    }
  }, [id]);

  const getHeaders = () => {
    const token = localStorage.getItem("seka_access_token");
    return { 
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    };
  };

  const fetchCampaign = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/campaigns/${id}`, {
        headers: getHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setCampaign(data);
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecipients = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/campaigns/${id}/recipients?limit=100`, {
        headers: getHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setRecipients(data.recipients || []);
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const prepareCampaign = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/campaigns/${id}/prepare`, {
        method: "POST",
        headers: getHeaders()
      });
      if (res.ok) {
        fetchCampaign();
        fetchRecipients();
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const sendCampaign = async () => {
    if (!confirm("Lancer l'envoi de la campagne ?")) return;
    
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/campaigns/${id}/send`, {
        method: "POST",
        headers: getHeaders()
      });
      if (res.ok) {
        fetchCampaign();
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const pauseCampaign = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/campaigns/${id}/pause`, {
        method: "POST",
        headers: getHeaders()
      });
      if (res.ok) {
        fetchCampaign();
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setActionLoading(false);
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

  if (!campaign) {
    return (
      <DashboardLayout title="Campagne non trouvée">
        <div className="text-center py-12">
          <p className="text-accents-5">Campagne non trouvée</p>
          <Button className="mt-4" onClick={() => router.push("/crm/campaigns")}>
            Retour aux campagnes
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const status = statusConfig[campaign.status] || statusConfig.draft;

  return (
    <DashboardLayout title={campaign.name}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.push("/crm/campaigns")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{campaign.name}</h1>
                <Badge variant={status.variant}>{status.label}</Badge>
              </div>
              <p className="text-sm text-accents-5">{campaign.subject}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {campaign.status === "draft" && (
              <>
                <Button variant="secondary" onClick={prepareCampaign} disabled={actionLoading}>
                  <RefreshCw className={`mr-2 h-4 w-4 ${actionLoading ? "animate-spin" : ""}`} />
                  Préparer
                </Button>
                <Button onClick={sendCampaign} disabled={actionLoading || campaign.stats.total_recipients === 0}>
                  <Send className="mr-2 h-4 w-4" />
                  Envoyer
                </Button>
              </>
            )}
            {campaign.status === "sending" && (
              <Button variant="secondary" onClick={pauseCampaign} disabled={actionLoading}>
                <Pause className="mr-2 h-4 w-4" />
                Pause
              </Button>
            )}
            {campaign.status === "paused" && (
              <Button onClick={sendCampaign} disabled={actionLoading}>
                <Play className="mr-2 h-4 w-4" />
                Reprendre
              </Button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <Card className="p-4 text-center">
            <Users className="h-5 w-5 text-accents-5 mx-auto mb-2" />
            <p className="text-2xl font-bold">{campaign.stats.total_recipients}</p>
            <p className="text-xs text-accents-5">Destinataires</p>
          </Card>
          <Card className="p-4 text-center">
            <Send className="h-5 w-5 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{campaign.stats.sent_count}</p>
            <p className="text-xs text-accents-5">Envoyés</p>
          </Card>
          <Card className="p-4 text-center">
            <Eye className="h-5 w-5 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{campaign.stats.open_rate}%</p>
            <p className="text-xs text-accents-5">Taux ouverture</p>
          </Card>
          <Card className="p-4 text-center">
            <MousePointer className="h-5 w-5 text-purple-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{campaign.stats.click_rate}%</p>
            <p className="text-xs text-accents-5">Taux clic</p>
          </Card>
          <Card className="p-4 text-center">
            <XCircle className="h-5 w-5 text-red-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{campaign.stats.bounced_count}</p>
            <p className="text-xs text-accents-5">Rebonds</p>
          </Card>
          <Card className="p-4 text-center">
            <AlertTriangle className="h-5 w-5 text-orange-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{campaign.stats.unsubscribed_count}</p>
            <p className="text-xs text-accents-5">Désinscrits</p>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(val) => { setActiveTab(val); if (val === "recipients") fetchRecipients(); }}>
          <TabsList>
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="recipients">Destinataires</TabsTrigger>
            <TabsTrigger value="preview">Aperçu</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Infos */}
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Informations</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-accents-5">Créée le:</span>
                    <span>{formatDate(campaign.created_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-accents-5">Créée par:</span>
                    <span>{campaign.created_by || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-accents-5">Template:</span>
                    <span>{campaign.template?.name || "Aucun"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-accents-5">Segment:</span>
                    <span>{campaign.segment?.name || "Tous"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-accents-5">Type:</span>
                    <span className="capitalize">{campaign.target_entity_type}s</span>
                  </div>
                </div>
              </Card>

              {/* Timeline */}
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Timeline</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">Créée</p>
                      <p className="text-xs text-accents-5">{formatDate(campaign.created_at)}</p>
                    </div>
                  </div>
                  {campaign.scheduled_at && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <Clock className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">Programmée</p>
                        <p className="text-xs text-accents-5">{formatDate(campaign.scheduled_at)}</p>
                      </div>
                    </div>
                  )}
                  {campaign.started_at && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
                        <Send className="h-4 w-4 text-yellow-600" />
                      </div>
                      <div>
                        <p className="font-medium">Envoi démarré</p>
                        <p className="text-xs text-accents-5">{formatDate(campaign.started_at)}</p>
                      </div>
                    </div>
                  )}
                  {campaign.completed_at && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">Envoi terminé</p>
                        <p className="text-xs text-accents-5">{formatDate(campaign.completed_at)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="recipients">
            <Card>
              {recipients.length === 0 ? (
                <div className="p-8 text-center">
                  <Users className="h-12 w-12 text-accents-4 mx-auto mb-4" />
                  <p className="text-accents-5 mb-4">Aucun destinataire</p>
                  {campaign.status === "draft" && (
                    <Button onClick={prepareCampaign} disabled={actionLoading}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Préparer les destinataires
                    </Button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-accents-1">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-accents-5">Email</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-accents-5">Nom</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-accents-5">Statut</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-accents-5">Ouvert</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-accents-5">Cliqué</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {recipients.map((r) => (
                        <tr key={r.id} className="hover:bg-accents-1">
                          <td className="px-4 py-3 text-sm">{r.email}</td>
                          <td className="px-4 py-3 text-sm">{r.entity_name || "-"}</td>
                          <td className="px-4 py-3">
                            <Badge variant={r.status === "sent" ? "success" : r.status === "failed" ? "error" : "default"}>
                              {r.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            {r.opened ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <span className="text-accents-4">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {r.clicked ? (
                              <CheckCircle className="h-4 w-4 text-purple-500" />
                            ) : (
                              <span className="text-accents-4">-</span>
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

          <TabsContent value="preview">
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Aperçu de l'email</h3>
              <div className="border rounded-lg p-4 bg-white">
                <div className="border-b pb-4 mb-4">
                  <p className="text-sm text-accents-5">Sujet:</p>
                  <p className="font-medium">{campaign.subject}</p>
                </div>
                {campaign.html_content ? (
                  <div 
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: campaign.html_content }}
                  />
                ) : (
                  <p className="text-accents-5 text-center py-8">
                    Contenu du template
                  </p>
                )}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
