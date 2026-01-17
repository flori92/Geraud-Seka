import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import {
    FileText, Search, CheckCircle, Eye, Trash2,
    Download, Upload, Loader2, CheckCheck, Calendar
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api";
import { getValidatedDocuments, deleteDocument, type Document } from "@/lib/api";

interface DocumentStats {
    total: number;
    invoices: number;
    receipts: number;
    quotes: number;
}

export default function DocumentsValideesPage() {
    const router = useRouter();
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
    const [isDeleting, setIsDeleting] = useState(false);
    const [documentType, setDocumentType] = useState<string>('all');

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
            const docs = await getValidatedDocuments(token);
            setDocuments(docs);
        } catch (error) {
            console.error("Erreur lors du chargement des documents validés:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredDocuments = documents.filter(doc => {
        const matchesSearch = searchQuery === '' || 
            doc.filename?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            doc.supplier_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            doc.reference_number?.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesType = documentType === 'all' || doc.type === documentType;
        
        return matchesSearch && matchesType;
    });

    const handleSelectDoc = (docId: string) => {
        setSelectedDocs(prev => 
            prev.includes(docId) 
                ? prev.filter(id => id !== docId)
                : [...prev, docId]
        );
    };

    const handleSelectAll = () => {
        if (selectedDocs.length === filteredDocuments.length) {
            setSelectedDocs([]);
        } else {
            setSelectedDocs(filteredDocuments.map(doc => doc.id));
        }
    };

    const handleDeleteSelected = async () => {
        if (selectedDocs.length === 0) return;
        
        if (!confirm(`Êtes-vous sûr de vouloir supprimer ${selectedDocs.length} document(s) ?`)) {
            return;
        }

        setIsDeleting(true);
        const token = localStorage.getItem("seka_access_token");
        
        try {
            await Promise.all(
                selectedDocs.map(docId => deleteDocument(docId, token!))
            );
            setSelectedDocs([]);
            fetchDocuments();
        } catch (error) {
            console.error("Erreur lors de la suppression:", error);
        } finally {
            setIsDeleting(false);
        }
    };

    const getDocumentTypeLabel = (type: string) => {
        switch (type) {
            case 'INVOICE_PURCHASE': return 'Facture fournisseur';
            case 'INVOICE_SALES': return 'Facture client';
            case 'RECEIPT': return 'Reçu';
            case 'QUOTE': return 'Devis';
            case 'DELIVERY_NOTE': return 'Bon de livraison';
            case 'PURCHASE_ORDER': return 'Commande fournisseur';
            default: return type;
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('fr-FR');
    };

    const formatAmount = (amount: number | null | undefined) => {
        if (amount === null || amount === undefined) return '-';
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'XOF' // ou la devise appropriée
        }).format(amount);
    };

    const stats: DocumentStats = {
        total: documents.length,
        invoices: documents.filter(d => d.type?.includes('INVOICE')).length,
        receipts: documents.filter(d => d.type === 'RECEIPT').length,
        quotes: documents.filter(d => d.type === 'QUOTE').length,
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
                    <p className="text-gray-600">Chargement des documents validés...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <Head>
                <title>Documents Validés - SEKA</title>
                <meta name="description" content="Documents validés et prêts pour l'export" />
            </Head>

            <div className="min-h-screen bg-gray-50">
                {/* Header */}
                <div className="bg-white border-b border-gray-200">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between h-16">
                            <div className="flex items-center">
                                <FileText className="h-8 w-8 text-blue-600 mr-3" />
                                <div>
                                    <h1 className="text-xl font-semibold text-gray-900">Documents Validés</h1>
                                    <p className="text-sm text-gray-500">
                                        {stats.total} document{stats.total > 1 ? 's' : ''} validé{stats.total > 1 ? 's' : ''}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-3">
                                <button
                                    onClick={() => router.push('/documents/upload')}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                                >
                                    <Upload className="h-4 w-4 mr-2" />
                                    Nouveau document
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white p-6 rounded-lg border border-gray-200">
                            <div className="flex items-center">
                                <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Total validés</p>
                                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-lg border border-gray-200">
                            <div className="flex items-center">
                                <FileText className="h-8 w-8 text-blue-600 mr-3" />
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Factures</p>
                                    <p className="text-2xl font-bold text-gray-900">{stats.invoices}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-lg border border-gray-200">
                            <div className="flex items-center">
                                <Calendar className="h-8 w-8 text-purple-600 mr-3" />
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Reçus</p>
                                    <p className="text-2xl font-bold text-gray-900">{stats.receipts}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-lg border border-gray-200">
                            <div className="flex items-center">
                                <CheckCheck className="h-8 w-8 text-green-600 mr-3" />
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Devis</p>
                                    <p className="text-2xl font-bold text-gray-900">{stats.quotes}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters and Search */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4">
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                            <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Rechercher..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 w-full sm:w-64"
                                    />
                                </div>
                                <select
                                    value={documentType}
                                    onChange={(e) => setDocumentType(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="all">Tous types</option>
                                    <option value="INVOICE_PURCHASE">Factures fournisseurs</option>
                                    <option value="INVOICE_SALES">Factures clients</option>
                                    <option value="RECEIPT">Reçus</option>
                                    <option value="QUOTE">Devis</option>
                                </select>
                            </div>
                            <div className="flex items-center space-x-3">
                                {selectedDocs.length > 0 && (
                                    <>
                                        <span className="text-sm text-gray-600">
                                            {selectedDocs.length} sélectionné{selectedDocs.length > 1 ? 's' : ''}
                                        </span>
                                        <button
                                            onClick={handleDeleteSelected}
                                            disabled={isDeleting}
                                            className="inline-flex items-center px-3 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-50"
                                        >
                                            {isDeleting ? (
                                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                            ) : (
                                                <Trash2 className="h-4 w-4 mr-2" />
                                            )}
                                            Supprimer
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Documents List */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
                    <div className="bg-white shadow rounded-lg">
                        {filteredDocuments.length === 0 ? (
                            <div className="text-center py-12">
                                <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    {documents.length === 0 ? 'Aucun document validé' : 'Aucun document trouvé'}
                                </h3>
                                <p className="text-gray-500 mb-4">
                                    {documents.length === 0 
                                        ? 'Les documents validés apparaîtront ici une fois traités.'
                                        : 'Essayez de modifier vos filtres de recherche.'
                                    }
                                </p>
                                {documents.length === 0 && (
                                    <button
                                        onClick={() => router.push('/documents/upload')}
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                                    >
                                        <Upload className="h-4 w-4 mr-2" />
                                       Uploader un document
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedDocs.length === filteredDocuments.length && filteredDocuments.length > 0}
                                                    onChange={handleSelectAll}
                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                />
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Document
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Fournisseur
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Type
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Date
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Montant TTC
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Statut
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredDocuments.map((doc) => (
                                            <tr key={doc.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedDocs.includes(doc.id)}
                                                        onChange={() => handleSelectDoc(doc.id)}
                                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                    />
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <FileText className="h-5 w-5 text-gray-400 mr-3" />
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {doc.filename}
                                                            </div>
                                                            {doc.reference_number && (
                                                                <div className="text-sm text-gray-500">
                                                                    {doc.reference_number}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">
                                                        {doc.supplier_name || '-'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                                        {getDocumentTypeLabel(doc.type || '')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {formatDate(doc.date || doc.created_at)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {formatAmount(doc.amount_ttc)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                                        <CheckCircle className="h-3 w-3 mr-1" />
                                                        Validé
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <div className="flex items-center space-x-2">
                                                        <button
                                                            onClick={() => router.push(`/documents/${doc.id}`)}
                                                            className="text-blue-600 hover:text-blue-900"
                                                            title="Voir les détails"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => window.open(`${API_BASE_URL}/api/v1/documents/download/${doc.file_path}`, '_blank')}
                                                            className="text-gray-600 hover:text-gray-900"
                                                            title="Télécharger"
                                                        >
                                                            <Download className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
