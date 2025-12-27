import { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import {
    BookOpen, Plus, Search, Filter, Download, Clock, CheckCircle, Loader2
} from "lucide-react";
import { getJournals, getJournalEntries, type Journal, type JournalEntry } from "@/lib/api";

const journalColors: Record<string, string> = {
    purchases: "bg-blue-500",
    sales: "bg-green-500",
    bank: "bg-primary-500",
    cash: "bg-orange-500",
    misc: "bg-gray-500",
};

const journalLabels: Record<string, string> = {
    purchases: "Journal des Achats",
    sales: "Journal des Ventes",
    bank: "Journal de Banque",
    cash: "Journal de Caisse",
    misc: "Journal des OD",
};

export default function JournalsPage() {
    const [journals, setJournals] = useState<Journal[]>([]);
    const [recentEntries, setRecentEntries] = useState<JournalEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [exportingFec, setExportingFec] = useState(false);

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "";
    const apiPrefix = API_BASE_URL ? `${API_BASE_URL}/api/v1` : "/api/v1";

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("seka_access_token");
            if (token) {
                const [journalsData, entriesData] = await Promise.all([
                    getJournals(token),
                    getJournalEntries(token),
                ]);

                if (journalsData.length === 0) {
                    setJournals([
                        { id: "1", code: "AC", name: "Journal des Achats", type: "purchases", is_active: true, entries_count: 0, total_debit: 0, total_credit: 0 },
                        { id: "2", code: "VE", name: "Journal des Ventes", type: "sales", is_active: true, entries_count: 0, total_debit: 0, total_credit: 0 },
                        { id: "3", code: "BQ", name: "Journal de Banque", type: "bank", is_active: true, entries_count: 0, total_debit: 0, total_credit: 0 },
                        { id: "4", code: "CA", name: "Journal de Caisse", type: "cash", is_active: true, entries_count: 0, total_debit: 0, total_credit: 0 },
                        { id: "5", code: "OD", name: "Journal des OD", type: "misc", is_active: true, entries_count: 0, total_debit: 0, total_credit: 0 },
                    ]);
                } else {
                    setJournals(journalsData);
                }

                setRecentEntries(entriesData.slice(0, 10));
            }
        } catch (error) {
            console.error("Failed to fetch data:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredEntries = recentEntries.filter(
        (entry) =>
            entry.entry_number?.toLowerCase().includes(search.toLowerCase()) ||
            entry.description?.toLowerCase().includes(search.toLowerCase())
    );

    const downloadFec = async () => {
        const token = localStorage.getItem("seka_access_token");
        if (!token) return;

        setExportingFec(true);
        try {
            const response = await fetch(`${apiPrefix}/accounting-entries/entries/export/fec`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const detailText = await response.text().catch(() => "");
                alert(detailText || "Impossible d'exporter le FEC");
                return;
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `FEC_${new Date().toISOString().slice(0, 10)}.txt`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch {
            alert("Impossible d'exporter le FEC");
        } finally {
            setExportingFec(false);
        }
    };

    return (
        <>
            <Head>
                <title>Journaux comptables - SEKA</title>
            </Head>

            <div className="min-h-screen bg-gray-50 pt-14">
                <main className="p-6">
                    <div className="max-w-7xl mx-auto">
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-100 rounded-lg">
                                    <BookOpen className="h-6 w-6 text-indigo-600" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">Journaux comptables</h1>
                                    <p className="text-sm text-gray-500">Gérez vos journaux et écritures comptables</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm disabled:opacity-50"
                                    onClick={downloadFec}
                                    disabled={exportingFec}
                                >
                                    <Download className="h-4 w-4" />
                                    {exportingFec ? "Export..." : "Exporter FEC"}
                                </button>
                                <Link
                                    href="/accounting/entries/new"
                                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                                >
                                    <Plus className="h-4 w-4" />
                                    Nouvelle écriture
                                </Link>
                            </div>
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
                            </div>
                        ) : (
                            <>
                                {/* Journal Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                                    {journals.map((journal) => (
                                        <Link
                                            key={journal.id}
                                            href={`/accounting/journals/${journal.type}`}
                                            className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-all group"
                                        >
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 ${journalColors[journal.type] || "bg-gray-500"} rounded-lg flex items-center justify-center text-white font-bold`}>
                                                        {journal.code}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                                                            {journal.name || journalLabels[journal.type]}
                                                        </h3>
                                                        <p className="text-xs text-gray-500">{journal.entries_count || 0} écritures</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <p className="text-gray-500 text-xs">Total Débit</p>
                                                    <p className="font-semibold text-gray-900">
                                                        {journal.total_debit ? journal.total_debit.toLocaleString() : "-"}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500 text-xs">Total Crédit</p>
                                                    <p className="font-semibold text-gray-900">
                                                        {journal.total_credit ? journal.total_credit.toLocaleString() : "-"}
                                                    </p>
                                                </div>
                                            </div>
                                            {journal.last_entry_date && (
                                                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-500">
                                                    <Clock className="h-3 w-3" />
                                                    Dernière écriture: {new Date(journal.last_entry_date).toLocaleDateString()}
                                                </div>
                                            )}
                                        </Link>
                                    ))}

                                    {/* Add Journal Card */}
                                    <button className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 p-5 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all flex flex-col items-center justify-center min-h-[180px] text-gray-500 hover:text-indigo-600">
                                        <Plus className="h-8 w-8 mb-2" />
                                        <span className="font-medium">Créer un journal</span>
                                    </button>
                                </div>

                                {/* Recent Entries */}
                                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                    <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                                        <h2 className="font-semibold text-gray-900">Dernières écritures</h2>
                                        <div className="flex items-center gap-2">
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                <input
                                                    type="text"
                                                    value={search}
                                                    onChange={(e) => setSearch(e.target.value)}
                                                    placeholder="Rechercher..."
                                                    className="pl-9 pr-4 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                                />
                                            </div>
                                            <button className="p-2 hover:bg-gray-100 rounded-lg">
                                                <Filter className="h-4 w-4 text-gray-500" />
                                            </button>
                                        </div>
                                    </div>
                                    {filteredEntries.length === 0 ? (
                                        <div className="text-center py-12">
                                            <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune écriture</h3>
                                            <p className="text-gray-500 mb-4">Commencez par créer votre première écriture comptable</p>
                                            <Link
                                                href="/accounting/entries/new"
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                                            >
                                                <Plus className="h-4 w-4" />
                                                Nouvelle écriture
                                            </Link>
                                        </div>
                                    ) : (
                                        <table className="w-full">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                                                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Référence</th>
                                                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Description</th>
                                                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Débit</th>
                                                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Crédit</th>
                                                    <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Statut</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {filteredEntries.map((entry) => (
                                                    <tr key={entry.id} className="hover:bg-gray-50">
                                                        <td className="px-6 py-4 text-sm text-gray-600">
                                                            {new Date(entry.date).toLocaleDateString()}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="text-sm font-mono text-indigo-600">{entry.entry_number}</span>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-gray-900">{entry.description}</td>
                                                        <td className="px-6 py-4 text-sm text-right font-medium">
                                                            {entry.amount > 0 ? entry.amount.toLocaleString() : "-"}
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-right font-medium">
                                                            {entry.amount > 0 ? entry.amount.toLocaleString() : "-"}
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                                                                <CheckCircle className="h-3 w-3" />
                                                                Validé
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                    {filteredEntries.length > 0 && (
                                        <div className="px-6 py-4 border-t border-gray-200 text-center">
                                            <Link href="/accounting/entries" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                                                Voir toutes les écritures
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </main>
            </div>
        </>
    );
}
