import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { 
  Calculator, BookOpen, FileText, TrendingUp, TrendingDown,
  DollarSign, PieChart, BarChart3, ArrowUpRight, ArrowDownRight,
  Plus, Filter, Download, RefreshCw, ChevronRight
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
  // Détails actif
  fixed_assets?: number;
  inventory?: number;
  accounts_receivable?: number;
  // Détails passif
  loans?: number;
  accounts_payable?: number;
  other_liabilities?: number;
}

export default function ComptabilitePage() {
  const [stats, setStats] = useState<AccountingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("month");

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  useEffect(() => {
    fetchStats();
  }, [period]);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("seka_access_token");
      const res = await fetch(`${API_BASE_URL}/api/v1/accounting/advanced/stats`, {
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
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XOF",
      minimumFractionDigits: 0
    }).format(amount);
  };

  const modules = [
    {
      title: "Plan Comptable",
      description: "Gérer les comptes OHADA",
      icon: BookOpen,
      href: "/comptabilite/plan-comptable",
      color: "bg-blue-500"
    },
    {
      title: "Écritures",
      description: "Saisie des écritures comptables",
      icon: FileText,
      href: "/comptabilite/ecritures",
      color: "bg-green-500"
    },
    {
      title: "Grand Livre",
      description: "Consultation par compte",
      icon: Calculator,
      href: "/comptabilite/grand-livre",
      color: "bg-primary-500"
    },
    {
      title: "Balance",
      description: "Balance générale",
      icon: BarChart3,
      href: "/comptabilite/balance",
      color: "bg-orange-500"
    },
    {
      title: "Bilan",
      description: "Bilan comptable",
      icon: PieChart,
      href: "/comptabilite/bilan",
      color: "bg-indigo-500"
    },
    {
      title: "Compte de Résultat",
      description: "Produits et charges",
      icon: TrendingUp,
      href: "/comptabilite/resultat",
      color: "bg-pink-500"
    }
  ];

  return (
    <DashboardLayout title="Comptabilité">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Comptabilité</h1>
            <p className="text-sm text-accents-5">Gestion comptable OHADA</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm"
            >
              <option value="month">Ce mois</option>
              <option value="quarter">Ce trimestre</option>
              <option value="year">Cette année</option>
            </select>
            <Link href="/comptabilite/ecritures/nouvelle">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nouvelle écriture
              </Button>
            </Link>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-accents-5">Chiffre d'affaires</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(stats?.revenue || 0)}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-2 flex items-center text-xs text-green-600">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              +12.5% vs mois dernier
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-accents-5">Charges</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(stats?.expenses || 0)}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <div className="mt-2 flex items-center text-xs text-red-600">
              <ArrowDownRight className="h-3 w-3 mr-1" />
              +5.2% vs mois dernier
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-accents-5">Résultat Net</p>
                <p className={`text-2xl font-bold ${(stats?.net_income || 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {formatCurrency(stats?.net_income || 0)}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-2 text-xs text-accents-5">
              Marge: {stats?.revenue ? ((stats.net_income / stats.revenue) * 100).toFixed(1) : 0}%
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-accents-5">Trésorerie</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(stats?.cash || 0)}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Calculator className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-2 text-xs text-accents-5">
              Disponible immédiatement
            </div>
          </Card>
        </div>

        {/* Modules */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <Link key={module.href} href={module.href}>
                <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${module.color}`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold group-hover:text-primary transition-colors">
                        {module.title}
                      </h3>
                      <p className="text-sm text-accents-5">{module.description}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-accents-4 group-hover:text-primary transition-colors" />
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Résumé Bilan */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <PieChart className="h-5 w-5 text-primary" />
              Actif
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-accents-1 rounded-lg">
                <span>Immobilisations</span>
                <span className="font-semibold">{formatCurrency(stats?.fixed_assets || 0)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-accents-1 rounded-lg">
                <span>Stocks</span>
                <span className="font-semibold">{formatCurrency(stats?.inventory || 0)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-accents-1 rounded-lg">
                <span>Créances clients</span>
                <span className="font-semibold">{formatCurrency(stats?.accounts_receivable || 0)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-accents-1 rounded-lg">
                <span>Trésorerie</span>
                <span className="font-semibold">{formatCurrency(stats?.cash || 0)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg font-bold">
                <span>Total Actif</span>
                <span>{formatCurrency(stats?.total_assets || 0)}</span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <PieChart className="h-5 w-5 text-primary" />
              Passif
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-accents-1 rounded-lg">
                <span>Capitaux propres</span>
                <span className="font-semibold">{formatCurrency(stats?.equity || 0)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-accents-1 rounded-lg">
                <span>Emprunts</span>
                <span className="font-semibold">{formatCurrency(stats?.loans || 0)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-accents-1 rounded-lg">
                <span>Dettes fournisseurs</span>
                <span className="font-semibold">{formatCurrency(stats?.accounts_payable || 0)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-accents-1 rounded-lg">
                <span>Autres dettes</span>
                <span className="font-semibold">{formatCurrency(stats?.other_liabilities || 0)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg font-bold">
                <span>Total Passif</span>
                <span>{formatCurrency(stats?.total_liabilities || 0)}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Actions rapides */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Actions rapides</h3>
          <div className="flex flex-wrap gap-3">
            <Link href="/comptabilite/ecritures/nouvelle">
              <Button variant="secondary">
                <Plus className="mr-2 h-4 w-4" />
                Nouvelle écriture
              </Button>
            </Link>
            <Link href="/comptabilite/balance">
              <Button variant="secondary">
                <BarChart3 className="mr-2 h-4 w-4" />
                Voir la balance
              </Button>
            </Link>
            <Button variant="secondary">
              <Download className="mr-2 h-4 w-4" />
              Exporter FEC
            </Button>
            <Button variant="secondary">
              <FileText className="mr-2 h-4 w-4" />
              Déclaration TVA
            </Button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
