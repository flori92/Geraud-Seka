import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { DashboardLayout } from "@/components/DashboardLayout";
import { validateDocument } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";

export default function ValidateDocumentPage() {
    const router = useRouter();
    const { id } = router.query;

    const [loading, setLoading] = useState(true);
    const [document, setDocument] = useState<any>(null);

    // Form state
    const [date, setDate] = useState("");
    const [supplier, setSupplier] = useState("");
    const [totalAmount, setTotalAmount] = useState("");
    const [taxAmount, setTaxAmount] = useState("");
    const [description, setDescription] = useState("");

    useEffect(() => {
        if (!id) return;

        // Mock fetch document
        setTimeout(() => {
            setDocument({
                id,
                filename: "Facture-Janvier.pdf",
                status: "OCR_PROCESSING",
                file_url: "https://via.placeholder.com/600x800.png?text=Document+Preview", // Placeholder
                extracted_data: {
                    date: "2025-01-15",
                    supplier: "Orange CI",
                    total: "150000",
                    tax: "27000",
                }
            });

            // Pre-fill form
            setDate("2025-01-15");
            setSupplier("Orange CI");
            setTotalAmount("150000");
            setTaxAmount("27000");
            setDescription("Facture Internet Janvier");

            setLoading(false);
        }, 1000);
    }, [id]);

    const handleValidate = async () => {
        const token = localStorage.getItem("seka_access_token");
        if (!token || !id) return;

        try {
            await validateDocument(id as string, {
                date,
                supplier_name: supplier,
                total_amount: Number(totalAmount),
                tax_amount: Number(taxAmount),
                description,
            }, token);

            alert("Document validé et écritures générées !");
            router.push("/documents");
        } catch (error) {
            console.error("Validation failed", error);
            alert("Erreur lors de la validation");
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex h-96 items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-accents-2 border-t-foreground"></div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title={`Validation - ${document.filename}`}>
            <div className="flex h-[calc(100vh-8rem)] gap-6">
                {/* Left: Document Preview */}
                <div className="flex-1 overflow-hidden rounded-lg border border-accents-2 bg-accents-1">
                    <div className="flex h-full items-center justify-center">
                        {/* In a real app, use an iframe or PDF viewer here */}
                        <img src={document.file_url} alt="Document Preview" className="max-h-full max-w-full object-contain" />
                    </div>
                </div>

                {/* Right: Validation Form */}
                <div className="w-96 flex-shrink-0 overflow-y-auto">
                    <Card className="h-full">
                        <div className="mb-6 flex items-center justify-between">
                            <h2 className="font-semibold text-foreground">Données extraites</h2>
                            <Badge variant="warning">A vérifier</Badge>
                        </div>

                        <div className="space-y-4">
                            <Input
                                label="Date de la pièce"
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                            />

                            <Input
                                label="Fournisseur / Tiers"
                                value={supplier}
                                onChange={(e) => setSupplier(e.target.value)}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label="Montant HT"
                                    type="number"
                                    value={Number(totalAmount) - Number(taxAmount)}
                                    disabled
                                    className="bg-accents-1"
                                />
                                <Input
                                    label="TVA"
                                    type="number"
                                    value={taxAmount}
                                    onChange={(e) => setTaxAmount(e.target.value)}
                                />
                            </div>

                            <Input
                                label="Montant TTC"
                                type="number"
                                value={totalAmount}
                                onChange={(e) => setTotalAmount(e.target.value)}
                                className="font-bold"
                            />

                            <Input
                                label="Libellé de l'écriture"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />

                            <div className="pt-4">
                                <Button className="w-full" onClick={handleValidate}>
                                    Valider et Comptabiliser
                                </Button>
                                <Button variant="ghost" className="mt-2 w-full text-error hover:bg-error-lighter hover:text-error-dark">
                                    Rejeter la pièce
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}
