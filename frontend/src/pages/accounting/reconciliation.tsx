import { useCallback, useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { PennylaneSidebar } from "@/components/layout/PennylaneSidebar";
import {
  Search,
  Filter,
  ChevronDown,
  X,
  Download,
  CheckCircle2,
  Clock,
  AlertCircle,
  Link as LinkIcon,
  Unlink,
  RefreshCw,
  Building2,
  Calendar,
  Sparkles,
  ArrowRight
} from "lucide-react";

// Types
interface BankTransaction {
  id: string;
  date: string;
  label: string;
  bank_amount: number;
  account_entry_id?: string;
  account_entry_label?: string;
  account_entry_amount?: number;
  status: ReconciliationStatus;
  bank_account: string;
  match_confidence?: number; // AI matching confidence 0-100
}

type ReconciliationStatus = 'pending' | 'auto_matched' | 'manually_matched' | 'reconciled';

interface ReconciliationStats {
  a_rapprocher: number;      // Transactions to reconcile count
  rapprochees_ce_mois: number; // Reconciled this month
  en_attente: number;        // Pending count
  dernier_rapprochement: string; // Last reconciliation date
}

interface FilterChip {
  id: string;
  label: string;
  value: string;
  type: 'date' | 'status' | 'account' | 'amount';
}

export default function ReconciliationPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [stats, setStats] = useState<ReconciliationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterChip[]>([]);
  const [showFiltersMenu, setShowFiltersMenu] = useState(false);
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const [selectedBankAccount, setSelectedBankAccount] = useState<string>('all');
  const [perPage, setPerPage] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);
  const [autoMatchRunning, setAutoMatchRunning] = useState(false);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "";
  const apiPrefix = API_BASE_URL ? `${API_BASE_URL}/api/v1` : "/api/v1";

  const fetchReconciliationData = useCallback(async () => {
    const token = localStorage.getItem("seka_access_token");
    if (!token) {
      router.push("/login");
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (selectedBankAccount !== 'all') {
        params.append('bank_account', selectedBankAccount);
      }
      filters.forEach(filter => {
        params.append(filter.type, filter.value);
      });

      // Fetch transactions
      const transactionsResponse = await fetch(
        `${apiPrefix}/accounting/reconciliation/transactions?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (transactionsResponse.ok) {
        const data = await transactionsResponse.json();
        setTransactions(Array.isArray(data) ? data : []);
      }

      // Fetch stats
      const statsResponse = await fetch(
        `${apiPrefix}/accounting/reconciliation/stats`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error("Error fetching reconciliation data:", error);
    } finally {
      setLoading(false);
    }
  }, [apiPrefix, filters, router, searchQuery, selectedBankAccount]);

  useEffect(() => {
    fetchReconciliationData();
  }, [fetchReconciliationData]);

  const runAutoMatching = async () => {
    const token = localStorage.getItem("seka_access_token");
    setAutoMatchRunning(true);
    try {
      const response = await fetch(
        `${apiPrefix}/accounting/reconciliation/auto-match`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      if (response.ok) {
        fetchReconciliationData();
      }
    } catch (error) {
      console.error("Error running auto-matching:", error);
    } finally {
      setAutoMatchRunning(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusConfig = (status: ReconciliationStatus) => {
    const configs = {
      pending: {
        label: 'En attente',
        color: 'bg-orange-50 text-orange-700 border-orange-200',
        icon: Clock
      },
      auto_matched: {
        label: 'Rapprochement auto',
        color: 'bg-blue-50 text-blue-700 border-blue-200',
        icon: Sparkles
      },
      manually_matched: {
        label: 'Rapproché manuellement',
        color: 'bg-purple-50 text-purple-700 border-purple-200',
        icon: LinkIcon
      },
      reconciled: {
        label: 'Rapproché',
        color: 'bg-green-50 text-green-700 border-green-200',
        icon: CheckCircle2
      }
    };
    return configs[status] || configs.pending;
  };

  const addFilter = (filter: FilterChip) => {
    setFilters([...filters, filter]);
    setShowFiltersMenu(false);
  };

  const removeFilter = (filterId: string) => {
    setFilters(filters.filter(f => f.id !== filterId));
  };

  const handleReconcile = async (transactionId: string) => {
    const token = localStorage.getItem("seka_access_token");
    try {
      const response = await fetch(
        `${apiPrefix}/accounting/reconciliation/${transactionId}/reconcile`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      if (response.ok) {
        fetchReconciliationData();
      }
    } catch (error) {
      console.error("Error reconciling transaction:", error);
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        transaction.label.toLowerCase().includes(query) ||
        transaction.bank_account.toLowerCase().includes(query) ||
        (transaction.account_entry_label && transaction.account_entry_label.toLowerCase().includes(query))
      );
    }
    return true;
  });

  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );

  const totalPages = Math.ceil(filteredTransactions.length / perPage);

  const bankAccounts = [
    { value: 'all', label: 'Tous les comptes bancaires' },
    { value: 'main', label: 'Compte principal BCEAO' },
    { value: 'secondary', label: 'Compte secondaire BOA' },
    { value: 'savings', label: 'Compte épargne' }
  ];

  return (
    <>
      <Head>
        <title>Rapprochement bancaire - SEKA</title>
      </Head>
      <div className="min-h-screen bg-gray-50">
        <PennylaneSidebar />
        <main className="ml-[220px]">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Rapprochement bancaire</h1>
                <p className="text-sm text-gray-600 mt-0.5">
                  Rapprochez vos transactions bancaires avec votre comptabilité
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={runAutoMatching}
                  disabled={autoMatchRunning}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium flex items-center gap-2 disabled:opacity-50"
                >
                  {autoMatchRunning ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      En cours...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Rapprochement auto
                    </>
                  )}
                </button>
                <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Exporter
                </button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="px-6 py-6">
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Transactions à rapprocher</span>
                  <Clock className="h-4 w-4 text-orange-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.a_rapprocher || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">En attente</p>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Rapprochées ce mois</span>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.rapprochees_ce_mois || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">Ce mois-ci</p>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">En attente</span>
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-blue-600">
                  {stats?.en_attente || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">À traiter</p>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Dernier rapprochement</span>
                  <Calendar className="h-4 w-4 text-purple-600" />
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  {stats?.dernier_rapprochement ? formatDate(stats.dernier_rapprochement) : '-'}
                </p>
                <p className="text-xs text-gray-500 mt-1">Date</p>
              </div>
            </div>

            {/* Filters and Search */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  {/* Search */}
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Rechercher une transaction..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d4a44] focus:border-transparent text-sm"
                    />
                  </div>

                  {/* Bank Account Filter */}
                  <div className="relative">
                    <select
                      value={selectedBankAccount}
                      onChange={(e) => setSelectedBankAccount(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0d4a44] focus:border-transparent pr-10"
                    >
                      {bankAccounts.map(account => (
                        <option key={account.value} value={account.value}>{account.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Filter Chips */}
                  <div className="flex items-center gap-2">
                    {filters.map((filter) => (
                      <div
                        key={filter.id}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm"
                      >
                        <span>{filter.label}</span>
                        <button
                          onClick={() => removeFilter(filter.id)}
                          className="hover:bg-blue-100 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}

                    {/* Add Filter Button */}
                    <div className="relative">
                      <button
                        onClick={() => setShowFiltersMenu(!showFiltersMenu)}
                        className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                      >
                        <Filter className="h-4 w-4" />
                        <span>Filtres</span>
                        <ChevronDown className="h-4 w-4" />
                      </button>

                      {showFiltersMenu && (
                        <div className="absolute top-full mt-2 right-0 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10">
                          <button
                            onClick={() => addFilter({ id: Date.now().toString(), label: 'Non rapprochées', value: 'pending', type: 'status' })}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
                          >
                            Statut: Non rapprochées
                          </button>
                          <button
                            onClick={() => addFilter({ id: Date.now().toString(), label: 'Auto-rapprochées', value: 'auto_matched', type: 'status' })}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
                          >
                            Statut: Auto-rapprochées
                          </button>
                          <button
                            onClick={() => addFilter({ id: Date.now().toString(), label: 'Ce mois', value: 'current_month', type: 'date' })}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
                          >
                            Date: Ce mois
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Transactions Table */}
              {loading ? (
                <div className="p-12 text-center">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#0d4a44] border-r-transparent"></div>
                  <p className="text-sm text-gray-600 mt-3">Chargement des transactions...</p>
                </div>
              ) : filteredTransactions.length === 0 ? (
                <div className="p-12 text-center">
                  <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">Aucune transaction à rapprocher</p>
                  <p className="text-sm text-gray-500 mt-2">Toutes vos transactions sont rapprochées</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left">
                            <input
                              type="checkbox"
                              checked={selectedTransactions.length === filteredTransactions.length}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedTransactions(filteredTransactions.map(t => t.id));
                                } else {
                                  setSelectedTransactions([]);
                                }
                              }}
                              className="rounded border-gray-300"
                            />
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Libellé
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Montant bancaire
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Écriture comptable
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Montant écriture
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Statut
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {paginatedTransactions.map((transaction) => {
                          const statusConfig = getStatusConfig(transaction.status);
                          const StatusIcon = statusConfig.icon;

                          return (
                            <tr key={transaction.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4">
                                <input
                                  type="checkbox"
                                  checked={selectedTransactions.includes(transaction.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedTransactions([...selectedTransactions, transaction.id]);
                                    } else {
                                      setSelectedTransactions(selectedTransactions.filter(id => id !== transaction.id));
                                    }
                                  }}
                                  className="rounded border-gray-300"
                                />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                {formatDate(transaction.date)}
                              </td>
                              <td className="px-6 py-4">
                                <div>
                                  <span className="text-sm text-gray-900">{transaction.label}</span>
                                  <p className="text-xs text-gray-500">{transaction.bank_account}</p>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right">
                                <span className={`text-sm font-semibold ${
                                  transaction.bank_amount >= 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {formatCurrency(transaction.bank_amount)}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                {transaction.account_entry_label ? (
                                  <div className="flex items-center gap-2">
                                    <LinkIcon className="h-4 w-4 text-green-600" />
                                    <span className="text-sm text-gray-900">{transaction.account_entry_label}</span>
                                    {transaction.match_confidence && transaction.match_confidence > 80 && (
                                      <span className="text-xs text-blue-600 flex items-center gap-1">
                                        <Sparkles className="h-3 w-3" />
                                        {transaction.match_confidence}%
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-sm text-gray-400 flex items-center gap-1">
                                    <Unlink className="h-4 w-4" />
                                    Non rapproché
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right">
                                {transaction.account_entry_amount !== undefined ? (
                                  <span className="text-sm text-gray-900">
                                    {formatCurrency(transaction.account_entry_amount)}
                                  </span>
                                ) : (
                                  <span className="text-sm text-gray-400">-</span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${statusConfig.color}`}>
                                  <StatusIcon className="h-3 w-3" />
                                  {statusConfig.label}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right">
                                {transaction.status === 'pending' || transaction.status === 'auto_matched' ? (
                                  <button
                                    onClick={() => handleReconcile(transaction.id)}
                                    className="px-3 py-1 text-xs bg-[#0d4a44] text-white rounded hover:bg-[#0a3d38] flex items-center gap-1 ml-auto"
                                  >
                                    Rapprocher
                                    <ArrowRight className="h-3 w-3" />
                                  </button>
                                ) : (
                                  <button className="text-xs text-gray-500 hover:text-gray-700">
                                    Voir détails
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Afficher</span>
                      <select
                        value={perPage}
                        onChange={(e) => {
                          setPerPage(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                        className="border border-gray-300 rounded px-2 py-1 text-sm"
                      >
                        <option value="50">50</option>
                        <option value="100">100</option>
                        <option value="300">300</option>
                        <option value={filteredTransactions.length}>Tout</option>
                      </select>
                      <span className="text-sm text-gray-600">éléments par page</span>
                      <span className="ml-4 text-sm text-gray-600">
                        {filteredTransactions.length} transaction(s) au total
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Précédent
                      </button>
                      <span className="text-sm text-gray-600">
                        {currentPage} / {totalPages || 1}
                      </span>
                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Suivant
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
