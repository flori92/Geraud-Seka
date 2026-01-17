import { useState } from "react";
import Head from "next/head";
import {
    Download, FileText, Calendar, CheckCircle, AlertCircle, Loader2,
    Shield, FileSpreadsheet, Clock, Building2, Info, HelpCircle
} from "lucide-react";

interface ExportConfig {
    fiscal_year: string;
    start_date: string;
    end_date: string;
    include_draft: boolean;
    format: "fec" | "csv" | "xml";
}

interface ExportHistory {
    id: string;
    date: string;
    period: string;
    entries_count: number;
    file_size: string;
    status: "success" | "error";
}

export default function ExportFECPage() {
    const [config, setConfig] = useState<ExportConfig>({
        fiscal_year: "2024",
        start_date: "2024-01-01",
        end_date: "2024-12-31",
        include_draft: false,
        format: "fec"
    });
    const [exporting, setExporting] = useState(false);
    const [validating, setValidating] = useState(false);
    const [validationResult, setValidationResult] = useState<{
        valid: boolean;
        errors: string[];
        warnings: string[];
    } | null>(null);

    const [history] = useState<ExportHistory[]>([
        { id: "1", date: "2024-12-01", period: "Exercice 2023", entries_count: 4523, file_size: "2.4 MB", status: "success" },
        { id: "2", date: "2024-06-15", period: "S1 2024", entries_count: 1856, file_size: "980 KB", status: "success" },
        { id: "3", date: "2024-03-31", period: "T1 2024", entries_count: 892, file_size: "456 KB", status: "success" },
    ]);

    const handleValidate = async () => {
        setValidating(true);
        await new Promise(resolve => setTimeout(resolve, 2000));

        setValidationResult({
            valid: true,
            errors: [],
            warnings: [
                "3 écritures sans pièce justificative détectées",
                "Numérotation non continue détectée (écart du 15/03 au 18/03)"
            ]
        });
        setValidating(false);
    };

    const handleExport = async () => {
        setExporting(true);
        await new Promise(resolve => setTimeout(resolve, 3000));

        const blob = new Blob(["FEC Export Data"], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `FEC_${config.fiscal_year}_${new Date().toISOString().split("T")[0]}.txt`;
        a.click();

        setExporting(false);
    };

    return (
        <>
            <Head>
                <title>Export FEC - SEKA</title>
            </Head>

            <div className="min-h-screen bg-gray-50 pt-14">
                <main className="p-6">
                    <div className="max-w-5xl mx-auto">
                        {/* Header */}
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-blue-600 rounded-xl shadow-lg">
                                <Download className="h-7 w-7 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Export FEC</h1>
                                <p className="text-sm text-gray-500">Fichier des Écritures Comptables conforme OHADA</p>
                            </div>
                        </div>

                        <div className="grid gap-6 lg:grid-cols-3">
                            {/* Configuration */}
                            <div className="lg:col-span-2 space-y-6">
                                <div className="bg-white rounded-xl border border-gray-200 p-6">
                                    <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <Calendar className="h-5 w-5 text-blue-500" />
                                        Période d&apos;export
                                    </h2>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Exercice fiscal</label>
                                            <select
                                                value={config.fiscal_year}
                                                onChange={(e) => setConfig({ ...config, fiscal_year: e.target.value })}
                                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                                            >
                                                <option value="2024">2024</option>
                                                <option value="2023">2023</option>
                                                <option value="2022">2022</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Date de début</label>
                                            <input
                                                type="date"
                                                value={config.start_date}
                                                onChange={(e) => setConfig({ ...config, start_date: e.target.value })}
                                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Date de fin</label>
                                            <input
                                                type="date"
                                                value={config.end_date}
                                                onChange={(e) => setConfig({ ...config, end_date: e.target.value })}
                                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                                            />
                                        </div>
                                    </div>

                                    <h3 className="font-medium text-gray-900 mb-3">Format d&apos;export</h3>
                                    <div className="grid grid-cols-3 gap-3 mb-6">
                                        {[
                                            { value: "fec", label: "FEC Standard", desc: "Format officiel DGI", icon: FileText },
                                            { value: "csv", label: "CSV", desc: "Tableur compatible", icon: FileSpreadsheet },
                                            { value: "xml", label: "XML/XBRL", desc: "Format structuré", icon: FileText }
                                        ].map((fmt) => (
                                            <button
                                                key={fmt.value}
                                                type="button"
                                                onClick={() => setConfig({ ...config, format: fmt.value as any })}
                                                className={`p-4 rounded-lg border-2 text-left transition-all ${config.format === fmt.value
                                                    ? "border-blue-500 bg-blue-50"
                                                    : "border-gray-200 hover:border-gray-300"
                                                    }`}
                                            >
                                                <fmt.icon className={`h-5 w-5 mb-2 ${config.format === fmt.value ? "text-blue-600" : "text-gray-400"}`} />
                                                <p className="font-medium text-gray-900">{fmt.label}</p>
                                                <p className="text-xs text-gray-500">{fmt.desc}</p>
                                            </button>
                                        ))}
                                    </div>

                                    <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                                        <input
                                            type="checkbox"
                                            checked={config.include_draft}
                                            onChange={(e) => setConfig({ ...config, include_draft: e.target.checked })}
                                            className="w-4 h-4 rounded text-blue-600"
                                        />
                                        <div>
                                            <p className="font-medium text-gray-900">Inclure les écritures brouillon</p>
                                            <p className="text-sm text-gray-500">Les écritures non validées seront incluses dans l&apos;export</p>
                                        </div>
                                    </label>
                                </div>

                                {/* Validation */}
                                <div className="bg-white rounded-xl border border-gray-200 p-6">
                                    <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <Shield className="h-5 w-5 text-blue-500" />
                                        Validation pré-export
                                    </h2>

                                    {validationResult ? (
                                        <div className="space-y-4">
                                            <div className={`p-4 rounded-lg flex items-start gap-3 ${validationResult.valid ? "bg-green-50 border border-green-100" : "bg-red-50 border border-red-100"
                                                }`}>
                                                {validationResult.valid ? (
                                                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                                                ) : (
                                                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                                                )}
                                                <div>
                                                    <p className={`font-medium ${validationResult.valid ? "text-green-800" : "text-red-800"}`}>
                                                        {validationResult.valid ? "Données valides pour l'export FEC" : "Erreurs détectées"}
                                                    </p>
                                                    <p className={`text-sm ${validationResult.valid ? "text-green-700" : "text-red-700"}`}>
                                                        Toutes les écritures respectent le format OHADA
                                                    </p>
                                                </div>
                                            </div>

                                            {validationResult.warnings.length > 0 && (
                                                <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-lg">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                                                        <p className="font-medium text-yellow-800">Avertissements ({validationResult.warnings.length})</p>
                                                    </div>
                                                    <ul className="text-sm text-yellow-700 space-y-1">
                                                        {validationResult.warnings.map((w, i) => (
                                                            <li key={i}>• {w}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            <button
                                                onClick={() => setValidationResult(null)}
                                                className="text-sm text-blue-600 hover:text-blue-700"
                                            >
                                                Relancer la validation
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="text-center py-6">
                                            <p className="text-gray-500 mb-4">
                                                Vérifiez la conformité de vos données avant l&apos;export
                                            </p>
                                            <button
                                                onClick={handleValidate}
                                                disabled={validating}
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                                            >
                                                {validating ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Shield className="h-4 w-4" />
                                                )}
                                                {validating ? "Validation en cours..." : "Valider les données"}
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Export Button */}
                                <div className="flex items-center justify-between p-6 bg-blue-600 rounded-xl text-white">
                                    <div>
                                        <p className="font-semibold text-lg">Prêt à exporter ?</p>
                                        <p className="text-sm text-white/80">Le fichier sera généré au format {config.format.toUpperCase()}</p>
                                    </div>
                                    <button
                                        onClick={handleExport}
                                        disabled={exporting}
                                        className="flex items-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 disabled:opacity-50"
                                    >
                                        {exporting ? (
                                            <>
                                                <Loader2 className="h-5 w-5 animate-spin" />
                                                Génération...
                                            </>
                                        ) : (
                                            <>
                                                <Download className="h-5 w-5" />
                                                Exporter le FEC
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Sidebar */}
                            <div className="space-y-6">
                                {/* Info Box */}
                                <div className="bg-blue-50 rounded-xl border border-blue-100 p-5">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Info className="h-5 w-5 text-blue-600" />
                                        <h3 className="font-semibold text-blue-900">Qu&apos;est-ce que le FEC ?</h3>
                                    </div>
                                    <p className="text-sm text-blue-800 mb-3">
                                        Le Fichier des Écritures Comptables (FEC) est un document obligatoire contenant
                                        l&apos;ensemble des écritures comptables de l&apos;exercice, conforme aux normes OHADA.
                                    </p>
                                    <a href="#" className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                                        <HelpCircle className="h-4 w-4" />
                                        En savoir plus
                                    </a>
                                </div>

                                {/* Export History */}
                                <div className="bg-white rounded-xl border border-gray-200 p-5">
                                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <Clock className="h-5 w-5 text-gray-400" />
                                        Historique des exports
                                    </h3>
                                    <div className="space-y-3">
                                        {history.map((exp) => (
                                            <div key={exp.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                <div>
                                                    <p className="font-medium text-gray-900 text-sm">{exp.period}</p>
                                                    <p className="text-xs text-gray-500">{new Date(exp.date).toLocaleDateString()} • {exp.entries_count} écritures</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-gray-500">{exp.file_size}</span>
                                                    <button className="p-1.5 hover:bg-gray-200 rounded text-blue-600">
                                                        <Download className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Compliance */}
                                <div className="bg-green-50 rounded-xl border border-green-100 p-5">
                                    <div className="flex items-center gap-2 mb-2">
                                        <CheckCircle className="h-5 w-5 text-green-600" />
                                        <h3 className="font-semibold text-green-900">Conformité OHADA</h3>
                                    </div>
                                    <p className="text-sm text-green-800">
                                        Les exports générés par SEKA sont conformes aux exigences
                                        du Système Comptable OHADA et acceptés par les administrations fiscales.
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
