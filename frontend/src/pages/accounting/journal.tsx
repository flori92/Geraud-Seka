import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { PennylaneSidebar } from "@/components/layout/PennylaneSidebar";
import { getJournalEntries, createJournalEntry, JournalEntry, JournalEntryCreate } from "@/lib/api";
import { useToast } from "@/components/ui/ToastContainer";
import { Plus, ArrowRight, X, BookOpen, Search, RefreshCw, Loader2 } from "lucide-react";
import { formatAmount } from "@/lib/formatters";

export default function JournalPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
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
    setLoading(true);
    const token = localStorage.getItem("seka_access_token");
    if (!token) { router.push("/login"); return; }
    try {
      const data = await getJournalEntries(token);
      setEntries(data);
      setError(null);
    } catch {
      setError("Erreur lors du chargement du journal");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEntry = async () => {
    setSubmitting(true);
    const token = localStorage.getItem("seka_access_token");
    if (!token) { showError("Vous devez être connecté"); return; }

    try {
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
      setFormData({ date: new Date().toISOString().split('T')[0], description: "", debit_account: "", credit_account: "", amount: "", reference: "" });
      fetchEntries();
    } catch {
      showError("Erreur lors de la création de l'écriture");
    } finally {
      setSubmitting(false);
    }
  };

  const totalDebit = entries.reduce((sum, e) => sum + e.amount, 0);
  const totalCredit = entries.reduce((sum, e) => sum + e.amount, 0);

  const filteredEntries = entries.filter(e => 
    e.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.entry_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#1e3a5f]" />
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Journal comptable - SEKA</title>
      </Head>
      <div className="min-h-screen bg-gray-50">
        <PennylaneSidebar />
        <main className="ml-[220px]">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Journal comptable</h1>
                <p className="text-sm text-gray-600 mt-0.5">Écritures comptables et mouvements</p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={fetchEntries} className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
                  <RefreshCw className="h-5 w-5" />
                </button>
                <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] text-white text-sm font-medium rounded-lg hover:bg-[#172e4d]">
                  <Plus className="h-4 w-4" />
                  Nouvelle écriture
                </button>
              </div>
            </div>
          </div>

          <div className="px-6 py-6 space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Total écritures</span>
                  <BookOpen className="h-4 w-4 text-[#1e3a5f]" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{entries.length}</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Débit total</span>
                </div>
                <p className="text-2xl font-bold text-red-600">{formatAmount(totalDebit)}</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Crédit total</span>
                </div>
                <p className="text-2xl font-bold text-green-600">{formatAmount(totalCredit)}</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Balance</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{formatAmount(totalDebit - totalCredit)}</p>
              </div>
            </div>

            {/* Search */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input type="text" placeholder="Rechercher une écriture..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]" />
                </div>
                <input type="date" className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]" />
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              {filteredEntries.length === 0 ? (
                <div className="p-12 text-center">
                  <BookOpen className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 font-medium">Aucune écriture comptable</p>
                  <p className="text-sm text-gray-400 mt-1">Créez votre première écriture pour commencer</p>
                  <button onClick={() => setShowModal(true)} className="mt-4 flex items-center gap-2 mx-auto px-4 py-2 bg-[#1e3a5f] text-white text-sm font-medium rounded-lg hover:bg-[#172e4d]">
                    <Plus className="h-4 w-4" /> Nouvelle écriture
                  </button>
                </div>
              ) : (
                <>
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">N° Écriture</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Débit</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase"></th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Crédit</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Montant</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Référence</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredEntries.map((entry) => (
                        <tr key={entry.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{entry.entry_number}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{new Date(entry.date).toLocaleDateString("fr-FR")}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{entry.description}</td>
                          <td className="px-4 py-3 text-sm font-mono text-gray-600">{entry.debit_account}</td>
                          <td className="px-4 py-3 text-center"><ArrowRight className="h-4 w-4 mx-auto text-gray-400" /></td>
                          <td className="px-4 py-3 text-sm font-mono text-gray-600">{entry.credit_account}</td>
                          <td className="px-4 py-3 text-sm font-medium text-right text-gray-900">{entry.amount.toLocaleString()} FCFA</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{entry.reference || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
                    <span className="text-sm text-gray-500">{filteredEntries.length} écriture(s)</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Nouvelle écriture comptable</h2>
              <button onClick={() => setShowModal(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                  <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Référence</label>
                  <input type="text" value={formData.reference} onChange={(e) => setFormData({ ...formData, reference: e.target.value })} placeholder="FAC-001"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <input type="text" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Vente de marchandises"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Compte débit *</label>
                  <select value={formData.debit_account} onChange={(e) => setFormData({ ...formData, debit_account: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]">
                    <option value="">Sélectionner...</option>
                    <option value="411000">411000 - Clients</option>
                    <option value="512000">512000 - Banque</option>
                    <option value="530000">530000 - Caisse</option>
                    <option value="601000">601000 - Achats marchandises</option>
                    <option value="621000">621000 - Personnel extérieur</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Compte crédit *</label>
                  <select value={formData.credit_account} onChange={(e) => setFormData({ ...formData, credit_account: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]">
                    <option value="">Sélectionner...</option>
                    <option value="401000">401000 - Fournisseurs</option>
                    <option value="701000">701000 - Ventes marchandises</option>
                    <option value="706000">706000 - Prestations services</option>
                    <option value="445710">445710 - TVA collectée</option>
                    <option value="512000">512000 - Banque</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Montant (FCFA) *</label>
                <input type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} placeholder="100000"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Annuler</button>
              <button onClick={handleCreateEntry} disabled={!formData.description || !formData.debit_account || !formData.credit_account || !formData.amount || submitting}
                className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] text-white text-sm font-medium rounded-lg hover:bg-[#172e4d] disabled:opacity-50">
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {submitting ? "Création..." : "Créer l'écriture"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
