import { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { PennylaneSidebar } from "@/components/layout/PennylaneSidebar";
import { getInvoices, type Invoice } from "@/lib/api";
import { Download, Filter, Loader2, Search } from "lucide-react";

export default function FacturesClients() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<{ start?: string; end?: string }>({});

  useEffect(() => {
    const token = localStorage.getItem("seka_access_token");
    if (!token) {
      router.push("/login");
      return;
    }
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getInvoices(token);
        setInvoices(Array.isArray(data) ? data : []);
        setError(null);
      } catch (err: any) {
        console.error("Error fetching client invoices:", err);
        setError("Erreur lors du chargement des factures clients");
        setInvoices([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [router]);

  const filtered = useMemo(() => {
    return invoices.filter((inv) => {
      const q = searchQuery.toLowerCase();
      if (q) {
        const match =
          inv.id.toLowerCase().includes(q) ||
          inv.number?.toLowerCase().includes(q) ||
          inv.client_name?.toLowerCase().includes(q);
        if (!match) return false;
      }

      if (statusFilter !== "all") {
        const s = (inv.status || "").toLowerCase();
        if (!s.includes(statusFilter)) return false;
      }

      if (dateRange.start) {
        const start = new Date(dateRange.start);
        const d = new Date(inv.date);
        if (d < start) return false;
      }
      if (dateRange.end) {
        const end = new Date(dateRange.end);
        const d = new Date(inv.date);
        if (d > end) return false;
      }

      return true;
    });
  }, [invoices, searchQuery, statusFilter, dateRange]);

  const formatDate = (str?: string) =>
    str ? new Date(str).toLocaleDateString("fr-FR") : "-";

  const formatAmount = (val?: number) =>
    (val || 0).toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + " FCFA";

  return (
    <>
      <Head><title>Factures clients - SEKA</title></Head>
      <div className="min-h-screen bg-gray-50">
        <PennylaneSidebar />
        <main className="ml-[220px] p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Factures clients</h1>
              <p className="text-sm text-gray-500">Suivez vos factures de vente et leurs paiements</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden lg:flex items-center gap-2 text-xs text-gray-500">
                <span>Période</span>
                <input
                  type="date"
                  value={dateRange.start || ""}
                  onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value || undefined }))}
                  className="px-2 py-1 border border-gray-200 rounded-lg text-xs text-gray-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
                />
                <span className="text-gray-400">au</span>
                <input
                  type="date"
                  value={dateRange.end || ""}
                  onChange={(e) => setDateRange((prev) => ({ ...prev, end: e.target.value || undefined }))}
                  className="px-2 py-1 border border-gray-200 rounded-lg text-xs text-gray-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
                />
              </div>
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                <Download className="w-4 h-4" />
                Exporter
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-sm text-red-700 rounded-lg">{error}</div>
          )}

          {/* Filtres */}
          <div className="bg-white rounded-xl border border-gray-200 mb-6">
            <div className="p-4 border-b border-gray-200 flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-[220px] max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher (client, n° facture)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-600"
              >
                <option value="all">Tous les statuts</option>
                <option value="brouillon">Brouillon</option>
                <option value="unpaid">Impayée</option>
                <option value="partial">Partiellement payée</option>
                <option value="paid">Payée</option>
                <option value="overdue">En retard</option>
              </select>
              <button className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                <Filter className="w-4 h-4" />
                Filtres
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200">
            <div className="overflow-x-auto">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
                  <span className="ml-2 text-gray-500">Chargement des factures...</span>
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">Aucune facture client trouvée</p>
                  <p className="text-sm text-gray-400 mt-1">Créez vos premières factures pour commencer</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">N° facture</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Montant</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Payé</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Échéance</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filtered.map((inv) => (
                      <tr key={inv.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">{formatDate(inv.date)}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{inv.client_name || "-"}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{inv.number || inv.id}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900">{formatAmount(inv.amount)}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900">{formatAmount(inv.paid)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{formatDate(inv.due_date)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 capitalize">{inv.status || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
