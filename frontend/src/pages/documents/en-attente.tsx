import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import {
    Clock,
    FileText,
    CheckCircle,
    Upload,
    Search,
    Loader2,
    ChevronRight
} from "lucide-react";
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
        try {
            await Promise.all(selectedDocs.map(id => deleteDocument(id, token)));
            setDocuments(prev => prev.filter(doc => !selectedDocs.includes(doc.id)));
            setSelectedDocs([]);
        } catch (error) {
            console.error("Error deleting documents:", error);
            alert("Erreur lors de la suppression");
        } finally {
            setIsDeleting(false);
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
                                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                                                                <StatusIcon className={`h-3 w-3 ${doc.status === 'OCR_PROCESSING' ? 'animate-spin' : ''}`} />
                                                                {statusConfig.label}
                                                            </span>
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
        </>
    );
}
