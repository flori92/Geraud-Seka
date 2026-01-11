import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { 
    TrendingUp, Download, Eye, Calendar, Building, 
    DollarSign, FileText, Search, CheckCircle
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

interface SalesInvoice {
    id: string;
    original_filename: string;
    customer_name?: string;
    supplier_name?: string;
    document_date?: string;
    amount_ttc?: number;
    reference_number?: string;
    status?: string;
    type?: string;
    journal_code?: string;
}

export default function FacturesVentesPage() {
    const router = useRouter();
    const [documents, setDocuments] = useState<SalesInvoice[]>([]);
    const [filteredDocs, setFilteredDocs] = useState<SalesInvoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [dateFilter, setDateFilter] = useState({ start: "", end: "" });
    const [statusFilter, setStatusFilter] = useState("all");

    useEffect(() => {
        fetchSalesInvoices();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        applyFilters();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [documents, searchTerm, dateFilter, statusFilter]);

    const fetchSalesInvoices = async () => {
        const token = localStorage.getItem("seka_access_token");
        if (!token) {
            router.push("/login");
            return;
        }

        setLoading(true);
        try {
            // D'abord essayer avec le filtre document_type
            let response = await fetch(
                `${API_BASE_URL}/api/v1/documents?document_type=INVOICE_SALES`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            console.log("Response status (with filter):", response.status);
            
            // Si ça échoue, récupérer tous les documents et filtrer côté client
            if (!response.ok) {
                console.log("Filtrage par document_type échoué, récupération de tous les documents...");
                response = await fetch(
                    `${API_BASE_URL}/api/v1/documents`,
                    {
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );
                
                console.log("Response status (all documents):", response.status);
            }

            if (response.ok) {
                const data = await response.json();
                console.log("Documents data:", data);
                console.log("Data is array:", Array.isArray(data));
                console.log("Data length:", data?.length);
                
                // Filtrer pour ne garder que les factures de ventes
                const salesInvoices = Array.isArray(data) 
                    ? data.filter(doc => doc.type === 'INVOICE_SALES')
                    : [];
                
                console.log("Sales invoices filtered:", salesInvoices.length);
                setDocuments(salesInvoices);
            } else {
                const errorText = await response.text();
                console.error("Response not OK:", response.status, errorText);
            }
        } catch (error) {
            console.error("Error fetching sales invoices:", error);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...documents];

        if (searchTerm) {
            filtered = filtered.filter(doc =>
                doc.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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

        if (statusFilter !== "all") {
            filtered = filtered.filter(doc => doc.status === statusFilter);
        }

        setFilteredDocs(filtered);
    };

    const handleExport = () => {
        const params = new URLSearchParams();
        params.append("document_type", "INVOICE_SALES");
        if (dateFilter.start) params.append("start_date", dateFilter.start);
        if (dateFilter.end) params.append("end_date", dateFilter.end);
        
        router.push(`/exports?${params.toString()}`);
    };

    const totalTTC = filteredDocs.reduce((sum, doc) => sum + (doc.amount_ttc || 0), 0);
    const validatedCount = documents.filter(d => d.status === 'VALIDATED').length;

    return (
        <>
            <Head>
                <title>Factures Clients - SEKA</title>
            </Head>

            <div className="min-h-screen bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                <TrendingUp className="h-6 w-6 text-green-600" />
                                Factures clients
                            </h1>
                            <p className="mt-1 text-sm text-gray-500">
                                Suivez vos factures de vente et leurs paiements
                            </p>
                        </div>
                        <button
                            onClick={handleExport}
                            disabled={filteredDocs.length === 0}
                            className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#172e4d] font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Download className="h-5 w-5" />
                            Exporter
                        </button>
                    </div>

                    <div className="grid grid-cols-4 gap-4 mb-6">
                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Total factures</p>
                                    <p className="text-2xl font-bold text-gray-900">{filteredDocs.length}</p>
                                </div>
                                <FileText className="h-8 w-8 text-gray-400" />
                            </div>
                        </div>
                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Validées</p>
                                    <p className="text-2xl font-bold text-green-600">{validatedCount}</p>
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
                                            if (!d.document_date) return false;
                                            const docDate = new Date(d.document_date);
                                            const now = new Date();
                                            return docDate.getMonth() === now.getMonth() && 
                                                   docDate.getFullYear() === now.getFullYear();
                                        }).length}
                                    </p>
                                </div>
                                <Calendar className="h-8 w-8 text-purple-400" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
                        <div className="grid grid-cols-5 gap-4">
                            <div className="col-span-2 relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Rechercher (client, n° facture)"
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
                            <div>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                >
                                    <option value="all">Tous les statuts</option>
                                    <option value="UPLOADED">Uploadé</option>
                                    <option value="OCR_PROCESSING">En traitement</option>
                                    <option value="OCR_COMPLETED">OCR complété</option>
                                    <option value="VALIDATED">Validé</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        {loading ? (
                            <div className="p-8 text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e3a5f] mx-auto mb-2"></div>
                                Chargement...
                            </div>
                        ) : filteredDocs.length === 0 ? (
                            <div className="p-12 text-center text-gray-500">
                                <FileText className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                                <p className="font-medium">Aucune facture client trouvée</p>
                                <p className="text-sm mt-1">Créez vos premières factures pour commencer</p>
                            </div>
                        ) : (
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Date
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Client
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            N° Facture
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Statut
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
                                                        {doc.customer_name || doc.supplier_name || "N/A"}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {doc.reference_number || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    doc.status === 'VALIDATED' ? 'bg-green-100 text-green-800' :
                                                    doc.status === 'OCR_COMPLETED' ? 'bg-blue-100 text-blue-800' :
                                                    doc.status === 'OCR_PROCESSING' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {doc.status === 'VALIDATED' ? 'Validé' :
                                                     doc.status === 'OCR_COMPLETED' ? 'Prêt' :
                                                     doc.status === 'OCR_PROCESSING' ? 'Traitement' :
                                                     doc.status || 'Uploadé'}
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
                                {filteredDocs.length} facture(s) client(s)
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
