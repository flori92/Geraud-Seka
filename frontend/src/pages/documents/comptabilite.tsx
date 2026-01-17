import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import {
    FileText, Search, CheckCircle, Download, Loader2,
    Database, FileSpreadsheet, TrendingUp, Users
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

interface AccountingDocument {
    id: string;
    filename: string;
    reference_number: string;
    type: string;
    supplier_name?: string;
    client_name?: string;
    amount_ttc?: number;
    document_date?: string;
    status: string;
    exported_at: string;
    accounting_entry_id?: string;
    journal_type?: string;
}

interface DocumentStats {
    total: number;
    invoices: number;
    receipts: number;
    quotes: number;
    this_month: number;
    total_amount: number;
}

export default function DocumentsComptabilitePage() {
    const router = useRouter();
    const [documents, setDocuments] = useState<AccountingDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
    const [documentType, setDocumentType] = useState<string>('all');
    const [dateRange, setDateRange] = useState<string>('all');

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
            const response = await fetch(`${API_BASE_URL}/documents/accounting`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const docs = await response.json();
                setDocuments(docs);
            } else {
                throw new Error('Erreur lors du chargement des documents comptables');
            }
        } catch (error) {
            console.error("Erreur lors du chargement des documents comptables:", error);
            // En cas d'erreur, simuler des données pour le développement
            setDocuments([]);
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
        
        const matchesDate = dateRange === 'all' || 
            (dateRange === 'month' && doc.exported_at && 
             new Date(doc.exported_at).getMonth() === new Date().getMonth() &&
             new Date(doc.exported_at).getFullYear() === new Date().getFullYear());
        
        return matchesSearch && matchesType && matchesDate;
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

    const getStats = (): DocumentStats => {
        const thisMonth = new Date().getMonth();
        const thisYear = new Date().getFullYear();
        
        const monthDocuments = documents.filter(doc => {
            if (!doc.exported_at) return false;
            const date = new Date(doc.exported_at);
            return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
        });

        return {
            total: documents.length,
            invoices: documents.filter(d => d.type === 'INVOICE_PURCHASE').length,
            receipts: documents.filter(d => d.type === 'INVOICE_SALES').length,
            quotes: documents.filter(d => d.type === 'QUOTE').length,
            this_month: monthDocuments.length,
            total_amount: documents.reduce((sum, doc) => sum + (doc.amount_ttc || 0), 0),
        };
    };

    const stats = getStats();

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'EXPORTED':
                return { label: 'Exporté', color: 'bg-blue-100 text-blue-800', icon: CheckCircle };
            case 'IN_ACCOUNTING':
                return { label: 'En comptabilité', color: 'bg-green-100 text-green-800', icon: Database };
            default:
                return { label: status, color: 'bg-gray-100 text-gray-800', icon: FileText };
        }
    };

    const getJournalTypeLabel = (type?: string) => {
        switch (type) {
            case 'ACHAT': return 'Journal Achats';
            case 'VENTE': return 'Journal Ventes';
            case 'BANQUE': return 'Journal Banque';
            default: return type || 'Non spécifié';
        }
    };

    const getDocumentTypeLabel = (type: string) => {
        switch (type) {
            case 'INVOICE_PURCHASE': return 'Facture Achat';
            case 'INVOICE_SALES': return 'Facture Vente';
            case 'QUOTE': return 'Devis';
            default: return type;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#1e3a5f] mx-auto" />
                <p className="text-sm text-gray-600 mt-3">Chargement des documents comptables...</p>
            </div>
        );
    }

    return (
        <>
            <Head>
                <title>Comptabilité - SEKA</title>
            </Head>
            <div className="min-h-screen bg-gray-50">
                {/* Header */}
                <div className="bg-white shadow-sm border-b">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center py-4">
                            <div className="flex items-center space-x-3">
                                <Database className="h-6 w-6 text-[#1e3a5f]" />
                                <h1 className="text-2xl font-bold text-gray-900">Comptabilité</h1>
                                <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                                    Intégrés
                                </span>
                            </div>
                            <div className="flex items-center space-x-3">
                                <button
                                    onClick={() => router.push('/documents/export')}
                                    className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                                    Voir exports
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
                                <TrendingUp className="h-8 w-8 text-green-500" />
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Ce mois</p>
                                    <p className="text-2xl font-bold text-gray-900">{stats.this_month}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow">
                            <div className="flex items-center">
                                <Database className="h-8 w-8 text-purple-500" />
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Factures Achat</p>
                                    <p className="text-2xl font-bold text-gray-900">{stats.invoices}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow">
                            <div className="flex items-center">
                                <Users className="h-8 w-8 text-orange-500" />
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Factures Vente</p>
                                    <p className="text-2xl font-bold text-gray-900">{stats.receipts}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow">
                            <div className="flex items-center">
                                <CheckCircle className="h-8 w-8 text-red-500" />
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Montant total</p>
                                    <p className="text-2xl font-bold text-gray-900">{stats.total_amount.toFixed(2)} €</p>
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
                                <select
                                    value={documentType}
                                    onChange={(e) => setDocumentType(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent"
                                >
                                    <option value="all">Tous types</option>
                                    <option value="INVOICE_PURCHASE">Factures Achat</option>
                                    <option value="INVOICE_SALES">Factures Vente</option>
                                    <option value="QUOTE">Devis</option>
                                </select>
                                <select
                                    value={dateRange}
                                    onChange={(e) => setDateRange(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent"
                                >
                                    <option value="all">Toutes dates</option>
                                    <option value="month">Ce mois</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Documents Table */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="bg-white shadow rounded-lg">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-medium text-gray-900">Documents intégrés en comptabilité</h2>
                                <div className="flex items-center space-x-2">
                                    <span className="text-sm text-gray-500">
                                        {filteredDocuments.length} document(s)
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        {filteredDocuments.length === 0 ? (
                            <div className="p-12 text-center">
                                <Database className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-600 mb-4">Aucun document intégré en comptabilité</p>
                                <button
                                    onClick={() => router.push('/documents/export')}
                                    className="text-[#1e3a5f] hover:text-[#2a4a7f] font-medium"
                                >
                                    Exporter des documents
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
                                                Fournisseur/Client
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Montant
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Date export
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Journal
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
                                                                <div className="text-xs text-gray-500">
                                                                    {getDocumentTypeLabel(doc.type)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm text-gray-900">
                                                            {doc.supplier_name || doc.client_name || 'N/A'}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {doc.amount_ttc ? `${doc.amount_ttc.toFixed(2)} €` : 'N/A'}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm text-gray-900">
                                                            {doc.exported_at ? new Date(doc.exported_at).toLocaleDateString('fr-FR') : 'N/A'}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm text-gray-900">
                                                            {getJournalTypeLabel(doc.journal_type)}
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
                                                            {doc.accounting_entry_id && (
                                                                <button
                                                                    onClick={() => window.open(`/accounting/entries/${doc.accounting_entry_id}`, '_blank')}
                                                                    className="text-gray-400 hover:text-gray-600"
                                                                    title="Voir l'écriture comptable"
                                                                >
                                                                    <Database className="h-4 w-4" />
                                                                </button>
                                                            )}
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
