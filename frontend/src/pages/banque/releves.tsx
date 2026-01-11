/**
 * Page Relevés Importés
 * Historique des relevés bancaires uploadés
 */
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { FileText, Calendar, CheckCircle, Clock, Eye, Download } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

interface BankStatement {
    id: string;
    filename: string;
    bank_name?: string;
    period_start: string;
    period_end: string;
    total_lines: number;
    matched_lines: number;
    uploaded_at: string;
    status: "completed" | "in_progress";
}

export default function RelevesPage() {
    const router = useRouter();
    const [statements, setStatements] = useState<BankStatement[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStatements();
    }, []);

    const fetchStatements = async () => {
        const token = localStorage.getItem("seka_access_token");
        if (!token) {
            router.push("/login");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/bank/statements`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setStatements(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error("Error fetching statements:", error);
        } finally {
            setLoading(false);
        }
    };

    const stats = {
        total: statements.length,
        completed: statements.filter(s => s.status === "completed").length,
        inProgress: statements.filter(s => s.status === "in_progress").length,
        totalMatched: statements.reduce((sum, s) => sum + s.matched_lines, 0),
        totalLines: statements.reduce((sum, s) => sum + s.total_lines, 0)
    };

    const matchPercentage = stats.totalLines > 0 
        ? Math.round((stats.totalMatched / stats.totalLines) * 100) 
        : 0;

    return (
        <>
            <Head>
                <title>Relevés Importés - SEKA</title>
            </Head>

            <div className="min-h-screen bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header */}
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <FileText className="h-6 w-6 text-[#1e3a5f]" />
                            RELEVÉS IMPORTÉS
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Historique des relevés bancaires uploadés et rapprochés
                        </p>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-4 gap-4 mb-6">
                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Relevés</p>
                                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                                </div>
                                <FileText className="h-8 w-8 text-gray-400" />
                            </div>
                        </div>
                        <div className="bg-white rounded-lg border border-green-200 p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-green-600">Terminés</p>
                                    <p className="text-2xl font-bold text-green-700">{stats.completed}</p>
                                </div>
                                <CheckCircle className="h-8 w-8 text-green-400" />
                            </div>
                        </div>
                        <div className="bg-white rounded-lg border border-orange-200 p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-orange-600">En cours</p>
                                    <p className="text-2xl font-bold text-orange-700">{stats.inProgress}</p>
                                </div>
                                <Clock className="h-8 w-8 text-orange-400" />
                            </div>
                        </div>
                        <div className="bg-white rounded-lg border border-blue-200 p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-blue-600">Taux rapprochement</p>
                                    <p className="text-2xl font-bold text-blue-700">{matchPercentage}%</p>
                                </div>
                                <CheckCircle className="h-8 w-8 text-blue-400" />
                            </div>
                        </div>
                    </div>

                    {/* Statements Table */}
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        {loading ? (
                            <div className="p-8 text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e3a5f] mx-auto mb-2"></div>
                                Chargement...
                            </div>
                        ) : statements.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <FileText className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                                <p className="font-medium">Aucun relevé importé</p>
                                <p className="text-sm mt-1">Uploadez votre premier relevé bancaire</p>
                                <button
                                    onClick={() => router.push('/banque/rapprochement')}
                                    className="mt-4 px-4 py-2 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#172e4d]"
                                >
                                    Importer un relevé
                                </button>
                            </div>
                        ) : (
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Fichier
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Période
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Lignes
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Rapprochées
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Statut
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {statements.map((statement) => (
                                        <tr key={statement.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">{statement.filename}</div>
                                                    {statement.bank_name && (
                                                        <div className="text-xs text-gray-500">{statement.bank_name}</div>
                                                    )}
                                                    <div className="text-xs text-gray-500">
                                                        {new Date(statement.uploaded_at).toLocaleDateString('fr-FR')}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(statement.period_start).toLocaleDateString('fr-FR')} - {new Date(statement.period_end).toLocaleDateString('fr-FR')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {statement.total_lines}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-gray-900">{statement.matched_lines}</span>
                                                    <span className="text-gray-500">
                                                        ({Math.round((statement.matched_lines / statement.total_lines) * 100)}%)
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {statement.status === "completed" ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        <CheckCircle className="h-3 w-3 mr-1" />
                                                        Terminé
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                                        <Clock className="h-3 w-3 mr-1" />
                                                        En cours
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                                <button
                                                    onClick={() => router.push(`/banque/rapprochement?statement=${statement.id}`)}
                                                    className="text-blue-600 hover:text-blue-900 mr-3"
                                                    title="Voir détails"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                            <p className="text-sm text-gray-500">
                                {statements.length} relevé(s) importé(s)
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
