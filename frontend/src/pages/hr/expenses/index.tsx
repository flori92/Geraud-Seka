/**
 * Notes de frais - SEKA
 * Saisie et remboursement des frais professionnels
 */
import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import {
  Plus,
  Search,
  Loader2,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  Download,
} from "lucide-react";

interface Expense {
  id: string;
  employee_id: string;
  employee_name: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  receipt_url: string | null;
  status: "draft" | "submitted" | "approved" | "rejected" | "paid";
  submitted_at: string | null;
  approved_by: string | null;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const expenseCategories = [
  "Transport", "Repas", "Hébergement", "Fournitures", "Communication", "Divers"
];

export default function ExpensesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchExpenses = async () => {
    const token = localStorage.getItem("seka_access_token");
    if (!token) { router.push("/login"); return; }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/hr/expenses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setExpenses(data.expenses || []);
      }
    } catch (err) {
      console.error("Erreur:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const approveExpense = async (id: string) => {
    const token = localStorage.getItem("seka_access_token");
    if (!token) return;
    try {
      await fetch(`${API_BASE_URL}/api/v1/hr/expenses/${id}/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchExpenses();
    } catch (err) { console.error(err); }
  };

  const rejectExpense = async (id: string) => {
    const token = localStorage.getItem("seka_access_token");
    if (!token) return;
    try {
      await fetch(`${API_BASE_URL}/api/v1/hr/expenses/${id}/reject`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchExpenses();
    } catch (err) { console.error(err); }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", minimumFractionDigits: 0 }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved": return <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full"><CheckCircle className="w-3 h-3" /> Approuvé</span>;
      case "paid": return <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full"><CheckCircle className="w-3 h-3" /> Remboursé</span>;
      case "rejected": return <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-red-700 text-xs font-medium rounded-full"><XCircle className="w-3 h-3" /> Refusé</span>;
      case "submitted": return <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-50 text-yellow-700 text-xs font-medium rounded-full"><Clock className="w-3 h-3" /> En attente</span>;
      default: return <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full"><Clock className="w-3 h-3" /> Brouillon</span>;
    }
  };

  const filtered = expenses.filter(e => {
    const matchesSearch = e.description.toLowerCase().includes(searchQuery.toLowerCase()) || e.employee_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || e.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: filtered.reduce((sum, e) => sum + e.amount, 0),
    pending: filtered.filter(e => e.status === "submitted").reduce((sum, e) => sum + e.amount, 0),
    approved: filtered.filter(e => e.status === "approved" || e.status === "paid").reduce((sum, e) => sum + e.amount, 0),
  };

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div>;

  return (
    <>
      <Head><title>Notes de frais - SEKA</title></Head>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Notes de frais</h1>
                <p className="text-sm text-gray-500 mt-1">Gérez les notes de frais et remboursements</p>
              </div>
              <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700">
                <Plus className="h-4 w-4" /> Nouvelle note
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500">Total</p>
              <p className="text-xl font-semibold text-gray-900">{formatCurrency(stats.total)}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500">En attente</p>
              <p className="text-xl font-semibold text-yellow-600">{formatCurrency(stats.pending)}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500">Approuvé</p>
              <p className="text-xl font-semibold text-green-600">{formatCurrency(stats.approved)}</p>
            </div>
          </div>

          {/* Filtres */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input type="text" placeholder="Rechercher..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
                <option value="all">Tous statuts</option>
                <option value="draft">Brouillons</option>
                <option value="submitted">En attente</option>
                <option value="approved">Approuvés</option>
                <option value="paid">Remboursés</option>
                <option value="rejected">Refusés</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employé</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Catégorie</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Montant</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Statut</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-500">Aucune note de frais</td></tr>
                ) : filtered.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-600">{new Date(expense.date).toLocaleDateString("fr-FR")}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{expense.employee_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{expense.category}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{expense.description}</td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">{formatCurrency(expense.amount)}</td>
                    <td className="px-4 py-3 text-center">{getStatusBadge(expense.status)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        {expense.status === "submitted" && (
                          <>
                            <button onClick={() => approveExpense(expense.id)} className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="Approuver"><CheckCircle className="h-4 w-4" /></button>
                            <button onClick={() => rejectExpense(expense.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Refuser"><XCircle className="h-4 w-4" /></button>
                          </>
                        )}
                        <button onClick={() => router.push(`/hr/expenses/${expense.id}`)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded"><Eye className="h-4 w-4" /></button>
                        {expense.receipt_url && <button className="p-1.5 text-gray-400 hover:text-gray-600 rounded"><Download className="h-4 w-4" /></button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showCreateModal && <CreateExpenseModal onClose={() => setShowCreateModal(false)} onCreated={fetchExpenses} categories={expenseCategories} />}
    </>
  );
}

function CreateExpenseModal({ onClose, onCreated, categories }: { onClose: () => void; onCreated: () => void; categories: string[] }) {
  const [form, setForm] = useState({ date: "", category: "", description: "", amount: 0 });
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    const token = localStorage.getItem("seka_access_token");
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/hr/expenses`, {
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
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Nouvelle note de frais</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
              <option value="">Sélectionner...</option>
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Montant</label>
            <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Annuler</button>
          <button onClick={handleCreate} disabled={loading || !form.date || !form.category} className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg disabled:opacity-50">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Créer"}
          </button>
        </div>
      </div>
    </div>
  );
}
