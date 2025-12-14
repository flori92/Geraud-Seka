import { useState, useEffect } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { Alert } from "@/components/ui/Alert";
import { getJournalEntries, createJournalEntry, JournalEntry, JournalEntryCreate } from "@/lib/api";
import { useToast } from "@/components/ui/ToastContainer";
import { Plus, ArrowRight, X, BookOpen, FileText } from "lucide-react";
import { formatAmount } from "@/lib/formatters";

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { success, error: showError } = useToast();
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: "",
    debit_account: "",
    credit_account: "",
    amount: "",
    reference: ""
  });

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

  const handleCreateEntry = async () => {
    try {
      setSubmitting(true);
      const token = localStorage.getItem("seka_access_token");
      if (!token) {
        showError("Vous devez être connecté");
        return;
      }

      const entryData: JournalEntryCreate = {
        date: formData.date,
        description: formData.description,
        debit_account: formData.debit_account,
        credit_account: formData.credit_account,
        amount: parseFloat(formData.amount),
        reference: formData.reference || undefined
      };

      await createJournalEntry(entryData, token);
      success("Écriture créée avec succès");
      setShowModal(false);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        description: "",
        debit_account: "",
        credit_account: "",
        amount: "",
        reference: ""
      });
      fetchEntries();
    } catch (err: any) {
      showError(err.response?.data?.detail || "Erreur lors de la création de l'écriture");
    } finally {
      setSubmitting(false);
    }
  };

  const totalDebit = entries.reduce((sum, e) => sum + e.amount, 0);
  const totalCredit = entries.reduce((sum, e) => sum + e.amount, 0);

  const stats = [
    { label: "Total écritures", value: entries.length.toString(), color: "bg-primary-600" },
    { label: "Débit total", value: formatAmount(totalDebit), color: "bg-red-600" },
    { label: "Crédit total", value: formatAmount(totalCredit), color: "bg-primary-600" },
    { label: "Balance", value: Math.round((totalDebit - totalCredit) / 1000) + "K", color: "bg-primary-600" },
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
          <Button variant="primary" size="md" onClick={() => setShowModal(true)}>
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
        
        {entries.length === 0 && !loading && (
          <div className="p-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">Aucune écriture comptable</p>
            <p className="text-sm text-gray-400 mt-1">Créez votre première écriture pour commencer</p>
            <Button variant="primary" size="sm" className="mt-4" onClick={() => setShowModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle écriture
            </Button>
          </div>
        )}
      </Card>

      {/* Modal Nouvelle Écriture */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-lg mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-foreground">Nouvelle écriture comptable</h2>
                <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded">
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Date *</label>
                    <Input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Référence</label>
                    <Input
                      value={formData.reference}
                      onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                      placeholder="FAC-001"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Description *</label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Vente de marchandises"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Compte débit *</label>
                    <Select
                      value={formData.debit_account}
                      onChange={(e) => setFormData({ ...formData, debit_account: e.target.value })}
                    >
                      <option value="">Sélectionner...</option>
                      <option value="411000">411000 - Clients</option>
                      <option value="512000">512000 - Banque</option>
                      <option value="530000">530000 - Caisse</option>
                      <option value="601000">601000 - Achats marchandises</option>
                      <option value="621000">621000 - Personnel extérieur</option>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Compte crédit *</label>
                    <Select
                      value={formData.credit_account}
                      onChange={(e) => setFormData({ ...formData, credit_account: e.target.value })}
                    >
                      <option value="">Sélectionner...</option>
                      <option value="401000">401000 - Fournisseurs</option>
                      <option value="701000">701000 - Ventes marchandises</option>
                      <option value="706000">706000 - Prestations services</option>
                      <option value="445710">445710 - TVA collectée</option>
                      <option value="512000">512000 - Banque</option>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Montant (FCFA) *</label>
                  <Input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="100000"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button variant="secondary" onClick={() => setShowModal(false)} className="flex-1">
                  Annuler
                </Button>
                <Button
                  variant="primary"
                  disabled={!formData.description || !formData.debit_account || !formData.credit_account || !formData.amount || submitting}
                  className="flex-1"
                  onClick={handleCreateEntry}
                >
                  {submitting ? "Création..." : "Créer l'écriture"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}
