import { useState, useEffect, useCallback } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import {
    CheckCircle, X, Calendar, Building, DollarSign,
    ArrowLeft, ArrowRight, FileText, Hash, Loader2, Save, AlertCircle
} from "lucide-react";
import { API_BASE_URL, getPendingDocuments } from "@/lib/api";
import AccountAutocomplete, { type Account } from "@/components/AccountAutocomplete";
import DocumentPdfViewer from "@/components/DocumentPdfViewer";

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

interface DocumentInfo {
    id: string;
    original_filename: string;
    supplier_name?: string;
    document_date?: string;
    due_date?: string;
    amount_ht?: number;
    amount_vat?: number;
    amount_ttc?: number;
    reference_number?: string;
    file_path?: string;
    status?: string;
}

export default function DocumentValidatePage() {
    const router = useRouter();
    const { id } = router.query;
    const [loading, setLoading] = useState(true);
    const [documentData, setDocumentData] = useState<DocumentInfo | null>(null);
    const [viewUrl, setViewUrl] = useState<string | null>(null);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Navigation entre documents
    const [pendingDocIds, setPendingDocIds] = useState<string[]>([]);
    const [currentIndex, setCurrentIndex] = useState<number>(-1);

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

    // Charger la liste des documents en attente pour navigation
    const fetchPendingList = useCallback(async () => {
        const token = localStorage.getItem("seka_access_token");
        if (!token) return;
        try {
            const docs = await getPendingDocuments(token);
            const ids = docs.map((d: { id: string }) => d.id);
            setPendingDocIds(ids);
            if (id) {
                const idx = ids.indexOf(id as string);
                setCurrentIndex(idx);
            }
        } catch (e) {
            console.error("Error fetching pending docs:", e);
        }
    }, [id]);

    useEffect(() => {
        if (id) {
            fetchDocumentAndUrl();
            fetchAccounts();
            fetchPendingList();
        }
        // Cleanup blob URL on unmount or id change
        return () => {
            if (viewUrl && viewUrl.startsWith('blob:')) {
                URL.revokeObjectURL(viewUrl);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const fetchDocumentAndUrl = async () => {
        const token = localStorage.getItem("seka_access_token");
        if (!token) {
            setError("Vous devez être connecté");
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            // 1. Fetch Document Details
            const docRes = await fetch(`${API_BASE_URL}/api/v1/documents/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!docRes.ok) throw new Error("Document non trouvé");
            const doc = await docRes.json();
            setDocumentData(doc as DocumentInfo);

            // Populate form
            setFormData({
                supplier_name: doc.supplier_name || "",
                date: doc.document_date || new Date().toISOString().split('T')[0],
                due_date: doc.due_date || "",
                amount_ht: doc.amount_ht || 0,
                amount_vat: doc.amount_vat || 0,
                amount_ttc: doc.amount_ttc || 0,
                reference_number: doc.reference_number || "",
                account_number: "",
                journal_code: "ACH",
                description: doc.supplier_name ? `Facture ${doc.supplier_name}` : "Facture"
            });

            // 2. Télécharger le fichier en blob pour contourner CSP frame-ancestors
            try {
                // D'abord essayer avec l'URL signée
                const urlRes = await fetch(`${API_BASE_URL}/api/v1/documents/${id}/view-url`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                let fileUrl = "";
                if (urlRes.ok) {
                    const data = await urlRes.json();
                    fileUrl = data.view_url;
                } else {
                    // Fallback: URL de téléchargement direct
                    fileUrl = `${API_BASE_URL}/api/v1/documents/${id}/download`;
                }

                // Télécharger le fichier en tant que blob
                const fileRes = await fetch(fileUrl, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                if (fileRes.ok) {
                    const blob = await fileRes.blob();
                    const blobUrl = URL.createObjectURL(blob);
                    setViewUrl(blobUrl);
                } else {
                    // Dernier recours: utiliser l'URL directe (peut échouer avec CSP)
                    setViewUrl(fileUrl);
                }
            } catch (urlErr) {
                console.error("Error fetching file blob:", urlErr);
                // Fallback: essayer l'URL directe
                setViewUrl(`${API_BASE_URL}/api/v1/documents/${id}/download`);
            }

        } catch (err) {
            console.error("Error fetching document:", err);
            setError(err instanceof Error ? err.message : "Erreur lors du chargement");
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

    // Navigation vers document précédent/suivant
    const goToPrevious = useCallback(() => {
        if (currentIndex > 0) {
            router.push(`/documents/${pendingDocIds[currentIndex - 1]}/validate`);
        }
    }, [currentIndex, pendingDocIds, router]);

    const goToNext = useCallback(() => {
        if (currentIndex < pendingDocIds.length - 1) {
            router.push(`/documents/${pendingDocIds[currentIndex + 1]}/validate`);
        }
    }, [currentIndex, pendingDocIds, router]);

    const handleSave = async (validateAndNext = false) => {
        setSaving(true);
        setError(null);
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
                if (validateAndNext && currentIndex < pendingDocIds.length - 1) {
                    // Aller au document suivant
                    router.push(`/documents/${pendingDocIds[currentIndex + 1]}/validate`);
                } else {
                    router.push("/documents/en-attente");
                }
            } else {
                const errData = await response.json().catch(() => ({ detail: "Erreur inconnue" }));
                setError(errData.detail || "Erreur lors de la validation");
            }
        } catch (err) {
            console.error("Error saving:", err);
            setError("Erreur réseau lors de la validation");
        } finally {
            setSaving(false);
        }
    };

    // États de chargement et erreur
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-[#1e3a5f] mx-auto mb-2" />
                    <p className="text-gray-600">Chargement du document...</p>
                </div>
            </div>
        );
    }

    if (error && !documentData) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center bg-white p-6 rounded-lg shadow-sm">
                    <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">Erreur</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={() => router.push("/documents/en-attente")}
                        className="px-4 py-2 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#172e4d]"
                    >
                        Retour à la liste
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            <Head><title>Valider Document - SEKA</title></Head>

            {/* Split Screen Container */}
            <div className="flex h-[calc(100vh-80px)] -mx-3 sm:-mx-4 -my-4 lg:-my-8 pt-4 lg:pt-8 bg-gray-100 overflow-hidden">

                {/* Left: PDF Viewer (50%) */}
                <div className="w-1/2 bg-gray-800 border-r border-gray-700 relative flex flex-col">
                    <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-700 text-white">
                        <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-gray-400" />
                            <span className="text-sm font-medium truncate">{documentData?.original_filename || "Document"}</span>
                        </div>
                        {/* Navigation entre documents */}
                        <div className="flex items-center gap-1">
                            <button
                                onClick={goToPrevious}
                                disabled={currentIndex <= 0}
                                className="p-1.5 rounded hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
                                title="Document précédent"
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </button>
                            <span className="text-xs text-gray-400 px-2">
                                {currentIndex >= 0 ? `${currentIndex + 1}/${pendingDocIds.length}` : "-"}
                            </span>
                            <button
                                onClick={goToNext}
                                disabled={currentIndex >= pendingDocIds.length - 1}
                                className="p-1.5 rounded hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
                                title="Document suivant"
                            >
                                <ArrowRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-hidden bg-gray-600 relative">
                        {viewUrl ? (
                            viewUrl.endsWith('.pdf') || viewUrl.includes('application/pdf') ? (
                                <DocumentPdfViewer url={viewUrl} />
                            ) : (
                                <iframe src={viewUrl} className="w-full h-full border-none bg-white" />
                            )
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                <FileText className="h-16 w-16 mb-3 opacity-50" />
                                <p>Aperçu non disponible</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Validation Form (50%) */}
                <div className="w-1/2 bg-white flex flex-col h-full overflow-hidden">

                    {/* Header avec navigation */}
                    <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-white">
                        <div>
                            <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <Hash className="h-5 w-5 text-[#1e3a5f]" />
                                Validation Facture
                            </h1>
                            <p className="text-xs text-gray-500">Vérifiez et corrigez les données extraites par l&apos;IA</p>
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

                    {/* Message d'erreur si présent */}
                    {error && (
                        <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                            <AlertCircle className="h-4 w-4 flex-shrink-0" />
                            {error}
                        </div>
                    )}

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
                            {/* Bouton Sauvegarder (sans valider) - pour plus tard */}
                            <button
                                onClick={() => handleSave(false)}
                                disabled={saving}
                                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium flex items-center gap-2 disabled:opacity-50"
                            >
                                <Save className="h-4 w-4" />
                                Enregistrer
                            </button>
                            {/* Bouton Valider et Suivant */}
                            <button
                                onClick={() => handleSave(true)}
                                disabled={saving || pendingDocIds.length === 0}
                                className="px-5 py-2 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#172e4d] text-sm font-medium flex items-center gap-2 shadow-sm disabled:opacity-50"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Validation...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="h-4 w-4" />
                                        Valider{currentIndex < pendingDocIds.length - 1 ? " & Suivant" : ""}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </>
    );
}
