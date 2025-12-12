import { useState, useRef } from "react";
import Head from "next/head";
import {
    Upload, FileText, Download, CheckCircle, AlertCircle, Loader2,
    FileSpreadsheet, X, Eye, Calendar, Building2, Trash2, RefreshCw
} from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

interface ParsedTransaction {
    id: string;
    date: string;
    description: string;
    amount: number;
    type: "credit" | "debit";
    reference?: string;
    balance?: number;
    isValid: boolean;
    error?: string;
}

interface ImportResult {
    total: number;
    valid: number;
    errors: number;
    duplicates: number;
}

export default function BankStatementImportPage() {
    const [file, setFile] = useState<File | null>(null);
    const [fileType, setFileType] = useState<"csv" | "ofx" | "">("");
    const [parsing, setParsing] = useState(false);
    const [importing, setImporting] = useState(false);
    const [transactions, setTransactions] = useState<ParsedTransaction[]>([]);
    const [result, setResult] = useState<ImportResult | null>(null);
    const [step, setStep] = useState<"upload" | "preview" | "result">("upload");
    const [bankAccount, setBankAccount] = useState("");
    const [dateFormat, setDateFormat] = useState("DD/MM/YYYY");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        const ext = selectedFile.name.split(".").pop()?.toLowerCase();
        setFileType(ext === "csv" ? "csv" : ext === "ofx" || ext === "qfx" ? "ofx" : "");

        // Parse file
        await parseFile(selectedFile);
    };

    const parseFile = async (file: File) => {
        setParsing(true);

        // Simulate parsing
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Mock parsed data
        const mockTransactions: ParsedTransaction[] = [
            { id: "1", date: "2024-12-10", description: "VIREMENT ENTRANT - CLIENT ABC SARL", amount: 1250000, type: "credit", reference: "VIR2024001", balance: 5750000, isValid: true },
            { id: "2", date: "2024-12-09", description: "PAIEMENT FOURNISSEUR XYZ", amount: 450000, type: "debit", reference: "CHQ789456", balance: 4500000, isValid: true },
            { id: "3", date: "2024-12-08", description: "FACTURE ELECTRICITE SBEE", amount: 87500, type: "debit", balance: 4950000, isValid: true },
            { id: "4", date: "2024-12-07", description: "RETRAIT DAB COTONOU", amount: 200000, type: "debit", balance: 5037500, isValid: true },
            { id: "5", date: "2024-12-05", description: "FRAIS BANCAIRES MENSUELS", amount: 15000, type: "debit", balance: 5237500, isValid: true },
            { id: "6", date: "12/13/2024", description: "FORMAT DATE INVALIDE", amount: 100000, type: "credit", isValid: false, error: "Format de date invalide" },
            { id: "7", date: "2024-12-04", description: "VIREMENT CLIENT DEF CORP", amount: 780000, type: "credit", reference: "VIR2024002", balance: 5252500, isValid: true },
        ];

        setTransactions(mockTransactions);
        setStep("preview");
        setParsing(false);
    };

    const handleImport = async () => {
        setImporting(true);

        // Simulate import
        await new Promise(resolve => setTimeout(resolve, 2000));

        const validCount = transactions.filter(t => t.isValid).length;
        setResult({
            total: transactions.length,
            valid: validCount,
            errors: transactions.filter(t => !t.isValid).length,
            duplicates: 0
        });
        setStep("result");
        setImporting(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) {
            setFile(droppedFile);
            parseFile(droppedFile);
        }
    };

    const resetImport = () => {
        setFile(null);
        setFileType("");
        setTransactions([]);
        setResult(null);
        setStep("upload");
    };

    const removeTransaction = (id: string) => {
        setTransactions(prev => prev.filter(t => t.id !== id));
    };

    return (
        <>
            <Head>
                <title>Import Relevés Bancaires - SEKA</title>
            </Head>

            <div className="min-h-screen bg-gray-50 pt-14">
                <main className="p-6">
                    <div className="max-w-5xl mx-auto">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                                    <Upload className="h-7 w-7 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">Import de Relevés Bancaires</h1>
                                    <p className="text-sm text-gray-500">Importez vos relevés CSV ou OFX</p>
                                </div>
                            </div>
                            {step !== "upload" && (
                                <button onClick={resetImport} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900">
                                    <RefreshCw className="h-4 w-4" />
                                    Nouvel import
                                </button>
                            )}
                        </div>

                        {/* Progress Steps */}
                        <div className="flex items-center gap-4 mb-8">
                            {["upload", "preview", "result"].map((s, idx) => (
                                <div key={s} className="flex items-center gap-2">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step === s ? "bg-blue-600 text-white" :
                                            ["preview", "result"].indexOf(step) > idx ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"
                                        }`}>
                                        {["preview", "result"].indexOf(step) > idx ? <CheckCircle className="h-4 w-4" /> : idx + 1}
                                    </div>
                                    <span className={`text-sm font-medium ${step === s ? "text-blue-600" : "text-gray-500"}`}>
                                        {s === "upload" ? "Téléverser" : s === "preview" ? "Vérifier" : "Résultat"}
                                    </span>
                                    {idx < 2 && <div className="w-16 h-0.5 bg-gray-200" />}
                                </div>
                            ))}
                        </div>

                        {/* Step 1: Upload */}
                        {step === "upload" && (
                            <div className="bg-white rounded-xl border border-gray-200 p-8">
                                <div
                                    onDrop={handleDrop}
                                    onDragOver={e => e.preventDefault()}
                                    className="border-2 border-dashed border-gray-200 rounded-xl p-12 text-center hover:border-blue-400 hover:bg-blue-50/50 transition-all cursor-pointer"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".csv,.ofx,.qfx"
                                        onChange={handleFileSelect}
                                        className="hidden"
                                    />
                                    {parsing ? (
                                        <div className="flex flex-col items-center">
                                            <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
                                            <p className="text-gray-900 font-medium">Analyse du fichier en cours...</p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                                                <Upload className="h-8 w-8 text-blue-600" />
                                            </div>
                                            <p className="text-gray-900 font-medium mb-2">Glissez-déposez votre fichier ici</p>
                                            <p className="text-sm text-gray-500 mb-4">ou cliquez pour sélectionner</p>
                                            <div className="flex items-center justify-center gap-4">
                                                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
                                                    <FileSpreadsheet className="h-4 w-4 text-green-600" />
                                                    <span className="text-sm text-gray-700">CSV</span>
                                                </div>
                                                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
                                                    <FileText className="h-4 w-4 text-blue-600" />
                                                    <span className="text-sm text-gray-700">OFX / QFX</span>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Configuration */}
                                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Compte bancaire</label>
                                        <select
                                            value={bankAccount}
                                            onChange={e => setBankAccount(e.target.value)}
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">Sélectionner un compte...</option>
                                            <option value="main">Compte courant principal</option>
                                            <option value="savings">Compte épargne</option>
                                            <option value="usd">Compte USD</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Format de date</label>
                                        <select
                                            value={dateFormat}
                                            onChange={e => setDateFormat(e.target.value)}
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="DD/MM/YYYY">DD/MM/YYYY (ex: 31/12/2024)</option>
                                            <option value="MM/DD/YYYY">MM/DD/YYYY (ex: 12/31/2024)</option>
                                            <option value="YYYY-MM-DD">YYYY-MM-DD (ex: 2024-12-31)</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Download templates */}
                                <div className="mt-8 pt-6 border-t border-gray-100">
                                    <p className="text-sm font-medium text-gray-700 mb-3">Télécharger un modèle</p>
                                    <div className="flex gap-3">
                                        <a href="#" className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm">
                                            <Download className="h-4 w-4" />
                                            Modèle CSV
                                        </a>
                                        <a href="#" className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm">
                                            <Download className="h-4 w-4" />
                                            Documentation OFX
                                        </a>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Preview */}
                        {step === "preview" && (
                            <div className="space-y-6">
                                {/* File info */}
                                <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-100 rounded-lg">
                                            {fileType === "csv" ? <FileSpreadsheet className="h-5 w-5 text-green-600" /> : <FileText className="h-5 w-5 text-blue-600" />}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{file?.name}</p>
                                            <p className="text-sm text-gray-500">{transactions.length} transactions détectées</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2 text-sm">
                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                            <span className="text-green-700">{transactions.filter(t => t.isValid).length} valides</span>
                                        </div>
                                        {transactions.filter(t => !t.isValid).length > 0 && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <AlertCircle className="h-4 w-4 text-red-500" />
                                                <span className="text-red-700">{transactions.filter(t => !t.isValid).length} erreurs</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Transactions table */}
                                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 border-b border-gray-200">
                                            <tr>
                                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Description</th>
                                                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Montant</th>
                                                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Statut</th>
                                                <th className="px-4 py-3"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {transactions.map((tx) => (
                                                <tr key={tx.id} className={`hover:bg-gray-50 ${!tx.isValid ? "bg-red-50" : ""}`}>
                                                    <td className="px-4 py-3 text-sm text-gray-600">
                                                        {tx.isValid ? new Date(tx.date).toLocaleDateString() : tx.date}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <p className="text-sm font-medium text-gray-900">{tx.description}</p>
                                                        {tx.reference && <p className="text-xs text-gray-500">Réf: {tx.reference}</p>}
                                                    </td>
                                                    <td className={`px-4 py-3 text-sm font-semibold text-right ${tx.type === "credit" ? "text-green-600" : "text-red-600"}`}>
                                                        {tx.type === "credit" ? "+" : "-"}{formatCurrency(tx.amount)}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        {tx.isValid ? (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                                                                <CheckCircle className="h-3 w-3" />
                                                                Valide
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded-full" title={tx.error}>
                                                                <AlertCircle className="h-3 w-3" />
                                                                Erreur
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <button onClick={() => removeTransaction(tx.id)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-red-600">
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center justify-between">
                                    <button onClick={resetImport} className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">
                                        Annuler
                                    </button>
                                    <button
                                        onClick={handleImport}
                                        disabled={importing || transactions.filter(t => t.isValid).length === 0}
                                        className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        {importing ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Import en cours...
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="h-4 w-4" />
                                                Importer {transactions.filter(t => t.isValid).length} transactions
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Result */}
                        {step === "result" && result && (
                            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                                    <CheckCircle className="h-10 w-10 text-green-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">Import réussi !</h2>
                                <p className="text-gray-500 mb-8">Vos transactions ont été importées avec succès</p>

                                <div className="grid grid-cols-4 gap-4 max-w-2xl mx-auto mb-8">
                                    <div className="p-4 bg-gray-50 rounded-lg">
                                        <p className="text-2xl font-bold text-gray-900">{result.total}</p>
                                        <p className="text-sm text-gray-500">Total</p>
                                    </div>
                                    <div className="p-4 bg-green-50 rounded-lg">
                                        <p className="text-2xl font-bold text-green-600">{result.valid}</p>
                                        <p className="text-sm text-green-700">Importées</p>
                                    </div>
                                    <div className="p-4 bg-red-50 rounded-lg">
                                        <p className="text-2xl font-bold text-red-600">{result.errors}</p>
                                        <p className="text-sm text-red-700">Erreurs</p>
                                    </div>
                                    <div className="p-4 bg-yellow-50 rounded-lg">
                                        <p className="text-2xl font-bold text-yellow-600">{result.duplicates}</p>
                                        <p className="text-sm text-yellow-700">Doublons</p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-center gap-4">
                                    <button onClick={resetImport} className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">
                                        Nouvel import
                                    </button>
                                    <a href="/accounting/bank-reconciliation" className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                        Voir le rapprochement
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </>
    );
}
