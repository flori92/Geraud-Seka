import { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { PennylaneSidebar } from "@/components/layout/PennylaneSidebar";
import {
  Plus,
  Upload,
  Search,
  Filter,
  ChevronDown,
  X,
  Download,
  Check,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  Calendar,
  User,
  Clock,
  AlertCircle,
  CheckCircle2,
  Inbox,
  FileCheck,
  Wallet,
  Bot
} from "lucide-react";

interface SupplierInvoice {
  id: string;
  number: string;
  supplier_name: string;
  supplier_id: string;
  amount: number;
  tax_amount: number;
  total_amount: number;
  workflow_status: WorkflowStatus;
  payment_status: PaymentStatus;
  due_date: string;
  invoice_date: string;
  payment_date?: string;
  received_at: string;
  approved_at?: string;
  approved_by?: string;
  created_at: string;
  has_attachment: boolean;
  ocr_processed: boolean;
}

type WorkflowStatus = 'inbox' | 'to_approve' | 'to_pay' | 'paid' | 'rejected';
type PaymentStatus = 'unpaid' | 'partial' | 'paid' | 'overpaid';
type TabFilter = 'all' | 'inbox' | 'to_approve' | 'to_pay' | 'paid';

interface SupplierInvoiceStats {
  a_payer: number;
  paye: number;
  factures_retard: number;
  en_attente_approbation: number;
}

interface FilterChip {
  id: string;
  label: string;
  value: string;
  type: 'date' | 'status' | 'supplier' | 'amount';
}

export default function FacturesFournisseursPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<SupplierInvoice[]>([]);
  const [stats, setStats] = useState<SupplierInvoiceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterChip[]>([]);
  const [showFiltersMenu, setShowFiltersMenu] = useState(false);
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);

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
      const params = new URLSearchParams();
      if (activeTab !== 'all') {
        params.append('workflow_status', activeTab);
      }
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      filters.forEach(filter => {
        params.append(filter.type, filter.value);
      });

      const invoicesResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/supplier-invoices?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (invoicesResponse.ok) {
        const data = await invoicesResponse.json();
        setInvoices(Array.isArray(data) ? data : []);
      }

      const statsResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/supplier-invoices/stats`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error("Error fetching supplier invoices:", error);
    } finally {
      setLoading(false);
    }
  };

  const getWorkflowStatusConfig = (status: WorkflowStatus) => {
    const configs = {
      inbox: {
        label: 'Boîte de réception',
        color: 'bg-purple-50 text-purple-700 border-purple-200',
        icon: Inbox,
        badge: 'purple'
      },
      to_approve: {
        label: 'À approuver',
        color: 'bg-orange-50 text-orange-700 border-orange-200',
        icon: FileCheck,
        badge: 'orange'
      },
      to_pay: {
        label: 'À payer',
        color: 'bg-blue-50 text-blue-700 border-blue-200',
        icon: Wallet,
        badge: 'blue'
      },
      paid: {
        label: 'Payée',
        color: 'bg-green-50 text-green-700 border-green-200',
        icon: CheckCircle2,
        badge: 'green'
      },
      rejected: {
        label: 'Rejetée',
        color: 'bg-red-50 text-red-700 border-red-200',
        icon: X,
        badge: 'red'
      }
    };
    return configs[status] || configs.inbox;
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
    { id: 'inbox', label: 'Boîte de réception', count: invoices.filter(i => i.workflow_status === 'inbox').length },
    { id: 'to_approve', label: 'À approuver', count: invoices.filter(i => i.workflow_status === 'to_approve').length },
    { id: 'to_pay', label: 'À payer', count: invoices.filter(i => i.workflow_status === 'to_pay').length },
    { id: 'paid', label: 'Payées', count: invoices.filter(i => i.workflow_status === 'paid').length }
  ];

  const handleApprove = async (invoiceId: string) => {
    const token = localStorage.getItem("seka_access_token");
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/supplier-invoices/${invoiceId}/approve`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Error approving invoice:", error);
    }
  };

  const handleMarkAsToPay = async (invoiceId: string) => {
    const token = localStorage.getItem("seka_access_token");
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/supplier-invoices/${invoiceId}/mark-to-pay`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Error marking invoice to pay:", error);
    }
  };

  const handleDelete = async (invoiceId: string, force: boolean = false) => {
    const token = localStorage.getItem("seka_access_token");
    const invoice = invoices.find(inv => inv.id === invoiceId);
    const needsForce = invoice?.workflow_status === 'to_pay' || invoice?.workflow_status === 'paid';
    
    if (needsForce && !force) {
      const confirmed = window.confirm(
        "Cette facture est approuvée ou payée. Êtes-vous sûr de vouloir la supprimer ? Cette action est irréversible."
      );
      if (!confirmed) return;
      force = true;
    } else {
      const confirmed = window.confirm("Êtes-vous sûr de vouloir supprimer cette facture ? Cette action est irréversible.");
      if (!confirmed) return;
    }

    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/supplier-invoices/${invoiceId}${force ? '?force=true' : ''}`;
      const response = await fetch(url, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok || response.status === 204) {
        fetchData();
      } else {
        const error = await response.json().catch(() => ({ detail: 'Erreur lors de la suppression' }));
        alert(error.detail || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error("Error deleting invoice:", error);
      alert("Erreur lors de la suppression de la facture");
    }
  };

  const handleBulkApprove = async () => {
    const token = localStorage.getItem("seka_access_token");
    try {
      await Promise.all(
        selectedInvoices.map(id =>
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/supplier-invoices/${id}/approve`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` }
          })
        )
      );
      setSelectedInvoices([]);
      fetchData();
    } catch (error) {
      console.error("Error bulk approving:", error);
    }
  };

  return (
    <>
      <Head>
        <title>Factures fournisseurs - SEKA</title>
      </Head>
      <div className="min-h-screen bg-gray-50">
        <PennylaneSidebar />
        <main className="ml-[220px]">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Factures fournisseurs</h1>
                <p className="text-sm text-gray-600 mt-0.5">
                  Gérez vos factures d'achat et le workflow d'approbation
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium flex items-center gap-2"
                >
                  <Bot className="h-4 w-4" />
                  Automatiser l'import
                </button>
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="px-4 py-2 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#172e4d] flex items-center gap-2 text-sm font-medium"
                >
                  <Upload className="h-4 w-4" />
                  Importer des factures
                </button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="px-6 py-6">
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">À payer</span>
                  <Wallet className="h-4 w-4 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats?.a_payer || 0)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Montant restant dû</p>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Payé</span>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats?.paye || 0)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Décaissements</p>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Factures en retard</span>
                  <AlertCircle className="h-4 w-4 text-red-600" />
                </div>
                <p className="text-2xl font-bold text-red-600">
                  {stats?.factures_retard || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">À traiter</p>
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
                      placeholder="Rechercher une facture, un fournisseur..."
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
                    {activeTab === 'to_approve' && (
                      <button
                        onClick={handleBulkApprove}
                        className="px-3 py-1.5 text-sm bg-white border border-blue-300 text-blue-700 rounded hover:bg-blue-50"
                      >
                        <Check className="h-4 w-4 inline mr-1" />
                        Approuver tout
                      </button>
                    )}
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
                  <Inbox className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600 mb-4">Aucune facture fournisseur trouvée</p>
                  <button
                    onClick={() => setShowUploadModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#172e4d]"
                  >
                    <Upload className="h-4 w-4" />
                    Importer une facture
                  </button>
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
                          Fournisseur
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date facture
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Échéance
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Montant TTC
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Statut workflow
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          OCR
                        </th>
                        <th className="px-6 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {invoices.map((invoice) => {
                        const statusConfig = getWorkflowStatusConfig(invoice.workflow_status);
                        const StatusIcon = statusConfig.icon;
                        const isOverdue = new Date(invoice.due_date) < new Date() && invoice.payment_status !== 'paid';

                        return (
                          <tr
                            key={invoice.id}
                            className="hover:bg-gray-50 cursor-pointer"
                            onClick={() => router.push(`/achats/factures/${invoice.id}`)}
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
                                <span className="text-sm text-gray-900">{invoice.supplier_name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {formatDate(invoice.invoice_date)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`text-sm ${isOverdue ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
                                {formatDate(invoice.due_date)}
                                {isOverdue && <AlertCircle className="h-3 w-3 inline ml-1" />}
                              </span>
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
                              {invoice.ocr_processed ? (
                                <span className="text-xs text-green-600 flex items-center gap-1">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Traité
                                </span>
                              ) : (
                                <span className="text-xs text-gray-400 flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  En attente
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center gap-2">
                                {invoice.workflow_status === 'to_approve' && (
                                  <button
                                    onClick={() => handleApprove(invoice.id)}
                                    className="p-1 hover:bg-green-50 rounded text-green-600"
                                    title="Approuver"
                                  >
                                    <Check className="h-4 w-4" />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDelete(invoice.id)}
                                  className="p-1 hover:bg-red-50 rounded text-red-600"
                                  title="Supprimer"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                                <button className="p-1 hover:bg-gray-100 rounded">
                                  <MoreHorizontal className="h-5 w-5 text-gray-400" />
                                </button>
                              </div>
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

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Importer des factures</h3>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-600 mb-2">
                Glissez-déposez vos fichiers ici ou cliquez pour parcourir
              </p>
              <p className="text-xs text-gray-500">
                Formats acceptés: PDF, PNG, JPG (max 10 Mo)
              </p>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowUploadModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button className="flex-1 px-4 py-2 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#172e4d]">
                Importer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
