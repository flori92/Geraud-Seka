/**
 * Budgets et Prévisionnel - SEKA
 * Gestion budgétaire avec suivi réalisé vs prévu
 */
import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import {
  Plus,
  Search,
  Loader2,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Edit2,
  Trash2,
  Eye,
} from "lucide-react";

interface Budget {
  id: string;
  name: string;
  fiscal_year_id: string;
  fiscal_year_name: string;
  category: string;
  account_number: string;
  account_name: string;
  planned_amount: number;
  actual_amount: number;
  variance: number;
  variance_percent: number;
  period: "monthly" | "quarterly" | "yearly";
}

interface BudgetSummary {
  total_planned: number;
  total_actual: number;
  total_variance: number;
  variance_percent: number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function BudgetsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [summary, setSummary] = useState<BudgetSummary | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchBudgets = async () => {
    const token = localStorage.getItem("seka_access_token");
    if (!token) { router.push("/login"); return; }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/accounting/budgets`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setBudgets(data.budgets || []);
        setSummary(data.summary || null);
      }
    } catch (err) {
      console.error("Erreur:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, []);

  const deleteBudget = async (id: string) => {
    const token = localStorage.getItem("seka_access_token");
    if (!token || !confirm("Supprimer ce budget ?")) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/accounting/budgets/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchBudgets();
    } catch (err) {
      console.error("Erreur:", err);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", minimumFractionDigits: 0 }).format(amount);
  };

  const getVarianceBadge = (variance: number, percent: number) => {
    if (variance >= 0) {
      return (
        <span className="inline-flex items-center gap-1 text-green-600 text-sm">
          <TrendingDown className="w-4 h-4" />
          {formatCurrency(Math.abs(variance))} ({Math.abs(percent).toFixed(1)}%)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-red-600 text-sm">
        <TrendingUp className="w-4 h-4" />
        {formatCurrency(Math.abs(variance))} ({Math.abs(percent).toFixed(1)}%)
      </span>
    );
  };

  const categories = [...new Set(budgets.map(b => b.category))];
  const filtered = budgets.filter(b => {
    const matchesSearch = b.name.toLowerCase().includes(searchQuery.toLowerCase()) || b.account_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === "all" || b.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div>;

  return (
    <>
      <Head><title>Budgets - SEKA</title></Head>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Budgets et Prévisionnel</h1>
                <p className="text-sm text-gray-500 mt-1">Suivez vos budgets et comparez avec le réalisé</p>
              </div>
              <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700">
                <Plus className="h-4 w-4" /> Nouveau budget
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-6">
          {/* Résumé */}
          {summary && (
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-xs text-gray-500">Budget prévu</p>
                <p className="text-xl font-semibold text-gray-900">{formatCurrency(summary.total_planned)}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-xs text-gray-500">Réalisé</p>
                <p className="text-xl font-semibold text-gray-900">{formatCurrency(summary.total_actual)}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-xs text-gray-500">Écart</p>
                <p className={`text-xl font-semibold ${summary.total_variance >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {formatCurrency(summary.total_variance)}
                </p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-xs text-gray-500">Taux de réalisation</p>
                <p className="text-xl font-semibold text-primary-600">
                  {summary.total_planned > 0 ? ((summary.total_actual / summary.total_planned) * 100).toFixed(1) : 0}%
                </p>
              </div>
            </div>
          )}

          {/* Filtres */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input type="text" placeholder="Rechercher..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
                <option value="all">Toutes catégories</option>
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Poste budgétaire</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Catégorie</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Compte</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Prévu</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Réalisé</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Écart</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-500">Aucun budget défini</td></tr>
                ) : filtered.map((budget) => (
                  <tr key={budget.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">{budget.name}</p>
                      <p className="text-xs text-gray-500">{budget.fiscal_year_name}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{budget.category}</td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-900">{budget.account_number}</p>
                      <p className="text-xs text-gray-500">{budget.account_name}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">{formatCurrency(budget.planned_amount)}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900">{formatCurrency(budget.actual_amount)}</td>
                    <td className="px-4 py-3 text-center">{getVarianceBadge(budget.variance, budget.variance_percent)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => router.push(`/accounting/budgets/${budget.id}`)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded"><Eye className="h-4 w-4" /></button>
                        <button onClick={() => router.push(`/accounting/budgets/${budget.id}/edit`)} className="p-1.5 text-gray-400 hover:text-primary-600 rounded"><Edit2 className="h-4 w-4" /></button>
                        <button onClick={() => deleteBudget(budget.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Alerte dépassement */}
          {budgets.some(b => b.variance < 0 && Math.abs(b.variance_percent) > 10) && (
            <div className="mt-6 p-4 bg-red-50 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-900">Dépassements budgétaires</p>
                  <p className="text-xs text-red-700 mt-1">
                    Certains postes dépassent le budget de plus de 10%. Vérifiez les écarts importants.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Création */}
      {showCreateModal && (
        <CreateBudgetModal onClose={() => setShowCreateModal(false)} onCreated={fetchBudgets} />
      )}
    </>
  );
}

function CreateBudgetModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ name: "", category: "", account_number: "", planned_amount: 0, period: "yearly" });
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    const token = localStorage.getItem("seka_access_token");
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/accounting/budgets`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) { onClose(); onCreated(); }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Nouveau budget</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom du poste</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
            <input type="text" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Ex: Charges d'exploitation" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Compte comptable</label>
            <input type="text" value={form.account_number} onChange={(e) => setForm({ ...form, account_number: e.target.value })} placeholder="Ex: 6061" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Montant prévu</label>
            <input type="number" value={form.planned_amount} onChange={(e) => setForm({ ...form, planned_amount: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Annuler</button>
          <button onClick={handleCreate} disabled={loading || !form.name} className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg disabled:opacity-50">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Créer"}
          </button>
        </div>
      </div>
    </div>
  );
}
