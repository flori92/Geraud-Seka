import { useState } from "react";
import Head from "next/head";
import { useToast } from "@/components/ui/ToastContainer";
import { API_BASE_URL } from "@/lib/api";
import { Download, FileText, Loader2, Info, CheckCircle } from "lucide-react";

type ExportFormat = "perfecto" | "saari" | "sage";

export default function ExportsPage() {
    const { success, error: showError } = useToast();
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [journalType, setJournalType] = useState<string>("all");
    const [exporting, setExporting] = useState<ExportFormat | null>(null);
    const [lastExport, setLastExport] = useState<{format: string; date: string} | null>(null);

    const handleExport = async (format: ExportFormat) => {
        setExporting(format);
        const token = localStorage.getItem("seka_access_token");
        if (!token) return;

        try {
            const params = new URLSearchParams();
            if (startDate) params.append("start_date", startDate);
            if (endDate) params.append("end_date", endDate);
            if (journalType !== "all") params.append("journal_type", journalType);

            const response = await fetch(`${API_BASE_URL}/api/v1/exports/${format}?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) throw new Error("Export failed");

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            
            const ext = format === "perfecto" ? "txt" : "csv";
            const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
            a.download = `export_${format}_${dateStr}.${ext}`;
            
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            setLastExport({ format: format.toUpperCase(), date: new Date().toLocaleString("fr-FR") });
            success(`Export ${format.toUpperCase()} téléchargé avec succès !`);
        } catch (error: unknown) {
            console.error(error);
            showError("Erreur lors de l'export");
        } finally {
            setExporting(null);
        }
    };

    return (
        <>
            <Head>
                <title>Exports - SEKA</title>
            </Head>
            <div className="min-h-screen bg-gray-50 pt-14">
                <main className="p-6">
                    <div className="max-w-5xl mx-auto">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 rounded-lg bg-gray-100">
                                <Download className="h-6 w-6 text-gray-600" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Exports Comptables</h1>
                                <p className="text-sm text-gray-600">Exportez vos écritures vers Perfecto, SAARI ou Sage</p>
                            </div>
                        </div>

                        {/* Filtres */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Période d&apos;export</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Date de début</label>
                                    <input 
                                        type="date" 
                                        value={startDate} 
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Date de fin</label>
                                    <input 
                                        type="date" 
                                        value={endDate} 
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Journal</label>
                                    <select 
                                        value={journalType} 
                                        onChange={(e) => setJournalType(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                                    >
                                        <option value="all">Tous les journaux</option>
                                        <option value="ACH">Achats (ACH)</option>
                                        <option value="VEN">Ventes (VEN)</option>
                                        <option value="BQ">Banque (BQ)</option>
                                        <option value="OD">Opérations Diverses (OD)</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Formats d'export */}
                        <div className="grid gap-6 md:grid-cols-3">
                            {/* Export Perfecto */}
                            <div className="bg-white rounded-xl border-2 border-green-200 p-6 hover:shadow-lg transition-shadow">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 rounded-lg bg-green-100">
                                        <FileText className="h-5 w-5 text-green-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-gray-900">Perfecto</h2>
                                        <span className="text-xs text-green-600 font-medium">Recommandé</span>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-600 mb-4">Format .txt compatible avec le logiciel Perfecto utilisé au Bénin.</p>
                                
                                <div className="bg-gray-50 rounded-lg p-3 mb-4 text-xs text-gray-600">
                                    <p className="font-mono">DatePiece;Journal;Compte;Libelle;Debit;Credit;Ref;Echeance</p>
                                    <p className="mt-1">Format date: JJ/MM/AAAA</p>
                                </div>

                                <button 
                                    onClick={() => handleExport("perfecto")} 
                                    disabled={exporting !== null}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                                >
                                    {exporting === "perfecto" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                                    Exporter Perfecto
                                </button>
                            </div>

                            {/* Export SAARI */}
                            <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 rounded-lg bg-blue-100">
                                        <FileText className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <h2 className="text-lg font-semibold text-gray-900">SAARI</h2>
                                </div>
                                <p className="text-sm text-gray-600 mb-4">Format CSV compatible avec les logiciels SAARI/Sage.</p>
                                
                                <div className="bg-gray-50 rounded-lg p-3 mb-4 text-xs text-gray-600">
                                    <p className="font-mono">Date;Journal;Compte;Libelle;Debit;Credit;Ref;Echeance</p>
                                    <p className="mt-1">Séparateur: point-virgule</p>
                                </div>

                                <button 
                                    onClick={() => handleExport("saari")} 
                                    disabled={exporting !== null}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                >
                                    {exporting === "saari" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                                    Exporter SAARI
                                </button>
                            </div>

                            {/* Export Sage */}
                            <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 rounded-lg bg-purple-100">
                                        <FileText className="h-5 w-5 text-purple-600" />
                                    </div>
                                    <h2 className="text-lg font-semibold text-gray-900">Sage</h2>
                                </div>
                                <p className="text-sm text-gray-600 mb-4">Format CSV standard pour import dans Sage Comptabilité.</p>
                                
                                <div className="bg-gray-50 rounded-lg p-3 mb-4 text-xs text-gray-600">
                                    <p className="font-mono">DatePiece;Journal;Compte;Libelle;Debit;Credit</p>
                                    <p className="mt-1">Encodage: UTF-8</p>
                                </div>

                                <button 
                                    onClick={() => handleExport("sage")} 
                                    disabled={exporting !== null}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
                                >
                                    {exporting === "sage" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                                    Exporter Sage
                                </button>
                            </div>
                        </div>

                        {/* Dernier export */}
                        {lastExport && (
                            <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                    <span className="text-sm text-green-700">
                                        Dernier export: <strong>{lastExport.format}</strong> le {lastExport.date}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Info */}
                        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex gap-3">
                                <Info className="h-5 w-5 text-blue-600 flex-shrink-0" />
                                <div>
                                    <h3 className="font-medium text-gray-900">Conseil</h3>
                                    <p className="mt-1 text-sm text-gray-600">
                                        Seules les écritures validées sont exportées. Assurez-vous d&apos;avoir validé toutes vos factures avant l&apos;export.
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
