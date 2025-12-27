import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { 
  Wallet, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  Building2, CreditCard, Calendar, AlertTriangle, CheckCircle,
  RefreshCw, Download, ChevronRight, BarChart3, PieChart
} from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface TreasuryDashboard {
  current_balance: number;
  available_balance: number;
  reserved_funds: number;
  month_summary: {
    inflows: number;
    outflows: number;
    net_flow: number;
  };
  forecast_30_days: {
    expected_inflows: number;
    expected_outflows: number;
    projected_balance: number;
  };
  alerts: Array<{ type: string; message: string; amount: number }>;
  bank_accounts: Array<{ name: string; bank: string; balance: number; currency: string }>;
  weekly_balances?: number[];
  weekly_inflows?: number[];
  weekly_outflows?: number[];
}

interface ForecastData {
  forecast: Array<{
    date: string;
    balance: number;
    inflows: number;
    outflows: number;
  }>;
  summary: {
    min_balance: number;
    max_balance: number;
    ending_balance: number;
  };
}

export default function TresoreriePage() {
  const [dashboard, setDashboard] = useState<TreasuryDashboard | null>(null);
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [kpis, setKpis] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http:

  useEffect(() => {
    fetchData();
  }, []);

  const getHeaders = () => {
    const token = localStorage.getItem("seka_access_token");
    return { Authorization: `Bearer ${token}` };
  };

  const fetchData = async () => {
    try {
      const [dashRes, forecastRes, kpisRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/v1/treasury/advanced/dashboard`, { headers: getHeaders() }),
        fetch(`${API_BASE_URL}/api/v1/treasury/advanced/forecast?days=30`, { headers: getHeaders() }),
        fetch(`${API_BASE_URL}/api/v1/treasury/advanced/kpis`, { headers: getHeaders() })
      ]);

      if (dashRes.ok) setDashboard(await dashRes.json());
      if (forecastRes.ok) setForecast(await forecastRes.json());
      if (kpisRes.ok) setKpis(await kpisRes.json());
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency = "XOF") => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency,
      minimumFractionDigits: 0
    }).format(amount);
  };

  const forecastChartOptions: ApexCharts.ApexOptions = {
    chart: { type: "area", toolbar: { show: false }, zoom: { enabled: false } },
    dataLabels: { enabled: false },
    stroke: { curve: "smooth", width: 2 },
    fill: { type: "gradient", gradient: { opacityFrom: 0.4, opacityTo: 0.1 } },
    xaxis: {
      categories: forecast?.forecast.slice(0, 14).map(f => new Date(f.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })) || [],
      labels: { style: { fontSize: "10px" } }
    },
    yaxis: {
      labels: { formatter: (val) => formatCurrency(val) }
    },
    colors: ["#0070f3"],
    tooltip: { y: { formatter: (val) => formatCurrency(val) } }
  };

  const forecastChartSeries = [
    { name: "Solde prévu", data: forecast?.forecast.slice(0, 14).map(f => f.balance) || [] }
  ];

  const flowChartOptions: ApexCharts.ApexOptions = {
    chart: { type: "bar", toolbar: { show: false }, stacked: false },
    plotOptions: { bar: { horizontal: false, columnWidth: "60%" } },
    dataLabels: { enabled: false },
    xaxis: {
      categories: ["Semaine 1", "Semaine 2", "Semaine 3", "Semaine 4"]
    },
    colors: ["#10b981", "#ef4444"],
    legend: { position: "top" }
  };

  const flowChartSeries = [
    { name: "Entrées", data: dashboard?.weekly_inflows || [0, 0, 0, 0] },
    { name: "Sorties", data: dashboard?.weekly_outflows || [0, 0, 0, 0] }
  ];

  return (
    <DashboardLayout title="Trésorerie">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Trésorerie</h1>
            <p className="text-sm text-accents-5">Gestion de la trésorerie et prévisions</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={fetchData}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Actualiser
            </Button>
            <Button>
              <Download className="mr-2 h-4 w-4" />
              Exporter
            </Button>
          </div>
        </div>

        {/* Soldes principaux */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6 bg-gradient-to-br from-primary to-blue-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-80">Solde Total</p>
                <p className="text-3xl font-bold mt-1">
                  {formatCurrency(dashboard?.current_balance || 0)}
                </p>
              </div>
              <Wallet className="h-12 w-12 opacity-50" />
            </div>
            <div className="mt-4 pt-4 border-t border-white/20">
              <div className="flex justify-between text-sm">
                <span className="opacity-80">Disponible</span>
                <span className="font-medium">{formatCurrency(dashboard?.available_balance || 0)}</span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-accents-5">Entrées du mois</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(dashboard?.month_summary.inflows || 0)}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-2 flex items-center text-xs text-green-600">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              +8.3% vs mois dernier
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-accents-5">Sorties du mois</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(dashboard?.month_summary.outflows || 0)}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <div className="mt-2 flex items-center text-xs text-red-600">
              <ArrowDownRight className="h-3 w-3 mr-1" />
              +3.2% vs mois dernier
            </div>
          </Card>
        </div>

        {/* Graphiques */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Prévision de trésorerie (14 jours)</h3>
            {typeof window !== "undefined" && (
              <Chart
                options={forecastChartOptions}
                series={forecastChartSeries}
                type="area"
                height={250}
              />
            )}
            <div className="mt-4 grid grid-cols-3 gap-4 text-center">
              <div className="p-2 bg-accents-1 rounded-lg">
                <p className="text-xs text-accents-5">Min</p>
                <p className="font-semibold text-sm">{formatCurrency(forecast?.summary.min_balance || 0)}</p>
              </div>
              <div className="p-2 bg-accents-1 rounded-lg">
                <p className="text-xs text-accents-5">Max</p>
                <p className="font-semibold text-sm">{formatCurrency(forecast?.summary.max_balance || 0)}</p>
              </div>
              <div className="p-2 bg-primary/10 rounded-lg">
                <p className="text-xs text-accents-5">Fin période</p>
                <p className="font-semibold text-sm">{formatCurrency(forecast?.summary.ending_balance || 0)}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-4">Flux hebdomadaires</h3>
            {typeof window !== "undefined" && (
              <Chart
                options={flowChartOptions}
                series={flowChartSeries}
                type="bar"
                height={250}
              />
            )}
          </Card>
        </div>

        {/* Comptes bancaires et KPIs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Comptes bancaires</h3>
              <Link href="/tresorerie/comptes">
                <Button variant="ghost" size="sm">
                  Voir tout <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="space-y-3">
              {dashboard?.bank_accounts.map((account, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-accents-1 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{account.name}</p>
                      <p className="text-xs text-accents-5">{account.bank}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(account.balance, account.currency)}</p>
                    <Badge variant="success">Actif</Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-4">Indicateurs clés</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-accents-1 rounded-lg">
                <p className="text-xs text-accents-5">Ratio de liquidité</p>
                <p className="text-xl font-bold">{kpis?.liquidity_ratio?.toFixed(2) || "2.35"}</p>
                <Badge variant="success">Bon</Badge>
              </div>
              <div className="p-3 bg-accents-1 rounded-lg">
                <p className="text-xs text-accents-5">BFR (jours)</p>
                <p className="text-xl font-bold">{kpis?.cash_conversion_cycle || 45}</p>
                <Badge variant="warning">À surveiller</Badge>
              </div>
              <div className="p-3 bg-accents-1 rounded-lg">
                <p className="text-xs text-accents-5">DSO (jours)</p>
                <p className="text-xl font-bold">{kpis?.days_sales_outstanding || 32}</p>
                <Badge variant="success">Bon</Badge>
              </div>
              <div className="p-3 bg-accents-1 rounded-lg">
                <p className="text-xs text-accents-5">Runway (jours)</p>
                <p className="text-xl font-bold">{kpis?.runway_days || 81}</p>
                <Badge variant="success">Sain</Badge>
              </div>
            </div>
          </Card>
        </div>

        {/* Alertes */}
        {dashboard?.alerts && dashboard.alerts.length > 0 && (
          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Alertes
            </h3>
            <div className="space-y-3">
              {dashboard.alerts.map((alert, idx) => (
                <div 
                  key={idx} 
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    alert.type === "critical" ? "bg-red-50 border border-red-200" :
                    alert.type === "warning" ? "bg-yellow-50 border border-yellow-200" :
                    "bg-blue-50 border border-blue-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <AlertTriangle className={`h-5 w-5 ${
                      alert.type === "critical" ? "text-red-500" :
                      alert.type === "warning" ? "text-yellow-500" :
                      "text-blue-500"
                    }`} />
                    <span className="text-sm">{alert.message}</span>
                  </div>
                  {alert.amount > 0 && (
                    <span className="font-semibold">{formatCurrency(alert.amount)}</span>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Actions rapides */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Actions rapides</h3>
          <div className="flex flex-wrap gap-3">
            <Link href="/tresorerie/rapprochement">
              <Button variant="secondary">
                <CheckCircle className="mr-2 h-4 w-4" />
                Rapprochement bancaire
              </Button>
            </Link>
            <Link href="/tresorerie/echeancier">
              <Button variant="secondary">
                <Calendar className="mr-2 h-4 w-4" />
                Échéancier
              </Button>
            </Link>
            <Link href="/tresorerie/previsions">
              <Button variant="secondary">
                <BarChart3 className="mr-2 h-4 w-4" />
                Prévisions détaillées
              </Button>
            </Link>
            <Button variant="secondary">
              <CreditCard className="mr-2 h-4 w-4" />
              Nouveau virement
            </Button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
