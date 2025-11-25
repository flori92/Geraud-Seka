import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { Alert } from "@/components/ui/Alert";
import { getJournalEntries, JournalEntry } from "@/lib/api";
import { Plus, ArrowRight } from "lucide-react";
import { formatAmount } from "@/lib/formatters";

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("seka_access_token");
      if (!token) {
        setError("Vous devez être connecté");
        return;
      }
      const data = await getJournalEntries(token);
      setEntries(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Erreur lors du chargement du journal");
    } finally {
      setLoading(false);
    }
  };

  const totalDebit = entries.reduce((sum, e) => sum + e.amount, 0);
  const totalCredit = entries.reduce((sum, e) => sum + e.amount, 0);

  const stats = [
    { label: "Total écritures", value: entries.length.toString(), color: "bg-blue-600" },
    { label: "Débit total", value: formatAmount(totalDebit), color: "bg-red-600" },
    { label: "Crédit total", value: formatAmount(totalCredit), color: "bg-green-600" },
    { label: "Balance", value: Math.round((totalDebit - totalCredit) / 1000) + "K", color: "bg-purple-600" },
  ];

  return (
    <DashboardLayout title="Journal comptable">
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
            <Input placeholder="Rechercher une écriture..." className="flex-1" />
            <Input type="date" className="w-48" />
          </div>
          <Button variant="primary" size="md">
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle écriture
          </Button>
        </div>
      </Card>

      {/* Journal Entries */}
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-accents-5">N° Écriture</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-accents-5">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-accents-5">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-accents-5">Débit</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-accents-5"></th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-accents-5">Crédit</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-accents-5">Montant</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-accents-5">Référence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-accents-2">
                {entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-accents-1 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-foreground">{entry.entry_number}</td>
                    <td className="px-4 py-3 text-sm text-accents-6">
                      {new Date(entry.date).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">{entry.description}</td>
                    <td className="px-4 py-3 text-sm font-mono text-accents-6">{entry.debit_account}</td>
                    <td className="px-4 py-3 text-center">
                      <ArrowRight className="h-4 w-4 mx-auto text-accents-5" />
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-accents-6">{entry.credit_account}</td>
                    <td className="px-4 py-3 text-sm font-medium text-foreground">
                      {entry.amount.toLocaleString()} FCFA
                    </td>
                    <td className="px-4 py-3 text-sm text-accents-6">{entry.reference || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </DashboardLayout>
  );
}
