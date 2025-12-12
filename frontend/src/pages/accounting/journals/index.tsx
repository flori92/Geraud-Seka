import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import {
    BookOpen, Plus, Search, Filter, Download, Calendar,
    FileText, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle
} from "lucide-react";

interface JournalEntry {
    id: string;
    date: string;
    reference: string;
    description: string;
    debit: number;
    credit: number;
    status: "validated" | "pending";
}

interface Journal {
    id: string;
    code: string;
    name: string;
    type: "purchases" | "sales" | "bank" | "cash" | "misc";
    entriesCount: number;
    lastEntry: string;
    totalDebit: number;
    totalCredit: number;
    color: string;
}

const journals: Journal[] = [
    { id: "1", code: "AC", name: "Journal des Achats", type: "purchases", entriesCount: 245, lastEntry: "12/12/2024", totalDebit: 15420000, totalCredit: 0, color: "bg-blue-500" },
    { id: "2", code: "VE", name: "Journal des Ventes", type: "sales", entriesCount: 189, lastEntry: "12/12/2024", totalDebit: 0, totalCredit: 28750000, color: "bg-green-500" },
    { id: "3", code: "BQ", name: "Journal de Banque", type: "bank", entriesCount: 512, lastEntry: "12/12/2024", totalDebit: 45200000, totalCredit: 42800000, color: "bg-purple-500" },
    { id: "4", code: "CA", name: "Journal de Caisse", type: "cash", entriesCount: 78, lastEntry: "10/12/2024", totalDebit: 2500000, totalCredit: 2350000, color: "bg-orange-500" },
    { id: "5", code: "OD", name: "Journal des OD", type: "misc", entriesCount: 34, lastEntry: "08/12/2024", totalDebit: 5600000, totalCredit: 5600000, color: "bg-gray-500" },
];

const recentEntries: JournalEntry[] = [
    { id: "1", date: "12/12/2024", reference: "AC-2024-0245", description: "Facture Orange Business", debit: 125000, credit: 0, status: "validated" },
    { id: "2", date: "12/12/2024", reference: "VE-2024-0189", description: "Facture client ACME Corp", debit: 0, credit: 850000, status: "pending" },
    { id: "3", date: "11/12/2024", reference: "BQ-2024-0512", description: "Virement salaires", debit: 0, credit: 4500000, status: "validated" },
    { id: "4", date: "11/12/2024", reference: "AC-2024-0244", description: "Fournitures de bureau", debit: 45000, credit: 0, status: "validated" },
];

export default function JournalsPage() {
    const [search, setSearch] = useState("");

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
                                <button className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm">
                                    <Download className="h-4 w-4" />
                                    Exporter FEC
                                </button>
                                <Link
                                    href="/accounting/entries/new"
                                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                                >
                                    <Plus className="h-4 w-4" />
                                    Nouvelle écriture
                                </Link>
                            </div>
                        </div>

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
                                            <div className={`w-10 h-10 ${journal.color} rounded-lg flex items-center justify-center text-white font-bold`}>
                                                {journal.code}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                                                    {journal.name}
                                                </h3>
                                                <p className="text-xs text-gray-500">{journal.entriesCount} écritures</p>
                                            </div>
                                        </div>
                                        <ArrowUpRight className="h-4 w-4 text-gray-400 group-hover:text-indigo-600 transition-colors" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p className="text-gray-500 text-xs">Total Débit</p>
                                            <p className="font-semibold text-gray-900">
                                                {journal.totalDebit > 0 ? journal.totalDebit.toLocaleString() : "-"}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500 text-xs">Total Crédit</p>
                                            <p className="font-semibold text-gray-900">
                                                {journal.totalCredit > 0 ? journal.totalCredit.toLocaleString() : "-"}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-500">
                                        <Clock className="h-3 w-3" />
                                        Dernière écriture: {journal.lastEntry}
                                    </div>
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
                                    {recentEntries.map((entry) => (
                                        <tr key={entry.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 text-sm text-gray-600">{entry.date}</td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-mono text-indigo-600">{entry.reference}</span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900">{entry.description}</td>
                                            <td className="px-6 py-4 text-sm text-right font-medium">
                                                {entry.debit > 0 ? entry.debit.toLocaleString() : "-"}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-right font-medium">
                                                {entry.credit > 0 ? entry.credit.toLocaleString() : "-"}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {entry.status === "validated" ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                                                        <CheckCircle className="h-3 w-3" />
                                                        Validé
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full">
                                                        <Clock className="h-3 w-3" />
                                                        En attente
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="px-6 py-4 border-t border-gray-200 text-center">
                                <Link href="/accounting/entries" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                                    Voir toutes les écritures
                                </Link>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}
