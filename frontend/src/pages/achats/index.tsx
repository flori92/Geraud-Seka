import { useState, useEffect, useCallback } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { PennylaneSidebar } from "@/components/layout/PennylaneSidebar";
import { getTreasuryDashboard, getBankTransactions, type BankTransaction } from "@/lib/api";
import { formatCurrency } from "@/lib/formatters";
import {
  Upload, Receipt, FileText, TrendingDown,
  Plus, Clock, AlertCircle, Building2,
  CreditCard, ArrowRight, RefreshCw, Loader2
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

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem("seka_access_token");
    if (!token) { router.push("/login"); return; }

    setLoading(true);
    try {
      const treasury = await getTreasuryDashboard(token);
      const cashFlow = treasury.cash_flow_summary;
      setStats({
        total_spent: cashFlow?.total_expenses || 0,
        invoices_count: 0,
        pending_amount: 0,
        overdue_amount: 0
      });
      const transactions = await getBankTransactions(token, {}, 0, 5);
      setRecentTransactions(transactions.filter(t => t.transaction_type === "debit"));
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#1e3a5f]" />
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Achats - SEKA</title>
      </Head>
      <div className="min-h-screen bg-gray-50">
        <PennylaneSidebar />
        <main className="ml-[220px]">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Achats</h1>
                <p className="text-sm text-gray-600 mt-0.5">Gérez vos factures fournisseurs, notes de frais et paiements</p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={fetchData} className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
                  <RefreshCw className="h-5 w-5" />
                </button>
                <Link href="/achats/import" className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50">
                  <Upload className="h-4 w-4" />
                  Importer
                </Link>
                <Link href="/achats/factures" className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] text-white text-sm font-medium rounded-lg hover:bg-[#172e4d]">
                  <Plus className="h-4 w-4" />
                  Nouvelle facture
                </Link>
              </div>
            </div>
          </div>

          <div className="px-6 py-6 space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Total Achats</span>
                  <TrendingDown className="h-4 w-4 text-red-600" />
                </div>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(stats?.total_spent || 0)}</p>
                <p className="text-xs text-gray-500 mt-1">Ce mois</p>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Factures</span>
                  <Receipt className="h-4 w-4 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{stats?.invoices_count || 0}</p>
                <p className="text-xs text-gray-500 mt-1">À traiter</p>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">En attente</span>
                  <Clock className="h-4 w-4 text-orange-600" />
                </div>
                <p className="text-2xl font-bold text-orange-600">{formatCurrency(stats?.pending_amount || 0)}</p>
                <p className="text-xs text-gray-500 mt-1">À payer</p>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">En retard</span>
                  <AlertCircle className="h-4 w-4 text-red-600" />
                </div>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(stats?.overdue_amount || 0)}</p>
                <p className="text-xs text-gray-500 mt-1">Échéances dépassées</p>
              </div>
            </div>

            {/* Main Content */}
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Quick Actions */}
              <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200">
                <div className="p-4 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-900">Actions rapides</h3>
                </div>
                <div className="p-4 grid grid-cols-2 gap-4">
                  {[
                    { href: "/achats/factures", icon: Receipt, color: "bg-blue-100 text-blue-600", title: "Factures fournisseurs", desc: "Gérer vos factures d'achat" },
                    { href: "/achats/notes-frais", icon: CreditCard, color: "bg-purple-100 text-purple-600", title: "Notes de frais", desc: "Remboursements et dépenses" },
                    { href: "/suppliers", icon: Building2, color: "bg-green-100 text-green-600", title: "Fournisseurs", desc: "Liste et coordonnées" },
                    { href: "/achats/bons-commande", icon: FileText, color: "bg-orange-100 text-orange-600", title: "Bons de commande", desc: "Gérer les commandes" },
                  ].map((item, idx) => (
                    <Link key={idx} href={item.href} className="p-4 rounded-lg border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all">
                      <div className={`w-10 h-10 rounded-lg ${item.color} flex items-center justify-center mb-3`}>
                        <item.icon className="h-5 w-5" />
                      </div>
                      <h4 className="font-semibold text-gray-900 text-sm mb-1">{item.title}</h4>
                      <p className="text-xs text-gray-500">{item.desc}</p>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Recent Expenses */}
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Dernières dépenses</h3>
                  <Link href="/transactions" className="text-sm text-[#1e3a5f] hover:underline font-medium flex items-center">
                    Voir tout <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                </div>
                <div className="p-4">
                  {recentTransactions.length === 0 ? (
                    <p className="text-center text-gray-500 py-8 text-sm">Aucune dépense récente</p>
                  ) : (
                    <div className="space-y-3">
                      {recentTransactions.slice(0, 5).map((tx) => (
                        <div key={tx.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                          <div className="h-9 w-9 rounded-lg bg-red-100 flex items-center justify-center">
                            <TrendingDown className="h-4 w-4 text-red-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{tx.description}</p>
                            <p className="text-xs text-gray-500">{new Date(tx.transaction_date).toLocaleDateString("fr-FR")}</p>
                          </div>
                          <span className="px-2 py-1 text-xs font-medium bg-red-50 text-red-700 rounded-full">-{formatCurrency(tx.amount)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
