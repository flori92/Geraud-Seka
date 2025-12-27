import { useState, useEffect, useCallback } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { PennylaneSidebar } from "@/components/layout/PennylaneSidebar";
import { 
  Calculator, BookOpen, FileText, TrendingUp, TrendingDown,
  DollarSign, PieChart, BarChart3, ArrowUpRight, ArrowDownRight,
  Plus, Download, RefreshCw, ChevronRight, Loader2
} from "lucide-react";
import Link from "next/link";

interface AccountingStats {
  revenue: number;
  expenses: number;
  net_income: number;
  cash: number;
  total_assets: number;
  total_liabilities: number;
  equity: number;
  fixed_assets?: number;
  inventory?: number;
  accounts_receivable?: number;
  loans?: number;
  accounts_payable?: number;
  other_liabilities?: number;
}

export default function ComptabilitePage() {
  const router = useRouter();
  const [stats, setStats] = useState<AccountingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("month");

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const fetchStats = useCallback(async () => {
    const token = localStorage.getItem("seka_access_token");
    if (!token) { router.push("/login"); return; }
    
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/accounting/advanced/stats?period=${period}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, period, router]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XOF",
      minimumFractionDigits: 0
    }).format(amount);
  };

  const modules = [
    { title: "Plan Comptable", description: "Gérer les comptes OHADA", icon: BookOpen, href: "/comptabilite/plan-comptable", color: "bg-blue-500" },
    { title: "Écritures", description: "Saisie des écritures comptables", icon: FileText, href: "/accounting/entries", color: "bg-green-500" },
    { title: "Grand Livre", description: "Consultation par compte", icon: Calculator, href: "/accounting/ledger", color: "bg-[#1e3a5f]" },
    { title: "Balance", description: "Balance générale", icon: BarChart3, href: "/accounting/balance", color: "bg-orange-500" },
    { title: "Bilan", description: "Bilan comptable", icon: PieChart, href: "/accounting/financial-statements", color: "bg-indigo-500" },
    { title: "Compte de Résultat", description: "Produits et charges", icon: TrendingUp, href: "/accounting/financial-statements", color: "bg-pink-500" }
  ];

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
        <title>Comptabilité - SEKA</title>
      </Head>
      <div className="min-h-screen bg-gray-50">
        <PennylaneSidebar />
        <main className="ml-[220px]">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Comptabilité</h1>
                <p className="text-sm text-gray-600 mt-0.5">Gestion comptable OHADA</p>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                >
                  <option value="month">Ce mois</option>
                  <option value="quarter">Ce trimestre</option>
                  <option value="year">Cette année</option>
                </select>
                <button onClick={fetchStats} className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
                  <RefreshCw className="h-5 w-5" />
                </button>
                <Link href="/accounting/entries/new" className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] text-white text-sm font-medium rounded-lg hover:bg-[#172e4d]">
                  <Plus className="h-4 w-4" />
                  Nouvelle écriture
                </Link>
              </div>
            </div>
          </div>

          <div className="px-6 py-6 space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Chiffre d&apos;affaires</span>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(stats?.revenue || 0)}</p>
                <div className="mt-2 flex items-center text-xs text-green-600">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  +12.5% vs mois dernier
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Charges</span>
                  <TrendingDown className="h-4 w-4 text-red-600" />
                </div>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(stats?.expenses || 0)}</p>
                <div className="mt-2 flex items-center text-xs text-red-600">
                  <ArrowDownRight className="h-3 w-3 mr-1" />
                  +5.2% vs mois dernier
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Résultat Net</span>
                  <DollarSign className="h-4 w-4 text-blue-600" />
                </div>
                <p className={`text-2xl font-bold ${(stats?.net_income || 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {formatCurrency(stats?.net_income || 0)}
                </p>
                <p className="mt-2 text-xs text-gray-500">
                  Marge: {stats?.revenue ? ((stats.net_income / stats.revenue) * 100).toFixed(1) : 0}%
                </p>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Trésorerie</span>
                  <Calculator className="h-4 w-4 text-purple-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats?.cash || 0)}</p>
                <p className="mt-2 text-xs text-gray-500">Disponible immédiatement</p>
              </div>
            </div>

            {/* Modules */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {modules.map((module) => {
                const Icon = module.icon;
                return (
                  <Link key={module.href + module.title} href={module.href} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-lg transition-shadow cursor-pointer group">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-lg ${module.color}`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 group-hover:text-[#1e3a5f] transition-colors">{module.title}</h3>
                        <p className="text-sm text-gray-500">{module.description}</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-[#1e3a5f] transition-colors" />
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Résumé Bilan */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2 text-gray-900">
                  <PieChart className="h-5 w-5 text-[#1e3a5f]" />
                  Actif
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">Immobilisations</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(stats?.fixed_assets || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">Stocks</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(stats?.inventory || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">Créances clients</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(stats?.accounts_receivable || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">Trésorerie</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(stats?.cash || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg font-bold">
                    <span className="text-[#1e3a5f]">Total Actif</span>
                    <span className="text-[#1e3a5f]">{formatCurrency(stats?.total_assets || 0)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2 text-gray-900">
                  <PieChart className="h-5 w-5 text-[#1e3a5f]" />
                  Passif
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">Capitaux propres</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(stats?.equity || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">Emprunts</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(stats?.loans || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">Dettes fournisseurs</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(stats?.accounts_payable || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">Autres dettes</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(stats?.other_liabilities || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg font-bold">
                    <span className="text-[#1e3a5f]">Total Passif</span>
                    <span className="text-[#1e3a5f]">{formatCurrency(stats?.total_liabilities || 0)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions rapides */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-semibold mb-4 text-gray-900">Actions rapides</h3>
              <div className="flex flex-wrap gap-3">
                <Link href="/accounting/entries/new" className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-50">
                  <Plus className="h-4 w-4" />
                  Nouvelle écriture
                </Link>
                <Link href="/accounting/balance" className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-50">
                  <BarChart3 className="h-4 w-4" />
                  Voir la balance
                </Link>
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-50">
                  <Download className="h-4 w-4" />
                  Exporter FEC
                </button>
                <Link href="/tax/vat" className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-50">
                  <FileText className="h-4 w-4" />
                  Déclaration TVA
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
