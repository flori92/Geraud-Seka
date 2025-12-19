import { useState } from "react";
import Head from "next/head";
import { PennylaneSidebar } from "@/components/layout/PennylaneSidebar";
import { useToast } from "@/components/ui/ToastContainer";
import { API_BASE_URL } from "@/lib/api";
import { Download, FileSpreadsheet, FileText, Code, Loader2, Info } from "lucide-react";

export default function ExportsPage() {
    const { success, error: showError } = useToast();
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

            const response = await fetch(`${API_BASE_URL}/api/v1/exports/sage?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) throw new Error("Export failed");

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `export_sage_${startDate || "all"}_${endDate || "all"}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            success("Export téléchargé avec succès !");
        } catch (error: unknown) {
            console.error(error);
            showError("Erreur lors de l'export");
        } finally {
            setExporting(false);
        }
    };

    return (
        <>
            <Head>
                <title>Exports - SEKA</title>
            </Head>
            <div className="min-h-screen bg-gray-50">
                <PennylaneSidebar />
                <main className="ml-[220px]">
                    <div className="bg-white border-b border-gray-200 px-6 py-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-gray-100">
                                <Download className="h-5 w-5 text-gray-600" />
                            </div>
                            <div>
                                <h1 className="text-xl font-semibold text-gray-900">Exports</h1>
                                <p className="text-sm text-gray-600 mt-0.5">Téléchargez vos écritures comptables au format Sage/SAARI</p>
                            </div>
                        </div>
                    </div>

                    <div className="px-6 py-6 space-y-6">
                        <div className="grid gap-6 md:grid-cols-2">
                            {/* Export Sage */}
                            <div className="bg-white rounded-lg border border-gray-200 p-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-1">Export Sage/SAARI</h2>
                                <p className="text-sm text-gray-600 mb-6">Générer un fichier CSV compatible avec Sage et SAARI.</p>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Date de début (optionnel)</label>
                                        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Date de fin (optionnel)</label>
                                        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]" />
                                    </div>
                                    <button onClick={handleExportSage} disabled={exporting}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#1e3a5f] text-white text-sm font-medium rounded-lg hover:bg-[#172e4d] disabled:opacity-50">
                                        {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                                        Télécharger Export CSV
                                    </button>
                                </div>

                                <div className="mt-6 rounded-lg bg-gray-50 p-4">
                                    <h3 className="mb-2 text-sm font-medium text-gray-900">Format du fichier</h3>
                                    <ul className="space-y-1 text-xs text-gray-600">
                                        <li>• Séparateur : point-virgule (;)</li>
                                        <li>• Colonnes : DatePiece, Journal, Compte, Libelle, Debit, Credit, Ref_piece, DateEcheance</li>
                                        <li>• Encodage : UTF-8</li>
                                    </ul>
                                </div>
                            </div>

                            {/* Autres formats */}
                            <div className="bg-white rounded-lg border border-gray-200 p-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-1">Autres formats</h2>
                                <p className="text-sm text-gray-600 mb-6">Prochainement disponibles</p>

                                <div className="space-y-3">
                                    <button disabled className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-400 border border-gray-100 rounded-lg cursor-not-allowed">
                                        <FileSpreadsheet className="h-5 w-5" /> <span>Export Excel (.xlsx)</span>
                                    </button>
                                    <button disabled className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-400 border border-gray-100 rounded-lg cursor-not-allowed">
                                        <FileText className="h-5 w-5" /> <span>Export PDF</span>
                                    </button>
                                    <button disabled className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-400 border border-gray-100 rounded-lg cursor-not-allowed">
                                        <Code className="h-5 w-5" /> <span>API REST</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Astuce */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex gap-3">
                                <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h3 className="font-medium text-gray-900">Astuce</h3>
                                    <p className="mt-1 text-sm text-gray-600">
                                        Laissez les dates vides pour exporter toutes les écritures comptables.
                                        Vous pouvez ensuite filtrer dans votre logiciel comptable.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}
