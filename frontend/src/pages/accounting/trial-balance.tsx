
import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { Alert } from "@/components/ui/Alert";
import { getTrialBalance, TrialBalanceResponse, TrialBalanceItem } from "@/lib/api";
import { Download, Search, Filter, RefreshCw, FileText } from "lucide-react";


export default function TrialBalancePage() {
    const [data, setData] = useState<TrialBalanceResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [search, setSearch] = useState("");
    const [period, setPeriod] = useState("current_year");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [showAuxiliary, setShowAuxiliary] = useState(false);

    useEffect(() => {
        fetchData();
    }, [period, startDate, endDate]);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);
            const token = localStorage.getItem("seka_access_token");
            if (!token) {
                setError("Vous devez être connecté");
                setLoading(false);
                return;
            }

            let start = startDate;
            let end = endDate;

            const now = new Date();
            if (period === "current_year") {
                start = `${now.getFullYear()}-01-01`;
                end = `${now.getFullYear()}-12-31`;
            } else if (period === "last_year") {
                start = `${now.getFullYear() - 1}-01-01`;
                end = `${now.getFullYear() - 1}-12-31`;
            } else if (period === "current_month") {
                start = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
                end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
            }

            const response = await getTrialBalance(token, start, end);
            setData(response);
        } catch (err) {
            console.error("Error fetching trial balance:", err);
            setError("Impossible de charger la balance");
        } finally {
            setLoading(false);
        }
    };

    const filteredAccounts = data?.accounts.filter(account => {
        if (!search) return true;
        const searchLower = search.toLowerCase();
        return (
            account.account_number.toLowerCase().includes(searchLower) ||
            account.account_name.toLowerCase().includes(searchLower)
        );
    }) || [];

    const handleExport = () => {
        console.log("Exporting trial balance...");
    };

    const formatMoney = (amount: number) => {
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(amount);
    };

    if (loading && !data) {
        return (
            <DashboardLayout title="Balance Générale">
                <div className="space-y-6">
                    <Card><Skeleton className="h-20" /></Card>
                    <Card><Skeleton className="h-96" /></Card>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="Balance Générale">
            <div className="flex flex-col space-y-6">
                {/* Header Actions */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Balance Générale</h1>
                        <p className="text-gray-500">
                            {data?.accounts.length || 0} comptes • Période: {period === 'custom' ? `${startDate} au ${endDate}` : 'Exercice courant'}
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Button variant="secondary" onClick={fetchData}>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Actualiser
                        </Button>
                        <Button variant="primary" onClick={handleExport}>
                            <Download className="w-4 h-4 mr-2" />
                            Exporter
                        </Button>
                    </div>
                </div>

                {/* Filters Bar */}
                <Card className="p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                                placeholder="Rechercher un compte (numéro ou libellé)..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>

                        <div className="w-full md:w-48">
                            <Select value={period} onChange={(e) => setPeriod(e.target.value)}>
                                <option value="current_year">Cette année</option>
                                <option value="last_year">Année précédente</option>
                                <option value="current_month">Ce mois</option>
                                <option value="custom">Personnalisé</option>
                            </Select>
                        </div>

                        {period === "custom" && (
                            <div className="flex gap-2">
                                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                            </div>
                        )}

                        <div className="flex items-center space-x-2 border rounded-md px-3 bg-gray-50 hover:bg-gray-100 cursor-pointer" onClick={() => setShowAuxiliary(!showAuxiliary)}>
                            <input type="checkbox" checked={showAuxiliary} onChange={() => { }} className="rounded text-primary focus:ring-primary" />
                            <span className="text-sm font-medium">Balance Auxiliaire</span>
                        </div>
                    </div>
                </Card>

                {error && <Alert variant="error">{error}</Alert>}

                {/* Data Table */}
                <Card className="overflow-hidden shadow-sm border border-gray-200">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                                <tr>
                                    <th scope="col" className="px-6 py-3 font-medium">Compte</th>
                                    <th scope="col" className="px-6 py-3 font-medium text-right">Débit</th>
                                    <th scope="col" className="px-6 py-3 font-medium text-right">Crédit</th>
                                    <th scope="col" className="px-6 py-3 font-medium text-right bg-gray-100/50">Solde Débiteur</th>
                                    <th scope="col" className="px-6 py-3 font-medium text-right bg-gray-100/50">Solde Créditeur</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {loading ? (
                                    [...Array(5)].map((_, i) => (
                                        <tr key={i}>
                                            <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                                            <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                                            <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                                            <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                                            <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                                        </tr>
                                    ))
                                ) : filteredAccounts.length > 0 ? (
                                    <>
                                        {filteredAccounts.map((account) => (
                                            <tr key={account.account_number} className="hover:bg-gray-50/80 transition-colors">
                                                <td className="px-6 py-3">
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-gray-900">{account.account_number}</span>
                                                        <span className="text-gray-500 text-xs">{account.account_name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3 text-right font-mono text-gray-600">
                                                    {account.debit > 0 ? formatMoney(account.debit) : "-"}
                                                </td>
                                                <td className="px-6 py-3 text-right font-mono text-gray-600">
                                                    {account.credit > 0 ? formatMoney(account.credit) : "-"}
                                                </td>
                                                <td className="px-6 py-3 text-right font-mono font-medium text-gray-900 bg-gray-50/30">
                                                    {account.solde_debit > 0 ? formatMoney(account.solde_debit) : "-"}
                                                </td>
                                                <td className="px-6 py-3 text-right font-mono font-medium text-gray-900 bg-gray-50/30">
                                                    {account.solde_credit > 0 ? formatMoney(account.solde_credit) : "-"}
                                                </td>
                                            </tr>
                                        ))}
                                        {/* Totals Row */}
                                        <tr className="bg-gray-100 font-bold border-t-2 border-gray-300">
                                            <td className="px-6 py-4 text-gray-900">TOTAUX</td>
                                            <td className="px-6 py-4 text-right">
                                                {data?.totals && formatMoney(data.totals.total_debit)}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {data?.totals && formatMoney(data.totals.total_credit)}
                                            </td>
                                            <td className="px-6 py-4 text-right text-gray-900">
                                                {data?.totals && formatMoney(filteredAccounts.reduce((acc, curr) => acc + curr.solde_debit, 0))}
                                            </td>
                                            <td className="px-6 py-4 text-right text-gray-900">
                                                {data?.totals && formatMoney(filteredAccounts.reduce((acc, curr) => acc + curr.solde_credit, 0))}
                                            </td>
                                        </tr>
                                    </>
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                            <div className="flex flex-col items-center justify-center">
                                                <FileText className="h-12 w-12 text-gray-300 mb-3" />
                                                <p className="text-lg font-medium">Aucun compte trouvé</p>
                                                <p className="text-sm">Essayez de modifier vos filtres ou la période.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {data?.totals && !data.totals.is_balanced && (
                        <div className="bg-red-50 p-4 border-t border-red-100 flex items-center justify-between">
                            <div className="flex items-center text-red-700">
                                <Alert variant="error" className="mr-2">Attention : Balance déséquilibrée</Alert>
                            </div>
                            <span className="font-mono font-bold text-red-700">
                                Écart: {formatMoney(Math.abs(data.totals.total_debit - data.totals.total_credit))}
                            </span>
                        </div>
                    )}
                </Card>
            </div>
        </DashboardLayout>
    );
}
