import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Table } from "@/components/ui/Table";
import { Plus, Search, Filter, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

export default function OpportunitiesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const opportunities = [
    {
      id: "OPP-001",
      title: "Accompagnement fiscal PME",
      client: "SARL TechnoSoft",
      value: 125000,
      stage: "Négociation",
      probability: 70,
      closeDate: "2025-12-15",
      owner: "Jean Dupont",
    },
    {
      id: "OPP-002",
      title: "Audit comptable annuel",
      client: "Cabinet Avocat Legalis",
      value: 85000,
      stage: "Proposition",
      probability: 50,
      closeDate: "2025-11-30",
      owner: "Marie Martin",
    },
    {
      id: "OPP-003",
      title: "Conseil stratégique",
      client: "Entreprise ABC",
      value: 200000,
      stage: "Qualification",
      probability: 30,
      closeDate: "2026-01-20",
      owner: "Jean Dupont",
    },
  ];

  const stats = [
    { label: "Total opportunités", value: "12", trend: "+15%" },
    { label: "Valeur pipeline", value: "850K FCFA", trend: "+8%" },
    { label: "Taux conversion", value: "68%", trend: "+3%" },
    { label: "CA prévu ce mois", value: "320K FCFA", trend: "+12%" },
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
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        {stats.map((stat, idx) => (
          <Card key={idx}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-accents-5">{stat.label}</p>
                <p className="mt-1 text-2xl font-bold text-foreground">{stat.value}</p>
              </div>
              <Badge variant="success">{stat.trend}</Badge>
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
          <Button variant="primary" size="md">
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle opportunité
          </Button>
        </div>
      </Card>

      {/* Opportunities List */}
      <Card>
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
                  <td className="px-4 py-3 text-sm text-accents-6">{opp.client}</td>
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
                    {new Date(opp.closeDate).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-4 py-3 text-sm text-accents-6">{opp.owner}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </DashboardLayout>
  );
}
