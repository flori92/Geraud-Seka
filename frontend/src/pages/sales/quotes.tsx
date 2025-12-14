import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { Alert } from "@/components/ui/Alert";
import { CreateQuoteModal } from "@/components/forms/CreateQuoteModal";
import { getQuotes, Quote } from "@/lib/api";
import { Plus, Download, Send, Eye } from "lucide-react";
import { formatAmount } from "@/lib/formatters";

export default function QuotesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("seka_access_token");
      if (!token) {
        setError("Vous devez être connecté");
        return;
      }
      const data = await getQuotes(token);
      setQuotes(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Erreur lors du chargement des devis");
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    {
      label: "Total devis",
      value: quotes.length.toString(),
      color: "bg-primary-600"
    },
    {
      label: "En attente",
      value: quotes.filter(q => q.status === "En attente" || q.status === "pending").length.toString(),
      color: "bg-orange-600"
    },
    {
      label: "Acceptés",
      value: quotes.filter(q => q.status === "Accepté" || q.status === "accepted").length.toString(),
      color: "bg-primary-600"
    },
    {
      label: "Montant total",
      value: Math.round(quotes.reduce((sum, q) => sum + q.amount, 0) / 1000) + "K",
      color: "bg-primary-600"
    },
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
          <Button variant="primary" size="md" onClick={() => setIsModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nouveau devis
          </Button>
        </div>
      </Card>

      {/* Quotes List */}
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
                  <td className="px-4 py-3 text-sm font-medium text-foreground">{quote.number}</td>
                  <td className="px-4 py-3 text-sm text-foreground">{quote.client_name || quote.client_id}</td>
                  <td className="px-4 py-3 text-sm text-accents-6">
                    {new Date(quote.date).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-4 py-3 text-sm text-accents-6">
                    <div className="flex items-center gap-2">
                      {new Date(quote.valid_until).toLocaleDateString("fr-FR")}
                      {isExpiringSoon(quote.valid_until) && (
                        <Badge variant="warning">Expire bientôt</Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-accents-6">{quote.items_count || "-"}</td>
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
        )}
      </Card>

      {/* Create Quote Modal */}
      <CreateQuoteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchQuotes}
      />
    </DashboardLayout>
  );
}
