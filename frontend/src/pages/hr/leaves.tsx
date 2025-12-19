import { useState, useEffect } from "react";
import Head from "next/head";
import { PennylaneSidebar } from "@/components/layout/PennylaneSidebar";
import { getLeaves, Leave } from "@/lib/api";
import { Plus, Calendar, X, Search, Loader2 } from "lucide-react";

export default function LeavesPage() {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [formData, setFormData] = useState({
    leave_type: "vacation", start_date: new Date().toISOString().split('T')[0], end_date: new Date().toISOString().split('T')[0], reason: ""
  });

  useEffect(() => { fetchLeaves(); }, []);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("seka_access_token");
      if (!token) { setError("Vous devez être connecté"); return; }
      const data = await getLeaves(token);
      setLeaves(data);
      setError(null);
    } catch { setError("Erreur lors du chargement des congés"); } finally { setLoading(false); }
  };

  const stats = [
    { label: "Total demandes", value: leaves.length, color: "bg-[#1e3a5f]" },
    { label: "En attente", value: leaves.filter(l => l.status === "pending").length, color: "bg-orange-600" },
    { label: "Approuvées", value: leaves.filter(l => l.status === "approved").length, color: "bg-green-600" },
    { label: "Jours total", value: leaves.filter(l => l.status === "approved").reduce((sum, l) => sum + l.days_count, 0), color: "bg-blue-600" },
  ];

  const getStatusBadge = (status: string) => {
    const config: Record<string, { bg: string; text: string; label: string }> = {
      "pending": { bg: "bg-orange-100", text: "text-orange-700", label: "En attente" },
      "approved": { bg: "bg-green-100", text: "text-green-700", label: "Approuvé" },
      "rejected": { bg: "bg-red-100", text: "text-red-700", label: "Refusé" },
    };
    const c = config[status] || { bg: "bg-gray-100", text: "text-gray-700", label: status };
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${c.bg} ${c.text}`}>{c.label}</span>;
  };

  const getTypeBadge = (type: string) => {
    const config: Record<string, { bg: string; text: string; label: string }> = {
      "vacation": { bg: "bg-blue-100", text: "text-blue-700", label: "Congé payé" },
      "sick": { bg: "bg-red-100", text: "text-red-700", label: "Maladie" },
      "personal": { bg: "bg-purple-100", text: "text-purple-700", label: "Personnel" },
      "maternity": { bg: "bg-pink-100", text: "text-pink-700", label: "Maternité" },
      "unpaid": { bg: "bg-gray-100", text: "text-gray-700", label: "Sans solde" },
    };
    const c = config[type] || { bg: "bg-gray-100", text: "text-gray-700", label: type };
    return <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${c.bg} ${c.text}`}><Calendar className="h-3 w-3" />{c.label}</span>;
  };

  const filteredLeaves = leaves.filter(l => statusFilter === "all" || l.status === statusFilter);

  return (
    <>
      <Head><title>Congés - SEKA</title></Head>
      <div className="min-h-screen bg-gray-50">
        <PennylaneSidebar />
        <main className="ml-[220px]">
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gray-100"><Calendar className="h-5 w-5 text-gray-600" /></div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">Congés</h1>
                  <p className="text-sm text-gray-600 mt-0.5">Gestion des demandes de congés</p>
                </div>
              </div>
              <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] text-white text-sm font-medium rounded-lg hover:bg-[#172e4d]">
                <Plus className="h-4 w-4" /> Nouvelle demande
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
              <div className="flex items-center gap-3">
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]">
                  <option value="all">Tous les statuts</option>
                  <option value="pending">En attente</option>
                  <option value="approved">Approuvé</option>
                  <option value="rejected">Refusé</option>
                </select>
              </div>
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
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Début</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fin</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Durée</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Raison</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredLeaves.map((leave) => (
                        <tr key={leave.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{leave.employee_name || leave.employee_id}</td>
                          <td className="px-4 py-3">{getTypeBadge(leave.leave_type)}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{new Date(leave.start_date).toLocaleDateString("fr-FR")}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{new Date(leave.end_date).toLocaleDateString("fr-FR")}</td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{leave.days_count} jour{leave.days_count > 1 ? "s" : ""}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{leave.reason || "-"}</td>
                          <td className="px-4 py-3">{getStatusBadge(leave.status)}</td>
                          <td className="px-4 py-3">
                            {leave.status === "pending" && (
                              <div className="flex items-center gap-2">
                                <button className="text-sm text-green-600 hover:underline font-medium">Approuver</button>
                                <button className="text-sm text-red-600 hover:underline font-medium">Refuser</button>
                              </div>
                            )}
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
                <h2 className="text-xl font-semibold text-gray-900">Nouvelle demande de congé</h2>
                <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded"><X className="h-5 w-5 text-gray-500" /></button>
              </div>
              <div className="space-y-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-2">Type de congé *</label>
                  <select value={formData.leave_type} onChange={(e) => setFormData({ ...formData, leave_type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]">
                    <option value="vacation">Congé payé</option><option value="sick">Maladie</option><option value="personal">Personnel</option>
                    <option value="maternity">Maternité</option><option value="unpaid">Sans solde</option>
                  </select></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">Date de début *</label>
                    <input type="date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">Date de fin *</label>
                    <input type="date" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]" /></div>
                </div>
                <div><label className="block text-sm font-medium text-gray-700 mb-2">Raison</label>
                  <input type="text" value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]" placeholder="Motif de la demande..." /></div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowModal(false)} className="flex-1 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Annuler</button>
                <button disabled={!formData.start_date || !formData.end_date}
                  className="flex-1 py-2 text-sm text-white bg-[#1e3a5f] rounded-lg hover:bg-[#172e4d] disabled:opacity-50"
                  onClick={() => { alert("Fonctionnalité en cours de développement"); setShowModal(false); }}>Soumettre</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
