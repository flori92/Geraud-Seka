import { useState, useEffect } from "react";
import Head from "next/head";
import { PennylaneSidebar } from "@/components/layout/PennylaneSidebar";
import { getInventory, InventoryItem } from "@/lib/api";
import { Package, AlertTriangle, CheckCircle, Search, Loader2 } from "lucide-react";

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => { fetchInventory(); }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("seka_access_token");
      if (!token) { setError("Vous devez être connecté"); return; }
      const data = await getInventory(token);
      setInventory(data);
      setError(null);
    } catch { setError("Erreur lors du chargement de l&apos;inventaire"); } finally { setLoading(false); }
  };

  const stats = [
    { label: "Total articles", value: inventory.length, color: "bg-[#1e3a5f]" },
    { label: "En stock", value: inventory.filter(i => i.status === "in_stock").length, color: "bg-green-600" },
    { label: "Stock bas", value: inventory.filter(i => i.status === "low_stock").length, color: "bg-orange-600" },
    { label: "Rupture", value: inventory.filter(i => i.status === "out_of_stock").length, color: "bg-red-600" },
  ];

  const getStatusBadge = (status: string) => {
    const config: Record<string, { bg: string; text: string; label: string; icon: React.ReactNode }> = {
      "in_stock": { bg: "bg-green-100", text: "text-green-700", label: "En stock", icon: <CheckCircle className="h-3 w-3" /> },
      "low_stock": { bg: "bg-orange-100", text: "text-orange-700", label: "Stock bas", icon: <AlertTriangle className="h-3 w-3" /> },
      "out_of_stock": { bg: "bg-red-100", text: "text-red-700", label: "Rupture", icon: <Package className="h-3 w-3" /> },
    };
    const c = config[status] || { bg: "bg-gray-100", text: "text-gray-700", label: status, icon: null };
    return <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${c.bg} ${c.text}`}>{c.icon}{c.label}</span>;
  };

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.product_name?.toLowerCase().includes(search.toLowerCase()) || item.sku?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <>
      <Head><title>Inventaire - SEKA</title></Head>
      <div className="min-h-screen bg-gray-50">
        <PennylaneSidebar />
        <main className="ml-[220px]">
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gray-100"><Package className="h-5 w-5 text-gray-600" /></div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">Inventaire</h1>
                  <p className="text-sm text-gray-600 mt-0.5">État des stocks en temps réel</p>
                </div>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] text-white text-sm font-medium rounded-lg hover:bg-[#172e4d]">
                <Package className="h-4 w-4" /> Ajuster le stock
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

            {inventory.filter(i => i.status === "out_of_stock").length > 0 && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <p className="text-sm text-red-700">{inventory.filter(i => i.status === "out_of_stock").length} article(s) en rupture de stock</p>
              </div>
            )}

            <div className="bg-white rounded-lg border border-gray-200 mb-6 p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-1 gap-3 max-w-2xl">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un article..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]" />
                  </div>
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]">
                    <option value="all">Tous les statuts</option>
                    <option value="in_stock">En stock</option>
                    <option value="low_stock">Stock bas</option>
                    <option value="out_of_stock">Rupture</option>
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
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produit</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Emplacement</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantité</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dernière MàJ</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredInventory.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 text-gray-400" />
                              <span className="text-sm font-medium text-gray-900">{item.product_name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm font-mono text-gray-500">{item.sku}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{item.location || "-"}</td>
                          <td className="px-4 py-3">
                            <span className={`text-sm font-bold ${item.quantity === 0 ? "text-red-600" : item.status === "low_stock" ? "text-orange-600" : "text-green-600"}`}>
                              {item.quantity}
                            </span>
                          </td>
                          <td className="px-4 py-3">{getStatusBadge(item.status)}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{item.last_updated ? new Date(item.last_updated).toLocaleDateString("fr-FR") : "-"}</td>
                          <td className="px-4 py-3">
                            <button className="text-sm text-[#1e3a5f] hover:underline font-medium">Ajuster</button>
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
    </>
  );
}
