import { useState, useEffect, useCallback } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import {
    CheckCircle, X, Calendar, Building, DollarSign,
    ArrowLeft, ArrowRight, FileText, Hash, Loader2, Save, AlertCircle, 
    MoreVertical, Zap, Trash2, Copy, Archive
} from "lucide-react";
import { API_BASE_URL, getPendingDocuments } from "@/lib/api";
import AccountAutocomplete, { type Account } from "@/components/AccountAutocomplete";
import DocumentPdfViewer from "@/components/DocumentPdfViewer";
import { ConfidenceIndicator, calculateFieldConfidence, type ConfidenceLevel } from "@/components/ConfidenceIndicator";

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
    document_type: 'INVOICE_PURCHASE' | 'INVOICE_SALES' | 'EXPENSE_REPORT' | 'OTHER';
    vat_rate: number;
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
    type?: string;
    ocr_data?: {
        vat_rate?: number;
        [key: string]: unknown;
    };
    ai_extracted_data?: {
        applied_rule?: {
            tiers_account?: string;
            supplier_account?: string;
            charge_account?: string;
            vat_account?: string;
            vat_rate?: number;
            journal_code?: string;
        };
        supplier_detection?: {
            found?: boolean;
            confidence?: number;
            supplier?: {
                id?: string;
                name?: string;
                auxiliary_account_code?: string;
            };
        };
    };
}

interface AccountingEntry {
    journal: string;
    date: string;
    account: string;
    label: string;
    debit: number;
    credit: number;
}

interface SupplierRule {
    supplier_name: string;
    charge_account: string;
    vat_account: string;
    supplier_account: string;
    vat_rate: number;
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

