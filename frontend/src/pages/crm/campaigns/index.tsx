import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { 
  Mail, Plus, Search, Send, Pause, Play, Trash2, Eye,
  Users, MousePointer, BarChart3, Calendar, Clock, Filter
} from "lucide-react";

interface Campaign {
  id: string;
  name: string;
  description: string;
  status: string;
  subject: string;
  template_name: string | null;
  segment_name: string | null;
  target_entity_type: string;
  total_recipients: number;
  sent_count: number;
  opened_count: number;
  clicked_count: number;
  open_rate: number;
  click_rate: number;
  scheduled_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

const statusConfig: Record<string, { label: string; color: string; variant: "default" | "success" | "warning" | "error" }> = {
  draft: { label: "Brouillon", color: "bg-gray-100 text-gray-700", variant: "default" },
  scheduled: { label: "Programmée", color: "bg-blue-100 text-blue-700", variant: "default" },
  sending: { label: "En cours", color: "bg-yellow-100 text-yellow-700", variant: "warning" },
  sent: { label: "Envoyée", color: "bg-green-100 text-green-700", variant: "success" },
  paused: { label: "En pause", color: "bg-orange-100 text-orange-700", variant: "warning" },
  cancelled: { label: "Annulée", color: "bg-red-100 text-red-700", variant: "error" },
};

export default function CampaignsPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [stats, setStats] = useState({
    total: 0,
    sent: 0,
    draft: 0,
    totalOpens: 0,
    totalClicks: 0
  });

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  useEffect(() => {
    fetchCampaigns();
  }, [statusFilter]);

  const getHeaders = () => {
    const token = localStorage.getItem("seka_access_token");
    return { 
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    };
  };

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const url = statusFilter 
        ? `${API_BASE_URL}/api/v1/campaigns?status=${statusFilter}`
        : `${API_BASE_URL}/api/v1/campaigns`;
      
      const res = await fetch(url, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.campaigns || []);
        
        // Calculer les stats
        const allCampaigns = data.campaigns || [];
        setStats({
          total: allCampaigns.length,
          sent: allCampaigns.filter((c: Campaign) => c.status === "sent").length,
          draft: allCampaigns.filter((c: Campaign) => c.status === "draft").length,
          totalOpens: allCampaigns.reduce((sum: number, c: Campaign) => sum + c.opened_count, 0),
          totalClicks: allCampaigns.reduce((sum: number, c: Campaign) => sum + c.clicked_count, 0)
        });
      }
    } catch (error) {
      console.error("Erreur chargement campagnes:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteCampaign = async (id: string) => {
    if (!confirm("Supprimer cette campagne ?")) return;
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/campaigns/${id}`, {
        method: "DELETE",
        headers: getHeaders()
      });
      if (res.ok) {
        fetchCampaigns();
      }
    } catch (error) {
      console.error("Erreur suppression:", error);
    }
  };

  const filteredCampaigns = campaigns.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.subject?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <DashboardLayout title="Campagnes Email">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Campagnes Email</h1>
            <p className="text-sm text-accents-5">
              Gérez vos campagnes d'email marketing
            </p>
          </div>
          <Button onClick={() => router.push("/crm/campaigns/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle campagne
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Mail className="h-5 w-5 text-primary" />
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
                <Send className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.sent}</p>
                <p className="text-xs text-accents-5">Envoyées</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Clock className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.draft}</p>
                <p className="text-xs text-accents-5">Brouillons</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Eye className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalOpens}</p>
                <p className="text-xs text-accents-5">Ouvertures</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <MousePointer className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalClicks}</p>
                <p className="text-xs text-accents-5">Clics</p>
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
                placeholder="Rechercher une campagne..."
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
              <option value="draft">Brouillons</option>
              <option value="scheduled">Programmées</option>
              <option value="sending">En cours</option>
              <option value="sent">Envoyées</option>
              <option value="paused">En pause</option>
            </select>
          </div>
        </Card>

        {/* Campaigns List */}
        <Card>
          {loading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : filteredCampaigns.length === 0 ? (
            <div className="p-12 text-center">
              <Mail className="h-12 w-12 text-accents-4 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Aucune campagne</h3>
              <p className="text-accents-5 mb-4">
                Créez votre première campagne email
              </p>
              <Button onClick={() => router.push("/crm/campaigns/new")}>
                <Plus className="mr-2 h-4 w-4" />
                Créer une campagne
              </Button>
            </div>
          ) : (
            <div className="divide-y">
              {filteredCampaigns.map((campaign) => {
                const status = statusConfig[campaign.status] || statusConfig.draft;
                return (
                  <div
                    key={campaign.id}
                    className="p-4 hover:bg-accents-1 cursor-pointer transition-colors"
                    onClick={() => router.push(`/crm/campaigns/${campaign.id}`)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-medium truncate">{campaign.name}</h3>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </div>
                        <p className="text-sm text-accents-5 truncate mb-2">
                          {campaign.subject || "Pas de sujet"}
                        </p>
                        <div className="flex flex-wrap items-center gap-4 text-xs text-accents-5">
                          {campaign.segment_name && (
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {campaign.segment_name}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {campaign.total_recipients} destinataires
                          </span>
                          {campaign.scheduled_at && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(campaign.scheduled_at)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Stats */}
                      {campaign.status === "sent" && (
                        <div className="flex items-center gap-6 text-sm">
                          <div className="text-center">
                            <p className="font-semibold text-blue-600">{campaign.open_rate}%</p>
                            <p className="text-xs text-accents-5">Ouvertures</p>
                          </div>
                          <div className="text-center">
                            <p className="font-semibold text-purple-600">{campaign.click_rate}%</p>
                            <p className="text-xs text-accents-5">Clics</p>
                          </div>
                          <div className="text-center">
                            <p className="font-semibold">{campaign.sent_count}</p>
                            <p className="text-xs text-accents-5">Envoyés</p>
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/crm/campaigns/${campaign.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {campaign.status === "draft" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteCampaign(campaign.id)}
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
