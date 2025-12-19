import { useState, useEffect } from "react";
import Head from "next/head";
import { PennylaneSidebar } from "@/components/layout/PennylaneSidebar";
import { getEmployees, Employee } from "@/lib/api";
import { Plus, Mail, Phone, User, X, Search, Loader2, Users } from "lucide-react";

export default function EmployeesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "", last_name: "", email: "", phone: "", position: "", department: "",
    hire_date: new Date().toISOString().split('T')[0], salary: 0
  });

  useEffect(() => { fetchEmployees(); }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("seka_access_token");
      if (!token) { setError("Vous devez être connecté"); return; }
      const data = await getEmployees(token);
      setEmployees(data);
      setError(null);
    } catch { setError("Erreur lors du chargement des employés"); } finally { setLoading(false); }
  };

  const stats = [
    { label: "Total employés", value: employees.length, color: "bg-[#1e3a5f]" },
    { label: "Actifs", value: employees.filter(e => e.status === "active").length, color: "bg-green-600" },
    { label: "En congé", value: employees.filter(e => e.status === "on_leave").length, color: "bg-orange-600" },
    { label: "Masse salariale", value: Math.round(employees.reduce((sum, e) => sum + (e.salary || 0), 0) / 1000) + "K", color: "bg-[#1e3a5f]" },
  ];

  const getStatusBadge = (status: string) => {
    const config: Record<string, { bg: string; text: string; label: string }> = {
      "active": { bg: "bg-green-100", text: "text-green-700", label: "Actif" },
      "inactive": { bg: "bg-red-100", text: "text-red-700", label: "Inactif" },
      "on_leave": { bg: "bg-orange-100", text: "text-orange-700", label: "En congé" },
    };
    const c = config[status] || { bg: "bg-gray-100", text: "text-gray-700", label: status };
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${c.bg} ${c.text}`}>{c.label}</span>;
  };

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.position?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || emp.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <>
      <Head><title>Employés - SEKA</title></Head>
      <div className="min-h-screen bg-gray-50">
        <PennylaneSidebar />
        <main className="ml-[220px]">
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gray-100"><Users className="h-5 w-5 text-gray-600" /></div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">Employés</h1>
                  <p className="text-sm text-gray-600 mt-0.5">Gestion du personnel</p>
                </div>
              </div>
              <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] text-white text-sm font-medium rounded-lg hover:bg-[#172e4d]">
                <Plus className="h-4 w-4" /> Nouvel employé
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
                  <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Rechercher un employé..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]" />
                </div>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]">
                  <option value="all">Tous les statuts</option>
                  <option value="active">Actif</option>
                  <option value="on_leave">En congé</option>
                  <option value="inactive">Inactif</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-[#1e3a5f]" /></div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredEmployees.map((employee) => (
                  <div key={employee.id} className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-full bg-gray-100 p-3"><User className="h-5 w-5 text-gray-500" /></div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{employee.first_name} {employee.last_name}</h3>
                          <p className="text-sm text-gray-500">{employee.position}</p>
                        </div>
                      </div>
                      {getStatusBadge(employee.status)}
                    </div>
                    <div className="space-y-2 border-t border-gray-100 pt-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="h-4 w-4" /><span className="truncate">{employee.email}</span>
                      </div>
                      {employee.phone && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="h-4 w-4" /><span>{employee.phone}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between border-t border-gray-100 pt-3 mt-3 text-sm">
                      <div><p className="text-xs text-gray-500">Département</p><p className="font-medium text-gray-900">{employee.department || "-"}</p></div>
                      <div className="text-right"><p className="text-xs text-gray-500">Embauché le</p><p className="font-medium text-gray-900">{new Date(employee.hire_date).toLocaleDateString("fr-FR")}</p></div>
                    </div>
                    <div className="flex gap-2 pt-3 mt-3 border-t border-gray-100">
                      <button className="flex-1 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Voir profil</button>
                      <button className="flex-1 py-2 text-sm text-white bg-[#1e3a5f] rounded-lg hover:bg-[#172e4d]">Modifier</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && filteredEmployees.length === 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <Users className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">Aucun employé trouvé</p>
              </div>
            )}
          </div>
        </main>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Nouvel employé</h2>
                <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded"><X className="h-5 w-5 text-gray-500" /></button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">Prénom *</label>
                    <input type="text" value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]" placeholder="Ex: Jean" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">Nom *</label>
                    <input type="text" value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]" placeholder="Ex: Dupont" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                    <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]" placeholder="jean@example.com" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                    <input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]" placeholder="+229 XX XX XX XX" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">Poste *</label>
                    <input type="text" value={formData.position} onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]" placeholder="Ex: Développeur" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">Département</label>
                    <input type="text" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]" placeholder="Ex: IT" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">Date d&apos;embauche *</label>
                    <input type="date" value={formData.hire_date} onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">Salaire (FCFA)</label>
                    <input type="number" value={formData.salary} onChange={(e) => setFormData({ ...formData, salary: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]" placeholder="0" /></div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowModal(false)} className="flex-1 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Annuler</button>
                <button disabled={!formData.first_name || !formData.last_name || !formData.email || !formData.position}
                  className="flex-1 py-2 text-sm text-white bg-[#1e3a5f] rounded-lg hover:bg-[#172e4d] disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => { alert("Fonctionnalité en cours de développement"); setShowModal(false); }}>
                  Créer l&apos;employé
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
