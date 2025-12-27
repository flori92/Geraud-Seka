import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Head from "next/head";
import { PennylaneSidebar } from "@/components/layout/PennylaneSidebar";
import { Search, ArrowRight, Loader2, RefreshCw, Users, Building2, BookOpen } from "lucide-react";
import { getLetteringSummary, type LetteringItem } from "@/lib/api";

export default function LetteringPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<LetteringItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    const token = localStorage.getItem("seka_access_token");
    if (!token) { router.push("/login"); return; }
    setLoading(true);
    setError(null);
    try {
      const year = new Date().getFullYear();
      const data = await getLetteringSummary(token, year);
      setItems(data.items || []);
    } catch {
      setError("Erreur lors du chargement du lettrage");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = items.filter((i) => {
    const q = search.toLowerCase();
    return i.tier.toLowerCase().includes(q) || i.reference.toLowerCase().includes(q);
  });

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
        <title>Lettrage - SEKA</title>
      </Head>
      <div className="min-h-screen bg-gray-50">
        <PennylaneSidebar />
        <main className="ml-[220px]">
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Lettrage</h1>
                <p className="text-sm text-gray-600 mt-0.5">Suivi et préparation du lettrage clients/fournisseurs</p>
              </div>
              <button onClick={fetchData} className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
                <RefreshCw className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="px-6 py-6 space-y-6">
            {error && <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

            {/* Quick Links */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { href: "/clients/balance", icon: Users, title: "Balance âgée clients", color: "bg-blue-100 text-blue-600" },
                { href: "/suppliers/balance", icon: Building2, title: "Balance âgée fournisseurs", color: "bg-orange-100 text-orange-600" },
                { href: "/accounting/ledger", icon: BookOpen, title: "Grand livre", color: "bg-green-100 text-green-600" },
              ].map((item, idx) => (
                <Link key={idx} href={item.href} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                  <div className={`w-10 h-10 rounded-lg ${item.color} flex items-center justify-center mb-3`}>
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div className="font-medium text-gray-900">{item.title}</div>
                  <div className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                    Ouvrir <ArrowRight className="w-4 h-4" />
                  </div>
                </Link>
              ))}
            </div>

            {/* Search & Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                <div className="relative w-full max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un tiers ou une référence..."
                    className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]" />
                </div>
                <button onClick={() => setSearch("")} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Réinitialiser</button>
              </div>

              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tiers</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Référence</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Montant</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-500">Aucun élément</td></tr>
                  ) : (
                    filtered.map((i) => (
                      <tr key={i.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">{i.tier}</td>
                        <td className="px-4 py-3 text-sm font-mono text-gray-700">{i.reference}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900">{i.amount.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{i.status}</td>
                        <td className="px-4 py-3 text-right">
                          <button className="px-3 py-1.5 text-sm text-[#1e3a5f] border border-gray-200 rounded-lg hover:bg-gray-50">Ouvrir</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
                <span className="text-sm text-gray-500">{filtered.length} élément(s)</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
