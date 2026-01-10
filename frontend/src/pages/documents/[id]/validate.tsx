import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { DashboardLayout } from "@/components/DashboardLayout";
import { getDocument, validateDocument, type Document, API_BASE_URL } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/ToastContainer";
import { ShoppingCart, Receipt, Loader2 } from "lucide-react";

type DocumentTypeChoice = "INVOICE_PURCHASE" | "INVOICE_SALES";

export default function ValidateDocumentPage() {
    const router = useRouter();
    const { id } = router.query;
    const { success, error: showError } = useToast();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [document, setDocument] = useState<Document | null>(null);
    const [documentViewUrl, setDocumentViewUrl] = useState<string | null>(null);

    const [referenceNumber, setReferenceNumber] = useState("");
    const [date, setDate] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [supplier, setSupplier] = useState("");
    const [amountHT, setAmountHT] = useState("");
    const [amountVAT, setAmountVAT] = useState("");
    const [amountTTC, setAmountTTC] = useState("");
    const [description, setDescription] = useState("");
    const [documentType, setDocumentType] = useState<DocumentTypeChoice>("INVOICE_PURCHASE");

    useEffect(() => {
        if (!id) return;

        const fetchDocument = async () => {
            const token = localStorage.getItem("seka_access_token");
            if (!token) {
                setError("Vous devez être connecté");
                setLoading(false);
                return;
            }

            try {
                const data = await getDocument(id as string, token);
                setDocument(data);

                // Charger le document via fetch et créer un blob URL
                if (data.file_path) {
                    try {
                        const fileResponse = await fetch(
                            `${API_BASE_URL}/api/v1/documents/download/${encodeURIComponent(data.file_path)}`,
                            {
                                headers: { Authorization: `Bearer ${token}` }
                            }
                        );
                        if (fileResponse.ok) {
                            const blob = await fileResponse.blob();
                            const blobUrl = URL.createObjectURL(blob);
                            setDocumentViewUrl(blobUrl);
                        }
                    } catch (e) {
                        console.warn("Impossible de charger le document", e);
                    }
                }

                const ocr = (data.ocr_data ?? {}) as Record<string, unknown>;
                const ocrStr = (key: string) => {
                    const v = ocr[key];
                    return typeof v === "string" ? v : "";
                };
                const ocrNum = (key: string) => {
                    const v = ocr[key];
                    if (typeof v === "number") return v;
                    if (typeof v === "string") {
                        const normalized = v.replace(/\s/g, "").replace(",", ".");
                        const n = parseFloat(normalized);
                        return Number.isFinite(n) ? n : undefined;
                    }
                    return undefined;
                };

                setReferenceNumber(data.reference_number || ocrStr("reference_number") || "");
                setDate(data.date || ocrStr("date") || "");
                setDueDate(data.due_date || ocrStr("due_date") || "");
                setSupplier(data.supplier_name || ocrStr("supplier_name") || "");
                setAmountHT((data.amount_ht ?? ocrNum("amount_ht"))?.toString() || "");
                setAmountVAT((data.amount_vat ?? ocrNum("amount_vat"))?.toString() || "");
                setAmountTTC((data.amount_ttc ?? ocrNum("amount_ttc"))?.toString() || "");
                setDescription(data.description || `Document ${data.filename}`);

                if (data.type === "INVOICE_SALES") {
                    setDocumentType("INVOICE_SALES");
                } else if (data.type === "INVOICE_PURCHASE") {
                    setDocumentType("INVOICE_PURCHASE");
                } else {
                    const classification = (ocr as Record<string, unknown>)["classification"] as Record<string, unknown> | undefined;
                    if (classification?.invoice_type === "SALE") {
                        setDocumentType("INVOICE_SALES");
                    } else {
                        setDocumentType("INVOICE_PURCHASE");
                    }
                }

                setError(null);
            } catch (err: unknown) {
                console.error("Failed to fetch document", err);
                const e = err as { response?: { data?: { detail?: string } } };
                setError(e.response?.data?.detail || "Erreur lors du chargement du document");
            } finally {
                setLoading(false);
            }
        };

        fetchDocument();
    }, [id]);

    const handleValidate = async () => {
        const token = localStorage.getItem("seka_access_token");
        if (!token || !id) return;


        if (!supplier || !supplier.trim()) {
            showError("Le nom du fournisseur est requis");
            return;
        }

        if (!date) {
            showError("La date du document est requise");
            return;
        }

        const amountHTNum = Number(amountHT) || 0;
        const amountVATNum = Number(amountVAT) || 0;
        const amountTTCNum = Number(amountTTC) || 0;

        if (amountTTCNum <= 0 && amountHTNum <= 0) {
            showError("Au moins un montant (HT ou TTC) doit être renseigné");
            return;
        }

        setSaving(true);
        try {
            await validateDocument(id as string, {
                reference_number: referenceNumber || undefined,
                date,
                due_date: dueDate || undefined,
                supplier_name: supplier.trim(),
                amount_ht: amountHTNum > 0 ? amountHTNum : undefined,
                amount_vat: amountVATNum > 0 ? amountVATNum : undefined,
                amount_ttc: amountTTCNum > 0 ? amountTTCNum : undefined,
                description: description || `Document ${document?.filename || ''}`,
            }, token);

            try {
                await fetch(`${API_BASE_URL}/api/v1/documents/${id}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ type: documentType })
                });
            } catch (patchError) {
                console.warn("Could not update document type:", patchError);
            }

            success("Document validé et comptabilisé avec succès !");

            if (documentType === "INVOICE_SALES") {
                router.push("/ventes/factures");
            } else {
                router.push("/achats/factures");
            }
        } catch (error: unknown) {
            console.error("[ERROR] Validation failed", error);
            const e = error as { response?: { data?: { detail?: string } }; message?: string };
            const errorMessage = e.response?.data?.detail || e.message || "Erreur lors de la validation";
            showError(errorMessage);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <DashboardLayout title="Validation du document">
                <div className="flex h-96 items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-accents-2 border-t-foreground"></div>
                </div>
            </DashboardLayout>
        );
    }

    if (error || !document) {
        return (
            <DashboardLayout title="Validation du document">
                <Card className="p-6">
                    <p className="text-error">{error || "Document introuvable"}</p>
                    <Button variant="secondary" className="mt-4" onClick={() => router.push("/documents")}>
                        Retour aux documents
                    </Button>
                </Card>
            </DashboardLayout>
        );
    }

    const getStatusBadge = (status: string) => {
        const statusMap: Record<string, { variant: "default" | "success" | "warning" | "error"; label: string }> = {
            PENDING: { variant: "default", label: "En attente" },
            OCR_PROCESSING: { variant: "warning", label: "Traitement IA" },
            OCR_COMPLETED: { variant: "success", label: "Traité par IA" },
            VALIDATED: { variant: "success", label: "Validé" },
            REJECTED: { variant: "error", label: "Rejeté" },
        };
        const config = statusMap[status] || { variant: "default" as const, label: status };
        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    return (
        <DashboardLayout title={`Validation - ${document.filename}`}>
            <div className="flex h-[calc(100vh-8rem)] gap-6">
                {/* Left: Document Preview */}
                <div className="flex-1 overflow-hidden rounded-lg border border-accents-2 bg-accents-1">
                    <div className="flex h-full items-center justify-center p-4">
                        {document.file_path ? (
                            documentViewUrl ? (
                                <iframe
                                    src={documentViewUrl}
                                    className="h-full w-full rounded border border-accents-2"
                                    title={document.filename}
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center text-accents-5">
                                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-accents-2 border-t-foreground mb-4"></div>
                                    <p>Chargement du document...</p>
                                </div>
                            )
                        ) : (
                            <div className="text-center text-accents-5">
                                <svg className="mx-auto h-16 w-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                                <p>Aperçu du document non disponible</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Validation Form */}
                <div className="w-96 flex-shrink-0 overflow-y-auto">
                    <Card className="h-full">
                        <div className="mb-6 flex items-center justify-between">
                            <h2 className="font-semibold text-foreground">Données extraites par IA</h2>
                            {getStatusBadge(document.status)}
                        </div>

                        <div className="space-y-4">
                            <Input
                                label="Numéro de référence"
                                value={referenceNumber}
                                onChange={(e) => setReferenceNumber(e.target.value)}
                                placeholder="Ex: INV-2025-001"
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label="Date du document"
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                />
                                <Input
                                    label="Date d'échéance"
                                    type="date"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                />
                            </div>

                            <Input
                                label="Fournisseur / Tiers"
                                value={supplier}
                                onChange={(e) => setSupplier(e.target.value)}
                                placeholder="Nom du fournisseur"
                            />

                            <div className="rounded-lg bg-accents-1 p-4">
                                <h3 className="text-sm font-medium text-foreground mb-3">Montants</h3>
                                <div className="space-y-3">
                                    <Input
                                        label="Montant HT"
                                        type="number"
                                        step="0.01"
                                        value={amountHT}
                                        onChange={(e) => setAmountHT(e.target.value)}
                                    />
                                    <Input
                                        label="TVA"
                                        type="number"
                                        step="0.01"
                                        value={amountVAT}
                                        onChange={(e) => setAmountVAT(e.target.value)}
                                    />
                                    <Input
                                        label="Montant TTC"
                                        type="number"
                                        step="0.01"
                                        value={amountTTC}
                                        onChange={(e) => setAmountTTC(e.target.value)}
                                        className="font-semibold"
                                    />
                                </div>
                            </div>

                            <Input
                                label="Libellé de l'écriture"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Description de la transaction"
                            />

                            {/* Document Type Selector */}
                            <div className="rounded-lg bg-accents-1 p-4">
                                <h3 className="text-sm font-medium text-foreground mb-3">Type de document</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setDocumentType("INVOICE_PURCHASE")}
                                        className={`flex items-center justify-center gap-2 px-3 py-3 rounded-lg border-2 transition-all ${documentType === "INVOICE_PURCHASE"
                                            ? "border-orange-500 bg-orange-50 text-orange-700"
                                            : "border-accents-2 bg-white text-accents-5 hover:border-accents-3"
                                            }`}
                                    >
                                        <ShoppingCart className="h-4 w-4" />
                                        <span className="text-sm font-medium">Achat</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setDocumentType("INVOICE_SALES")}
                                        className={`flex items-center justify-center gap-2 px-3 py-3 rounded-lg border-2 transition-all ${documentType === "INVOICE_SALES"
                                            ? "border-green-500 bg-green-50 text-green-700"
                                            : "border-accents-2 bg-white text-accents-5 hover:border-accents-3"
                                            }`}
                                    >
                                        <Receipt className="h-4 w-4" />
                                        <span className="text-sm font-medium">Vente</span>
                                    </button>
                                </div>
                                <p className="text-xs text-accents-5 mt-2">
                                    {documentType === "INVOICE_PURCHASE"
                                        ? "Facture fournisseur - apparaîtra dans Achats"
                                        : "Facture client - apparaîtra dans Ventes"
                                    }
                                </p>
                            </div>

                            <div className="pt-4 space-y-2">
                                <Button
                                    className="w-full"
                                    onClick={handleValidate}
                                    disabled={saving}
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Validation en cours...
                                        </>
                                    ) : (
                                        "Valider et Comptabiliser"
                                    )}
                                </Button>
                                <Button
                                    variant="secondary"
                                    className="w-full"
                                    onClick={() => router.push("/documents/en-attente")}
                                    disabled={saving}
                                >
                                    Annuler
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}
