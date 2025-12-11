import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { PennylaneSidebar } from "@/components/layout/PennylaneSidebar";
import { 
  getBankTransactions, 
  getBankAccounts,
  getTreasuryDashboard,
  type BankTransaction,
  type BankAccount
} from "@/lib/api";
import { 
  Search, Filter, Plus, CheckCircle2,
  RefreshCw, X, Settings2, Loader2
} from "lucide-react";

type TransactionStatus = "pending" | "validated" | "reconciled";

export default function TransactionsPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"tout" | "pending" | "validated">("tout");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<{ start?: string; end?: string }>({});
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  
  const [stats, setStats] = useState({
    solde: 0,
    demandesComptables: 0,
    rapprochementsSuggeres: 0,
    rapprochementsTotal: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("seka_access_token");
      if (!token) {
        router.push("/login");
        return;
      }

      setLoading(true);
      try {
        const [txData, accountsData, treasuryData] = await Promise.all([
          getBankTransactions(token, {}, 0, 500),
          getBankAccounts(token),
          getTreasuryDashboard(token)
        ]);

        setTransactions(txData);
        setBankAccounts(accountsData);
        
        // Calculate stats
        const totalBalance = accountsData.reduce((sum, acc) => sum + (acc.current_balance || 0), 0);
        const pendingCount = txData.filter(tx => tx.status === "pending").length;
        const unreconciledCount = txData.filter(tx => !tx.is_reconciled).length;
        
        setStats({
          solde: totalBalance,
          demandesComptables: pendingCount,
          rapprochementsSuggeres: unreconciledCount,
          rapprochementsTotal: treasuryData?.cash_flow_summary?.closing_balance || 0,
        });
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Erreur lors du chargement des données");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const categoryOptions = Array.from(
    new Set(transactions.map((tx) => tx.category).filter((c): c is string => Boolean(c)))
  );

  const filteredTransactions = transactions.filter(tx => {
    if (activeTab === "pending" && tx.status !== "pending") return false;
    if (activeTab === "validated" && tx.status !== "validated") return false;
    if (searchQuery && !tx.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (selectedAccounts.length > 0 && !selectedAccounts.includes(tx.bank_account_id)) return false;
    if (categoryFilter && tx.category !== categoryFilter) return false;

    if (dateRange.start) {
      const start = new Date(dateRange.start);
      const txDate = new Date(tx.transaction_date);
      if (txDate < start) return false;
    }
    if (dateRange.end) {
      const end = new Date(dateRange.end);
      const txDate = new Date(tx.transaction_date);
      if (txDate > end) return false;
    }
    return true;
  });

  const formatCurrency = (amount: number) => {
    const formatted = new Intl.NumberFormat("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Math.abs(amount));
    return amount < 0 ? `-${formatted} €` : `${formatted} €`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
  };

  const getStatusIcon = (status: TransactionStatus, isReconciled: boolean) => {
    if (isReconciled) return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    if (status === "validated") return <CheckCircle2 className="w-4 h-4 text-blue-500" />;
    return <X className="w-4 h-4 text-orange-500" />;
  };

  const getStatusLabel = (status: TransactionStatus, isReconciled: boolean) => {
    if (isReconciled) {
      return <span className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded text-xs font-medium">Rapprochée</span>;
    }
    if (status === "validated") {
      return <span className="text-blue-600 bg-blue-50 px-2 py-1 rounded text-xs font-medium">Validée</span>;
    }
    return <span className="text-orange-600 bg-orange-50 px-2 py-1 rounded text-xs font-medium">Non justifiée</span>;
  };

  const pendingCount = transactions.filter(tx => tx.status === "pending").length;
  const validatedCount = transactions.filter(tx => tx.status === "validated").length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <>
      <Head><title>Transactions - SEKA</title></Head>
      <div className="min-h-screen bg-gray-50">
        <PennylaneSidebar />
        <main className="ml-[220px] p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">Transactions</h1>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 text-teal-600 hover:text-teal-700 text-sm font-medium">
                <RefreshCw className="w-4 h-4" />
                Récupérer des transactions
              </button>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                Synchronisé
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-sm text-gray-500 mb-1">Solde des comptes</p>
              <div className="flex items-center gap-2">
                <span className="text-xl font-semibold text-gray-900">{formatCurrency(stats.solde)}</span>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-sm text-gray-500 mb-1">À justifier</p>
              <div className="flex items-center gap-2">
                <span className="bg-orange-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                  {stats.demandesComptables}
                </span>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-sm text-gray-500 mb-1">Non rapprochées</p>
              <div className="flex items-center gap-2">
                <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full">
                  {stats.rapprochementsSuggeres}
                </span>
              </div>
            </div>
          </div>

          {/* Filters & Table */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher une transaction..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div className="hidden xl:flex items-center gap-2">
                  <span className="text-xs text-gray-500">Période</span>
                  <input
                    type="date"
                    value={dateRange.start || ""}
                    onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value || undefined }))}
                    className="px-2 py-1 border border-gray-200 rounded-lg text-xs text-gray-600 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                  <span className="text-xs text-gray-400">au</span>
                  <input
                    type="date"
                    value={dateRange.end || ""}
                    onChange={(e) => setDateRange((prev) => ({ ...prev, end: e.target.value || undefined }))}
                    className="px-2 py-1 border border-gray-200 rounded-lg text-xs text-gray-600 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
                <button className="flex xl:hidden items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                  <Filter className="w-4 h-4" />
                  Filtres
                </button>
                {bankAccounts.length > 0 && (
                  <select 
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600"
                    onChange={(e) => setSelectedAccounts(e.target.value ? [e.target.value] : [])}
                  >
                    <option value="">Tous les comptes</option>
                    {bankAccounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.name}</option>
                    ))}
                  </select>
                )}
                <select
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="">Toutes les catégories</option>
                  {categoryOptions.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setActiveTab("tout")}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === "tout" ? "bg-gray-100 text-gray-900" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Tout <span className="text-gray-400 ml-1">{transactions.length}</span>
                </button>
                <button
                  onClick={() => setActiveTab("pending")}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === "pending" ? "bg-gray-100 text-gray-900" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Non justifiée <span className="text-orange-500 ml-1">{pendingCount}</span>
                </button>
                <button
                  onClick={() => setActiveTab("validated")}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === "validated" ? "bg-gray-100 text-gray-900" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Validée <span className="text-emerald-500 ml-1">{validatedCount}</span>
                </button>
              </div>
              <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
                <Settings2 className="w-4 h-4" />
                Personnaliser
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="w-10 px-4 py-3"><input type="checkbox" className="rounded border-gray-300" /></th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Libellé</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Montant</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Catégorie</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tiers</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Référence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                        Aucune transaction trouvée
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-gray-50 cursor-pointer">
                        <td className="px-4 py-3"><input type="checkbox" className="rounded border-gray-300" /></td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(tx.status, tx.is_reconciled)}
                            {getStatusLabel(tx.status, tx.is_reconciled)}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">{formatDate(tx.transaction_date)}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">{tx.description}</td>
                        <td className={`px-4 py-3 text-sm font-medium text-right ${
                          tx.transaction_type === "credit" ? "text-emerald-600" : "text-gray-900"
                        }`}>
                          {tx.transaction_type === "credit" ? "+" : "-"}{formatCurrency(tx.amount)}
                        </td>
                        <td className="px-4 py-3">
                          {tx.category ? (
                            <span className="bg-teal-50 text-teal-700 text-xs px-2 py-1 rounded">{tx.category}</span>
                          ) : (
                            <button className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-gray-400 hover:border-teal-500">
                              <Plus className="w-3 h-3" />
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">{tx.counterparty || "-"}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{tx.reference || "-"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">{filteredTransactions.length} transactions</span>
              </div>
              <div className="flex items-center gap-1">
                <button className="w-8 h-8 flex items-center justify-center rounded bg-teal-600 text-white font-medium">1</button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
