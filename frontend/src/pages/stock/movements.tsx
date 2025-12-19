import { useState, useEffect } from "react";
import Head from "next/head";
import { PennylaneSidebar } from "@/components/layout/PennylaneSidebar";
import { getStockMovements, StockMovement } from "@/lib/api";
import { Plus, ArrowDown, ArrowUp, RefreshCw, ArrowRight, Search, Loader2, Truck } from "lucide-react";

export default function MovementsPage() {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => { fetchMovements(); }, []);

  const fetchMovements = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("seka_access_token");
      if (!token) { setError("Vous devez être connecté"); return; }
      const data = await getStockMovements(token);
      setMovements(Array.isArray(data) ? data : []);
      setError(null);
    } catch { setError("Erreur lors du chargement des mouvements"); setMovements([]); } finally { setLoading(false); }
  };

  const movementList = Array.isArray(movements) ? movements : [];

  const stats = [
    { label: "Total mouvements", value: movementList.length, color: "bg-[#1e3a5f]" },
    { label: "Entrées", value: movementList.filter(m => m.movement_type === "in").length, color: "bg-green-600" },
    { label: "Sorties", value: movementList.filter(m => m.movement_type === "out").length, color: "bg-red-600" },
    { label: "Ajustements", value: movementList.filter(m => m.movement_type === "adjustment").length, color: "bg-orange-600" },
  ];

  const getMovementBadge = (type: string) => {
    const config: Record<string, { bg: string; text: string; label: string; icon: React.ReactNode }> = {
      "in": { bg: "bg-green-100", text: "text-green-700", label: "Entrée", icon: <ArrowDown className="h-3 w-3" /> },
      "out": { bg: "bg-red-100", text: "text-red-700", label: "Sortie", icon: <ArrowUp className="h-3 w-3" /> },
      "adjustment": { bg: "bg-orange-100", text: "text-orange-700", label: "Ajustement", icon: <RefreshCw className="h-3 w-3" /> },
      "transfer": { bg: "bg-blue-100", text: "text-blue-700", label: "Transfert", icon: <ArrowRight className="h-3 w-3" /> },
    };
    const c = config[type] || { bg: "bg-gray-100", text: "text-gray-700", label: type, icon: null };
    return <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${c.bg} ${c.text}`}>{c.icon}{c.label}</span>;
  };

  const filteredMovements = movementList.filter(m => {
    const matchesSearch = m.product_name?.toLowerCase().includes(search.toLowerCase()) || m.reference?.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "all" || m.movement_type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <>
      <Head><title>Mouvements de stock - SEKA</title></Head>
      <div className="min-h-screen bg-gray-50">
        <PennylaneSidebar />
        <main className="ml-[220px]">
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gray-100"><Truck className="h-5 w-5 text-gray-600" /></div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">Mouvements de stock</h1>
                  <p className="text-sm text-gray-600 mt-0.5">Historique des entrées et sorties</p>
                </div>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] text-white text-sm font-medium rounded-lg hover:bg-[#172e4d]">
                <Plus className="h-4 w-4" /> Nouveau mouvement
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
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-1 gap-3 max-w-2xl">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un mouvement..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]" />
                  </div>
                  <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]">
                    <option value="all">Tous les types</option>
                    <option value="in">Entrées</option>
                    <option value="out">Sorties</option>
                    <option value="adjustment">Ajustements</option>
                    <option value="transfer">Transferts</option>
                  </select>
                </div>
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
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produit</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantité</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Référence</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Raison</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Créé par</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredMovements.map((movement) => (
                        <tr key={movement.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {new Date(movement.created_at).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{movement.product_name || movement.product_id}</td>
                          <td className="px-4 py-3">{getMovementBadge(movement.movement_type)}</td>
                          <td className="px-4 py-3">
                            <span className={`text-sm font-bold ${movement.movement_type === "in" ? "text-green-600" : movement.movement_type === "out" ? "text-red-600" : "text-gray-900"}`}>
                              {movement.movement_type === "in" ? "+" : movement.movement_type === "out" ? "-" : ""}{movement.quantity}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm font-mono text-gray-500">{movement.reference || "-"}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{movement.reason || "-"}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{movement.created_by || "-"}</td>
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
    </>
  );
}
