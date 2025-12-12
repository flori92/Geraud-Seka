import { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { PennylaneSidebar } from "@/components/layout/PennylaneSidebar";
import { Plus, FileText, TrendingUp, Clock, AlertCircle, CheckCircle } from "lucide-react";

interface SalesStats {
  total_revenue: number;
  invoices_count: number;
  pending_amount: number;
  overdue_amount: number;
  paid_amount: number;
}

interface RecentInvoice {
  id: string;
  number: string;
  client_name: string;
  amount: number;
  status: string;
  due_date: string;
  created_at: string;
}

export default function VentesPage() {
  const router = useRouter();
  const [stats, setStats] = useState<SalesStats | null>(null);
  const [recentInvoices, setRecentInvoices] = useState<RecentInvoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("seka_access_token");
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        // Fetch sales statistics
        const statsResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/sales/stats`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(statsData);
        }

        // Fetch recent invoices
        const invoicesResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/sales-invoices?limit=5`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (invoicesResponse.ok) {
          const invoicesData = await invoicesResponse.json();
          setRecentInvoices(Array.isArray(invoicesData) ? invoicesData : []);
        }
      } catch (error) {
        console.error("Error fetching sales data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()} FCFA`;
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid':
      case 'payé':
        return 'text-green-600 bg-green-100';
      case 'pending':
      case 'en attente':
        return 'text-yellow-600 bg-yellow-100';
      case 'overdue':
      case 'en retard':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid': return 'Payée';
      case 'pending': return 'En attente';
      case 'overdue': return 'En retard';
      case 'draft': return 'Brouillon';
      default: return status;
    }
  };

  return (
    <>
      <Head><title>Ventes - SEKA</title></Head>
      <div className="min-h-screen bg-gray-50">
        <PennylaneSidebar />
        <main className="ml-[220px] p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Ventes</h1>
                <p className="text-sm text-gray-600 mt-1">
                  Gérez vos devis, factures clients et suivi des paiements
                </p>
              </div>
              <div className="flex gap-3">
                <Link
                  href="/sales/quotes"
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Nouveau devis
                </Link>
                <Link
                  href="/sales/invoices"
                  className="px-4 py-2 bg-[#0d4a44] text-white rounded-lg hover:bg-[#0a3d38] flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Nouvelle facture
                </Link>
              </div>
            </div>

            {/* Stats Cards */}
            {loading ? (
              <div className="text-center py-12">
                <p className="text-gray-500">Chargement...</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-gray-600">Chiffre d'affaires</p>
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(stats?.total_revenue || 0)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Cette année</p>
                  </div>

                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-gray-600">Factures émises</p>
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats?.invoices_count || 0}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Total</p>
                  </div>

                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-gray-600">En attente</p>
                      <Clock className="h-5 w-5 text-yellow-600" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(stats?.pending_amount || 0)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">À recevoir</p>
                  </div>

                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-gray-600">En retard</p>
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    </div>
                    <p className="text-2xl font-bold text-red-600">
                      {formatCurrency(stats?.overdue_amount || 0)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Impayés</p>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <Link
                    href="/sales/invoices"
                    className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
                  >
                    <FileText className="h-8 w-8 text-[#0d4a44] mb-3" />
                    <h3 className="font-semibold text-gray-900 mb-1">Factures clients</h3>
                    <p className="text-sm text-gray-600">
                      Créez et gérez vos factures de vente
                    </p>
                  </Link>

                  <Link
                    href="/sales/quotes"
                    className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
                  >
                    <FileText className="h-8 w-8 text-blue-600 mb-3" />
                    <h3 className="font-semibold text-gray-900 mb-1">Devis</h3>
                    <p className="text-sm text-gray-600">
                      Établissez des devis pour vos clients
                    </p>
                  </Link>

                  <Link
                    href="/clients"
                    className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
                  >
                    <CheckCircle className="h-8 w-8 text-blue-600 mb-3" />
                    <h3 className="font-semibold text-gray-900 mb-1">Clients</h3>
                    <p className="text-sm text-gray-600">
                      Gérez votre portefeuille clients
                    </p>
                  </Link>
                </div>

                {/* Recent Invoices */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">Factures récentes</h3>
                    <Link
                      href="/sales/invoices"
                      className="text-sm text-[#0d4a44] hover:underline"
                    >
                      Voir tout
                    </Link>
                  </div>

                  {recentInvoices.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-600">Aucune facture pour le moment</p>
                      <Link
                        href="/sales/invoices"
                        className="inline-block mt-4 px-4 py-2 bg-[#0d4a44] text-white rounded-lg hover:bg-[#0a3d38]"
                      >
                        Créer votre première facture
                      </Link>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-3 text-sm font-medium text-gray-600">N° Facture</th>
                            <th className="text-left py-3 text-sm font-medium text-gray-600">Client</th>
                            <th className="text-left py-3 text-sm font-medium text-gray-600">Date</th>
                            <th className="text-right py-3 text-sm font-medium text-gray-600">Montant</th>
                            <th className="text-left py-3 text-sm font-medium text-gray-600">Statut</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentInvoices.map((invoice) => (
                            <tr
                              key={invoice.id}
                              className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                              onClick={() => router.push(`/sales/invoices/${invoice.id}`)}
                            >
                              <td className="py-3 text-sm font-medium text-gray-900">
                                {invoice.number}
                              </td>
                              <td className="py-3 text-sm text-gray-700">
                                {invoice.client_name}
                              </td>
                              <td className="py-3 text-sm text-gray-600">
                                {new Date(invoice.created_at).toLocaleDateString('fr-FR')}
                              </td>
                              <td className="py-3 text-sm font-medium text-right text-gray-900">
                                {formatCurrency(invoice.amount)}
                              </td>
                              <td className="py-3">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(invoice.status)}`}>
                                  {getStatusLabel(invoice.status)}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
