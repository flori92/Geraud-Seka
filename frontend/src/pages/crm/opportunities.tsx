import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Alert } from "@/components/ui/Alert";
import { CreateOpportunityModal } from "@/components/forms/CreateOpportunityModal";
import { Plus, Filter } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { getOpportunities, Opportunity } from "@/lib/api";
import { formatCurrency } from "@/lib/formatters";

export default function OpportunitiesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchOpportunities();
  }, []);

  const fetchOpportunities = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("seka_access_token");
      if (!token) {
        setError("Vous devez être connecté");
        return;
      }
      const data = await getOpportunities(token);
      setOpportunities(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Erreur lors du chargement des opportunités");
    } finally {
      setLoading(false);
    }
  };

  // Calculate real stats from opportunities data
  const totalOpportunities = opportunities.length;
  const totalValue = opportunities.reduce((sum, opp) => sum + opp.value, 0);
  const wonOpportunities = opportunities.filter(opp => opp.stage === "Gagné").length;
  const conversionRate = totalOpportunities > 0 ? Math.round((wonOpportunities / totalOpportunities) * 100) : 0;
  const expectedRevenue = opportunities.reduce((sum, opp) => {
    // Calculate weighted expected value based on probability
    return sum + (opp.value * opp.probability / 100);
  }, 0);

  const stats = [
    {
      label: "Total opportunités",
      value: totalOpportunities.toString(),
    },
    {
      label: "Valeur pipeline",
      value: formatCurrency(totalValue),
    },
    {
      label: "Taux conversion",
      value: conversionRate + "%",
    },
    {
      label: "CA prévu (pondéré)",
      value: formatCurrency(expectedRevenue),
    },
  ];

  const getStageVariant = (stage: string) => {
    const variants: Record<string, "default" | "success" | "warning" | "error"> = {
      "Qualification": "default",
      "Proposition": "warning",
      "Négociation": "success",
      "Gagné": "success",
      "Perdu": "error",
    };
    return variants[stage] || "default";
  };

  return (
    <DashboardLayout title="Opportunités">
      {error && (
        <Alert variant="error" className="mb-6">
          {error}
        </Alert>
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        {stats.map((stat, idx) => (
          <Card key={idx}>
            <div>
              <p className="text-xs text-accents-5">{stat.label}</p>
              <p className="mt-1 text-2xl font-bold text-foreground">{stat.value}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters & Actions */}
      <Card className="mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 gap-3">
            <div className="flex-1 max-w-md">
              <Input
                placeholder="Rechercher une opportunité..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">Tous les statuts</option>
              <option value="qualification">Qualification</option>
              <option value="proposition">Proposition</option>
              <option value="negociation">Négociation</option>
            </Select>
            <Button variant="secondary" size="md">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="primary" size="md" onClick={() => setIsModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle opportunité
          </Button>
        </div>
      </Card>

      {/* Opportunities List */}
      <Card>
        {loading ? (
          <div className="p-6">
            <Skeleton className="h-96 w-full" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
            <thead className="border-b border-accents-2">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-accents-5">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-accents-5">Titre</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-accents-5">Client</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-accents-5">Valeur</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-accents-5">Étape</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-accents-5">Probabilité</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-accents-5">Date clôture</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-accents-5">Responsable</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-accents-2">
              {opportunities.map((opp) => (
                <tr key={opp.id} className="hover:bg-accents-1 cursor-pointer transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-foreground">{opp.id}</td>
                  <td className="px-4 py-3 text-sm text-foreground">{opp.title}</td>
                  <td className="px-4 py-3 text-sm text-accents-6">{opp.client_name || opp.client_id}</td>
                  <td className="px-4 py-3 text-sm font-medium text-foreground">
                    {opp.value.toLocaleString()} FCFA
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={getStageVariant(opp.stage)}>{opp.stage}</Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-accents-6">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-16 rounded-full bg-accents-2">
                        <div
                          className="h-full rounded-full bg-success"
                          style={{ width: `${opp.probability}%` }}
                        />
                      </div>
                      <span>{opp.probability}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-accents-6">
                    {new Date(opp.close_date).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-4 py-3 text-sm text-accents-6">{opp.owner_name || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </Card>

      {/* Create Opportunity Modal */}
      <CreateOpportunityModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchOpportunities}
      />
    </DashboardLayout>
  );
}
