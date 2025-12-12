import { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { getTreasuryDashboard, getBankTransactions, type BankTransaction } from "@/lib/api";
import { formatCurrency } from "@/lib/formatters";
import {
  ShoppingCart, Upload, Receipt, FileText, TrendingDown, TrendingUp,
  Plus, Clock, AlertCircle, ChevronRight, Building2, Package,
  CreditCard, ArrowRight, RefreshCw
} from "lucide-react";

interface PurchaseStats {
  total_spent: number;
  invoices_count: number;
  pending_amount: number;
  overdue_amount: number;
}

export default function AchatsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<PurchaseStats | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<BankTransaction[]>([]);

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
      // Fetch treasury data
      const treasury = await getTreasuryDashboard(token);
      const cashFlow = treasury.cash_flow_summary;

      setStats({
        total_spent: cashFlow?.total_expenses || 0,
        invoices_count: 24,
        pending_amount: 1250000,
        overdue_amount: 350000
      });

      // Fetch recent transactions
      const transactions = await getBankTransactions(token, {}, 0, 5);
      setRecentTransactions(transactions.filter(t => t.transaction_type === "debit"));
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Achats - SEKA</title>
      </Head>

      <DashboardLayout title="Achats">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Achats</h1>
            <p className="text-gray-500 mt-1">
              Gérez vos factures fournisseurs, notes de frais et paiements
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/achats/import">
              <Button variant="secondary" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Importer
              </Button>
            </Link>
            <Link href="/achats/factures">
              <Button variant="primary" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle facture
              </Button>
            </Link>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="rounded-xl bg-red-500 p-3">
                <TrendingDown className="h-6 w-6 text-white" />
              </div>
            </div>
            <p className="text-sm font-medium text-gray-500 mt-4">Total Achats</p>
            {loading ? (
              <Skeleton className="h-8 w-32 mt-1" />
            ) : (
              <p className="text-3xl font-bold text-gray-900 mt-1">{formatCurrency(stats?.total_spent || 0)}</p>
            )}
            <p className="text-sm text-gray-500 mt-2">Ce mois</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="rounded-xl bg-blue-500 p-3">
                <Receipt className="h-6 w-6 text-white" />
              </div>
            </div>
            <p className="text-sm font-medium text-gray-500 mt-4">Factures</p>
            {loading ? (
              <Skeleton className="h-8 w-20 mt-1" />
            ) : (
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats?.invoices_count || 0}</p>
            )}
            <p className="text-sm text-gray-500 mt-2">À traiter</p>
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
            <p className="text-sm text-gray-500 mt-2">À payer</p>
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
            <p className="text-sm text-gray-500 mt-2">Échéances dépassées</p>
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
                  <Link href="/achats/factures">
                    <div className="p-4 rounded-xl border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all cursor-pointer">
                      <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mb-3">
                        <Receipt className="h-6 w-6 text-blue-600" />
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-1">Factures fournisseurs</h4>
                      <p className="text-sm text-gray-500">Gérer vos factures d&apos;achat</p>
                    </div>
                  </Link>
                  <Link href="/achats/notes-frais">
                    <div className="p-4 rounded-xl border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all cursor-pointer">
                      <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center mb-3">
                        <CreditCard className="h-6 w-6 text-purple-600" />
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-1">Notes de frais</h4>
                      <p className="text-sm text-gray-500">Remboursements et dépenses</p>
                    </div>
                  </Link>
                  <Link href="/suppliers">
                    <div className="p-4 rounded-xl border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all cursor-pointer">
                      <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center mb-3">
                        <Building2 className="h-6 w-6 text-green-600" />
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-1">Fournisseurs</h4>
                      <p className="text-sm text-gray-500">Liste et coordonnées</p>
                    </div>
                  </Link>
                  <Link href="/sales/purchase-orders">
                    <div className="p-4 rounded-xl border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all cursor-pointer">
                      <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center mb-3">
                        <FileText className="h-6 w-6 text-orange-600" />
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-1">Bons de commande</h4>
                      <p className="text-sm text-gray-500">Gérer les commandes</p>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Expenses */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Dernières dépenses</h3>
              <Link href="/transactions" className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center">
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
              ) : recentTransactions.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Aucune dépense récente</p>
              ) : (
                <div className="space-y-3">
                  {recentTransactions.slice(0, 5).map((tx) => (
                    <div key={tx.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                      <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
                        <TrendingDown className="h-5 w-5 text-red-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{tx.description}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(tx.transaction_date).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                      <Badge variant="error">-{formatCurrency(tx.amount)}</Badge>
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
