import { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { PennylaneSidebar } from "@/components/layout/PennylaneSidebar";
import {
  Search,
  Filter,
  ChevronDown,
  X,
  Download,
  User,
  AlertCircle,
  Clock,
  Calendar,
  TrendingDown,
  CheckCircle2,
  FileText,
  Mail,
  Phone,
  Building2
} from "lucide-react";

// Types
interface SupplierBalance {
  id: string;
  supplier_name: string;
  supplier_code: string;
  balance: number;
  overdue_amount: number;
  upcoming_30d_amount: number;
  last_invoice_date: string;
  last_invoice_number: string;
  payment_terms: string;
  contact_email?: string;
  contact_phone?: string;
  invoices_count: number;
  oldest_overdue_date?: string;
}

interface SupplierBalanceStats {
  total_du: number;           // Total owed
  en_retard: number;         // Overdue amount
  a_payer_30j: number;       // To pay within 30 days
  fournisseurs_actifs: number; // Active suppliers count
}

interface FilterChip {
  id: string;
  label: string;
  value: string;
  type: 'status' | 'amount' | 'date';
}

export default function SupplierBalancePage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<SupplierBalance[]>([]);
  const [stats, setStats] = useState<SupplierBalanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterChip[]>([]);
  const [showFiltersMenu, setShowFiltersMenu] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'balance' | 'overdue'>('balance');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [perPage, setPerPage] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";
  const apiPrefix = API_BASE_URL ? `${API_BASE_URL}/api/v1` : "/api/v1";

  useEffect(() => {
    fetchSupplierBalanceData();
  }, [filters, sortBy, sortOrder]);

  const fetchSupplierBalanceData = async () => {
    const token = localStorage.getItem("seka_access_token");
    if (!token) {
      router.push("/login");
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      params.append('sort_by', sortBy);
      params.append('sort_order', sortOrder);
      filters.forEach(filter => {
        params.append(filter.type, filter.value);
      });

      // Fetch supplier balances
      const suppliersResponse = await fetch(
        `${apiPrefix}/suppliers/balance?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (suppliersResponse.ok) {
        const data = await suppliersResponse.json();
        setSuppliers(Array.isArray(data) ? data : []);
      }

      // Fetch stats
      const statsResponse = await fetch(
        `${apiPrefix}/suppliers/balance/stats`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error("Error fetching supplier balance data:", error);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const addFilter = (filter: FilterChip) => {
    setFilters([...filters, filter]);
    setShowFiltersMenu(false);
  };

  const removeFilter = (filterId: string) => {
    setFilters(filters.filter(f => f.id !== filterId));
  };

  const filteredSuppliers = suppliers.filter(supplier => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        supplier.supplier_name.toLowerCase().includes(query) ||
        supplier.supplier_code.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const paginatedSuppliers = filteredSuppliers.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );

  const totalPages = Math.ceil(filteredSuppliers.length / perPage);

  const exportToExcel = () => {
    const headers = [
      "supplier_name",
      "supplier_code",
      "balance",
      "overdue_amount",
      "upcoming_30d_amount",
      "last_invoice_date",
      "last_invoice_number",
      "payment_terms",
      "invoices_count",
      "oldest_overdue_date",
      "contact_email",
      "contact_phone",
    ];

    const escapeCsv = (value: unknown) => {
      const s = value === null || value === undefined ? "" : String(value);
      const escaped = s.replace(/\"/g, '""');
      return `"${escaped}"`;
    };

    const rows = filteredSuppliers.map((s) => [
      s.supplier_name,
      s.supplier_code,
      s.balance,
      s.overdue_amount,
      s.upcoming_30d_amount,
      s.last_invoice_date,
      s.last_invoice_number,
      s.payment_terms,
      s.invoices_count,
      s.oldest_overdue_date || "",
      s.contact_email || "",
      s.contact_phone || "",
    ]);

    const csv = [headers.map(escapeCsv).join(","), ...rows.map((r) => r.map(escapeCsv).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `balance-fournisseurs-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Head>
        <title>Balance fournisseurs - SEKA</title>
      </Head>
      <div className="min-h-screen bg-gray-50">
        <PennylaneSidebar />
        <main className="ml-[220px]">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Balance fournisseurs</h1>
                <p className="text-sm text-gray-600 mt-0.5">
                  Suivi des soldes et échéances fournisseurs
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
                <Link
                  href="/achats/factures-fournisseurs"
                  className="px-4 py-2 bg-[#0d4a44] text-white rounded-lg hover:bg-[#0a3d38] flex items-center gap-2 text-sm font-medium"
                >
                  <FileText className="h-4 w-4" />
                  Factures fournisseurs
                </Link>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="px-6 py-6">
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Total dû</span>
                  <TrendingDown className="h-4 w-4 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats?.total_du || 0)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Montant total à payer</p>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">En retard</span>
                  <AlertCircle className="h-4 w-4 text-red-600" />
                </div>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(stats?.en_retard || 0)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Factures échues</p>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">À payer sous 30j</span>
                  <Clock className="h-4 w-4 text-orange-600" />
                </div>
                <p className="text-2xl font-bold text-orange-600">
                  {formatCurrency(stats?.a_payer_30j || 0)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Échéances à venir</p>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Fournisseurs actifs</span>
                  <Building2 className="h-4 w-4 text-purple-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.fournisseurs_actifs || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">Avec solde</p>
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
                      placeholder="Rechercher un fournisseur..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d4a44] focus:border-transparent text-sm"
                    />
                  </div>

                  {/* Sort By */}
                  <div className="relative">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0d4a44] focus:border-transparent pr-10"
                    >
                      <option value="balance">Trier par solde</option>
                      <option value="overdue">Trier par retard</option>
                      <option value="name">Trier par nom</option>
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
                            onClick={() => addFilter({ id: Date.now().toString(), label: 'Avec retard', value: 'overdue', type: 'status' })}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
                          >
                            Statut: Avec retard
                          </button>
                          <button
                            onClick={() => addFilter({ id: Date.now().toString(), label: 'Solde > 100k', value: '100000', type: 'amount' })}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
                          >
                            Montant: Solde &gt; 100 000 FCFA
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Suppliers Table */}
              {loading ? (
                <div className="p-12 text-center">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#0d4a44] border-r-transparent"></div>
                  <p className="text-sm text-gray-600 mt-3">Chargement des balances fournisseurs...</p>
                </div>
              ) : filteredSuppliers.length === 0 ? (
                <div className="p-12 text-center">
                  <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">Aucun fournisseur trouvé</p>
                  <p className="text-sm text-gray-500 mt-2">Tous vos comptes fournisseurs sont soldés</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Fournisseur
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Solde
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            En retard
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            À payer 30j
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Dernière facture
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Conditions
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Contact
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {paginatedSuppliers.map((supplier) => (
                          <tr
                            key={supplier.id}
                            className="hover:bg-gray-50 cursor-pointer"
                            onClick={() => router.push(`/suppliers/${supplier.id}`)}
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                                  <Building2 className="h-5 w-5 text-purple-600" />
                                </div>
                                <div>
                                  <span className="text-sm font-medium text-gray-900">{supplier.supplier_name}</span>
                                  <p className="text-xs text-gray-500">{supplier.supplier_code}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <span className="text-sm font-bold text-gray-900">
                                {formatCurrency(supplier.balance)}
                              </span>
                              <p className="text-xs text-gray-500">{supplier.invoices_count} facture(s)</p>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              {supplier.overdue_amount > 0 ? (
                                <div>
                                  <span className="text-sm font-semibold text-red-600 flex items-center justify-end gap-1">
                                    <AlertCircle className="h-4 w-4" />
                                    {formatCurrency(supplier.overdue_amount)}
                                  </span>
                                  {supplier.oldest_overdue_date && (
                                    <p className="text-xs text-red-500">
                                      Depuis {formatDate(supplier.oldest_overdue_date)}
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <span className="text-sm text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              {supplier.upcoming_30d_amount > 0 ? (
                                <span className="text-sm font-semibold text-orange-600">
                                  {formatCurrency(supplier.upcoming_30d_amount)}
                                </span>
                              ) : (
                                <span className="text-sm text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <span className="text-sm text-gray-900">{supplier.last_invoice_number}</span>
                                <p className="text-xs text-gray-500">{formatDate(supplier.last_invoice_date)}</p>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-600">{supplier.payment_terms}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                {supplier.contact_email && (
                                  <a
                                    href={`mailto:${supplier.contact_email}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="p-1 hover:bg-gray-100 rounded text-gray-600 hover:text-[#0d4a44]"
                                    title={supplier.contact_email}
                                  >
                                    <Mail className="h-4 w-4" />
                                  </a>
                                )}
                                {supplier.contact_phone && (
                                  <a
                                    href={`tel:${supplier.contact_phone}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="p-1 hover:bg-gray-100 rounded text-gray-600 hover:text-[#0d4a44]"
                                    title={supplier.contact_phone}
                                  >
                                    <Phone className="h-4 w-4" />
                                  </a>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                              <Link
                                href={`/suppliers/${supplier.id}/invoices`}
                                className="text-xs text-[#0d4a44] hover:text-[#0a3d38] font-medium"
                              >
                                Voir factures
                              </Link>
                            </td>
                          </tr>
                        ))}
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
                        <option value={filteredSuppliers.length}>Tout</option>
                      </select>
                      <span className="text-sm text-gray-600">éléments par page</span>
                      <span className="ml-4 text-sm text-gray-600">
                        {filteredSuppliers.length} fournisseur(s) au total
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
