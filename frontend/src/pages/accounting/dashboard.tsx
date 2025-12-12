import { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
    Calculator, TrendingUp, TrendingDown, FileText, BarChart3, PieChart,
    Wallet, Receipt, ArrowUpRight, ArrowDownRight, RefreshCw, Loader2,
    Calendar, Clock, AlertCircle, CheckCircle, Target, DollarSign,
    BookOpen, Scale, ChevronRight, Download
} from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface AccountingStats {
    revenue: number;
    expenses: number;
    net_income: number;
    total_assets: number;
    total_liabilities: number;
    equity: number;
    current_ratio: number;
    quick_ratio: number;
    debt_ratio: number;
}

interface JournalActivity {
    journal: string;
    entries: number;
    total: number;
    trend: number;
}

export default function AccountingDashboardPage() {
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState("2024");
    const [stats, setStats] = useState<AccountingStats | null>(null);
    const [journalActivity, setJournalActivity] = useState<JournalActivity[]>([]);
    const [pendingTasks, setPendingTasks] = useState<number>(0);

    useEffect(() => {
        fetchData();
    }, [period]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Mock data
            setStats({
                revenue: 125000000,
                expenses: 87500000,
                net_income: 37500000,
                total_assets: 250000000,
                total_liabilities: 95000000,
                equity: 155000000,
                current_ratio: 2.35,
                quick_ratio: 1.82,
                debt_ratio: 0.38
            });

            setJournalActivity([
                { journal: "Ventes", entries: 856, total: 125000000, trend: 12.5 },
                { journal: "Achats", entries: 423, total: 65000000, trend: -3.2 },
                { journal: "Banque", entries: 1245, total: 95000000, trend: 8.7 },
                { journal: "Opérations Diverses", entries: 156, total: 15000000, trend: 5.1 },
            ]);

            setPendingTasks(12);
        } catch (error) {
            console.error("Failed to fetch data:", error);
        } finally {
            setLoading(false);
        }
    };

    const monthlyData = {
        revenue: [8500, 9200, 10500, 9800, 11200, 12000, 10800, 11500, 12500, 11800, 12200, 14000],
        expenses: [6200, 6800, 7500, 7200, 8000, 8500, 7800, 8200, 8800, 8500, 8800, 9500]
    };

    const expenseBreakdown = [
        { label: "Achats", value: 35, color: "#3b82f6" },
        { label: "Salaires", value: 28, color: "#10b981" },
        { label: "Services", value: 18, color: "#f59e0b" },
        { label: "Impôts", value: 12, color: "#ef4444" },
        { label: "Autres", value: 7, color: "#8b5cf6" }
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 pt-14 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    return (
        <>
            <Head>
                <title>Tableau de Bord Comptable - SEKA</title>
            </Head>

            <div className="min-h-screen bg-gray-50 pt-14">
                <main className="p-6">
                    <div className="max-w-7xl mx-auto">
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                                    <Calculator className="h-7 w-7 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">Tableau de Bord Comptable</h1>
                                    <p className="text-sm text-gray-500">Vue d&apos;ensemble de votre comptabilité</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <select
                                    value={period}
                                    onChange={(e) => setPeriod(e.target.value)}
                                    className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="2024">Exercice 2024</option>
                                    <option value="2023">Exercice 2023</option>
                                    <option value="2022">Exercice 2022</option>
                                </select>
                                <button onClick={fetchData} className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">
                                    <RefreshCw className="h-4 w-4" />
                                    Actualiser
                                </button>
                                <button className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                    <Download className="h-4 w-4" />
                                    Export
                                </button>
                            </div>
                        </div>

                        {/* Pending Tasks Alert */}
                        {pendingTasks > 0 && (
                            <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-xl flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <AlertCircle className="h-5 w-5 text-orange-600" />
                                    <span className="text-orange-800">
                                        <strong>{pendingTasks} tâches</strong> en attente de traitement
                                    </span>
                                </div>
                                <Link href="/accounting/entries" className="text-sm text-orange-700 hover:text-orange-800 font-medium flex items-center gap-1">
                                    Voir les écritures <ChevronRight className="h-4 w-4" />
                                </Link>
                            </div>
                        )}

                        {/* Key Metrics */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white">
                                <div className="flex items-center justify-between mb-3">
                                    <TrendingUp className="h-6 w-6 opacity-80" />
                                    <span className="flex items-center gap-1 text-xs bg-white/20 px-2 py-0.5 rounded-full">
                                        <ArrowUpRight className="h-3 w-3" /> +12.5%
                                    </span>
                                </div>
                                <p className="text-3xl font-bold">{formatCurrency(stats?.revenue || 0)}</p>
                                <p className="text-sm text-white/80 mt-1">Chiffre d&apos;affaires</p>
                            </div>
                            <div className="bg-white rounded-xl border border-gray-200 p-5">
                                <div className="flex items-center justify-between mb-3">
                                    <TrendingDown className="h-6 w-6 text-red-500" />
                                    <span className="flex items-center gap-1 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                                        <ArrowUpRight className="h-3 w-3" /> +8.3%
                                    </span>
                                </div>
                                <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats?.expenses || 0)}</p>
                                <p className="text-sm text-gray-500 mt-1">Charges totales</p>
                            </div>
                            <div className="bg-white rounded-xl border border-gray-200 p-5">
                                <div className="flex items-center justify-between mb-3">
                                    <DollarSign className="h-6 w-6 text-green-500" />
                                    <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                        <ArrowUpRight className="h-3 w-3" /> +21.2%
                                    </span>
                                </div>
                                <p className="text-3xl font-bold text-green-600">{formatCurrency(stats?.net_income || 0)}</p>
                                <p className="text-sm text-gray-500 mt-1">Résultat net</p>
                            </div>
                            <div className="bg-white rounded-xl border border-gray-200 p-5">
                                <div className="flex items-center justify-between mb-3">
                                    <Scale className="h-6 w-6 text-blue-500" />
                                </div>
                                <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats?.equity || 0)}</p>
                                <p className="text-sm text-gray-500 mt-1">Capitaux propres</p>
                            </div>
                        </div>

                        {/* Charts Row */}
                        <div className="grid gap-6 lg:grid-cols-2 mb-6">
                            {/* Revenue vs Expenses */}
                            <div className="bg-white rounded-xl border border-gray-200 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                                        <BarChart3 className="h-5 w-5 text-blue-500" />
                                        Revenus vs Charges
                                    </h2>
                                    <span className="text-sm text-gray-500">Évolution mensuelle</span>
                                </div>
                                {typeof window !== "undefined" && (
                                    <Chart
                                        options={{
                                            chart: { type: "bar", toolbar: { show: false }, stacked: false },
                                            plotOptions: { bar: { horizontal: false, columnWidth: "55%", borderRadius: 4 } },
                                            dataLabels: { enabled: false },
                                            xaxis: { categories: ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"] },
                                            colors: ["#3b82f6", "#ef4444"],
                                            legend: { position: "top" },
                                            grid: { borderColor: "#f3f4f6" }
                                        }}
                                        series={[
                                            { name: "Revenus", data: monthlyData.revenue.map(v => v * 1000) },
                                            { name: "Charges", data: monthlyData.expenses.map(v => v * 1000) }
                                        ]}
                                        type="bar"
                                        height={280}
                                    />
                                )}
                            </div>

                            {/* Expense Breakdown */}
                            <div className="bg-white rounded-xl border border-gray-200 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                                        <PieChart className="h-5 w-5 text-blue-500" />
                                        Répartition des charges
                                    </h2>
                                </div>
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
                                            height={200}
                                            width={200}
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
                            </div>
                        </div>

                        {/* Financial Ratios & Journal Activity */}
                        <div className="grid gap-6 lg:grid-cols-3 mb-6">
                            {/* Financial Ratios */}
                            <div className="bg-white rounded-xl border border-gray-200 p-6">
                                <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <Target className="h-5 w-5 text-blue-500" />
                                    Ratios financiers
                                </h2>
                                <div className="space-y-4">
                                    <div className="p-4 bg-gray-50 rounded-lg">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm text-gray-600">Ratio de liquidité</span>
                                            <span className={`text-lg font-bold ${(stats?.current_ratio || 0) >= 1.5 ? "text-green-600" : "text-orange-600"}`}>
                                                {stats?.current_ratio?.toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${(stats?.current_ratio || 0) >= 1.5 ? "bg-green-500" : "bg-orange-500"}`}
                                                style={{ width: `${Math.min((stats?.current_ratio || 0) / 3 * 100, 100)}%` }}
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">Objectif: &gt; 1.5</p>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-lg">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm text-gray-600">Ratio rapide</span>
                                            <span className={`text-lg font-bold ${(stats?.quick_ratio || 0) >= 1 ? "text-green-600" : "text-orange-600"}`}>
                                                {stats?.quick_ratio?.toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${(stats?.quick_ratio || 0) >= 1 ? "bg-green-500" : "bg-orange-500"}`}
                                                style={{ width: `${Math.min((stats?.quick_ratio || 0) / 2 * 100, 100)}%` }}
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">Objectif: &gt; 1.0</p>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-lg">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm text-gray-600">Ratio dette</span>
                                            <span className={`text-lg font-bold ${(stats?.debt_ratio || 0) <= 0.5 ? "text-green-600" : "text-red-600"}`}>
                                                {((stats?.debt_ratio || 0) * 100).toFixed(0)}%
                                            </span>
                                        </div>
                                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${(stats?.debt_ratio || 0) <= 0.5 ? "bg-green-500" : "bg-red-500"}`}
                                                style={{ width: `${(stats?.debt_ratio || 0) * 100}%` }}
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">Objectif: &lt; 50%</p>
                                    </div>
                                </div>
                            </div>

                            {/* Journal Activity */}
                            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                                        <BookOpen className="h-5 w-5 text-blue-500" />
                                        Activité par journal
                                    </h2>
                                    <Link href="/accounting/journals" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
                                        Voir tous <ChevronRight className="h-4 w-4" />
                                    </Link>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    {journalActivity.map((journal) => (
                                        <div key={journal.journal} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="font-medium text-gray-900">{journal.journal}</span>
                                                <span className={`flex items-center gap-0.5 text-xs font-medium ${journal.trend >= 0 ? "text-green-600" : "text-red-600"}`}>
                                                    {journal.trend >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                                    {Math.abs(journal.trend)}%
                                                </span>
                                            </div>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-xl font-bold text-gray-900">{journal.entries}</span>
                                                <span className="text-sm text-gray-500">écritures</span>
                                            </div>
                                            <p className="text-sm text-gray-500 mt-1">{formatCurrency(journal.total)}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                            <h2 className="font-semibold text-gray-900 mb-4">Accès rapides</h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                {[
                                    { label: "Nouvelle écriture", icon: FileText, href: "/accounting/entries/new", color: "bg-blue-100 text-blue-600" },
                                    { label: "Balance générale", icon: Scale, href: "/accounting/balance-generale", color: "bg-green-100 text-green-600" },
                                    { label: "Grand livre", icon: BookOpen, href: "/accounting/ledger", color: "bg-purple-100 text-purple-600" },
                                    { label: "Rapprochement", icon: Target, href: "/accounting/bank-reconciliation", color: "bg-orange-100 text-orange-600" },
                                    { label: "Déclaration TVA", icon: Receipt, href: "/tax/tva-declaration", color: "bg-red-100 text-red-600" },
                                    { label: "Export FEC", icon: Download, href: "/accounting/export-fec", color: "bg-indigo-100 text-indigo-600" }
                                ].map((action) => (
                                    <Link key={action.label} href={action.href}>
                                        <div className="p-4 rounded-lg border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all cursor-pointer text-center">
                                            <div className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center mx-auto mb-2`}>
                                                <action.icon className="h-5 w-5" />
                                            </div>
                                            <p className="text-sm font-medium text-gray-900">{action.label}</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}
