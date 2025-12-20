import { useState, useEffect } from "react";
import Head from "next/head";
import { PennylaneSidebar } from "@/components/layout/PennylaneSidebar";
import { getContracts, Contract } from "@/lib/api";
import { Plus, FileText, X, Search, Loader2 } from "lucide-react";

export default function ContractsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    contract_type: "CDI", start_date: new Date().toISOString().split('T')[0], end_date: "", salary: 0, position: ""
  });

  useEffect(() => { fetchContracts(); }, []);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("seka_access_token");
      if (!token) { setError("Vous devez être connecté"); return; }
      const data = await getContracts(token);
      setContracts(data);
      setError(null);
    } catch { setError("Erreur lors du chargement des contrats"); } finally { setLoading(false); }
  };

  const stats = [
    { label: "Total contrats", value: contracts.length, color: "bg-[#1e3a5f]" },
    { label: "Actifs", value: contracts.filter(c => c.status === "active").length, color: "bg-green-600" },
    { label: "CDI", value: contracts.filter(c => c.contract_type === "CDI").length, color: "bg-blue-600" },
    { label: "CDD", value: contracts.filter(c => c.contract_type === "CDD").length, color: "bg-orange-600" },
  ];

  const getStatusBadge = (status: string) => {
    const config: Record<string, { bg: string; text: string; label: string }> = {
      "active": { bg: "bg-green-100", text: "text-green-700", label: "Actif" },
      "expired": { bg: "bg-red-100", text: "text-red-700", label: "Expiré" },
      "terminated": { bg: "bg-gray-100", text: "text-gray-700", label: "Résilié" },
    };
    const c = config[status] || { bg: "bg-gray-100", text: "text-gray-700", label: status };
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${c.bg} ${c.text}`}>{c.label}</span>;
  };

  const getTypeBadge = (type: string) => {
    const config: Record<string, { bg: string; text: string }> = {
      "CDI": { bg: "bg-green-100", text: "text-green-700" },
      "CDD": { bg: "bg-blue-100", text: "text-blue-700" },
      "Stage": { bg: "bg-purple-100", text: "text-purple-700" },
      "Freelance": { bg: "bg-orange-100", text: "text-orange-700" },
    };
    const c = config[type] || { bg: "bg-gray-100", text: "text-gray-700" };
    return <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${c.bg} ${c.text}`}><FileText className="h-3 w-3" />{type}</span>;
  };

  const filteredContracts = contracts.filter(c => {
    const matchesSearch = c.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) || c.contract_type?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || c.contract_type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <>
      <Head><title>Contrats - SEKA</title></Head>
      <div className="min-h-screen bg-gray-50">
        <PennylaneSidebar />
        <main className="ml-[220px]">
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gray-100"><FileText className="h-5 w-5 text-gray-600" /></div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">Contrats</h1>
                  <p className="text-sm text-gray-600 mt-0.5">Gestion des contrats de travail</p>
                </div>
              </div>
              <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] text-white text-sm font-medium rounded-lg hover:bg-[#172e4d]">
                <Plus className="h-4 w-4" /> Nouveau contrat
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
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Rechercher un contrat..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]" />
                </div>
                <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]">
                  <option value="all">Tous les types</option>
                  <option value="CDI">CDI</option>
                  <option value="CDD">CDD</option>
                  <option value="Stage">Stage</option>
                  <option value="Freelance">Freelance</option>
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
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employé</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Début</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fin</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Salaire</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredContracts.map((contract) => (
                        <tr key={contract.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{contract.id.slice(0, 8)}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{contract.employee_name || contract.employee_id}</td>
                          <td className="px-4 py-3">{getTypeBadge(contract.contract_type)}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{new Date(contract.start_date).toLocaleDateString("fr-FR")}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{contract.end_date ? new Date(contract.end_date).toLocaleDateString("fr-FR") : "Indéterminée"}</td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{contract.salary.toLocaleString()} FCFA</td>
                          <td className="px-4 py-3">{getStatusBadge(contract.status)}</td>
                          <td className="px-4 py-3">
                            <button className="text-sm text-[#1e3a5f] hover:underline font-medium">Voir</button>
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
                <h2 className="text-xl font-semibold text-gray-900">Nouveau contrat</h2>
                <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded"><X className="h-5 w-5 text-gray-500" /></button>
              </div>
              <div className="space-y-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-2">Type de contrat *</label>
                  <select value={formData.contract_type} onChange={(e) => setFormData({ ...formData, contract_type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]">
                    <option value="CDI">CDI</option><option value="CDD">CDD</option><option value="Stage">Stage</option><option value="Freelance">Freelance</option>
                  </select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-2">Poste *</label>
                  <input type="text" value={formData.position} onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]" placeholder="Ex: Développeur Senior" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">Date de début *</label>
                    <input type="date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">Date de fin</label>
                    <input type="date" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]" />
                    <p className="text-xs text-gray-500 mt-1">Laisser vide pour CDI</p></div>
                </div>
                <div><label className="block text-sm font-medium text-gray-700 mb-2">Salaire (FCFA) *</label>
                  <input type="number" value={formData.salary} onChange={(e) => setFormData({ ...formData, salary: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]" placeholder="0" /></div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowModal(false)} className="flex-1 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Annuler</button>
                <button disabled={!formData.position || formData.salary <= 0}
                  className="flex-1 py-2 text-sm text-white bg-[#1e3a5f] rounded-lg hover:bg-[#172e4d] disabled:opacity-50"
                  onClick={() => { alert("Fonctionnalité en cours de développement"); setShowModal(false); }}>Créer le contrat</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
