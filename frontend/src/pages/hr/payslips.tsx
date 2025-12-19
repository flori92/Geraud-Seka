import { useState, useEffect } from "react";
import Head from "next/head";
import { PennylaneSidebar } from "@/components/layout/PennylaneSidebar";
import { getPayslips, Payslip } from "@/lib/api";
import { Plus, Download, FileText, X, Loader2, Receipt } from "lucide-react";

export default function PayslipsPage() {
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [formData, setFormData] = useState({
    period_start: new Date().toISOString().split('T')[0], period_end: new Date().toISOString().split('T')[0],
    gross_salary: 0, deductions: 0, bonuses: 0
  });

  useEffect(() => { fetchPayslips(); }, []);

  const fetchPayslips = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("seka_access_token");
      if (!token) { setError("Vous devez être connecté"); return; }
      const data = await getPayslips(token);
      setPayslips(data);
      setError(null);
    } catch { setError("Erreur lors du chargement des bulletins"); } finally { setLoading(false); }
  };

  const stats = [
    { label: "Total bulletins", value: payslips.length, color: "bg-[#1e3a5f]" },
    { label: "Payés", value: payslips.filter(p => p.status === "paid").length, color: "bg-green-600" },
    { label: "En attente", value: payslips.filter(p => p.status === "pending").length, color: "bg-orange-600" },
    { label: "Coût total", value: Math.round(payslips.reduce((sum, p) => sum + p.net_salary, 0) / 1000) + "K", color: "bg-blue-600" },
  ];

  const getStatusBadge = (status: string) => {
    const config: Record<string, { bg: string; text: string; label: string }> = {
      "draft": { bg: "bg-gray-100", text: "text-gray-700", label: "Brouillon" },
      "paid": { bg: "bg-green-100", text: "text-green-700", label: "Payé" },
      "pending": { bg: "bg-orange-100", text: "text-orange-700", label: "En attente" },
    };
    const c = config[status] || { bg: "bg-gray-100", text: "text-gray-700", label: status };
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${c.bg} ${c.text}`}>{c.label}</span>;
  };

  const filteredPayslips = payslips.filter(p => statusFilter === "all" || p.status === statusFilter);

  return (
    <>
      <Head><title>Bulletins de paie - SEKA</title></Head>
      <div className="min-h-screen bg-gray-50">
        <PennylaneSidebar />
        <main className="ml-[220px]">
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gray-100"><Receipt className="h-5 w-5 text-gray-600" /></div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">Bulletins de paie</h1>
                  <p className="text-sm text-gray-600 mt-0.5">Gestion de la paie</p>
                </div>
              </div>
              <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] text-white text-sm font-medium rounded-lg hover:bg-[#172e4d]">
                <Plus className="h-4 w-4" /> Nouveau bulletin
              </button>
            </div>
          </div>

          <div className="px-6 py-6">
            {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

            <div className="grid gap-4 md:grid-cols-4 mb-6">
              {stats.map((stat, idx) => (
                <div key={idx} className="bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-3">
                  <div className={`h-12 w-12 rounded-lg ${stat.color} flex items-center justify-center`}>
                    <span className="text-xl font-bold text-white">{stat.value}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-lg border border-gray-200 mb-6 p-4">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]">
                <option value="all">Tous les statuts</option>
                <option value="draft">Brouillon</option>
                <option value="pending">En attente</option>
                <option value="paid">Payé</option>
              </select>
            </div>

            <div className="bg-white rounded-lg border border-gray-200">
              {loading ? (
                <div className="p-12 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#1e3a5f]" /></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-gray-200 bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employé</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Période</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Salaire brut</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Déductions</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bonus</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Salaire net</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredPayslips.map((payslip) => (
                        <tr key={payslip.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{payslip.employee_name || payslip.employee_id}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{new Date(payslip.period_start).toLocaleDateString("fr-FR", { month: "short", year: "numeric" })}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{payslip.gross_salary.toLocaleString()} FCFA</td>
                          <td className="px-4 py-3 text-sm text-red-600">-{payslip.deductions.toLocaleString()} FCFA</td>
                          <td className="px-4 py-3 text-sm text-green-600">+{payslip.bonuses.toLocaleString()} FCFA</td>
                          <td className="px-4 py-3 text-sm font-bold text-gray-900">{payslip.net_salary.toLocaleString()} FCFA</td>
                          <td className="px-4 py-3">{getStatusBadge(payslip.status)}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button className="p-1 hover:bg-gray-100 rounded"><FileText className="h-4 w-4 text-gray-500" /></button>
                              <button className="p-1 hover:bg-gray-100 rounded"><Download className="h-4 w-4 text-gray-500" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg w-full max-w-lg mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Nouveau bulletin de paie</h2>
                <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded"><X className="h-5 w-5 text-gray-500" /></button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">Période début *</label>
                    <input type="date" value={formData.period_start} onChange={(e) => setFormData({ ...formData, period_start: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">Période fin *</label>
                    <input type="date" value={formData.period_end} onChange={(e) => setFormData({ ...formData, period_end: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]" /></div>
                </div>
                <div><label className="block text-sm font-medium text-gray-700 mb-2">Salaire brut (FCFA) *</label>
                  <input type="number" value={formData.gross_salary} onChange={(e) => setFormData({ ...formData, gross_salary: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]" placeholder="0" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">Déductions (FCFA)</label>
                    <input type="number" value={formData.deductions} onChange={(e) => setFormData({ ...formData, deductions: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]" placeholder="0" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">Bonus (FCFA)</label>
                    <input type="number" value={formData.bonuses} onChange={(e) => setFormData({ ...formData, bonuses: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]" placeholder="0" /></div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Salaire net:</span>
                    <span className="text-lg font-bold text-gray-900">{(formData.gross_salary - formData.deductions + formData.bonuses).toLocaleString()} FCFA</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowModal(false)} className="flex-1 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Annuler</button>
                <button disabled={formData.gross_salary <= 0}
                  className="flex-1 py-2 text-sm text-white bg-[#1e3a5f] rounded-lg hover:bg-[#172e4d] disabled:opacity-50"
                  onClick={() => { alert("Fonctionnalité en cours de développement"); setShowModal(false); }}>Créer le bulletin</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
