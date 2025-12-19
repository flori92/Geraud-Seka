import { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { PennylaneSidebar } from "@/components/layout/PennylaneSidebar";
import {
  Plus,
  FileText,
  Search,
  Filter,
  ChevronDown,
  X,
  Download,
  Send,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  Calendar,
  User,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle2,
  Mail,
  XCircle
} from "lucide-react";

// Types
interface Invoice {
  id: string;
  number: string;
  client_name: string;
  client_id: string;
  amount: number;
  tax_amount: number;
  total_amount: number;
  status: InvoiceStatus;
  due_date: string;
  issue_date: string;
  payment_date?: string;
  sent_at?: string;
  created_at: string;
  items: InvoiceItem[];
}

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  total: number;
}

type InvoiceStatus = 'draft' | 'pending' | 'overdue' | 'paid' | 'cancelled';
type TabFilter = 'all' | 'to_process' | 'upcoming' | 'overdue' | 'paid';

interface InvoiceStats {
  ca_facture: number;     // Total invoiced revenue
  ca_paye: number;        // Total paid revenue
  factures_retard: number; // Overdue invoices count
  factures_non_envoyees: number; // Unsent invoices count
}

interface FilterChip {
  id: string;
  label: string;
  value: string;
  type: 'date' | 'status' | 'due' | 'sent' | 'client';
}

