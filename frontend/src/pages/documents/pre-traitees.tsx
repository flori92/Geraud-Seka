import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import {
    FileText, Search, CheckCircle, Plus, Eye, Trash2,
    Upload, Loader2, CheckCheck
} from "lucide-react";
import { getPreTraiteesDocuments, deleteDocument, type Document } from "@/lib/api";

export default function DocumentsPreTraiteesPage() {
    const router = useRouter();
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
    const [isValidating, setIsValidating] = useState(false);

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
            const docs = await getPreTraiteesDocuments(token);
            setDocuments(docs);
        } catch (error) {
            console.error("Erreur lors du chargement des documents pré-traités:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredDocuments = documents.filter(document =>
        document.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
        document.supplier_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        document.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        document.reference_number?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleValidate = async (documentId: string) => {
        const token = localStorage.getItem("seka_access_token");
        if (!token) return;

        setIsValidating(true);
        try {
            // Appeler l'endpoint de validation
            const response = await fetch(`/api/v1/documents/${documentId}/validate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    // Les données de validation viennent du document OCR
                    amount_ttc: documents.find(d => d.id === documentId)?.amount_ttc,
                    amount_ht: documents.find(d => d.id === documentId)?.amount_ht,
                    amount_vat: documents.find(d => d.id === documentId)?.amount_vat,
                    description: documents.find(d => d.id === documentId)?.description,
                    supplier_name: documents.find(d => d.id === documentId)?.supplier_name
                })
            });

            if (response.ok) {
                // Mettre à jour le statut localement
                setDocuments(documents.map(doc => 
                    doc.id === documentId 
                        ? { ...doc, status: 'VALIDEE' }
                        : doc
                ));
            }
        } catch (error) {
            console.error("Erreur lors de la validation:", error);
            alert("Erreur lors de la validation du document");
        } finally {
            setIsValidating(false);
        }
    };

    const handleBatchValidate = async () => {
        if (selectedDocs.length === 0) return;
        if (!confirm(`Êtes-vous sûr de vouloir valider les ${selectedDocs.length} documents sélectionnés ?`)) return;

        const token = localStorage.getItem("seka_access_token");
        if (!token) return;

        setIsValidating(true);
        try {
            await Promise.all(selectedDocs.map(docId => handleValidate(docId)));
            setSelectedDocs([]);
        } catch (error) {
            console.error("Erreur lors de la validation batch:", error);
            alert("Erreur lors de la validation des documents");
        } finally {
            setIsValidating(false);
        }
    };

    const handleDelete = async (documentId: string) => {
        if (!confirm("Êtes-vous sûr de vouloir supprimer ce document ?")) return;

        const token = localStorage.getItem("seka_access_token");
        if (!token) return;

        try {
            await deleteDocument(documentId, token);
            setDocuments(documents.filter(doc => doc.id !== documentId));
        } catch (error) {
            console.error("Erreur lors de la suppression:", error);
            alert("Erreur lors de la suppression du document");
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatAmount = (amount: number, currency: string = 'XOF') => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: currency === 'XOF' ? 'XOF' : currency
        }).format(amount);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PRE_TRAITEE': return 'bg-yellow-100 text-yellow-800';
            case 'VALIDEE': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'PRE_TRAITEE': return 'Pré-traitée';
            case 'VALIDEE': return 'Validée';
            default: return status;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
                    <p className="text-gray-600">Chargement des documents pré-traités...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <Head>
                <title>Documents pré-traités - SEKA</title>
                <meta name="description" content="Documents avec règle appliquée, prêts à valider" />
            </Head>

            <div className="min-h-screen bg-gray-50">
                {/* Header */}
                <div className="bg-white border-b border-gray-200">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between h-16">
                            <div className="flex items-center">
                                <CheckCircle className="h-8 w-8 text-yellow-600 mr-3" />
                                <div>
                                    <h1 className="text-xl font-semibold text-gray-900">Documents pré-traités</h1>
                                    <p className="text-sm text-yellow-600">
                                        {documents.length} document{documents.length > 1 ? 's' : ''} avec règle appliquée
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-3">
                                {selectedDocs.length > 0 && (
                                    <button
                                        onClick={handleBatchValidate}
                                        disabled={isValidating}
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                                    >
                                        {isValidating ? (
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        ) : (
                                            <CheckCheck className="h-4 w-4 mr-2" />
                                        )}
                                        Valider la sélection
                                    </button>
                                )}
                                <button
                                    onClick={() => router.push('/documents/upload')}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Nouveau document
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Alert Info */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="bg-green-50 border border-green-200 rounded-md p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <CheckCircle className="h-5 w-5 text-green-400" />
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-green-800">
                                    Documents avec règle d'imputation
                                </h3>
                                <div className="mt-2 text-sm text-green-700">
                                    <p>Ces documents ont une règle d&apos;imputation associée et sont prêts à être validés.</p>
                                    <p>La validation générera automatiquement les écritures comptables.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
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
                            </div>
                            {selectedDocs.length > 0 && (
                                <div className="flex items-center space-x-3">
                                    <span className="text-sm text-gray-600">
                                        {selectedDocs.length} sélectionné{selectedDocs.length > 1 ? 's' : ''}
                                    </span>
                                </div>
                            )}
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
                                    {documents.length === 0 ? 'Aucun document pré-traité' : 'Aucun document trouvé'}
                                </h3>
                                <p className="text-gray-500 mb-4">
                                    {documents.length === 0 
                                        ? 'Tous les documents nécessitent une règle d\'imputation.'
                                        : 'Essayez de modifier vos filtres de recherche.'
                                    }
                                </p>
                                <button
                                    onClick={() => router.push('/documents/upload')}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                                >
                                    <Upload className="h-4 w-4 mr-2" />
                                    Upload un document
                                </button>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedDocs.length === filteredDocuments.length}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedDocs(filteredDocuments.map(doc => doc.id));
                                                        } else {
                                                            setSelectedDocs([]);
                                                        }
                                                    }}
                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                />
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Document
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Fournisseur/Client
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Montant
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Règle
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Statut
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Date
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredDocuments.map((document) => (
                                            <tr key={document.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedDocs.includes(document.id)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setSelectedDocs([...selectedDocs, document.id]);
                                                            } else {
                                                                setSelectedDocs(selectedDocs.filter(id => id !== document.id));
                                                            }
                                                        }}
                                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                    />
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <FileText className="h-5 w-5 text-gray-400 mr-3" />
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {document.filename}
                                                            </div>
                                                            {document.reference_number && (
                                                                <div className="text-sm text-gray-500">
                                                                    {document.reference_number}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">
                                                        {document.supplier_name || document.customer_name || '-'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {document.amount_ttc ? formatAmount(document.amount_ttc) : '-'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">
                                                        {document.matched_rule_name || '-'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(document.status)}`}>
                                                        {getStatusLabel(document.status)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {formatDate(document.created_at)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <div className="flex items-center space-x-2">
                                                        <button
                                                            onClick={() => router.push(`/documents/${document.id}`)}
                                                            className="text-blue-600 hover:text-blue-900"
                                                            title="Voir les détails"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleValidate(document.id)}
                                                            disabled={isValidating}
                                                            className="text-green-600 hover:text-green-900 disabled:opacity-50"
                                                            title="Valider"
                                                        >
                                                            <CheckCheck className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(document.id)}
                                                            className="text-red-600 hover:text-red-900"
                                                            title="Supprimer"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
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
