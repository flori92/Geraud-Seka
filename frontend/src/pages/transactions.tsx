import { useState, useEffect, useCallback } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Link from "next/link";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { getBankTransactions, getBankAccounts, type BankTransaction, type BankAccount } from "@/lib/api";
import { formatCurrency } from "@/lib/formatters";
import {
  Search, ArrowLeftRight, RefreshCw, Clock, AlertCircle, Wallet, Plus
} from "lucide-react";


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
  });

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem("seka_access_token");
    if (!token) {
      router.push("/login");
      return;
    }

    setLoading(true);
    try {
      const [txData, accountsData] = await Promise.all([
        getBankTransactions(token, {}, 0, 500),
        getBankAccounts(token),
      ]);

      setTransactions(txData);
      setBankAccounts(accountsData);

      const totalBalance = accountsData.reduce((sum, acc) => sum + (acc.current_balance || 0), 0);
      const pendingCount = txData.filter(tx => tx.status === "pending").length;
      const unreconciledCount = txData.filter(tx => !tx.is_reconciled).length;

      setStats({
        solde: totalBalance,
        demandesComptables: pendingCount,
        rapprochementsSuggeres: unreconciledCount,
      });
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
  };

  const getStatusBadge = (status: string, isReconciled: boolean) => {
    if (isReconciled) return <Badge variant="success">Rapprochée</Badge>;
    if (status === "validated") return <Badge variant="default">Validée</Badge>;
    return <Badge variant="warning">Non justifiée</Badge>;
  };

  const pendingCount = transactions.filter(tx => tx.status === "pending").length;
  const validatedCount = transactions.filter(tx => tx.status === "validated").length;

  return (
    <>
      <Head>
        <title>Transactions - SEKA</title>
      </Head>

      <DashboardLayout title="Transactions">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Transactions</h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Gérez et rapprochez vos transactions bancaires
            </p>
          </div>
          <div className="flex gap-2 sm:gap-3">
            <Button variant="secondary" size="sm" onClick={fetchData}>
              <RefreshCw className={`h-4 w-4 mr-1 sm:mr-2 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Synchroniser</span>
            </Button>
            <Link href="/accounting/bank-reconciliation">
              <Button variant="primary" size="sm">
                <ArrowLeftRight className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Rapprochement IA</span>
              </Button>
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            {error}
          </div>
        )}

        {/* KPIs */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mb-6 sm:mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 sm:p-6 text-white shadow-lg">
            <div className="flex items-start justify-between">
              <div className="rounded-xl bg-white/20 p-2 sm:p-3">
                <Wallet className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
            </div>
            <p className="text-xs sm:text-sm font-medium text-white/80 mt-3 sm:mt-4">Solde total</p>
            {loading ? (
              <Skeleton className="h-6 sm:h-8 w-24 sm:w-32 mt-1 bg-white/20" />
            ) : (
              <p className="text-xl sm:text-3xl font-bold text-white mt-1">{formatCurrency(stats.solde)}</p>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="rounded-xl bg-orange-500 p-2 sm:p-3">
                <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
            </div>
            <p className="text-xs sm:text-sm font-medium text-gray-500 mt-3 sm:mt-4">À justifier</p>
            {loading ? (
              <Skeleton className="h-6 sm:h-8 w-16 sm:w-20 mt-1" />
            ) : (
              <p className="text-xl sm:text-3xl font-bold text-orange-600 mt-1">{stats.demandesComptables}</p>
            )}
            <p className="text-xs sm:text-sm text-gray-500 mt-2">Transactions en attente</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="rounded-xl bg-blue-500 p-2 sm:p-3">
                <ArrowLeftRight className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
            </div>
            <p className="text-xs sm:text-sm font-medium text-gray-500 mt-3 sm:mt-4">Non rapprochées</p>
            {loading ? (
              <Skeleton className="h-6 sm:h-8 w-16 sm:w-20 mt-1" />
            ) : (
              <p className="text-xl sm:text-3xl font-bold text-blue-600 mt-1">{stats.rapprochementsSuggeres}</p>
            )}
            <p className="text-xs sm:text-sm text-gray-500 mt-2">À rapprocher</p>
          </div>
        </div>

        {/* Filters & Table */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="p-3 sm:p-4 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-3">
              <div className="relative w-full sm:flex-1 sm:min-w-[200px] sm:max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher une transaction..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="hidden lg:flex items-center gap-2">
                <span className="text-xs text-gray-500">Du</span>
                <input
                  type="date"
                  value={dateRange.start || ""}
                  onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value || undefined }))}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <span className="text-xs text-gray-500">au</span>
                <input
                  type="date"
                  value={dateRange.end || ""}
                  onChange={(e) => setDateRange((prev) => ({ ...prev, end: e.target.value || undefined }))}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              {bankAccounts.length > 0 && (
                <select
                  className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  onChange={(e) => setSelectedAccounts(e.target.value ? [e.target.value] : [])}
                >
                  <option value="">Tous les comptes</option>
                  {bankAccounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                  ))}
                </select>
              )}
              {categoryOptions.length > 0 && (
                <select
                  className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="">Toutes les catégories</option>
                  {categoryOptions.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab("tout")}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === "tout" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                  }`}
              >
                Tout <span className="text-gray-400 ml-1">{transactions.length}</span>
              </button>
              <button
                onClick={() => setActiveTab("pending")}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === "pending" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                  }`}
              >
                Non justifiées <span className="text-orange-500 ml-1">{pendingCount}</span>
              </button>
              <button
                onClick={() => setActiveTab("validated")}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === "validated" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                  }`}
              >
                Validées <span className="text-blue-500 ml-1">{validatedCount}</span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-4 sm:p-8 space-y-3 sm:space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 sm:h-14 w-full" />
                ))}
              </div>
            ) : (
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Statut</th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Libellé</th>
                    <th className="px-3 sm:px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Montant</th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Catégorie</th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Tiers</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                        <ArrowLeftRight className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p>Aucune transaction trouvée</p>
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.slice(0, 50).map((tx) => (
                      <tr key={tx.id} className="hover:bg-gray-50 cursor-pointer">
                        <td className="px-4 py-3">
                          {getStatusBadge(tx.status, tx.is_reconciled)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">{formatDate(tx.transaction_date)}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">{tx.description}</td>
                        <td className={`px-4 py-3 text-sm font-semibold text-right ${tx.transaction_type === "credit" ? "text-green-600" : "text-red-600"
                          }`}>
                          {tx.transaction_type === "credit" ? "+" : "-"}{formatCurrency(tx.amount)}
                        </td>
                        <td className="px-4 py-3">
                          {tx.category ? (
                            <span className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full font-medium">{tx.category}</span>
                          ) : (
                            <button className="w-6 h-6 rounded-full border border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-blue-500 hover:text-blue-500">
                              <Plus className="w-3 h-3" />
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">{tx.counterparty || "-"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-3 sm:px-4 py-3 sm:py-4 border-t border-gray-100">
            <span className="text-xs sm:text-sm text-gray-500 text-center sm:text-left">{filteredTransactions.length} transactions</span>
            <div className="flex items-center gap-2">
              <Link href="/accounting/bank-reconciliation" className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium">
                Rapprocher avec l&apos;IA →
              </Link>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}
