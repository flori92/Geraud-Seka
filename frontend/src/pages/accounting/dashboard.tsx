import { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { getTreasuryDashboard, getInvoices, getBankTransactions, getAccountingAnalyticsStats, getAccountingMonthlyTrends } from "@/lib/api";
import { formatCurrency } from "@/lib/formatters";
import {
    Calculator, TrendingUp, TrendingDown, FileText, BarChart3, PieChart,
    Wallet, Receipt, ArrowUpRight, ArrowDownRight, RefreshCw,
    Calendar, Clock, AlertCircle, CheckCircle, Target, DollarSign,
    BookOpen, Scale, ChevronRight, Download, ArrowLeftRight,
    Zap, Building2, CreditCard, Eye
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
    const [recentEntries, setRecentEntries] = useState<any[]>([]);
    const [monthlyData, setMonthlyData] = useState({
        categories: ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"],
        revenue: [] as number[],
        expenses: [] as number[]
    });

    useEffect(() => {
        fetchData();
    }, [period]);

    const fetchData = async () => {
        const token = localStorage.getItem("seka_access_token");
        if (!token) {
            router.push("/login");
            return;
        }

        setLoading(true);
        try {
            const year = parseInt(period) || 2024;
            // Fetch real accounting data from backend Analytics Engine
            const [statsData, trendsData, transactions] = await Promise.all([
                getAccountingAnalyticsStats(token, year),
                getAccountingMonthlyTrends(token, year),
                getBankTransactions(token, {}, 0, 10)
            ]);

            setStats(statsData);

            if (trendsData) {
                setMonthlyData({
                    categories: trendsData.labels || monthlyData.categories,
                    revenue: trendsData.revenue || [],
                    expenses: trendsData.expenses || []
                });
            }

            // Generate simple forecasts (empty for now to avoid fake data)
            const months = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];
            const currentMonthIdx = new Date().getMonth();
            const forecastData = months.slice(currentMonthIdx, currentMonthIdx + 6).map((month) => ({
                month,
                projected_income: 0,
                projected_expenses: 0,
                projected_balance: 0
            }));
            setForecasts(forecastData);

            setPendingTasks(transactions.filter((t: any) => !t.is_reconciled).length);
            setRecentEntries(transactions.slice(0, 5));
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const expenseBreakdown = [
        { label: "Achats", value: 35, color: "#3b82f6" },
        { label: "Salaires", value: 28, color: "#10b981" },
        { label: "Services", value: 18, color: "#f59e0b" },
        { label: "Impôts", value: 12, color: "#ef4444" },
        { label: "Autres", value: 7, color: "#8b5cf6" }
    ];

    const cashFlowForecast = [
        { label: "Janv", actual: 42, forecast: null },
        { label: "Févr", actual: 45, forecast: null },
        { label: "Mars", actual: 48, forecast: null },
        { label: "Avr", actual: 52, forecast: null },
        { label: "Mai", actual: null, forecast: 55 },
        { label: "Juin", actual: null, forecast: 58 },
    ];

    return (
        <>
            <Head>
                <title>Tableau de Bord Comptable - SEKA</title>
            </Head>

            <DashboardLayout title="Tableau de Bord Comptable">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Tableau de Bord Comptable</h1>
                        <p className="text-gray-500 mt-1">Vue d&apos;ensemble de votre comptabilité et prévisions</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <select
                            value={period}
                            onChange={(e) => setPeriod(e.target.value)}
                            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="2024">Exercice 2024</option>
                            <option value="2023">Exercice 2023</option>
                        </select>
                        <Button variant="secondary" size="sm" onClick={fetchData}>
                            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                            Actualiser
                        </Button>
                        <Button variant="primary" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Exporter
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
                        <div className="flex items-center justify-between mb-3">
                            <div className="p-2 bg-white/20 rounded-lg">
                                <TrendingUp className="h-5 w-5" />
                            </div>
                            <span className="flex items-center gap-1 text-xs bg-white/20 px-2 py-1 rounded-full">
                                <ArrowUpRight className="h-3 w-3" /> +12.5%
                            </span>
                        </div>
                        <p className="text-sm text-white/80">Chiffre d&apos;affaires</p>
                        {loading ? (
                            <Skeleton className="h-8 w-32 mt-1 bg-white/20" />
                        ) : (
                            <p className="text-2xl font-bold mt-1">{formatCurrency(stats?.revenue || 0)}</p>
                        )}
                    </div>

                    <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <div className="p-2 bg-red-100 rounded-lg">
                                <TrendingDown className="h-5 w-5 text-red-600" />
                            </div>
                            <span className="flex items-center gap-1 text-xs bg-red-50 text-red-600 px-2 py-1 rounded-full">
                                <ArrowUpRight className="h-3 w-3" /> +8.3%
                            </span>
                        </div>
                        <p className="text-sm text-gray-500">Charges</p>
                        {loading ? (
                            <Skeleton className="h-8 w-32 mt-1" />
                        ) : (
                            <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(stats?.expenses || 0)}</p>
                        )}
                    </div>

                    <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <DollarSign className="h-5 w-5 text-green-600" />
                            </div>
                            <span className="flex items-center gap-1 text-xs bg-green-50 text-green-600 px-2 py-1 rounded-full">
                                <ArrowUpRight className="h-3 w-3" /> +21%
                            </span>
                        </div>
                        <p className="text-sm text-gray-500">Résultat net</p>
                        {loading ? (
                            <Skeleton className="h-8 w-32 mt-1" />
                        ) : (
                            <p className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(stats?.net_income || 0)}</p>
                        )}
                    </div>

                    <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Wallet className="h-5 w-5 text-blue-600" />
                            </div>
                        </div>
                        <p className="text-sm text-gray-500">Trésorerie</p>
                        {loading ? (
                            <Skeleton className="h-8 w-32 mt-1" />
                        ) : (
                            <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(stats?.cash_balance || 0)}</p>
                        )}
                    </div>
                </div>

                {/* Secondary Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-100 rounded-lg">
                                <Clock className="h-4 w-4 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Créances clients</p>
                                <p className="text-lg font-bold text-gray-900">{formatCurrency(stats?.receivables || 0)}</p>
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
                        ) : (
                            <div className="flex items-center gap-6">
                                {typeof window !== "undefined" && (
                                    <Chart
                                        options={{
                                            chart: { type: "donut" },
                                            labels: expenseBreakdown.map(e => e.label),
                                            colors: expenseBreakdown.map(e => e.color),
                                            legend: { show: false },
                                            dataLabels: { enabled: false },
                                            plotOptions: { pie: { donut: { size: "70%" } } }
                                        }}
                                        series={expenseBreakdown.map(e => e.value)}
                                        type="donut"
                                        height={180}
                                        width={180}
                                    />
                                )}
                                <div className="flex-1 space-y-2">
                                    {expenseBreakdown.map((item) => (
                                        <div key={item.label} className="flex items-center gap-3">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                                            <div className="flex-1 flex justify-between">
                                                <span className="text-sm text-gray-600">{item.label}</span>
                                                <span className="text-sm font-semibold text-gray-900">{item.value}%</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
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
                            <div className="p-3 bg-gray-50 rounded-lg">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-gray-600">Marge nette</span>
                                    <span className="text-lg font-bold text-green-600">27%</span>
                                </div>
                                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div className="h-full rounded-full bg-green-500" style={{ width: "27%" }} />
                                </div>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-lg">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-gray-600">Ratio de liquidité</span>
                                    <span className="text-lg font-bold text-blue-600">2.35</span>
                                </div>
                                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div className="h-full rounded-full bg-blue-500" style={{ width: "78%" }} />
                                </div>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-lg">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-gray-600">Taux d&apos;endettement</span>
                                    <span className="text-lg font-bold text-orange-600">38%</span>
                                </div>
                                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div className="h-full rounded-full bg-orange-500" style={{ width: "38%" }} />
                                </div>
                            </div>
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
