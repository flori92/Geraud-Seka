import { useState, useEffect, useCallback } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { PennylaneSidebar } from "@/components/layout/PennylaneSidebar";
import { getInvoices, Invoice } from "@/lib/api";
import { formatCurrency } from "@/lib/formatters";
import {
  Receipt, Plus, FileText, TrendingUp, Clock, AlertCircle,
  ArrowRight, Users, Package, RefreshCw, Loader2
} from "lucide-react";

interface SalesStats {
  total_revenue: number;
  invoices_count: number;
  pending_amount: number;
  overdue_amount: number;
}

export default function VentesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SalesStats | null>(null);
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem("seka_access_token");
    if (!token) { router.push("/login"); return; }

    setLoading(true);
    try {
      const invoices = await getInvoices(token);
      setRecentInvoices(invoices.slice(0, 5));
      const paidInvoices = invoices.filter(i => i.status === "paid" || i.status === "payé");
      const pendingInvoices = invoices.filter(i => i.status === "pending" || i.status === "en attente");
      const overdueInvoices = invoices.filter(i => i.status === "overdue" || i.status === "en retard");
      setStats({
        total_revenue: paidInvoices.reduce((sum, i) => sum + (i.amount || 0), 0),
        invoices_count: invoices.length,
        pending_amount: pendingInvoices.reduce((sum, i) => sum + (i.amount || 0), 0),
        overdue_amount: overdueInvoices.reduce((sum, i) => sum + (i.amount || 0), 0),
      });
    } catch {
      setStats({ total_revenue: 0, invoices_count: 0, pending_amount: 0, overdue_amount: 0 });
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      "paid": "bg-green-50 text-green-700", "payé": "bg-green-50 text-green-700",
      "pending": "bg-orange-50 text-orange-700", "en attente": "bg-orange-50 text-orange-700",
      "overdue": "bg-red-50 text-red-700", "en retard": "bg-red-50 text-red-700",
    };
    const labels: Record<string, string> = {
      "paid": "Payée", "payé": "Payée", "pending": "En attente", "en attente": "En attente",
      "overdue": "En retard", "en retard": "En retard"
    };
    return <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${styles[status?.toLowerCase()] || "bg-gray-100 text-gray-700"}`}>{labels[status?.toLowerCase()] || status}</span>;
  };

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
        <title>Ventes - SEKA</title>
      </Head>
      <div className="min-h-screen bg-gray-50">
        <PennylaneSidebar />
        <main className="ml-[220px]">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Ventes</h1>
                <p className="text-sm text-gray-600 mt-0.5">Gérez vos devis, factures clients et suivi des encaissements</p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={fetchData} className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
                  <RefreshCw className="h-5 w-5" />
                </button>
                <Link href="/ventes/nouveau-devis" className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50">
                  <FileText className="h-4 w-4" />
                  Nouveau devis
                </Link>
                <Link href="/ventes/factures-clients" className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] text-white text-sm font-medium rounded-lg hover:bg-[#172e4d]">
                  <Plus className="h-4 w-4" />
                  Nouvelle facture
                </Link>
              </div>
            </div>
          </div>

          <div className="px-6 py-6 space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-[#1e3a5f] to-blue-600 rounded-lg p-5 text-white">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white/80">Chiffre d&apos;affaires</span>
                  <TrendingUp className="h-4 w-4 text-white/80" />
                </div>
                <p className="text-2xl font-bold">{formatCurrency(stats?.total_revenue || 0)}</p>
                <p className="text-xs text-white/60 mt-1">Cette année</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Factures émises</span>
                  <Receipt className="h-4 w-4 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{stats?.invoices_count || 0}</p>
                <p className="text-xs text-gray-500 mt-1">Total</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">En attente</span>
                  <Clock className="h-4 w-4 text-orange-600" />
                </div>
                <p className="text-2xl font-bold text-orange-600">{formatCurrency(stats?.pending_amount || 0)}</p>
                <p className="text-xs text-gray-500 mt-1">À recevoir</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">En retard</span>
                  <AlertCircle className="h-4 w-4 text-red-600" />
                </div>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(stats?.overdue_amount || 0)}</p>
                <p className="text-xs text-gray-500 mt-1">Impayés à relancer</p>
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
                    { href: "/ventes/factures-clients", icon: Receipt, color: "bg-blue-100 text-blue-600", title: "Factures clients", desc: "Créer et gérer les factures" },
                    { href: "/ventes/nouveau-devis", icon: FileText, color: "bg-purple-100 text-purple-600", title: "Devis", desc: "Établir des propositions" },
                    { href: "/clients", icon: Users, color: "bg-green-100 text-green-600", title: "Clients", desc: "Gérer le portefeuille" },
                    { href: "/ventes/bons-livraison", icon: Package, color: "bg-orange-100 text-orange-600", title: "Bons de livraison", desc: "Suivi des expéditions" },
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

              {/* Recent Invoices */}
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Factures récentes</h3>
                  <Link href="/ventes/factures-clients" className="text-sm text-[#1e3a5f] hover:underline font-medium flex items-center">
                    Voir tout <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                </div>
                <div className="p-4">
                  {recentInvoices.length === 0 ? (
                    <div className="text-center py-8">
                      <Receipt className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm mb-4">Aucune facture pour le moment</p>
                      <Link href="/ventes/factures-clients" className="inline-flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] text-white text-sm font-medium rounded-lg hover:bg-[#172e4d]">
                        <Plus className="h-4 w-4" /> Créer une facture
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentInvoices.map((invoice) => (
                        <div key={invoice.id} onClick={() => router.push(`/ventes/factures/${invoice.id}`)}
                          className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0 cursor-pointer hover:bg-gray-50 rounded-lg px-2 -mx-2">
                          <div className="h-9 w-9 rounded-lg bg-blue-100 flex items-center justify-center">
                            <Receipt className="h-4 w-4 text-blue-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{invoice.number || `FAC-${invoice.id}`}</p>
                            <p className="text-xs text-gray-500 truncate">{invoice.client_name || "Client"}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-gray-900">{formatCurrency(invoice.amount || 0)}</p>
                            {getStatusBadge(invoice.status)}
                          </div>
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
