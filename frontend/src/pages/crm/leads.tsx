import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { Alert } from "@/components/ui/Alert";
import { CreateLeadModal } from "@/components/forms/CreateLeadModal";
import { getLeads, Lead } from "@/lib/api";
import { Plus, Mail, Phone } from "lucide-react";

export default function LeadsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("seka_access_token");
      if (!token) {
        setError("Vous devez être connecté");
        return;
      }
      const data = await getLeads(token);
      setLeads(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Erreur lors du chargement des leads");
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats dynamically from leads data
  const calculateStats = () => {
    const total = leads.length;

    // Count leads created in last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const newLeads = leads.filter(lead => new Date(lead.created_at) >= sevenDaysAgo).length;

    // Count qualified leads
    const qualified = leads.filter(lead =>
      lead.status.toLowerCase() === "qualifié" || lead.status.toLowerCase() === "qualified"
    ).length;

    // Calculate conversion rate (qualified / total)
    const conversionRate = total > 0 ? Math.round((qualified / total) * 100) : 0;

    return [
      { label: "Total leads", value: total.toString(), color: "bg-primary-600" },
      { label: "Nouveaux (7j)", value: newLeads.toString(), color: "bg-primary-600" },
      { label: "Qualifiés", value: qualified.toString(), color: "bg-primary-600" },
      { label: "Taux conversion", value: `${conversionRate}%`, color: "bg-orange-600" },
    ];
  };

  const stats = calculateStats();

  const getStatusVariant = (status: string) => {
    const variants: Record<string, "default" | "success" | "warning" | "error"> = {
      "Nouveau": "default",
      "Contacté": "warning",
      "Qualifié": "success",
      "Non qualifié": "error",
    };
    return variants[status] || "default";
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-orange-600";
    return "text-red-600";
  };

  return (
    <DashboardLayout title="Leads">
      {error && (
        <Alert variant="error" className="mb-6">
          {error}
        </Alert>
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        {stats.map((stat, idx) => (
          <Card key={idx}>
            <div className="flex items-center gap-3">
              <div className={`h-12 w-12 rounded-lg ${stat.color} flex items-center justify-center`}>
                <span className="text-2xl font-bold text-white">{stat.value}</span>
              </div>
              <p className="text-sm font-medium text-accents-6">{stat.label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters & Actions */}
      <Card className="mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 gap-3 max-w-2xl">
            <Input
              placeholder="Rechercher un lead..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Select>
              <option value="all">Tous les statuts</option>
              <option value="nouveau">Nouveau</option>
              <option value="contacte">Contacté</option>
              <option value="qualifie">Qualifié</option>
            </Select>
          </div>
          <Button variant="primary" size="md" onClick={() => setIsModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nouveau lead
          </Button>
        </div>
      </Card>

      {/* Leads Grid */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <Skeleton className="h-40" />
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {leads.map((lead) => (
          <Card key={lead.id} hoverable>
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">{lead.name}</h3>
                  <p className="text-sm text-accents-5">{lead.company}</p>
                </div>
                <Badge variant={getStatusVariant(lead.status)}>{lead.status}</Badge>
              </div>

              {/* Score */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-accents-5">Score:</span>
                <div className="h-2 flex-1 rounded-full bg-accents-2">
                  <div
                    className="h-full rounded-full bg-success"
                    style={{ width: `${lead.score}%` }}
                  />
                </div>
                <span className={`text-sm font-medium ${getScoreColor(lead.score)}`}>
                  {lead.score}
                </span>
              </div>

              {/* Contact Info */}
              <div className="space-y-2 border-t border-accents-2 pt-3">
                <div className="flex items-center gap-2 text-sm text-accents-6">
                  <Mail className="h-4 w-4" />
                  <span className="truncate">{lead.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-accents-6">
                  <Phone className="h-4 w-4" />
                  <span>{lead.phone}</span>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-accents-2 pt-3">
                <span className="text-xs text-accents-5">
                  Source: {lead.source}
                </span>
                <span className="text-xs text-accents-5">
                  {new Date(lead.created_at).toLocaleDateString("fr-FR")}
                </span>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" className="flex-1">
                  Contacter
                </Button>
                <Button variant="primary" size="sm" className="flex-1">
                  Qualifier
                </Button>
              </div>
            </div>
          </Card>
        ))}
        </div>
      )}

      {/* Create Lead Modal */}
      <CreateLeadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchLeads}
      />
    </DashboardLayout>
  );
}
