import { useState, useEffect } from "react";
import Head from "next/head";
import { PennylaneSidebar } from "@/components/layout/PennylaneSidebar";
import { getDeliveryNotes, DeliveryNote } from "@/lib/api";
import { Plus, Eye, Download, Truck, Search, RefreshCw, Loader2 } from "lucide-react";

export default function DeliveryNotesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deliveryNotes, setDeliveryNotes] = useState<DeliveryNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDeliveryNotes = async () => {
    setLoading(true);
    const token = localStorage.getItem("seka_access_token");
    if (!token) { setError("Vous devez être connecté"); setLoading(false); return; }
    try {
      const data = await getDeliveryNotes(token);
      setDeliveryNotes(data);
      setError(null);
    } catch {
      setError("Erreur lors du chargement des bons de livraison");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveryNotes();
  }, []);

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = { "preparing": "En préparation", "in_transit": "En transit", "delivered": "Livré", "cancelled": "Annulé" };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = { "preparing": "bg-gray-100 text-gray-700", "in_transit": "bg-orange-100 text-orange-700", "delivered": "bg-green-100 text-green-700", "cancelled": "bg-red-100 text-red-700" };
    return colors[status] || "bg-gray-100 text-gray-700";
  };

  const filtered = deliveryNotes.filter(n => {
    const matchSearch = n.number.toLowerCase().includes(searchTerm.toLowerCase()) || (n.client_name || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === "all" || n.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = [
    { label: "Total BL", value: deliveryNotes.length, color: "bg-[#1e3a5f]" },
    { label: "Livrés", value: deliveryNotes.filter(d => d.status === "delivered").length, color: "bg-green-600" },
    { label: "En transit", value: deliveryNotes.filter(d => d.status === "in_transit").length, color: "bg-orange-600" },
    { label: "En préparation", value: deliveryNotes.filter(d => d.status === "preparing").length, color: "bg-gray-600" },
  ];

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#1e3a5f]" /></div>;
  }

  return (
    <>
      <Head><title>Bons de livraison - SEKA</title></Head>
      <div className="min-h-screen bg-gray-50">
        <PennylaneSidebar />
        <main className="ml-[220px]">
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gray-100"><Truck className="h-5 w-5 text-gray-600" /></div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">Bons de livraison</h1>
                  <p className="text-sm text-gray-600 mt-0.5">Gérez vos bons de livraison</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={fetchDeliveryNotes} className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"><RefreshCw className="h-5 w-5" /></button>
                <button className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] text-white text-sm font-medium rounded-lg hover:bg-[#172e4d]">
                  <Plus className="h-4 w-4" /> Nouveau BL
                </button>
              </div>
            </div>
          </div>

          <div className="px-6 py-6 space-y-6">
            {error && <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map((stat, idx) => (
                <div key={idx} className="bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-lg ${stat.color} flex items-center justify-center`}>
                    <span className="text-lg font-bold text-white">{stat.value}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input type="text" placeholder="Rechercher..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]" />
              </div>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]">
                <option value="all">Tous les statuts</option>
                <option value="preparing">En préparation</option>
                <option value="in_transit">En transit</option>
                <option value="delivered">Livré</option>
              </select>
            </div>

            {/* Grid */}
            {filtered.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <Truck className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Aucun bon de livraison trouvé</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filtered.map((note) => (
                  <div key={note.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="rounded-lg bg-gray-100 p-2"><Truck className="h-5 w-5 text-gray-600" /></div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{note.number}</h3>
                        <p className="text-sm text-gray-500">{note.client_name || note.client_id}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-t border-gray-100 pt-3 mb-3">
                      <div><p className="text-xs text-gray-500">Date</p><p className="text-sm font-medium text-gray-900">{new Date(note.date).toLocaleDateString("fr-FR")}</p></div>
                      <div className="text-right"><p className="text-xs text-gray-500">Articles</p><p className="text-sm font-medium text-gray-900">{note.items_count}</p></div>
                    </div>
                    <div className="flex items-center justify-between border-t border-gray-100 pt-3 mb-3">
                      <span className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium ${getStatusColor(note.status)}`}>
                        <Truck className="h-3 w-3" /> {getStatusLabel(note.status)}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
                        <Eye className="h-4 w-4" /> Voir
                      </button>
                      <button className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-sm text-white bg-[#1e3a5f] rounded-lg hover:bg-[#172e4d]">
                        <Download className="h-4 w-4" /> PDF
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
