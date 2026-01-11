/**
 * Page Historique des Exports
 * Liste des exports précédents avec possibilité de re-télécharger
 */
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { 
    Download, Calendar, FileText, Eye, History, Filter
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

interface ExportHistory {
    id: string;
    format: "perfecto" | "saari" | "sage";
    period_start: string;
    period_end: string;
    created_at: string;
    file_size?: number;
    entries_count: number;
    invoices_count: number;
    created_by?: string;
    status: "completed" | "failed";
}

export default function HistoriqueExportsPage() {
    const router = useRouter();
    const [exports, setExports] = useState<ExportHistory[]>([]);
    const [filteredExports, setFilteredExports] = useState<ExportHistory[]>([]);
    const [loading, setLoading] = useState(true);
    const [formatFilter, setFormatFilter] = useState("all");
    const [dateFilter, setDateFilter] = useState({ start: "", end: "" });

    useEffect(() => {
        fetchExports();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [exports, formatFilter, dateFilter]);

    const fetchExports = async () => {
        const token = localStorage.getItem("seka_access_token");
        if (!token) {
            router.push("/login");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/exports/history`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setExports(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error("Error fetching export history:", error);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...exports];

        if (formatFilter !== "all") {
            filtered = filtered.filter(e => e.format === formatFilter);
        }

        if (dateFilter.start) {
            filtered = filtered.filter(e => e.created_at >= dateFilter.start);
        }

        if (dateFilter.end) {
            filtered = filtered.filter(e => e.created_at <= dateFilter.end);
        }

        setFilteredExports(filtered);
    };

    const handleDownload = async (exportId: string, format: string) => {
        const token = localStorage.getItem("seka_access_token");
        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/exports/${exportId}/download`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!response.ok) throw new Error("Erreur lors du téléchargement");

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `export_${format}_${new Date().toISOString().split("T")[0]}.${format === "perfecto" ? "txt" : "csv"}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error("Download error:", error);
            alert("Erreur lors du téléchargement");
        }
    };

    const getFormatBadge = (format: string) => {
        const badges = {
            perfecto: "bg-blue-100 text-blue-800",
            saari: "bg-green-100 text-green-800",
            sage: "bg-purple-100 text-purple-800"
        };
        return badges[format as keyof typeof badges] || "bg-gray-100 text-gray-800";
    };

    const formatFileSize = (bytes?: number) => {
        if (!bytes) return "N/A";
        const kb = bytes / 1024;
        if (kb < 1024) return `${kb.toFixed(1)} KB`;
        return `${(kb / 1024).toFixed(1)} MB`;
    };

    const stats = {
        total: exports.length,
        thisMonth: exports.filter(e => {
            const date = new Date(e.created_at);
            const now = new Date();
            return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
        }).length,
        perfecto: exports.filter(e => e.format === "perfecto").length,
        totalEntries: exports.reduce((sum, e) => sum + e.entries_count, 0)
    };

    return (
        <>
            <Head>
                <title>Historique des Exports - SEKA</title>
            </Head>

            <div className="min-h-screen bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header */}
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <History className="h-6 w-6 text-[#1e3a5f]" />
                            HISTORIQUE DES EXPORTS
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Consultez et re-téléchargez vos exports précédents
                        </p>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-4 gap-4 mb-6">
                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Total exports</p>
                                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                                </div>
                                <FileText className="h-8 w-8 text-gray-400" />
                            </div>
                        </div>
                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Ce mois</p>
                                    <p className="text-2xl font-bold text-gray-900">{stats.thisMonth}</p>
                                </div>
                                <Calendar className="h-8 w-8 text-blue-400" />
                            </div>
                        </div>
                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Format Perfecto</p>
                                    <p className="text-2xl font-bold text-gray-900">{stats.perfecto}</p>
                                </div>
                                <Download className="h-8 w-8 text-green-400" />
                            </div>
                        </div>
                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Écritures</p>
                                    <p className="text-2xl font-bold text-gray-900">{stats.totalEntries}</p>
                                </div>
                                <FileText className="h-8 w-8 text-purple-400" />
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Filter className="h-4 w-4 text-gray-400" />
                                <span className="text-sm font-medium text-gray-700">Filtres:</span>
                            </div>

                            <select
                                value={formatFilter}
                                onChange={(e) => setFormatFilter(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f]"
                            >
                                <option value="all">Tous les formats</option>
                                <option value="perfecto">Perfecto</option>
                                <option value="saari">SAARI</option>
                                <option value="sage">Sage</option>
                            </select>

                            <input
                                type="date"
                                value={dateFilter.start}
                                onChange={(e) => setDateFilter({...dateFilter, start: e.target.value})}
                                className="px-3 py-2 border border-gray-300 rounded-lg"
                                placeholder="Date début"
                            />

                            <input
                                type="date"
                                value={dateFilter.end}
                                onChange={(e) => setDateFilter({...dateFilter, end: e.target.value})}
                                className="px-3 py-2 border border-gray-300 rounded-lg"
                                placeholder="Date fin"
                            />
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        {loading ? (
                            <div className="p-8 text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e3a5f] mx-auto mb-2"></div>
                                Chargement...
                            </div>
                        ) : filteredExports.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <History className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                                <p className="font-medium">Aucun export</p>
                                <p className="text-sm mt-1">Vos exports apparaîtront ici</p>
                            </div>
                        ) : (
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Date
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Format
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Période
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Écritures
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Factures
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Taille
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredExports.map((exp) => (
                                        <tr key={exp.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {new Date(exp.created_at).toLocaleDateString('fr-FR')}
                                                <div className="text-xs text-gray-500">
                                                    {new Date(exp.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getFormatBadge(exp.format)}`}>
                                                    {exp.format.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(exp.period_start).toLocaleDateString('fr-FR')} - {new Date(exp.period_end).toLocaleDateString('fr-FR')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {exp.entries_count}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {exp.invoices_count}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {formatFileSize(exp.file_size)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                                <button
                                                    onClick={() => handleDownload(exp.id, exp.format)}
                                                    className="text-blue-600 hover:text-blue-900 inline-flex items-center gap-1"
                                                    title="Télécharger"
                                                >
                                                    <Download className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                            <p className="text-sm text-gray-500">
                                {filteredExports.length} export(s) affiché(s)
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
