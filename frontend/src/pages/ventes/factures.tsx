import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import {
    FileText, Search, CheckCircle, Download, Loader2,
    ArrowRight, Database, TrendingUp
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api";
import { getValidatedSalesDocuments, type Document } from "@/lib/api";

interface DocumentStats {
    total: number;
    invoices: number;
    ready_for_accounting: number;
}

export default function VentesFacturesPage() {
    const router = useRouter();
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
    const [isExporting, setIsExporting] = useState(false);

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
            const docs = await getValidatedSalesDocuments(token);
            setDocuments(docs);
        } catch (error) {
            console.error("Erreur lors du chargement des factures de ventes:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredDocuments = documents.filter(doc => {
        const matchesSearch = searchQuery === '' || 
            doc.filename?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            doc.supplier_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            doc.reference_number?.toLowerCase().includes(searchQuery.toLowerCase());
        
        return matchesSearch;
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
            setSelectedDocs(filteredDocuments.map(d => d.id));
        }
    };

    const handleExportToAccounting = async () => {
        if (selectedDocs.length === 0) {
            alert("Veuillez sélectionner au moins une facture à exporter");
            return;
        }

        setIsExporting(true);
        try {
            const token = localStorage.getItem("seka_access_token");
            const response = await fetch(`${API_BASE_URL}/documents/export`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    document_ids: selectedDocs
                })
            });

            if (response.ok) {
                alert(`${selectedDocs.length} facture(s) exportée(s) avec succès vers la comptabilité`);
                setSelectedDocs([]);
                fetchDocuments(); // Rafraîchir la liste
            } else {
                throw new Error('Erreur lors de l\'export');
            }
        } catch (error) {
            console.error("Erreur lors de l'export:", error);
            alert("Erreur lors de l&apos;export des factures");
        } finally {
            setIsExporting(false);
        }
    };

    const getStats = (): DocumentStats => {
        return {
            total: documents.length,
            invoices: documents.filter(d => d.type === 'INVOICE_SALES').length,
            ready_for_accounting: documents.length,
        };
    };

    const stats = getStats();

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'VALIDEE':
                return { label: 'Validée', color: 'bg-green-100 text-green-800', icon: CheckCircle };
            default:
                return { label: status, color: 'bg-gray-100 text-gray-800', icon: FileText };
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#1e3a5f] mx-auto" />
                <p className="text-sm text-gray-600 mt-3">Chargement des factures de ventes...</p>
            </div>
        );
    }

    return (
        <>
            <Head>
                <title>Factures Ventes - SEKA</title>
            </Head>
            <div className="min-h-screen bg-gray-50">
                {/* Header */}
                <div className="bg-white shadow-sm border-b">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center py-4">
                            <div className="flex items-center space-x-3">
                                <TrendingUp className="h-6 w-6 text-[#1e3a5f]" />
                                <h1 className="text-2xl font-bold text-gray-900">Factures Ventes</h1>
                                <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                                    Validées
                                </span>
                            </div>
                            <div className="flex items-center space-x-3">
                                <button
                                    onClick={() => router.push('/exports')}
                                    className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                                >
                                    <Database className="h-4 w-4 mr-2" />
                                    Voir les exports
                                </button>
                                <button
                                    onClick={handleExportToAccounting}
                                    disabled={isExporting || selectedDocs.length === 0}
                                    className="flex items-center px-4 py-2 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#2a4a7f] disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isExporting ? (
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                        <ArrowRight className="h-4 w-4 mr-2" />
                                    )}
                                    Envoyer en comptabilité ({selectedDocs.length})
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white p-4 rounded-lg shadow">
                            <div className="flex items-center">
                                <FileText className="h-8 w-8 text-blue-500" />
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Total</p>
                                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow">
                            <div className="flex items-center">
                                <CheckCircle className="h-8 w-8 text-green-500" />
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Validées</p>
                                    <p className="text-2xl font-bold text-gray-900">{stats.invoices}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow">
                            <div className="flex items-center">
                                <ArrowRight className="h-8 w-8 text-orange-500" />
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Prêtes comptabilité</p>
                                    <p className="text-2xl font-bold text-gray-900">{stats.ready_for_accounting}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="bg-white p-4 rounded-lg shadow">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 sm:space-x-4">
                            <div className="flex items-center space-x-4">
                                <div className="relative">
                                    <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Rechercher..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Documents Table */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="bg-white shadow rounded-lg">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-medium text-gray-900">Factures de ventes validées</h2>
                                <div className="flex items-center space-x-2">
                                    <span className="text-sm text-gray-500">
                                        {filteredDocuments.length} facture(s)
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        {filteredDocuments.length === 0 ? (
                            <div className="p-12 text-center">
                                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-600 mb-4">Aucune facture de vente validée</p>
                                <button
                                    onClick={() => router.push('/documents/en-attente')}
                                    className="text-[#1e3a5f] hover:text-[#2a4a7f] font-medium"
                                >
                                    Voir les documents en attente
                                </button>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedDocs.length === filteredDocuments.length}
                                                    onChange={handleSelectAll}
                                                    className="rounded border-gray-300 text-[#1e3a5f] focus:ring-[#1e3a5f]"
                                                />
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Document
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Client
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
                                        {filteredDocuments.map((doc) => {
                                            const statusConfig = getStatusConfig(doc.status);
                                            const StatusIcon = statusConfig.icon;
                                            
                                            return (
                                                <tr key={doc.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedDocs.includes(doc.id)}
                                                            onChange={() => handleSelectDoc(doc.id)}
                                                            className="rounded border-gray-300 text-[#1e3a5f] focus:ring-[#1e3a5f]"
                                                        />
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center">
                                                            <FileText className="h-5 w-5 text-gray-400 mr-3" />
                                                            <div>
                                                                <div className="text-sm font-medium text-gray-900">
                                                                    {doc.filename}
                                                                </div>
                                                                <div className="text-xs text-gray-500">
                                                                    {doc.reference_number}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm text-gray-900">
                                                            {doc.supplier_name || 'N/A'}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {doc.amount_ttc ? `${doc.amount_ttc.toFixed(2)} €` : 'N/A'}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}>
                                                            <StatusIcon className="h-3 w-3 mr-1" />
                                                            {statusConfig.label}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center space-x-2">
                                                            <button
                                                                onClick={() => window.open(`/api/v1/documents/${doc.id}/download`, '_blank')}
                                                                className="text-gray-400 hover:text-gray-600"
                                                                title="Télécharger"
                                                            >
                                                                <Download className="h-4 w-4" />
                                                            </button>
                                                        </div>
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
        </>
    );
}
