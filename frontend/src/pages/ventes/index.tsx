import { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { getInvoices } from "@/lib/api";
import { formatCurrency } from "@/lib/formatters";
import {
  Receipt, Plus, FileText, TrendingUp, Clock, AlertCircle,
  CheckCircle, ArrowRight, Users, Package, Send
} from "lucide-react";

interface SalesStats {
  total_revenue: number;
  invoices_count: number;
  pending_amount: number;
  overdue_amount: number;
  paid_amount: number;
}

export default function VentesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SalesStats | null>(null);
  const [recentInvoices, setRecentInvoices] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const token = localStorage.getItem("seka_access_token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      setLoading(true);

      // Fetch invoices
      const invoices = await getInvoices(token);
      setRecentInvoices(invoices.slice(0, 5));

      // Calculate stats
      const paidInvoices = invoices.filter((i: any) => i.status === "paid" || i.status === "payé");
      const pendingInvoices = invoices.filter((i: any) => i.status === "pending" || i.status === "en attente");
      const overdueInvoices = invoices.filter((i: any) => i.status === "overdue" || i.status === "en retard");

      setStats({
        total_revenue: paidInvoices.reduce((sum: number, i: any) => sum + (i.amount || 0), 0),
        invoices_count: invoices.length,
        pending_amount: pendingInvoices.reduce((sum: number, i: any) => sum + (i.amount || 0), 0),
        overdue_amount: overdueInvoices.reduce((sum: number, i: any) => sum + (i.amount || 0), 0),
        paid_amount: paidInvoices.reduce((sum: number, i: any) => sum + (i.amount || 0), 0)
      });
    } catch (error) {
      console.error("Error fetching data:", error);
      setStats({
        total_revenue: 0,
        invoices_count: 0,
        pending_amount: 0,
        overdue_amount: 0,
        paid_amount: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "paid":
      case "payé":
        return <Badge variant="success">Payée</Badge>;
      case "pending":
      case "en attente":
        return <Badge variant="warning">En attente</Badge>;
      case "overdue":
      case "en retard":
        return <Badge variant="error">En retard</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <>
      <Head>
        <title>Ventes - SEKA</title>
      </Head>

      <DashboardLayout title="Ventes">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Ventes</h1>
            <p className="text-gray-500 mt-1">
              Gérez vos devis, factures clients et suivi des encaissements
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/sales/quotes">
              <Button variant="secondary" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                Nouveau devis
              </Button>
            </Link>
            <Link href="/sales/invoices">
              <Button variant="primary" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle facture
              </Button>
            </Link>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-start justify-between">
              <div className="rounded-xl bg-white/20 p-3">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
            <p className="text-sm font-medium text-white/80 mt-4">Chiffre d&apos;affaires</p>
            {loading ? (
              <Skeleton className="h-8 w-32 mt-1 bg-white/20" />
            ) : (
              <p className="text-3xl font-bold text-white mt-1">{formatCurrency(stats?.total_revenue || 0)}</p>
            )}
            <p className="text-sm text-white/70 mt-2">Cette année</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="rounded-xl bg-blue-500 p-3">
                <Receipt className="h-6 w-6 text-white" />
              </div>
            </div>
            <p className="text-sm font-medium text-gray-500 mt-4">Factures émises</p>
            {loading ? (
              <Skeleton className="h-8 w-20 mt-1" />
            ) : (
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats?.invoices_count || 0}</p>
            )}
            <p className="text-sm text-gray-500 mt-2">Total</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="rounded-xl bg-orange-500 p-3">
                <Clock className="h-6 w-6 text-white" />
              </div>
            </div>
            <p className="text-sm font-medium text-gray-500 mt-4">En attente</p>
            {loading ? (
              <Skeleton className="h-8 w-32 mt-1" />
            ) : (
              <p className="text-3xl font-bold text-orange-600 mt-1">{formatCurrency(stats?.pending_amount || 0)}</p>
            )}
            <p className="text-sm text-gray-500 mt-2">À recevoir</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="rounded-xl bg-red-400 p-3">
                <AlertCircle className="h-6 w-6 text-white" />
              </div>
            </div>
            <p className="text-sm font-medium text-gray-500 mt-4">En retard</p>
            {loading ? (
              <Skeleton className="h-8 w-32 mt-1" />
            ) : (
              <p className="text-3xl font-bold text-red-600 mt-1">{formatCurrency(stats?.overdue_amount || 0)}</p>
            )}
            <p className="text-sm text-gray-500 mt-2">Impayés à relancer</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">Actions rapides</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <Link href="/sales/invoices">
                    <div className="p-4 rounded-xl border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all cursor-pointer">
                      <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mb-3">
                        <Receipt className="h-6 w-6 text-blue-600" />
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-1">Factures clients</h4>
                      <p className="text-sm text-gray-500">Créer et gérer les factures</p>
                    </div>
                  </Link>
                  <Link href="/sales/quotes">
                    <div className="p-4 rounded-xl border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all cursor-pointer">
                      <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center mb-3">
                        <FileText className="h-6 w-6 text-purple-600" />
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-1">Devis</h4>
                      <p className="text-sm text-gray-500">Établir des propositions</p>
                    </div>
                  </Link>
                  <Link href="/clients">
                    <div className="p-4 rounded-xl border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all cursor-pointer">
                      <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center mb-3">
                        <Users className="h-6 w-6 text-green-600" />
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-1">Clients</h4>
                      <p className="text-sm text-gray-500">Gérer le portefeuille</p>
                    </div>
                  </Link>
                  <Link href="/sales/delivery-notes">
                    <div className="p-4 rounded-xl border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all cursor-pointer">
                      <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center mb-3">
                        <Package className="h-6 w-6 text-orange-600" />
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-1">Bons de livraison</h4>
                      <p className="text-sm text-gray-500">Suivi des expéditions</p>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Invoices */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Factures récentes</h3>
              <Link href="/sales/invoices" className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center">
                Voir tout <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
            <div className="p-4">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-14 w-full" />
                  ))}
                </div>
              ) : recentInvoices.length === 0 ? (
                <div className="text-center py-8">
                  <Receipt className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 mb-4">Aucune facture pour le moment</p>
                  <Link href="/sales/invoices">
                    <Button variant="primary" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Créer une facture
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentInvoices.map((invoice: any) => (
                    <div
                      key={invoice.id}
                      className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0 cursor-pointer hover:bg-gray-50 rounded-lg px-2 -mx-2"
                      onClick={() => router.push(`/sales/invoices/${invoice.id}`)}
                    >
                      <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Receipt className="h-5 w-5 text-blue-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {invoice.number || `FAC-${invoice.id}`}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {invoice.client_name || "Client"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">
                          {formatCurrency(invoice.amount || 0)}
                        </p>
                        {getStatusBadge(invoice.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}
