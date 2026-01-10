/**
 * Dashboard Simple SEKA - Style Pennylane
 * Interface épurée et minimaliste
 */
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Head from "next/head";
import { PennylaneSidebar } from "@/components/layout/PennylaneSidebar";
import {
  getDashboardStats,
  getClients,
  getInvoices,
  type DashboardStats,
  type Client,
  type Invoice,
} from "@/lib/api";
import {
  Users,
  FileText,
  Wallet,
  Receipt,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

export default function DashboardSimple() {
  const router = useRouter();
  const [, setStats] = useState<DashboardStats | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem("seka_access_token");
    if (!token) { router.push("/login"); return; }

    setLoading(true);
    try {
      const [statsData, clientsData, invoicesData] = await Promise.allSettled([
        getDashboardStats(token),
        getClients(token),
        getInvoices(token),
      ]);
      if (statsData.status === "fulfilled") setStats(statsData.value);
      if (clientsData.status === "fulfilled") setClients(clientsData.value);
      if (invoicesData.status === "fulfilled") setInvoices(invoicesData.value);
    } catch (err) {
      console.error("Erreur chargement données", err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalRevenue = invoices?.reduce((sum, inv) => sum + (inv?.paid || 0), 0) || 0;
  const pendingInvoices = invoices?.filter(inv => inv?.status === "Impayée" || inv?.status === "unpaid")?.length || 0;
  const clientCount = clients?.length || 0;
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
        <title>Tableau de bord - SEKA</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <div className="min-h-screen bg-gray-50 flex">
        <PennylaneSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        {/* Main Content */}
        <main className="flex-1 lg:ml-0 transition-all duration-300">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Menu hamburger pour mobile */}
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <div>
                  <h1 className="text-lg sm:text-xl font-semibold text-gray-900">Tableau de bord</h1>
                  <p className="text-xs sm:text-sm text-gray-600 mt-0.5">Aperçu de votre activité</p>
                </div>
              </div>
              <button onClick={fetchData} className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
                <RefreshCw className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
            {/* KPIs - Responsive grid */}
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Chiffre d'affaires" value={formatCurrency(totalRevenue)} icon={Wallet} />
              <StatCard label="Clients" value={clientCount} icon={Users} />
              <StatCard label="Factures" value={invoices.length} icon={FileText} />
              <StatCard label="Impayées" value={pendingInvoices} icon={Receipt} alert={pendingInvoices > 0} />
            </div>

            {/* Actions rapides */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">Actions rapides</h2>
              <div className="grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <QuickLink href="/ventes/factures-clients" label="Nouvelle facture" />
                <QuickLink href="/achats/factures" label="Saisir un achat" />
                <QuickLink href="/clients" label="Ajouter un client" />
                <QuickLink href="/comptabilite/balance" label="Balance générale" />
              </div>
            </div>

            {/* Modules principaux */}
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              <ModuleLink href="/ventes" title="Ventes" description="Devis, factures clients" icon={FileText} />
              <ModuleLink href="/achats" title="Achats" description="Factures fournisseurs" icon={Receipt} />
              <ModuleLink href="/comptabilite" title="Comptabilité" description="Balance, journal, bilan" icon={Wallet} />
              <ModuleLink href="/tresorerie" title="Trésorerie" description="Comptes et prévisions" icon={TrendingUp} />
              <ModuleLink href="/clients" title="Clients" description="Gestion des clients" icon={Users} />
              <ModuleLink href="/reports" title="Rapports" description="Analyses et exports" icon={FileText} />
            </div>
          </div>
        </main>
      </div>
    </>
  );
}


function StatCard({ 
  label, 
  value, 
  icon: Icon, 
  trend, 
  alert 
}: { 
  label: string; 
  value: string | number; 
  icon: React.ElementType; 
  trend?: number;
  alert?: boolean;
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs sm:text-sm text-gray-500">{label}</span>
        <Icon className={`h-4 w-4 ${alert ? "text-red-500" : "text-gray-400"}`} />
      </div>
      <div className="flex items-end justify-between">
        <span className={`text-lg sm:text-2xl font-semibold ${alert ? "text-red-600" : "text-gray-900"}`}>
          {value}
        </span>
        {trend !== undefined && (
          <span className={`text-xs flex items-center ${trend >= 0 ? "text-green-600" : "text-red-600"}`}>
            {trend >= 0 ? <TrendingUp className="h-3 w-3 mr-0.5" /> : <TrendingDown className="h-3 w-3 mr-0.5" />}
            {trend >= 0 ? "+" : ""}{trend}%
          </span>
        )}
        {alert && (
          <AlertCircle className="h-4 w-4 text-red-500" />
        )}
      </div>
    </div>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href}>
      <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
        <span className="text-xs sm:text-sm font-medium text-gray-700">{label}</span>
        <ArrowRight className="h-3 sm:h-4 w-3 sm:w-4 text-gray-400" />
      </div>
    </Link>
  );
}

function ModuleLink({ 
  href, 
  title, 
  description, 
  icon: Icon 
}: { 
  href: string; 
  title: string; 
  description: string; 
  icon: React.ElementType;
}) {
  return (
    <Link href={href}>
      <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 hover:border-primary-300 hover:shadow-sm transition-all cursor-pointer">
        <div className="flex items-start gap-2 sm:gap-3">
          <div className="p-1.5 sm:p-2 bg-primary-50 rounded-lg">
            <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xs sm:text-sm font-medium text-gray-900 truncate">{title}</h3>
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{description}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}
