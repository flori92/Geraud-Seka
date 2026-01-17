/**
 * Page de gestion des doublons
 * Liste des doublons en attente + Historique
 */
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { AlertCircle, CheckCircle, Clock, Eye, History as HistoryIcon } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";
import DuplicateConfrontationModal from "@/components/duplicates/DuplicateConfrontationModal";

interface Duplicate {
    id: string;
    detection_reason: string;
    created_at: string;
    new_document: any;
    existing_document: any;
    comparison: any;
}

interface HistoryItem {
    id: string;
    detection_reason: string;
    resolution: string;
    resolution_reason: string | null;
    resolved_at: string;
    resolved_by_name: string | null;
    new_document: any;
    existing_document: any;
}

export default function DuplicatesPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<"pending" | "history">("pending");
    const [pendingDuplicates, setPendingDuplicates] = useState<Duplicate[]>([]);
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDuplicate, setSelectedDuplicate] = useState<Duplicate | null>(null);

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        const token = localStorage.getItem("seka_access_token");
        if (!token) {
            router.push("/login");
            return;
        }

        setLoading(true);
        try {
            if (activeTab === "pending") {
                const response = await fetch(`${API_BASE_URL}/api/v1/duplicates/pending`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setPendingDuplicates(data.duplicates || []);
                }
            } else {
                const response = await fetch(`${API_BASE_URL}/api/v1/duplicates/history`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setHistory(data.history || []);
                }
            }
        } catch (error) {
            console.error("Error fetching duplicates:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleResolve = async (duplicateId: string, resolution: string, reason?: string) => {
        const token = localStorage.getItem("seka_access_token");

        try {
            const response = await fetch(
                `${API_BASE_URL}/api/v1/duplicates/${duplicateId}/resolve`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        resolution,
                        resolution_reason: reason
                    })
                }
            );

            if (!response.ok) {
                throw new Error("Failed to resolve duplicate");
            }

            // Refresh data
            await fetchData();
            setSelectedDuplicate(null);
        } catch (error) {
            console.error("Error resolving duplicate:", error);
            throw error;
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    const formatCurrency = (amount: number | null) => {
        if (!amount) return "-";
        return new Intl.NumberFormat("fr-FR", {
            style: "currency",
            currency: "XOF",
            minimumFractionDigits: 0
        }).format(amount);
    };

    const getReasonLabel = (reason: string) => {
        const labels: Record<string, string> = {
            same_invoice_number: "Même N° facture",
            same_amount_date: "Même montant + date"
        };
        return labels[reason] || reason;
    };

    const getResolutionLabel = (resolution: string) => {
        const labels: Record<string, { label: string; color: string }> = {
            rejected: { label: "Rejeté", color: "text-red-700 bg-red-100" },
            kept_both: { label: "Conservés", color: "text-blue-700 bg-blue-100" },
            replaced: { label: "Remplacé", color: "text-green-700 bg-green-100" }
        };
        return labels[resolution] || { label: resolution, color: "text-gray-700 bg-gray-100" };
    };

    return (
        <>
            <Head>
                <title>Gestion des Doublons - SEKA</title>
            </Head>

            <div className="min-h-screen bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header */}
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <AlertCircle className="h-6 w-6 text-[#1e3a5f]" />
                            Gestion des Doublons
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Détection et résolution des factures en doublon
                        </p>
                    </div>

                    {/* Tabs */}
                    <div className="mb-6 border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8">
                            <button
                                onClick={() => setActiveTab("pending")}
                                className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === "pending"
                                        ? "border-[#1e3a5f] text-[#1e3a5f]"
                                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    En attente
                                    {pendingDuplicates.length > 0 && (
                                        <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-semibold">
                                            {pendingDuplicates.length}
                                        </span>
                                    )}
                                </div>
                            </button>
                            <button
                                onClick={() => setActiveTab("history")}
                                className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === "history"
                                        ? "border-[#1e3a5f] text-[#1e3a5f]"
                                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <HistoryIcon className="w-4 h-4" />
                                    Historique
                                </div>
                            </button>
                        </nav>
                    </div>

                    {/* Content */}
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e3a5f]"></div>
                        </div>
                    ) : activeTab === "pending" ? (
                        /* Pending Duplicates */
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                            {pendingDuplicates.length === 0 ? (
                                <div className="p-12 text-center">
                                    <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                                        Aucun doublon en attente
                                    </h3>
                                    <p className="text-gray-500">
                                        Tous les doublons ont été traités
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                    Date détection
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                    Fournisseur
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                    N° Facture
                                                </th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                                    Montant
                                                </th>
                                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                                    Raison
                                                </th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                                    Action
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {pendingDuplicates.map((dup) => (
                                                <tr key={dup.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {formatDate(dup.created_at)}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                                        {dup.new_document.supplier_name}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm font-mono text-gray-700">
                                                        {dup.new_document.reference_number || "-"}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                                                        {formatCurrency(dup.new_document.amount_ttc)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                            {getReasonLabel(dup.detection_reason)}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                                        <button
                                                            onClick={() => setSelectedDuplicate(dup)}
                                                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#172e4d] text-sm font-medium"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                            Traiter
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* History */
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                            {history.length === 0 ? (
                                <div className="p-12 text-center">
                                    <HistoryIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                                        Aucun historique
                                    </h3>
                                    <p className="text-gray-500">
                                        Aucun doublon n'a encore été traité
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                    Date résolution
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                    Facture
                                                </th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                                    Montant
                                                </th>
                                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                                    Résolution
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                    Par
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {history.map((item) => {
                                                const resolutionInfo = getResolutionLabel(item.resolution);
                                                return (
                                                    <tr key={item.id} className="hover:bg-gray-50">
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {formatDate(item.resolved_at)}
                                                        </td>
                                                        <td className="px-6 py-4 text-sm">
                                                            <div className="font-medium text-gray-900">
                                                                {item.new_document.supplier_name}
                                                            </div>
                                                            <div className="text-xs text-gray-500 font-mono">
                                                                {item.new_document.reference_number || "-"}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                                                            {formatCurrency(item.new_document.amount_ttc)}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${resolutionInfo.color}`}>
                                                                {resolutionInfo.label}
                                                            </span>
                                                            {item.resolution_reason && (
                                                                <div className="text-xs text-gray-500 mt-1">
                                                                    {item.resolution_reason}
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {item.resolved_by_name || "-"}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Confrontation Modal */}
            {selectedDuplicate && (
                <DuplicateConfrontationModal
                    duplicate={selectedDuplicate}
                    onClose={() => setSelectedDuplicate(null)}
                    onResolve={handleResolve}
                />
            )}
        </>
    );
}
