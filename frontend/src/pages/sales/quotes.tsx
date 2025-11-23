import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Plus, Download, Send, Eye } from "lucide-react";

export default function QuotesPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const quotes = [
    {
      id: "DEV-2025-001",
      client: "SARL TechnoSoft",
      date: "2025-11-15",
      validUntil: "2025-12-15",
      amount: 125000,
      status: "En attente",
      items: 5,
    },
    {
      id: "DEV-2025-002",
      client: "Cabinet Avocat Legalis",
      date: "2025-11-10",
      validUntil: "2025-12-10",
      amount: 85000,
      status: "Accepté",
      items: 3,
    },
    {
      id: "DEV-2025-003",
      client: "Entreprise ABC",
      date: "2025-11-05",
      validUntil: "2025-12-05",
      amount: 200000,
      status: "Brouillon",
      items: 8,
    },
    {
      id: "DEV-2025-004",
      client: "Restaurant Le Palais",
      date: "2025-10-28",
      validUntil: "2025-11-28",
      amount: 45000,
      status: "Expiré",
      items: 2,
    },
  ];

  const stats = [
    { label: "Total devis", value: "24", color: "bg-blue-600" },
    { label: "En attente", value: "8", color: "bg-orange-600" },
    { label: "Acceptés", value: "12", color: "bg-green-600" },
    { label: "Montant total", value: "850K", color: "bg-purple-600" },
  ];

  const getStatusVariant = (status: string) => {
    const variants: Record<string, "default" | "success" | "warning" | "error"> = {
      "Brouillon": "default",
      "En attente": "warning",
      "Accepté": "success",
      "Refusé": "error",
      "Expiré": "error",
    };
    return variants[status] || "default";
  };

  const isExpiringSoon = (validUntil: string) => {
    const daysUntilExpiry = Math.ceil(
      (new Date(validUntil).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
  };

  return (
    <DashboardLayout title="Devis">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        {stats.map((stat, idx) => (
          <Card key={idx}>
            <div className="flex items-center gap-3">
              <div className={`h-12 w-12 rounded-lg ${stat.color} flex items-center justify-center`}>
                <span className="text-xl font-bold text-white">{stat.value}</span>
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
              placeholder="Rechercher un devis..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Select>
              <option value="all">Tous les statuts</option>
              <option value="brouillon">Brouillon</option>
              <option value="attente">En attente</option>
              <option value="accepte">Accepté</option>
              <option value="refuse">Refusé</option>
            </Select>
          </div>
          <Button variant="primary" size="md">
            <Plus className="mr-2 h-4 w-4" />
            Nouveau devis
          </Button>
        </div>
      </Card>

      {/* Quotes List */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-accents-2">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-accents-5">Numéro</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-accents-5">Client</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-accents-5">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-accents-5">Valable jusqu'au</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-accents-5">Articles</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-accents-5">Montant</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-accents-5">Statut</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-accents-5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-accents-2">
              {quotes.map((quote) => (
                <tr key={quote.id} className="hover:bg-accents-1 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-foreground">{quote.id}</td>
                  <td className="px-4 py-3 text-sm text-foreground">{quote.client}</td>
                  <td className="px-4 py-3 text-sm text-accents-6">
                    {new Date(quote.date).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-4 py-3 text-sm text-accents-6">
                    <div className="flex items-center gap-2">
                      {new Date(quote.validUntil).toLocaleDateString("fr-FR")}
                      {isExpiringSoon(quote.validUntil) && (
                        <Badge variant="warning">Expire bientôt</Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-accents-6">{quote.items}</td>
                  <td className="px-4 py-3 text-sm font-medium text-foreground">
                    {quote.amount.toLocaleString()} FCFA
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={getStatusVariant(quote.status)}>{quote.status}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button className="rounded p-1 hover:bg-accents-2 transition-colors">
                        <Eye className="h-4 w-4 text-accents-5" />
                      </button>
                      <button className="rounded p-1 hover:bg-accents-2 transition-colors">
                        <Download className="h-4 w-4 text-accents-5" />
                      </button>
                      <button className="rounded p-1 hover:bg-accents-2 transition-colors">
                        <Send className="h-4 w-4 text-accents-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </DashboardLayout>
  );
}