    const [pendingDocIds, setPendingDocIds] = useState<string[]>([]);
    const [currentIndex, setCurrentIndex] = useState<number>(-1);
    const [showQuickActions, setShowQuickActions] = useState(false);
    const [fieldConfidence, setFieldConfidence] = useState<Record<string, { score: number; level: ConfidenceLevel; reasons: string[] }>>({});
    const [accountingEntries, setAccountingEntries] = useState<AccountingEntry[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [supplierRule, _setSupplierRule] = useState<SupplierRule | null>(null);
    const [generatingEntries, setGeneratingEntries] = useState(false);

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
        description: "",
        document_type: "INVOICE_PURCHASE",
        vat_rate: 0
    });

    // Generate accounting entries from form data
    const generateAccountingEntries = useCallback(() => {
        setGeneratingEntries(true);
        
        try {
            const entries: AccountingEntry[] = [];
            const { journal_code, date, amount_ht, amount_vat, amount_ttc, account_number, description, reference_number } = formData;

            if (!amount_ttc || amount_ttc === 0) {
                setAccountingEntries([]);
                return;
            }

            // Entry 1: Charge (Debit)
            if (amount_ht > 0) {
                entries.push({
                    journal: journal_code,
                    date: date,
                    account: supplierRule?.charge_account || '6061',
                    label: description || `Facture ${reference_number}`,
                    debit: amount_ht,
                    credit: 0
                });
            }

            // Entry 2: TVA (Debit)
            if (amount_vat > 0) {
                entries.push({
                    journal: journal_code,
                    date: date,
                    account: supplierRule?.vat_account || '4454',
                    label: `TVA déductible ${formData.vat_rate || 18}%`,
                    debit: amount_vat,
                    credit: 0
                });
            }

            // Entry 3: Supplier/Client account (Credit)
            entries.push({
                journal: journal_code,
                date: date,
                account: account_number || supplierRule?.supplier_account || (formData.document_type === 'INVOICE_SALES' ? '411000' : '401000'),
                label: `${formData.document_type === 'INVOICE_SALES' ? 'Client' : 'Fournisseur'} ${formData.supplier_name}`,
                debit: 0,
                credit: amount_ttc
            });

            setAccountingEntries(entries);
        } catch (error) {
            console.error('Error generating entries:', error);
        } finally {
            setGeneratingEntries(false);
        }
    }, [formData, supplierRule]);

    // Auto-generate entries when form data changes
    useEffect(() => {
        if (formData.amount_ttc > 0) {
            generateAccountingEntries();
        }
    }, [formData.amount_ht, formData.amount_vat, formData.amount_ttc, formData.account_number, formData.journal_code, generateAccountingEntries]);

    // Calculate field confidence scores
    const updateFieldConfidence = useCallback((data: DocumentInfo) => {
        const confidence: Record<string, { score: number; level: ConfidenceLevel; reasons: string[] }> = {};
        
        // Supplier name
        confidence.supplier_name = calculateFieldConfidence(
            data.supplier_name,
            /^[A-Za-zÀ-ÿ0-9\s\-\.&']+$/
        );
        
        // Reference number
        confidence.reference_number = calculateFieldConfidence(
            data.reference_number,
            /^[A-Z0-9\-\/]+$/i
        );
        
        // Date
        confidence.date = calculateFieldConfidence(data.document_date);
        
        // Amounts
        confidence.amount_ht = calculateFieldConfidence(data.amount_ht);
        confidence.amount_vat = calculateFieldConfidence(data.amount_vat);
        confidence.amount_ttc = calculateFieldConfidence(data.amount_ttc);
        
        setFieldConfidence(confidence);
    }, []);

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

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if typing in input/textarea
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                // Only handle Ctrl+S even in inputs
                if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                    e.preventDefault();
                    handleSave(false);
                }
                return;
            }

            // Ctrl/Cmd + S = Save
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                handleSave(false);
            }
            
            // Ctrl/Cmd + Enter = Validate & Next
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                handleSave(true);
            }
            
            // Ctrl/Cmd + → = Next document
            if ((e.ctrlKey || e.metaKey) && e.key === 'ArrowRight') {
                e.preventDefault();
                goToNext();
            }
            
            // Ctrl/Cmd + ← = Previous document
            if ((e.ctrlKey || e.metaKey) && e.key === 'ArrowLeft') {
                e.preventDefault();
                goToPrevious();
            }

            // Escape = Close
            if (e.key === 'Escape') {
                e.preventDefault();
                router.push('/documents/en-attente');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [saving, currentIndex, pendingDocIds.length]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (id) {
            fetchDocumentAndUrl();
            fetchAccounts();
            fetchPendingList();
        }
        return () => {
            if (viewUrl && viewUrl.startsWith('blob:')) {
                URL.revokeObjectURL(viewUrl);
            }
        };
        }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

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
            const docRes = await fetch(`${API_BASE_URL}/api/v1/documents/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!docRes.ok) throw new Error("Document non trouvé");
            const doc = await docRes.json();
            setDocumentData(doc as DocumentInfo);

            const docType = doc.type || "INVOICE_PURCHASE";
            const defaultJournal = docType === "INVOICE_SALES" ? "VTE" : "ACH";

            // Récupérer le compte tiers automatiquement depuis les données extraites
            // Priorité: 1) Règle appliquée, 2) Fournisseur détecté, 3) Compte par défaut
            let autoAccountNumber = "";
            const aiData = doc.ai_extracted_data;

            if (aiData?.applied_rule?.tiers_account) {
                // Compte tiers de la règle d'imputation
                autoAccountNumber = aiData.applied_rule.tiers_account;
            } else if (aiData?.applied_rule?.supplier_account) {
                // Compte fournisseur de la règle
                autoAccountNumber = aiData.applied_rule.supplier_account;
            } else if (aiData?.supplier_detection?.supplier?.auxiliary_account_code) {
                // Compte auxiliaire du fournisseur détecté
                autoAccountNumber = aiData.supplier_detection.supplier.auxiliary_account_code;
            } else if (docType === "INVOICE_SALES") {
                // Défaut pour ventes
                autoAccountNumber = "411000";
            } else {
                // Défaut pour achats
                autoAccountNumber = "401000";
            }

            // Récupérer le taux TVA depuis les données extraites
            const autoVatRate = aiData?.applied_rule?.vat_rate || doc.ocr_data?.vat_rate || 18;

            setFormData({
                supplier_name: doc.supplier_name || "",
                date: doc.document_date || "",  // Ne pas utiliser la date d'aujourd'hui par défaut - indiquer que l'OCR n'a pas trouvé
                due_date: doc.due_date || "",
                amount_ht: doc.amount_ht || 0,
                amount_vat: doc.amount_vat || 0,
                amount_ttc: doc.amount_ttc || 0,
                reference_number: doc.reference_number || "",
                account_number: autoAccountNumber,
                journal_code: aiData?.applied_rule?.journal_code || defaultJournal,
                description: doc.supplier_name ? `Facture ${doc.supplier_name}` : "Facture",
                document_type: docType as ValidationFormData['document_type'],
                vat_rate: autoVatRate
            });

            // Calculate confidence scores
            updateFieldConfidence(doc);

            try {
                const urlRes = await fetch(`${API_BASE_URL}/api/v1/documents/${id}/view-url`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                let fileUrl = "";
                if (urlRes.ok) {
                    const data = await urlRes.json();
                    fileUrl = data.view_url;
                } else {
                    fileUrl = `${API_BASE_URL}/api/v1/documents/${id}/download`;
                }

                const fileRes = await fetch(fileUrl, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                if (fileRes.ok) {
                    const blob = await fileRes.blob();
                    const blobUrl = URL.createObjectURL(blob);
                    setViewUrl(blobUrl);
                } else {
                    setViewUrl(fileUrl);
                }
            } catch (urlErr) {
                console.error("Error fetching file blob:", urlErr);
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

    const [isDuplicateError, setIsDuplicateError] = useState(false);
    const [showDuplicateModal, setShowDuplicateModal] = useState(false);
    const [duplicateInfo, setDuplicateInfo] = useState<{ newDocId: string; existingDocId: string } | null>(null);

    // Récupérer les infos du doublon pour redirection
    const fetchDuplicateInfo = async (documentId: string) => {
        const token = localStorage.getItem("seka_access_token");
        if (!token) return;

        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/duplicates/pending`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                const duplicates = await response.json();
                const duplicate = duplicates.find(
                    (d: { new_document: { id: string } }) => d.new_document.id === documentId
                );

                if (duplicate) {
                    setDuplicateInfo({
                        newDocId: duplicate.new_document.id,
                        existingDocId: duplicate.existing_document.id
                    });
                }
            }
        } catch (error) {
            console.error("Error fetching duplicate info:", error);
        }
    };

    const handleSave = async (validateAndNext = false) => {
        setSaving(true);
        setError(null);
        setIsDuplicateError(false);
        setShowDuplicateModal(false);
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
                const errorMessage = errData.detail || "Erreur lors de la validation";

                // Détecter si c'est une erreur de doublon
                if (response.status === 422 && errorMessage.toLowerCase().includes("doublon")) {
                    setIsDuplicateError(true);
                    setShowDuplicateModal(true);
                    setError("Ce document a été détecté comme un doublon potentiel. Vous devez d'abord résoudre ce doublon avant de pouvoir valider.");
                    // Récupérer les infos du doublon pour permettre la redirection
                    if (typeof id === 'string') {
                        fetchDuplicateInfo(id);
                    }
                } else {
                    setError(errorMessage);
                }
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
                            {/* Quick Actions Menu */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowQuickActions(!showQuickActions)}
                                    className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                                    title="Actions rapides"
                                >
                                    <MoreVertical className="h-5 w-5" />
                                </button>
                                {showQuickActions && (
                                    <>
                                        <div 
                                            className="fixed inset-0 z-10" 
                                            onClick={() => setShowQuickActions(false)}
                                        />
                                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                                            <button
                                                onClick={() => {
                                                    // Copy current formData as template
                                                    const template = { ...formData };
                                                    localStorage.setItem('invoice_template', JSON.stringify(template));
                                                    alert('Template sauvegardé !');
                                                    setShowQuickActions(false);
                                                }}
                                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                            >
                                                <Copy className="h-4 w-4" />
                                                Copier comme template
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    if (confirm('Archiver ce document ?')) {
                                                        // Archive logic here
                                                        setShowQuickActions(false);
                                                    }
                                                }}
                                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                            >
                                                <Archive className="h-4 w-4" />
                                                Archiver
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    if (confirm('Rejeter ce document ?')) {
                                                        const token = localStorage.getItem('seka_access_token');
                                                        if (token && id) {
                                                            await fetch(`${API_BASE_URL}/api/v1/documents/${id}`, {
                                                                method: 'DELETE',
                                                                headers: { Authorization: `Bearer ${token}` }
                                                            });
                                                            goToNext();
                                                        }
                                                        setShowQuickActions(false);
                                                    }
                                                }}
                                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                                Rejeter
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                            <button
                                onClick={() => router.push("/documents/en-attente")}
                                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                                title="Fermer (Esc)"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    {/* Message d'erreur si présent */}
                    {error && (
                        <div className={`mx-6 mt-4 p-3 rounded-lg border ${isDuplicateError ? 'bg-amber-50 border-amber-300' : 'bg-red-50 border-red-200'}`}>
                            <div className="flex items-start gap-2">
                                <AlertCircle className={`h-5 w-5 flex-shrink-0 mt-0.5 ${isDuplicateError ? 'text-amber-600' : 'text-red-600'}`} />
                                <div className="flex-1">
                                    <p className={`text-sm font-medium ${isDuplicateError ? 'text-amber-800' : 'text-red-700'}`}>
                                        {isDuplicateError ? 'Doublon détecté' : 'Erreur'}
                                    </p>
                                    <p className={`text-sm mt-1 ${isDuplicateError ? 'text-amber-700' : 'text-red-600'}`}>
                                        {error}
                                    </p>
                                    {isDuplicateError && (
                                        <button
                                            onClick={() => router.push('/documents/doublons')}
                                            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors"
                                        >
                                            <AlertCircle className="h-4 w-4" />
                                            Résoudre le doublon
                                        </button>
                                    )}
                                </div>
                            </div>
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
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Type de document</label>
                                        <select
                                            value={formData.document_type}
                                            onChange={(e) => {
                                                const type = e.target.value as ValidationFormData['document_type'];
                                                const journal = type === 'INVOICE_SALES' ? 'VTE' : 'ACH';
                                                setFormData({ ...formData, document_type: type, journal_code: journal });
                                            }}
                                            className="w-full text-sm border-gray-300 rounded-md focus:ring-[#1e3a5f] focus:border-[#1e3a5f]"
                                        >
                                            <option value="INVOICE_PURCHASE">Facture d&apos;achat</option>
                                            <option value="INVOICE_SALES">Facture de vente</option>
                                            <option value="EXPENSE_REPORT">Note de frais</option>
                                            <option value="OTHER">Autre</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-gray-700 mb-1 flex items-center justify-between">
                                            <span>Nom du fournisseur/client</span>
                                            {fieldConfidence.supplier_name && (
                                                <ConfidenceIndicator 
                                                    level={fieldConfidence.supplier_name.level}
                                                    score={fieldConfidence.supplier_name.score}
                                                    size="sm"
                                                    tooltip={fieldConfidence.supplier_name.reasons.join(', ')}
                                                />
                                            )}
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.supplier_name}
                                            onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                                            className={`w-full text-sm rounded-md focus:ring-[#1e3a5f] focus:border-[#1e3a5f] ${
                                                fieldConfidence.supplier_name?.level === 'low' ? 'border-red-300 bg-red-50' :
                                                fieldConfidence.supplier_name?.level === 'medium' ? 'border-orange-300 bg-orange-50' :
                                                'border-gray-300'
                                            }`}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Compte Tiers</label>
                                        <AccountAutocomplete
                                            value={formData.account_number}
                                            onChange={(val) => setFormData({ ...formData, account_number: val })}
                                            accounts={accounts.filter(a => 
                                                formData.document_type === 'INVOICE_SALES' 
                                                    ? a.code.startsWith('411') 
                                                    : a.code.startsWith('401')
                                            )}
                                            placeholder={formData.document_type === 'INVOICE_SALES' ? "411..." : "401..."}
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
                                            <option value="VTE">VTE - Ventes</option>
                                            <option value="BQ">BQ - Banque</option>
                                            <option value="BQ1">BQ1 - Banque principale</option>
                                            <option value="BQ2">BQ2 - Banque secondaire</option>
                                            <option value="CA">CA - Caisse</option>
                                            <option value="OD">OD - Opérations Diverses</option>
                                            <option value="AN">AN - À Nouveaux</option>
                                            <option value="SAL">SAL - Salaires</option>
                                            <option value="NDF">NDF - Notes de frais</option>
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
                                    <label className="text-xs font-medium text-gray-700 mb-1 flex items-center justify-between">
                                        <span>Date d&apos;émission</span>
                                        {fieldConfidence.date && (
                                            <ConfidenceIndicator 
                                                level={fieldConfidence.date.level}
                                                score={fieldConfidence.date.score}
                                                size="sm"
                                                tooltip={fieldConfidence.date.reasons.join(', ')}
                                            />
                                        )}
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        className={`w-full text-sm rounded-md ${
                                            fieldConfidence.date?.level === 'low' ? 'border-red-300 bg-red-50' :
                                            fieldConfidence.date?.level === 'medium' ? 'border-orange-300 bg-orange-50' :
                                            'border-gray-300'
                                        }`}
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
                                    <label className="text-xs font-medium text-gray-700 mb-1 flex items-center justify-between">
                                        <span>Référence Pièce / Facture N°</span>
                                        {fieldConfidence.reference_number && (
                                            <ConfidenceIndicator 
                                                level={fieldConfidence.reference_number.level}
                                                score={fieldConfidence.reference_number.score}
                                                size="sm"
                                                tooltip={fieldConfidence.reference_number.reasons.join(', ')}
                                            />
                                        )}
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.reference_number}
                                        onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                                        className={`w-full text-sm rounded-md ${
                                            fieldConfidence.reference_number?.level === 'low' ? 'border-red-300 bg-red-50' :
                                            fieldConfidence.reference_number?.level === 'medium' ? 'border-orange-300 bg-orange-50' :
                                            'border-gray-300'
                                        }`}
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
                                    <label className="text-xs font-medium text-gray-700 mb-1 flex items-center justify-between">
                                        <span>HT</span>
                                        {fieldConfidence.amount_ht && (
                                            <ConfidenceIndicator 
                                                level={fieldConfidence.amount_ht.level}
                                                score={fieldConfidence.amount_ht.score}
                                                size="sm"
                                                showLabel={false}
                                            />
                                        )}
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.amount_ht}
                                        onChange={(e) => setFormData({ ...formData, amount_ht: parseFloat(e.target.value) || 0 })}
                                        className={`w-full text-sm rounded-md text-right ${
                                            fieldConfidence.amount_ht?.level === 'low' ? 'border-red-300 bg-red-50' :
                                            fieldConfidence.amount_ht?.level === 'medium' ? 'border-orange-300 bg-orange-50' :
                                            'border-gray-300'
                                        }`}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-700 mb-1 flex items-center justify-between">
                                        <span>TVA</span>
                                        {fieldConfidence.amount_vat && (
                                            <ConfidenceIndicator 
                                                level={fieldConfidence.amount_vat.level}
                                                score={fieldConfidence.amount_vat.score}
                                                size="sm"
                                                showLabel={false}
                                            />
                                        )}
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.amount_vat}
                                        onChange={(e) => setFormData({ ...formData, amount_vat: parseFloat(e.target.value) || 0 })}
                                        className={`w-full text-sm rounded-md text-right ${
                                            fieldConfidence.amount_vat?.level === 'low' ? 'border-red-300 bg-red-50' :
                                            fieldConfidence.amount_vat?.level === 'medium' ? 'border-orange-300 bg-orange-50' :
                                            'border-gray-300'
                                        }`}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-700 mb-1 flex items-center justify-between">
                                        <span>TTC</span>
                                        {fieldConfidence.amount_ttc && (
                                            <ConfidenceIndicator 
                                                level={fieldConfidence.amount_ttc.level}
                                                score={fieldConfidence.amount_ttc.score}
                                                size="sm"
                                                showLabel={false}
                                            />
                                        )}
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.amount_ttc}
                                        onChange={(e) => setFormData({ ...formData, amount_ttc: parseFloat(e.target.value) || 0 })}
                                        className={`w-full text-sm rounded-md font-bold bg-gray-50 text-right ${
                                            fieldConfidence.amount_ttc?.level === 'low' ? 'border-red-300' :
                                            fieldConfidence.amount_ttc?.level === 'medium' ? 'border-orange-300' :
                                            'border-gray-300'
                                        }`}
                                    />
                                </div>
                            </div>
                        </div>

                        <hr className="border-gray-200 my-4" />

                        {/* ÉCRITURES GÉNÉRÉES - SECTION CRITIQUE */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-gray-400" /> 
                                    ÉCRITURES GÉNÉRÉES
                                </h3>
                                <button
                                    onClick={generateAccountingEntries}
                                    disabled={generatingEntries}
                                    className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 disabled:opacity-50"
                                >
                                    {generatingEntries ? (
                                        <>
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                            Génération...
                                        </>
                                    ) : (
                                        <>
                                            <Zap className="w-3 h-3" />
                                            Re-générer les écritures
                                        </>
                                    )}
                                </button>
                            </div>

                            {accountingEntries.length > 0 ? (
                                <div className="border border-gray-200 rounded-lg overflow-hidden">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jrnl</th>
                                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Compte</th>
                                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Libellé</th>
                                                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Débit</th>
                                                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Crédit</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {accountingEntries.map((entry, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50">
                                                    <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900">{entry.journal}</td>
                                                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                                                        {new Date(entry.date).toLocaleDateString('fr-FR')}
                                                    </td>
                                                    <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                                                        {entry.account}
                                                        {entry.account.startsWith('401') && <span className="ml-1 text-gray-400">[F]</span>}
                                                        {entry.account.startsWith('411') && <span className="ml-1 text-gray-400">[C]</span>}
                                                    </td>
                                                    <td className="px-3 py-2 text-xs text-gray-700">{entry.label}</td>
                                                    <td className="px-3 py-2 whitespace-nowrap text-xs text-right font-medium text-gray-900">
                                                        {entry.debit > 0 ? entry.debit.toLocaleString('fr-FR') : '-'}
                                                    </td>
                                                    <td className="px-3 py-2 whitespace-nowrap text-xs text-right font-medium text-gray-900">
                                                        {entry.credit > 0 ? entry.credit.toLocaleString('fr-FR') : '-'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                                            <tr>
                                                <td colSpan={4} className="px-3 py-2 text-xs font-bold text-gray-900 text-right">TOTAL</td>
                                                <td className="px-3 py-2 whitespace-nowrap text-xs text-right font-bold text-gray-900">
                                                    {accountingEntries.reduce((sum, e) => sum + e.debit, 0).toLocaleString('fr-FR')}
                                                </td>
                                                <td className="px-3 py-2 whitespace-nowrap text-xs text-right font-bold text-gray-900">
                                                    {accountingEntries.reduce((sum, e) => sum + e.credit, 0).toLocaleString('fr-FR')}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                    
                                    {/* Validation Balance */}
                                    <div className="px-3 py-2 bg-green-50 border-t border-green-200">
                                        <div className="flex items-center gap-2 text-xs text-green-700">
                                            <CheckCircle className="w-4 h-4" />
                                            <span className="font-medium">
                                                Écritures équilibrées
                                            </span>
                                            {accountingEntries.reduce((sum, e) => sum + e.debit, 0) === 
                                             accountingEntries.reduce((sum, e) => sum + e.credit, 0) && (
                                                <span className="ml-auto">
                                                    ✓ Débit = Crédit
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center text-gray-500 text-sm">
                                    <FileText className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                    <p>Les écritures seront générées automatiquement</p>
                                    <p className="text-xs mt-1">Remplissez les montants et le compte tiers</p>
                                </div>
                            )}

                            {/* Règle fournisseur appliquée */}
                            {supplierRule && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                    <div className="flex items-start gap-2">
                                        <Zap className="w-4 h-4 text-blue-600 mt-0.5" />
                                        <div className="flex-1">
                                            <p className="text-xs font-medium text-blue-900">RÈGLE FOURNISSEUR APPLIQUÉE</p>
                                            <p className="text-xs text-blue-700 mt-1">
                                                {supplierRule.supplier_name} → {supplierRule.charge_account} (Charge) + {supplierRule.vat_account} (TVA {supplierRule.vat_rate}%) + {supplierRule.supplier_account} (Fournisseur)
                                            </p>
                                            <button className="text-xs text-blue-600 hover:text-blue-800 mt-1 underline">
                                                Modifier la règle
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                    </div>

                    {/* Footer Actions */}
                    <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                        <div className="flex items-center justify-between mb-2">
                            <button
                                className="text-gray-600 hover:text-gray-900 text-sm font-medium"
                                onClick={() => router.push("/documents/en-attente")}
                            >
                                Annuler
                            </button>
                            <div className="flex gap-3">
                                {/* Bouton Sauvegarder (sans valider) */}
                                <button
                                    onClick={() => handleSave(false)}
                                    disabled={saving}
                                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium flex items-center gap-2 disabled:opacity-50"
                                    title="Ctrl/Cmd + S"
                                >
                                    <Save className="h-4 w-4" />
                                    Enregistrer
                                </button>
                                {/* Bouton Valider et Suivant */}
                                <button
                                    onClick={() => handleSave(true)}
                                    disabled={saving || pendingDocIds.length === 0}
                                    className="px-5 py-2 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#172e4d] text-sm font-medium flex items-center gap-2 shadow-sm disabled:opacity-50"
                                    title="Ctrl/Cmd + Enter"
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
                        {/* Keyboard shortcuts hint */}
                        <div className="text-xs text-gray-500 flex gap-4 pt-2 border-t border-gray-200">
                            <span><kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-xs">Ctrl+S</kbd> Enregistrer</span>
                            <span><kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-xs">Ctrl+↵</kbd> Valider</span>
                            <span><kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-xs">Ctrl+←→</kbd> Navigation</span>
                            <span><kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-xs">Esc</kbd> Fermer</span>
                        </div>
                    </div>

                </div>
            </div>

            {/* Modal Popup pour Doublon */}
            {showDuplicateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowDuplicateModal(false)}>
                    <div
                        className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header rouge */}
                        <div className="bg-red-600 px-6 py-4 flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-full">
                                <AlertCircle className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">Doublon Détecté</h3>
                                <p className="text-red-100 text-sm">Action requise avant validation</p>
                            </div>
                        </div>

                        {/* Contenu */}
                        <div className="p-6">
                            <p className="text-gray-700 mb-4">
                                Ce document a été identifié comme un <strong>doublon potentiel</strong> d&apos;une facture existante.
                            </p>
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                                <p className="text-amber-800 text-sm">
                                    <strong>Attention :</strong> Vous devez résoudre ce doublon avant de pouvoir valider cette facture.
                                    Cela garantit l&apos;intégrité de votre comptabilité.
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={() => {
                                        if (duplicateInfo) {
                                            router.push(`/documents/confrontation?new=${duplicateInfo.newDocId}&existing=${duplicateInfo.existingDocId}`);
                                        } else {
                                            router.push('/documents/doublons');
                                        }
                                    }}
                                    className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                                >
                                    <AlertCircle className="h-5 w-5" />
                                    Résoudre le doublon maintenant
                                </button>
                                <button
                                    onClick={() => setShowDuplicateModal(false)}
                                    className="w-full py-2 text-gray-600 hover:text-gray-800 text-sm"
                                >
                                    Fermer et revenir au document
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
