import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { API_BASE_URL } from "@/lib/api";

export default function ExportsPage() {
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [exporting, setExporting] = useState(false);

    const handleExportSage = async () => {
        setExporting(true);
        const token = localStorage.getItem("seka_access_token");
        if (!token) return;

        try {
            const params = new URLSearchParams();
            if (startDate) params.append("start_date", startDate);
            if (endDate) params.append("end_date", endDate);

            const response = await fetch(
                `${API_BASE_URL}/api/v1/exports/sage?${params}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                throw new Error("Export failed");
            }

            // Download the file
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `export_sage_${startDate || "all"}_${endDate || "all"}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            alert("Export téléchargé avec succès !");
        } catch (error) {
            console.error(error);
            alert("Erreur lors de l'export");
        } finally {
            setExporting(false);
        }
    };

    return (
        <DashboardLayout title="Exports">
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Exports</h1>
                    <p className="text-sm text-accents-5">Téléchargez vos écritures comptables au format Sage/SAARI.</p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                        <div className="mb-6">
                            <h2 className="text-lg font-semibold text-foreground">Export Sage/SAARI</h2>
                            <p className="mt-1 text-sm text-accents-5">
                                Générer un fichier CSV compatible avec Sage et SAARI.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <Input
                                label="Date de début (optionnel)"
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />

                            <Input
                                label="Date de fin (optionnel)"
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />

                            <Button
                                className="w-full"
                                onClick={handleExportSage}
                                loading={exporting}
                            >
                                Télécharger Export CSV
                            </Button>
                        </div>

                        <div className="mt-6 rounded-lg bg-accents-1 p-4">
                            <h3 className="mb-2 text-sm font-medium text-foreground">Format du fichier</h3>
                            <ul className="space-y-1 text-xs text-accents-5">
                                <li>• Séparateur : point-virgule (;)</li>
                                <li>• Colonnes : DatePiece, Journal, Compte, Libelle, Debit, Credit, Ref_piece, DateEcheance</li>
                                <li>• Encodage : UTF-8</li>
                            </ul>
                        </div>
                    </Card>

                    <Card>
                        <div className="mb-6">
                            <h2 className="text-lg font-semibold text-foreground">Autres formats</h2>
                            <p className="mt-1 text-sm text-accents-5">
                                Prochainement disponibles
                            </p>
                        </div>

                        <div className="space-y-3">
                            <Button variant="ghost" className="w-full justify-start" disabled>
                                <span className="opacity-50">Export Excel (.xlsx)</span>
                            </Button>
                            <Button variant="ghost" className="w-full justify-start" disabled>
                                <span className="opacity-50">Export PDF</span>
                            </Button>
                            <Button variant="ghost" className="w-full justify-start" disabled>
                                <span className="opacity-50">API REST</span>
                            </Button>
                        </div>
                    </Card>
                </div>

                <Card className="border-l-4 border-l-success bg-success-lighter">
                    <div className="flex gap-3">
                        <div className="text-2xl font-bold text-success">i</div>
                        <div>
                            <h3 className="font-medium text-foreground">Astuce</h3>
                            <p className="mt-1 text-sm text-accents-5">
                                Laissez les dates vides pour exporter toutes les écritures comptables.
                                Vous pouvez ensuite filtrer dans votre logiciel comptable.
                            </p>
                        </div>
                    </div>
                </Card>
            </div>
        </DashboardLayout>
    );
}
