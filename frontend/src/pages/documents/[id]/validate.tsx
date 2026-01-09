import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { DashboardLayout } from "@/components/DashboardLayout";
import { getDocument, validateDocument, type Document, API_BASE_URL } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/ToastContainer";

export default function ValidateDocumentPage() {
    const router = useRouter();
    const { id } = router.query;
    const { success, error: showError } = useToast();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [document, setDocument] = useState<Document | null>(null);

    const [referenceNumber, setReferenceNumber] = useState("");
    const [date, setDate] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [supplier, setSupplier] = useState("");
    const [amountHT, setAmountHT] = useState("");
    const [amountVAT, setAmountVAT] = useState("");
    const [amountTTC, setAmountTTC] = useState("");
    const [description, setDescription] = useState("");

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

                setError(null);
            } catch (err: any) {
                console.error("Failed to fetch document", err);
                setError(err.response?.data?.detail || "Erreur lors du chargement du document");
            } finally {
                setLoading(false);
            }
        };

        fetchDocument();
    }, [id]);

    const handleValidate = async () => {
        const token = localStorage.getItem("seka_access_token");
        if (!token || !id) return;

        try {
            await validateDocument(id as string, {
                reference_number: referenceNumber,
                date,
                due_date: dueDate,
                supplier_name: supplier,
                amount_ht: Number(amountHT) || 0,
                amount_vat: Number(amountVAT) || 0,
                amount_ttc: Number(amountTTC) || 0,
                description,
            }, token);

            success("Document validé avec succès !");
            router.push("/documents");
        } catch (error: any) {
            console.error("Validation failed", error);
            showError(error.response?.data?.detail || "Erreur lors de la validation");
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
                            <iframe
                                src={`${API_BASE_URL}/api/v1/documents/download/${encodeURIComponent(document.file_path)}`}
                                className="h-full w-full rounded border border-accents-2"
                                title={document.filename}
                            />
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

                            <div className="pt-4 space-y-2">
                                <Button className="w-full" onClick={handleValidate}>
                                    Valider et Comptabiliser
                                </Button>
                                <Button
                                    variant="secondary"
                                    className="w-full"
                                    onClick={() => router.push("/documents")}
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
