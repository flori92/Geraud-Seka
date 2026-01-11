/**
 * Page Factures En Attente - Avec filtres, statuts visuels et validation lot
 * Conforme au cahier des charges client
 */
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { 
    FileText, Filter, Search, CheckSquare, Square, 
    AlertCircle, Clock, CheckCircle, Eye, Trash2,
    Building, Calendar, DollarSign, Hash
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

type DocumentStatus = "pending" | "pre_processed" | "validated" | "rejected";

interface Document {
    id: string;
    original_filename: string;
    supplier_name?: string;
    document_date?: string;
    amount_ttc?: number;
    reference_number?: string;
    status: DocumentStatus;
    has_supplier_rule: boolean;
    ocr_confidence?: number;
}

export default function FacturesEnAttentePage() {
    const router = useRouter();
    const [documents, setDocuments] = useState<Document[]>([]);
    const [filteredDocs, setFilteredDocs] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Filters
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | DocumentStatus>("all");
    const [supplierFilter, setSupplierFilter] = useState<"all" | "with_rule" | "without_rule">("all");
    
    // Selection for batch validation
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [selectAll, setSelectAll] = useState(false);

    useEffect(() => {
        fetchDocuments();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [documents, searchTerm, statusFilter, supplierFilter]);

    const fetchDocuments = async () => {
        const token = localStorage.getItem("seka_access_token");
        if (!token) {
            router.push("/login");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/documents?status=pending,pre_processed`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setDocuments(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error("Error fetching documents:", error);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...documents];

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(doc =>
                doc.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                doc.reference_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                doc.original_filename?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Status filter
        if (statusFilter !== "all") {
            filtered = filtered.filter(doc => doc.status === statusFilter);
        }

        // Supplier rule filter
        if (supplierFilter === "with_rule") {
            filtered = filtered.filter(doc => doc.has_supplier_rule);
        } else if (supplierFilter === "without_rule") {
            filtered = filtered.filter(doc => !doc.has_supplier_rule);
        }

        setFilteredDocs(filtered);
    };

    const getStatusBadge = (status: DocumentStatus, hasRule: boolean) => {
        if (status === "validated") {
            return {
                icon: CheckCircle,
                label: "Validée",
                color: "bg-green-100 text-green-800 border-green-200",
                emoji: "🟢"
            };
        } else if (status === "rejected") {
            return {
                icon: Trash2,
                label: "Rejetée",
                color: "bg-red-100 text-red-800 border-red-200",
                emoji: "🔴"
            };
        } else if (status === "pre_processed" && hasRule) {
            return {
                icon: Clock,
                label: "Pré-traitée",
                color: "bg-yellow-100 text-yellow-800 border-yellow-200",
                emoji: "🟡"
            };
        } else {
            return {
                icon: AlertCircle,
                label: "À traiter",
                color: "bg-red-100 text-red-800 border-red-200",
                emoji: "🔴"
            };
        }
    };

    const toggleSelection = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const toggleSelectAll = () => {
        if (selectAll) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredDocs.map(d => d.id)));
        }
        setSelectAll(!selectAll);
    };

    const handleBatchValidate = async () => {
        if (selectedIds.size === 0) {
            alert("Aucune facture sélectionnée");
            return;
        }

        if (!confirm(`Valider ${selectedIds.size} facture(s) ?`)) return;

        const token = localStorage.getItem("seka_access_token");
        try {
            await Promise.all(
                Array.from(selectedIds).map(id =>
                    fetch(`${API_BASE_URL}/api/v1/documents/${id}/validate`, {
                        method: "POST",
                        headers: { 
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json"
                        }
                    })
                )
            );

            alert(`${selectedIds.size} facture(s) validée(s) !`);
            setSelectedIds(new Set());
            fetchDocuments();
        } catch (error) {
            console.error("Error batch validating:", error);
            alert("Erreur lors de la validation en lot");
        }
    };

    const stats = {
        total: documents.length,
        aTraiter: documents.filter(d => !d.has_supplier_rule).length,
        preTraitees: documents.filter(d => d.has_supplier_rule && d.status !== "validated").length,
        validees: documents.filter(d => d.status === "validated").length
    };

    return (
        <>
            <Head>
                <title>Factures en Attente - SEKA</title>
            </Head>

            <div className="min-h-screen bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header */}
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <FileText className="h-6 w-6 text-[#1e3a5f]" />
                            FACTURES EN ATTENTE
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Validez les factures extraites par OCR
                        </p>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-4 gap-4 mb-6">
                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Total</p>
                                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                                </div>
                                <FileText className="h-8 w-8 text-gray-400" />
                            </div>
                        </div>
                        <div className="bg-white rounded-lg border border-red-200 p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-red-600">🔴 À traiter</p>
                                    <p className="text-2xl font-bold text-red-700">{stats.aTraiter}</p>
                                </div>
                                <AlertCircle className="h-8 w-8 text-red-400" />
                            </div>
                        </div>
                        <div className="bg-white rounded-lg border border-yellow-200 p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-yellow-600">🟡 Pré-traitées</p>
                                    <p className="text-2xl font-bold text-yellow-700">{stats.preTraitees}</p>
                                </div>
                                <Clock className="h-8 w-8 text-yellow-400" />
                            </div>
                        </div>
                        <div className="bg-white rounded-lg border border-green-200 p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-green-600">🟢 Validées</p>
                                    <p className="text-2xl font-bold text-green-700">{stats.validees}</p>
                                </div>
                                <CheckCircle className="h-8 w-8 text-green-400" />
                            </div>
                        </div>
                    </div>

                    {/* Filters Bar */}
                    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
                        <div className="flex items-center gap-4">
                            {/* Search */}
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Rechercher fournisseur, référence..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent"
                                />
                            </div>

                            {/* Status Filter */}
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as any)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f]"
                            >
                                <option value="all">Tous les statuts</option>
                                <option value="pending">🔴 À traiter</option>
                                <option value="pre_processed">🟡 Pré-traitées</option>
                                <option value="validated">🟢 Validées</option>
                            </select>

                            {/* Supplier Rule Filter */}
                            <select
                                value={supplierFilter}
                                onChange={(e) => setSupplierFilter(e.target.value as any)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f]"
                            >
                                <option value="all">Tous les fournisseurs</option>
                                <option value="without_rule">Fournisseur non défini</option>
                                <option value="with_rule">Règle appliquée</option>
                            </select>
                        </div>
                    </div>

                    {/* Batch Actions */}
                    {selectedIds.size > 0 && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <CheckSquare className="h-5 w-5 text-blue-600" />
                                <span className="text-sm font-medium text-blue-900">
                                    {selectedIds.size} facture(s) sélectionnée(s)
                                </span>
                            </div>
                            <button
                                onClick={handleBatchValidate}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
                            >
                                Valider la sélection
                            </button>
                        </div>
                    )}

                    {/* Documents Table */}
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        {loading ? (
                            <div className="p-8 text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e3a5f] mx-auto mb-2"></div>
                                Chargement...
                            </div>
                        ) : filteredDocs.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <FileText className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                                <p className="font-medium">Aucune facture en attente</p>
                                <p className="text-sm mt-1">Uploadez des factures pour commencer</p>
                            </div>
                        ) : (
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left">
                                            <input
                                                type="checkbox"
                                                checked={selectAll}
                                                onChange={toggleSelectAll}
                                                className="rounded border-gray-300"
                                            />
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Statut
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Date
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Tiers
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            N° Facture
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Compte
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                            Montant TTC
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredDocs.map((doc) => {
                                        const statusBadge = getStatusBadge(doc.status, doc.has_supplier_rule);
                                        const StatusIcon = statusBadge.icon;

                                        return (
                                            <tr 
                                                key={doc.id} 
                                                className="hover:bg-gray-50 cursor-pointer"
                                                onClick={() => router.push(`/documents/${doc.id}/validate`)}
                                            >
                                                <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedIds.has(doc.id)}
                                                        onChange={() => toggleSelection(doc.id)}
                                                        className="rounded border-gray-300"
                                                    />
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusBadge.color}`}>
                                                        <StatusIcon className="h-3 w-3" />
                                                        {statusBadge.emoji} {statusBadge.label}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {doc.document_date ? new Date(doc.document_date).toLocaleDateString('fr-FR') : '-'}
                                                </td>
                                                <td className="px-6 py-4 text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <Building className="h-4 w-4 text-gray-400" />
                                                        <span className="font-medium text-gray-900">
                                                            {doc.supplier_name || "Non identifié"}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {doc.reference_number || '-'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {doc.has_supplier_rule ? (
                                                        <span className="text-green-600">✓ Règle appliquée</span>
                                                    ) : (
                                                        <span className="text-red-600">⚠ À définir</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                                                    {doc.amount_ttc ? `${doc.amount_ttc.toLocaleString('fr-FR')} FCFA` : '-'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            router.push(`/documents/${doc.id}/validate`);
                                                        }}
                                                        className="text-blue-600 hover:text-blue-900"
                                                        title="Voir et valider"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}

                        {/* Footer */}
                        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                            <p className="text-sm text-gray-500">
                                {filteredDocs.length} facture(s) affichée(s) sur {documents.length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
