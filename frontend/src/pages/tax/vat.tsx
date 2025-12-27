import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { PennylaneSidebar } from "@/components/layout/PennylaneSidebar";
import {
  Plus,
  Search,
  Filter,
  ChevronDown,
  X,
  Download,
  Send,
  FileText,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  Edit,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Building2
} from "lucide-react";

interface VATDeclaration {
  id: string;
  period_start: string;
  period_end: string;
  period_label: string;  // e.g., "T1 2024", "Janvier 2024"
  vat_collected: number;  // TVA collectée
  vat_deductible: number; // TVA déductible
  vat_balance: number;    // Solde (à payer ou à rembourser)
  status: VATStatus;
  declaration_date?: string;
  payment_date?: string;
  created_at: string;
  updated_at: string;
}

type VATStatus = 'draft' | 'validated' | 'declared' | 'paid';

interface VATStats {
  a_declarer_ce_mois: number;    // To declare this month
  tva_collectee_totale: number;  // Total VAT collected
  tva_deductible_totale: number; // Total VAT deductible
  derniere_declaration: string;  // Last declaration date
}

interface FilterChip {
  id: string;
  label: string;
  value: string;
  type: 'status' | 'period' | 'year';
}

export default function VATDeclarationsPage() {
  const router = useRouter();
  const [declarations, setDeclarations] = useState<VATDeclaration[]>([]);
  const [stats, setStats] = useState<VATStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterChip[]>([]);
  const [showFiltersMenu, setShowFiltersMenu] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [perPage, setPerPage] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);
  const [showNewDeclarationModal, setShowNewDeclarationModal] = useState(false);

  useEffect(() => {
    fetchVATData();
  }, [filters, selectedYear]);

  const fetchVATData = async () => {
    const token = localStorage.getItem("seka_access_token");
    if (!token) {
      router.push("/login");
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      params.append('year', selectedYear);
      filters.forEach(filter => {
        params.append(filter.type, filter.value);
      });

      const declarationsResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/tax/vat-declarations?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (declarationsResponse.ok) {
        const data = await declarationsResponse.json();
        setDeclarations(Array.isArray(data) ? data : []);
      }

      const statsResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/tax/vat-declarations/stats`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error("Error fetching VAT data:", error);
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

  const getStatusConfig = (status: VATStatus) => {
    const configs = {
      draft: {
        label: 'Brouillon',
        color: 'bg-gray-100 text-gray-700 border-gray-200',
        icon: FileText
      },
      validated: {
        label: 'Validée',
        color: 'bg-blue-50 text-blue-700 border-blue-200',
        icon: CheckCircle2
      },
      declared: {
        label: 'Télédéclarée',
        color: 'bg-purple-50 text-purple-700 border-purple-200',
        icon: Send
      },
      paid: {
        label: 'Payée',
        color: 'bg-green-50 text-green-700 border-green-200',
        icon: CheckCircle2
      }
    };
    return configs[status] || configs.draft;
  };

  const addFilter = (filter: FilterChip) => {
    setFilters([...filters, filter]);
    setShowFiltersMenu(false);
  };

  const removeFilter = (filterId: string) => {
    setFilters(filters.filter(f => f.id !== filterId));
  };

  const handleTeleDeclare = async (declarationId: string) => {
    const token = localStorage.getItem("seka_access_token");
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/tax/vat-declarations/${declarationId}/declare`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      if (response.ok) {
        fetchVATData();
        alert('Déclaration télédéclarée avec succès');
      }
    } catch (error) {
      console.error("Error declaring VAT:", error);
    }
  };

  const filteredDeclarations = declarations.filter(declaration => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return declaration.period_label.toLowerCase().includes(query);
    }
    return true;
  });

  const paginatedDeclarations = filteredDeclarations.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );

  const totalPages = Math.ceil(filteredDeclarations.length / perPage);

  const years = Array.from({ length: 5 }, (_, i) => {
    const year = new Date().getFullYear() - i;
    return { value: year.toString(), label: year.toString() };
  });

  return (
    <>
      <Head>
        <title>Déclarations TVA - SEKA</title>
      </Head>
      <div className="min-h-screen bg-gray-50">
        <PennylaneSidebar />
        <main className="ml-[220px]">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Déclarations TVA</h1>
                <p className="text-sm text-gray-600 mt-0.5">
                  Gérez vos déclarations de TVA
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowNewDeclarationModal(true)}
                  className="px-4 py-2 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#172e4d] flex items-center gap-2 text-sm font-medium"
                >
                  <Plus className="h-4 w-4" />
                  Nouvelle déclaration
                </button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="px-6 py-6">
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">À déclarer ce mois</span>
                  <Clock className="h-4 w-4 text-orange-600" />
                </div>
                <p className="text-2xl font-bold text-orange-600">
                  {formatCurrency(stats?.a_declarer_ce_mois || 0)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Montant à déclarer</p>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">TVA collectée</span>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats?.tva_collectee_totale || 0)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Total collecté</p>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">TVA déductible</span>
                  <TrendingDown className="h-4 w-4 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats?.tva_deductible_totale || 0)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Total déductible</p>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Dernière déclaration</span>
                  <Calendar className="h-4 w-4 text-purple-600" />
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  {stats?.derniere_declaration ? formatDate(stats.derniere_declaration) : '-'}
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
                      placeholder="Rechercher une période..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent text-sm"
                    />
                  </div>

                  {/* Year Filter */}
                  <div className="relative">
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent pr-10"
                    >
                      {years.map(year => (
                        <option key={year.value} value={year.value}>{year.label}</option>
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
                            onClick={() => addFilter({ id: Date.now().toString(), label: 'Brouillon', value: 'draft', type: 'status' })}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
                          >
                            Statut: Brouillon
                          </button>
                          <button
                            onClick={() => addFilter({ id: Date.now().toString(), label: 'Validées', value: 'validated', type: 'status' })}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
                          >
                            Statut: Validées
                          </button>
                          <button
                            onClick={() => addFilter({ id: Date.now().toString(), label: 'Télédéclarées', value: 'declared', type: 'status' })}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
                          >
                            Statut: Télédéclarées
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Declarations Table */}
              {loading ? (
                <div className="p-12 text-center">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#1e3a5f] border-r-transparent"></div>
                  <p className="text-sm text-gray-600 mt-3">Chargement des déclarations...</p>
                </div>
              ) : filteredDeclarations.length === 0 ? (
                <div className="p-12 text-center">
                  <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600 mb-4">Aucune déclaration de TVA</p>
                  <button
                    onClick={() => setShowNewDeclarationModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#172e4d]"
                  >
                    <Plus className="h-4 w-4" />
                    Créer une déclaration
                  </button>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Période
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            TVA collectée
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            TVA déductible
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Solde
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date déclaration
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
                        {paginatedDeclarations.map((declaration) => {
                          const statusConfig = getStatusConfig(declaration.status);
                          const StatusIcon = statusConfig.icon;

                          return (
                            <tr
                              key={declaration.id}
                              className="hover:bg-gray-50 cursor-pointer"
                              onClick={() => router.push(`/tax/vat/${declaration.id}`)}
                            >
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div>
                                  <span className="text-sm font-medium text-gray-900">{declaration.period_label}</span>
                                  <p className="text-xs text-gray-500">
                                    {formatDate(declaration.period_start)} - {formatDate(declaration.period_end)}
                                  </p>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right">
                                <span className="text-sm font-semibold text-green-600">
                                  {formatCurrency(declaration.vat_collected)}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right">
                                <span className="text-sm font-semibold text-blue-600">
                                  {formatCurrency(declaration.vat_deductible)}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right">
                                <div className="flex items-center justify-end gap-1">
                                  {declaration.vat_balance > 0 ? (
                                    <>
                                      <AlertCircle className="h-4 w-4 text-red-600" />
                                      <span className="text-sm font-bold text-red-600">
                                        {formatCurrency(declaration.vat_balance)}
                                      </span>
                                    </>
                                  ) : declaration.vat_balance < 0 ? (
                                    <>
                                      <TrendingDown className="h-4 w-4 text-green-600" />
                                      <span className="text-sm font-bold text-green-600">
                                        {formatCurrency(Math.abs(declaration.vat_balance))}
                                      </span>
                                    </>
                                  ) : (
                                    <span className="text-sm text-gray-400">-</span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 text-right">
                                  {declaration.vat_balance > 0 ? 'À payer' : declaration.vat_balance < 0 ? 'Crédit' : 'Équilibré'}
                                </p>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                {declaration.declaration_date ? formatDate(declaration.declaration_date) : '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${statusConfig.color}`}>
                                  <StatusIcon className="h-3 w-3" />
                                  {statusConfig.label}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center gap-2 justify-end">
                                  {declaration.status === 'validated' && (
                                    <button
                                      onClick={() => handleTeleDeclare(declaration.id)}
                                      className="px-3 py-1 text-xs bg-[#1e3a5f] text-white rounded hover:bg-[#172e4d] flex items-center gap-1"
                                    >
                                      <Send className="h-3 w-3" />
                                      Télédéclarer
                                    </button>
                                  )}
                                  <button
                                    onClick={() => router.push(`/tax/vat/${declaration.id}`)}
                                    className="p-1 hover:bg-gray-100 rounded text-gray-600"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </button>
                                  {declaration.status === 'draft' && (
                                    <button
                                      onClick={() => router.push(`/tax/vat/${declaration.id}/edit`)}
                                      className="p-1 hover:bg-gray-100 rounded text-gray-600"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </button>
                                  )}
                                </div>
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
                        <option value={filteredDeclarations.length}>Tout</option>
                      </select>
                      <span className="text-sm text-gray-600">éléments par page</span>
                      <span className="ml-4 text-sm text-gray-600">
                        {filteredDeclarations.length} déclaration(s) au total
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

      {/* New Declaration Modal */}
      {showNewDeclarationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Nouvelle déclaration de TVA</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Période</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]">
                  <option>T1 2024 (Janvier - Mars)</option>
                  <option>T2 2024 (Avril - Juin)</option>
                  <option>T3 2024 (Juillet - Septembre)</option>
                  <option>T4 2024 (Octobre - Décembre)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]">
                  <option>Déclaration trimestrielle</option>
                  <option>Déclaration mensuelle</option>
                  <option>Déclaration annuelle</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowNewDeclarationModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button className="flex-1 px-4 py-2 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#172e4d]">
                Créer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
