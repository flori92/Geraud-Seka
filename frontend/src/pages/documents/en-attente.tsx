import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { 
    FileText, Filter, Search, CheckSquare, Square, 
    AlertCircle, Clock, CheckCircle, Eye, Trash2,
    MoreVertical, Download, Upload, Loader2, ChevronRight, CheckCheck,
    Zap, X
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api";
import { getPendingDocuments, deleteDocument, type Document } from "@/lib/api";

type TabFilter = 'all' | 'uploaded' | 'ocr_processing' | 'ocr_completed';

interface DocumentStats {
    total: number;
    uploaded: number;
    processing: number;
    completed: number;
}

export default function DocumentsEnAttentePage() {
    const router = useRouter();
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabFilter>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isValidating, setIsValidating] = useState(false);
    const [showBatchModal, setShowBatchModal] = useState(false);
    const [batchPreview, setBatchPreview] = useState<any>(null);
    const [loadingPreview, setLoadingPreview] = useState(false);

    useEffect(() => {
        fetchDocuments();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchDocuments = async () => {
        const token = localStorage.getItem("seka_access_token");
        if (!token) {
            router.push("/login");
            return;
        }

        setLoading(true);
        try {
            const docs = await getPendingDocuments(token);
            setDocuments(docs);
        } catch (error) {
            console.error("Error fetching pending documents:", error);
        } finally {
            setLoading(false);
        }
    };

    const getStats = (): DocumentStats => {
        return {
            total: documents.length,
            uploaded: documents.filter(d => d.status === 'UPLOADED').length,
            processing: documents.filter(d => d.status === 'OCR_PROCESSING').length,
            completed: documents.filter(d => d.status === 'OCR_COMPLETED').length,
        };
    };

    const stats = getStats();

    const filteredDocuments = documents.filter(doc => {
        if (activeTab === 'uploaded' && doc.status !== 'UPLOADED') return false;
        if (activeTab === 'ocr_processing' && doc.status !== 'OCR_PROCESSING') return false;
        if (activeTab === 'ocr_completed' && doc.status !== 'OCR_COMPLETED') return false;

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            const matchRef = doc.reference_number?.toLowerCase().includes(q);
            const matchSupplier = doc.supplier_name?.toLowerCase().includes(q);
            const matchFilename = doc.filename?.toLowerCase().includes(q);
            if (!matchRef && !matchSupplier && !matchFilename) return false;
        }

        return true;
    });

    const getStatusConfig = (status: string) => {
        const configs: Record<string, { label: string; color: string; icon: typeof Clock }> = {
            UPLOADED: { label: 'Uploadé', color: 'bg-gray-100 text-gray-700', icon: Upload },
            OCR_PROCESSING: { label: 'Traitement IA', color: 'bg-yellow-100 text-yellow-700', icon: Loader2 },
            OCR_COMPLETED: { label: 'Prêt à valider', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
        };
        return configs[status] || { label: status, color: 'bg-gray-100 text-gray-700', icon: Clock };
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatCurrency = (amount?: number) => {
        if (!amount) return '-';
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'XOF',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const handleBulkDelete = async () => {
        const token = localStorage.getItem("seka_access_token");
        if (!token || selectedDocs.length === 0) return;

        const confirmed = window.confirm(`Supprimer ${selectedDocs.length} document(s) ?`);
        if (!confirmed) return;

        setIsDeleting(true);
        const deletedIds: string[] = [];
        const errors: string[] = [];
        
        try {
            // Delete sequentially to avoid rate limiting (429)
            for (const id of selectedDocs) {
                try {
                    await deleteDocument(id, token);
                    deletedIds.push(id);
                } catch (err) {
                    errors.push(id);
                    console.error(`Failed to delete ${id}:`, err);
                }
                // Small delay between requests
                if (selectedDocs.indexOf(id) < selectedDocs.length - 1) {
                    await new Promise(r => setTimeout(r, 100));
                }
            }
            
            setDocuments(prev => prev.filter(doc => !deletedIds.includes(doc.id)));
            setSelectedDocs([]);
            
            if (errors.length > 0) {
                alert(`${deletedIds.length} document(s) supprimé(s), ${errors.length} échec(s)`);
            }
        } catch (error) {
            console.error("Error deleting documents:", error);
            alert("Erreur lors de la suppression");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleValidateAll = async () => {
        const token = localStorage.getItem("seka_access_token");
        if (!token) return;

        const docsToValidate = documents.filter(d => d.status === 'OCR_COMPLETED' || d.status === 'ocr_completed');
        if (docsToValidate.length === 0) {
            alert("Aucun document prêt à valider");
            return;
        }

        const confirmed = window.confirm(`Valider ${docsToValidate.length} document(s) prêts à être validés ?`);
        if (!confirmed) return;

        setIsValidating(true);
        let successCount = 0;
        let errorCount = 0;

        try {
            for (const doc of docsToValidate) {
                try {
                    const response = await fetch(`${API_BASE_URL}/api/v1/documents/${doc.id}/validate`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    if (response.ok) {
                        successCount++;
                    } else {
                        errorCount++;
                    }
                } catch (err) {
                    errorCount++;
                    console.error(`Failed to validate ${doc.id}:`, err);
                }
                await new Promise(r => setTimeout(r, 100));
            }

            if (successCount > 0) {
                setDocuments(prev => prev.filter(d => 
                    !(d.status === 'OCR_COMPLETED' || d.status === 'ocr_completed')
                ));
            }

            if (errorCount > 0) {
                alert(`${successCount} document(s) validé(s), ${errorCount} échec(s)`);
            } else {
                alert(`${successCount} document(s) validé(s) avec succès !`);
            }
        } catch (error) {
            console.error("Error validating documents:", error);
            alert("Erreur lors de la validation");
        } finally {
            setIsValidating(false);
        }
    };

    const handleAutoValidateClick = async () => {
        const token = localStorage.getItem("seka_access_token");
        if (!token) return;

        setLoadingPreview(true);
        setShowBatchModal(true);
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/batch-validation/preview?min_confidence=0.8`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            
            if (response.ok) {
                const data = await response.json();
                setBatchPreview(data);
            } else {
                alert("Erreur lors du chargement de la prévisualisation");
                setShowBatchModal(false);
            }
        } catch (err) {
            console.error("Preview error:", err);
            alert("Erreur lors du chargement");
            setShowBatchModal(false);
        } finally {
            setLoadingPreview(false);
        }
    };

    const handleConfirmBatchValidation = async () => {
        const token = localStorage.getItem("seka_access_token");
        if (!token) return;

        setIsValidating(true);
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/batch-validation/validate-all?min_confidence=0.8&only_auto_validable=true`, {
                method: "POST",
                headers: { 
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });
            
            if (response.ok) {
                const result = await response.json();
                alert(`✅ Validation terminée!\n\n✓ ${result.validated_count} validés\n✗ ${result.failed_count} échoués\n⏸ ${result.skipped_count} ignorés\n\nTemps: ${result.processing_time.toFixed(1)}s`);
                setShowBatchModal(false);
                fetchDocuments();
            } else {
                alert("Erreur lors de la validation automatique");
            }
        } catch (err) {
            console.error("Batch validation error:", err);
            alert("Erreur lors de la validation");
        } finally {
            setIsValidating(false);
        }
    };

    const tabOptions = [
        { id: 'all', label: 'Tous', count: stats.total },
        { id: 'uploaded', label: 'Uploadés', count: stats.uploaded },
        { id: 'ocr_processing', label: 'En traitement', count: stats.processing },
        { id: 'ocr_completed', label: 'Prêts à valider', count: stats.completed },
    ];

    return (
        <>
            <Head>
                <title>Documents en attente - SEKA</title>
            </Head>
            <div className="min-h-screen bg-gray-50">
                {/* Content */}
                <div>

                    <div className="bg-white border-b border-gray-200 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-xl font-semibold text-gray-900">Documents en attente</h1>
                                <p className="text-sm text-gray-600 mt-0.5">
                                    Documents à valider et comptabiliser
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                {stats.completed > 0 && (
                                    <>
                                        <button
                                            onClick={handleValidateAll}
                                            disabled={isValidating}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm font-medium disabled:opacity-50"
                                        >
                                            {isValidating ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <CheckCheck className="h-4 w-4" />
                                            )}
                                            {isValidating ? "Validation..." : `Valider tout (${stats.completed})`}
                                        </button>
                                        <button
                                            onClick={handleAutoValidateClick}
                                            disabled={isValidating || loadingPreview}
                                            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 flex items-center gap-2 text-sm font-medium disabled:opacity-50 shadow-lg"
                                        >
                                            <Zap className="h-4 w-4" />
                                            {loadingPreview ? "Chargement..." : "Validation intelligente"}
                                        </button>
                                    </>
                                )}
                                <button
                                    onClick={() => router.push('/documents/upload')}
                                    className="px-4 py-2 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#172e4d] flex items-center gap-2 text-sm font-medium"
                                >
                                    <Upload className="h-4 w-4" />
                                    Importer un document
                                </button>
                            </div>
                        </div>
                    </div>


                    <div className="px-6 py-6">
                        <div className="grid grid-cols-4 gap-4 mb-6">
                            <div className="bg-white rounded-lg border border-gray-200 p-5">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-gray-600">Total en attente</span>
                                    <Clock className="h-4 w-4 text-gray-500" />
                                </div>
                                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                            </div>

                            <div className="bg-white rounded-lg border border-gray-200 p-5">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-gray-600">Uploadés</span>
                                    <Upload className="h-4 w-4 text-gray-500" />
                                </div>
                                <p className="text-2xl font-bold text-gray-900">{stats.uploaded}</p>
                            </div>

                            <div className="bg-white rounded-lg border border-gray-200 p-5">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-gray-600">En traitement IA</span>
                                    <Loader2 className="h-4 w-4 text-yellow-500" />
                                </div>
                                <p className="text-2xl font-bold text-yellow-600">{stats.processing}</p>
                            </div>

                            <div className="bg-white rounded-lg border border-gray-200 p-5">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-gray-600">Prêts à valider</span>
                                    <CheckCircle className="h-4 w-4 text-blue-500" />
                                </div>
                                <p className="text-2xl font-bold text-blue-600">{stats.completed}</p>
                            </div>
                        </div>


                        <div className="bg-white rounded-lg border border-gray-200">

                            <div className="border-b border-gray-200">
                                <div className="flex items-center px-6">
                                    {tabOptions.map((tab) => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id as TabFilter)}
                                            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                                                ? 'border-[#1e3a5f] text-[#1e3a5f]'
                                                : 'border-transparent text-gray-600 hover:text-gray-900'
                                                }`}
                                        >
                                            {tab.label}
                                            {tab.count > 0 && (
                                                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700">
                                                    {tab.count}
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>


                            <div className="px-6 py-4 border-b border-gray-200">
                                <div className="flex items-center gap-3">
                                    <div className="flex-1 relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Rechercher un document..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent text-sm"
                                        />
                                    </div>
                                </div>
                            </div>


                            {selectedDocs.length > 0 && (
                                <div className="px-6 py-3 bg-blue-50 border-b border-blue-200 flex items-center justify-between">
                                    <span className="text-sm text-blue-900">
                                        {selectedDocs.length} document(s) sélectionné(s)
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={handleBulkDelete}
                                            className="px-3 py-1.5 text-sm bg-white border border-red-300 text-red-700 rounded hover:bg-red-50"
                                            disabled={isDeleting}
                                        >
                                            {isDeleting ? "Suppression..." : "Supprimer"}
                                        </button>
                                        <button
                                            onClick={() => setSelectedDocs([])}
                                            className="px-3 py-1.5 text-sm text-blue-700 hover:text-blue-900"
                                        >
                                            Annuler
                                        </button>
                                    </div>
                                </div>
                            )}


                            {loading ? (
                                <div className="p-12 text-center">
                                    <Loader2 className="h-8 w-8 animate-spin text-[#1e3a5f] mx-auto" />
                                    <p className="text-sm text-gray-600 mt-3">Chargement des documents...</p>
                                </div>
                            ) : filteredDocuments.length === 0 ? (
                                <div className="p-12 text-center">
                                    <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-600 mb-4">Aucun document en attente</p>
                                    <button
                                        onClick={() => router.push('/documents/upload')}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#172e4d]"
                                    >
                                        <Upload className="h-4 w-4" />
                                        Importer un document
                                    </button>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedDocs.length === filteredDocuments.length}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setSelectedDocs(filteredDocuments.map(d => d.id));
                                                            } else {
                                                                setSelectedDocs([]);
                                                            }
                                                        }}
                                                        className="rounded border-gray-300"
                                                    />
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Document
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Fournisseur/Client
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Date
                                                </th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Montant TTC
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Statut
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Type
                                                </th>
                                                <th className="px-6 py-3"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {filteredDocuments.map((doc) => {
                                                const statusConfig = getStatusConfig(doc.status);
                                                const StatusIcon = statusConfig.icon;
                                                const docType = doc.type === 'INVOICE_PURCHASE' ? 'Achat' :
                                                    doc.type === 'INVOICE_SALES' ? 'Vente' : '-';

                                                return (
                                                    <tr
                                                        key={doc.id}
                                                        className="hover:bg-gray-50 cursor-pointer"
                                                        onClick={() => router.push(`/documents/${doc.id}/validate`)}
                                                    >
                                                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedDocs.includes(doc.id)}
                                                                onChange={(e) => {
                                                                    if (e.target.checked) {
                                                                        setSelectedDocs([...selectedDocs, doc.id]);
                                                                    } else {
                                                                        setSelectedDocs(selectedDocs.filter(id => id !== doc.id));
                                                                    }
                                                                }}
                                                                className="rounded border-gray-300"
                                                            />
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center">
                                                                <FileText className="h-5 w-5 text-gray-400 mr-3" />
                                                                <div>
                                                                    <p className="text-sm font-medium text-gray-900">
                                                                        {doc.reference_number || doc.filename}
                                                                    </p>
                                                                    <p className="text-xs text-gray-500">{doc.filename}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className="text-sm text-gray-900">
                                                                {doc.supplier_name || doc.customer_name || '-'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                            {doc.date ? formatDate(doc.date) : formatDate(doc.created_at)}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                                            <span className="text-sm font-semibold text-gray-900">
                                                                {formatCurrency(doc.amount_ttc)}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center gap-2">
                                                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                                                                    <StatusIcon className={`h-3 w-3 ${doc.status === 'OCR_PROCESSING' ? 'animate-spin' : ''}`} />
                                                                    {statusConfig.label}
                                                                </span>
                                                                {doc.auto_validable && (
                                                                    <span 
                                                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 border border-purple-200"
                                                                        title={`Règle: ${doc.matched_rule_name || 'Règle active'}`}
                                                                    >
                                                                        <Zap className="h-3 w-3" />
                                                                        Auto
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${doc.type === 'INVOICE_PURCHASE' ? 'bg-orange-100 text-orange-700' :
                                                                doc.type === 'INVOICE_SALES' ? 'bg-green-100 text-green-700' :
                                                                    'bg-gray-100 text-gray-700'
                                                                }`}>
                                                                {docType}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                                            <ChevronRight className="h-5 w-5 text-gray-400" />
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal de validation intelligente */}
            {showBatchModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-2xl font-bold flex items-center gap-2">
                                        <Zap className="h-6 w-6" />
                                        Validation Intelligente
                                    </h2>
                                    <p className="text-purple-100 mt-2">
                                        Validation automatique basée sur vos règles comptables
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowBatchModal(false)}
                                    className="p-2 hover:bg-white/20 rounded-lg transition"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6">
                            {loadingPreview ? (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <Loader2 className="h-12 w-12 animate-spin text-purple-600 mb-4" />
                                    <p className="text-gray-600">Analyse des documents en cours...</p>
                                </div>
                            ) : batchPreview ? (
                                <>
                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                                            <div className="text-3xl font-bold text-blue-600 mb-1">
                                                {batchPreview.total_documents}
                                            </div>
                                            <div className="text-sm text-blue-800">Documents analysés</div>
                                        </div>
                                        <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                                            <div className="text-3xl font-bold text-green-600 mb-1">
                                                {batchPreview.eligible_documents}
                                            </div>
                                            <div className="text-sm text-green-800">Prêts à valider</div>
                                        </div>
                                        <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                                            <div className="text-3xl font-bold text-purple-600 mb-1">
                                                {batchPreview.documents_with_rules}
                                            </div>
                                            <div className="text-sm text-purple-800">Avec règles</div>
                                        </div>
                                        <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
                                            <div className="text-3xl font-bold text-amber-600 mb-1">
                                                {batchPreview.documents_without_rules}
                                            </div>
                                            <div className="text-sm text-amber-800">Sans règles</div>
                                        </div>
                                    </div>

                                    {batchPreview.rules_applied && batchPreview.rules_applied.length > 0 && (
                                        <div className="mb-6">
                                            <h3 className="font-semibold text-gray-900 mb-3">Règles appliquées</h3>
                                            <div className="space-y-2">
                                                {batchPreview.rules_applied.map((rule: any, idx: number) => (
                                                    <div key={idx} className="flex justify-between items-center bg-gray-50 rounded-lg p-3">
                                                        <span className="text-sm text-gray-700">{rule.rule_name}</span>
                                                        <span className="text-sm font-semibold text-purple-600">
                                                            {rule.document_count} doc(s)
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4 mb-6 border border-purple-100">
                                        <div className="flex items-start gap-3">
                                            <Zap className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">
                                                    {batchPreview.eligible_documents > 0 
                                                        ? `${batchPreview.eligible_documents} document(s) seront validés automatiquement`
                                                        : "Aucun document éligible pour la validation automatique"
                                                    }
                                                </p>
                                                {batchPreview.eligible_documents > 0 && (
                                                    <p className="text-xs text-gray-600 mt-1">
                                                        Temps estimé: ~{Math.ceil(batchPreview.estimated_time)} secondes
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {batchPreview.documents_without_rules > 0 && (
                                        <div className="bg-amber-50 rounded-lg p-4 mb-6 border border-amber-100">
                                            <p className="text-sm text-amber-800">
                                                ⚠️ {batchPreview.documents_without_rules} document(s) n'ont pas de règle applicable et devront être validés manuellement.
                                            </p>
                                        </div>
                                    )}

                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setShowBatchModal(false)}
                                            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition"
                                        >
                                            Annuler
                                        </button>
                                        <button
                                            onClick={handleConfirmBatchValidation}
                                            disabled={batchPreview.eligible_documents === 0 || isValidating}
                                            className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                                        >
                                            {isValidating ? (
                                                <>
                                                    <Loader2 className="h-5 w-5 animate-spin" />
                                                    Validation en cours...
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle className="h-5 w-5" />
                                                    Valider {batchPreview.eligible_documents} document(s)
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    Erreur lors du chargement des données
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
