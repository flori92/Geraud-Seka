import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { PennylaneSidebar } from "@/components/layout/PennylaneSidebar";
import { CreateQuoteModal } from "@/components/forms/CreateQuoteModal";
import { getQuotes, Quote } from "@/lib/api";
import { Plus, Download, Send, Eye, Search, RefreshCw, Loader2, FileText } from "lucide-react";

export default function QuotesPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    setLoading(true);
    const token = localStorage.getItem("seka_access_token");
    if (!token) { router.push("/login"); return; }
    try {
      const data = await getQuotes(token);
      setQuotes(data);
      setError(null);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Erreur lors du chargement des devis";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: quotes.length,
    pending: quotes.filter(q => q.status === "En attente" || q.status === "pending").length,
    accepted: quotes.filter(q => q.status === "Accepté" || q.status === "accepted").length,
    totalAmount: quotes.reduce((sum, q) => sum + q.amount, 0),
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      "Brouillon": "bg-gray-100 text-gray-700",
      "En attente": "bg-orange-50 text-orange-700",
      "Accepté": "bg-green-50 text-green-700",
      "Refusé": "bg-red-50 text-red-700",
      "Expiré": "bg-red-50 text-red-700",
    };
    return styles[status] || "bg-gray-100 text-gray-700";
  };

  const isExpiringSoon = (validUntil: string) => {
    const days = Math.ceil((new Date(validUntil).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return days <= 7 && days > 0;
  };

  const filteredQuotes = quotes.filter(q => {
    const matchSearch = q.number?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                       q.client_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === "all" || q.status?.toLowerCase().includes(statusFilter);
    return matchSearch && matchStatus;
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
        <title>Devis - SEKA</title>
      </Head>
      <div className="min-h-screen bg-gray-50">
        <PennylaneSidebar />
        <main className="ml-[220px]">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Devis</h1>
                <p className="text-sm text-gray-600 mt-0.5">Gérez vos devis et propositions commerciales</p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={fetchQuotes} className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
                  <RefreshCw className="h-5 w-5" />
                </button>
                <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] text-white text-sm font-medium rounded-lg hover:bg-[#172e4d]">
                  <Plus className="h-4 w-4" />
                  Nouveau devis
                </button>
              </div>
            </div>
          </div>

          <div className="px-6 py-6 space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Total devis</span>
                  <FileText className="h-4 w-4 text-[#1e3a5f]" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">En attente</span>
                </div>
                <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Acceptés</span>
                </div>
                <p className="text-2xl font-bold text-green-600">{stats.accepted}</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Montant total</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{(stats.totalAmount / 1000).toFixed(0)}K FCFA</p>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher un devis..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="brouillon">Brouillon</option>
                  <option value="attente">En attente</option>
                  <option value="accepté">Accepté</option>
                  <option value="refusé">Refusé</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Numéro</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Validité</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Montant</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Statut</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredQuotes.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-gray-500">Aucun devis trouvé</td>
                    </tr>
                  ) : (
                    filteredQuotes.map((quote) => (
                      <tr key={quote.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{quote.number}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{quote.client_name || quote.client_id}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{new Date(quote.date).toLocaleDateString("fr-FR")}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            {new Date(quote.valid_until).toLocaleDateString("fr-FR")}
                            {isExpiringSoon(quote.valid_until) && (
                              <span className="px-2 py-0.5 text-xs font-medium bg-orange-50 text-orange-700 rounded-full">Expire bientôt</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">{quote.amount.toLocaleString()} FCFA</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(quote.status)}`}>{quote.status}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <button className="p-1.5 text-gray-400 hover:text-gray-600 rounded"><Eye className="h-4 w-4" /></button>
                            <button className="p-1.5 text-gray-400 hover:text-gray-600 rounded"><Download className="h-4 w-4" /></button>
                            <button className="p-1.5 text-gray-400 hover:text-[#1e3a5f] rounded"><Send className="h-4 w-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
                <span className="text-sm text-gray-500">{filteredQuotes.length} devis</span>
              </div>
            </div>
          </div>
        </main>
      </div>

      <CreateQuoteModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={fetchQuotes} />
    </>
  );
}
