import { useState, useEffect, useCallback } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { getBankTransactions, getAccountingAnalyticsStats, getAccountingMonthlyTrends } from "@/lib/api";
import { formatCurrency } from "@/lib/formatters";
import {
    TrendingUp, TrendingDown, FileText, BarChart3, PieChart,
    Wallet, Receipt, ArrowUpRight, RefreshCw,
    Clock, AlertCircle, Target, DollarSign,
    Scale, ChevronRight, Download, ArrowLeftRight,
    Zap, Building2, CreditCard
} from "lucide-react";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface AccountingStats {
    revenue: number;
    expenses: number;
    net_income: number;
    total_assets: number;
    total_liabilities: number;
    equity: number;
    receivables: number;
    payables: number;
    cash_balance: number;
}

interface Forecast {
    month: string;
    projected_income: number;
    projected_expenses: number;
    projected_balance: number;
}

export default function AccountingDashboardPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState("2024");
    const [stats, setStats] = useState<AccountingStats | null>(null);
    const [forecasts, setForecasts] = useState<Forecast[]>([]);
    const [pendingTasks, setPendingTasks] = useState<number>(0);
    const [monthlyData, setMonthlyData] = useState({
        categories: ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"],
        revenue: [] as number[],
        expenses: [] as number[]
    });

    const fetchData = useCallback(async () => {
        const token = localStorage.getItem("seka_access_token");
        if (!token) {
            router.push("/login");
            return;
        }

        setLoading(true);
        try {
            const year = parseInt(period) || 2024;
            const [statsData, trendsData, transactions] = await Promise.all([
                getAccountingAnalyticsStats(token, year),
                getAccountingMonthlyTrends(token, year),
                getBankTransactions(token, {}, 0, 10)
            ]);

            setStats(statsData);

            if (trendsData) {
                setMonthlyData({
                    categories: trendsData.labels || ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"],
                    revenue: trendsData.revenue || [],
                    expenses: trendsData.expenses || []
                });
            }

            const months = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];
            const currentMonthIdx = new Date().getMonth();
            const forecastData = months.slice(currentMonthIdx, currentMonthIdx + 6).map((month) => ({
                month,
                projected_income: 0,
                projected_expenses: 0,
                projected_balance: 0
            }));
            setForecasts(forecastData);

            setPendingTasks(transactions.filter((t: { is_reconciled?: boolean }) => !t.is_reconciled).length);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    }, [router, period]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return (
        <>
            <Head>
                <title>Tableau de Bord Comptable - SEKA</title>
            </Head>

            <DashboardLayout title="Tableau de Bord Comptable">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Tableau de Bord Comptable</h1>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">Vue d&apos;ensemble de votre comptabilité et prévisions</p>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                        <select
                            value={period}
                            onChange={(e) => setPeriod(e.target.value)}
                            className="px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                        >
                            {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() + 1 - i).map(year => (
                                <option key={year} value={year.toString()}>
                                    {year}
                                </option>
                            ))}
                        </select>
                        <Button variant="secondary" size="sm" onClick={fetchData}>
                            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                            <span className="hidden sm:inline ml-2">Actualiser</span>
                        </Button>
                        <Button variant="primary" size="sm">
                            <Download className="h-4 w-4" />
                            <span className="hidden sm:inline ml-2">Exporter</span>
                        </Button>
                    </div>
                </div>

                {/* Pending Tasks Alert */}
                {pendingTasks > 0 && (
                    <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="h-5 w-5 text-orange-600" />
                            <span className="text-orange-800">
                                <strong>{pendingTasks} transactions</strong> en attente de rapprochement
                            </span>
                        </div>
                        <Link href="/accounting/bank-reconciliation" className="text-sm text-orange-700 hover:text-orange-800 font-medium flex items-center gap-1">
                            Rapprocher <ChevronRight className="h-4 w-4" />
                        </Link>
                    </div>
                )}

                {/* Key Metrics - Row 1 */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
                    <div className="bg-blue-600 rounded-xl p-4 sm:p-6 text-white shadow-lg">
                        <div className="flex items-center justify-between mb-2 sm:mb-3">
                            <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg">
                                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
                            </div>
                            <span className="hidden sm:flex items-center gap-1 text-xs bg-white/20 px-2 py-1 rounded-full">
                                <ArrowUpRight className="h-3 w-3" /> +12.5%
                            </span>
                        </div>
                        <p className="text-xs sm:text-sm text-white/80">CA</p>
                        {loading ? (
                            <Skeleton className="h-6 sm:h-8 w-24 sm:w-32 mt-1 bg-white/20" />
                        ) : (
                            <p className="text-lg sm:text-2xl font-bold mt-1">{formatCurrency(stats?.revenue || 0)}</p>
                        )}
                    </div>

                    <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-2 sm:mb-3">
                            <div className="p-1.5 sm:p-2 bg-red-100 rounded-lg">
                                <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
                            </div>
                            <span className="hidden sm:flex items-center gap-1 text-xs bg-red-50 text-red-600 px-2 py-1 rounded-full">
                                <ArrowUpRight className="h-3 w-3" /> +8.3%
                            </span>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-500">Charges</p>
                        {loading ? (
                            <Skeleton className="h-6 sm:h-8 w-24 sm:w-32 mt-1" />
                        ) : (
                            <p className="text-lg sm:text-2xl font-bold text-gray-900 mt-1">{formatCurrency(stats?.expenses || 0)}</p>
                        )}
                    </div>

                    <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-2 sm:mb-3">
                            <div className="p-1.5 sm:p-2 bg-green-100 rounded-lg">
                                <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                            </div>
                            <span className="hidden sm:flex items-center gap-1 text-xs bg-green-50 text-green-600 px-2 py-1 rounded-full">
                                <ArrowUpRight className="h-3 w-3" /> +21%
                            </span>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-500">Résultat net</p>
                        {loading ? (
                            <Skeleton className="h-6 sm:h-8 w-24 sm:w-32 mt-1" />
                        ) : (
                            <p className="text-lg sm:text-2xl font-bold text-green-600 mt-1">{formatCurrency(stats?.net_income || 0)}</p>
                        )}
                    </div>

                    <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-2 sm:mb-3">
                            <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg">
                                <Wallet className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                            </div>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-500">Trésorerie</p>
                        {loading ? (
                            <Skeleton className="h-6 sm:h-8 w-24 sm:w-32 mt-1" />
                        ) : (
                            <p className="text-lg sm:text-2xl font-bold text-gray-900 mt-1">{formatCurrency(stats?.cash_balance || 0)}</p>
                        )}
                    </div>
                </div>

                {/* Secondary Metrics */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
                    <div className="bg-white rounded-xl border border-gray-100 p-3 sm:p-4 shadow-sm">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="p-1.5 sm:p-2 bg-orange-100 rounded-lg">
                                <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs text-gray-500 truncate">Créances</p>
                                <p className="text-sm sm:text-lg font-bold text-gray-900">{formatCurrency(stats?.receivables || 0)}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-100 rounded-lg">
                                <CreditCard className="h-4 w-4 text-red-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Dettes fournisseurs</p>
                                <p className="text-lg font-bold text-gray-900">{formatCurrency(stats?.payables || 0)}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Building2 className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Total actif</p>
                                <p className="text-lg font-bold text-gray-900">{formatCurrency(stats?.total_assets || 0)}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <Scale className="h-4 w-4 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Capitaux propres</p>
                                <p className="text-lg font-bold text-gray-900">{formatCurrency(stats?.equity || 0)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Charts Row */}
                <div className="grid gap-6 lg:grid-cols-2 mb-6">
                    {/* Revenue vs Expenses */}
                    <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                                <BarChart3 className="h-5 w-5 text-blue-500" />
                                Revenus vs Charges
                            </h2>
                            <span className="text-sm text-gray-500">Évolution mensuelle (millions FCFA)</span>
                        </div>
                        {loading ? (
                            <Skeleton className="h-64 w-full" />
                        ) : typeof window !== "undefined" && (
                            <Chart
                                options={{
                                    chart: { type: "bar", toolbar: { show: false }, stacked: false },
                                    plotOptions: { bar: { horizontal: false, columnWidth: "55%", borderRadius: 4 } },
                                    dataLabels: { enabled: false },
                                    xaxis: { categories: monthlyData.categories },
                                    colors: ["#3b82f6", "#ef4444"],
                                    legend: { position: "top" },
                                    grid: { borderColor: "#f3f4f6" },
                                    yaxis: { labels: { formatter: (val: number) => `${val}M` } }
                                }}
                                series={[
                                    { name: "Revenus", data: monthlyData.revenue },
                                    { name: "Charges", data: monthlyData.expenses }
                                ]}
                                type="bar"
                                height={280}
                            />
                        )}
                    </div>

                    {/* Cash Flow Forecast */}
                    <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                                <Zap className="h-5 w-5 text-orange-500" />
                                Prévisions de trésorerie
                            </h2>
                            <Badge variant="warning">IA</Badge>
                        </div>
                        {loading ? (
                            <Skeleton className="h-64 w-full" />
                        ) : typeof window !== "undefined" && (
                            <Chart
                                options={{
                                    chart: { type: "area", toolbar: { show: false } },
                                    dataLabels: { enabled: false },
                                    stroke: { curve: "smooth", width: 2 },
                                    xaxis: { categories: forecasts.map(f => f.month) },
                                    colors: ["#3b82f6", "#10b981"],
                                    fill: {
                                        type: "gradient",
                                        gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.1 }
                                    },
                                    grid: { borderColor: "#f3f4f6" },
                                    yaxis: { labels: { formatter: (val: number) => `${(val / 1000000).toFixed(0)}M` } },
                                    legend: { position: "top" }
                                }}
                                series={[
                                    { name: "Prévision entrées", data: forecasts.map(f => f.projected_income) },
                                    { name: "Prévision solde", data: forecasts.map(f => f.projected_balance) }
                                ]}
                                type="area"
                                height={280}
                            />
                        )}
                    </div>
                </div>

                {/* Bottom Row */}
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Expense Breakdown */}
                    <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <PieChart className="h-5 w-5 text-blue-500" />
                            Répartition des charges
                        </h2>
                        {loading ? (
                            <Skeleton className="h-48 w-full" />
                        ) : stats?.expenses && stats.expenses > 0 ? (
                            <div className="text-center py-8">
                                <PieChart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                <p className="text-gray-500 font-medium">Analyse en cours</p>
                                <p className="text-sm text-gray-400 mt-1">
                                    La répartition détaillée des charges sera disponible prochainement
                                </p>
                                <div className="mt-4 bg-gray-50 rounded-lg p-4">
                                    <p className="text-sm text-gray-600 mb-2">Total des charges :</p>
                                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.expenses)}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <PieChart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                <p className="text-gray-500 font-medium">Aucune charge enregistrée</p>
                                <p className="text-sm text-gray-400 mt-1">
                                    Les charges apparaîtront ici une fois les écritures saisies
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Financial Ratios */}
                    <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Target className="h-5 w-5 text-blue-500" />
                            Indicateurs clés
                        </h2>
                        <div className="space-y-4">
                            {stats?.revenue && stats.revenue > 0 ? (
                                <>
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm text-gray-600">Marge nette</span>
                                            <span className="text-lg font-bold text-green-600">
                                                {((stats.net_income / stats.revenue) * 100).toFixed(1)}%
                                            </span>
                                        </div>
                                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full bg-green-500"
                                                style={{ width: `${Math.min(100, (stats.net_income / stats.revenue) * 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm text-gray-600">Ratio actif/passif</span>
                                            <span className="text-lg font-bold text-blue-600">
                                                {stats.total_liabilities > 0
                                                    ? (stats.total_assets / stats.total_liabilities).toFixed(2)
                                                    : '∞'}
                                            </span>
                                        </div>
                                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full bg-blue-500"
                                                style={{ width: stats.total_liabilities > 0 ? `${Math.min(100, (stats.total_assets / stats.total_liabilities / 3) * 100)}%` : '100%' }}
                                            />
                                        </div>
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm text-gray-600">Taux d&apos;endettement</span>
                                            <span className="text-lg font-bold text-orange-600">
                                                {stats.total_assets > 0
                                                    ? ((stats.total_liabilities / stats.total_assets) * 100).toFixed(1)
                                                    : '0'}%
                                            </span>
                                        </div>
                                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full bg-orange-500"
                                                style={{ width: `${Math.min(100, (stats.total_liabilities / stats.total_assets) * 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-8">
                                    <Target className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                    <p className="text-gray-500 font-medium">Aucune donnée disponible</p>
                                    <p className="text-sm text-gray-400 mt-1">
                                        Les indicateurs apparaîtront une fois les données comptables saisies
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                        <h2 className="font-semibold text-gray-900 mb-4">Accès rapides</h2>
                        <div className="space-y-3">
                            {[
                                { label: "Nouvelle écriture", icon: FileText, href: "/accounting/entries/new", color: "bg-blue-100 text-blue-600" },
                                { label: "Rapprochement IA", icon: ArrowLeftRight, href: "/accounting/bank-reconciliation", color: "bg-green-100 text-green-600" },
                                { label: "Déclaration TVA", icon: Receipt, href: "/tax/tva-declaration", color: "bg-orange-100 text-orange-600" },
                                { label: "Export FEC", icon: Download, href: "/accounting/export-fec", color: "bg-purple-100 text-purple-600" },
                                { label: "Balance générale", icon: Scale, href: "/accounting/balance", color: "bg-indigo-100 text-indigo-600" },
                            ].map((action) => (
                                <Link key={action.label} href={action.href}>
                                    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                                        <div className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center`}>
                                            <action.icon className="h-5 w-5" />
                                        </div>
                                        <span className="font-medium text-gray-900">{action.label}</span>
                                        <ChevronRight className="h-4 w-4 text-gray-400 ml-auto" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        </>
    );
}