export default function FacturesClientsPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState<InvoiceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterChip[]>([]);
  const [showFiltersMenu, setShowFiltersMenu] = useState(false);
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
  }, [activeTab, filters]);

  const fetchData = async () => {
    const token = localStorage.getItem("seka_access_token");
    if (!token) {
      router.push("/login");
      return;
    }

    setLoading(true);
    try {
      // Build query params
      const params = new URLSearchParams();
      if (activeTab !== 'all') {
        params.append('filter', activeTab);
      }
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      filters.forEach(filter => {
        params.append(filter.type, filter.value);
      });

      // Fetch invoices
      const invoicesResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/sales-invoices?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (invoicesResponse.ok) {
        const data = await invoicesResponse.json();
        setInvoices(Array.isArray(data) ? data : []);
      }

      // Fetch stats
      const statsResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/sales-invoices/stats`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error("Error fetching invoices:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate status automatically based on dates and payment
  const calculateInvoiceStatus = (invoice: Invoice): InvoiceStatus => {
    if (invoice.status === 'cancelled') return 'cancelled';
    if (invoice.payment_date) return 'paid';

    const today = new Date();
    const dueDate = new Date(invoice.due_date);
    const issueDate = new Date(invoice.issue_date);

    if (issueDate > today) return 'draft';
    if (dueDate < today) return 'overdue';
    return 'pending';
  };

  const getStatusConfig = (status: InvoiceStatus) => {
    const configs = {
      draft: {
        label: 'Brouillon',
        color: 'bg-gray-100 text-gray-700 border-gray-200',
        icon: FileText
      },
      pending: {
        label: 'En attente',
        color: 'bg-blue-50 text-blue-700 border-blue-200',
        icon: Clock
      },
      upcoming: {
        label: 'À venir',
        color: 'bg-purple-50 text-purple-700 border-purple-200',
        icon: Calendar
      },
      overdue: {
        label: 'En retard',
        color: 'bg-red-50 text-red-700 border-red-200',
        icon: AlertCircle
      },
      paid: {
        label: 'Payée',
        color: 'bg-green-50 text-green-700 border-green-200',
        icon: CheckCircle2
      },
      cancelled: {
        label: 'Annulée',
        color: 'bg-gray-100 text-gray-500 border-gray-200',
        icon: XCircle
      }
    };
    return configs[status] || configs.pending;
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

  const tabOptions = [
    { id: 'all', label: 'Toutes', count: invoices.length },
    { id: 'to_process', label: 'À traiter', count: invoices.filter(i => ['draft', 'pending'].includes(calculateInvoiceStatus(i))).length },
    { id: 'upcoming', label: 'À venir', count: invoices.filter(i => new Date(i.issue_date) > new Date()).length },
    { id: 'overdue', label: 'En retard', count: invoices.filter(i => calculateInvoiceStatus(i) === 'overdue').length },
    { id: 'paid', label: 'Payées', count: invoices.filter(i => calculateInvoiceStatus(i) === 'paid').length }
  ];

  const handleBulkAction = (action: string) => {
    console.log(`Bulk action: ${action} on invoices:`, selectedInvoices);
    // Implement bulk actions
  };

  return (
    <>
      <Head>
        <title>Factures clients - SEKA</title>
      </Head>
      <div className="min-h-screen bg-gray-50">
        <PennylaneSidebar />
        <main className="ml-[220px]">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Factures clients</h1>
                <p className="text-sm text-gray-600 mt-0.5">
                  Gérez vos factures de vente et suivez vos paiements
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href="/ventes/nouveau-devis"
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
                >
                  Nouveau devis
                </Link>
                <Link
                  href="/ventes/nouvelle-facture"
                  className="px-4 py-2 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#172e4d] flex items-center gap-2 text-sm font-medium"
                >
                  <Plus className="h-4 w-4" />
                  Nouvelle facture
                </Link>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="px-6 py-6">
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">CA facturé</span>
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats?.ca_facture || 0)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Total facturé</p>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">CA payé</span>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats?.ca_paye || 0)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Encaissements</p>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Factures en retard</span>
                  <AlertCircle className="h-4 w-4 text-red-600" />
                </div>
                <p className="text-2xl font-bold text-red-600">
                  {stats?.factures_retard || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">À relancer</p>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Factures non envoyées</span>
                  <Mail className="h-4 w-4 text-orange-600" />
                </div>
                <p className="text-2xl font-bold text-orange-600">
                  {stats?.factures_non_envoyees || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">En attente d'envoi</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="border-b border-gray-200">
                <div className="flex items-center px-6">
                  {tabOptions.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as TabFilter)}
                      className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === tab.id
                          ? 'border-[#1e3a5f] text-[#1e3a5f]'
                          : 'border-transparent text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {tab.label}
                      {tab.count > 0 && (
                        <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700">
                          {tab.count}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search and Filters */}
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  {/* Search */}
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Rechercher une facture, un client..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent text-sm"
                    />
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
                            onClick={() => addFilter({ id: Date.now().toString(), label: 'Derniers 30 jours', value: '30d', type: 'date' })}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
                          >
                            Date: Derniers 30 jours
                          </button>
                          <button
                            onClick={() => addFilter({ id: Date.now().toString(), label: 'En retard', value: 'overdue', type: 'status' })}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
                          >
                            Statut: En retard
                          </button>
                          <button
                            onClick={() => addFilter({ id: Date.now().toString(), label: 'Non envoyées', value: 'unsent', type: 'sent' })}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
                          >
                            Envoi: Non envoyées
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bulk Actions */}
              {selectedInvoices.length > 0 && (
                <div className="px-6 py-3 bg-blue-50 border-b border-blue-200 flex items-center justify-between">
                  <span className="text-sm text-blue-900">
                    {selectedInvoices.length} facture(s) sélectionnée(s)
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleBulkAction('send')}
                      className="px-3 py-1.5 text-sm bg-white border border-blue-300 text-blue-700 rounded hover:bg-blue-50"
                    >
                      <Send className="h-4 w-4 inline mr-1" />
                      Envoyer
                    </button>
                    <button
                      onClick={() => handleBulkAction('download')}
                      className="px-3 py-1.5 text-sm bg-white border border-blue-300 text-blue-700 rounded hover:bg-blue-50"
                    >
                      <Download className="h-4 w-4 inline mr-1" />
                      Télécharger
                    </button>
                    <button
                      onClick={() => setSelectedInvoices([])}
                      className="px-3 py-1.5 text-sm text-blue-700 hover:text-blue-900"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}

              {/* Invoices Table */}
              {loading ? (
                <div className="p-12 text-center">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#1e3a5f] border-r-transparent"></div>
                  <p className="text-sm text-gray-600 mt-3">Chargement des factures...</p>
                </div>
              ) : invoices.length === 0 ? (
                <div className="p-12 text-center">
                  <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600 mb-4">Aucune facture trouvée</p>
                  <Link
                    href="/ventes/nouvelle-facture"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#172e4d]"
                  >
                    <Plus className="h-4 w-4" />
                    Créer une facture
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left">
                          <input
                            type="checkbox"
                            checked={selectedInvoices.length === invoices.length}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedInvoices(invoices.map(i => i.id));
                              } else {
                                setSelectedInvoices([]);
                              }
                            }}
                            className="rounded border-gray-300"
                          />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          N° Facture
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Client
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date d'émission
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Échéance
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Montant TTC
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Statut
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Envoi
                        </th>
                        <th className="px-6 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {invoices.map((invoice) => {
                        const status = calculateInvoiceStatus(invoice);
                        const statusConfig = getStatusConfig(status);
                        const StatusIcon = statusConfig.icon;

                        return (
                          <tr
                            key={invoice.id}
                            className="hover:bg-gray-50 cursor-pointer"
                            onClick={() => router.push(`/ventes/factures/${invoice.id}`)}
                          >
                            <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={selectedInvoices.includes(invoice.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedInvoices([...selectedInvoices, invoice.id]);
                                  } else {
                                    setSelectedInvoices(selectedInvoices.filter(id => id !== invoice.id));
                                  }
                                }}
                                className="rounded border-gray-300"
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm font-medium text-gray-900">{invoice.number}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                                  <User className="h-4 w-4 text-gray-600" />
                                </div>
                                <span className="text-sm text-gray-900">{invoice.client_name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {formatDate(invoice.issue_date)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {formatDate(invoice.due_date)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <span className="text-sm font-semibold text-gray-900">
                                {formatCurrency(invoice.total_amount)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${statusConfig.color}`}>
                                <StatusIcon className="h-3 w-3" />
                                {statusConfig.label}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {invoice.sent_at ? (
                                <span className="text-xs text-green-600 flex items-center gap-1">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Envoyée
                                </span>
                              ) : (
                                <span className="text-xs text-orange-600 flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  Non envoyée
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                              <button className="p-1 hover:bg-gray-100 rounded">
                                <MoreHorizontal className="h-5 w-5 text-gray-400" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {!loading && invoices.length > 0 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Afficher</span>
                    <select className="border border-gray-300 rounded px-2 py-1 text-sm">
                      <option value="50">50</option>
                      <option value="100">100</option>
                      <option value="300">300</option>
                      <option value="all">Tout</option>
                    </select>
                    <span className="text-sm text-gray-600">éléments par page</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 text-sm">
                      Précédent
                    </button>
                    <span className="text-sm text-gray-600">1 / 1</span>
                    <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 text-sm">
                      Suivant
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
