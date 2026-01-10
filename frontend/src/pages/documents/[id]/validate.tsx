import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { CheckCircle, X, Calendar, Building, DollarSign } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";
import AccountAutocomplete, { type Account } from "@/components/AccountAutocomplete";

interface ValidationFormData {
    supplier_name: string;
    date: string;
    due_date: string;
    amount_ht: number;
    amount_vat: number;
    amount_ttc: number;
    reference_number: string;
    account_number: string;
    journal_code: string;
    description: string;
}

export default function DocumentValidatePage() {
    const router = useRouter();
    const { id } = router.query;
    const [loading, setLoading] = useState(true);
    const [documentData, setDocumentData] = useState<Record<string, unknown> | null>(null);
    const [viewUrl, setViewUrl] = useState<string | null>(null);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [saving, setSaving] = useState(false);

    // Form State
    const [formData, setFormData] = useState<ValidationFormData>({
        supplier_name: "",
        date: "",
        due_date: "",
        amount_ht: 0,
        amount_vat: 0,
        amount_ttc: 0,
        reference_number: "",
        account_number: "",
        journal_code: "ACH",
        description: ""
    });

    useEffect(() => {
        if (id) {
            fetchDocumentAndUrl();
            fetchAccounts();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const fetchDocumentAndUrl = async () => {
        const token = localStorage.getItem("seka_access_token");
        if (!token) return;

        setLoading(true);
        try {
            // 1. Fetch Document Details
            const docRes = await fetch(`${API_BASE_URL}/api/v1/documents/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!docRes.ok) throw new Error("Document not found");
            const doc = await docRes.json();
            setDocumentData(doc);

            // Populate form
            setFormData({
                supplier_name: doc.supplier_name || "",
                date: doc.document_date || new Date().toISOString().split('T')[0],
                due_date: doc.due_date || "",
                amount_ht: doc.amount_ht || 0,
                amount_vat: doc.amount_vat || 0,
                amount_ttc: doc.amount_ttc || 0,
                reference_number: doc.reference_number || "",
                account_number: "", // Would need to fetch supplier default if available
                journal_code: "ACH",
                description: doc.supplier_name ? `Facture ${doc.supplier_name}` : "Facture"
            });

            // 2. Fetch View URL
            const urlRes = await fetch(`${API_BASE_URL}/api/v1/documents/${id}/view-url`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (urlRes.ok) {
                const data = await urlRes.json();
                setViewUrl(data.view_url);
            }

        } catch (error) {
            console.error("Error fetching document:", error);
            alert("Erreur lors du chargement du document");
        } finally {
            setLoading(false);
        }
    };

    const fetchAccounts = async () => {
        // ... (reuse account fetching logic or import hook)
        const token = localStorage.getItem("seka_access_token");
        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/accounting/advanced/accounts`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.ok) {
                const data = await response.json();
                const accountList = Array.isArray(data) ? data : data.accounts || [];
                setAccounts(
                    (accountList as Array<Record<string, string>>).map((acc) => ({
                        code: acc.code || acc.account_number || acc.account_code || "",
                        name: acc.name || acc.label || acc.account_name || "",
                    }))
                );
            }
        } catch (e) { console.error(e); }
    };

    const handleSave = async (validateAndNext = false) => {
        setSaving(true);
        const token = localStorage.getItem("seka_access_token");
        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/documents/${id}/validate`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                if (validateAndNext) {
                    // Logic to find next document could be complex here without fetching list.
                    // Simplified: go back to list
                    router.push("/documents/en-attente");
                } else {
                    router.push("/documents/en-attente");
                }
            } else {
                const err = await response.text();
                alert(`Erreur validation: ${err}`);
            }
        } catch (error) {
            console.error("Error saving:", error);
            alert("Erreur lors de la validation");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">Loading...</div>
        </div>;
    }

    return (
        <>
            <Head><title>Valider Document - SEKA</title></Head>

            {/* Split Screen Container */}
            <div className="flex h-[calc(100vh-80px)] -mx-3 sm:-mx-4 -my-4 lg:-my-8 pt-4 lg:pt-8 bg-gray-100 overflow-hidden">

                {/* Left: PDF Viewer (50%) */}
                <div className="w-1/2 bg-gray-800 border-r border-gray-700 relative flex flex-col">
                    <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-700 text-white">
                        <span className="text-sm font-medium truncate">{String(documentData?.original_filename || "")}</span>
                        <div className="flex gap-2">
                            {/* PDF Controls could go here if managed by parent, but DocumentPdfViewer has its own */}
                        </div>
                    </div>
                    <div className="flex-1 overflow-hidden bg-gray-500 relative">
                        {viewUrl ? (
                            // Use iframe for better PDF rendering if URL is signed/available, 
                            // OR usage of DocumentPdfViewer for canvas rendering
                            <iframe src={viewUrl} className="w-full h-full border-none" />
                        ) : (
                            <div className="flex items-center justify-center h-full text-white">Aperçu non disponible</div>
                        )}
                    </div>
                </div>

                {/* Right: Validation Form (50%) */}
                <div className="w-1/2 bg-white flex flex-col h-full overflow-hidden">

                    {/* Header */}
                    <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-white">
                        <div>
                            <h1 className="text-lg font-bold text-gray-900">Validation Facture</h1>
                            <p className="text-xs text-gray-500">Vérifiez les données extraites</p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => router.push("/documents/en-attente")}
                                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                                title="Fermer"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    {/* Scrollable Form Content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">

                        {/* Supplier Section */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                <Building className="h-4 w-4 text-gray-400" /> Fournisseur
                            </h3>
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Nom du fournisseur</label>
                                    <input
                                        type="text"
                                        value={formData.supplier_name}
                                        onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                                        className="w-full text-sm border-gray-300 rounded-md focus:ring-[#1e3a5f] focus:border-[#1e3a5f]"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Compte Tiers (401)</label>
                                        <AccountAutocomplete
                                            // Simplification: using account code directly
                                            value={formData.account_number}
                                            onChange={(val) => setFormData({ ...formData, account_number: val })}
                                            accounts={accounts.filter(a => a.code.startsWith('401'))}
                                            placeholder="401..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Journal</label>
                                        <select
                                            value={formData.journal_code}
                                            onChange={(e) => setFormData({ ...formData, journal_code: e.target.value })}
                                            className="w-full text-sm border-gray-300 rounded-md focus:ring-[#1e3a5f] focus:border-[#1e3a5f]"
                                        >
                                            <option value="ACH">ACH - Achats</option>
                                            <option value="BQ">BQ - Banque</option>
                                            <option value="OD">OD - Opérations Diverses</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <hr className="border-gray-100" />

                        {/* Dates & Reference */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-gray-400" /> Dates & Référence
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Date pièce</label>
                                    <input
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        className="w-full text-sm border-gray-300 rounded-md"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Échéance</label>
                                    <input
                                        type="date"
                                        value={formData.due_date}
                                        onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                                        className="w-full text-sm border-gray-300 rounded-md"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Référence Pièce / Facture N°</label>
                                    <input
                                        type="text"
                                        value={formData.reference_number}
                                        onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                                        className="w-full text-sm border-gray-300 rounded-md"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Libellé écriture</label>
                                    <input
                                        type="text"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full text-sm border-gray-300 rounded-md"
                                    />
                                </div>
                            </div>
                        </div>

                        <hr className="border-gray-100" />

                        {/* Amounts */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-gray-400" /> Montants
                            </h3>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">HT</label>
                                    <input
                                        type="number"
                                        value={formData.amount_ht}
                                        onChange={(e) => setFormData({ ...formData, amount_ht: parseFloat(e.target.value) || 0 })}
                                        className="w-full text-sm border-gray-300 rounded-md text-right"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">TVA</label>
                                    <input
                                        type="number"
                                        value={formData.amount_vat}
                                        onChange={(e) => setFormData({ ...formData, amount_vat: parseFloat(e.target.value) || 0 })}
                                        className="w-full text-sm border-gray-300 rounded-md text-right"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">TTC</label>
                                    <input
                                        type="number"
                                        value={formData.amount_ttc}
                                        onChange={(e) => setFormData({ ...formData, amount_ttc: parseFloat(e.target.value) || 0 })}
                                        className="w-full text-sm border-gray-300 rounded-md font-bold bg-gray-50 text-right"
                                    />
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Footer Actions */}
                    <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
                        <button
                            className="text-gray-600 hover:text-gray-900 text-sm font-medium"
                            onClick={() => router.push("/documents/en-attente")}
                        >
                            Annuler
                        </button>
                        <div className="flex gap-3">
                            {/* <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium">
                                Rejeter
                            </button> */}
                            <button
                                onClick={() => handleSave(false)}
                                disabled={saving}
                                className="px-6 py-2 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#172e4d] text-sm font-medium flex items-center gap-2 shadow-sm"
                            >
                                <CheckCircle className="h-4 w-4" />
                                {saving ? "Validation..." : "Valider"}
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </>
    );
}
