/**
 * Page Factures Validées - Prêtes pour export
 */
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { 
    CheckCircle, Download, Eye, Calendar, Building, 
    DollarSign, FileText, Search, Filter
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

interface ValidatedDocument {
    id: string;
    original_filename: string;
    supplier_name?: string;
    document_date?: string;
    amount_ttc?: number;
    reference_number?: string;
    validated_at?: string;
    journal_code?: string;
}

export default function FacturesValideesPage() {
    const router = useRouter();
    const [documents, setDocuments] = useState<ValidatedDocument[]>([]);
    const [filteredDocs, setFilteredDocs] = useState<ValidatedDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [dateFilter, setDateFilter] = useState({ start: "", end: "" });
    const [journalFilter, setJournalFilter] = useState("all");

    useEffect(() => {
        fetchValidatedDocuments();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [documents, searchTerm, dateFilter, journalFilter]);

    const fetchValidatedDocuments = async () => {
        const token = localStorage.getItem("seka_access_token");
        if (!token) {
            router.push("/login");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/documents?status=validated`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setDocuments(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error("Error fetching validated documents:", error);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...documents];

        if (searchTerm) {
            filtered = filtered.filter(doc =>
                doc.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                doc.reference_number?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (dateFilter.start) {
            filtered = filtered.filter(doc => 
                doc.document_date && doc.document_date >= dateFilter.start
            );
        }

        if (dateFilter.end) {
            filtered = filtered.filter(doc => 
                doc.document_date && doc.document_date <= dateFilter.end
            );
        }

        if (journalFilter !== "all") {
            filtered = filtered.filter(doc => doc.journal_code === journalFilter);
        }

        setFilteredDocs(filtered);
    };

    const handleExport = () => {
        const params = new URLSearchParams();
        if (dateFilter.start) params.append("start_date", dateFilter.start);
        if (dateFilter.end) params.append("end_date", dateFilter.end);
        if (journalFilter !== "all") params.append("journal", journalFilter);
        
        router.push(`/exports?${params.toString()}`);
    };

    const totalTTC = filteredDocs.reduce((sum, doc) => sum + (doc.amount_ttc || 0), 0);

    return (
        <>
            <Head>
                <title>Factures Validées - SEKA</title>
            </Head>

            <div className="min-h-screen bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header */}
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                <CheckCircle className="h-6 w-6 text-green-600" />
                                FACTURES VALIDÉES
                            </h1>
                            <p className="mt-1 text-sm text-gray-500">
                                Prêtes pour export vers Perfecto, SAARI ou Sage
                            </p>
                        </div>
                        <button
                            onClick={handleExport}
                            disabled={filteredDocs.length === 0}
                            className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#172e4d] font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Download className="h-5 w-5" />
                            Exporter vers Perfecto
                        </button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Factures validées</p>
                                    <p className="text-2xl font-bold text-gray-900">{filteredDocs.length}</p>
                                </div>
                                <CheckCircle className="h-8 w-8 text-green-400" />
                            </div>
                        </div>
                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Montant total TTC</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {totalTTC.toLocaleString('fr-FR')} FCFA
                                    </p>
                                </div>
                                <DollarSign className="h-8 w-8 text-blue-400" />
                            </div>
                        </div>
                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Ce mois-ci</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {documents.filter(d => {
                                            if (!d.validated_at) return false;
                                            const validatedDate = new Date(d.validated_at);
                                            const now = new Date();
                                            return validatedDate.getMonth() === now.getMonth() && 
                                                   validatedDate.getFullYear() === now.getFullYear();
                                        }).length}
                                    </p>
                                </div>
                                <Calendar className="h-8 w-8 text-purple-400" />
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
                        <div className="grid grid-cols-4 gap-4">
                            <div className="col-span-2 relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Rechercher..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
                                />
                            </div>
                            <div>
                                <input
                                    type="date"
                                    value={dateFilter.start}
                                    onChange={(e) => setDateFilter({...dateFilter, start: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    placeholder="Date début"
                                />
                            </div>
                            <div>
                                <input
                                    type="date"
                                    value={dateFilter.end}
                                    onChange={(e) => setDateFilter({...dateFilter, end: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    placeholder="Date fin"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        {loading ? (
                            <div className="p-8 text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e3a5f] mx-auto mb-2"></div>
                                Chargement...
                            </div>
                        ) : filteredDocs.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <FileText className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                                <p className="font-medium">Aucune facture validée</p>
                                <p className="text-sm mt-1">Validez des factures pour les voir ici</p>
                            </div>
                        ) : (
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Date
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Fournisseur
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            N° Facture
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Journal
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
                                    {filteredDocs.map((doc) => (
                                        <tr key={doc.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {doc.document_date ? new Date(doc.document_date).toLocaleDateString('fr-FR') : '-'}
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                <div className="flex items-center gap-2">
                                                    <Building className="h-4 w-4 text-gray-400" />
                                                    <span className="font-medium text-gray-900">
                                                        {doc.supplier_name || "N/A"}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {doc.reference_number || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    {doc.journal_code || 'ACH'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                                                {doc.amount_ttc ? `${doc.amount_ttc.toLocaleString('fr-FR')} FCFA` : '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                                <button
                                                    onClick={() => router.push(`/documents/${doc.id}/validate`)}
                                                    className="text-blue-600 hover:text-blue-900"
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

                        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                            <p className="text-sm text-gray-500">
                                {filteredDocs.length} facture(s) validée(s)
                            </p>
                            <p className="text-sm font-medium text-gray-900">
                                Total: {totalTTC.toLocaleString('fr-FR')} FCFA
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
