import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { PennylaneSidebar } from "@/components/layout/PennylaneSidebar";
import {
  Search,
  Filter,
  ChevronDown,
  X,
  Download,
  FileSpreadsheet,
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
  Settings
} from "lucide-react";

// Types
interface AccountBalance {
  account_number: string;
  account_name: string;
  debit: number;
  credit: number;
  balance: number;
  balance_n1: number;  // Balance from previous year (N-1)
  variance_amount: number;  // Variance N vs N-1 in amount
  variance_percent: number;  // Variance N vs N-1 in percentage
  parent_account?: string;
  level: number;  // Account hierarchy level (1=parent, 2=child, etc.)
}

interface BalanceFilters {
  account_type?: string;  // Par compte: Tous, Actif, Passif, Charges, Produits
  period?: string;  // Période complète, Personnalisée
  lettrage?: string;  // Lettrage du compte
  show_debit?: boolean;
  show_credit?: boolean;
  show_balance?: boolean;
  show_balance_n1?: boolean;
}

export default function BalanceGeneralePage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<AccountBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<BalanceFilters>({
    account_type: 'all',
    period: 'complete',
    show_debit: true,
    show_credit: true,
    show_balance: true,
    show_balance_n1: true
  });
  const [showFiltersMenu, setShowFiltersMenu] = useState(false);
  const [perPage, setPerPage] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchBalanceData();
  }, [filters, searchQuery]);

  const fetchBalanceData = async () => {
    const token = localStorage.getItem("seka_access_token");
    if (!token) {
      router.push("/login");
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (filters.account_type && filters.account_type !== 'all') {
        params.append('account_type', filters.account_type);
      }
      if (filters.period) params.append('period', filters.period);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/accounting/balance-generale?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.ok) {
        const data = await response.json();
        setAccounts(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Error fetching balance data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatPercent = (percent: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(percent / 100);
  };

  const getVarianceIcon = (variance: number) => {
    if (variance > 0) return <TrendingUp className="h-3 w-3 text-green-600" />;
    if (variance < 0) return <TrendingDown className="h-3 w-3 text-red-600" />;
    return <Minus className="h-3 w-3 text-gray-400" />;
  };

  const getVarianceColor = (variance: number) => {
    if (variance > 5) return 'text-green-600 font-semibold';
    if (variance < -5) return 'text-red-600 font-semibold';
    return 'text-gray-700';
  };

  const toggleAccountExpanded = (accountNumber: string) => {
    const newExpanded = new Set(expandedAccounts);
    if (newExpanded.has(accountNumber)) {
      newExpanded.delete(accountNumber);
    } else {
      newExpanded.add(accountNumber);
    }
    setExpandedAccounts(newExpanded);
  };

  const filteredAccounts = accounts.filter(account => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        account.account_number.toLowerCase().includes(query) ||
        account.account_name.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const paginatedAccounts = filteredAccounts.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );

  const totalPages = Math.ceil(filteredAccounts.length / perPage);

  const exportToExcel = () => {
    // In production, implement Excel export
    console.log('Exporting balance to Excel...');
  };

  const accountTypeOptions = [
    { value: 'all', label: 'Tous les comptes' },
    { value: 'actif', label: 'Actif' },
    { value: 'passif', label: 'Passif' },
    { value: 'charges', label: 'Charges' },
    { value: 'produits', label: 'Produits' }
  ];

  const periodOptions = [
    { value: 'complete', label: 'Période complète' },
    { value: 'current_year', label: 'Année en cours' },
    { value: 'current_quarter', label: 'Trimestre en cours' },
    { value: 'current_month', label: 'Mois en cours' },
    { value: 'custom', label: 'Période personnalisée' }
  ];

  return (
    <>
      <Head>
        <title>Balance générale - SEKA</title>
      </Head>
      <div className="min-h-screen bg-gray-50">
        <main>
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Balance générale</h1>
                <p className="text-sm text-gray-600 mt-0.5">
                  Visualisez les soldes de tous vos comptes avec comparaison N/N-1
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={exportToExcel}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Exporter
                </button>
                <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Colonnes
                </button>
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="px-6 py-4 bg-white border-b border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher par numéro ou nom de compte..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d4a44] focus:border-transparent text-sm"
                />
              </div>

              {/* Account Type Filter */}
              <div className="relative">
                <select
                  value={filters.account_type}
                  onChange={(e) => setFilters({ ...filters, account_type: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0d4a44] focus:border-transparent pr-10"
                >
                  {accountTypeOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Period Filter */}
              <div className="relative">
                <select
                  value={filters.period}
                  onChange={(e) => setFilters({ ...filters, period: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0d4a44] focus:border-transparent pr-10"
                >
                  {periodOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* More Filters */}
              <div className="relative">
                <button
                  onClick={() => setShowFiltersMenu(!showFiltersMenu)}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                >
                  <Filter className="h-4 w-4" />
                  <span>Plus d'options</span>
                  <ChevronDown className="h-4 w-4" />
                </button>

                {showFiltersMenu && (
                  <div className="absolute top-full mt-2 right-0 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10">
                    <div className="px-4 py-2 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900">Afficher les colonnes</p>
                    </div>
                    <div className="px-4 py-2 space-y-2">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={filters.show_debit}
                          onChange={(e) => setFilters({ ...filters, show_debit: e.target.checked })}
                          className="rounded border-gray-300"
                        />
                        <span>Débit</span>
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={filters.show_credit}
                          onChange={(e) => setFilters({ ...filters, show_credit: e.target.checked })}
                          className="rounded border-gray-300"
                        />
                        <span>Crédit</span>
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={filters.show_balance}
                          onChange={(e) => setFilters({ ...filters, show_balance: e.target.checked })}
                          className="rounded border-gray-300"
                        />
                        <span>Solde</span>
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={filters.show_balance_n1}
                          onChange={(e) => setFilters({ ...filters, show_balance_n1: e.target.checked })}
                          className="rounded border-gray-300"
                        />
                        <span>Solde N-1</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Balance Table */}
          <div className="px-6 py-6">
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              {loading ? (
                <div className="p-12 text-center">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#0d4a44] border-r-transparent"></div>
                  <p className="text-sm text-gray-600 mt-3">Chargement de la balance...</p>
                </div>
              ) : filteredAccounts.length === 0 ? (
                <div className="p-12 text-center">
                  <FileSpreadsheet className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">Aucun compte trouvé</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                            N° de compte
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Libellé du compte
                          </th>
                          {filters.show_debit && (
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-36">
                              Débit
                            </th>
                          )}
                          {filters.show_credit && (
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-36">
                              Crédit
                            </th>
                          )}
                          {filters.show_balance && (
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-36">
                              Solde
                            </th>
                          )}
                          {filters.show_balance_n1 && (
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-36">
                              Solde N-1
                            </th>
                          )}
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                            Var. N/N-1 (€)
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                            Var. (%)
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {paginatedAccounts.map((account) => {
                          const isParent = account.level === 1;
                          const isExpanded = expandedAccounts.has(account.account_number);

                          return (
                            <tr
                              key={account.account_number}
                              className={`hover:bg-gray-50 ${isParent ? 'bg-gray-50 font-semibold' : ''}`}
                            >
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  {isParent && (
                                    <button
                                      onClick={() => toggleAccountExpanded(account.account_number)}
                                      className="mr-2"
                                    >
                                      <ChevronDown
                                        className={`h-4 w-4 transition-transform ${
                                          isExpanded ? 'rotate-0' : '-rotate-90'
                                        }`}
                                      />
                                    </button>
                                  )}
                                  <span className="text-sm text-gray-900">{account.account_number}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span
                                  className={`text-sm ${
                                    isParent ? 'text-gray-900 font-semibold' : 'text-gray-700'
                                  }`}
                                  style={{ paddingLeft: `${(account.level - 1) * 1.5}rem` }}
                                >
                                  {account.account_name}
                                </span>
                              </td>
                              {filters.show_debit && (
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                  <span className="text-sm text-gray-900">
                                    {account.debit > 0 ? formatCurrency(account.debit) : '-'}
                                  </span>
                                </td>
                              )}
                              {filters.show_credit && (
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                  <span className="text-sm text-gray-900">
                                    {account.credit > 0 ? formatCurrency(account.credit) : '-'}
                                  </span>
                                </td>
                              )}
                              {filters.show_balance && (
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                  <span className={`text-sm font-semibold ${
                                    account.balance >= 0 ? 'text-gray-900' : 'text-red-600'
                                  }`}>
                                    {formatCurrency(account.balance)}
                                  </span>
                                </td>
                              )}
                              {filters.show_balance_n1 && (
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                  <span className="text-sm text-gray-600">
                                    {formatCurrency(account.balance_n1)}
                                  </span>
                                </td>
                              )}
                              <td className="px-6 py-4 whitespace-nowrap text-right">
                                <div className="flex items-center justify-end gap-1">
                                  {getVarianceIcon(account.variance_percent)}
                                  <span className={`text-sm ${getVarianceColor(account.variance_percent)}`}>
                                    {formatCurrency(account.variance_amount)}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right">
                                <span className={`text-sm ${getVarianceColor(account.variance_percent)}`}>
                                  {formatPercent(account.variance_percent)}
                                </span>
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
                        <option value={filteredAccounts.length}>∞ (Tout)</option>
                      </select>
                      <span className="text-sm text-gray-600">éléments par page</span>
                      <span className="ml-4 text-sm text-gray-600">
                        {filteredAccounts.length} compte(s) au total
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
